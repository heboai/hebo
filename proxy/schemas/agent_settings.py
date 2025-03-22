from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ModelType(str, Enum):
    CHAT = "chat"
    EMBEDDING = "embedding"


class ProviderType(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    AZURE = "azure"
    BEDROCK = "bedrock"
    VERTEX = "vertex-ai"
    VOYAGE = "voyage"


class LLMAdapter(BaseModel):
    id: int
    is_default: bool
    organization_id: Optional[str] = None
    model_type: ModelType
    provider: ProviderType
    api_base: Optional[str] = None
    name: str = Field(max_length=150)
    aws_region: Optional[str] = Field(default=None, max_length=50)
    api_key: Optional[str] = Field(default=None, max_length=2000)
    aws_access_key_id: Optional[str] = Field(default=None, max_length=255)
    aws_secret_access_key: Optional[str] = Field(default=None, max_length=255)

    class Config:
        from_attributes = True


class MCPParams(BaseModel):
    sse_url: str
    sse_token: Optional[str] = None


class AgentSetting(BaseModel):
    id: int
    organization_id: str
    version_id: int
    core_llm: Optional[LLMAdapter] = None
    condense_llm: Optional[LLMAdapter] = None
    vision_llm: Optional[LLMAdapter] = None
    embeddings: Optional[LLMAdapter] = None
    delay: bool = False
    hide_tool_messages: bool = False
    include_last_24h_history: bool = False
    mcp_params: Optional[MCPParams] = None

    class Config:
        from_attributes = True
