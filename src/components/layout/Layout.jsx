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
    // Native Back Button synchronization
    useEffect(() => {
        if (!isTelegram || !window.Telegram?.WebApp?.BackButton) return;

        const webApp = window.Telegram.WebApp;

        // Define root paths where Back Button should be HIDDEN
        const rootPaths = ['/', '/master/dashboard', '/master/dashboard/'];
        const currentPath = location.pathname;
        const isRoot = rootPaths.includes(currentPath);

        const handleBack = () => {
            navigate(-1);
        };

        if (isRoot) {
            webApp.BackButton.hide();
        } else {
            webApp.BackButton.show();
        }

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
