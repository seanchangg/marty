"""Upload reading tool: read_upload."""

import time

from ._common import UPLOADS_DIR, safe_path

TOOL_DEFS = [
    {
        "name": "read_upload",
        "description": "Read a user-uploaded file from ~/.dyno/uploads/. Returns text content for text files, or metadata for binary files.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Name of the uploaded file to read (relative to ~/.dyno/uploads/)"
                }
            },
            "required": ["filename"]
        }
    },
]

READ_ONLY = {"read_upload"}


async def handle_read_upload(input_data: dict) -> str:
    filename = input_data["filename"]
    resolved = safe_path(filename, base=UPLOADS_DIR)
    if not resolved.exists():
        return f"Error: Uploaded file not found: {filename}"

    try:
        content = resolved.read_text(encoding="utf-8")
        if len(content) > 10000:
            return content[:10000] + f"\n\n... (truncated, {len(content)} total chars)"
        return content
    except UnicodeDecodeError:
        stat = resolved.stat()
        return f"Binary file: {filename} ({stat.st_size} bytes, modified {time.ctime(stat.st_mtime)})"


HANDLERS = {
    "read_upload": handle_read_upload,
}
