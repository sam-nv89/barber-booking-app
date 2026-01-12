import { useCallback } from 'react';

/**
 * Hook to access Telegram Mini App Haptic Feedback
 */
export function useHaptic() {
    const webApp = window.Telegram?.WebApp;

    const impactOccurred = useCallback((style) => {
        // style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
        if (webApp?.HapticFeedback && webApp?.isVersionAtLeast('6.1')) {
            webApp.HapticFeedback.impactOccurred(style);
        } else {
            console.log(`[Haptic] Impact: ${style}`);
        }
    }, [webApp]);

    const notificationOccurred = useCallback((type) => {
        // type: 'error' | 'success' | 'warning'
        if (webApp?.HapticFeedback && webApp?.isVersionAtLeast('6.1')) {
            webApp.HapticFeedback.notificationOccurred(type);
        } else {
            console.log(`[Haptic] Notification: ${type}`);
        }
    }, [webApp]);

    const selectionChanged = useCallback(() => {
        if (webApp?.HapticFeedback && webApp?.isVersionAtLeast('6.1')) {
            webApp.HapticFeedback.selectionChanged();
        } else {
            console.log('[Haptic] Selection Changed');
        }
    }, [webApp]);

    return {
        impactOccurred,
        notificationOccurred,
        selectionChanged
    };
}
