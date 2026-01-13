import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Bell, Check, Calendar, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const Notifications = () => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead, user, t, locale, appointments, reviews } = useStore();
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);
    const navigate = useNavigate();

    const userNotifications = notifications.filter(n => n.recipient === user.role || (!n.recipient && user.role === 'master'));
    const unreadCount = userNotifications.filter(n => !n.read).length;

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'new': return <Calendar className="h-4 w-4 text-blue-500" />;
            case 'confirmed': return <Check className="h-4 w-4 text-green-500" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'rescheduled': return <Clock className="h-4 w-4 text-orange-500" />;
            case 'completed': return <Check className="h-4 w-4 text-purple-500" />; // Or a generic star/check
            case 'warning': return <Bell className="h-4 w-4 text-yellow-500" />; // Suspicious booking
            default: return <Bell className="h-4 w-4" />;
        }
    };

    // Russian pluralization for bookings count
    const pluralizeBookings = (count) => {
        const mod10 = count % 10;
        const mod100 = count % 100;
        if (mod100 >= 11 && mod100 <= 14) return `${count} записей`;
        if (mod10 === 1) return `${count} запись`;
        if (mod10 >= 2 && mod10 <= 4) return `${count} записи`;
        return `${count} записей`;
    };

    const handleNotificationClick = (notification) => {
        markNotificationAsRead(notification.id);
        setIsOpen(false);

        // 1. Visit Completed -> Rate (Client)
        if (notification.type === 'completed' && user.role === 'client') {
            const app = appointments.find(a => a.id === notification.appointmentId);
            const isRated = reviews.some(r => r.appointmentId === notification.appointmentId);

            navigate('/visits', {
                state: {
                    highlightId: notification.appointmentId,
                    openFeedbackFor: !isRated ? notification.appointmentId : null
                }
            });
            return;
        }

        // 2. New Booking / Confirmed / Cancelled / Warning (suspicious) -> Go to details
        if (['new', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'warning'].includes(notification.type)) {
            const targetPath = user.role === 'client' ? '/visits' : '/master/records';
            navigate(targetPath, { state: { highlightId: notification.appointmentId } });
            return;
        }

        // 3. New Review -> Go to reviews (Master)
        if (notification.reviewId) {
            navigate(`/master/reviews?reviewId=${notification.reviewId}`);
            return;
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Popup */}
                        <motion.div
                            key="popup"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{ backgroundColor: 'hsl(var(--background))' }}
                            className="fixed inset-x-2 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 max-w-[calc(100vw-1rem)] border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                                <h3 className="font-semibold">{t('notifications.title')}</h3>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="text-xs h-auto py-1"
                                        onClick={() => markAllNotificationsAsRead(user.role)}
                                    >
                                        {t('notifications.markAllRead')}
                                    </Button>
                                )}
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto">
                                {userNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        {t('notifications.empty')}
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {userNotifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                                                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                                )}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                                        "bg-background border shadow-sm"
                                                    )}>
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary")}>
                                                                {notification.titleKey ? t(notification.titleKey) : notification.title}
                                                            </p>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                                {formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: locale() })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                                                            {notification.messageKey
                                                                ? t(notification.messageKey).replace('{clientName}', notification.params?.clientName || '')
                                                                    .replace('{date}', notification.params?.date || '')
                                                                    .replace('{time}', notification.params?.time || '')
                                                                    .replace('{originalDate}', notification.params?.originalDate || '')
                                                                    .replace('{countText}', pluralizeBookings(notification.params?.count || 0))
                                                                    .replace('{count}', notification.params?.count || '')
                                                                    .replace('{rating}', '⭐'.repeat(notification.params?.rating || 0))
                                                                : notification.message}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
