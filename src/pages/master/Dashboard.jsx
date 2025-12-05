import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ClockWidget } from '@/components/features/ClockWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, CreditCard, CalendarCheck, XCircle, Clock } from 'lucide-react';
import { format, isSameMonth, isSameWeek, parseISO } from 'date-fns';
import { cn, formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';

export const Dashboard = () => {
    const { appointments, services, t } = useStore();
    const [period, setPeriod] = useState('month'); // 'week' | 'month' | 'all'

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

        return { total, completed, confirmed, cancelled, pending, revenue, uniqueClients };
    }, [filteredAppointments]);

    // Chart Data
    const chartData = useMemo(() => {
        if (period === 'all') return [];

        // Group by date
        const grouped = filteredAppointments.reduce((acc, app) => {
            if (['completed', 'confirmed'].includes(app.status)) {
                acc[app.date] = (acc[app.date] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(grouped)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([date, count]) => ({ date, count }));

    }, [filteredAppointments, period]);

    const statCards = [
        {
            title: 'Доход',
            value: `${formatPrice(stats.revenue)} ₸`,
            icon: CreditCard,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            title: 'Клиенты',
            value: stats.uniqueClients,
            icon: Users,
            color: 'text-red-500',
            bg: 'bg-red-500/10'
        },
        {
            title: 'Заявки',
            value: stats.pending,
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
    ];

    const maxChartValue = Math.max(...chartData.map(d => d.count), 5);

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">Студия</h1>

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
                        {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Все время'}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className={cn("overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow", index === 0 && "col-span-2")}>
                            <CardContent className={cn("p-4 flex items-center gap-4", index === 0 ? "flex-row justify-between" : "flex-col text-center space-y-2")}>
                                {index === 0 ? (
                                    <>
                                        <div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</div>
                                            <div className="text-3xl font-bold tracking-tight mt-1">{stat.value}</div>
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={`p-2 rounded-full ${stat.bg} ${stat.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold tracking-tight">{stat.value}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Simple Bar Chart */}
            {(period !== 'all' && chartData.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Динамика записей</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-32 gap-2 mt-2">
                            {chartData.map((d) => (
                                <div key={d.date} className="flex flex-col items-center justify-end flex-1 h-full gap-2 group">
                                    <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-auto">{d.count}</div>
                                    <div
                                        className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative group"
                                        style={{ height: `${(d.count / maxChartValue) * 100}%` }}
                                    >
                                    </div>
                                    <div className="text-[10px] text-muted-foreground rotate-0 whitespace-nowrap">
                                        {format(parseISO(d.date), 'dd.MM')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Efficiency Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Конверсия</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Завершено vs Отменено</span>
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
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Успешно</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Отказано</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
