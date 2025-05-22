import functools
import logging
import re
import requests
import markdown
from hashlib import sha256
from typing import TYPE_CHECKING

from django.apps import apps
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, IntegrityError, transaction
from django.db.models.functions import Lower
from django.utils import timezone
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from pgvector.django import HnswIndex, VectorField

from api_keys.models import APIKey
from agent_settings.models import AgentSetting
from core.managers import OrganizationManagerMixin
from hebo_organizations.models import Organization

if TYPE_CHECKING:
    from django.db.models.manager import RelatedManager

logger = logging.getLogger(__name__)


class ContentHashMixin:
    """Mixin for models that need content hashing functionality."""

    @staticmethod
    def _generate_hash(content: str) -> str:
        """Generate a hash for the given content."""
        return sha256(content.encode()).hexdigest()

    @property
    def content_hash(self) -> str:
        """Get the hash of the current content."""
        return self._generate_hash(self.content)  # type: ignore


class PartGenerationError(Exception):
    """Custom exception for part generation errors."""

    pass


class PageManager(OrganizationManagerMixin, models.Manager):
    pass


class Page(ContentHashMixin, models.Model):
    """
    Model for storing markdown-formatted pages.

    The content field stores markdown text that can be rendered to HTML.
    Supports standard markdown syntax including:
    - Headers (# ## ###)
    - Lists (* - +)
    - Code blocks (``` ```)
    - Links [text](url)
    - Images ![alt](url)
    """

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="pages",
        help_text=_("Organization this agent belongs to"),
    )
    version = models.ForeignKey(
        "versions.Version",
        on_delete=models.CASCADE,
        related_name="pages",
        help_text=_("The version this page belongs to"),
    )

    parts: "RelatedManager[Part]"  # Added for type hinting

    title = models.CharField(max_length=200)
    content = models.TextField(
        help_text="Content in markdown format. Supports standard markdown syntax."
    )

    # Metadata fields
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Add a new attribute to control part generation
    _skip_part_generation = False

    objects = PageManager()

    class Meta:
        ordering = [Lower("title"), "-updated_at"]
        verbose_name = "Page"
        verbose_name_plural = "Pages"
        constraints = [
            models.UniqueConstraint(
                fields=["version"],
                name="unique_page_title_per_version",
                condition=models.Q(title__iexact=models.F("title")),
            )
        ]

    def save(self, *args, **kwargs):
        # Check if the version status allows editing
        skip_version_check = kwargs.pop("skip_version_check", False)

        if not skip_version_check:
            # Only allow edits if version status is 'next'
            if self.version.status != "next":
                raise IntegrityError(
                    f"Cannot modify page for version with status '{self.version.status}'. "
                    f"Only pages in versions with 'next' status can be modified."
                )

        super().save(*args, **kwargs)

        # Only generate parts if not explicitly skipped
        if not self._skip_part_generation:
            self.generate_parts()

        # Reset the flag after save
        self._skip_part_generation = False

    def _process_behaviour_block(self, original_text, global_start):
        """
        Process a behaviour block by trimming blank lines and adjusting line numbers.

        Args:
            original_text: the exact substring from content (may include blank lines)
            global_start: the line number in the full document where original_text begins

        Returns:
            tuple: (adjusted_start, adjusted_end, stripped_content) or None if block is empty
        """
        lines = original_text.splitlines()
        first_idx = None
        last_idx = 0
        for i, line in enumerate(lines):
            if line.strip():
                if first_idx is None:
                    first_idx = i
                last_idx = i
        if first_idx is None:
            return None
        adjusted_start = global_start + first_idx
        adjusted_end = global_start + last_idx
        stripped_content = "\n".join(lines[first_idx : last_idx + 1])
        return adjusted_start, adjusted_end, stripped_content

    def _extract_code_blocks(self, pattern, content_type):
        """
        Extract code blocks (scenario/example) from content.

        Args:
            pattern: regex pattern to match the blocks
            content_type: ContentType enum value

        Returns:
            list: List of dictionaries containing block information
        """
        blocks = []
        for match in re.finditer(pattern, self.content, re.DOTALL):
            start_pos = match.start()
            start_line = self.content[:start_pos].count("\n")
            block_text = match.group(0)
            end_line = start_line + block_text.count("\n")
            block_content = match.group(1)
            blocks.append(
                {
                    "content": block_content,
                    "start_line": start_line,
                    "end_line": end_line,
                    "content_hash": self._generate_hash(block_content),
                    "content_type": content_type,
                }
            )
        return blocks

    def _process_behaviour_blocks(self, all_block_matches):
        """
        Process behaviour blocks between code blocks.

        Args:
            all_block_matches: List of all matched code blocks

        Returns:
            list: List of dictionaries containing behaviour block information
        """
        behaviour_blocks = []

        # Process content before first block
        if all_block_matches:
            start_index = 0
            end_index = all_block_matches[0].start()
            original_text = self.content[start_index:end_index]
            processed = self._process_behaviour_block(original_text, 0)
            if processed:
                adj_start, adj_end, stripped_content = processed
                behaviour_blocks.append(
                    {
                        "content": stripped_content,
                        "start_line": adj_start,
                        "end_line": adj_end,
                        "content_hash": self._generate_hash(stripped_content),
                        "content_type": ContentType.BEHAVIOUR,
                    }
                )
        else:
            # If no blocks, entire content is behaviour
            processed = self._process_behaviour_block(self.content, 0)
            if processed:
                adj_start, adj_end, stripped_content = processed
                behaviour_blocks.append(
                    {
                        "content": stripped_content,
                        "start_line": adj_start,
                        "end_line": adj_end,
                        "content_hash": self._generate_hash(stripped_content),
                        "content_type": ContentType.BEHAVIOUR,
                    }
                )

        # Process content between blocks
        for i in range(len(all_block_matches) - 1):
            start_index = all_block_matches[i].end()
            end_index = all_block_matches[i + 1].start()
            original_text = self.content[start_index:end_index]
            global_start = self.content[:start_index].count("\n")
            processed = self._process_behaviour_block(original_text, global_start)
            if processed:
                adj_start, adj_end, stripped_content = processed
                behaviour_blocks.append(
                    {
                        "content": stripped_content,
                        "start_line": adj_start,
                        "end_line": adj_end,
                        "content_hash": self._generate_hash(stripped_content),
                        "content_type": ContentType.BEHAVIOUR,
                    }
                )

        # Process content after last block
        if all_block_matches:
            start_index = all_block_matches[-1].end()
            end_index = len(self.content)
            original_text = self.content[start_index:end_index]
            global_start = self.content[:start_index].count("\n")
            processed = self._process_behaviour_block(original_text, global_start)
            if processed:
                adj_start, adj_end, stripped_content = processed
                behaviour_blocks.append(
                    {
                        "content": stripped_content,
                        "start_line": adj_start,
                        "end_line": adj_end,
                        "content_hash": self._generate_hash(stripped_content),
                        "content_type": ContentType.BEHAVIOUR,
                    }
                )

        return behaviour_blocks

    def _update_parts(self, all_blocks):
        """
        Update or create parts based on the extracted blocks.

        Args:
            all_blocks: List of all blocks (behaviour, scenario, example)
        """
        new_part_hashes = {block["content_hash"] for block in all_blocks}

        # Delete existing parts not in new set
        # This is safe to do (i.e. we don't invalidate old versions), because we
        # only delete parts when the version is in 'next' status.
        if self.pk:
            self.parts.exclude(content_hash__in=new_part_hashes).delete()

        # Create or update parts
        for block in all_blocks:
            if block["end_line"] < block["start_line"]:
                logger.warning(
                    f"Invalid line numbers detected: start_line={block['start_line']}, "
                    f"end_line={block['end_line']} - adjusting"
                )
                block["end_line"] = block["start_line"] + 1

            self.parts.update_or_create(
                content_hash=block["content_hash"],
                defaults={
                    "start_line": block["start_line"],
                    "end_line": block["end_line"],
                    "content_type": block["content_type"],
                },
            )

    def generate_parts(self):
        """
        Generates parts from page content based on content type:
        - Behaviour: Text blocks between scenario and example blocks
        - Scenario: Content inside ```scenario blocks
        - Example: Content inside ```example blocks
        """
        if self._skip_part_generation:
            return

        try:
            # Define patterns for code blocks
            scenario_pattern = r"```\s*scena(?:r)?io\s*\n(.*?)\n\s*```"
            example_pattern = r"```\s*example\s*\n(.*?)\n\s*```"

            # Extract code blocks
            scenario_blocks = self._extract_code_blocks(
                scenario_pattern, ContentType.SCENARIO
            )
            example_blocks = self._extract_code_blocks(
                example_pattern, ContentType.EXAMPLE
            )

            # Get all blocks sorted by position
            all_block_matches = sorted(
                re.finditer(
                    f"({scenario_pattern})|({example_pattern})", self.content, re.DOTALL
                ),
                key=lambda m: m.start(),
            )

            # Process behaviour blocks
            behaviour_blocks = self._process_behaviour_blocks(all_block_matches)

            # Combine all blocks
            all_blocks = behaviour_blocks + scenario_blocks + example_blocks
            logger.info(
                f"Total blocks: {len(all_blocks)} (behaviour: {len(behaviour_blocks)}, "
                f"scenario: {len(scenario_blocks)}, example: {len(example_blocks)})"
            )

            # Update parts in database
            self._update_parts(all_blocks)

            logger.info(f"Part generation completed successfully for page {self.pk}")

        except Exception as e:
            logger.error(f"Part generation failed for page {self.pk}: {str(e)}")
            raise PartGenerationError(f"Failed to generate parts: {str(e)}") from e

    def get_html_content(self):
        """
        Renders the markdown content to safe HTML.

        Returns:
            SafeString: HTML-rendered content, safe for template rendering
        """
        md = markdown.Markdown(
            extensions=[
                "extra",  # Tables, footnotes, attribute lists, etc.
                "codehilite",  # Code block syntax highlighting
                "fenced_code",  # Fenced code blocks
                "toc",  # Table of contents
                "tables",  # Tables support
            ]
        )
        return mark_safe(md.convert(self.content))

    @property
    def word_count(self):
        """
        Returns the approximate word count of the markdown content.

        Returns:
            int: Number of words in the content
        """
        return len(self.content.split())


