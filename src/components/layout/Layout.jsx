import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTMA } from '@/components/providers/TMAProvider';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { FeedbackPrompt } from '@/components/features/FeedbackPrompt';

export const Layout = ({ children }) => {
    const { isTelegram } = useTMA();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isTelegram) return;

        const webApp = window.Telegram?.WebApp;
        if (!webApp?.BackButton) return;

        // Show back button on all pages except root
        // Also check if we have history (state not null) or if we are deep in navigation
        const canGoBack = location.pathname !== '/' && location.pathname !== '/master/dashboard';

        if (canGoBack) {
            webApp.BackButton.show();
        } else {
            webApp.BackButton.hide();
        }

        const handleBack = () => {
            navigate(-1);
        };

        webApp.BackButton.onClick(handleBack);

        return () => {
            webApp.BackButton.offClick(handleBack);
        };
    }, [isTelegram, location.pathname, navigate]);

    return (
        <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
            <Header />
            <main className="flex-1 container px-4 py-6 pb-24">
                {children}
            </main>
            <FeedbackPrompt />
            <BottomNav />
        </div>
    );
};
