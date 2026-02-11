"""
Initialize Sean's memory profile from the provided context.
Run once to bootstrap the memory system.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from memory.memory_core import write_memory

# Sean's profile
profile = {
    "career": {
        "major": "CS + Applied Math + Business (triple)",
        "school": "UNC Chapel Hill",
        "interests": ["microarchitecture", "quant dev", "building projects"],
    },
    "prefs": {
        "tz": "EST",
        "loc": "Chapel Hill, NC",
        "langs": ["C++", "Python", "learning full-stack"],
        "tools": ["VSCode", "GCal", "Gmail", "Outlook", "iMessage", "IG"],
        "comm_style": "Concise, detailed, intelligent",
    },
    "habits": {
        "morning": "8:30-9am gym: workout+run+stretch, podcasts for news",
        "class_hrs": "11:30am-4pm weekdays",
        "peak_prod": "Nights 6-7pm+, weekends 2-5pm",
        "info_diet": "Morning podcasts for news (important for career)",
    },
    "usage": {
        "primary": "Proactive research/prep, task mgmt, API testing",
        "goal": "Have things ready before work sessions",
    }
}

def init():
    print("🧠 Initializing Sean's memory profile...")
    
    for category, entries in profile.items():
        for key, value in entries.items():
            result = write_memory(category, key, value)
            print(f"✓ {category}/{key}")
    
    print("\n✅ Memory profile initialized!")
    print("📍 Location: ~/.dyno/memory/")

if __name__ == "__main__":
    init()
