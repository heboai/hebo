from contextlib import asynccontextmanager


@asynccontextmanager
async def dummy_streamablehttp_client(*args, **kwargs):
    """Dummy SSE client that returns meaningless read/write functions"""

    async def dummy_read():
        return ""

    async def dummy_write(data):
        pass

    async def dummy_get_session_id():
        return "dummy_session_id"

    yield (dummy_read, dummy_write, dummy_get_session_id)


class DummyClientSession:
    """Dummy client session for when MCP params are not available"""

    def __init__(self, read, write):
        self.read = read
        self.write = write

    async def initialize(self):
        """Dummy initialize method"""
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


async def dummy_load_mcp_tools(*args, **kwargs):
    """Dummy MCP tools loader that returns an empty list"""
    return []
