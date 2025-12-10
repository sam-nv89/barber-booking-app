import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn, getSlotsForDate } from '@/lib/utils';
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const DateTimeSelector = ({ selectedDate, onDateSelect, selectedTime, onTimeSelect, salonSettings, appointments = [], services = [], workScheduleOverrides = {} }) => {
    const { t, language } = useStore();
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const locale = language === 'ru' ? ru : enUS;
    const bookingPeriodMonths = salonSettings?.bookingPeriodMonths || 1;

    // Calculate booking range
    const today = startOfDay(new Date());
    const maxDate = addMonths(today, bookingPeriodMonths);

    const availableTimes = React.useMemo(() => {
        return getSlotsForDate(selectedDate, salonSettings, appointments, services, workScheduleOverrides);
    }, [selectedDate, salonSettings, appointments, services, workScheduleOverrides]);

    // Generate calendar days for current month view
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get day of week for first day (0 = Sunday, adjust for Monday start)
    const firstDayOfWeek = monthStart.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Check if a date is available for booking
    const isDateAvailable = (date) => {
        if (isBefore(date, today)) return false;
        if (isAfter(date, maxDate)) return false;

        // Check if there are slots available
        const slots = getSlotsForDate(date, salonSettings, [], [], workScheduleOverrides);
        return slots.length > 0;
    };

    const prevMonth = () => {
        const newMonth = addMonths(currentMonth, -1);
        if (!isBefore(endOfMonth(newMonth), today)) {
            setCurrentMonth(newMonth);
        }
    };

    const nextMonth = () => {
        const newMonth = addMonths(currentMonth, 1);
        if (!isAfter(startOfMonth(newMonth), maxDate)) {
            setCurrentMonth(newMonth);
        }
    };

    const weekDays = language === 'ru'
        ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="space-y-6">
            {/* Month Calendar */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">{t('booking.selectDate')}</h3>

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevMonth}
                        disabled={isBefore(endOfMonth(addMonths(currentMonth, -1)), today)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium capitalize">
                        {format(currentMonth, 'LLLL yyyy', { locale })}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextMonth}
                        disabled={isAfter(startOfMonth(addMonths(currentMonth, 1)), maxDate)}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground font-medium">
                    {weekDays.map(day => (
                        <div key={day} className="p-1">{day}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: startOffset }, (_, i) => (
                        <div key={`offset-${i}`} className="p-2" />
                    ))}

                    {/* Day cells */}
                    {calendarDays.map((date) => {
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isAvailable = isDateAvailable(date);
                        const isPast = isBefore(date, today);
                        const isFuture = isAfter(date, maxDate);

                        return (
                            <button
                                key={date.toISOString()}
                                disabled={!isAvailable || isPast || isFuture}
                                onClick={() => onDateSelect(date)}
                                className={cn(
                                    "p-2 rounded-md text-sm font-medium transition-colors",
                                    isSelected && "bg-primary text-primary-foreground",
                                    !isSelected && isAvailable && "hover:bg-accent",
                                    !isAvailable && "text-muted-foreground/30 cursor-not-allowed",
                                    isPast && "text-muted-foreground/30 cursor-not-allowed",
                                    isFuture && "text-muted-foreground/30 cursor-not-allowed"
                                )}
                            >
                                {format(date, 'd')}
                            </button>
                        );
                    })}
                </div>

                {/* Period Info */}
                <p className="text-xs text-muted-foreground text-center">
                    {t('common.from')} {format(today, 'd MMM', { locale })} {t('common.to')} {format(maxDate, 'd MMM yyyy', { locale })}
                </p>
            </div>

            {/* Time Slots */}
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
