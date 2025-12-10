import React from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { DateTimeSelector } from '@/components/features/DateTimeSelector';
import { format } from 'date-fns';
import { formatPrice, formatPhoneNumber } from '@/lib/utils';
import { User, Phone, Calendar, Scissors, Calculator } from 'lucide-react';

export const MasterBookingModal = ({ onClose }) => {
    const { services, addAppointment, appointments, t, salonSettings, language, locale, workScheduleOverrides } = useStore();

    const [selectedServiceId, setSelectedServiceId] = React.useState('');
    const [selectedDate, setSelectedDate] = React.useState(null);
    const [selectedTime, setSelectedTime] = React.useState(null);
    const [clientName, setClientName] = React.useState('');
    const [clientPhone, setClientPhone] = React.useState('');

    const selectedService = services.find(s => s.id === selectedServiceId);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleSave = () => {
        if (!selectedService || !selectedDate || !selectedTime || !clientName) return;

        addAppointment({
            serviceId: selectedService.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            clientName,
            clientPhone,
            price: selectedService.price,
            status: 'confirmed' // Auto-confirm since Master is booking
        });
        onClose();
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Service Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        {t('booking.selectService')}
                    </label>
                    <select
                        className="w-full p-2 border rounded-md bg-background"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                        <option value="">{t('common.select')}</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {getServiceName(service)} - {formatPrice(service.price)} ₸
                            </option>
                        ))}
                    </select>
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
                {selectedService && selectedDate && selectedTime && (
                    <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                        <div className="flex justify-between font-medium">
                            <span>{t('booking.total')}:</span>
                            <span>{formatPrice(selectedService.price)} ₸</span>
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
                    disabled={!selectedServiceId || !selectedDate || !selectedTime || !clientName}
                >
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
};
