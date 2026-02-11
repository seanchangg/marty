#!/usr/bin/env python3
"""
Quick validation test for memory system.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from memory.memory_core import write_memory, read_memory, delete_memory, list_memories, search_memories
from memory.agent_hooks import should_remember, get_context_for_prompt, cleanup_stale_memories


def test_basic_ops():
    """Test basic CRUD operations."""
    print("🧪 Testing basic operations...")
    
    # Write
    result = write_memory("temp", "test_key", "test_value")
    assert result['status'] == 'written', "Write failed"
    print("  ✓ Write")
    
    # Read
    value = read_memory("temp", "test_key")
    assert value == "test_value", f"Read failed: got {value}"
    print("  ✓ Read")
    
    # Delete
    result = delete_memory("temp", "test_key")
    assert result['status'] == 'deleted', "Delete failed"
    print("  ✓ Delete")
    
    # Verify deleted
    value = read_memory("temp", "test_key")
    assert value is None, "Entry still exists after delete"
    print("  ✓ Delete verified")


def test_auto_save():
    """Test auto-save detection."""
    print("\n🧪 Testing auto-save detection...")
    
    test_cases = [
        ("I'm working on a Dyno agent project", "projects"),
        ("Need to finish homework by Friday deadline", "tasks"),
        ("Email me at test@example.com", "contacts"),
        ("Researching RISC-V architecture", "research"),
    ]
    
    for message, expected_cat in test_cases:
        result = should_remember(message)
        assert result is not None, f"Failed to detect: {message}"
        assert result['category'] == expected_cat, f"Wrong category: {result['category']} vs {expected_cat}"
        print(f"  ✓ Detected {expected_cat}: {message[:40]}...")


def test_search():
    """Test search functionality."""
    print("\n🧪 Testing search...")
    
    # Write test entries
    write_memory("temp", "test1", "microarchitecture research")
    write_memory("temp", "test2", "quant dev project")
    
    # Search
    results = search_memories("microarchitecture")
    assert len(results) > 0, "Search returned no results"
    assert any("microarchitecture" in str(r['value']).lower() for r in results), "Search missed entry"
    print(f"  ✓ Search found {len(results)} result(s)")
    
    # Cleanup
    delete_memory("temp", "test1")
    delete_memory("temp", "test2")


def test_list():
    """Test list functionality."""
    print("\n🧪 Testing list...")
    
    write_memory("temp", "list_test", "test")
    summaries = list_memories()
    
    assert len(summaries) > 0, "List returned no categories"
    assert any(s['category'] == 'temp' for s in summaries), "Temp category not found"
    print(f"  ✓ Listed {len(summaries)} categories")
    
    delete_memory("temp", "list_test")


def test_context_injection():
    """Test context injection."""
    print("\n🧪 Testing context injection...")
    
    context = get_context_for_prompt()
    # Context may be empty if no profile initialized, which is fine
    print(f"  ✓ Generated context ({len(context)} chars)")
    if context:
        print(f"    Preview: {context[:100]}...")


def main():
    print("🧠 Memory System Validation\n")
    print("=" * 50)
    
    try:
        test_basic_ops()
        test_auto_save()
        test_search()
        test_list()
        test_context_injection()
        
        print("\n" + "=" * 50)
        print("✅ All tests passed!\n")
        print("Run 'python scripts/init_memory.py' to initialize your profile.")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
