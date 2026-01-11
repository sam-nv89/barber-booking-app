import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ClockWidget } from '@/components/features/ClockWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, CreditCard, CalendarCheck, XCircle, Clock, Star } from 'lucide-react';
import { format, isSameMonth, isSameWeek, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';

export const Dashboard = () => {
    const { appointments, services, reviews, t, locale, salonSettings } = useStore();
    const [period, setPeriod] = useState('month'); // 'week' | 'month' | 'all'
    const [hoveredChartIndex, setHoveredChartIndex] = useState(null);

    // Filter appointments based on period
    const filteredAppointments = useMemo(() => {
        const now = new Date();
        return appointments.filter(app => {
            const appDate = parseISO(app.date); // Assuming date is YYYY-MM-DD
            if (period === 'all') return true;
            if (period === 'week') return isSameWeek(appDate, now, { weekStartsOn: 1 });
            if (period === 'month') return isSameMonth(appDate, now);
            return true;
        });
    }, [appointments, period]);

    // Calculate Stats
    const stats = useMemo(() => {
        const total = filteredAppointments.length;
        const completed = filteredAppointments.filter(a => a.status === 'completed').length;
        const confirmed = filteredAppointments.filter(a => a.status === 'confirmed').length;
        const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length;
        const pending = filteredAppointments.filter(a => a.status === 'pending').length;

        const revenue = filteredAppointments
            .filter(a => a.status === 'completed')
            .reduce((acc, curr) => {
                // Use locked price if available, otherwise find service price (legacy compatibility)
                if (curr.price !== undefined && curr.price !== null) {
                    return acc + parseInt(curr.price);
                }
                const service = services.find(s => s.id === curr.serviceId);
                const price = service?.price || 0;
                const numericPrice = typeof price === 'string' ? parseInt(price.replace(/\D/g, '')) : price;
                return acc + (numericPrice || 0);
            }, 0);



        const uniqueClients = new Set(filteredAppointments.map(a => a.clientPhone)).size;

        const averageRating = reviews.length > 0
            ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
            : '0.0';

        return { total, completed, confirmed, cancelled, pending, revenue, uniqueClients, averageRating };
    }, [filteredAppointments, reviews]);

    // Chart Data
    const chartData = useMemo(() => {
        // Group by date for week/month, by month for 'all'
        const grouped = filteredAppointments.reduce((acc, app) => {
            if (['completed', 'confirmed'].includes(app.status)) {
                if (period === 'all') {
                    // Group by month for 'all time'
                    const monthKey = app.date.substring(0, 7); // YYYY-MM
                    acc[monthKey] = (acc[monthKey] || 0) + 1;
                } else {
                    acc[app.date] = (acc[app.date] || 0) + 1;
                }
            }
            return acc;
        }, {});

        return Object.entries(grouped)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([date, count]) => ({ date, count }));

    }, [filteredAppointments, period]);

    const statCards = [
        {
            title: t('dashboard.revenue'),
            value: `${formatPrice(stats.revenue)} ${salonSettings?.currency || '₸'}`,
            icon: CreditCard,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            title: t('dashboard.clients'),
            value: stats.uniqueClients,
            icon: Users,
            color: 'text-red-500',
            bg: 'bg-red-500/10'
        },
        {
            title: t('dashboard.requests'),
            value: stats.pending,
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            title: t('reviews.rating'),
            value: stats.averageRating,
            icon: Star,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            href: '/master/reviews'
        },
    ];

    const maxChartValue = Math.max(...chartData.map(d => d.count), 5);

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">{t('nav.studio')}</h1>

            <ClockWidget />

            {/* Period Filter */}
            <div className="flex p-1 bg-muted rounded-lg w-full">
                {['week', 'month', 'all'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                            period === p ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {p === 'week' ? t('dashboard.week') : p === 'month' ? t('dashboard.month') : t('dashboard.allTime')}
                    </button>
                ))}
            </div>

            {/* Stats Grid - Revenue full width, then 3 cards in one row */}
            <Card className="overflow-hidden border-none shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{statCards[0].title}</div>
                        <div className="text-3xl font-bold tracking-tight mt-1">{statCards[0].value}</div>
                    </div>
                    <div className={`p-3 rounded-full ${statCards[0].bg} ${statCards[0].color}`}>
                        <CreditCard className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
                {statCards.slice(1).map((stat, index) => {
                    const Icon = stat.icon;
                    const CardComponent = (
                        <Card key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                                <div className={`p-2 rounded-full ${stat.bg} ${stat.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold tracking-tight">{stat.value}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</div>
                                </div>
                            </CardContent>
                        </Card>
                    );

                    if (stat.href) {
                        return <Link key={index} to={stat.href}>{CardComponent}</Link>;
                    }
                    return CardComponent;
                })}
            </div>

            {/* Simple Bar Chart */}
            {chartData.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{t('dashboard.dynamics')}</CardTitle>
                        {hoveredChartIndex !== null && chartData[hoveredChartIndex] && (
                            <div className="text-xs text-right whitespace-nowrap">
                                <span className="font-semibold text-foreground">
                                    {period === 'all'
                                        ? (() => {
                                            const monthDate = parseISO(chartData[hoveredChartIndex].date + '-01');
                                            const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                                            return capitalize(format(monthDate, 'LLLL yyyy', { locale: locale() }));
                                        })()
                                        : format(parseISO(chartData[hoveredChartIndex].date), 'dd.MM.yyyy')}
                                </span>
                                <span className="ml-2 text-primary font-bold">{chartData[hoveredChartIndex].count} {t('dashboard.records')}</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto -mx-2 px-2">
                            <div
                                className="flex items-end justify-between h-32 gap-1 mt-2 touch-none"
                                style={{ minWidth: chartData.length > 10 ? `${chartData.length * 28}px` : 'auto' }}
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = touch.clientX - rect.left;
                                    const totalWidth = rect.width;
                                    const segmentWidth = totalWidth / chartData.length;
                                    const index = Math.floor(x / segmentWidth);
                                    setHoveredChartIndex(Math.max(0, Math.min(chartData.length - 1, index)));
                                }}
                                onTouchMove={(e) => {
                                    const touch = e.touches[0];
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = touch.clientX - rect.left;
                                    const totalWidth = rect.width;
                                    const segmentWidth = totalWidth / chartData.length;
                                    const index = Math.floor(x / segmentWidth);
                                    setHoveredChartIndex(Math.max(0, Math.min(chartData.length - 1, index)));
                                }}
                                onTouchEnd={() => setHoveredChartIndex(null)}
                            >
                                {chartData.map((d, idx) => (
                                    <div
                                        key={d.date}
                                        className="flex flex-col items-center justify-end flex-1 h-full gap-2 group"
                                        onMouseEnter={() => setHoveredChartIndex(idx)}
                                        onMouseLeave={() => setHoveredChartIndex(null)}
                                    >
                                        <div className={`text-xs font-bold transition-opacity mb-auto ${hoveredChartIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{d.count}</div>
                                        <div
                                            className={`w-full rounded-t-sm transition-colors relative ${hoveredChartIndex === idx ? 'bg-primary/60' : 'bg-primary/20 hover:bg-primary/40'}`}
                                            style={{ height: `${(d.count / maxChartValue) * 100}%` }}
                                        >
                                        </div>
                                        <div className="text-xs text-muted-foreground rotate-0 whitespace-nowrap">
                                            {period === 'all'
                                                ? (() => {
                                                    const monthDate = parseISO(d.date + '-01');
                                                    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                                                    // Use abbreviated format if many bars (>6), else full format
                                                    if (chartData.length > 6) {
                                                        return capitalize(format(monthDate, 'LLL', { locale: locale() })) + ', ' + format(monthDate, 'yy');
                                                    } else {
                                                        return capitalize(format(monthDate, 'LLLL', { locale: locale() })) + ', ' + format(monthDate, 'yyyy');
                                                    }
                                                })()
                                                : format(parseISO(d.date), 'dd.MM')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.conversion')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{t('dashboard.completedVsCancelled')}</span>
                            <span className="font-bold">{stats.total > 0 ? Math.round((stats.completed / (stats.total || 1)) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(stats.completed / (stats.total || 1)) * 100}%` }}
                                className="h-full bg-green-500"
                            />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(stats.cancelled / (stats.total || 1)) * 100}%` }}
                                className="h-full bg-red-500"
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-medium">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{t('dashboard.successful')}</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t('dashboard.declined')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
