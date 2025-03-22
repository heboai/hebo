from rest_framework import serializers
from .models import AgentSetting, LLMAdapter, MCPConfig


class LLMAdapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLMAdapter
        fields = [
            "model_type",
            "provider",
            "api_base",
            "name",
            "aws_region",
            "api_key",
            "aws_access_key_id",
            "aws_secret_access_key",
        ]


class AgentSettingSerializer(serializers.ModelSerializer):
    core_llm = LLMAdapterSerializer()
    condense_llm = LLMAdapterSerializer()
    embeddings = LLMAdapterSerializer()
    vision_llm = LLMAdapterSerializer()

    class Meta:
        model = AgentSetting
        fields = [
            "core_llm",
            "condense_llm",
            "embeddings",
            "vision_llm",
            "delay",
            "hide_tool_messages",
            "include_last_24h_history",
        ]


class MCPConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MCPConfig
        fields = ["sse_url", "sse_token"]
