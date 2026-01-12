import { useEffect } from 'react';
import { useTMA } from '@/components/providers/TMAProvider';

/**
 * Hook to synchronize Telegram theme params with CSS variables
 * This creates a "native" feel by using the exact colors from the user's Telegram client
 */
export function useTelegramTheme() {
    const { isTelegram, themeParams, colorScheme } = useTMA();

    useEffect(() => {
        if (!isTelegram || !themeParams) return;

        const root = document.documentElement;

        // Map Telegram theme params to our CSS variables
        // Format: var(--tg-theme-param-name)

        // Backgrounds
        if (themeParams.bg_color) {
            root.style.setProperty('--background', hexToHsl(themeParams.bg_color), 'important');
            root.style.setProperty('--card', hexToHsl(themeParams.secondary_bg_color || themeParams.bg_color), 'important');
            root.style.setProperty('--popover', hexToHsl(themeParams.bg_color), 'important');
        }

        // Text
        if (themeParams.text_color) {
            root.style.setProperty('--foreground', hexToHsl(themeParams.text_color), 'important');
            root.style.setProperty('--card-foreground', hexToHsl(themeParams.text_color), 'important');
            root.style.setProperty('--popover-foreground', hexToHsl(themeParams.text_color), 'important');
        }

        // Hint / Muted
        if (themeParams.hint_color) {
            root.style.setProperty('--muted', hexToHsl(themeParams.secondary_bg_color || '#f5f5f5'), 'important'); // approximation
            root.style.setProperty('--muted-foreground', hexToHsl(themeParams.hint_color), 'important');
        }

        // Primary / Accent (Buttons)
        if (themeParams.button_color) {
            root.style.setProperty('--primary', hexToHsl(themeParams.button_color), 'important');
            root.style.setProperty('--ring', hexToHsl(themeParams.button_color), 'important');
        }

        if (themeParams.button_text_color) {
            root.style.setProperty('--primary-foreground', hexToHsl(themeParams.button_text_color), 'important');
        }

        // Header
        if (themeParams.header_bg_color) {
            // Ensure header matches if needed, though standard components use bg-background
            root.style.setProperty('--header-background', hexToHsl(themeParams.header_bg_color), 'important');
        }

        // Force apply to ensure overrides work
        // root.style.setProperty('color-scheme', colorScheme, 'important');

    }, [isTelegram, themeParams, colorScheme]);
}

/**
 * Helper to convert HEX to HSL string
 */
function hexToHsl(hex) {
    // Strip hash if present
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
        return '0 0% 0%'; // Fallback
    }

    r /= 255;
    g /= 255;
    b /= 255;

    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

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

    return `${h} ${s}% ${l}%`;
}
