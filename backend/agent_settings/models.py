import logging

from django.db import models
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from core.managers import OrganizationManagerMixin
from hebo_organizations.models import Organization
from versions.models import Version, initial_version_created

logger = logging.getLogger(__name__)


class AgentSettingManager(OrganizationManagerMixin, models.Manager):
    pass


class LLMAdapter(models.Model):
    class ModelType(models.TextChoices):
        CHAT = "chat", "Chat"
        EMBEDDING = "embedding", "Embedding"

    class ProviderType(models.TextChoices):
        ANTHROPIC = "anthropic", "Anthropic"
        OPENAI = "openai", "OpenAI"
        AZURE = "azure", "Azure"
        BEDROCK = "bedrock", "AWS Bedrock"
        VERTEX = "vertex-ai", "Vertex AI"
        VOYAGE = "voyage", "Voyage"

    is_default = models.BooleanField(
        default=False,
        help_text=_("If True, this adapter is available to all organizations"),
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="llm_adapters",
        help_text=_("Organization this adapter belongs to (null if default)"),
    )
    model_type = models.CharField(
        max_length=20,
        choices=ModelType.choices,
        help_text=_("Type of model (chat, embedding, or vision)"),
        default=ModelType.CHAT,
    )
    provider = models.CharField(
        max_length=20,
        choices=ProviderType.choices,
        help_text=_("AI provider for this model"),
    )
    api_base = models.URLField(
        blank=True,
        help_text=_("Base URL for API calls (if different from provider default)"),
    )
    name = models.CharField(
        max_length=150,
        help_text=_("Name/ID of the model from the provider"),
    )
    aws_region = models.CharField(
        max_length=50,
        blank=True,
        help_text=_("AWS region (required for Bedrock)"),
    )
    api_key = models.CharField(
        max_length=2000,
        blank=True,
        help_text=_(
            "API key, service account JSON, or other authentication credentials"
        ),
    )
    aws_access_key_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_("AWS Access Key ID (required for Bedrock)"),
    )
    aws_secret_access_key = models.CharField(
        max_length=200,
        blank=True,
        help_text=_("AWS Secret Access Key (required for Bedrock)"),
    )

    class Meta:
        indexes = [
            models.Index(fields=["organization", "model_type"]),
            models.Index(fields=["is_default", "model_type"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(is_default=True, organization__isnull=True)
                    | models.Q(is_default=False, organization__isnull=False)
                ),
                name="organization_xor_default",
            )
        ]

    def clean(self):
        if self.is_default and self.organization:
            raise ValidationError(
                _("Default adapters cannot be associated with an organization")
            )
        if not self.is_default and not self.organization:
            raise ValidationError(
                _("Custom adapters must be associated with an organization")
            )
        if self.provider == self.ProviderType.BEDROCK and (
            not self.aws_region
            or not self.aws_access_key_id
            or not self.aws_secret_access_key
        ):
            raise ValidationError(
                _(
                    "AWS region, access key ID, and secret access key are required for Bedrock provider"
                )
            )
        if self.provider != self.ProviderType.BEDROCK and not self.api_key:
            raise ValidationError(_("API key is required for non-Bedrock providers"))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_provider_display()} - {'Default' if self.is_default else 'Custom'})"  # type: ignore


