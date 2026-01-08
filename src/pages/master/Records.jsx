import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chat } from '@/components/features/Chat';
import { MasterBookingModal } from '@/components/features/MasterBookingModal';
import { MessageCircle, Plus, QrCode, CheckCheck, List, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatPrice, formatPhoneNumber } from '@/lib/utils';
import { format, addDays, startOfWeek, isSameDay, isToday, isTomorrow, parseISO } from 'date-fns';

export const Records = () => {
    const { appointments, updateAppointmentStatus, t, language, locale, salonSettings, workSchedule } = useStore();
    const location = useLocation();
    const navigate = useNavigate();

    // State
    const [activeTab, setActiveTab] = React.useState('pending');
    const [viewMode, setViewMode] = React.useState('list'); // 'list' | 'calendar' | 'timeline'
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [chatOpen, setChatOpen] = React.useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
    const [showCompleteAllConfirm, setShowCompleteAllConfirm] = React.useState(false);
    const [calendarMonth, setCalendarMonth] = React.useState(new Date());

    // Filter appointments
    const pending = appointments.filter(app => app.status === 'pending');
    const active = appointments.filter(app => app.status === 'confirmed' || app.status === 'in_progress');
    const archive = appointments.filter(app => ['completed', 'cancelled'].includes(app.status));
    const displayed = activeTab === 'pending' ? pending : activeTab === 'active' ? active : archive;

    // Helper functions
    const getService = (id) => useStore.getState().services.find(s => s.id === id);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const getServiceNames = (app) => {
        const allServices = useStore.getState().services;
        const ids = app.serviceIds || (app.serviceId ? [app.serviceId] : []);
        if (ids.length === 0) return t('booking.service');
        return ids.map(id => {
            const service = allServices.find(s => s.id === id);
            return getServiceName(service);
        }).filter(Boolean).join(' + ');
    };

    const getAppointmentPrice = (app) => {
        if (app.price) return app.price;
        const allServices = useStore.getState().services;
        const ids = app.serviceIds || (app.serviceId ? [app.serviceId] : []);
        return ids.reduce((sum, id) => {
            const service = allServices.find(s => s.id === id);
            return sum + (service?.price || 0);
        }, 0);
    };

    // Status color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'border-l-4 border-l-yellow-500';
            case 'confirmed': return 'border-l-4 border-l-green-500';
            case 'in_progress': return 'border-l-4 border-l-blue-500';
            case 'completed': return 'border-l-4 border-l-gray-400';
            case 'cancelled': return 'border-l-4 border-l-red-400';
            default: return '';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'confirmed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'completed': return 'bg-gray-400';
            case 'cancelled': return 'bg-red-400';
            default: return 'bg-gray-300';
        }
    };

    // Group appointments by date
    const groupedByDate = useMemo(() => {
        const groups = {};
        displayed.forEach(app => {
            const dateKey = app.date;
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(app);
        });
        // Sort by date
        return Object.entries(groups).sort(([a], [b]) => new Date(a) - new Date(b));
    }, [displayed]);

    // Get appointments for a specific date
    const getAppointmentsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(app => app.date === dateStr && app.status !== 'cancelled');
    };

    // Check if date has appointments
    const hasAppointments = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.some(app => app.date === dateStr && app.status !== 'cancelled');
    };

    // Format date header
    const formatDateHeader = (dateStr) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return t('records.today') || 'Сегодня';
        if (isTomorrow(date)) return t('records.tomorrow') || 'Завтра';
        return format(date, 'd MMMM yyyy, EEEE', { locale: locale() });
    };

    // Week days for calendar view
    const weekDays = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [selectedDate]);

    // Time slots for timeline
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 9; h <= 21; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, []);

    // Navigation handlers
    useEffect(() => {
        if (location.state?.highlightId) {
            const app = appointments.find(a => a.id === location.state.highlightId);
            if (app) {
                const tab = app.status === 'pending' ? 'pending' :
                    (app.status === 'confirmed' || app.status === 'in_progress') ? 'active' : 'archive';
                setActiveTab(tab);
                setTimeout(() => {
                    const el = document.getElementById(`record-${app.id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
                    }
                }, 100);
            }
        }
    }, [location.state, appointments]);

    const completeAllActive = () => {
        active.forEach(app => updateAppointmentStatus(app.id, 'completed'));
        setShowCompleteAllConfirm(false);
    };

    // Helper for day names
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const getDayLabel = (date) => t(`days.${dayKeys[date.getDay()]}`);

    // MiniCalendar Component
    const MiniCalendar = () => {
        const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
        const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const days = [];
        for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        const shortWeekDays = useMemo(() => {
            const start = startOfWeek(new Date(), { weekStartsOn: 1 });
            return Array.from({ length: 7 }, (_, i) => {
                const d = addDays(start, i);
                return getDayLabel(d);
            });
        }, [language]);

        return (
            <div className="bg-card rounded-lg border p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium text-sm capitalize">
                        {format(calendarMonth, 'LLLL yyyy', { locale: locale() })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {shortWeekDays.map((d, i) => (
                        <div key={i} className="text-muted-foreground py-1">{d}</div>
                    ))}
                    {days.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                        const isSelected = isSameDay(date, selectedDate);
                        const hasDots = hasAppointments(date);
                        return (
                            <button
                                key={day}
                                className={cn(
                                    "relative h-9 w-9 p-0 flex items-center justify-center rounded-md text-sm transition-all mx-auto",
                                    isSelected ? "bg-primary text-primary-foreground shadow-md scale-105" : "hover:bg-muted",
                                    isToday(date) && !isSelected && "ring-1 ring-primary"
                                )}
                                onClick={() => setSelectedDate(date)}
                            >
                                {day}
                                {hasDots && (
                                    <span className={cn("absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary")} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Appointment Card Component
    const AppointmentCard = ({ app, showActions = true }) => {
        const handleInteraction = () => {
            if (app.unreadChanges) {
                useStore.getState().updateAppointment(app.id, { unreadChanges: false });
            }
        };

        return (
            <Card
                id={`record-${app.id}`}
                className={cn("transition-all duration-500", getStatusColor(app.status), app.unreadChanges && "shadow-md ring-1 ring-blue-500/20")}
                onClick={handleInteraction}
            >
                <CardContent className="p-4 space-y-3 relative">
                    {app.unreadChanges && (
                        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-bold">{app.clientName}</div>
                            <div className="text-sm text-muted-foreground">{formatPhoneNumber(app.clientPhone)}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-medium">{app.time}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                                {format(new Date(app.date), 'd MMMM yyyy', { locale: locale() })}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-muted p-2 rounded">
                        <span className="text-sm">{getServiceNames(app)} • {formatPrice(getAppointmentPrice(app))} {salonSettings?.currency || '₸'}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                            e.stopPropagation();
                            setChatOpen(app.id);
                            handleInteraction();
                        }}>
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    </div>

                    {showActions && activeTab === 'pending' && (
                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus(app.id, 'confirmed');
                                handleInteraction();
                            }}>
                                {t('records.accept')}
                            </Button>
                            <Button variant="outline" className="flex-1" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus(app.id, 'cancelled');
                                handleInteraction();
                            }}>
                                {t('records.reject')}
                            </Button>
                        </div>
                    )}

                    {showActions && activeTab === 'active' && (
                        <div className="pt-2">
                            <Button className="w-full" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus(app.id, 'completed');
                                handleInteraction();
                            }}>
                                {t('records.complete')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    // List View with Date Grouping
    const ListView = () => (
        <div className="space-y-6">
            {groupedByDate.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    {t('clientVisits.noRecords')}
                </div>
            ) : (
                groupedByDate.map(([dateKey, apps]) => (
                    <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-sm font-medium text-muted-foreground px-2 capitalize">
                                {formatDateHeader(dateKey)}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="space-y-3">
                            {apps.sort((a, b) => a.time.localeCompare(b.time)).map(app => (
                                <AppointmentCard key={app.id} app={app} />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // Week Calendar View
    const CalendarView = () => {
        const selectedDateApps = getAppointmentsForDate(selectedDate);

        return (
            <div className="space-y-4">
                <MiniCalendar />

                {/* Week Strip */}
                <div className="flex gap-1 overflow-x-auto pb-2">
                    {weekDays.map(day => {
                        const dayApps = getAppointmentsForDate(day);
                        const isSelected = isSameDay(day, selectedDate);
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "flex-1 min-w-[60px] p-2 rounded-lg text-center transition-all",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
                                    isToday(day) && !isSelected && "ring-2 ring-primary"
                                )}
                            >
                                <div className="text-xs opacity-70">{getDayLabel(day)}</div>
                                <div className="text-lg font-bold">{format(day, 'd')}</div>
                                {dayApps.length > 0 && (
                                    <div className="flex flex-col items-center mt-1">
                                        <div className="flex justify-center gap-0.5">
                                            {dayApps.slice(0, 3).map((_, i) => (
                                                <span key={i} className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary")} />
                                            ))}
                                        </div>
                                        {dayApps.length > 3 && (
                                            <span className={cn("text-[10px] mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>(+{dayApps.length - 3})</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Day Appointments */}
                <div className="space-y-3">
                    <h3 className="font-medium capitalize">{formatDateHeader(format(selectedDate, 'yyyy-MM-dd'))}</h3>
                    {selectedDateApps.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 bg-muted rounded-lg">
                            {t('records.noAppointments') || 'Нет записей на этот день'}
                        </div>
                    ) : (
                        selectedDateApps.sort((a, b) => a.time.localeCompare(b.time)).map(app => (
                            <AppointmentCard key={app.id} app={app} showActions={false} />
                        ))
                    )}
                </div>
            </div>
        );
    };

    // Timeline View
    const TimelineView = () => {
        const dayApps = getAppointmentsForDate(selectedDate);

        return (
            <div className="space-y-4">
                <MiniCalendar />

                <h3 className="font-medium capitalize">{formatDateHeader(format(selectedDate, 'yyyy-MM-dd'))}</h3>

                <div className="space-y-0">
                    {timeSlots.filter((_, i) => i % 2 === 0).map((slot, index, array) => {
                        const slotApps = dayApps.filter(app => app.time?.startsWith(slot.split(':')[0]));
                        const hasApp = slotApps.length > 0;
                        const isLast = index === array.length - 1;

                        return (
                            <div key={slot} className="flex items-stretch gap-4">
                                {/* Time Column */}
                                <div className="w-14 text-sm text-muted-foreground text-right pt-1">{slot}</div>

                                {/* Track Column */}
                                <div className="relative w-6 flex flex-col items-center">
                                    {/* Vertical Line */}
                                    <div className={cn("absolute top-0 w-px bg-border", isLast ? "h-4" : "bottom-0")} />

                                    {/* Dot */}
                                    <div className={cn(
                                        "relative w-3 h-3 rounded-full border-2 mt-2 z-10 shrink-0",
                                        hasApp ? "bg-primary border-primary" : "bg-background border-border"
                                    )} />
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 min-h-[40px] pb-6">
                                    {hasApp ? (
                                        <div className="space-y-2">
                                            {slotApps.map(app => (
                                                <div key={app.id} className={cn("bg-card border rounded-lg p-2 shadow-sm transition-all hover:shadow-md", getStatusColor(app.status))}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-sm">{app.clientName}</span>
                                                        <span className="text-xs text-muted-foreground">{app.time}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{getServiceNames(app)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground pt-1.5 opacity-50 relative top-[-1px]">{t('records.freeSlot') || 'Свободно'}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('nav.records')}</h1>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate('/master/checkin')}>
                        <QrCode className="w-4 h-4 mr-2" />
                        Check-in
                    </Button>
                    <Button size="sm" onClick={() => setIsBookingModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('records.addAppointment')}
                    </Button>
                </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all", viewMode === 'list' ? "bg-background shadow" : "text-muted-foreground")}
                    onClick={() => setViewMode('list')}
                >
                    <List className="w-4 h-4" />
                    {t('records.viewList') || 'Список'}
                </button>
                <button
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all", viewMode === 'calendar' ? "bg-background shadow" : "text-muted-foreground")}
                    onClick={() => setViewMode('calendar')}
                >
                    <Calendar className="w-4 h-4" />
                    {t('records.viewCalendar') || 'Календарь'}
                </button>
                <button
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all", viewMode === 'timeline' ? "bg-background shadow" : "text-muted-foreground")}
                    onClick={() => setViewMode('timeline')}
                >
                    <Clock className="w-4 h-4" />
                    {t('records.viewTimeline') || 'Таймлайн'}
                </button>
            </div>

            {/* Status Tabs (only for list view) */}
            {viewMode === 'list' && (
                <>
                    <div className="flex p-1 bg-muted rounded-lg overflow-x-auto">
                        {['pending', 'active', 'archive'].map((tab) => (
                            <button
                                key={tab}
                                className={cn(
                                    "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center justify-center gap-2",
                                    activeTab === tab ? "bg-background shadow" : "text-muted-foreground"
                                )}
                                onClick={() => setActiveTab(tab)}
                            >
                                <span className={cn("w-2 h-2 rounded-full", tab === 'pending' ? 'bg-yellow-500' : tab === 'active' ? 'bg-green-500' : 'bg-gray-400')} />
                                {t(`records.${tab}`)} ({tab === 'pending' ? pending.length : tab === 'active' ? active.length : archive.length})
                            </button>
                        ))}
                    </div>

                    {activeTab === 'active' && active.length > 0 && (
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => setShowCompleteAllConfirm(true)}>
                                <CheckCheck className="w-4 h-4 mr-2" />
                                {language === 'en' ? 'Complete All' : language === 'es' ? 'Completar todo' : language === 'tr' ? 'Tümünü tamamla' : language === 'kz' ? 'Барлығын аяқтау' : 'Завершить все'} ({active.length})
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Content */}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
            {viewMode === 'timeline' && <TimelineView />}

            {/* Modals */}
            <Modal isOpen={!!chatOpen} onClose={() => setChatOpen(null)} title={t('records.chatClient')}>
                <Chat appointmentId={chatOpen} onClose={() => setChatOpen(null)} />
            </Modal>

            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title={t('records.newAppointment')}>
                <MasterBookingModal onClose={() => setIsBookingModalOpen(false)} />
            </Modal>

            <Modal isOpen={showCompleteAllConfirm} onClose={() => setShowCompleteAllConfirm(false)} title={language === 'en' ? 'Complete All?' : language === 'es' ? '¿Completar todo?' : language === 'tr' ? 'Tümünü tamamla?' : language === 'kz' ? 'Барлығын аяқтау?' : 'Завершить все?'}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {language === 'en' ? `Are you sure you want to complete ${active.length} appointment(s)?` : language === 'es' ? `¿Desea completar ${active.length} cita(s)?` : language === 'tr' ? `${active.length} randevuyu tamamlamak istiyor musunuz?` : language === 'kz' ? `${active.length} жазбаны аяқтағыңыз келе ме?` : `Вы уверены, что хотите завершить ${active.length} запись(ей)?`}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCompleteAllConfirm(false)}>{t('common.cancel')}</Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={completeAllActive}>
                            <CheckCheck className="w-4 h-4 mr-2" />
                            {t('common.confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
