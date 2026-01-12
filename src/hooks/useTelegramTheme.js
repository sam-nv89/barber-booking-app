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
            root.style.setProperty('--background', hexToHsl(themeParams.bg_color));
            root.style.setProperty('--card', hexToHsl(themeParams.secondary_bg_color || themeParams.bg_color));
            root.style.setProperty('--popover', hexToHsl(themeParams.bg_color));
        }

        // Text
        if (themeParams.text_color) {
            root.style.setProperty('--foreground', hexToHsl(themeParams.text_color));
            root.style.setProperty('--card-foreground', hexToHsl(themeParams.text_color));
            root.style.setProperty('--popover-foreground', hexToHsl(themeParams.text_color));
        }

        // Hint / Muted
        if (themeParams.hint_color) {
            root.style.setProperty('--muted', hexToHsl(themeParams.secondary_bg_color || '#f5f5f5')); // approximation
            root.style.setProperty('--muted-foreground', hexToHsl(themeParams.hint_color));
        }

        // Primary / Accent (Buttons)
        if (themeParams.button_color) {
            root.style.setProperty('--primary', hexToHsl(themeParams.button_color));
            root.style.setProperty('--ring', hexToHsl(themeParams.button_color));
        }

        if (themeParams.button_text_color) {
            root.style.setProperty('--primary-foreground', hexToHsl(themeParams.button_text_color));
        }

        // Links / Accent
        if (themeParams.link_color) {
            // We can use link color for some accents if needed
            // root.style.setProperty('--accent', hexToHsl(themeParams.link_color));
        }

        // Force cleanup when unmounting or switching context - though usually this persists
        return () => {
            // Optional: reset styles if we want to fallback to defaults when leaving TMA mode
            // For now, we keep them to avoid flashing
        }

    }, [isTelegram, themeParams, colorScheme]);
}

/**
 * Helper to convert HEX to HSL string (which Tailwind uses for variables)
 * Tailwind vars are often in format "222.2 84% 4.9%" (without hsl() wrapper)
 */
function hexToHsl(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }

    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta === 0)
        h = 0;
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    else if (cmax === g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    // Return format compatible with ShadCN/Tailwind CSS variables
    // e.g., "222.2 84% 4.9%"
    return `${h} ${s}% ${l}%`;
}