class AgentSetting(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="agent_settings",
        help_text=_("Organization this agent belongs to"),
    )
    version = models.OneToOneField(
        Version,
        on_delete=models.CASCADE,
        related_name="agent_settings",
        help_text=_("The version these settings belong to"),
        unique=True,
    )
    core_llm = models.ForeignKey(
        LLMAdapter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="core_llm_settings",
        limit_choices_to={"model_type": LLMAdapter.ModelType.CHAT},
    )
    condense_llm = models.ForeignKey(
        LLMAdapter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="condense_llm_settings",
        limit_choices_to={"model_type": LLMAdapter.ModelType.CHAT},
    )
    embeddings = models.ForeignKey(
        LLMAdapter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="embedding_settings",
        limit_choices_to={"model_type": LLMAdapter.ModelType.EMBEDDING},
    )
    vision_llm = models.ForeignKey(
        LLMAdapter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="vision_llm_settings",
        limit_choices_to={"model_type": LLMAdapter.ModelType.CHAT},
    )
    delay = models.BooleanField(default=False)
    hide_tool_messages = models.BooleanField(default=False)
    include_last_24h_history = models.BooleanField(default=False)

    objects = AgentSettingManager()

    class Meta:
        indexes = [
            models.Index(fields=["version"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["version"], name="unique_version_settings")
        ]

    def clean(self):
        super().clean()
        # Validate that the organization has access to the selected adapters
        for field in [
            self.core_llm,
            self.condense_llm,
            self.embeddings,
            self.vision_llm,
        ]:
            if (
                field
                and not field.is_default
                and field.organization != self.organization
            ):
                raise ValidationError(
                    _(
                        f"Selected adapter {field.name} is not available for this organization"
                    )
                )

    def save(self, *args, **kwargs):
        # Check if this is an update (existing instance)
        is_update = self.pk is not None

        # Allow bypassing version check if explicitly specified
        skip_version_check = kwargs.pop("skip_version_check", False)

        # Detect embedding model change if this is an update
        if is_update:
            embeddings_changed = False
            try:
                # Get the current state from database
                current = AgentSetting.objects.get(pk=self.pk)

                # Check if embeddings model has changed
                if current.embeddings != self.embeddings:
                    embeddings_changed = True
            except AgentSetting.DoesNotExist:
                # This shouldn't happen since we're checking for self.pk
                pass

        # Check version status if needed
        if is_update and not skip_version_check:
            # Only allow edits if version status is 'next'
            if self.version.status != "next":
                raise IntegrityError(
                    f"Cannot modify agent settings for version with status '{self.version.status}'. "
                    f"Only settings in versions with 'next' status can be modified."
                )

        # Perform basic validation
        self.clean()

        # Save the model
        with transaction.atomic():
            super().save(*args, **kwargs)

            # Regenerate vectors if embedding model has changed
            if is_update and embeddings_changed:
                self.regenerate_vectors()

    def regenerate_vectors(self):
        """
        Regenerates vectors for all parts in all pages of the current version
        when the embedding model changes.
        """
        try:
            # Import here to avoid circular imports
            from knowledge.models import Page, Part

            # Get all pages for this version
            pages = Page.objects.filter(version=self.version)

            # Count total parts for logging
            total_parts = 0
            regenerated_parts = 0

            # Process each page
            for page in pages:
                # Get all parts for this page
                parts = Part.objects.filter(page=page)
                total_parts += parts.count()

                # Regenerate vectors for each part
                for part in parts:
                    try:
                        # Call the generate_vectors method
                        success = part.generate_vectors()
                        if success:
                            regenerated_parts += 1
                    except Exception as e:
                        logger.error(
                            f"Error regenerating vectors for part {part.pk}: {str(e)}"
                        )

            logger.info(
                f"Vector regeneration completed for version {self.version.pk}: "
                f"{regenerated_parts}/{total_parts} parts successfully regenerated"
            )
        except Exception as e:
            logger.error(f"Error in vector regeneration process: {str(e)}")
            # Don't raise the exception - we don't want to roll back the settings change
            # just log the error


class MCPConfigManager(OrganizationManagerMixin, models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("agent_setting__version__agent")


class MCPConfig(models.Model):
    agent_setting = models.ForeignKey(
        AgentSetting,
        on_delete=models.CASCADE,
        related_name="mcp_configs",
        help_text="The agent setting this MCP config belongs to",
    )
    sse_url = models.URLField(
        help_text="The URL of the SSE endpoint of the MCP server",
    )
    sse_token = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="The token for the SSE endpoint",
    )

    objects = MCPConfigManager()

    class Meta:
        indexes = [
            models.Index(fields=["agent_setting"]),
        ]

    def save(self, *args, **kwargs):
        # Allow bypassing version check if explicitly specified
        skip_version_check = kwargs.pop("skip_version_check", False)

        # Check version status if needed
        if not skip_version_check:
            # Only allow edits if version status is 'next'
            if self.agent_setting.version.status != "next":
                raise IntegrityError(
                    f"Cannot modify MCP config for version with status '{self.agent_setting.version.status}'. "
                    f"Only MCP configs in versions with 'next' status can be modified."
                )

        self.clean()
        super().save(*args, **kwargs)


@receiver(initial_version_created)
def create_default_agent_setting(sender, created, agent, version, **kwargs):
    """
    Signal handler to create a default agent setting when a new agent is created.
    """
    if created:
        AgentSetting.objects.create(organization=agent.organization, version=version)