class ContentType(models.TextChoices):
    """Available part types for content sections."""

    BEHAVIOUR = "behaviour", "Behaviour"
    SCENARIO = "scenario", "Scenario"
    EXAMPLE = "example", "Example"


class PartManager(OrganizationManagerMixin, models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("page__organization")


class Part(models.Model):
    """
    Represents an automatically extracted section from a page's content.
    Parts are identified through specific markdown formatting and processed
    via background tasks. Each part maintains a reference to its original
    content location and tracks content validity.
    """

    page = models.ForeignKey("Page", on_delete=models.CASCADE, related_name="parts")

    # Content reference
    start_line = models.PositiveIntegerField(
        help_text="Starting line number in the original content"
    )
    end_line = models.PositiveIntegerField(
        help_text="Ending line number in the original content"
    )
    content_hash = models.CharField(
        max_length=64,
        help_text="Hash of the original content section for tracking changes",
    )
    # Part metadata
    content_type = models.CharField(
        max_length=20, choices=ContentType.choices, db_index=True
    )

    is_handover = models.BooleanField(
        default=False,
        help_text="Special tag for downstream processing (valid only for scenarios and examples)",
    )

    # Tracking
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PartManager()

    class Meta:
        ordering = ["start_line"]
        constraints = [
            models.UniqueConstraint(
                fields=["page", "start_line"],
                name="unique_part_per_page",
            )
        ]

        # TODO: review these based on how the proxy is querying
        indexes = [
            models.Index(fields=["page", "content_type"]),
            models.Index(fields=["page", "content_hash"]),
        ]

    def clean(self):
        if self.is_handover and self.content_type == ContentType.BEHAVIOUR:
            raise ValidationError(
                {
                    "is_handover": "Handover tag can only be applied to scenarios and examples"
                }
            )
        if self.end_line < self.start_line:
            raise ValidationError(
                {"end_line": "End line must be greater than start line"}
            )

    def save(self, *args, **kwargs):
        # Store the original hash if this is an existing part
        if self.pk:
            try:
                original_hash = Part.objects.get(pk=self.pk).content_hash
            except Part.DoesNotExist:
                original_hash = None
        else:
            original_hash = None

        self.full_clean()
        super().save(*args, **kwargs)

        # Only generate vectors for non-behaviour parts and if:
        # 1. The part has no vector OR
        # 2. The content hash has changed from the previous value (which means the content has changed)
        if self.content_type != ContentType.BEHAVIOUR:
            has_vector = self.vectors.exists()  # type: ignore
            content_changed = original_hash and original_hash != self.content_hash

            if not has_vector or content_changed:
                # Use background task for vector generation
                transaction.on_commit(lambda: self.generate_vectors_async())

    def generate_vectors_async(self):
        """Asynchronous version that doesn't block the main thread"""
        try:
            executor = apps.get_app_config("knowledge").vector_executor  # type: ignore
            if executor is None:
                logger.error("Vector executor not initialized")
                return
            future = executor.submit(self.generate_vectors)
            future.add_done_callback(
                functools.partial(self._handle_vector_generation_complete)
            )
        except Exception as e:
            logger.error(f"Failed to submit vector generation task: {str(e)}")

    def _handle_vector_generation_complete(self, future):
        """Handle completion of vector generation"""
        try:
            future.result()  # This will raise any exceptions that occurred
        except Exception as e:
            logger.error(f"Vector generation failed for part {self.pk}: {str(e)}")

    def generate_vectors(self):
        """
        Generates vectors for the part by:
        1. Formatting the content based on the content type
        2. Fetching API credentials
        3. Retrieving agent version from slugs
        4. Getting embedding model from agent settings
        5. Calling the proxy service with retries and error handling
        """
        with requests.Session() as session:
            try:
                # Step 1: Format the content based on the content type
                # Get the raw content from the page
                if self.start_line is None or self.end_line is None:
                    logger.warning(f"Part {self.pk} has invalid line numbers")
                    return

                # Extract content from the page content using line numbers
                content_lines = self.page.content.splitlines()[
                    self.start_line : self.end_line + 1
                ]
                raw_content = "\n".join(content_lines)

                # Remove backtick code blocks (```example``` or ```scenario```)
                formatted_content = re.sub(
                    r"```\s*(?:example|scenario)\s*\n|\n\s*```", "", raw_content
                )

                # Wrap examples in <example> tags if needed
                if self.content_type == ContentType.EXAMPLE:
                    # TODO: the <example> tags should depend on the core llm used.
                    formatted_content = f"<example>\n{formatted_content}\n</example>"

                # Step 2: Get API key for the organization
                try:
                    api_key = (
                        APIKey.objects.filter(
                            organization=self.page.organization, is_active=True
                        )
                        .order_by("-created_at")
                        .first()
                    )

                    if not api_key:
                        logger.error(
                            f"No active API key found for organization {self.page.organization.id}"
                        )
                        return

                except Exception as e:
                    logger.error(f"Error fetching API key: {str(e)}")
                    return

                # Step 3: Get agent version - use one of the version slugs
                try:
                    # Try to get a version-specific slug first
                    version_slug = self.page.version.slugs.first()
                    if version_slug:
                        agent_version = version_slug.slug
                    else:
                        # Fallback to version name if no slugs are available
                        agent_version = (
                            f"{self.page.version.agent.slug}:{self.page.version.name}"
                        )
                        logger.warning(
                            f"No version slugs found for version {self.page.version.pk}, using fallback: {agent_version}"
                        )
                except Exception as e:
                    # Worst case fallback
                    agent_version = str(self.page.version.pk)
                    logger.error(
                        f"Error getting version slug: {str(e)}, using version ID as fallback"
                    )

                # Step 4: Get embedding model from agent settings
                embedding_model = "ada002"  # Default fallback
                try:
                    agent_setting = AgentSetting.objects.get(version=self.page.version)
                    if agent_setting.embeddings and agent_setting.embeddings.name:
                        # Use the embedding model from settings
                        embedding_model = agent_setting.embeddings.name
                        # Some models might be stored with full names, but we need short names for the API
                        # Map common model names to their short format if needed
                        model_map = {
                            "text-embedding-ada-002": "ada002",
                            "all-MiniLM-L6-v2": "minilm",
                            "all-mpnet-base-v2": "mpnet",
                            "bge-large-en": "bger",
                            "voyage-multimodal-3": "voyage",
                        }
                        embedding_model = model_map.get(
                            embedding_model, embedding_model
                        )
                    else:
                        logger.warning(
                            f"No embedding model configured for version {self.page.version.pk}, using default: {embedding_model}"
                        )
                except AgentSetting.DoesNotExist:
                    logger.warning(
                        f"No agent settings found for version {self.page.version.pk}, using default embedding model: {embedding_model}"
                    )
                except Exception as e:
                    logger.error(
                        f"Error retrieving embedding model: {str(e)}, using default: {embedding_model}"
                    )

                # Get content_type as string for metadata
                if isinstance(self.content_type, str):
                    content_type_str = self.content_type
                else:
                    # Assuming it's an enum instance
                    try:
                        content_type_str = self.content_type.value
                    except AttributeError:
                        # Fallback if it's neither string nor has value attribute
                        content_type_str = str(self.content_type)

                # Step 5: Prepare payload for the proxy service
                payload = {
                    "agent_version": agent_version,
                    "part_id": self.pk,
                    "embedding_model": embedding_model,
                    "content": formatted_content,
                    "metadata": {
                        "content_type": content_type_str,
                        "version_id": self.page.version.pk,
                    },
                }

                # Step 6: Call the proxy endpoint
                proxy_url = f"{settings.PROXY_URL}/vector"

                # Use session for the request
                response = session.post(
                    proxy_url,
                    json=payload,
                    headers={
                        "X-API-Key": api_key.key,
                        "Content-Type": "application/json",
                    },
                    timeout=30,
                )

                # Retry once if request fails
                if response.status_code >= 400:
                    logger.warning(
                        f"First attempt to create vector failed with status {response.status_code}: {response.text}"
                    )
                    response = session.post(
                        proxy_url,
                        json=payload,
                        headers={
                            "X-API-Key": api_key.key,
                            "Content-Type": "application/json",
                        },
                        timeout=30,
                    )

                # Check final response
                if response.status_code >= 400:
                    logger.error(
                        f"Failed to create vector after retry. Status: {response.status_code}, "
                        f"Response: {response.text}"
                    )
                    return

                logger.info(f"Successfully created vector for part {self.pk}")

            except requests.exceptions.Timeout:
                logger.error(f"Timeout while calling vector service for part {self.pk}")
                return
            except Exception as e:
                logger.error(f"Error calling vector service: {str(e)}")
                return

        return True

    def __str__(self):
        return f"{self.content_type}: {self.start_line} - {self.end_line} ({self.page.title})"


class VectorManager(OrganizationManagerMixin, models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("part__page__organization")


class VectorStore(models.Model):
    """
    Stores vector embeddings for Page Parts using pgvector.
    The vector dimensions vary by embedding model:
    - ada002: 1536 dimensions
    - minilm: 384 dimensions
    - mpnet: 768 dimensions
    - bge-large-en: 1024 dimensions
    - voyage-multimodal-3: 1024 dimensions
    """

    class EmbeddingModel(models.TextChoices):
        ADA_002 = "ada002", "text-embedding-ada-002"  # 1536 dims
        MINILM = "minilm", "all-MiniLM-L6-v2"  # 384 dims
        MPNET = "mpnet", "all-mpnet-base-v2"  # 768 dims
        BGER = "bger", "bge-large-en"  # 1024 dims
        VOYAGE = "voyage", "voyage-multimodal-3"  # 1024 dims

    DIMENSION_MAP = {
        EmbeddingModel.ADA_002: 1536,
        EmbeddingModel.MINILM: 384,
        EmbeddingModel.MPNET: 768,
        EmbeddingModel.BGER: 1024,
        EmbeddingModel.VOYAGE: 1024,
    }

    part = models.ForeignKey("Part", on_delete=models.CASCADE, related_name="vectors")

    content = models.TextField(help_text="The content that was embedded")

    embedding_model = models.CharField(
        max_length=20,
        choices=EmbeddingModel.choices,
        help_text="Must match the embedding model in agent settings",
    )

    # TODO: Add support for other embeddings providers
    vector_1536 = VectorField(
        dimensions=1536, null=True, blank=True
    )  # Max dimensions (ada-002)
    vector_1024 = VectorField(
        dimensions=1024, null=True, blank=True
    )  # Dimensions for other models

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict)
    objects = VectorManager()

    class Meta:
        indexes = [
            models.Index(fields=["id"]),
            HnswIndex(
                name="vector_1536_index",
                fields=["vector_1536"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
            HnswIndex(
                name="vector_1024_index",
                fields=["vector_1024"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["part"],
                name="unique_vector_per_part",
            )
        ]

    def clean(self):
        try:
            agent_settings = AgentSetting.objects.get(version=self.part.page.version)
        except AgentSetting.DoesNotExist:
            raise ValidationError(
                "Cannot validate embedding model - no agent settings found"
            )

        # Convert string to enum value before validation
        embedding_model = self.EmbeddingModel(self.embedding_model)
        if embedding_model.value != agent_settings.embeddings:
            raise ValidationError(
                {
                    "embedding_model": f"Embedding model must match agent settings ({agent_settings.embeddings})"
                }
            )

        # Use enum value to access DIMENSION_MAP
        expected_dims = self.DIMENSION_MAP[embedding_model]

        # Determine which vector field to use based on dimensions
        if expected_dims == 1536:
            vector_field = self.vector_1536
            field_name = "vector_1536"
        else:
            vector_field = self.vector_1024
            field_name = "vector_1024"

        # Validate that the appropriate vector field is not null
        if vector_field is None:
            raise ValidationError(
                {
                    field_name: f"Vector field {field_name} must not be null for embedding model {self.embedding_model}"
                }
            )

        # Validate vector dimensions if present
        if vector_field is not None and len(vector_field) != expected_dims:
            raise ValidationError(
                {
                    field_name: f"Vector must have {expected_dims} dimensions for {self.embedding_model}"
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vector for {self.part} using {self.embedding_model}"
