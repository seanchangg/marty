#!/usr/bin/env python3
"""
CLI tool for memory management.

Usage:
    python scripts/mem.py list                          # List all categories
    python scripts/mem.py show career                   # Show all career entries
    python scripts/mem.py show career major             # Show specific entry
    python scripts/mem.py write projects dyno "AI agent"  # Write entry
    python scripts/mem.py delete temp old_key           # Delete entry
    python scripts/mem.py search "microarchitecture"    # Search all memories
    python scripts/mem.py cleanup                       # Clean expired entries
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from memory.memory_core import (
    write_memory,
    read_memory,
    delete_memory,
    list_memories,
    search_memories
)
from memory.agent_hooks import cleanup_stale_memories
import json


def cmd_list():
    """List all memory categories."""
    summaries = list_memories()
    if not summaries:
        print("No memories found. Run 'python scripts/init_memory.py' to initialize.")
        return
    
    print("\n📚 Memory Categories:\n")
    total_size = 0
    for s in summaries:
        print(f"  {s['category']:15} {s['count']:3} entries  {s['size_kb']:6.2f} KB")
        print(f"                  Keys: {', '.join(s['keys'][:5])}")
        if len(s['keys']) > 5:
            print(f"                        ... and {len(s['keys']) - 5} more")
        print()
        total_size += s['size_kb']
    
    print(f"  Total: {sum(s['count'] for s in summaries)} entries, {total_size:.2f} KB\n")


def cmd_show(category: str, key: str = None):
    """Show category or specific entry."""
    data = read_memory(category, key)
    
    if data is None:
        print(f"❌ Not found: {category}" + (f"/{key}" if key else ""))
        return
    
    print(f"\n📖 {category}" + (f"/{key}" if key else "") + ":\n")
    print(json.dumps(data, indent=2))
    print()


def cmd_write(category: str, key: str, value: str):
    """Write a memory entry."""
    result = write_memory(category, key, value)
    print(f"✅ Written: {result['category']}/{result['key']}")
    print(f"   Path: {result['path']}")


def cmd_delete(category: str, key: str = None):
    """Delete entry or category."""
    result = delete_memory(category, key)
    
    if result['status'] == 'deleted':
        scope = f"/{result.get('key')}" if key else " (entire category)"
        print(f"🗑️  Deleted: {result['category']}{scope}")
    else:
        print(f"❌ Not found: {category}" + (f"/{key}" if key else ""))


def cmd_search(query: str):
    """Search all memories."""
    results = search_memories(query)
    
    if not results:
        print(f"🔍 No results for: '{query}'")
        return
    
    print(f"\n🔍 Found {len(results)} result(s) for '{query}':\n")
    for r in results:
        print(f"  {r['category']}/{r['key']}:")
        value_str = json.dumps(r['value']) if isinstance(r['value'], (dict, list)) else str(r['value'])
        print(f"    {value_str[:100]}...")
        print()


def cmd_cleanup():
    """Clean expired memories."""
    result = cleanup_stale_memories()
    
    if result['entries_removed'] == 0:
        print("✨ No expired entries found.")
    else:
        print(f"🧹 Cleaned {result['entries_removed']} expired entries from:")
        for cat in result['categories']:
            print(f"   - {cat}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    cmd = sys.argv[1]
    
    try:
        if cmd == "list":
            cmd_list()
        elif cmd == "show":
            if len(sys.argv) < 3:
                print("Usage: mem.py show <category> [key]")
                return
            category = sys.argv[2]
            key = sys.argv[3] if len(sys.argv) > 3 else None
            cmd_show(category, key)
        elif cmd == "write":
            if len(sys.argv) < 5:
                print("Usage: mem.py write <category> <key> <value>")
                return
            category, key, value = sys.argv[2], sys.argv[3], sys.argv[4]
            cmd_write(category, key, value)
        elif cmd == "delete":
            if len(sys.argv) < 3:
                print("Usage: mem.py delete <category> [key]")
                return
            category = sys.argv[2]
            key = sys.argv[3] if len(sys.argv) > 3 else None
            cmd_delete(category, key)
        elif cmd == "search":
            if len(sys.argv) < 3:
                print("Usage: mem.py search <query>")
                return
            query = sys.argv[2]
            cmd_search(query)
        elif cmd == "cleanup":
            cmd_cleanup()
        else:
            print(f"Unknown command: {cmd}")
            print(__doc__)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
