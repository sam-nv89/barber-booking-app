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

---

## 🔴 PENDING TASKS (2026-01-15)

> **📢 INSTRUCTION FOR NEXT AI AGENT:**
> Пользователь сообщает: таблица `clients` в Supabase НЕ обновляется при изменении имени в Profile.
> `master_profiles` — обновляется корректно ✅
> `clients` — НЕ обновляется ❌
> 
> **Твоя задача:** Выяснить почему sync в `clients` не работает и исправить.

### 1. Clients Table Sync Not Working
**Priority:** High
**Context:** Имя клиента не синхронизируется с таблицей `clients` в Supabase.

**Что уже сделано:**
1.  `setUser` теперь синхронизирует с `master_profiles` (работает ✅).
2.  Добавлен sync для `clients` по `phone` (строки 272-293 в `useStore.js`).
3.  Пробуем два формата телефона (formatted + raw digits).
4.  **Всё равно не работает!**

**Возможные причины:**
1.  В `clients` таблице телефон хранится в третьем формате (не formatted и не raw).
2.  Supabase RLS (Row Level Security) блокирует UPDATE.
3.  Запись в `clients` принадлежит другому `master_id`.
4.  Нет записи с таким телефоном вообще.

**Что нужно сделать:**
1.  Проверить в Supabase Dashboard: какой формат телефона хранится в `clients`.
2.  Проверить RLS policies на таблице `clients`.
3.  Убедиться что запись существует и `master_id` совпадает.
4.  Возможно добавить alert с результатом UPDATE (rows affected).

**Файлы:**
- `src/store/useStore.js` — sync-логика (строки 272-293)

**Ссылки:**
- DEV_LOG.md — последние записи о synс fixes
