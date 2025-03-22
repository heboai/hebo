import uuid
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver, Signal
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.core.validators import RegexValidator
from django.db import transaction
from typing import Optional

from core.managers import OrganizationManagerMixin
from hebo_organizations.models import Organization


initial_version_created = Signal()


class AgentManager(OrganizationManagerMixin, models.Manager):
    pass


class Agent(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="agents",
        help_text=_("Organization this agent belongs to"),
    )
    name = models.CharField(
        max_length=255,
        help_text=_("Name of the agent"),
    )
    slug = models.SlugField(
        max_length=255,
        help_text=_("Primary slug of the agent"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = AgentManager()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name", "created_at"],
                name="unique_agent_name_timestamp_per_organization",
            )
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_name = None if is_new else Agent.objects.get(pk=self.pk).name

        if not self.slug or (not is_new and old_name != self.name):
            # Generate the new slug from the name
            new_slug = slugify(self.name)

            # Check if the slug exists
            if (
                AgentSlug.objects.filter(slug=new_slug)
                .exclude(agent=self if not is_new else None)
                .exists()
            ):
                # Get all similar slugs
                similar_slugs = AgentSlug.objects.filter(
                    slug__startswith=new_slug
                ).values_list("slug", flat=True)

                # Find the next available number
                counter = 1
                while f"{new_slug}-{counter}" in similar_slugs:
                    counter += 1

                # Append the number to make the slug unique
                new_slug = f"{new_slug}-{counter}"

            self.slug = new_slug  # Set primary slug

        super().save(*args, **kwargs)

        # Create new AgentSlug if this is a new agent or name changed
        if is_new or (old_name and old_name != self.name):
            AgentSlug.objects.get_or_create(agent=self, slug=self.slug)
            self._update_version_slugs()

    def _update_version_slugs(self):
        """
        Update version slugs for all agent slugs
        """
        agent_slugs = self.slugs.values_list("slug", flat=True)  # type: ignore

        for version in self.versions.all():  # type: ignore
            # Create version-specific slugs for all agent slugs
            for agent_slug in agent_slugs:
                VersionSlug.objects.get_or_create(
                    version=version, slug=f"{agent_slug}:{version.name}"
                )

            # Handle status-specific slugs
            if version.status == Version.Status.CURRENT:
                for agent_slug in agent_slugs:
                    for status_slug in [
                        f"{agent_slug}:current",
                        f"{agent_slug}:latest",
                        agent_slug,
                    ]:
                        VersionSlug.objects.get_or_create(
                            version=version, slug=status_slug
                        )
            elif version.status == Version.Status.NEXT:
                for agent_slug in agent_slugs:
                    VersionSlug.objects.get_or_create(
                        version=version, slug=f"{agent_slug}:next"
                    )


class AgentSlug(models.Model):
    """New model to track all slugs for an agent"""

    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name="slugs",
        help_text=_("The agent this slug belongs to"),
    )
    slug = models.SlugField(
        max_length=255,
        help_text=_("Slug for accessing this agent"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["agent", "slug"],
                name="unique_agent_slug_per_organization",
            )
        ]

    def clean(self):
        """Ensure slug uniqueness within organization"""
        super().clean()
        if (
            AgentSlug.objects.filter(
                agent__organization=self.agent.organization, slug=self.slug
            )
            .exclude(agent=self.agent)
            .exists()
        ):
            raise ValidationError(
                _("This slug is already in use within this organization.")
            )

    def __str__(self):
        return self.slug


