"""Supabase Storage abstraction using the REST API (no pip dependencies).

Provides file operations against Supabase Storage buckets with user-scoped
paths: all files are stored under {userId}/{path} for isolation.

Uses urllib like supabase_client.py — zero external dependencies.
"""

import json
import os
import urllib.request
import urllib.parse
import urllib.error

_SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _storage_url(bucket: str, path: str = "") -> str:
    """Build the Supabase Storage API URL."""
    base = f"{_SUPABASE_URL}/storage/v1/object"
    if path:
        return f"{base}/{bucket}/{path}"
    return f"{base}/{bucket}"


def _headers(*, content_type: str | None = None) -> dict[str, str]:
    h = {
        "apikey": _SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {_SERVICE_ROLE_KEY}",
    }
    if content_type:
        h["Content-Type"] = content_type
    return h


def upload_file(bucket: str, user_id: str, path: str, content_bytes: bytes,
                content_type: str = "application/octet-stream") -> dict:
    """Upload a file to Supabase Storage at {userId}/{path}.

    Uses upsert mode so existing files are overwritten.
    Returns the response dict on success, raises RuntimeError on any error.
    """
    storage_path = f"{user_id}/{path}"
    url = _storage_url(bucket, storage_path)

    headers = _headers(content_type=content_type)
    headers["x-upsert"] = "true"

    req = urllib.request.Request(url, data=content_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise RuntimeError(f"Storage upload error ({e.code}): {body}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise RuntimeError(f"Storage upload failed (network): {e}")


def read_file(bucket: str, user_id: str, path: str) -> bytes:
    """Download a file from Supabase Storage at {userId}/{path}.

    Returns the raw bytes of the file.
    """
    storage_path = f"{user_id}/{path}"
    url = _storage_url(bucket, storage_path)

    req = urllib.request.Request(url, headers=_headers(), method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise RuntimeError(f"Storage read error ({e.code}): {body}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise RuntimeError(f"Storage read failed (network): {e}")


def list_files(bucket: str, user_id: str, prefix: str = "") -> list[dict]:
    """List objects in Supabase Storage under {userId}/{prefix}.

    Returns a list of file metadata dicts (name, id, metadata, etc.).
    The Supabase list API returns items in the folder specified by prefix.
    """
    list_url = f"{_SUPABASE_URL}/storage/v1/object/list/{bucket}"

    # Build the folder prefix — Supabase expects the folder path, files
    # inside that folder are returned with just their filename in "name".
    folder_prefix = f"{user_id}/{prefix}" if prefix else user_id

    payload = json.dumps({
        "prefix": folder_prefix,
        "limit": 1000,
        "offset": 0,
        "sortBy": {"column": "name", "order": "asc"},
    }).encode()

    headers = _headers(content_type="application/json")
    req = urllib.request.Request(list_url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            # Supabase returns a list directly, but guard against
            # unexpected wrapper objects.
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and isinstance(data.get("files"), list):
                return data["files"]
            if isinstance(data, dict) and isinstance(data.get("items"), list):
                return data["items"]
            # Fallback — return as-is if it's a list-like structure
            return data if isinstance(data, list) else []
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise RuntimeError(f"Storage list error ({e.code}): {body}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise RuntimeError(f"Storage list failed (network): {e}")


def delete_file(bucket: str, user_id: str, path: str) -> dict:
    """Remove a file from Supabase Storage at {userId}/{path}."""
    storage_path = f"{user_id}/{path}"
    delete_url = f"{_SUPABASE_URL}/storage/v1/object/{bucket}"

    payload = json.dumps({"prefixes": [storage_path]}).encode()
    headers = _headers(content_type="application/json")

    req = urllib.request.Request(delete_url, data=payload, headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise RuntimeError(f"Storage delete error ({e.code}): {body}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise RuntimeError(f"Storage delete failed (network): {e}")


def get_public_url(bucket: str, user_id: str, path: str) -> str:
    """Get the public URL for a file in a public bucket."""
    storage_path = f"{user_id}/{path}"
    return f"{_SUPABASE_URL}/storage/v1/object/public/{bucket}/{storage_path}"
