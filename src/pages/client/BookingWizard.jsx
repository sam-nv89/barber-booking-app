import React from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AlertTriangle, Check } from 'lucide-react';

import { SuccessAnimation } from '@/components/features/SuccessAnimation';
import { DateTimeSelector } from '@/components/features/DateTimeSelector';
import { ClockWidget } from '@/components/features/ClockWidget';

export const BookingWizard = () => {
    const { t, addAppointment, user, salonSettings, services, appointments, language, locale, workScheduleOverrides, blockedPhones } = useStore();
    const [step, setStep] = React.useState(1);
    const [selectedServices, setSelectedServices] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(null);
    const [selectedTime, setSelectedTime] = React.useState(null);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [bookingError, setBookingError] = React.useState(null);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    // Toggle service selection
    const toggleService = (service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            } else {
                return [...prev, service];
            }
        });
    };

    // Calculate totals for selected services
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + getPriceWithCampaign(s), 0);

    // Logic to calculate price with active campaign
    function getPriceWithCampaign(service) {
        if (!service) return 0;

        const activeCampaign = useStore.getState().campaigns?.find(c => {
            const now = new Date();
            const start = new Date(c.startDate);
            const end = new Date(c.endDate);
            const isActive = now >= start && now <= end;
            const isApplicable = !c.serviceIds || c.serviceIds.length === 0 || c.serviceIds.includes(service.id);
            return isActive && isApplicable;
        });

        if (activeCampaign) {
            if (activeCampaign.type === 'discount') {
                return service.price * (1 - activeCampaign.value / 100);
            } else {
                return parseInt(activeCampaign.value);
            }
        }
        return service.price;
    }

    // Booking validation
    const validateBooking = () => {
        setBookingError(null);

        // Check blocklist
        if (blockedPhones?.includes(user.phone)) {
            setBookingError(t('warnings.clientBlocked'));
            return false;
        }

        // Get active appointments for this client
        const clientActiveAppointments = appointments.filter(a =>
            a.clientPhone === user.phone &&
            a.status !== 'cancelled' &&
            a.status !== 'completed'
        );

        // Limit: max 3 active bookings
        if (clientActiveAppointments.length >= 3) {
            setBookingError(t('warnings.tooManyBookings').replace('{count}', clientActiveAppointments.length));
            return false;
        }

        return true;
    };

    const handleBook = () => {
        if (selectedServices.length === 0 || !selectedDate || !selectedTime) return;

        if (!validateBooking()) return;

        addAppointment({
            serviceIds: selectedServices.map(s => s.id),
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            clientName: user.name,
            clientPhone: user.phone,
            totalPrice: totalPrice,
            totalDuration: totalDuration
        });

        setShowSuccess(true);
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        setStep(1);
        setSelectedServices([]);
        setSelectedDate(null);
        setSelectedTime(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('nav.book')}</h1>
            </div>

            <ClockWidget />

            {/* Step 1: Service */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('booking.selectService')}</h2>
                    <div className="grid gap-3">
                        {services.map((service) => {
                            // Campaign Logic
                            const activeCampaign = useStore.getState().campaigns?.find(c => {
                                const now = new Date();
                                const start = new Date(c.startDate);
                                const end = new Date(c.endDate);
                                const isActive = now >= start && now <= end;
                                const isApplicable = !c.serviceIds || c.serviceIds.length === 0 || c.serviceIds.includes(service.id);
                                return isActive && isApplicable;
                            });

                            let finalPrice = service.price;
                            let oldPrice = null;

                            if (activeCampaign) {
                                oldPrice = service.price;
                                if (activeCampaign.type === 'discount') {
                                    finalPrice = service.price * (1 - activeCampaign.value / 100);
                                } else {
                                    finalPrice = parseInt(activeCampaign.value);
                                }
                            }

                            const isSelected = selectedServices.some(s => s.id === service.id);

                            return (
                                <div
                                    key={service.id}
                                    className={cn(
                                        "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                    onClick={() => toggleService(service)}
                                >
                                    {/* Checkbox */}
                                    <div className={cn(
                                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                                        isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground"
                                    )}>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>

                                    {/* Service Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold flex items-center gap-2 flex-wrap">
                                            {getServiceName(service)}
                                            {activeCampaign && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{activeCampaign.name}</span>}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{formatDuration(service.duration, t)}</div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right shrink-0">
                                        <div className={cn("font-bold", oldPrice && "text-red-500")}>{formatPrice(finalPrice)} ₸</div>
                                        {oldPrice && <div className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice)} ₸</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Summary Card */}
                    {selectedServices.length > 0 && (
                        <Card className="bg-accent/50 border-primary/20">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            {t('common.selected')}: {selectedServices.length} {t('common.services')}
                                        </div>
                                        <div className="font-bold text-lg">
                                            {formatDuration(totalDuration, t)} • {formatPrice(totalPrice)} ₸
                                        </div>
                                    </div>
                                    <Button onClick={() => setStep(2)} size="lg">
                                        {t('common.next')} →
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
                <div className="space-y-6">
                    <DateTimeSelector
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        selectedTime={selectedTime}
                        onTimeSelect={setSelectedTime}
                        salonSettings={salonSettings}
                        appointments={appointments}
                        services={services}
                        workScheduleOverrides={workScheduleOverrides}
                        serviceDuration={totalDuration}
                    />

                    <div className="flex gap-2 mt-6">
                        <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                            {t('common.back')}
                        </Button>
                        <Button className="w-full" disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}>
                            {t('common.confirm')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('booking.confirmBooking')}</h2>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            {/* Services List */}
                            <div>
                                <span className="text-muted-foreground text-sm">{t('booking.service')}:</span>
                                <div className="mt-1 space-y-1">
                                    {selectedServices.map(s => (
                                        <div key={s.id} className="flex justify-between">
                                            <span className="font-medium">{getServiceName(s)}</span>
                                            <span className="text-muted-foreground text-sm">{formatDuration(s.duration, t)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="text-muted-foreground">{t('booking.date')}:</span>
                                <span className="font-medium capitalize">{selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: locale() })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('booking.time')}:</span>
                                <span className="font-medium">{selectedTime}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-lg">
                                <span className="font-bold">{t('common.total')}:</span>
                                <span className="font-bold">{formatDuration(totalDuration, t)} • {formatPrice(totalPrice)} ₸</span>
                            </div>
                        </CardContent>
                    </Card>

                    {bookingError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <span className="text-sm">{bookingError}</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => { setStep(2); setBookingError(null); }}>
                            {t('common.back')}
                        </Button>
                        <Button className="w-full" onClick={handleBook} disabled={!!bookingError}>
                            {t('booking.bookNow')}
                        </Button>
                    </div>
                </div>
            )}
            {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} title={t('booking.success')} />}
        </div>
    );
};
