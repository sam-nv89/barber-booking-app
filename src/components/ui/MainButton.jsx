import { useEffect, useRef } from 'react';
import { useTMA } from '@/components/providers/TMAProvider';

/**
 * React wrapper for Telegram Main Button
 * @param {Object} props
 * @param {string} props.text - Button text
 * @param {function} props.onClick - Click handler
 * @param {boolean} [props.show=true] - Whether to show the button
 * @param {boolean} [props.enable=true] - Whether the button is active
 * @param {boolean} [props.loading=false] - Show loading spinner
 * @param {string} [props.color] - Custom background color (hex)
 * @param {string} [props.textColor] - Custom text color (hex)
 */
export const MainButton = ({
    text,
    onClick,
    show = true,
    enable = true,
    loading = false,
    color = null,
    textColor = null
}) => {
    const { isTelegram } = useTMA();
    const onClickRef = useRef(onClick);

    // Keep ref updated to avoid re-binding event listener constantly
    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        if (!isTelegram) return;

        const webApp = window.Telegram?.WebApp;
        const mainButton = webApp?.MainButton;

        if (!mainButton) return;

        // Set initial params
        mainButton.setText(text);

        if (color) mainButton.setParams({ color });
        if (textColor) mainButton.setParams({ text_color: textColor });

        if (show) mainButton.show();
        else mainButton.hide();

        if (enable) mainButton.enable();
        else mainButton.disable();

        if (loading) mainButton.showProgress();
        else mainButton.hideProgress();

        // Event listener
        const handleMainButtonClick = () => {
            if (onClickRef.current) {
                onClickRef.current();
            }
        };

        mainButton.onClick(handleMainButtonClick);

        // Cleanup
        return () => {
            mainButton.offClick(handleMainButtonClick);
            mainButton.hide();
            mainButton.hideProgress();
        };
    }, [isTelegram, text, show, enable, loading, color, textColor]);

    // Render nothing in DOM, as this controls the native UI
    return null;
};
