import { useEffect } from 'react';

/**
 * Hook to synchronize Telegram theme params using a dedicated <style> tag
 * Accepts params directly to avoid Context dependency cycles when used inside Provider
 */
export function useTelegramTheme({ isTelegram, themeParams, colorScheme }) {
    useEffect(() => {
        if (!isTelegram || !themeParams) return;

        // Create or get our style tag
        let styleTag = document.getElementById('tma-theme-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'tma-theme-styles';
            document.head.appendChild(styleTag);
        }

        const vars = [];

        // Helper to push var
        const addVar = (name, hex, rawValue = null) => {
            if (rawValue) {
                vars.push(`--${name}: ${rawValue} !important;`);
            } else if (hex) {
                vars.push(`--${name}: ${hexToHsl(hex)} !important;`);
            }
        };

        // Backgrounds
        addVar('background', themeParams.bg_color);
        addVar('card', themeParams.secondary_bg_color || themeParams.bg_color);
        addVar('popover', themeParams.bg_color);

        // Header - Specific handling
        if (themeParams.header_bg_color) {
            addVar('header-background', themeParams.header_bg_color);
            // Also override main background if it looks like a full screen view
            // But usually bg_color is safer for global background
        }

        // Sections (iOS style grouped lists often use these)
        if (themeParams.section_bg_color) {
            addVar('muted', themeParams.section_bg_color);
        }

        // Text
        addVar('foreground', themeParams.text_color);
        addVar('card-foreground', themeParams.text_color);
        addVar('popover-foreground', themeParams.text_color);

        // Hint / Subtitle
        addVar('muted-foreground', themeParams.hint_color);

        // Primary / Accent (Buttons)
        addVar('primary', themeParams.button_color);
        addVar('ring', themeParams.button_color);

        if (themeParams.button_text_color) {
            addVar('primary-foreground', themeParams.button_text_color);
        }

        /**
         * Smart Border Calculation -> Now "High Contrast Alpha"
         * User feedback: "Unreadable", "Blends in".
         * Fix: Use pure White/Black with alpha transparency.
         * This guarantees visibility on ANY background color (solid, gradient, etc).
         */

        let borderString;
        let bgLevel1; // Cards
        let bgLevel2; // Inputs, Secondary

        if (colorScheme === 'dark') {
            // Dark Mode Surfaces
            // Level 0 (Background): Default theme bg
            // Level 1 (Card): White 6% opacity (Material Design elevation) -> hsl(0 0% 100% / 0.06)
            // Level 2 (Input/Nested): White 12% opacity -> hsl(0 0% 100% / 0.12)

            borderString = '0 0% 100% / 0.15';
            bgLevel1 = '0 0% 100% / 0.06';
            bgLevel2 = '0 0% 100% / 0.12';
        } else {
            // Light Mode Surfaces
            // Level 0 (Background): Default theme bg
            // Level 1 (Card): Pure White
            // Level 2 (Input): Light Gray

            borderString = '0 0% 0% / 0.15'; // Keep border contrast high
            bgLevel1 = '0 0% 100%'; // White
            bgLevel2 = '0 0% 96%'; // Light Gray (~#F3F4F6)
        }

        addVar('border', null, borderString);
        addVar('input', null, borderString);

        // New Surface Vars
        addVar('bg-level-1', null, bgLevel1);
        addVar('bg-level-2', null, bgLevel2);

        // Ring needs to be solid for focus visibility usually, but let's try matching border
        // or use the button color if available
        addVar('ring', themeParams.button_color || null, borderString);

        // Secondary / Accent

        // Secondary / Accent
        if (themeParams.link_color) {
            // Optional: use link color for accents
            // addVar('accent', themeParams.link_color); 
        }

        // Construct CSS rule
        // targeting :root and .dark (to override Tailwind class specificity)
        const css = `
            :root, .dark, body {
                ${vars.join('\n                ')}
                color-scheme: ${colorScheme} !important;
            }

            /* Fix native time inputs */
            [type="time"]::-webkit-calendar-picker-indicator {
                filter: ${colorScheme === 'dark' ? 'invert(1)' : 'invert(0)'};
                opacity: 0.6;
                cursor: pointer;
            }
        `;

        styleTag.textContent = css;

        // Cleanup isn't strictly necessary as we want theme to persist, 
        // but if we unmount the provider we might want to clean up.
        // For now, let's leave it to avoid flashing.

    }, [isTelegram, themeParams, colorScheme]);
}

/**
 * Helper to convert HEX to HSL object {h, s, l}
 */
function hexToHslObject(hex) {
    if (!hex) return { h: 0, s: 0, l: 0 };
    hex = hex.replace(/^#/, '');

    let r = 0, g = 0, b = 0;

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return { h: 0, s: 0, l: 0 };
    }

    r /= 255; g /= 255; b /= 255;

    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}

/**
 * Helper to convert HEX to HSL string
 * Returns "H S% L%" format
 */
function hexToHsl(hex) {
    const { h, s, l } = hexToHslObject(hex);
    return `${h} ${s}% ${l}%`;
}
