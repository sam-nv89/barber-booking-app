import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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

export const getSlotsForDate = (date, salonSettings, appointments = [], services = []) => {
    if (!date || !salonSettings || !salonSettings.schedule) return [];

    const dateStr = date.toISOString().split('T')[0];
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = daysMap[date.getDay()];

    // 1. Determine Schedule (Weekly vs Override)
    let schedule = { ...salonSettings.schedule[dayKey] };
    const override = salonSettings.workScheduleOverrides?.[dateStr];

    if (override) {
        if (!override.isWorking) return []; // Explicitly OFF by override

        // If ON by override, but weekly was OFF, use fallback defaults
        if (!schedule.start) {
            schedule = { start: '10:00', end: '20:00', breaks: [] };
        }
        // Note: We currently don't support custom hours in overrides, only ON/OFF status
    } else {
        // No override, enforce weekly schedule
        if (!schedule.start || !schedule.end) return []; // Weekly OFF
    }

    // 2. Generate Raw Slots (Hourly)
    const slots = [];
    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);

    for (let h = startHour; h < endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // 3. Filter Availability
    const finalSlots = slots.filter(slot => {
        // A. Check Breaks
        if (schedule.breaks?.length) {
            for (const brk of schedule.breaks) {
                if (slot >= brk.start && slot < brk.end) return false;
            }
        }

        // B. Check Appointments (with Buffer)
        const daysAppointments = appointments.filter(a => a.date === dateStr);
        for (const appt of daysAppointments) {
            // Find service duration
            const service = services.find(s => s.id === appt.serviceId);
            const duration = service?.duration || 60; // default 60 min if service not found
            const buffer = salonSettings.bufferTime || 0;

            const apptStartMin = timeToMinutes(appt.time);
            const apptEndMin = apptStartMin + duration + buffer;

            const slotStartMin = timeToMinutes(slot);

            // Strict Block: If the slot START time falls within the [ApptStart, ApptEnd + Buffer) range
            if (slotStartMin >= apptStartMin && slotStartMin < apptEndMin) return false;
        }

        return true;
    });

    return finalSlots;
};
