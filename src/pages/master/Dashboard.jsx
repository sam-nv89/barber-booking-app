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
                        <div>
                            <CardTitle className="text-base">
                                📊 {t('dashboard.dynamics')}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                ✓ {period === 'week' ? t('dashboard.week') : period === 'month' ? t('dashboard.month') : t('dashboard.all')}
                            </p>
                        </div>
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
                                <span className="ml-2 text-primary font-bold">📋 {chartData[hoveredChartIndex].count}</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="overflow-visible">
                        <div className="overflow-x-auto -mx-2 px-2">
                            <div
                                className="relative h-40 mt-2 pt-4"
                                style={{ minWidth: chartData.length > 10 ? `${chartData.length * 32}px` : 'auto' }}
                            >
                                {/* SVG Trend Line */}
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                                    viewBox={`0 0 ${chartData.length * 40} 100`}
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>
                                    {/* Area fill */}
                                    <path
                                        d={(() => {
                                            if (chartData.length < 2) return '';
                                            const points = chartData.map((d, i) => ({
                                                x: (i + 0.5) * 40,
                                                y: maxChartValue > 0 ? 100 - (d.count / maxChartValue) * 85 : 85
                                            }));
                                            let path = `M${points[0].x},100 L${points[0].x},${points[0].y}`;
                                            for (let i = 1; i < points.length; i++) {
                                                path += ` L${points[i].x},${points[i].y}`;
                                            }
                                            path += ` L${points[points.length - 1].x},100 Z`;
                                            return path;
                                        })()}
                                        fill="url(#trendGradient)"
                                    />
                                    {/* Trend line */}
                                    <path
                                        d={(() => {
                                            if (chartData.length < 2) return '';
                                            const points = chartData.map((d, i) => ({
                                                x: (i + 0.5) * 40,
                                                y: maxChartValue > 0 ? 100 - (d.count / maxChartValue) * 85 : 85
                                            }));
                                            let path = `M${points[0].x},${points[0].y}`;
                                            for (let i = 1; i < points.length; i++) {
                                                path += ` L${points[i].x},${points[i].y}`;
                                            }
                                            return path;
                                        })()}
                                        fill="none"
                                        stroke="rgb(99, 102, 241)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                {/* Bars container with touch handlers */}
                                <div
                                    className="flex items-end h-full gap-1 relative z-20"
                                    onTouchStart={(e) => {
                                        const touch = e.touches[0];
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = touch.clientX - rect.left;
                                        const segmentWidth = rect.width / chartData.length;
                                        const index = Math.floor(x / segmentWidth);
                                        setHoveredChartIndex(Math.max(0, Math.min(chartData.length - 1, index)));
                                    }}
                                    onTouchMove={(e) => {
                                        const touch = e.touches[0];
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = touch.clientX - rect.left;
                                        const segmentWidth = rect.width / chartData.length;
                                        const index = Math.floor(x / segmentWidth);
                                        setHoveredChartIndex(Math.max(0, Math.min(chartData.length - 1, index)));
                                    }}
                                    onTouchEnd={() => setHoveredChartIndex(null)}
                                >
                                    {chartData.map((d, idx) => (
                                        <div
                                            key={d.date}
                                            className="flex-1 flex flex-col items-center justify-end h-full relative"
                                            onMouseEnter={() => setHoveredChartIndex(idx)}
                                            onMouseLeave={() => setHoveredChartIndex(null)}
                                        >
                                            {/* Bar with gradient */}
                                            <div
                                                className={`w-full rounded-t-md transition-all duration-150 ${hoveredChartIndex === idx
                                                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/30'
                                                    : 'bg-gradient-to-t from-indigo-500/40 to-indigo-400/20'
                                                    }`}
                                                style={{
                                                    height: `${Math.max((d.count / maxChartValue) * 85, d.count > 0 ? 8 : 2)}%`,
                                                    minHeight: d.count > 0 ? '6px' : '2px'
                                                }}
                                            />
                                            {/* Date label */}
                                            <div className={`text-xs mt-1 transition-colors ${hoveredChartIndex === idx ? 'text-indigo-600 font-medium' : 'text-muted-foreground'}`}>
                                                {period === 'all'
                                                    ? (() => {
                                                        const monthDate = parseISO(d.date + '-01');
                                                        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                                                        return chartData.length > 6
                                                            ? capitalize(format(monthDate, 'LLL', { locale: locale() }))
                                                            : capitalize(format(monthDate, 'MMM', { locale: locale() }));
                                                    })()
                                                    : format(parseISO(d.date), 'd')}
                                            </div>
                                            {/* Hover dot on trend line */}
                                            {hoveredChartIndex === idx && (
                                                <div
                                                    className="absolute w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-md z-30"
                                                    style={{
                                                        bottom: `${Math.max((d.count / maxChartValue) * 85, 5) + 15}%`,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
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
