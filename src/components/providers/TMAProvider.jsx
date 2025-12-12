// TMA Provider - wraps app with Telegram Mini App context
// Provides fallback for browser environment
import React, { createContext, useContext, useEffect, useState } from 'react';

const TMAContext = createContext({
    isTelegram: false,
    user: null,
    themeParams: null,
    colorScheme: 'light',
    ready: true, // Default to ready
});

export function TMAProvider({ children }) {
    const [state, setState] = useState({
        isTelegram: false,
        user: null,
        themeParams: null,
        colorScheme: 'light',
        ready: true, // Start as ready to prevent blocking
    });

    useEffect(() => {
        const initTMA = async () => {
            // Check if we're in Telegram WebView
            const webApp = window.Telegram?.WebApp;

            if (!webApp) {
                console.log('Not in Telegram, using browser mode');
                return; // Keep default state
            }

            try {
                // Use native Telegram WebApp API (more reliable)
                webApp.ready();
                webApp.expand();

                // Get user data
                const user = webApp.initDataUnsafe?.user;

                // Get theme
                const colorScheme = webApp.colorScheme || 'light';
                const themeParams = webApp.themeParams || {};

                // Apply theme
                if (colorScheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }

                setState({
                    isTelegram: true,
                    user: user ? {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        username: user.username,
                        photoUrl: user.photo_url,
                        languageCode: user.language_code,
                    } : null,
                    themeParams,
                    colorScheme,
                    ready: true,
                });

                console.log('TMA initialized:', { user: user?.first_name, colorScheme });

            } catch (error) {
                console.warn('TMA init error:', error);
                // Keep ready: true so app still loads
            }
        };

        // Small delay to ensure Telegram WebApp is injected
        setTimeout(initTMA, 100);
    }, []);

    return (
        <TMAContext.Provider value={state}>
            {children}
        </TMAContext.Provider>
    );
}

export function useTMA() {
    return useContext(TMAContext);
}

export { TMAContext };

