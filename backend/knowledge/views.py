import json
import logging
import markdown
import time

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse, reverse_lazy
from django.utils.decorators import method_decorator
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_protect
from django.views.generic import (
    DeleteView,
    DetailView,
    ListView,
    UpdateView,
)
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.db.models.functions import Collate

from core.authentication import APIKeyAuthentication
from core.mixins import OrganizationPermissionMixin
from versions.models import Version, VersionSlug
from .forms import PageForm
from .models import Page
from .serializers import PageSerializer, BulkPageSerializer

logger = logging.getLogger(__name__)


def extract_title_and_content(content: str) -> tuple[str, str]:
    """Extract title from first line and format content."""
    lines = content.strip().split("\n", 1)

    if not lines:
        return "New Page", ""

    first_line = lines[0].strip()
    remaining_content = lines[1].strip() if len(lines) > 1 else ""

    # If first line isn't a header, make it one
    if not first_line.startswith("# "):
        title = first_line
        formatted_content = f"# {first_line}\n\n{remaining_content}"
    else:
        title = first_line[2:].strip()  # Remove '# ' prefix
        formatted_content = content

    return title, formatted_content


class KnowledgeBaseView(LoginRequiredMixin, OrganizationPermissionMixin, ListView):
    model = Page
    template_name = "knowledge/base.html"
    context_object_name = "pages"
    ordering = ["title", "-updated_at"]

    def get_queryset(self):
        version_id = self.request.session.get("selected_version_id")
        queryset = super().get_queryset()
        if version_id:
            queryset = queryset.filter(version_id=version_id)
        # Enforce case-insensitive ordering by title
        return queryset.order_by(Collate("title", "C"), "-updated_at")

    def get(self, request, *args, **kwargs):
        # Get the queryset first
        queryset = self.get_queryset()

        # If there are no pages, create one and redirect to it
        if not queryset.exists():
            # Get the selected version
            version_id = request.session.get("selected_version_id")
            version = None
            if version_id:
                try:
                    version = Version.objects.get(id=version_id)
                except Version.DoesNotExist:
                    raise ValueError("Version not found")

            # Create the first page
            page = Page.objects.create(
                title="New Page",
                content="# New Page\n\nStart writing here...",
                organization=self.organization,
                version=version,
            )

            return redirect(
                reverse(
                    "page_detail",
                    kwargs={"organization_pk": self.organization.pk, "pk": page.pk},
                )
            )

        # If we're on the base knowledge URL and there are pages, redirect to the first page
        if self.request.path == reverse(
            "knowledge_list",
            kwargs={"organization_pk": self.organization.pk},
        ):
            first_page = queryset.first()
            if first_page:
                return redirect(
                    reverse(
                        "page_detail",
                        kwargs={
                            "organization_pk": self.organization.pk,
                            "pk": first_page.pk,
                        },
                    )
                )

        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            try:
                data = json.loads(request.body)

                # Existing page creation logic
                content = data.get("content", "").strip()
                title, formatted_content = extract_title_and_content(content)

                # Get version - either from request or session
                version_id = data.get("version") or request.session.get(
                    "selected_version_id"
                )

                if not version_id:
                    raise ValueError("A version must be selected to create a page")

                try:
                    version = Version.objects.get(id=version_id)
                except Version.DoesNotExist:
                    error_msg = f"Version not found: {version_id}"
                    raise ValueError(error_msg)

                # Create new page
                page = Page.objects.create(
                    title=title,
                    content=formatted_content,
                    organization=self.organization,
                    version=version,
                )

                response_data = {
                    "status": "success",
                    "redirect_url": reverse(
                        "page_detail",
                        kwargs={
                            "organization_pk": self.organization.pk,
                            "pk": page.pk,
                        },
                    ),
                }
                return JsonResponse(response_data)
            except Exception as e:
                return JsonResponse(
                    {
                        "status": "error",
                        "message": str(e),
                    },
                    status=500,
                )

        return super().post(request, *args, **kwargs)  # type: ignore

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add the selected version ID to the context
        context["selected_version_id"] = self.request.session.get("selected_version_id")
        return context


