import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Format duration: 60 -> "1 час", 90 -> "1 час 30 мин", 30 -> "30 мин"
// With proper pluralization for Russian
export const formatDuration = (minutes, t) => {
    if (!minutes || minutes <= 0) return '0 ' + (t ? t('common.min') : 'мин');

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // Detect language from t('common.min')
    const minWord = t ? t('common.min') : 'мин';
    const isRu = minWord === 'мин';
    const isKz = minWord === 'мин' && t && t('common.hour') === 'сағ';

    // Russian pluralization helper
    const pluralizeRu = (n, one, two, five) => {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod100 >= 11 && mod100 <= 14) return five;
        if (mod10 === 1) return one;
        if (mod10 >= 2 && mod10 <= 4) return two;
        return five;
    };

    let hourStr = '', minStr = '';

    if (hours > 0) {
        if (isRu && !isKz) {
            hourStr = `${hours} ${pluralizeRu(hours, 'час', 'часа', 'часов')}`;
        } else {
            hourStr = `${hours} ${t ? t('common.hour') : 'hr'}`;
        }
    }

    if (mins > 0) {
        if (isRu && !isKz) {
            minStr = `${mins} ${pluralizeRu(mins, 'минута', 'минуты', 'минут')}`;
        } else {
            minStr = `${mins} ${t ? t('common.min') : 'min'}`;
        }
    }

    if (hours === 0) return minStr;
    if (mins === 0) return hourStr;
    return `${hourStr} ${minStr}`;
};

export const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length < 1) return value;

    // Check if it starts with 7 or 8 (KZ/RU)
    let clearNumber = phoneNumber;
    if (phoneNumber[0] === '7' || phoneNumber[0] === '8') {
        clearNumber = phoneNumber.substring(1);
    }

    const parts = [];
    if (clearNumber.length > 0) parts.push(clearNumber.substring(0, 3));
    if (clearNumber.length > 3) parts.push(clearNumber.substring(3, 6));
    if (clearNumber.length > 6) parts.push(clearNumber.substring(6, 8));
    if (clearNumber.length > 8) parts.push(clearNumber.substring(8, 10));

    return `+7 ${parts.join(' ')}`.trim();
};

export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const timeToMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

export const getSlotsForDate = (date, salonSettings, appointments = [], services = [], workScheduleOverrides = {}, serviceDuration = 60) => {
    if (!date || !salonSettings) return [];

    const dateStr = date.toISOString().split('T')[0];
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = daysMap[date.getDay()];

    // 1. Determine Schedule based on mode
    let schedule = { start: '', end: '', breaks: [] };
    const override = workScheduleOverrides[dateStr];

    if (salonSettings.scheduleMode === 'shift') {
        // In shift mode, ONLY use overrides
        if (!override || !override.isWorking) return []; // No override or OFF
        // Use hours from override (which come from shiftPattern)
        schedule = {
            start: override.start || salonSettings.shiftPattern?.workHours?.start || '10:00',
            end: override.end || salonSettings.shiftPattern?.workHours?.end || '20:00',
            breaks: override.breaks || []
        };
    } else {
        // Weekly mode: use weekly schedule, allow overrides for exceptions
        schedule = { ...salonSettings.schedule[dayKey] };

        if (override) {
            if (!override.isWorking) return []; // Explicitly OFF by override
            // Use override hours if provided
            if (override.start && override.end) {
                schedule = { start: override.start, end: override.end, breaks: override.breaks || [] };
            }
        } else {
            // No override, use weekly schedule
            if (!schedule.start || !schedule.end) return []; // Weekly OFF
        }
    }

    // 2. Generate Raw Slots (Hourly)
    const slots = [];
    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);
    const endMinutes = timeToMinutes(schedule.end);

    for (let h = startHour; h < endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // 3. Filter Availability
    const buffer = salonSettings.bufferTime || 0;

    const finalSlots = slots.filter(slot => {
        const slotStartMin = timeToMinutes(slot);
        const slotEndMin = slotStartMin + serviceDuration + buffer;

        // A. Check if slot fits within working hours
        if (slotEndMin > endMinutes) return false;

        // B. Check Breaks
        if (schedule.breaks?.length) {
            for (const brk of schedule.breaks) {
                const brkStart = timeToMinutes(brk.start);
                const brkEnd = timeToMinutes(brk.end);
                // Slot conflicts with break if slot overlaps with break time
                if (slotStartMin < brkEnd && slotEndMin > brkStart) return false;
            }
        }

        // C. Check Appointments (with Buffer)
        const daysAppointments = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
        for (const appt of daysAppointments) {
            // Find service duration - support both single service and multi-service
            let apptDuration = appt.totalDuration;
            if (!apptDuration) {
                const service = services.find(s => s.id === appt.serviceId);
                apptDuration = service?.duration || 60;
            }

            const apptStartMin = timeToMinutes(appt.time);
            const apptEndMin = apptStartMin + apptDuration + buffer;

            // Check if slot overlaps with appointment
            if (slotStartMin < apptEndMin && slotEndMin > apptStartMin) return false;
        }

        return true;
    });

    return finalSlots;
};
