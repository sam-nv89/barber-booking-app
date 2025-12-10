import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chat } from '@/components/features/Chat';
import { MasterBookingModal } from '@/components/features/MasterBookingModal';
import { MessageCircle, Plus } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { format } from 'date-fns';

export const Records = () => {
    const { appointments, updateAppointmentStatus, t, language, locale } = useStore();
    const location = useLocation();
    const [activeTab, setActiveTab] = React.useState('pending');
    const [chatOpen, setChatOpen] = React.useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

    const pending = appointments.filter(app => app.status === 'pending');
    const active = appointments.filter(app => app.status === 'confirmed');
    const archive = appointments.filter(app => ['completed', 'cancelled'].includes(app.status));

    const displayed = activeTab === 'pending' ? pending : activeTab === 'active' ? active : archive;

    const getService = (id) => useStore.getState().services.find(s => s.id === id);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    // Get all service names for multi-service appointments
    const getServiceNames = (app) => {
        const allServices = useStore.getState().services;

        // Support both new serviceIds[] and legacy serviceId
        const ids = app.serviceIds || (app.serviceId ? [app.serviceId] : []);

        if (ids.length === 0) return t('booking.service');

        return ids.map(id => {
            const service = allServices.find(s => s.id === id);
            return getServiceName(service);
        }).filter(Boolean).join(' + ');
    };

    // Get appointment price with fallback calculation
    const getAppointmentPrice = (app) => {
        if (app.price) return app.price;
        const allServices = useStore.getState().services;
        const ids = app.serviceIds || (app.serviceId ? [app.serviceId] : []);
        return ids.reduce((sum, id) => {
            const service = allServices.find(s => s.id === id);
            return sum + (service?.price || 0);
        }, 0);
    };

    // Handle navigation
    useEffect(() => {
        if (location.state?.highlightId) {
            const app = appointments.find(a => a.id === location.state.highlightId);
            if (app) {
                // Switch tab
                const tab = app.status === 'pending' ? 'pending' : app.status === 'confirmed' ? 'active' : 'archive';
                setActiveTab(tab);

                // Scroll
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('nav.records')}</h1>
                <Button size="sm" onClick={() => setIsBookingModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('records.addAppointment')}
                </Button>
            </div>

            <div className="flex p-1 bg-muted rounded-lg overflow-x-auto">
                {['pending', 'active', 'archive'].map((tab) => (
                    <button
                        key={tab}
                        className={cn(
                            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                            activeTab === tab ? "bg-background shadow" : "text-muted-foreground"
                        )}
                        onClick={() => setActiveTab(tab)}
                    >
                        {t(`records.${tab}`)} ({tab === 'pending' ? pending.length : tab === 'active' ? active.length : archive.length})
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {displayed.map((app) => {
                    const service = getService(app.serviceId);

                    const handleInteraction = () => {
                        if (app.unreadChanges) {
                            useStore.getState().updateAppointment(app.id, { unreadChanges: false });
                        }
                    };

                    return (
                        <Card
                            key={app.id}
                            id={`record-${app.id}`}
                            className={cn("transition-all duration-500", app.unreadChanges && "border-blue-500 shadow-md ring-1 ring-blue-500/20")}
                            onClick={handleInteraction}
                        >
                            <CardContent className="p-4 space-y-3 relative">
                                {app.unreadChanges && (
                                    <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                )}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold">{app.clientName}</div>
                                        <div className="text-sm text-muted-foreground">{app.clientPhone}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{app.time}</div>
                                        <div className="text-sm text-muted-foreground capitalize">
                                            {format(new Date(app.date), 'd MMMM yyyy', { locale: locale() })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-muted p-2 rounded">
                                    <span className="text-sm">{getServiceNames(app)} • {formatPrice(getAppointmentPrice(app))} ₸</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                                        e.stopPropagation();
                                        setChatOpen(app.id);
                                        handleInteraction();
                                    }}>
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </div>

                                {activeTab === 'pending' && (
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            className="flex-1"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateAppointmentStatus(app.id, 'confirmed');
                                                handleInteraction();
                                            }}
                                        >
                                            {t('records.accept')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateAppointmentStatus(app.id, 'cancelled');
                                                handleInteraction();
                                            }}
                                        >
                                            {t('records.reject')}
                                        </Button>
                                    </div>
                                )}

                                {activeTab === 'active' && (
                                    <div className="pt-2">
                                        <Button
                                            className="w-full"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateAppointmentStatus(app.id, 'completed');
                                                handleInteraction();
                                            }}
                                        >
                                            {t('records.complete')}
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

            <Modal isOpen={!!chatOpen} onClose={() => setChatOpen(null)} title={t('records.chatClient')}>
                <Chat appointmentId={chatOpen} onClose={() => setChatOpen(null)} />
            </Modal>

            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title={t('records.newAppointment')}>
                <MasterBookingModal onClose={() => setIsBookingModalOpen(false)} />
            </Modal>
        </div>
    );
};
