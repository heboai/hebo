from datetime import datetime
from enum import Enum
from typing import Any, Dict, List

from pydantic import BaseModel, Field, field_validator


class Page(BaseModel):
    organization_id: int
    version_id: int
    title: str = Field(max_length=200)
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentType(Enum):
    """Available content types."""

    BEHAVIOUR = "behaviour"
    SCENARIO = "scenario"
    EXAMPLE = "example"


class Part(BaseModel):
    page_id: int
    start_line: int
    end_line: int
    content_hash: str = Field(max_length=64)
    content_type: ContentType
    is_handover: bool = False
    created_at: datetime
    updated_at: datetime

    @field_validator("end_line", mode="before")
    @classmethod
    def validate_end_line(cls, value, values):
        if "start_line" in values and value <= values["start_line"]:
            raise ValueError("End line must be greater than start line")
        return value

    @field_validator("is_handover", mode="before")
    @classmethod
    def validate_is_handover(cls, value, values):
        if value and values.get("content_type") == ContentType.BEHAVIOUR:
            raise ValueError(
                "Handover tag can only be applied to scenarios and examples"
            )
        return value

    class Config:
        from_attributes = True


class Vector(BaseModel):
    part_id: int
    content: str
    embedding_model: str = Field(max_length=20)
    vector: List[float]
    metadata: Dict[str, Any]

    class Config:
        from_attributes = True


class CreateVectorRequest(BaseModel):
    agent_version: str
    part_id: int
    embedding_model: str = Field(max_length=20)
    content: str
    metadata: Dict[str, Any]


class CreateVectorResponse(Vector): ...
