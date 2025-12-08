import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chat } from '@/components/features/Chat';
import { FeedbackModal } from '@/components/features/FeedbackModal';
import { MessageCircle, Star, Calendar, Clock, Pencil } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

import { DateTimeSelector } from '@/components/features/DateTimeSelector';
import { format } from 'date-fns';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export const Visits = () => {
    const { appointments, t, user, updateAppointmentStatus, updateAppointment, salonSettings, language, locale } = useStore();
    const location = useLocation();
    const [activeTab, setActiveTab] = React.useState('upcoming');
    const [chatOpen, setChatOpen] = React.useState(null);
    const [feedbackOpen, setFeedbackOpen] = React.useState(null); // Appointment object to rate
    const [rescheduleOpen, setRescheduleOpen] = React.useState(null); // ID of appointment to reschedule
    const [cancelConfirmationId, setCancelConfirmationId] = React.useState(null);

    // Reschedule state
    const [newDate, setNewDate] = React.useState(null);
    const [newTime, setNewTime] = React.useState(null);

    // Handle navigation via location state
    useEffect(() => {
        if (location.state) {
            const { highlightId, openFeedbackFor } = location.state;

            // 1. Open Feedback Modal
            if (openFeedbackFor) {
                const app = appointments.find(a => a.id === openFeedbackFor);
                if (app) setFeedbackOpen(app);
            }

            // 2. Scroll to Item
            if (highlightId) {
                const app = appointments.find(a => a.id === highlightId);
                if (app) {
                    // Switch tab if needed
                    const appDate = new Date(app.date + 'T' + app.time);
                    const isHistory = appDate < new Date() || app.status === 'completed' || app.status === 'cancelled';

                    if (isHistory) setActiveTab('history');
                    else setActiveTab('upcoming');

                    // Scroll after render (small delay to ensure tab switch + render)
                    setTimeout(() => {
                        const el = document.getElementById(`appointment-${highlightId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('ring-2', 'ring-primary', 'ring-offset-2'); // Visual highlight
                            setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
                        }
                    }, 100);
                }
            }
        }
    }, [location.state, appointments]);

    const myAppointments = appointments.filter(app => app.clientPhone === user.phone);

    const upcoming = myAppointments.filter(app => {
        const appDate = new Date(app.date + 'T' + app.time);
        return appDate >= new Date() && app.status !== 'completed' && app.status !== 'cancelled';
    });

    const history = myAppointments.filter(app => {
        const appDate = new Date(app.date + 'T' + app.time);
        return appDate < new Date() || app.status === 'completed' || app.status === 'cancelled';
    });

    const displayed = activeTab === 'upcoming' ? upcoming : history;

    const getService = (id) => useStore.getState().services.find(s => s.id === id);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleCancelClick = (id) => {
        setCancelConfirmationId(id);
    };

    const handleCancelConfirm = () => {
        if (cancelConfirmationId) {
            updateAppointmentStatus(cancelConfirmationId, 'cancelled');
            setCancelConfirmationId(null);
        }
    };

    const handleRescheduleStart = (app) => {
        setRescheduleOpen(app.id);
        setNewDate(new Date(app.date));
        setNewTime(app.time);
    };

    const handleRescheduleConfirm = () => {
        if (!rescheduleOpen || !newDate || !newTime) return;

        updateAppointment(rescheduleOpen, {
            date: format(newDate, 'yyyy-MM-dd'),
            time: newTime,
            status: 'pending' // Reset status to pending for master approval
        });

        setRescheduleOpen(null);
        setNewDate(null);
        setNewTime(null);
        alert(t('visits.rescheduleSuccess'));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('nav.visits')}</h1>

            <div className="flex p-1 bg-muted rounded-lg">
                <button
                    className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", activeTab === 'upcoming' ? "bg-background shadow" : "text-muted-foreground")}
                    onClick={() => setActiveTab('upcoming')}
                >
                    {t('visits.upcoming')} ({upcoming.length})
                </button>
                <button
                    className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", activeTab === 'history' ? "bg-background shadow" : "text-muted-foreground")}
                    onClick={() => setActiveTab('history')}
                >
                    {t('visits.history')} ({history.length})
                </button>
            </div>

            <div className="space-y-4">
                {displayed.map((app) => {
                    const service = getService(app.serviceId);
                    const isEditable = activeTab === 'upcoming' && app.status !== 'cancelled';

                    return (
                        <Card key={app.id} id={`appointment-${app.id}`} className="transition-all duration-500">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-bold text-lg">{getServiceName(service)}</div>
                                    <div className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                        app.status === 'confirmed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                            app.status === 'pending' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                    )}>
                                        {t(`status.${app.status}`)}
                                    </div>
                                </div>

                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2 text-foreground/80">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="capitalize text-base">{format(new Date(app.date), 'd MMMM yyyy', { locale: locale() })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-foreground/80">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="text-base">{app.time}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t">
                                    <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all" onClick={() => setChatOpen(app.id)}>
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        {t('visits.chat')}
                                    </Button>
                                    <div className="font-bold text-lg text-primary">{formatPrice(app.price || service?.price || 0)} ₸</div>
                                </div>
                                {app.status === 'completed' && (
                                    (() => {
                                        const review = useStore.getState().reviews.find(r => r.appointmentId === app.id);
                                        return review ? (
                                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium">{t('reviews.rating')}:</span>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} className={cn("w-3.5 h-3.5", star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                                                        ))}
                                                        <button
                                                            className="ml-2 text-muted-foreground hover:text-primary transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFeedbackOpen(app);
                                                            }}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {review.comment && <p className="text-sm text-foreground/80 italic">"{review.comment}"</p>}
                                                {review.reply && (
                                                    <div className="mt-2 text-xs border-l-2 pl-2 border-primary/50">
                                                        <span className="font-semibold text-primary">{t('roles.master')}:</span> {review.reply}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="w-full mt-2 gap-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                                onClick={() => setFeedbackOpen(app)}
                                            >
                                                <Star className="w-4 h-4" />
                                                {t('reviews.title')}
                                            </Button>
                                        );
                                    })()
                                )}

                                {isEditable && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleRescheduleStart(app)}
                                        >
                                            {t('visits.reschedule')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={() => handleCancelClick(app.id)}
                                        >
                                            {t('visits.cancel')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
                {displayed.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        {t('visits.noRecords')}
                    </div>
                )}
            </div>

            <Modal isOpen={!!chatOpen} onClose={() => setChatOpen(null)} title={t('visits.chatMaster')}>
                <Chat appointmentId={chatOpen} onClose={() => setChatOpen(null)} />
            </Modal>

            <FeedbackModal
                isOpen={!!feedbackOpen}
                onClose={() => setFeedbackOpen(null)}
                appointment={feedbackOpen}
            />

            <Modal isOpen={!!rescheduleOpen} onClose={() => setRescheduleOpen(null)} title={t('visits.rescheduleTitle')}>
                <div className="space-y-6">
                    <DateTimeSelector
                        selectedDate={newDate}
                        onDateSelect={setNewDate}
                        selectedTime={newTime}
                        onTimeSelect={setNewTime}
                        salonSettings={salonSettings}
                    />
                    <Button className="w-full" onClick={handleRescheduleConfirm} disabled={!newDate || !newTime}>
                        {t('visits.confirmReschedule')}
                    </Button>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={!!cancelConfirmationId}
                onClose={() => setCancelConfirmationId(null)}
                onConfirm={handleCancelConfirm}
                title={t('visits.cancelTitle')}
                description={t('visits.cancelDesc')}
            />
        </div>
    );
};