@method_decorator(csrf_protect, name="dispatch")
class PageDetailView(LoginRequiredMixin, OrganizationPermissionMixin, DetailView):
    model = Page
    template_name = "knowledge/page_detail.html"
    context_object_name = "page"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        md = markdown.Markdown(
            extensions=[
                "extra",
                "codehilite",
                "fenced_code",
                "tables",
                "toc",
            ]
        )
        context["page_content"] = md.convert(self.object.content)  # type: ignore
        context["raw_content"] = self.object.content  # type: ignore
        context["current_page"] = self.object  # type: ignore
        # Add sidebar pages (same logic as KnowledgeBaseView)
        version_id = self.request.session.get("selected_version_id")
        pages_qs = Page.objects.all()
        if version_id:
            pages_qs = pages_qs.filter(version_id=version_id)
        context["pages"] = pages_qs.order_by(Collate("title", "C"), "-updated_at")
        return context


@method_decorator(csrf_protect, name="dispatch")
class PageUpdateView(LoginRequiredMixin, OrganizationPermissionMixin, UpdateView):
    model = Page
    form_class = PageForm

    def post(self, request, *args, **kwargs):
        if not request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return super().post(request, *args, **kwargs)

        try:
            data = json.loads(request.body)
            page: Page = self.get_object()  # type: ignore

            # Get the raw markdown content and extract title
            content = data.get("content", "").strip()
            title, formatted_content = extract_title_and_content(content)

            # Convert to HTML for the response
            md = markdown.Markdown(
                extensions=[
                    "extra",
                    "codehilite",
                    "fenced_code",
                    "tables",
                    "toc",
                ]
            )
            html_content = md.convert(formatted_content)

            # Save both title and content
            page.title = title
            page.content = formatted_content
            page.save()

            return JsonResponse(
                {
                    "status": "success",
                    "html_content": mark_safe(html_content),
                    "title": title,
                    "page_id": str(page.pk),
                }
            )
        except Exception as e:
            logger.error(f"Error updating page: {str(e)}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)


class PageDeleteView(LoginRequiredMixin, OrganizationPermissionMixin, DeleteView):
    model = Page
    template_name = "knowledge/page_confirm_delete.html"

    def get_success_url(self):
        return reverse_lazy(
            "knowledge_list",
            kwargs={"organization_pk": self.organization.pk},
        )


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for accessing pages.
    Requires X-API-Key authentication and supports filtering by agent_slug.
    """

    serializer_class = PageSerializer
    authentication_classes = [APIKeyAuthentication]
    permission_classes = []

    def get_queryset(self):
        # Get organization from authentication
        organization = self.request.auth  # type: ignore

        # Get agent_version from query params
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

        # Filter pages by organization and version
        return Page.objects.filter(
            organization=organization,
            version=version,
        ).order_by(Collate("title", "C"), "-updated_at")

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
        List all pages for the authenticated organization and specified agent_slug.
        """
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """
        Bulk update pages for the current version.
        Deletes pages not in the request, updates existing ones, and creates new ones.
        """
        # Get queryset to ensure proper authentication and version lookup
        queryset = self.get_queryset()
        version = self.get_serializer_context().get("version")

        # Validate request data
        if not isinstance(request.data, list):
            raise ValidationError("Request body must be a list of pages")

        # Initialize serializer with context
        serializer = BulkPageSerializer(
            data=request.data, many=True, context={"version": version}
        )
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        # Create a set of content hashes from the request for quick lookup
        request_content = {page["content"] for page in validated_data}  # type: ignore

        # Initialize operation report
        report = {"created": [], "updated": [], "deleted": [], "errors": []}

        BATCH_SIZE = 10

        try:
            with transaction.atomic():
                # Delete pages not in the request
                for page in queryset:
                    if page.content not in request_content:
                        page.delete()
                        report["deleted"].append({"id": page.id, "title": page.title})  # type: ignore

                # Update or create pages in batches
                for i in range(0, len(validated_data), BATCH_SIZE):  # type: ignore
                    batch = validated_data[i : i + BATCH_SIZE]  # type: ignore

                    for page_data in batch:
                        # Try to find existing page with matching content
                        existing_page = queryset.filter(
                            content=page_data["content"]
                        ).first()

                        if existing_page:
                            # Update existing page
                            existing_page.title = page_data["title"]
                            existing_page.save()
                            report["updated"].append(
                                {"id": existing_page.id, "title": existing_page.title}  # type: ignore
                            )
                        else:
                            # Create new page
                            new_page = Page.objects.create(
                                organization=request.auth,  # type: ignore
                                version=version,
                                title=page_data["title"],
                                content=page_data["content"],
                            )
                            report["created"].append(
                                {"id": new_page.id, "title": new_page.title}  # type: ignore
                            )

                    # Wait a short time between batches to prevent connection spikes
                    if i + BATCH_SIZE < len(validated_data):  # type: ignore
                        time.sleep(1)

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
