import React, { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { TRANSLATIONS } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatPrice } from '@/lib/utils';
import {
    BarChart3, TrendingUp, Users, Star, Calendar, Clock,
    ChevronDown, Scissors, ArrowUpRight, ArrowDownRight, RefreshCw, Database
} from 'lucide-react';
import { format, subDays, subMonths, isAfter, startOfDay, endOfDay, eachDayOfInterval, isSameDay, eachMonthOfInterval, isSameMonth, startOfMonth } from 'date-fns';
import { ru, enUS, kk, es, tr } from 'date-fns/locale';

export const Analytics = () => {
    const { t, appointments, clients, reviews, services, language, generateMockData, salonSettings } = useStore();
    const [period, setPeriod] = useState('week');
    const [showPeriodMenu, setShowPeriodMenu] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hoveredData, setHoveredData] = useState(null); // { index, revenue, heightPercent }

    // Date locale based on language
    const dateLocale = language === 'ru' ? ru : language === 'kz' ? kk : language === 'es' ? es : language === 'tr' ? tr : enUS;

    // Capitalize first letter helper
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    // Local analytics translations (to avoid caching issues)
    const ANALYTICS_TRANSLATIONS = {
        ru: { clientsCount: 'Клиентов', revenue: 'Выручка', noBookings: 'Нет записей', revenueByDay: 'Выручка по дням', revenueByMonth: 'Выручка по месяцам' },
        kz: { clientsCount: 'Клиенттер', revenue: 'Табыс', noBookings: 'Жазбалар жоқ', revenueByDay: 'Күндер бойынша табыс', revenueByMonth: 'Айлар бойынша табыс' },
        en: { clientsCount: 'Clients', revenue: 'Revenue', noBookings: 'No bookings', revenueByDay: 'Revenue by day', revenueByMonth: 'Revenue by month' },
        es: { clientsCount: 'Clientes', revenue: 'Ingresos', noBookings: 'No hay reservas', revenueByDay: 'Ingresos por día', revenueByMonth: 'Ingresos por mes' },
        tr: { clientsCount: 'Müşteriler', revenue: 'Gelir', noBookings: 'Randevu yok', revenueByDay: 'Günlük gelir', revenueByMonth: 'Aylık gelir' },
    };

    // Analytics translations with fallback
    const analyticsT = ANALYTICS_TRANSLATIONS[language] || ANALYTICS_TRANSLATIONS.ru;

    // Period options
    const periods = [
        { key: 'today', label: t('analytics.today') },
        { key: 'week', label: t('analytics.week') },
        { key: 'month', label: t('analytics.month') },
        { key: 'all', label: t('analytics.allTime') },
    ];

    // Get date range based on period
    const getDateRange = () => {
        const now = new Date();
        switch (period) {
            case 'today':
                return { start: startOfDay(now), end: endOfDay(now) };
            case 'week':
                return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
            case 'month':
                return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
            default:
                return { start: new Date(0), end: endOfDay(now) };
        }
    };

    // Filter appointments by period
    const filteredAppointments = useMemo(() => {
        const { start, end } = getDateRange();
        return appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate >= start && appDate <= end;
        });
    }, [appointments, period]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const completed = filteredAppointments.filter(a => a.status === 'completed');
        const cancelled = filteredAppointments.filter(a => a.status === 'cancelled');
        const pending = filteredAppointments.filter(a => a.status === 'pending' || a.status === 'confirmed');

        const revenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
        const avgCheck = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

        // New clients (first booking in period)
        const clientBookings = {};
        appointments.forEach(a => {
            if (!clientBookings[a.clientPhone]) {
                clientBookings[a.clientPhone] = a.date;
            } else if (a.date < clientBookings[a.clientPhone]) {
                clientBookings[a.clientPhone] = a.date;
            }
        });

        const { start, end } = getDateRange();
        const newClients = Object.entries(clientBookings).filter(([phone, firstDate]) => {
            const d = new Date(firstDate);
            return d >= start && d <= end;
        }).length;

        // Return rate (clients with >1 booking)
        const clientCounts = {};
        appointments.filter(a => a.status === 'completed').forEach(a => {
            clientCounts[a.clientPhone] = (clientCounts[a.clientPhone] || 0) + 1;
        });
        const returningClients = Object.values(clientCounts).filter(c => c > 1).length;
        const totalClients = Object.keys(clientCounts).length;
        const returnRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0;

        // Average rating
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            : 0;

        // Conversion rate
        const conversionRate = filteredAppointments.length > 0
            ? Math.round((completed.length / filteredAppointments.length) * 100)
            : 0;

        return {
            revenue,
            bookings: filteredAppointments.length,
            completed: completed.length,
            cancelled: cancelled.length,
            pending: pending.length,
            avgCheck,
            newClients,
            returnRate,
            avgRating,
            conversionRate,
        };
    }, [filteredAppointments, appointments, reviews]);

    // Popular services
    const popularServices = useMemo(() => {
        const serviceCounts = {};
        filteredAppointments.filter(a => a.status === 'completed').forEach(a => {
            const ids = a.serviceIds || (a.serviceId ? [a.serviceId] : []);
            ids.forEach(id => {
                serviceCounts[id] = (serviceCounts[id] || 0) + 1;
            });
        });

        return Object.entries(serviceCounts)
            .map(([id, count]) => {
                const service = services.find(s => s.id === id);
                const name = service?.name?.[language] || service?.name?.ru || service?.name || 'Unknown';
                return { id, name, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredAppointments, services, language]);

    // Revenue by day/month/hour (for chart)
    const revenueByPeriod = useMemo(() => {
        // For 'all' period - show by months
        if (period === 'all') {
            const completedAppointments = appointments.filter(a => a.status === 'completed');
            if (completedAppointments.length === 0) return [];

            // Find date range from all appointments
            const dates = completedAppointments.map(a => new Date(a.date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            const months = eachMonthOfInterval({ start: startOfMonth(minDate), end: startOfMonth(maxDate) });

            return months.map(month => {
                const monthRevenue = completedAppointments
                    .filter(a => isSameMonth(new Date(a.date), month))
                    .reduce((sum, a) => sum + (a.price || 0), 0);
                const monthClients = completedAppointments
                    .filter(a => isSameMonth(new Date(a.date), month)).length;
                return { date: month, revenue: monthRevenue, clients: monthClients, isMonth: true };
            });
        }

        // For 'today' period - show by hours
        if (period === 'today') {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const todayAppointments = filteredAppointments.filter(a =>
                a.status === 'completed' && a.date === todayStr
            );

            // Create hours from 9 to 21
            const hours = [];
            for (let h = 9; h <= 21; h++) {
                const hourRevenue = todayAppointments
                    .filter(a => {
                        const [hour] = (a.time || '12:00').split(':').map(Number);
                        return hour === h;
                    })
                    .reduce((sum, a) => sum + (a.price || 0), 0);
                const hourClients = todayAppointments
                    .filter(a => {
                        const [hour] = (a.time || '12:00').split(':').map(Number);
                        return hour === h;
                    }).length;
                hours.push({
                    hour: h,
                    revenue: hourRevenue,
                    clients: hourClients,
                    isHour: true,
                    date: new Date() // for tooltip date display
                });
            }
            return hours;
        }

        // For other periods - show by days
        const { start, end } = getDateRange();
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayRevenue = filteredAppointments
                .filter(a => a.status === 'completed' && isSameDay(new Date(a.date), day))
                .reduce((sum, a) => sum + (a.price || 0), 0);
            const dayClients = filteredAppointments
                .filter(a => a.status === 'completed' && isSameDay(new Date(a.date), day)).length;
            return { date: day, revenue: dayRevenue, clients: dayClients, isMonth: false };
        });
    }, [filteredAppointments, appointments, period]);

    // Max revenue for chart scaling
    const maxRevenue = Math.max(...revenueByPeriod.map(d => d.revenue), 1);

    // Workload heatmap data (hour × day of week) - filtered by selected period
    const heatmapData = useMemo(() => {
        const grid = {};
        // Initialize grid
        for (let hour = 9; hour <= 20; hour++) {
            grid[hour] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        }

        filteredAppointments.filter(a => a.status === 'completed').forEach(a => {
            const hour = parseInt(a.time?.split(':')[0] || '12');
            const dayOfWeek = new Date(a.date).getDay();
            if (grid[hour]) {
                grid[hour][dayOfWeek] = (grid[hour][dayOfWeek] || 0) + 1;
            }
        });

        return grid;
    }, [filteredAppointments]);

    const maxHeatValue = Math.max(
        ...Object.values(heatmapData).flatMap(row => Object.values(row)),
        1
    );

    // Day labels with translations - starting from Monday
    const dayLabels = language === 'en'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : language === 'kz'
            ? ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жс']
            : language === 'es'
                ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
                : language === 'tr'
                    ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
                    : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    // Map JavaScript day (0=Sun) to our order (0=Mon)
    const jsDayToOurDay = [6, 0, 1, 2, 3, 4, 5]; // Sun->6, Mon->0, Tue->1, etc.

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    {t('analytics.title')}
                </h1>

                <div className="flex items-center gap-2">
                    {/* Generate Test Data Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsGenerating(true);
                            generateMockData();
                            setTimeout(() => setIsGenerating(false), 500);
                        }}
                        disabled={isGenerating}
                        className="gap-1 text-muted-foreground"
                        title={language === 'en' ? 'Add 100 test appointments' : 'Добавить 100 тестовых записей'}
                    >
                        <Database className="w-4 h-4" />
                        {isGenerating ? '...' : '+100'}
                    </Button>

                    {/* Period Selector */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                            className="gap-1"
                        >
                            {periods.find(p => p.key === period)?.label}
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                        {showPeriodMenu && (
                            <div className="absolute right-0 mt-1 bg-background border rounded-lg shadow-lg z-10 min-w-[120px]">
                                {periods.map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => {
                                            setPeriod(p.key);
                                            setShowPeriodMenu(false);
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                                            period === p.key && "bg-muted font-medium"
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Revenue */}
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">{t('analytics.revenue')}</span>
                        </div>
                        <div className="text-2xl font-bold">{formatPrice(metrics.revenue)} {salonSettings?.currency || '₸'}</div>
                    </CardContent>
                </Card>

                {/* Bookings */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium">{t('analytics.bookings')}</span>
                        </div>
                        <div className="text-2xl font-bold">{metrics.bookings.toLocaleString(language)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            <span title={t('analytics.completed')} className="cursor-default">✓ {metrics.completed.toLocaleString(language)}</span>
                            {' / '}
                            <span title={t('analytics.cancelled')} className="cursor-default">✕ {metrics.cancelled.toLocaleString(language)}</span>
                            {' / '}
                            <span title={t('analytics.pending')} className="cursor-default">⏳ {metrics.pending.toLocaleString(language)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Check */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Scissors className="w-4 h-4" />
                            <span className="text-xs font-medium">{t('analytics.averageCheck')}</span>
                        </div>
                        <div className="text-xl font-bold">{formatPrice(metrics.avgCheck)} {salonSettings?.currency || '₸'}</div>
                    </CardContent>
                </Card>

                {/* New Clients */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">{t('analytics.newClients')}</span>
                        </div>
                        <div className="text-xl font-bold">{metrics.newClients.toLocaleString(language)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            {revenueByPeriod.length > 0 && (() => {
                // Calculate nice Y-axis max - add 10% headroom and round to nice number
                const niceMax = (() => {
                    const withBuffer = maxRevenue * 1.1; // 10% headroom
                    if (withBuffer <= 5000) return Math.ceil(withBuffer / 1000) * 1000;
                    if (withBuffer <= 10000) return Math.ceil(withBuffer / 2000) * 2000;
                    if (withBuffer <= 25000) return Math.ceil(withBuffer / 5000) * 5000;
                    if (withBuffer <= 50000) return Math.ceil(withBuffer / 10000) * 10000;
                    if (withBuffer <= 100000) return Math.ceil(withBuffer / 25000) * 25000;
                    if (withBuffer <= 250000) return Math.ceil(withBuffer / 50000) * 50000;
                    if (withBuffer <= 500000) return Math.ceil(withBuffer / 100000) * 100000;
                    if (withBuffer <= 1000000) return Math.ceil(withBuffer / 200000) * 200000;
                    return Math.ceil(withBuffer / 500000) * 500000;
                })();
                // 5 labels at 0%, 25%, 50%, 75%, 100%
                const yLabels = [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];
                const chartHeight = 180;

                // Full number format with currency, only abbreviate for billions
                const formatYLabel = (val) => {
                    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)} млрд ${salonSettings?.currency || '₸'}`;
                    if (val === 0) return `0 ${salonSettings?.currency || '₸'}`;
                    return `${formatPrice(val)} ${salonSettings?.currency || '₸'}`;
                };
                return (
                    <Card className="overflow-visible">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    📈 {period === 'all' ? t('analytics.revenueByMonth') : t('analytics.revenueByDay')}
                                </CardTitle>
                                {/* Always visible data block - shows placeholder or hovered data */}
                                <div className="text-sm text-right">
                                    {hoveredData && revenueByPeriod[hoveredData.index] ? (() => {
                                        const currentRevenue = hoveredData.revenue;
                                        const previousRevenue = hoveredData.index > 0 ? revenueByPeriod[hoveredData.index - 1].revenue : 0;
                                        const change = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : null;
                                        const changeText = change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(0)}%` : '—';
                                        const changeColor = change === null ? 'text-muted-foreground' : change >= 0 ? 'text-green-600' : 'text-red-500';

                                        return (
                                            <>
                                                <div className="font-semibold text-foreground">
                                                    {revenueByPeriod[hoveredData.index].isHour
                                                        ? `${revenueByPeriod[hoveredData.index].hour}:00`
                                                        : revenueByPeriod[hoveredData.index].isMonth
                                                            ? capitalize(format(revenueByPeriod[hoveredData.index].date, 'LLLL yyyy', { locale: dateLocale }))
                                                            : format(revenueByPeriod[hoveredData.index].date, 'dd.MM.yyyy')}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    👥 {analyticsT.clientsCount}: <span className="font-medium text-foreground">{revenueByPeriod[hoveredData.index].clients.toLocaleString(language)}</span>
                                                </div>
                                                <div className="text-muted-foreground flex items-center justify-end gap-2">
                                                    💰 {analyticsT.revenue}: <span className="font-medium text-green-600">{hoveredData.revenue.toLocaleString(language)} {salonSettings?.currency || '₸'}</span>
                                                    <span className={`text-xs font-semibold ${changeColor}`}>{changeText}</span>
                                                </div>
                                            </>
                                        );
                                    })() : (
                                        <>
                                            <div className="font-semibold text-muted-foreground/50">—</div>
                                            <div className="text-muted-foreground/50">👥 {analyticsT.clientsCount}: —</div>
                                            <div className="text-muted-foreground/50">💰 {analyticsT.revenue}: —</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-visible">
                            <div className="flex overflow-visible">
                                {/* Y-axis labels - positioned exactly on grid lines */}
                                <div className="relative shrink-0 text-right pr-3" style={{ width: '90px', height: `${chartHeight}px` }}>
                                    {yLabels.map((val, idx) => {
                                        // Hide label if hover value is close (within 12% of chart height)
                                        const labelPercent = idx * 25; // 0, 25, 50, 75, 100
                                        const hoverPercent = hoveredData ? (100 - hoveredData.heightPercent) : null;
                                        const isClose = hoverPercent !== null && Math.abs(labelPercent - hoverPercent) < 12;

                                        return (
                                            <span
                                                key={idx}
                                                className={`absolute right-3 text-sm text-muted-foreground font-medium transition-opacity ${isClose ? 'opacity-0' : 'opacity-100'}`}
                                                style={{
                                                    top: `${labelPercent}%`,
                                                    transform: 'translateY(-50%)'
                                                }}
                                            >
                                                {formatYLabel(val)}
                                            </span>
                                        );
                                    })}
                                    {/* Dynamic hover value - semi-transparent */}
                                    {hoveredData && (
                                        <span
                                            className="absolute right-3 text-sm font-medium text-indigo-400 z-20"
                                            style={{
                                                top: `${100 - hoveredData.heightPercent}%`,
                                                transform: 'translateY(-50%)'
                                            }}
                                        >
                                            {formatYLabel(hoveredData.revenue)}
                                        </span>
                                    )}
                                </div>

                                {/* Chart area with grid */}
                                <div className="flex-1 relative" style={{ height: `${chartHeight}px` }}>
                                    {/* Horizontal grid lines */}
                                    {[0, 25, 50, 75, 100].map((percent) => (
                                        <div
                                            key={percent}
                                            className="absolute left-0 right-0 border-t border-slate-300 dark:border-slate-600"
                                            style={{ top: `${percent}%` }}
                                        />
                                    ))}


                                    {/* Line chart for month period (>14 days) or today (hourly) */}
                                    {(period === 'month' && revenueByPeriod.length > 14) || period === 'today' ? (
                                        <>
                                            {/* SVG for line and area */}
                                            <svg
                                                className="absolute inset-0 w-full h-full pointer-events-none"
                                                viewBox={`0 0 ${revenueByPeriod.length * 20} ${chartHeight}`}
                                                preserveAspectRatio="none"
                                            >
                                                <defs>
                                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                                                        <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                                                    </linearGradient>
                                                </defs>
                                                {/* Area fill with smooth curve through data points */}
                                                <path
                                                    d={(() => {
                                                        const points = revenueByPeriod.map((item, i) => ({
                                                            x: (i + 0.5) * 20,
                                                            y: niceMax > 0 ? chartHeight - (item.revenue / niceMax) * chartHeight : chartHeight
                                                        }));

                                                        if (points.length < 2) return '';

                                                        // Use Catmull-Rom spline converted to cubic bezier - passes through all points
                                                        const tension = 0.3;
                                                        let path = `M${points[0].x},${chartHeight} L${points[0].x},${points[0].y}`;

                                                        for (let i = 0; i < points.length - 1; i++) {
                                                            const p0 = points[Math.max(0, i - 1)];
                                                            const p1 = points[i];
                                                            const p2 = points[i + 1];
                                                            const p3 = points[Math.min(points.length - 1, i + 2)];

                                                            const cp1x = p1.x + (p2.x - p0.x) * tension;
                                                            const cp1y = p1.y + (p2.y - p0.y) * tension;
                                                            const cp2x = p2.x - (p3.x - p1.x) * tension;
                                                            const cp2y = p2.y - (p3.y - p1.y) * tension;

                                                            path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                                                        }

                                                        const last = points[points.length - 1];
                                                        path += ` L${last.x},${chartHeight} Z`;
                                                        return path;
                                                    })()}
                                                    fill="url(#areaGradient)"
                                                />
                                                {/* Line with smooth curve through data points */}
                                                <path
                                                    d={(() => {
                                                        const points = revenueByPeriod.map((item, i) => ({
                                                            x: (i + 0.5) * 20,
                                                            y: niceMax > 0 ? chartHeight - (item.revenue / niceMax) * chartHeight : chartHeight
                                                        }));

                                                        if (points.length < 2) return '';

                                                        // Use Catmull-Rom spline converted to cubic bezier - passes through all points
                                                        const tension = 0.3;
                                                        let path = `M${points[0].x},${points[0].y}`;

                                                        for (let i = 0; i < points.length - 1; i++) {
                                                            const p0 = points[Math.max(0, i - 1)];
                                                            const p1 = points[i];
                                                            const p2 = points[i + 1];
                                                            const p3 = points[Math.min(points.length - 1, i + 2)];

                                                            const cp1x = p1.x + (p2.x - p0.x) * tension;
                                                            const cp1y = p1.y + (p2.y - p0.y) * tension;
                                                            const cp2x = p2.x - (p3.x - p1.x) * tension;
                                                            const cp2y = p2.y - (p3.y - p1.y) * tension;

                                                            path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                                                        }

                                                        return path;
                                                    })()}
                                                    fill="none"
                                                    stroke="rgb(99, 102, 241)"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    style={{ filter: 'drop-shadow(0 1px 2px rgba(99, 102, 241, 0.3))' }}
                                                />
                                            </svg>
                                            {/* HTML overlay for tooltips - single div with mouse tracking */}
                                            <div
                                                className="absolute inset-0 overflow-visible cursor-pointer"
                                                onMouseMove={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const x = e.clientX - rect.left;
                                                    const totalWidth = rect.width;
                                                    const segmentWidth = totalWidth / revenueByPeriod.length;
                                                    const index = Math.floor(x / segmentWidth);
                                                    const clampedIndex = Math.max(0, Math.min(revenueByPeriod.length - 1, index));
                                                    const item = revenueByPeriod[clampedIndex];
                                                    const heightPercent = niceMax > 0 ? (item.revenue / niceMax) * 100 : 0;
                                                    setHoveredData({ index: clampedIndex, revenue: item.revenue, heightPercent });
                                                }}
                                                onMouseLeave={() => setHoveredData(null)}
                                            >
                                                {/* Vertical hover highlight */}
                                                {hoveredData && (
                                                    <div
                                                        className="absolute top-0 bottom-0 bg-indigo-500/10 transition-all duration-75"
                                                        style={{
                                                            left: `${(hoveredData.index / revenueByPeriod.length) * 100}%`,
                                                            width: `${100 / revenueByPeriod.length}%`
                                                        }}
                                                    />
                                                )}
                                                {/* Horizontal price level line - dashed */}
                                                {hoveredData && (
                                                    <div
                                                        className="absolute h-px z-10 transition-all duration-75"
                                                        style={{
                                                            bottom: `${hoveredData.heightPercent}%`,
                                                            left: 0,
                                                            width: `${((hoveredData.index + 0.5) / revenueByPeriod.length) * 100}%`,
                                                            backgroundImage: 'repeating-linear-gradient(to right, rgb(129, 140, 248) 0, rgb(129, 140, 248) 4px, transparent 4px, transparent 8px)'
                                                        }}
                                                    />
                                                )}
                                                {/* Data point with pulse effect */}
                                                {hoveredData && (
                                                    <>
                                                        {/* Pulse ring */}
                                                        <div
                                                            className="absolute w-4 h-4 rounded-full bg-indigo-400/30 z-15 animate-ping"
                                                            style={{
                                                                bottom: `${hoveredData.heightPercent}%`,
                                                                left: `${((hoveredData.index + 0.5) / revenueByPeriod.length) * 100}%`,
                                                                transform: 'translate(-50%, 50%)',
                                                                animationDuration: '1.5s'
                                                            }}
                                                        />
                                                        {/* Main dot */}
                                                        <div
                                                            className="absolute w-3 h-3 rounded-full bg-indigo-500 border-2 border-white z-20 transition-all duration-75"
                                                            style={{
                                                                bottom: `${hoveredData.heightPercent}%`,
                                                                left: `${((hoveredData.index + 0.5) / revenueByPeriod.length) * 100}%`,
                                                                transform: 'translate(-50%, 50%)',
                                                                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.5)'
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        /* Bar chart for other periods */
                                        <div className="flex items-end gap-1 h-full relative z-10 px-1">
                                            {revenueByPeriod.map((item, i) => {
                                                const heightPx = niceMax > 0
                                                    ? Math.max(Math.round((item.revenue / niceMax) * chartHeight), item.revenue > 0 ? 6 : 0)
                                                    : 0;
                                                const heightPercent = niceMax > 0 ? (item.revenue / niceMax) * 100 : 0;

                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex-1 flex flex-col items-center justify-end relative cursor-pointer"
                                                        style={{ height: `${chartHeight}px` }}
                                                        onMouseEnter={() => setHoveredData({ index: i, revenue: item.revenue, heightPercent })}
                                                        onMouseLeave={() => setHoveredData(null)}
                                                    >
                                                        {/* Bar */}
                                                        <div
                                                            className={`w-full rounded-t transition-all duration-100 ${hoveredData?.index === i ? '' : 'hover:opacity-80'}`}
                                                            style={{
                                                                height: item.revenue > 0 ? `${heightPx}px` : '3px',
                                                                backgroundColor: hoveredData?.index === i
                                                                    ? (item.revenue > 0 ? 'rgb(79, 70, 229)' : 'rgb(229, 231, 235)')
                                                                    : (item.revenue > 0 ? 'rgb(99, 102, 241)' : 'rgb(229, 231, 235)'),
                                                                boxShadow: hoveredData?.index === i && item.revenue > 0
                                                                    ? '0 0 0 2px rgba(255,255,255,0.9), 0 4px 12px rgba(79, 70, 229, 0.4)'
                                                                    : 'none',
                                                                position: 'relative',
                                                                zIndex: hoveredData?.index === i ? 10 : 1
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* X-axis: Date labels */}
                            <div className="flex mt-2" style={{ marginLeft: '90px' }}>
                                {revenueByPeriod.map((item, i) => {
                                    // Capitalize first letter helper
                                    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                                    const isHovered = hoveredData?.index === i;

                                    if (item.isMonth) {
                                        // Full month name for 'all' period
                                        const monthName = capitalize(format(item.date, 'LLLL', { locale: dateLocale }));
                                        return (
                                            <div key={i} className={`flex-1 text-center overflow-hidden transition-all duration-75 ${isHovered ? 'bg-indigo-500/10 rounded' : ''}`}>
                                                <span
                                                    className={`text-xs font-medium inline-block transition-colors duration-75 ${isHovered ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}
                                                    style={{
                                                        writingMode: revenueByPeriod.length > 6 ? 'vertical-rl' : 'horizontal-tb',
                                                        transform: revenueByPeriod.length > 6 ? 'rotate(180deg)' : 'none',
                                                        maxHeight: revenueByPeriod.length > 6 ? '60px' : 'auto'
                                                    }}
                                                >
                                                    {monthName}
                                                </span>
                                            </div>
                                        );
                                    } else if (item.isHour) {
                                        // Hour labels for 'today' period
                                        const showLabel = i % 2 === 0; // Show every 2nd hour
                                        return (
                                            <div key={i} className={`flex-1 text-center transition-all duration-75 ${isHovered ? 'bg-indigo-500/10 rounded' : ''}`}>
                                                <span className={`text-xs font-medium transition-colors duration-75 ${isHovered ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                                                    {showLabel || isHovered ? `${item.hour}:00` : ''}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        // Always show all day labels
                                        const showLabel = true;

                                        return (
                                            <div key={i} className={`flex-1 text-center transition-all duration-75 ${isHovered ? 'bg-indigo-500/10 rounded' : ''}`}>
                                                <span className={`text-xs font-medium transition-colors duration-75 ${isHovered ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                                                    {showLabel || isHovered ? format(item.date, 'd') : ''}
                                                </span>
                                            </div>
                                        );
                                    }
                                })}
                            </div>

                            {/* Year/Month brackets - Excel style */}
                            {(() => {
                                // Group by year for 'all' period, or by month for other periods
                                const groups = [];

                                if (period === 'all') {
                                    // Group months by year
                                    let currentYear = null;
                                    let startIdx = 0;

                                    revenueByPeriod.forEach((item, i) => {
                                        const year = format(item.date, 'yyyy');
                                        if (year !== currentYear) {
                                            if (currentYear !== null) {
                                                groups.push({ label: currentYear, start: startIdx, end: i - 1 });
                                            }
                                            currentYear = year;
                                            startIdx = i;
                                        }
                                    });
                                    if (currentYear !== null) {
                                        groups.push({ label: currentYear, start: startIdx, end: revenueByPeriod.length - 1 });
                                    }
                                } else if (period === 'today') {
                                    // Single group for today showing the date
                                    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                                    const todayDate = capitalize(format(new Date(), 'd MMMM, yyyy', { locale: dateLocale }));
                                    groups.push({ label: todayDate, start: 0, end: revenueByPeriod.length - 1 });
                                } else {
                                    // Group days by month for week/month periods
                                    let currentMonth = null;
                                    let currentMonthData = null;
                                    let startIdx = 0;

                                    revenueByPeriod.forEach((item, i) => {
                                        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
                                        const monthName = capitalize(format(item.date, 'LLL', { locale: dateLocale }));
                                        const year = format(item.date, 'yyyy');
                                        const monthKey = `${monthName}-${year}`;
                                        if (monthKey !== currentMonth) {
                                            if (currentMonth !== null) {
                                                groups.push({ ...currentMonthData, start: startIdx, end: i - 1 });
                                            }
                                            currentMonth = monthKey;
                                            currentMonthData = { month: monthName, year, label: `${monthName}\n${year}` };
                                            startIdx = i;
                                        }
                                    });
                                    if (currentMonth !== null) {
                                        groups.push({ ...currentMonthData, start: startIdx, end: revenueByPeriod.length - 1 });
                                    }
                                }

                                if (groups.length === 0) return null;

                                return (
                                    <div className="flex mt-1" style={{ marginLeft: '90px' }}>
                                        {revenueByPeriod.map((item, i) => {
                                            const group = groups.find(g => i >= g.start && i <= g.end);
                                            const isFirst = group && i === group.start;
                                            const isLast = group && i === group.end;

                                            return (
                                                <div key={i} className="flex-1 relative h-10">
                                                    {/* Top bracket line */}
                                                    <div className="absolute top-0 left-0 right-0 border-t border-slate-300 dark:border-slate-600" />
                                                    {/* Left vertical edge pointing up */}
                                                    {isFirst && <div className="absolute top-0 left-0 w-px h-1.5 bg-slate-300 dark:bg-slate-600" style={{ transform: 'translateY(-100%)' }} />}
                                                    {/* Right vertical edge pointing up */}
                                                    {isLast && <div className="absolute top-0 right-0 w-px h-1.5 bg-slate-300 dark:bg-slate-600" style={{ transform: 'translateY(-100%)' }} />}
                                                    {/* Label BELOW the line, centered */}
                                                    {isFirst && group && (
                                                        <div
                                                            className="absolute top-1 flex flex-col items-center text-muted-foreground font-medium"
                                                            style={{
                                                                left: '0',
                                                                width: `${(group.end - group.start + 1) * 100}%`
                                                            }}
                                                        >
                                                            {group.month ? (
                                                                <>
                                                                    <span className="text-xs">{group.month}</span>
                                                                    <span className="text-xs opacity-70">{group.year}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm">{group.label}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                );
            })()}

            {/* Popular Services */}
            {popularServices.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            🏆 {t('analytics.popularServices')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {popularServices.map((service, i) => {
                            const maxCount = popularServices[0]?.count || 1;
                            const percentage = (service.count / maxCount) * 100;
                            return (
                                <div key={service.id} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{service.name}</span>
                                        <span className="font-medium">{service.count}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${percentage}%`,
                                                background: 'linear-gradient(to right, rgb(99, 102, 241), rgb(168, 85, 247))'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Client Metrics */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        👥 {t('analytics.clientMetrics')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-500">
                                <RefreshCw className="w-5 h-5" />
                                {metrics.returnRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t('analytics.returnRate')}</div>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-500">
                                <Star className="w-5 h-5 fill-yellow-500" />
                                {metrics.avgRating}
                            </div>
                            <div className="text-xs text-muted-foreground">{t('analytics.avgRating')}</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-500">
                                {metrics.conversionRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t('analytics.conversion')}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workload Heatmap */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            🗓️ {t('analytics.loadByTime')}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {periods.find(p => p.key === period)?.label}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('analytics.loadDescription')}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr>
                                    <th className="w-12"></th>
                                    {dayLabels.map((day, i) => (
                                        <th key={i} className="text-center font-normal text-muted-foreground p-1">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[9, 12, 15, 18].map(hour => (
                                    <tr key={hour}>
                                        <td className="text-muted-foreground pr-2">{hour}:00</td>
                                        {[1, 2, 3, 4, 5, 6, 0].map(day => { // Mon=1, Tue=2, ..., Sun=0
                                            const value = heatmapData[hour]?.[day] || 0;
                                            const intensity = value / maxHeatValue;
                                            return (
                                                <td key={day} className="p-0.5">
                                                    <div
                                                        className={cn(
                                                            "w-full h-6 rounded",
                                                            intensity === 0 && "bg-gray-200 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600",
                                                            intensity > 0 && intensity < 0.33 && "bg-green-500/30",
                                                            intensity >= 0.33 && intensity < 0.66 && "bg-yellow-500/50",
                                                            intensity >= 0.66 && "bg-red-500/60"
                                                        )}
                                                        title={language === 'en'
                                                            ? `${value} booking${value !== 1 ? 's' : ''}`
                                                            : language === 'kz'
                                                                ? `${value} жазба`
                                                                : language === 'es'
                                                                    ? `${value} reserva${value !== 1 ? 's' : ''}`
                                                                    : language === 'tr'
                                                                        ? `${value} randevu`
                                                                        : `${value} ${value === 1 ? 'запись' : value < 5 ? 'записи' : 'записей'}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600" /> {t('analyticsTooltips.none')}
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-500/30" /> {t('analyticsTooltips.low')}
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-yellow-500/50" /> {t('analyticsTooltips.medium')}
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-red-500/60" /> {t('analyticsTooltips.high')}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* No Data State */}
            {metrics.bookings === 0 && (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-4">{t('analytics.noData')}</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsGenerating(true);
                                generateMockData();
                                setTimeout(() => setIsGenerating(false), 500);
                            }}
                            disabled={isGenerating}
                            className="gap-2"
                        >
                            <Database className="w-4 h-4" />
                            {isGenerating ? 'Генерация...' : 'Добавить тестовые данные (100 записей)'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Analytics;
