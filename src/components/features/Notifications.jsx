import React from 'react';
import { useStore } from '@/store/useStore';
import { Bell, Check, Calendar, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export const Notifications = () => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead, user } = useStore();
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);

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
            default: return <Bell className="h-4 w-4" />;
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
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                            <h3 className="font-semibold">Уведомления</h3>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    className="text-xs h-auto py-1"
                                    onClick={() => markAllNotificationsAsRead(user.role)}
                                >
                                    Прочитать все
                                </Button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {userNotifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Нет новых уведомлений
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
                                            onClick={() => markNotificationAsRead(notification.id)}
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
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                            {formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: ru })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {notification.message}
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
                )}
            </AnimatePresence>
        </div>
    );
};
