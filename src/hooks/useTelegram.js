// useTelegram hook - utilities for TMA buttons and haptics
import { useCallback, useEffect, useRef } from 'react';
import { useTMA } from '@/components/providers/TMAProvider';

// Hook for Main Button (bottom action button)
export function useMainButton(text, onClick, options = {}) {
    const { isTelegram } = useTMA();
    const callbackRef = useRef(onClick);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        if (!isTelegram) return;

        const setupButton = async () => {
            try {
                const { mainButton } = await import('@telegram-apps/sdk-react');

                if (!mainButton.isMounted()) {
                    mainButton.mount();
                }

                mainButton.setParams({
                    text: text,
                    isVisible: options.visible !== false,
                    isEnabled: options.enabled !== false,
                    backgroundColor: options.color,
                    textColor: options.textColor,
                });

                const handler = () => callbackRef.current?.();
                mainButton.onClick(handler);

                return () => {
                    mainButton.offClick(handler);
                    if (options.hideOnUnmount !== false) {
                        mainButton.hide();
                    }
                };
            } catch (e) {
                console.warn('Main button setup failed:', e);
            }
        };

        setupButton();
    }, [isTelegram, text, options.visible, options.enabled, options.color, options.textColor]);
}

// Hook for Back Button
export function useBackButton(onBack) {
    const { isTelegram } = useTMA();
    const callbackRef = useRef(onBack);

    useEffect(() => {
        callbackRef.current = onBack;
    }, [onBack]);

    useEffect(() => {
        if (!isTelegram || !onBack) return;

        const setupButton = async () => {
            try {
                const { backButton } = await import('@telegram-apps/sdk-react');

                backButton.show();

                const handler = () => callbackRef.current?.();
                backButton.onClick(handler);

                return () => {
                    backButton.offClick(handler);
                    backButton.hide();
                };
            } catch (e) {
                console.warn('Back button setup failed:', e);
            }
        };

        const cleanup = setupButton();
        return () => cleanup?.then?.(fn => fn?.());
    }, [isTelegram, !!onBack]);
}

// Hook for Haptic Feedback
export function useHaptic() {
    const { isTelegram } = useTMA();

    const impact = useCallback(async (style = 'light') => {
        if (!isTelegram) return;
        try {
            const { hapticFeedback } = await import('@telegram-apps/sdk-react');
            hapticFeedback.impactOccurred(style); // light, medium, heavy, rigid, soft
        } catch { }
    }, [isTelegram]);

    const notification = useCallback(async (type = 'success') => {
        if (!isTelegram) return;
        try {
            const { hapticFeedback } = await import('@telegram-apps/sdk-react');
            hapticFeedback.notificationOccurred(type); // success, warning, error
        } catch { }
    }, [isTelegram]);

    const selection = useCallback(async () => {
        if (!isTelegram) return;
        try {
            const { hapticFeedback } = await import('@telegram-apps/sdk-react');
            hapticFeedback.selectionChanged();
        } catch { }
    }, [isTelegram]);

    return { impact, notification, selection };
}

// Hook for Popup/Alert
export function usePopup() {
    const { isTelegram } = useTMA();

    const showPopup = useCallback(async (title, message, buttons = [{ type: 'ok' }]) => {
        if (!isTelegram) {
            alert(`${title}\n${message}`);
            return 'ok';
        }
        try {
            const { popup } = await import('@telegram-apps/sdk-react');
            const result = await popup.open({ title, message, buttons });
            return result;
        } catch {
            alert(`${title}\n${message}`);
            return 'ok';
        }
    }, [isTelegram]);

    const showAlert = useCallback(async (message) => {
        return showPopup('', message, [{ type: 'ok' }]);
    }, [showPopup]);

    const showConfirm = useCallback(async (message) => {
        if (!isTelegram) {
            return confirm(message);
        }
        try {
            const { popup } = await import('@telegram-apps/sdk-react');
            const result = await popup.open({
                message,
                buttons: [
                    { id: 'cancel', type: 'cancel' },
                    { id: 'ok', type: 'ok' },
                ]
            });
            return result === 'ok';
        } catch {
            return confirm(message);
        }
    }, [isTelegram]);

    return { showPopup, showAlert, showConfirm };
}
