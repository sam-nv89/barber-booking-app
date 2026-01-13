import React from 'react';
import { useStore } from '@/store/useStore';
import { Calendar, User, Scissors, Settings, List, LayoutDashboard, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
    const { user, t } = useStore();
    const location = useLocation();

    const clientLinks = [
        { href: '/visits', icon: Calendar, label: t('nav.visits') },
        { href: '/', icon: Scissors, label: t('nav.book') },
        { href: '/profile', icon: User, label: t('nav.profile') },
    ];

    const masterLinks = [
        { href: '/master/dashboard', icon: LayoutDashboard, label: t('nav.studio') },
        { href: '/master/records', icon: List, label: t('nav.records') },
        { href: '/master/clientlist', icon: Users, label: t('nav.clients') || 'Клиенты' },
        { href: '/master/analytics', icon: BarChart3, label: t('analytics.title') || 'Статистика' },
        { href: '/master/settings', icon: Settings, label: t('nav.settings') },
    ];

    const userRole = user?.role || 'client';
    const links = userRole === 'client' ? clientLinks : masterLinks;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background px-4 pb-safe">
            <div className="flex h-16 items-center justify-around">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary",
                                isActive && "text-primary"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
