import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chat } from '@/components/features/Chat';
import { MasterBookingModal } from '@/components/features/MasterBookingModal';
import { MasterDetailsModal } from '@/components/features/MasterDetailsModal';
import { MessageCircle, Plus, QrCode, CheckCheck, List, Calendar, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, User, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatPrice, formatPhoneNumber } from '@/lib/utils';
import { format, addDays, startOfWeek, isSameDay, isToday, isTomorrow, parseISO } from 'date-fns';

export const Records = () => {
    const { appointments, updateAppointmentStatus, t, language, locale, salonSettings, workSchedule, getMasters, getNextAvailableMaster, updateAppointment, services } = useStore();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useStore(); // destructure user

    // Redirect if not master
    useEffect(() => {
        if (user?.role !== 'master') {
            navigate('/');
        }
    }, [user?.role, navigate]);

    // State
    const [activeTab, setActiveTab] = React.useState('pending');
    const [viewMode, setViewMode] = React.useState('list'); // 'list' | 'calendar' | 'timeline'
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [chatOpen, setChatOpen] = React.useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
    const [bookingPreset, setBookingPreset] = React.useState({ date: null, time: null, masterId: null });
    const [selectedMaster, setSelectedMaster] = React.useState(null);
    const [showCompleteAllConfirm, setShowCompleteAllConfirm] = React.useState(false);
    const [calendarMonth, setCalendarMonth] = React.useState(new Date());

    const lang = language || 'ru';

    // Level labels
    const levelLabels = {
        apprentice: { ru: 'Ученик', en: 'Apprentice', kz: 'Шәкірт', es: 'Aprendiz', tr: 'Çırak' },
        master: { ru: 'Мастер', en: 'Master', kz: 'Шебер', es: 'Maestro', tr: 'Usta' },
        senior: { ru: 'Старший', en: 'Senior', kz: 'Аға шебер', es: 'Senior', tr: 'Kıdemli' },
        top: { ru: 'Топ', en: 'Top', kz: 'Топ', es: 'Top', tr: 'Top' }
    };

    // Role badges configuration
    const roleBadges = {
        owner: { label: { ru: 'Владелец', en: 'Owner', kz: 'Иесі', tr: 'Sahip', es: 'Propietario' }, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        admin: { label: { ru: 'Админ', en: 'Admin', kz: 'Әкімші', tr: 'Yönetici', es: 'Admin' }, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        employee: { label: { ru: 'Специалист', en: 'Specialist', kz: 'Маман', tr: 'Uzman', es: 'Especialista' }, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    };

    // Filter appointments
    const pending = appointments.filter(app => app.status === 'pending');
    const active = appointments.filter(app => app.status === 'confirmed' || app.status === 'in_progress');
    const archive = appointments.filter(app => ['completed', 'cancelled'].includes(app.status));
    const displayed = activeTab === 'pending' ? pending : activeTab === 'active' ? active : archive;



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

    // Appointment Card Component extraction is handled by append below

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
                        <div className="space-y-0 divide-y divide-border/50 border rounded-lg bg-level-1/30 overflow-hidden">
                            {apps.sort((a, b) => a.time.localeCompare(b.time)).map((app, index) => (
                                <AppointmentCard
                                    key={app.id}
                                    app={app}
                                    activeTab={activeTab}
                                    className={cn(
                                        "rounded-none border-0 shadow-none",
                                        index % 2 === 0 ? "bg-level-1/50" : "bg-transparent hover:bg-level-1/30"
                                    )}
                                />
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
                <div className="flex gap-1 overflow-x-auto pt-1 pb-2">
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
        const masters = getMasters();
        const dayApps = getAppointmentsForDate(selectedDate);
        const unassignedApps = dayApps.filter(app => !app.masterId);
        const showUnassigned = unassignedApps.length > 0;

        // Map masters to use consistent id field (tgUserId is the actual ID)
        const gridColumns = masters.map(m => ({ ...m, id: m.tgUserId || m.id }));
        if (showUnassigned) {
            gridColumns.unshift({ id: 'unassigned', name: t('records.unassigned'), isUnassigned: true });
        }

        // Slot height in pixels (h-16 = 64px) for 30 mins
        const SLOT_HEIGHT_CLASS = "h-16";
        const SLOT_HEIGHT_PX = 64;

        return (
            <div className="space-y-4">
                <MiniCalendar />

                <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize">{formatDateHeader(format(selectedDate, 'yyyy-MM-dd'))}</h3>
                    <div className="flex gap-2">
                        <Badge variant="warning">{t('status.pending')}</Badge>
                        <Badge variant="success">{t('status.confirmed')}</Badge>
                    </div>
                </div>

                <ScrollableTimeline gridColumns={gridColumns} dayApps={dayApps} timeSlots={timeSlots} />
            </div>
        );
    };

    const ScrollableTimeline = ({ gridColumns, dayApps, timeSlots }) => {
        const scrollRef = React.useRef(null);
        const floatingScrollRef = React.useRef(null);
        const contentRef = React.useRef(null);
        const containerRef = React.useRef(null);
        const scrollInterval = React.useRef(null);
        const hoverTimeout = React.useRef(null);
        const [canScroll, setCanScroll] = React.useState({ left: false, right: false, top: false, bottom: false });
        const [hoveredAppId, setHoveredAppId] = React.useState(null);
        const [contentWidth, setContentWidth] = React.useState(0);
        const [showFloatingScrollbar, setShowFloatingScrollbar] = React.useState(true);
        const [tableRect, setTableRect] = React.useState({ left: 0, right: 0, width: 0 });
        const isSyncingScroll = React.useRef(false);

        const checkScroll = () => {
            if (scrollRef.current) {
                const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = scrollRef.current;
                setCanScroll({
                    left: scrollLeft > 0,
                    right: scrollLeft < scrollWidth - clientWidth - 1,
                    top: scrollTop > 0,
                    bottom: scrollTop < scrollHeight - clientHeight - 1
                });

                // Robust visibility logic: Hide floating scrollbar if we are near the bottom
                // Use a generous buffer (e.g. 20px) to ensure it hides before we see the native one fully
                const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
                setShowFloatingScrollbar(!isAtBottom);
            }
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setTableRect({ left: rect.left, right: window.innerWidth - rect.right, width: rect.width });
            }
        };

        // ResizeObserver for accurate content width
        useEffect(() => {
            if (!contentRef.current) return;
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    // Use borderBoxSize if available for better accuracy, fall back to contentRect
                    const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
                    setContentWidth(width);
                    checkScroll(); // Re-check scroll on resize
                }
            });
            observer.observe(contentRef.current);
            return () => observer.disconnect();
        }, []);

        useEffect(() => {
            // Delay to ensure DOM is fully rendered
            const timer = setTimeout(() => {
                checkScroll();
            }, 50);
            window.addEventListener('resize', checkScroll);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', checkScroll);
                stopScrolling();
            };
        }, [gridColumns, dayApps]);

        // Sync main scroll to floating scrollbar
        const handleMainScroll = () => {
            if (isSyncingScroll.current) return;
            isSyncingScroll.current = true;
            if (floatingScrollRef.current && scrollRef.current) {
                floatingScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
            }
            checkScroll();
            requestAnimationFrame(() => { isSyncingScroll.current = false; });
        };

        // Sync floating scrollbar to main scroll
        const handleFloatingScroll = () => {
            if (isSyncingScroll.current) return;
            isSyncingScroll.current = true;
            if (scrollRef.current && floatingScrollRef.current) {
                scrollRef.current.scrollLeft = floatingScrollRef.current.scrollLeft;
            }
            requestAnimationFrame(() => { isSyncingScroll.current = false; });
        };

        const stopScrolling = () => {
            if (scrollInterval.current) {
                clearInterval(scrollInterval.current);
                scrollInterval.current = null;
            }
        };

        const startScrolling = (direction) => {
            stopScrolling();
            if (!scrollRef.current) return;

            // Speed settings
            const step = 10;
            const intervalTime = 16; // ~60fps check

            scrollInterval.current = setInterval(() => {
                const curr = scrollRef.current;
                if (!curr) return;

                switch (direction) {
                    case 'left': curr.scrollLeft -= step; break;
                    case 'right': curr.scrollLeft += step; break;
                    case 'top': curr.scrollTop -= step; break;
                    case 'bottom': curr.scrollTop += step; break;
                }
                // We don't call checkScroll here to avoid excessive React updates,
                // but the onScroll event on the div will trigger it naturally.
            }, intervalTime);
        };

        const handleMouseEnterCard = (app, e) => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

            const target = e.currentTarget;
            const scrollContainer = scrollRef.current;

            if (scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const cardRect = target.getBoundingClientRect();
                const headerHeight = 80;
                const timeColumnWidth = 80; // Sticky time column width

                // Calculate distance from the sticky header bottom
                const topOffset = cardRect.top - containerRect.top;

                // If card is too close to the header (overlapped or nearly overlapped)
                // We want to scroll UP (move content DOWN) so it clears the header
                if (topOffset < headerHeight + 10) {
                    const scrollAmount = topOffset - headerHeight - 20; // Target 20px below header
                    scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                }

                // Calculate distance from the sticky time column right edge
                const leftOffset = cardRect.left - containerRect.left;

                // If card is too close to or overlapping the time column
                // We want to scroll LEFT so the card clears the time column
                if (leftOffset < timeColumnWidth + 10) {
                    const scrollAmount = leftOffset - timeColumnWidth - 20; // Target 20px after time column
                    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }

            // Delay the expansion slightly to allow scroll to start
            hoverTimeout.current = setTimeout(() => {
                setHoveredAppId(app.id);
            }, 150);
        };

        const handleMouseLeaveCard = () => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            setHoveredAppId(null);
        };

        const SLOT_HEIGHT_CLASS = "h-16";
        const SLOT_HEIGHT_PX = 64;
        const HEADER_HEIGHT = 80; // Slightly taller to accommodate content comfortably

        return (
            <div ref={containerRef} className="border rounded-lg bg-background shadow-sm overflow-visible flex flex-col h-[calc(100vh-220px)] relative group/timeline">

                <style>
                    {`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                            height: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: rgba(160, 160, 160, 0.2);
                            border-radius: 9999px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background-color: rgba(160, 160, 160, 0.4);
                        }
                        /* Firefox */
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(160, 160, 160, 0.2) transparent;
                        }
                    `}
                </style>
                {/* Single scrollable container for both directions */}
                <div
                    className="flex-1 overflow-auto relative custom-scrollbar"
                    ref={scrollRef}
                    onScroll={handleMainScroll}
                >
                    <div className="min-w-max" ref={contentRef}>
                        {/* Header */}
                        <div className="flex border-b border-border/60 bg-muted/40 sticky top-0 z-50 backdrop-blur-md shadow-sm w-full" style={{ minHeight: HEADER_HEIGHT }}>
                            {/* Corner (Time header) */}
                            <div className="w-16 shrink-0 border-r border-border/60 bg-background/80 sticky left-0 z-[60] border-b border-border/60 flex items-center justify-center" style={{ borderBottomColor: 'transparent' }}>
                                <Clock className="w-4 h-4 text-muted-foreground" />
                            </div>


                            {/* Master Headers */}
                            {gridColumns.map(master => {
                                const count = dayApps.filter(a => master.isUnassigned ? !a.masterId : a.masterId === master.id).length;
                                const isUnassigned = master.isUnassigned;

                                return (
                                    <div
                                        key={master.id}
                                        className={cn(
                                            "w-[200px] shrink-0 border-r border-transparent last:border-r-0 flex items-center justify-start relative group/header transition-colors",
                                            !isUnassigned && "cursor-pointer hover:bg-muted/50"
                                        )}
                                        onClick={() => !isUnassigned && setSelectedMaster(master)}
                                    >
                                        {/* Strong Divider */}
                                        <div className="absolute right-0 top-2 bottom-2 w-[1px] bg-foreground/20 block last:hidden" />

                                        <div className="flex items-center gap-3 p-3 w-full">
                                            {/* Left: Avatar */}
                                            <div className="relative shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-background shadow-sm">
                                                    {master.avatar ? (
                                                        <img
                                                            src={master.avatar}
                                                            alt={master.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <User className="h-5 w-5 text-primary" style={{ display: master.avatar ? 'none' : 'block' }} />
                                                </div>
                                                {count > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm border-2 border-background">
                                                        {count}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Right: Info */}
                                            <div className="flex flex-col items-start min-w-0 flex-1 justify-center gap-0.5">
                                                <div className="text-sm font-bold truncate w-full text-foreground" title={master.name}>
                                                    {master.name}
                                                </div>

                                                <div className="flex items-center gap-1.5 w-full">
                                                    {!isUnassigned && (
                                                        <span className={cn("text-[10px] px-1.5 py-px rounded-[4px] font-medium shrink-0 opacity-90", roleBadges[master.role]?.className || 'bg-gray-100 text-gray-700')}>
                                                            {roleBadges[master.role]?.label?.[lang] || master.role}
                                                        </span>
                                                    )}

                                                    {!isUnassigned && master.level && (
                                                        <span className="text-[11px] text-muted-foreground/80 truncate font-medium">
                                                            {levelLabels[master.level]?.[lang] || master.level}
                                                        </span>
                                                    )}
                                                </div>

                                                {isUnassigned && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Очередь
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Body */}
                        <div className="divide-y relative w-full">
                            {timeSlots.map(slot => (
                                <div key={slot} className={cn("flex transition-colors group/row", SLOT_HEIGHT_CLASS)}>
                                    {/* Time Column */}
                                    <div className="w-16 shrink-0 flex items-start justify-center pt-2 text-xs font-mono text-muted-foreground border-r bg-background/95 backdrop-blur sticky left-0 z-50 select-none">
                                        {slot}
                                    </div>

                                    {/* Master Columns */}
                                    {/* Master Columns */}
                                    {gridColumns.map(master => {
                                        const colApps = dayApps.filter(app => {
                                            const isMaster = master.isUnassigned ? !app.masterId : app.masterId === master.id;
                                            return isMaster && app.time === slot;
                                        });

                                        return (
                                            <div key={`${slot}-${master.id}`} className="w-[200px] shrink-0 border-r last:border-r-0 relative p-1 group/cell">
                                                {colApps.map(app => {
                                                    const durationSlots = (app.totalDuration || app.duration || 60) / 30;
                                                    const heightPx = durationSlots * SLOT_HEIGHT_PX - 8;
                                                    const isHovered = hoveredAppId === app.id;

                                                    return (
                                                        <div
                                                            key={app.id}
                                                            className={cn(
                                                                "absolute inset-x-1 top-1 rounded-md border p-2 text-xs shadow-sm cursor-pointer transition-all duration-200",
                                                                getStatusColor(app.status),
                                                                "bg-card overflow-hidden",
                                                                isHovered ? "z-40 shadow-lg scale-[1.02]" : "z-10"
                                                            )}
                                                            style={{ height: `${heightPx}px` }}
                                                            onMouseEnter={(e) => handleMouseEnterCard(app, e)}
                                                            onMouseLeave={handleMouseLeaveCard}
                                                            onClick={() => {
                                                                setViewMode('list');
                                                                setActiveTab(app.status === 'pending' ? 'pending' : (app.status === 'confirmed' || app.status === 'in_progress') ? 'active' : 'archive');
                                                                setTimeout(() => {
                                                                    const el = document.getElementById(`record-${app.id}`);
                                                                    if (el) {
                                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        // Add highlight animation
                                                                        el.classList.add('ring-2', 'ring-primary', 'animate-pulse');
                                                                        setTimeout(() => {
                                                                            el.classList.remove('ring-2', 'ring-primary', 'animate-pulse');
                                                                        }, 2000);
                                                                    }
                                                                }, 100);
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-start gap-1">
                                                                <span className="font-bold truncate">{app.clientName}</span>
                                                                <span className="opacity-75 text-[10px] whitespace-nowrap bg-background/50 px-1 rounded">
                                                                    {format(new Date(app.date), 'dd.MM.yyyy')}, {app.time}
                                                                </span>
                                                            </div>
                                                            <div className="truncate opacity-75 mt-0.5">{getServiceNames(app, services, t, language)}</div>
                                                            <div className="absolute bottom-1 right-2 opacity-50 font-mono">{formatPrice(getAppointmentPrice(app, services))} {salonSettings?.currency || '₸'}</div>
                                                        </div>
                                                    );
                                                })}
                                                {/* Add Button */}
                                                {!colApps.length && (
                                                    <button
                                                        className="w-full h-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-all"
                                                        onClick={() => {
                                                            setBookingPreset({ date: selectedDate, time: slot, masterId: master.isUnassigned ? null : master.id });
                                                            setIsBookingModalOpen(true);
                                                        }}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <Plus className="w-4 h-4" />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>



            </div >
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('nav.records')}</h1>
                <div className="flex gap-2">
                    {salonSettings?.checkinMode !== 'disabled' && (
                        <Button size="sm" variant="outline" onClick={() => navigate('/master/checkin')}>
                            <QrCode className="w-4 h-4 mr-2" />
                            Check-in
                        </Button>
                    )}
                    <Button size="sm" onClick={() => setIsBookingModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('records.addAppointment')}
                    </Button>
                </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border/50">
                <button
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                        viewMode === 'list'
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                    onClick={() => setViewMode('list')}
                >
                    <List className="w-4 h-4" />
                    {t('records.viewList') || 'Список'}
                </button>
                <button
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                        viewMode === 'calendar'
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                    onClick={() => setViewMode('calendar')}
                >
                    <Calendar className="w-4 h-4" />
                    {t('records.viewCalendar') || 'Календарь'}
                </button>
                <button
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                        viewMode === 'timeline'
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                    onClick={() => setViewMode('timeline')}
                >
                    <Clock className="w-4 h-4" />
                    {t('records.viewTimeline') || 'Таймлайн'}
                </button>
            </div>

            {/* Status Tabs (only for list view) */}
            {viewMode === 'list' && (
                <>
                    <div className="flex p-1 gap-1 bg-muted/50 rounded-lg overflow-x-auto border border-border/50">
                        {['pending', 'active', 'archive'].map((tab) => (
                            <button
                                key={tab}
                                className={cn(
                                    "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center justify-center gap-2",
                                    activeTab === tab
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                                )}
                                onClick={() => setActiveTab(tab)}
                            >
                                <span className={cn("w-2 h-2 rounded-full", tab === 'pending' ? 'bg-yellow-500' : tab === 'active' ? 'bg-green-500' : 'bg-gray-400')} />
                                {t(`records.${tab}`)} <span className="text-xs opacity-70 ml-1">({tab === 'pending' ? pending.length : tab === 'active' ? active.length : archive.length})</span>
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

            <Modal isOpen={isBookingModalOpen} onClose={() => { setIsBookingModalOpen(false); setBookingPreset({ date: null, time: null, masterId: null }); }} title={t('records.newAppointment')}>
                <MasterBookingModal onClose={() => { setIsBookingModalOpen(false); setBookingPreset({ date: null, time: null, masterId: null }); }} initialDate={bookingPreset.date} initialTime={bookingPreset.time} initialMasterId={bookingPreset.masterId} />
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

            {/* Master Details Modal */}
            <MasterDetailsModal
                master={selectedMaster}
                isOpen={!!selectedMaster}
                onClose={() => setSelectedMaster(null)}
            />
        </div>
    );
};

// Helper functions (extracted outside component)
// Helper functions (extracted outside component)
const getService = (id, services = []) => {
    if (!services) return undefined;
    return services.find(s => s.id === id);
};

const getServiceName = (service, language) => {
    if (!service) return '';
    if (typeof service.name === 'object') {
        return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
    }
    return service.name;
};

const getServiceNames = (app, services = [], t, language) => {
    services = services || [];
    const ids = app.serviceIds || (app.serviceId ? [app.serviceId] : []);
    if (ids.length === 0) return t('booking.service');
    return ids.map(id => {
        const service = getService(id, services);
        return getServiceName(service, language);
    }).filter(Boolean).join(' + ');
};

const getAppointmentPrice = (app, services = []) => {
    services = services || [];
    if (app.price) return app.price;
    const ids = app.serviceIds || (app.serviceId ? [app.serviceId] : []);
    return ids.reduce((sum, id) => {
        const service = getService(id, services);
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

// Extracted AppointmentCard Component
// This prevents remounting when Records state updates
const AppointmentCard = ({ app, showActions = true, activeTab }) => {
    const { appointments, updateAppointmentStatus, t, language, locale, salonSettings, getMasters, getNextAvailableMaster, updateAppointment, services } = useStore();
    const [isAssigning, setIsAssigning] = React.useState(false);
    const [pendingMaster, setPendingMaster] = React.useState(null);
    const masters = getMasters();

    const handleInteraction = () => {
        if (app.unreadChanges) {
            useStore.getState().updateAppointment(app.id, { unreadChanges: false });
        }
    };

    // Get appointments at the same date/time to check availability
    const conflictingApps = appointments.filter(a =>
        a.date === app.date &&
        a.time === app.time &&
        a.id !== app.id &&
        a.status !== 'cancelled'
    );

    // Get available masters (not booked at this time)
    const getAvailableMasters = () => {
        return masters.map(m => {
            const masterId = m.tgUserId || m.id;
            const isBusy = conflictingApps.some(a => a.masterId === masterId);
            return { ...m, id: masterId, isBusy };
        });
    };

    const availableMasters = getAvailableMasters();

    const handleAutoAssign = (e) => {
        e.stopPropagation();
        // Use Round Robin algorithm from store
        const master = getNextAvailableMaster(null, app.date, app.time);
        if (master) {
            // Format master object consistently
            const formattedMaster = {
                ...master,
                id: master.tgUserId || master.id,
            };
            setPendingMaster(formattedMaster);
        } else {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.showAlert(t('records.noMasters'));
            } else {
                alert(t('records.noMasters'));
            }
        }
    };

    const handleSelectMaster = (e, master) => {
        e.stopPropagation();
        if (master.isBusy) return; // Don't allow selecting busy masters
        setPendingMaster(master);
    };

    const handleConfirmAssignment = (e) => {
        e.stopPropagation();
        if (pendingMaster) {
            updateAppointment(app.id, { masterId: pendingMaster.id, masterName: pendingMaster.name });
            setPendingMaster(null);
            setIsAssigning(false);
        }
    };

    const handleCancelAssignment = (e) => {
        e.stopPropagation();
        setPendingMaster(null);
        setIsAssigning(false);
    };

    const assignedMaster = masters.find(m => (m.tgUserId || m.id) === app.masterId);
    // Fallback name if master deleted but name preserved, or just use stored name
    const masterName = assignedMaster?.name || app.masterName;

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

                {/* Header: Time & Status */}
                <div className="flex justify-between items-start border-b pb-2 mb-2">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground capitalize">{format(new Date(app.date), 'd MMMM', { locale: locale() })}</span>
                            <span className="font-bold text-foreground text-sm">{app.time}</span>
                        </div>
                        <Badge variant={
                            app.status === 'pending' ? 'warning' :
                                app.status === 'confirmed' ? 'success' :
                                    app.status === 'in_progress' ? 'info' :
                                        app.status === 'cancelled' ? 'destructive' : 'secondary'
                        }>
                            {t(`status.${app.status}`) || app.status}
                        </Badge>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-1.5 text-sm">
                    <div className="grid grid-cols-[80px,1fr] items-baseline gap-2">
                        <span className="text-muted-foreground text-xs">{t('roles.client')}:</span>
                        <span className="font-medium truncate">{app.clientName}</span>
                    </div>

                    <div className="grid grid-cols-[80px,1fr] items-baseline gap-2">
                        <span className="text-muted-foreground text-xs">{t('profile.phone')}:</span>
                        <span className="font-mono text-xs">{formatPhoneNumber(app.clientPhone)}</span>
                    </div>

                    <div className="grid grid-cols-[80px,1fr] items-center gap-2">
                        <span className="text-muted-foreground text-xs">{t('roles.specialist')}:</span>
                        <div className="flex-1 min-w-0">
                            {isAssigning ? (
                                <div className="text-primary animate-pulse">{t('records.selectMaster')}...</div>
                            ) : masterName ? (
                                <div className="flex items-center gap-2">
                                    {assignedMaster?.avatar && (
                                        <img src={assignedMaster.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                    )}
                                    <span className="truncate">{masterName}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-primary"
                                        onClick={(e) => { e.stopPropagation(); setIsAssigning(true); setPendingMaster(null); }}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-medium text-muted-foreground hover:text-primary"
                                    onClick={(e) => { e.stopPropagation(); setIsAssigning(true); }}
                                >
                                    {t('records.assignMaster')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Selection UI with confirmation */}
                {isAssigning && (
                    <div className="p-2 bg-muted/50 rounded-md space-y-2 animate-in fade-in slide-in-from-top-2">
                        {pendingMaster ? (
                            // Confirmation step
                            <div className="space-y-2">
                                <div className="text-sm text-center">
                                    {t('records.confirmAssignment') || 'Подтвердите назначение'}:
                                </div>
                                <div className="flex items-center justify-center gap-2 p-2 bg-background rounded">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {pendingMaster.avatar ? <img src={pendingMaster.avatar} className="h-full w-full object-cover" /> : <span className="text-sm">{pendingMaster.name?.[0]}</span>}
                                    </div>
                                    <span className="font-medium">{pendingMaster.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleCancelAssignment}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleConfirmAssignment}
                                    >
                                        {t('common.confirm')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Selection step
                            <>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full justify-start"
                                    onClick={handleAutoAssign}
                                >
                                    <span className="mr-2">⚡</span> {t('records.autoAssign')}
                                </Button>
                                <div className="h-px bg-border my-1" />
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {availableMasters.map(m => (
                                        <Button
                                            key={m.id}
                                            size="sm"
                                            variant="ghost"
                                            className={cn("w-full justify-start px-2 py-1.5 h-auto", m.isBusy && "opacity-50 cursor-not-allowed")}
                                            onClick={(e) => handleSelectMaster(e, m)}
                                            disabled={m.isBusy}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                    {m.avatar ? <img src={m.avatar} className="h-full w-full object-cover" /> : <span className="text-xs font-medium">{m.name?.[0]}</span>}
                                                </div>
                                                <span className="text-sm truncate">{m.name}</span>
                                                {m.isBusy && <span className="text-[10px] text-destructive ml-auto">{t('records.busy') || 'Занят'}</span>}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={handleCancelAssignment}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {/* Service Info */}
                <div className="flex justify-between items-center bg-muted p-2 rounded">
                    <span className="text-sm font-medium">{getServiceNames(app, services, t, language)}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{formatPrice(getAppointmentPrice(app, services))} {salonSettings?.currency || '₸'}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={(e) => {
                            e.stopPropagation();
                            setChatOpen(app.id);
                            handleInteraction();
                        }}>
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    </div>
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


