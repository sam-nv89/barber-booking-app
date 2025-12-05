import React, { useEffect } from 'react'
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

function App() {
    const { theme } = useStore();

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
                    <Route path="/master/settings" element={<Settings />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </HashRouter>
    )
}

export default App
