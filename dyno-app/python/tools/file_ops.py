"""File operation tools: read_file, list_files, write_file, modify_file.

These operate on the bot's own source directory (python/), allowing
the agent to read and modify its own code.
"""

import os
from ._common import TOOLS_DIR, safe_path

TOOL_DEFS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file in the bot's own source directory (python/). Use paths like 'agent_core.py', 'tools/web.py', 'ws_server.py'.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Path relative to the python/ directory (e.g. 'agent_core.py', 'tools/screenshots.py')"
                }
            },
            "required": ["filename"]
        }
    },
    {
        "name": "list_files",
        "description": "List files in the bot's own source directory (python/). Shows the bot's own code files.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Subdirectory to list (e.g. 'tools'). Leave empty for the root python/ directory."
                }
            },
            "required": []
        }
    },
    {
        "name": "write_file",
        "description": "Write a new file or overwrite an existing file in the bot's source directory (python/). Can create new tool skills in tools/.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Path relative to python/ (e.g. 'tools/new_skill.py')"
                },
                "content": {
                    "type": "string",
                    "description": "Full content to write to the file"
                }
            },
            "required": ["filename", "content"]
        }
    },
    {
        "name": "modify_file",
        "description": "Modify an existing file in the bot's source directory by replacing a specific string with a new string.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Path relative to python/ (e.g. 'tools/web.py', 'agent_core.py')"
                },
                "old_string": {
                    "type": "string",
                    "description": "The exact string to find and replace"
                },
                "new_string": {
                    "type": "string",
                    "description": "The replacement string"
                }
            },
            "required": ["filename", "old_string", "new_string"]
        }
    },
]

READ_ONLY = {"read_file", "list_files"}


async def handle_read_file(input_data: dict) -> str:
    filename = input_data["filename"]
    path = safe_path(filename)
    if not path.exists():
        return f"Error: File not found: {filename}"
    return path.read_text(encoding="utf-8")


async def handle_list_files(input_data: dict) -> str:
    subdir = input_data.get("path", "")
    target = TOOLS_DIR / subdir if subdir else TOOLS_DIR
    resolved = target.resolve()
    if not str(resolved).startswith(str(TOOLS_DIR.resolve())):
        return "Error: Path escapes sandbox"
    if not resolved.is_dir():
        return f"Error: Not a directory: {subdir}"

    files = []
    for f in sorted(resolved.iterdir()):
        if f.name.startswith("."):
            continue
        rel = os.path.relpath(f, TOOLS_DIR)
        if f.is_dir():
            files.append(f"{rel}/")
        elif f.is_file():
            size = f.stat().st_size
            files.append(f"{rel} ({size} bytes)")
    if not files:
        return f"Empty directory: {subdir or 'python/'}"
    return "\n".join(files)


async def handle_write_file(input_data: dict) -> str:
    filename = input_data["filename"]
    content = input_data["content"]
    path = safe_path(filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return f"Written {len(content)} bytes to {filename}"


async def handle_modify_file(input_data: dict) -> str:
    filename = input_data["filename"]
    old_string = input_data["old_string"]
    new_string = input_data["new_string"]
    path = safe_path(filename)
    if not path.exists():
        return f"Error: File not found: {filename}"
    content = path.read_text(encoding="utf-8")
    if old_string not in content:
        return f"Error: old_string not found in {filename}"
    count = content.count(old_string)
    content = content.replace(old_string, new_string)
    path.write_text(content, encoding="utf-8")
    return f"Replaced {count} occurrence(s) in {filename}"


HANDLERS = {
    "read_file": handle_read_file,
    "list_files": handle_list_files,
    "write_file": handle_write_file,
    "modify_file": handle_modify_file,
}
