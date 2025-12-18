// useTelegram hooks - using native Telegram WebApp API
import { useCallback, useEffect, useRef } from 'react';

// Get WebApp instance
const getWebApp = () => window.Telegram?.WebApp;

// Check if in Telegram directly (more reliable than context timing)
const isInTelegram = () => !!getWebApp();

// Hook for Main Button (bottom action button)
export function useMainButton(text, onClick, options = {}) {
    const callbackRef = useRef(onClick);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        const webApp = getWebApp();
        if (!webApp?.MainButton) {
            console.log('[TMA] MainButton not available');
            return;
        }

        const mainButton = webApp.MainButton;
        console.log('[TMA] Setting up MainButton:', { text, visible: options.visible });

        // Configure button
        mainButton.setText(text);

        if (options.color) {
            mainButton.setParams({ color: options.color });
        }
        if (options.textColor) {
            mainButton.setParams({ text_color: options.textColor });
        }

        // Show/hide based on options
        if (options.visible === false) {
            mainButton.hide();
            console.log('[TMA] MainButton hidden');
        } else {
            mainButton.show();
            console.log('[TMA] MainButton shown');
        }

        // Enable/disable
        if (options.enabled === false) {
            mainButton.disable();
        } else {
            mainButton.enable();
        }

        // Click handler
        const handler = () => {
            console.log('[TMA] MainButton clicked');
            callbackRef.current?.();
        };
        mainButton.onClick(handler);

        return () => {
            mainButton.offClick(handler);
            if (options.hideOnUnmount !== false) {
                mainButton.hide();
            }
        };
    }, [text, options.visible, options.enabled, options.color, options.textColor, options.hideOnUnmount]);
}

// Hook for Back Button
export function useBackButton(onBack) {
    const callbackRef = useRef(onBack);

    useEffect(() => {
        callbackRef.current = onBack;
    }, [onBack]);

    useEffect(() => {
        const webApp = getWebApp();
        if (!onBack || !webApp?.BackButton) return;

        const backButton = webApp.BackButton;
        backButton.show();
        console.log('[TMA] BackButton shown');

        const handler = () => {
            console.log('[TMA] BackButton clicked');
            callbackRef.current?.();
        };
        backButton.onClick(handler);

        return () => {
            backButton.offClick(handler);
            backButton.hide();
        };
    }, [!!onBack]);
}

// Hook for Haptic Feedback
export function useHaptic() {
    const impact = useCallback((style = 'light') => {
        const webApp = getWebApp();
        if (!webApp?.HapticFeedback) return;
        try {
            webApp.HapticFeedback.impactOccurred(style);
            console.log('[TMA] Haptic impact:', style);
        } catch { }
    }, []);

    const notification = useCallback((type = 'success') => {
        const webApp = getWebApp();
        if (!webApp?.HapticFeedback) return;
        try {
            webApp.HapticFeedback.notificationOccurred(type);
        } catch { }
    }, []);

    const selection = useCallback(() => {
        const webApp = getWebApp();
        if (!webApp?.HapticFeedback) return;
        try {
            webApp.HapticFeedback.selectionChanged();
        } catch { }
    }, []);

    return { impact, notification, selection };
}

// Hook for Popup/Alert
export function usePopup() {
    const showPopup = useCallback((title, message, buttons = [{ type: 'ok' }]) => {
        const webApp = getWebApp();
        if (!webApp?.showPopup) {
            alert(`${title}\n${message}`);
            return Promise.resolve('ok');
        }
        return new Promise((resolve) => {
            webApp.showPopup({ title, message, buttons }, (buttonId) => {
                resolve(buttonId || 'ok');
            });
        });
    }, []);

    const showAlert = useCallback((message) => {
        const webApp = getWebApp();
        if (!webApp?.showAlert) {
            alert(message);
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            webApp.showAlert(message, resolve);
        });
    }, []);

    const showConfirm = useCallback((message) => {
        const webApp = getWebApp();
        if (!webApp?.showConfirm) {
            return Promise.resolve(confirm(message));
        }
        return new Promise((resolve) => {
            webApp.showConfirm(message, resolve);
        });
    }, []);

    return { showPopup, showAlert, showConfirm };
}

// Hook for closing the Mini App
export function useCloseMiniApp() {
    const close = useCallback(() => {
        const webApp = getWebApp();
        if (webApp?.close) {
            webApp.close();
        }
    }, []);

    return close;
}