class VersionManager(OrganizationManagerMixin, models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("agent__organization")

    def current(self):
        return self.filter(status="CURRENT").first()


class Version(models.Model):
    class Status(models.TextChoices):
        CURRENT = "current", _("Current")
        NEXT = "next", _("Next")
        PAST = "past", _("Past")

    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name="versions",
        help_text=_("The agent this version belongs to"),
    )
    name = models.CharField(
        max_length=255,
        help_text=_('Version name (must be in format "v1", "v2", etc.)'),
        validators=[
            RegexValidator(
                regex=r"^v[1-9]\d*$",
                message=_(
                    'Version name must be in format "v" followed by a positive integer (e.g. "v1", "v2")'
                ),
                code="invalid_version_name",
            )
        ],
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CURRENT,
        help_text=_("Status of this version"),
    )
    url_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        help_text=_("Unique identifier for public access URL"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = VersionManager()

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["agent", "name"], name="unique_version_name_per_agent"
            ),
            models.UniqueConstraint(
                fields=["agent", "status"],
                condition=models.Q(status="current"),
                name="unique_current_version_per_agent",
            ),
            models.UniqueConstraint(
                fields=["agent", "status"],
                condition=models.Q(status="next"),
                name="unique_next_version_per_agent",
            ),
        ]

    def __str__(self):
        return f"{self.agent.name} - {self.name}"

    def get_public_url(self):
        """
        Returns the public URL for this version
        """
        return reverse("version-public-chat", kwargs={"url_id": self.url_id})

    def get_absolute_url(self):
        """
        Returns the authenticated URL for this version
        """
        return reverse("version-detail", kwargs={"pk": self.pk})

    def clean(self):
        super().clean()
        if not self.pk:  # New version
            if self.status != self.Status.NEXT:
                raise ValidationError(
                    _("New versions must be created with 'next' status.")
                )
        else:  # Existing version
            old_instance = Version.objects.get(pk=self.pk)
            old_status = old_instance.status
            new_status = self.status

            # Define allowed transitions
            if old_status == self.Status.NEXT:
                if new_status not in [self.Status.NEXT, self.Status.CURRENT]:
                    raise ValidationError(
                        _(
                            "A 'next' version can only remain 'next' or become 'current'."
                        )
                    )
            elif old_status == self.Status.CURRENT:
                if new_status not in [self.Status.CURRENT, self.Status.PAST]:
                    raise ValidationError(
                        _(
                            "A 'current' version can only remain 'current' or become 'past'."
                        )
                    )
            elif old_status == self.Status.PAST:
                if new_status not in [self.Status.PAST, self.Status.CURRENT]:
                    raise ValidationError(
                        _(
                            "A 'past' version can only remain 'past' or become 'current'."
                        )
                    )

        # Check uniqueness constraints
        if self.status in [self.Status.CURRENT, self.Status.NEXT]:
            existing = (
                Version.objects.filter(agent=self.agent, status=self.status)
                .exclude(pk=self.pk)
                .first()
            )

            if existing:
                if self.status == self.Status.CURRENT:
                    # Auto-transition existing current version to past
                    existing.status = self.Status.PAST
                    existing.save()
                else:
                    raise ValidationError(
                        _(
                            f"There can only be one {self.status.lower()} version per agent."
                        )
                    )

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None if is_new else Version.objects.get(pk=self.pk).status

        self.full_clean()
        super().save(*args, **kwargs)

        # Update slugs
        self._update_slugs(is_new, old_status)

    def _update_slugs(self, is_new, old_status):
        """Update slugs based on version status"""
        agent_slugs = self.agent.slugs.values_list("slug", flat=True)  # type: ignore

        # Always ensure version-specific slugs exist for all agent slugs
        for agent_slug in agent_slugs:
            VersionSlug.objects.get_or_create(
                version=self, slug=f"{agent_slug}:{self.name}"
            )

        # Clean up old status-specific slugs if status changed
        if not is_new and old_status != self.status:
            if old_status == self.Status.CURRENT:
                # Remove current/latest slugs
                for agent_slug in agent_slugs:
                    VersionSlug.objects.filter(
                        version=self,
                        slug__in=[
                            f"{agent_slug}:current",
                            f"{agent_slug}:latest",
                            agent_slug,
                        ],
                    ).delete()
            elif old_status == self.Status.NEXT:
                # Remove next slugs for all agent slugs
                for agent_slug in agent_slugs:
                    VersionSlug.objects.filter(
                        version=self, slug=f"{agent_slug}:next"
                    ).delete()

        # Handle status-specific slugs for new status
        if self.status == self.Status.CURRENT:
            # Add current/latest slugs for all agent slugs
            for agent_slug in agent_slugs:
                for slug in [
                    f"{agent_slug}:current",
                    f"{agent_slug}:latest",
                    agent_slug,
                ]:
                    VersionSlug.objects.get_or_create(version=self, slug=slug)

        elif self.status == self.Status.NEXT:
            # Add next slug for all agent slugs
            for agent_slug in agent_slugs:
                VersionSlug.objects.get_or_create(
                    version=self, slug=f"{agent_slug}:next"
                )

    def duplicate_from(self, source_version: Optional["Version"] = None) -> None:
        """
        Duplicates related models from source version to this version.
        If source_version is None, tries to find the current version of the same agent.
        """
        if not source_version:
            source_version = Version.objects.filter(
                agent=self.agent, status=self.Status.CURRENT
            ).first()

        if not source_version:
            return

        # Initialize page mapping dictionary
        self._page_mapping = {}

        # Duplicate agent settings with their tools
        self._duplicate_agent_settings(source_version)

        # Duplicate pages with their parts and vectors
        self._duplicate_pages(source_version)

    def _duplicate_agent_settings(self, source_version: "Version") -> None:
        """Helper method to duplicate agent settings and tools."""
        from agent_settings.models import AgentSetting

        with transaction.atomic():
            # Copy agent settings
            old_settings = source_version.agent_settings  # type: ignore
            new_settings = AgentSetting.objects.create(
                organization=self.agent.organization,
                version=self,
                core_llm=old_settings.core_llm,
                condense_llm=old_settings.condense_llm,
                embeddings=old_settings.embeddings,
                vision_llm=old_settings.vision_llm,
                delay=old_settings.delay,
                hide_tool_messages=old_settings.hide_tool_messages,
                include_last_24h_history=old_settings.include_last_24h_history,
            )

            # Copy associated MCP configs
            for mcp_config in old_settings.mcp_configs.all():
                mcp_config.pk = None  # This will create a new instance
                mcp_config.agent_setting = new_settings
                mcp_config.save()

    def _duplicate_pages(self, source_version: "Version") -> None:
        """Helper method to duplicate pages, parts, and vectors."""
        from knowledge.models import Page

        with transaction.atomic():
            for old_page in source_version.pages.all():  # type: ignore
                # Skip part generation during cloning
                new_page = Page(
                    organization=self.agent.organization,
                    version=self,
                    title=old_page.title,
                    content=old_page.content,
                    position=old_page.position,
                    parent=None,  # We'll update this after all pages are created
                )

                # TODO: these 2 could be unified
                new_page._skip_part_generation = True
                new_page.save(skip_version_check=True)

                # Store old_id -> new_id mapping for updating parent relationships
                self._page_mapping[old_page.id] = new_page.id  # type: ignore

                # Copy parts and their vectors
                for old_part in old_page.parts.all():
                    new_part = old_part
                    new_part.pk = None
                    new_part.page = new_page
                    new_part.save()

                    # Copy vectors
                    for old_vector in old_part.vectors.all():
                        old_vector.pk = None
                        old_vector.part = new_part
                        old_vector.save()

            # Update parent relationships for pages
            for old_page in source_version.pages.filter(parent__isnull=False):  # type: ignore
                new_page_id = self._page_mapping[old_page.id]
                new_parent_id = self._page_mapping[old_page.parent_id]
                Page.objects.filter(id=new_page_id).update(parent_id=new_parent_id)


