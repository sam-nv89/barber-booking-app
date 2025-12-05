import React from 'react';
import { Button } from '@/components/ui/Button';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { useStore } from '@/store/useStore';

export const DateTimeSelector = ({ selectedDate, onDateSelect, selectedTime, onTimeSelect, salonSettings }) => {
    const { t, locale } = useStore();

    const generateTimeSlots = (date) => {
        if (!date || !salonSettings?.schedule) return [];

        const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = daysMap[date.getDay()];
        const schedule = salonSettings.schedule[dayKey];

        if (!schedule || !schedule.start || !schedule.end) return [];

        const slots = [];
        let current = parseInt(schedule.start.split(':')[0]);
        const end = parseInt(schedule.end.split(':')[0]);

        while (current < end) {
            slots.push(`${current.toString().padStart(2, '0')}:00`);
            current++;
        }
        return slots;
    };

    const availableTimes = React.useMemo(() => generateTimeSlots(selectedDate), [selectedDate, salonSettings]);

    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">{t('booking.selectDate')}</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {dates.map((date) => {
                        const isOff = false; // TODO: Check schedule for day off
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        const dayLabel = format(date, 'EE', { locale: locale() });

                        return (
                            <button
                                key={date.toString()}
                                disabled={isOff}
                                onClick={() => onDateSelect(date)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-lg border bg-card p-2 text-sm transition-colors shrink-0",
                                    isSelected && "border-primary bg-primary text-primary-foreground",
                                    isOff && "opacity-50 cursor-not-allowed bg-muted"
                                )}
                            >
                                <span className="text-xs capitalize">{dayLabel}</span>
                                <span className="text-lg font-bold">{format(date, 'd')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">{t('booking.selectTime')}</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {availableTimes.map((time) => (
                            <Button
                                key={time}
                                variant={selectedTime === time ? 'primary' : 'outline'}
                                onClick={() => onTimeSelect(time)}
                                className="w-full"
                            >
                                {time}
                            </Button>
                        ))}
                        {availableTimes.length === 0 && (
                            <div className="col-span-4 text-center text-muted-foreground">{t('booking.noTime')}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
