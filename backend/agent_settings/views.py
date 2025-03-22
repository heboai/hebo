import logging
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic import (
    CreateView,
    DeleteView,
    ListView,
    UpdateView,
)
from django.contrib import messages
from django.db import models, transaction
from django.http import JsonResponse, HttpResponseNotAllowed
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.utils import IntegrityError

from core.authentication import APIKeyAuthentication
from core.mixins import OrganizationPermissionMixin
from versions.models import VersionSlug
from .forms import LLMAdapterForm, AgentSettingForm
from .models import AgentSetting, LLMAdapter, MCPConfig
from .serializers import AgentSettingSerializer, MCPConfigSerializer

# Configure a logger for this module
logger = logging.getLogger(__name__)


class AgentSettingUpdateView(
    LoginRequiredMixin, OrganizationPermissionMixin, UpdateView
):
    model = AgentSetting
    template_name = "agent_settings/agent_setting_update.html"
    form_class = AgentSettingForm

    def get_object(self, queryset=None):
        obj, _ = AgentSetting.objects.get_or_create(
            organization=self.organization,
            version=self.request.session.get("selected_version_id"),
            defaults={
                "delay": False,
                "hide_tool_messages": False,
                "include_last_24h_history": False,
            },
        )
        return obj

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get both organization-specific and default adapters
        adapters = LLMAdapter.objects.filter(
            models.Q(organization=self.organization) | models.Q(is_default=True)
        )

        # Filter adapters by type and add to context
        chat_adapters = adapters.filter(model_type=LLMAdapter.ModelType.CHAT).order_by(
            "-is_default", "provider", "name"
        )

        embedding_adapters = adapters.filter(
            model_type=LLMAdapter.ModelType.EMBEDDING
        ).order_by("-is_default", "provider", "name")

        context.update(
            {
                "chat_adapters": chat_adapters,
                "embedding_adapters": embedding_adapters,
                "agent_setting": self.get_object(),  # Ensure we have the latest object
            }
        )

        return context

    def form_valid(self, form):
        response = super().form_valid(form)
        return response

    def get_success_url(self):
        return reverse_lazy(
            "agent_setting_update",
            kwargs={"organization_pk": self.organization.pk},
        )


class LLMAdapterListView(LoginRequiredMixin, OrganizationPermissionMixin, ListView):
    model = LLMAdapter
    template_name = "agent_settings/llm_adapter_list.html"
    context_object_name = "adapters"

    def get_queryset(self):
        # Get both organization-specific and default adapters
        return LLMAdapter.objects.filter(
            models.Q(organization=self.organization) | models.Q(is_default=True)
        ).order_by("-is_default", "provider", "name")


class LLMAdapterCreateView(LoginRequiredMixin, OrganizationPermissionMixin, CreateView):
    model = LLMAdapter
    form_class = LLMAdapterForm
    http_method_names = ["post"]

    def get(self, request, *args, **kwargs):
        # Log an error if a GET request is made
        logger.error(
            "GET request received on LLMAdapterCreateView; only POST is allowed."
        )
        return HttpResponseNotAllowed(["POST"])

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        logger.debug(
            "LLMAdapterCreateView.get_form_kwargs: Setting organization: %s",
            self.organization,
        )
        kwargs["organization"] = self.organization
        return kwargs

    def form_valid(self, form):
        try:
            self.object = form.save()
            logger.info(
                "LLMAdapterCreateView.form_valid: Successfully created adapter: %s",
                self.object,
            )
            return JsonResponse(
                {
                    "status": "success",
                    "adapter": {
                        "id": self.object.id,
                        "name": self.object.name,
                        "is_default": self.object.is_default,
                    },
                }
            )
        except Exception as e:
            logger.exception(
                "LLMAdapterCreateView.form_valid: Exception while saving form: %s", e
            )
            return JsonResponse(
                {
                    "status": "error",
                    "message": str(e),
                },
                status=400,
            )

    def form_invalid(self, form):
        # Log the form errors to help debug why validation failed
        logger.error("LLMAdapterCreateView.form_invalid: Form errors: %s", form.errors)
        return JsonResponse(
            {"status": "error", "errors": form.errors},
            status=400,
        )


