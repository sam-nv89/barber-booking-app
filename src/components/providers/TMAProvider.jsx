// TMA Provider - wraps app with Telegram Mini App context
// Provides fallback for browser environment
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';

const TMAContext = createContext({
    isTelegram: false,
    telegramUser: null,
    themeParams: null,
    colorScheme: 'light',
    platform: 'unknown',
    ready: true,
    requestPhonePermission: () => Promise.resolve(null),
});

export function TMAProvider({ children }) {
    const [state, setState] = useState({
        isTelegram: false,
        telegramUser: null,
        themeParams: null,
        colorScheme: 'light',
        platform: 'unknown',
        ready: true,
    });

    const { user, setUser } = useStore();

    // Initialize theme synchronization
    useTelegramTheme();

    // Function to request phone permission
    const requestPhonePermission = useCallback(async () => {
        const webApp = window.Telegram?.WebApp;
        if (!webApp) {
            console.log('[TMA] No WebApp available');
            return null;
        }

        return new Promise((resolve) => {
            try {
                // Set up event handler for contact received
                const handleContact = (event) => {
                    console.log('[TMA] Contact event received:', event);
                    if (event?.responseUnsafe?.contact) {
                        const contact = event.responseUnsafe.contact;
                        const phone = (contact.phone_number || '').replace(/^\+/, '');
                        if (phone) {
                            setUser({ phone });
                            console.log('[TMA] Phone saved:', phone);
                            resolve(phone);
                            return;
                        }
                    }
                    console.log('[TMA] Contact request failed or declined');
                    resolve(null);
                };

                // Try different methods depending on Telegram version
                if (typeof webApp.requestContact === 'function') {
                    console.log('[TMA] Calling requestContact...');
                    // Method 1: Callback style (older API)
                    webApp.requestContact((sent) => {
                        console.log('[TMA] requestContact callback, sent:', sent);
                        // The actual contact data comes via event or popup result
                        if (!sent) {
                            resolve(null);
                        }
                        // If sent=true, we need to wait for the data
                        // Some versions return data in callback, some via events
                    });

                    // Also listen for popup events as fallback
                    webApp.onEvent('contactRequested', (result) => {
                        console.log('[TMA] contactRequested event:', result);
                        if (result?.status === 'sent' || result?.status === 'shared') {
                            // Contact was shared, the data should be in result
                            resolve(result);
                        } else {
                            resolve(null);
                        }
                    });

                    // Timeout fallback
                    setTimeout(() => {
                        console.log('[TMA] Phone request timeout');
                        resolve(null);
                    }, 30000);
                } else {
                    console.log('[TMA] requestContact not available');
                    resolve(null);
                }
            } catch (error) {
                console.warn('[TMA] requestContact error:', error);
                resolve(null);
            }
        });
    }, [setUser]);

    useEffect(() => {
        const initTMA = async () => {
            const webApp = window.Telegram?.WebApp;

            if (!webApp) {
                console.log('[TMA] Not in Telegram, using browser mode');
                return;
            }

            try {
                webApp.ready();
                webApp.expand();

                // Get user data from initDataUnsafe
                const tgUser = webApp.initDataUnsafe?.user;
                const colorScheme = webApp.colorScheme || 'light';
                const themeParams = webApp.themeParams || {};
                const platform = webApp.platform || 'unknown';

                // Apply theme
                if (colorScheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }

                const telegramUser = tgUser ? {
                    id: tgUser.id,
                    firstName: tgUser.first_name,
                    lastName: tgUser.last_name,
                    username: tgUser.username,
                    photoUrl: tgUser.photo_url,
                    languageCode: tgUser.language_code,
                } : null;

                setState({
                    isTelegram: true,
                    telegramUser,
                    themeParams,
                    colorScheme,
                    platform,
                    ready: true,
                });

                // Auto-fill user profile from Telegram
                if (telegramUser) {
                    const fullName = [telegramUser.firstName, telegramUser.lastName].filter(Boolean).join(' ');

                    // ALWAYS update from Telegram (overwrite old defaults)
                    const updates = {
                        telegramId: telegramUser.id,
                        telegramUsername: telegramUser.username,
                    };

                    // Always set name from Telegram (overwrite defaults like "Alex")
                    if (fullName) {
                        updates.name = fullName;
                    }

                    // Always set avatar from Telegram if available
                    if (telegramUser.photoUrl && !user.avatar?.startsWith('data:')) {
                        updates.avatar = telegramUser.photoUrl;
                    }

                    // Apply updates
                    setUser(updates);
                    console.log('[TMA] User synced:', updates);
                    // No auto phone request - user controls this manually in Profile
                }

            } catch (error) {
                console.warn('[TMA] Init error:', error);
            }
        };

        setTimeout(initTMA, 100);
    }, []);

    const contextValue = {
        ...state,
        requestPhonePermission,
    };

    return (
        <TMAContext.Provider value={contextValue}>
            {children}
        </TMAContext.Provider>
    );
}

export function useTMA() {
    return useContext(TMAContext);
}

export function useTelegramUser() {
    const { telegramUser } = useTMA();
    return telegramUser;
}

export { TMAContext };
