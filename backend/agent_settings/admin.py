from django.contrib import admin
from django.contrib.admin import ModelAdmin

from .models import AgentSetting, LLMAdapter, MCPConfig


@admin.register(AgentSetting)
class AgentSettingAdmin(ModelAdmin):
    list_display = [
        "organization",
        "version_slugs",
        "core_llm",
        "condense_llm",
        "embeddings",
        "delay",
        "hide_tool_messages",
        "include_last_24h_history",
    ]
    list_filter = [
        "organization",
        "version",
        "core_llm",
        "condense_llm",
        "embeddings",
        "delay",
        "hide_tool_messages",
        "include_last_24h_history",
    ]
    search_fields = ["organization__name", "version__name", "version__slugs__slug"]

    def version_slugs(self, obj):
        return ", ".join([slug.slug for slug in obj.version.slugs.all()])

    version_slugs.short_description = "Version Slugs"


@admin.register(LLMAdapter)
class LLMAdapterAdmin(ModelAdmin):
    list_display = ["name", "is_default", "model_type", "provider"]
    search_fields = ["name"]


@admin.register(MCPConfig)
class MCPConfigAdmin(ModelAdmin):
    list_display = ["agent_setting", "sse_url"]
    search_fields = ["agent_setting__version__agent__name"]
