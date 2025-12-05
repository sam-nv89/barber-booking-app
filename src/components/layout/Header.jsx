import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from '@/components/features/LanguageSelector';
import { Notifications } from '@/components/features/Notifications';

export const Header = () => {
    const { theme, setTheme, user, setRole, t } = useStore();

    const toggleTheme = () => {
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isDark ? 'light' : 'dark');
        } else {
            setTheme(theme === 'dark' ? 'light' : 'dark');
        }
    };

    const navigate = useNavigate();

    const toggleRole = () => {
        const newRole = user.role === 'client' ? 'master' : 'client';
        setRole(newRole);
        if (newRole === 'master') {
            navigate('/master/records');
        } else {
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4">
                <div className="font-bold text-lg">BarberApp</div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={toggleRole}>
                        {user.role === 'client' ? t('roles.client') : t('roles.master')}
                    </Button>

                    <Notifications />

                    <LanguageSelector />

                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </header>
    );
};
