# Development Log

This file tracks the detailed implementation history of the project.
**AI Agents:** Please read `AI_MEMO.md` for instructions on how to maintain this file.

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
