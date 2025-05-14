import uuid
from typing import Any, Dict

from pydantic import BaseModel


class VectorStoreResponse(BaseModel):
    id: int
    source: str
    metadata: Dict[str, Any]
    similarity: float | None = None


class Session(BaseModel):
    contact_identifier: str | None = None
    thread_id: str
    trace_id: uuid.UUID
    agent_version: str
    organization_id: str

    def __str__(self):
        return f"Session(contact_identifier={self.contact_identifier}, thread_id={self.thread_id}, trace_id={self.trace_id}, agent_version={self.agent_version}, organization_id={self.organization_id})"

    def __hash__(self):
        return hash((self.thread_id, self.agent_version, self.organization_id))
