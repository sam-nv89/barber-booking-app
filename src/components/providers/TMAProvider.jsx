// TMA Provider - wraps app with Telegram Mini App context
// Provides fallback for browser environment
import React, { createContext, useContext, useEffect, useState } from 'react';

// Check if running inside Telegram
const isTMA = () => {
    try {
        return window.Telegram?.WebApp !== undefined ||
            window.location.hash.includes('tgWebAppData') ||
            window.parent !== window;
    } catch {
        return false;
    }
};

const TMAContext = createContext({
    isTelegram: false,
    user: null,
    themeParams: null,
    colorScheme: 'light',
    ready: false,
});

export function TMAProvider({ children }) {
    const [state, setState] = useState({
        isTelegram: false,
        user: null,
        themeParams: null,
        colorScheme: 'light',
        ready: false,
    });

    useEffect(() => {
        const initTMA = async () => {
            if (!isTMA()) {
                // Browser fallback
                setState(prev => ({ ...prev, ready: true }));
                return;
            }

            try {
                // Dynamic import to avoid SSR issues
                const { init, miniApp, themeParams, initData, backButton } = await import('@telegram-apps/sdk-react');

                // Initialize SDK
                init();

                // Mount components synchronously
                miniApp.mountSync();
                themeParams.mountSync();
                backButton.mount();

                // Restore init data
                initData.restore();

                // Get user data
                const user = initData.user();

                // Get theme
                const theme = themeParams.state();
                const isDark = miniApp.isDark?.() ?? false;

                // Apply Telegram CSS variables
                if (theme) {
                    applyThemeVariables(theme);
                }

                // Signal ready
                miniApp.ready();

                setState({
                    isTelegram: true,
                    user: user ? {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                        photoUrl: user.photoUrl,
                        languageCode: user.languageCode,
                    } : null,
                    themeParams: theme,
                    colorScheme: isDark ? 'dark' : 'light',
                    ready: true,
                });

            } catch (error) {
                console.warn('TMA init failed, using browser mode:', error);
                setState(prev => ({ ...prev, ready: true }));
            }
        };

        initTMA();
    }, []);

    return (
        <TMAContext.Provider value={state}>
            {children}
        </TMAContext.Provider>
    );
}

// Apply Telegram theme variables to CSS
function applyThemeVariables(theme) {
    const root = document.documentElement;

    // Map TMA theme to our CSS variables
    const mappings = {
        '--tg-bg': theme.backgroundColor,
        '--tg-secondary-bg': theme.secondaryBackgroundColor,
        '--tg-text': theme.textColor,
        '--tg-hint': theme.hintColor,
        '--tg-link': theme.linkColor,
        '--tg-button': theme.buttonColor,
        '--tg-button-text': theme.buttonTextColor,
        '--tg-header': theme.headerBackgroundColor,
        '--tg-accent': theme.accentTextColor,
        '--tg-destructive': theme.destructiveTextColor,
    };

    Object.entries(mappings).forEach(([key, value]) => {
        if (value) {
            root.style.setProperty(key, value);
        }
    });
}

export function useTMA() {
    return useContext(TMAContext);
}

export { TMAContext };
