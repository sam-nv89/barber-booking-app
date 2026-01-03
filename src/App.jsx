import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useStore } from '@/store/useStore'
import { DEFAULT_SCHEDULE } from '@/lib/constants'
import { BookingWizard } from '@/pages/client/BookingWizard'
import { Visits } from '@/pages/client/Visits'
import { Profile } from '@/pages/client/Profile'
import { Records } from '@/pages/master/Records'
import { Settings } from '@/pages/master/Settings'
import { Dashboard } from '@/pages/master/Dashboard'
import { Reviews } from '@/pages/master/Reviews'
import { ClientList } from '@/pages/master/ClientList'
import { Analytics } from '@/pages/master/Analytics'
import { CheckIn } from '@/pages/master/CheckIn'
import { TMAProvider, useTMA } from '@/components/providers/TMAProvider'
import { WelcomeAnimation } from '@/components/features/WelcomeAnimation'

function AppContent() {
    const { theme, setTheme, user } = useStore();
    const { isTelegram, colorScheme, ready } = useTMA();
    const [showWelcome, setShowWelcome] = useState(false);

    // Check if this is a new session and user has a name
    useEffect(() => {
        const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome && user?.name && ready) {
            setShowWelcome(true);
            sessionStorage.setItem('hasSeenWelcome', 'true');
        }
    }, [user?.name, ready]);

    useEffect(() => {
        // Sync theme with Telegram if in TMA
        if (isTelegram && colorScheme) {
            setTheme(colorScheme);
        }
    }, [isTelegram, colorScheme, setTheme]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        }
    }, [theme]);

    // Migration for new schedule format
    const { salonSettings, setSalonSettings } = useStore();
    useEffect(() => {
        if (salonSettings?.schedule && !salonSettings.schedule.monday) {
            console.log('Migrating schedule to new format...');
            setSalonSettings({ ...salonSettings, schedule: DEFAULT_SCHEDULE });
        }
    }, [salonSettings, setSalonSettings]);

    // Show welcome animation for new session
    if (showWelcome) {
        return <WelcomeAnimation onComplete={() => setShowWelcome(false)} />;
    }

    // Show loading while TMA initializes
    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <Layout>
                <Routes>
                    {/* Client Routes */}
                    <Route path="/" element={<BookingWizard />} />
                    <Route path="/visits" element={<Visits />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Master Routes */}
                    <Route path="/master/records" element={<Records />} />
                    <Route path="/master/dashboard" element={<Dashboard />} />
                    <Route path="/master/reviews" element={<Reviews />} />
                    <Route path="/master/clientlist" element={<ClientList />} />
                    <Route path="/master/analytics" element={<Analytics />} />
                    <Route path="/master/checkin" element={<CheckIn />} />
                    <Route path="/master/settings" element={<Settings />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </HashRouter>
    )
}

function App() {
    return (
        <TMAProvider>
            <AppContent />
        </TMAProvider>
    )
}

export default App