class VersionSlug(models.Model):
    version = models.ForeignKey(
        Version,
        on_delete=models.CASCADE,
        related_name="slugs",
        help_text=_("The version this slug belongs to"),
    )
    slug = models.SlugField(
        max_length=511,
        help_text=_("Slug for accessing this version"),
        unique=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["version", "slug"],
                name="unique_version_slug_per_organization",
            )
        ]

    def clean(self):
        """Ensure version-slug uniqueness within organization"""
        super().clean()
        if (
            VersionSlug.objects.filter(
                version__agent__organization=self.version.agent.organization,
                slug=self.slug,
            )
            .exclude(version=self.version)
            .exists()
        ):
            raise ValidationError(
                _("This version slug is already in use within this organization.")
            )

    def __str__(self):
        return self.slug


@receiver(post_save, sender=Agent)
def create_initial_version(sender, instance, created, **kwargs):
    """
    Signal handler to create a first version when a new Agent is created.
    """
    if created:
        version = Version.objects.create(
            agent=instance, name="v1", status=Version.Status.NEXT
        )
        # The initial_version_created signal will trigger creation of default settings
        initial_version_created.send(
            sender=sender, created=True, agent=instance, version=version
        )


@receiver(post_save, sender=Organization)
def create_initial_agent(sender, instance, created, **kwargs):
    """
    Signal handler to create a first agent when a new Organization is created.
    """
    if created:
        Agent.objects.create(organization=instance, name="Your First Agent")


@receiver(post_delete, sender=Version)
def delete_empty_agent(sender, instance, **kwargs):
    """
    Signal handler to delete an agent when its last version is deleted.
    """
    # Check if this was the last version
    if not Version.objects.filter(agent=instance.agent).exists():
        instance.agent.delete()


@receiver(post_save, sender=Version)
def handle_version_creation(sender, instance, created, **kwargs):
    """
    Signal handler to duplicate settings and pages when a new version is created.
    Skips the initial version creation as it's handled by create_initial_version.
    """
    if created and instance.name != "v1":  # Skip initial version
        instance.duplicate_from()
