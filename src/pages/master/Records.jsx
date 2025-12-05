import React from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chat } from '@/components/features/Chat';
import { MessageCircle } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

export const Records = () => {
    const { appointments, updateAppointmentStatus, t } = useStore();
    const [activeTab, setActiveTab] = React.useState('pending');
    const [chatOpen, setChatOpen] = React.useState(null);

    const pending = appointments.filter(app => app.status === 'pending');
    const active = appointments.filter(app => app.status === 'confirmed');
    const archive = appointments.filter(app => ['completed', 'cancelled'].includes(app.status));

    const displayed = activeTab === 'pending' ? pending : activeTab === 'active' ? active : archive;

    const getService = (id) => useStore.getState().services.find(s => s.id === id);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('nav.records')}</h1>

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
                        {tab === 'pending' ? `Заявки (${pending.length})` : tab === 'active' ? `Активные (${active.length})` : `Архив (${archive.length})`}
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
                            className={cn("transition-all", app.unreadChanges && "border-blue-500 shadow-md ring-1 ring-blue-500/20")}
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
                                        <div className="text-sm text-muted-foreground">{app.date}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-muted p-2 rounded">
                                    <span className="text-sm">{service?.name} - {formatPrice(app.price || service?.price || 0)} ₸</span>
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
                                            Принять
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
                                            Отклонить
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
                                            Завершить работу
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
                {displayed.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        Нет записей
                    </div>
                )}
            </div>

            <Modal isOpen={!!chatOpen} onClose={() => setChatOpen(null)} title="Чат с клиентом">
                <Chat appointmentId={chatOpen} onClose={() => setChatOpen(null)} />
            </Modal>
        </div>
    );
};
