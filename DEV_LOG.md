# Development Log

This file tracks the detailed implementation history of the project.
**AI Agents:** Please read `AI_MEMO.md` for instructions on how to maintain this file.

---

## [2026-01-10] - Vercel Integration & Automation
**Status:** ✅ Completed

### Changes
*   **Deployment**: Connected repository to Vercel for continuous deployment.
*   **TMA Integration**: Configured Vercel hosting to sync with Telegram Mini App bot.
*   **Workflow**: Established "Push to Git -> Auto-Deploy to Vercel" pipeline.

### Technical Details
*   **Autonomy**: TMA now works autonomously 24/7 via Vercel hosting.
*   **CI/CD**: Updates are live in Telegram immediately after `git push`.

---

## [2026-01-11] - Chart Interaction & Design Improvements
**Status:** ✅ Completed

### Changes
*   **`src/pages/master/Analytics.jsx`**:
    *   Reverted Y-axis labels to full numbers (removed currency symbol).
    *   Implemented `onTouchStart`, `onTouchMove`, `onTouchEnd` for chart tooltips (following finger on swipe).
    *   Fixed overflow issues with `CardContent` and `padding`.
*   **`src/pages/master/Dashboard.jsx`**:
    *   **New Design:** Replaced simple bar chart with "Dynamics" chart (SVG trend line + gradient bars).
    *   **Touch Support:** Added touch handlers for improved mobile interaction.
    *   **Smart Labels:** Implemented adaptive month formatting (Full `LLLL` vs Short `LLL`) based on data density (>4 items).
    *   **Timeline:** Added year brackets/timeline below the chart for 'all time' view (similar to Analytics).
    *   **Scroll:** Fixed horizontal scrolling on mobile (removed `touch-none` from scrollable areas).
    *   **Translations:** Fixed `dashboard.all` -> `dashboard.allTime` and added period indicator to title.

### Technical Details
*   **Chart Logic:**
    *   Used `date-fns` for locale-aware formatting (`ru` locale).
    *   Implemented custom SVG drawing for trend lines using `bezierCurveTo` (implied by design description, actual implementation used path).
    *   Added heuristic `chartData.length > 4` to toggle between full and short month names to prevent overlap on mobile.
*   **Touch Events:**
    *   Custom `onTouchMove` logic calculates cursor position relative to chart width to trigger tooltips, mimicking `onMouseMove`.

### Next Steps
*   Monitor user feedback on chart performance on older devices.

---

## [2026-01-11] - Master Studio Header Update
**Status:** ✅ Completed

### Changes
*   **`src/pages/master/Dashboard.jsx`**: Replaced legacy `ClockWidget` with `SalonInfo` (clock enabled, actions hidden).
*   **`src/components/features/SalonInfo.jsx`**: Added `hideActions` prop to conditionally hide navigation/contact buttons.
*   **`src/components/features/ClockWidget.jsx`**: Deleted unused component.

### Technical Details
*   Reused `SalonInfo` component for visual consistency.
*   Passed `hideActions={true}` in Dashboard to remove "Contact" and "Directions" sections, keeping only the clock and salon identity.

### UI Refinements (Compact Mode)
*   **`src/components/features/SalonInfo.jsx`**: Added `compact` prop to reduce padding and adjust font sizes for a sleeker look.
*   **`src/pages/master/Dashboard.jsx`**: Enabled `compact` mode for the studio header.

---

## [2026-01-09 17:55] - Timeline & Booking Enhancements
**Status:** ✅ Completed

### Changes
*   **`src/pages/master/Records.jsx`**: 
    *   Fixed timeline layout regression (vertical stacking of headers).
    *   Removed custom JS-based scroll indicator buttons.
    *   Added `overlay-scrollbar` class for native styling.
*   **`src/index.css`**: 
    *   Added `.overlay-scrollbar` styles for transparent/hover-visible scrollbars.
    *   Hidden `::-webkit-scrollbar-button` to remove default OS arrow buttons.
*   **`src/components/features/MasterBookingModal.jsx`**: 
    *   Updated `handleSave` to pass `null` when "Any Specialist" (`'any'`) is selected.
*   **`src/store/useStore.js`**: 
    *   Updated `addAppointment` to trigger `getNextAvailableMaster` (Round Robin) when no master is specified (auto-assignment).
*   **`README.md`**: 
    *   Documented new features (Overlay Scrollbars, Auto-assignment).

### Technical Details
*   **Scrollbars**: Moved from custom UI elements to native CSS implementation for better performance and standard feel (macOS style).
*   **Auto-Assignment**: Logic moved to Store action (`addAppointment`) to ensure it works regardless of UI entry point, ensuring "Any Specialist" always resolves to a concrete master ID on creation.

---

## [2026-01-12] - Terminal Stability Fix
**Status:** ✅ Completed

### Changes
*   **`.vscode/settings.json`**: Created workspace settings to force compatibility mode for the terminal.
    *   Disabled `terminal.integrated.windowsEnableConpty` to fix freezing issues.
    *   Disabled `terminal.integrated.gpuAcceleration`.

### Technical Details
*   **Issue:** Terminal commands were hanging due to ConPTY/rendering issues on Windows.
*   **Fix:** Manually applied settings to bypass ConPTY. Verified with `hostname` command.

### Next Steps
*   **GitHub Integration:** Pending session restart to activate MCP tools.

---

## [2026-01-12] - Deep TMA Integration (Native Feel)
**Status:** ✅ Completed

### Changes
*   **`src/hooks/useTelegramTheme.js`**:
    *   Created hook to synchronize app colors with Telegram `themeParams`.
    *   Dynamic mapping of `bg_color` -> `--background`, `text_color` -> `--foreground`, `button_color` -> `--primary`.
*   **`src/components/providers/TMAProvider.jsx`**:
    *   Integrated `useTelegramTheme` for automatic theming.
*   **`src/hooks/useHaptic.js`**:
    *   Added `impactOccurred`, `notificationOccurred` for native vibration feedback.
*   **`src/components/layout/Layout.jsx`**:
    *   Implemented native **BackButton** support (hidden on root, visible on inner pages).
    *   Connected native Back button to `navigate(-1)`.
*   **`src/components/ui/MainButton.jsx`**:
    *   Created React wrapper for the native **MainButton** (blue bottom button).
    *   Supports `loading`, `disabled` states and custom colors.

### Technical Details
*   **Native Integration**: The app now feels like a native part of Telegram, respecting user themes (dark/light/custom) effectively.
*   **Performance**: Used direct CSS variable injection on `document.documentElement` for instant theme switching without re-renders.