class LLMAdapterDeleteView(LoginRequiredMixin, OrganizationPermissionMixin, DeleteView):
    model = LLMAdapter
    template_name = "agent_settings/llm_adapter_confirm_delete.html"

    def get_queryset(self):
        # Only allow deleting organization's own adapters
        return LLMAdapter.objects.filter(organization=self.organization)

    def delete(self, request, *args, **kwargs):
        response = super().delete(request, *args, **kwargs)
        messages.success(self.request, "LLM adapter deleted successfully.")
        return response

    def get_success_url(self):
        return reverse_lazy("llm_adapter_list")


class AgentSettingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for accessing agent settings.
    Requires X-API-Key authentication and supports filtering by agent_slug.
    """

    serializer_class = AgentSettingSerializer
    authentication_classes = [APIKeyAuthentication]
    permission_classes = []

    def get_queryset(self):
        # Get organization from authentication
        organization = self.request.auth  # type: ignore

        # Get agent_slug from query params
        agent_version = self.request.query_params.get("agent_version")  # type: ignore
        if not agent_version:
            raise ValidationError("agent_version query parameter is required")

        # Get version from agent_slug
        try:
            version_slug = VersionSlug.objects.get(slug=agent_version)
            version = version_slug.version
        except VersionSlug.DoesNotExist:
            raise ValidationError(
                f"No version found for agent_version: {agent_version}"
            )

        # Filter agent settings by organization and version
        return AgentSetting.objects.filter(organization=organization, version=version)

    def get_serializer_context(self):
        """Add version to serializer context."""
        context = super().get_serializer_context()
        agent_version = self.request.query_params.get("agent_version")  # type: ignore
        if agent_version:
            try:
                version_slug = VersionSlug.objects.get(slug=agent_version)
                context["version"] = version_slug.version
            except VersionSlug.DoesNotExist:
                pass
        return context

    def list(self, request, *args, **kwargs):
        """
        List all agent settings for the authenticated organization and specified agent_slug.
        """
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """
        Bulk update agent settings for the current version.
        Creates or updates LLM adapters and agent settings.
        """
        # Get queryset to ensure proper authentication and version lookup
        queryset = self.get_queryset()
        version = self.get_serializer_context().get("version")
        organization = request.auth

        # Validate request data
        if not isinstance(request.data, list):
            raise ValidationError("Request body must be a list of settings")

        # Initialize operation report
        report = {"created": [], "updated": [], "errors": []}

        try:
            with transaction.atomic():
                for setting_data in request.data:
                    # Process LLM adapters first
                    adapters = {}
                    for adapter_type in [
                        "core_llm",
                        "condense_llm",
                        "embeddings",
                        "vision_llm",
                    ]:
                        if adapter_data := setting_data.pop(adapter_type, None):
                            # Try to find existing adapter with matching fields
                            existing_adapter = LLMAdapter.objects.filter(
                                organization=organization,
                                model_type=adapter_data["model_type"],
                                provider=adapter_data["provider"],
                                name=adapter_data["name"],
                                api_base=adapter_data.get("api_base", ""),
                                aws_region=adapter_data.get("aws_region", ""),
                                api_key=adapter_data.get("api_key", ""),
                                aws_access_key_id=adapter_data.get(
                                    "aws_access_key_id", ""
                                ),
                                aws_secret_access_key=adapter_data.get(
                                    "aws_secret_access_key", ""
                                ),
                            ).first()

                            if existing_adapter:
                                adapters[adapter_type] = existing_adapter
                            else:
                                # Create new adapter
                                adapter_data["organization"] = organization
                                new_adapter = LLMAdapter.objects.create(**adapter_data)
                                adapters[adapter_type] = new_adapter

                    # Try to find existing setting
                    existing_setting = queryset.first()

                    if existing_setting:
                        # Update existing setting with non-adapter fields
                        for key, value in setting_data.items():
                            if key not in ["organization", "version"]:
                                setattr(existing_setting, key, value)

                        # Update adapter fields
                        for adapter_type, adapter in adapters.items():
                            setattr(existing_setting, adapter_type, adapter)

                        existing_setting.save()
                        report["updated"].append({"id": existing_setting.id})  # type: ignore
                    else:
                        # Create new setting
                        setting_data["organization"] = organization
                        setting_data["version"] = version
                        setting_data.update(adapters)
                        new_setting = AgentSetting.objects.create(**setting_data)
                        report["created"].append({"id": new_setting.id})  # type: ignore

        except IntegrityError as e:
            report["errors"].append({"type": "integrity_error", "message": str(e)})
            return Response(
                {
                    "status": "error",
                    "message": "Bulk update failed due to validation errors",
                    "report": report,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "status": "success",
                "message": "Bulk update completed successfully",
                "report": report,
            },
            status=status.HTTP_200_OK,
        )


class MCPConfigViewSet(viewsets.ModelViewSet):
    """
    API endpoint for accessing MCP configs.
    """

    serializer_class = MCPConfigSerializer
    authentication_classes = [APIKeyAuthentication]
    permission_classes = []

    def get_queryset(self):
        # Get organization from authentication
        organization = self.request.auth  # type: ignore
        agent_version = self.request.query_params.get("agent_version")  # type: ignore
        if not agent_version:
            raise ValidationError("agent_version query parameter is required")

        # Get version from agent_version
        try:
            version_slug = VersionSlug.objects.get(slug=agent_version)
            version = version_slug.version
        except VersionSlug.DoesNotExist:
            raise ValidationError(
                f"No version found for agent_version: {agent_version}"
            )

        return MCPConfig.objects.filter(
            agent_setting__organization=organization, agent_setting__version=version
        )

    def get_serializer_context(self):
        """Add version to serializer context."""
        context = super().get_serializer_context()
        agent_version = self.request.query_params.get("agent_version")  # type: ignore
        if agent_version:
            try:
                version_slug = VersionSlug.objects.get(slug=agent_version)
                context["version"] = version_slug.version
            except VersionSlug.DoesNotExist:
                pass
        return context

    def list(self, request, *args, **kwargs):
        """
        List all MCP configs for the authenticated organization and specified agent_slug.
        """
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """
        Bulk update MCP configs for the current version.
        Deletes existing MCP configs and creates new ones.
        Requires agent settings to exist for the version.
        """
        # Get queryset to ensure proper authentication and version lookup
        queryset = self.get_queryset()
        version = self.get_serializer_context().get("version")
        organization = request.auth  # type: ignore

        # Validate request data
        if not isinstance(request.data, list):
            raise ValidationError("Request body must be a list of MCP configs")

        # Check if agent settings exist
        try:
            agent_setting = AgentSetting.objects.get(
                organization=organization, version=version
            )
        except AgentSetting.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "message": "Agent settings must exist before updating MCP configs",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Initialize operation report
        report = {"created": [], "deleted": [], "errors": []}

        try:
            with transaction.atomic():
                # Delete existing MCP configs
                deleted_count = queryset.delete()[0]
                report["deleted"].append({"count": deleted_count})

                # Create new MCP configs
                for config_data in request.data:  # type: ignore
                    config_data["agent_setting"] = agent_setting
                    new_config = MCPConfig.objects.create(**config_data)
                    report["created"].append({"id": new_config.id})  # type: ignore

        except IntegrityError as e:
            report["errors"].append({"type": "integrity_error", "message": str(e)})
            return Response(
                {
                    "status": "error",
                    "message": "Bulk update failed due to validation errors",
                    "report": report,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "status": "success",
                "message": "Bulk update completed successfully",
                "report": report,
            },
            status=status.HTTP_200_OK,
        )
