"""Shared constants and helpers for all tool modules."""

from pathlib import Path

DYNO_HOME = Path.home() / ".dyno"
# Point the bot's sandbox at its own source — python/ directory
TOOLS_DIR = Path(__file__).resolve().parent.parent  # python/
SCREENSHOTS_DIR = DYNO_HOME / "screenshots"
UPLOADS_DIR = DYNO_HOME / "uploads"

# Ensure directories exist
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def safe_path(filename: str, base: Path = TOOLS_DIR) -> Path:
    """Resolve a filename to a safe path within a base directory."""
    resolved = (base / filename).resolve()
    if not str(resolved).startswith(str(base.resolve())):
        raise ValueError(f"Path escapes sandbox: {filename}")
    return resolved
