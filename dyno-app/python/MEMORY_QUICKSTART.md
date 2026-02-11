# 🧠 Memory System — Quick Start Guide

**Get your Dyno agent to remember things across sessions in 3 steps.**

---

## Step 1: Run Tests (Optional but Recommended)

```bash
cd python/
python scripts/test_memory.py
```

Expected output:
```
🧠 Memory System Validation
==================================================
🧪 Testing basic operations...
  ✓ Write
  ✓ Read
  ✓ Delete
  ✓ Delete verified

🧪 Testing auto-save detection...
  ✓ Detected projects: I'm working on a Dyno agent project...
  ✓ Detected tasks: Need to finish homework by Friday deadl...
  ✓ Detected contacts: Email me at test@example.com...
  ✓ Detected research: Researching RISC-V architecture...

🧪 Testing search...
  ✓ Search found 1 result(s)

🧪 Testing list...
  ✓ Listed 1 categories

🧪 Testing context injection...
  ✓ Generated context (0 chars)

==================================================
✅ All tests passed!
```

---

## Step 2: Initialize Your Profile

```bash
python scripts/init_memory.py
```

Expected output:
```
🧠 Initializing Sean's memory profile...
✓ career/major
✓ career/school
✓ career/interests
✓ prefs/tz
✓ prefs/loc
✓ prefs/langs
✓ prefs/tools
✓ prefs/comm_style
✓ habits/morning
✓ habits/class_hrs
✓ habits/peak_prod
✓ habits/info_diet
✓ usage/primary
✓ usage/goal

✅ Memory profile initialized!
📍 Location: ~/.dyno/memory/
```

This creates:
```
~/.dyno/memory/
├── career.json      # CS + Applied Math + Business @ UNC
├── prefs.json       # Chapel Hill, EST, C++/Python, VSCode
├── habits.json      # Gym 8:30am, classes 11:30-4, peak 6pm+
└── usage.json       # Proactive prep agent
```

---

## Step 3: Verify & Explore

```bash
# List all memories
python scripts/mem.py list
```

Expected output:
```
📚 Memory Categories:

  career           3 entries    0.xx KB
                  Keys: major, school, interests

  prefs            5 entries    0.xx KB
                  Keys: tz, loc, langs, tools, comm_style

  habits           4 entries    0.xx KB
                  Keys: morning, class_hrs, peak_prod, info_diet

  usage            2 entries    0.xx KB
                  Keys: primary, goal

  Total: 14 entries, X.XX KB
```

```bash
# Show specific category
python scripts/mem.py show prefs
```

```json
{
  "tz": "EST",
  "loc": "Chapel Hill, NC",
  "langs": ["C++", "Python", "learning full-stack"],
  "tools": ["VSCode", "GCal", "Gmail", "Outlook", "iMessage", "IG"],
  "comm_style": "Concise, detailed, intelligent"
}
```

---

## ✅ You're Done!

Your agent now:
- ✅ **Remembers** your major, interests, schedule, tools
- ✅ **Auto-saves** projects, tasks, contacts you mention
- ✅ **Injects context** into every prompt (saves tokens, avoids repetition)
- ✅ **Cleans up** stale memories automatically

---

## 🎯 Try It Out

Start a conversation with your agent:

```
You: "Working on a RISC-V emulator for COMP 411, due next Friday"
```

**What happens:**
1. Agent auto-saves to `projects/riscv_emulator`
2. Agent auto-saves to `tasks/task_<timestamp>` with deadline
3. Next session, agent knows about this project

```
You: "What am I working on?"

Agent: "I see you're working on a RISC-V emulator for COMP 411 (due next 
       Friday). Need resources on instruction sets or memory models?"
```

**No manual tracking needed.**

---

## 📋 Common Commands

```bash
# List all memories
python scripts/mem.py list

# Show category
python scripts/mem.py show career
python scripts/mem.py show projects

# Show specific entry
python scripts/mem.py show prefs tz

# Add entry manually
python scripts/mem.py write projects myapp "Building a cool app"
python scripts/mem.py write tasks homework "Finish problem set by Monday"

# Search
python scripts/mem.py search "microarchitecture"
python scripts/mem.py search "UNC"

# Delete
python scripts/mem.py delete tasks homework
python scripts/mem.py delete temp              # Delete entire category

# Cleanup expired entries
python scripts/mem.py cleanup
```

---

## 🔥 Pro Tips

### 1. **Mention Things Naturally**
Just talk to your agent normally. If you mention:
- Projects: "working on X", "building Y"
- Tasks: "need to do X", "deadline Friday"
- Contacts: Email addresses, names
- Research: "learning about X", "researching Y"

It'll auto-save. No special syntax.

### 2. **Check What's Saved**
```bash
python scripts/mem.py list
```

Review periodically to see what's being tracked.

### 3. **Clean Up Manually**
```bash
# Delete old project
python scripts/mem.py delete projects old_project_name

# Delete temp notes
python scripts/mem.py delete temp
```

### 4. **Use Temp for Scratchpad**
```bash
python scripts/mem.py write temp idea "Cool feature: X"
```

Auto-expires in 3 days.

### 5. **Search for Forgotten Context**
```bash
python scripts/mem.py search "professor"
python scripts/mem.py search "API"
```

Find anything you mentioned before.

---

## 📊 What Gets Saved

| You Say | Saved To | Expires |
|---------|----------|---------|
| "Working on Dyno agent" | `projects/dyno` | 60 days |
| "Deadline Friday for COMP 411" | `tasks/task_<ts>` | 14 days |
| "Email prof@unc.edu" | `contacts/prof@unc.edu` | Never |
| "Researching RISC-V" | `research/topic_<ts>` | 30 days |
| Your profile (major, location) | `career/`, `prefs/` | Never |

---

## 🚨 Troubleshooting

### "No memories found"
Run `python scripts/init_memory.py` first.

### "Module not found"
Make sure you're in the `python/` directory:
```bash
cd python/
python scripts/mem.py list
```

### "Permission denied"
Check that `~/.dyno/memory/` is writable:
```bash
ls -la ~/.dyno/memory/
```

### Want to Start Over?
```bash
rm -rf ~/.dyno/memory/
python scripts/init_memory.py
```

---

## 📚 Full Documentation

- **Detailed docs**: `memory/README.md`
- **Implementation summary**: `MEMORY_SYSTEM.md`
- **Code**: `memory/memory_core.py`, `memory/agent_hooks.py`

---

## 🎓 Next: Just Use Your Agent

The memory system runs automatically. No configuration needed.

**Talk to your agent naturally** — it'll remember the important stuff.

---

Built for **Sean Chang** @ UNC Chapel Hill 🐏  
Optimized for token efficiency, zero maintenance, maximum utility.

🚀 **Enjoy your upgraded agent!**
