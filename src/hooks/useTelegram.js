// useTelegram hooks - using native Telegram WebApp API
import { useCallback, useEffect, useRef } from 'react';
import { useTMA } from '@/components/providers/TMAProvider';

// Get WebApp instance
const getWebApp = () => window.Telegram?.WebApp;

// Hook for Main Button (bottom action button)
export function useMainButton(text, onClick, options = {}) {
    const { isTelegram } = useTMA();
    const callbackRef = useRef(onClick);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.MainButton) return;

        const mainButton = webApp.MainButton;

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
        } else {
            mainButton.show();
        }

        // Enable/disable
        if (options.enabled === false) {
            mainButton.disable();
        } else {
            mainButton.enable();
        }

        // Click handler
        const handler = () => callbackRef.current?.();
        mainButton.onClick(handler);

        return () => {
            mainButton.offClick(handler);
            if (options.hideOnUnmount !== false) {
                mainButton.hide();
            }
        };
    }, [isTelegram, text, options.visible, options.enabled, options.color, options.textColor, options.hideOnUnmount]);
}

// Hook for Back Button
export function useBackButton(onBack) {
    const { isTelegram } = useTMA();
    const callbackRef = useRef(onBack);

    useEffect(() => {
        callbackRef.current = onBack;
    }, [onBack]);

    useEffect(() => {
        const webApp = getWebApp();
        if (!isTelegram || !onBack || !webApp?.BackButton) return;

        const backButton = webApp.BackButton;
        backButton.show();

        const handler = () => callbackRef.current?.();
        backButton.onClick(handler);

        return () => {
            backButton.offClick(handler);
            backButton.hide();
        };
    }, [isTelegram, !!onBack]);
}

// Hook for Haptic Feedback
export function useHaptic() {
    const { isTelegram } = useTMA();

    const impact = useCallback((style = 'light') => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.HapticFeedback) return;
        try {
            webApp.HapticFeedback.impactOccurred(style); // light, medium, heavy, rigid, soft
        } catch { }
    }, [isTelegram]);

    const notification = useCallback((type = 'success') => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.HapticFeedback) return;
        try {
            webApp.HapticFeedback.notificationOccurred(type); // success, warning, error
        } catch { }
    }, [isTelegram]);

    const selection = useCallback(() => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.HapticFeedback) return;
        try {
            webApp.HapticFeedback.selectionChanged();
        } catch { }
    }, [isTelegram]);

    return { impact, notification, selection };
}

// Hook for Popup/Alert
export function usePopup() {
    const { isTelegram } = useTMA();

    const showPopup = useCallback((title, message, buttons = [{ type: 'ok' }]) => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.showPopup) {
            alert(`${title}\n${message}`);
            return Promise.resolve('ok');
        }
        return new Promise((resolve) => {
            webApp.showPopup({ title, message, buttons }, (buttonId) => {
                resolve(buttonId || 'ok');
            });
        });
    }, [isTelegram]);

    const showAlert = useCallback((message) => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.showAlert) {
            alert(message);
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            webApp.showAlert(message, resolve);
        });
    }, [isTelegram]);

    const showConfirm = useCallback((message) => {
        const webApp = getWebApp();
        if (!isTelegram || !webApp?.showConfirm) {
            return Promise.resolve(confirm(message));
        }
        return new Promise((resolve) => {
            webApp.showConfirm(message, resolve);
        });
    }, [isTelegram]);

    return { showPopup, showAlert, showConfirm };
}

// Hook for closing the Mini App
export function useCloseMiniApp() {
    const { isTelegram } = useTMA();

    const close = useCallback(() => {
        const webApp = getWebApp();
        if (isTelegram && webApp?.close) {
            webApp.close();
        }
    }, [isTelegram]);

    return close;
}

