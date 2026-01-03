import React from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { DateTimeSelector } from '@/components/features/DateTimeSelector';
import { format } from 'date-fns';
import { formatPrice, formatPhoneNumber, formatDuration } from '@/lib/utils';
import { User, Phone, Calendar, Scissors, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MasterBookingModal = ({ onClose }) => {
    const { services, addAppointment, appointments, t, salonSettings, language, locale, workScheduleOverrides } = useStore();

    const [selectedServices, setSelectedServices] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(null);
    const [selectedTime, setSelectedTime] = React.useState(null);
    const [clientName, setClientName] = React.useState('');
    const [clientPhone, setClientPhone] = React.useState('');

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

    // Calculate totals
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    const handleSave = () => {
        if (selectedServices.length === 0 || !selectedDate || !selectedTime || !clientName) return;

        addAppointment({
            serviceIds: selectedServices.map(s => s.id),
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            clientName,
            clientPhone,
            totalPrice: totalPrice,
            totalDuration: totalDuration,
            status: 'confirmed' // Auto-confirm since Master is booking
        });
        onClose();
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Service Selection with Checkboxes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        {t('booking.selectService')}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {services.map(service => {
                            const isSelected = selectedServices.some(s => s.id === service.id);
                            return (
                                <div
                                    key={service.id}
                                    className={cn(
                                        "p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                    onClick={() => toggleService(service)}
                                >
                                    {/* Checkbox */}
                                    <div className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                        isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground"
                                    )}>
                                        {isSelected && <Check className="w-3 h-3" />}
                                    </div>

                                    {/* Service Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{getServiceName(service)}</div>
                                        <div className="text-xs text-muted-foreground">{formatDuration(service.duration, t)}</div>
                                    </div>

                                    {/* Price */}
                                    <div className="font-medium text-sm shrink-0">
                                        {formatPrice(service.price)} {salonSettings?.currency || '₸'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected Summary */}
                    {selectedServices.length > 0 && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {t('common.selected')}: {selectedServices.length} • {formatDuration(totalDuration, t)} • {formatPrice(totalPrice)} {salonSettings?.currency || '₸'}
                        </div>
                    )}
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('booking.dateAndTime')}
                    </label>
                    <div className="border rounded-md p-4 bg-muted/20">
                        <DateTimeSelector
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            selectedTime={selectedTime}
                            onTimeSelect={setSelectedTime}
                            salonSettings={salonSettings}
                            appointments={appointments}
                            services={services}
                            workScheduleOverrides={workScheduleOverrides}
                            serviceDuration={totalDuration || 60}
                        />
                    </div>
                </div>

                {/* Client Details */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('booking.yourDetails')}
                    </label>
                    <div className="grid gap-3">
                        <input
                            type="text"
                            placeholder={t('booking.clientName')}
                            className="w-full p-2 border rounded-md"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="tel"
                                placeholder={t('booking.clientPhone')}
                                className="w-full p-2 pl-9 border rounded-md"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {selectedServices.length > 0 && selectedDate && selectedTime && (
                    <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                        <div className="flex justify-between font-medium">
                            <span>{t('common.total')}:</span>
                            <span>{formatDuration(totalDuration, t)} • {formatPrice(totalPrice)} {salonSettings?.currency || '₸'}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {format(selectedDate, 'd MMMM yyyy', { locale: locale() })} {t('common.at')} {selectedTime}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={selectedServices.length === 0 || !selectedDate || !selectedTime || !clientName}
                >
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
};
