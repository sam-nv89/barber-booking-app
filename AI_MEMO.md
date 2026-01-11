# AI Synchronization Protocol

## 🚀 Instructions for AI Agent
**System Instruction:** You are working on a distributed project where multiple devices/sessions contribute to the code. The chat history is NOT synchronized. Your "memory" of recent changes comes from `DEV_LOG.md`.

### 1. 📖 Start of Session
*   **ALWAYS** read `DEV_LOG.md` first to see what was done recently by other sessions.
*   Check `DEV_LOG.md` against the current file state if needed to ensure you have the latest code.

### 2. 📝 End of Task (Mandatory)
*   **IMMEDIATELY** after finishing a task (implementing a feature, fixing a bug), you **MUST** append a detailed entry to `DEV_LOG.md`.
*   **DO NOT** overwrite the file. Use "append" or simply write the new content at the end.
*   **DO NOT** summarize vaguely. Be specific about files touched and logic changed.

### 3. 📋 Log Format
Follow this Markdown format for every entry:

```markdown
## [YYYY-MM-DD HH:MM] - [Task Name]
**Changes:**
- `path/to/file.js`: Brief description of what changed (e.g. *Added onClick handler*, *Refactored math logic*).
- `path/to/another_file.jsx`: ...

**Technical Details:**
- [Explain complex logic changes or architectural decisions here]
- [Mention new libs added]

**Status:** [✅ Completed / 🚧 WiP / 🐞 Fixed]
```

## 4. 🛑 Rules
*   **NEVER** clear `DEV_LOG.md`.
*   **NEVER** modify past entries.
*   If you find a conflict between `DEV_LOG.md` and actual code, notify the user.

---
*User Note: Please show this file to the AI at the start of a session on a new device.*
