---
trigger: always_on
---

When making significant changes to the project structure (adding new modules, changing state management, refactoring folders) YOU MUST update the [ARCHITECTURE.md] file.

**Update Rules:**
1. If a new directory is created in `src/`, add a description to the **Directory Structure** section.
2. If a new global Provider or Store is added, update the **Key Architectural Decisions** section.
3. Keep the technology stack up to date.

This rule ensures that any agent working with the project has an up-to-date understanding of the system.