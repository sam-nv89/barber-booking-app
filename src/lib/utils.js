import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Determine if text should be white or black based on background color
// Uses luminance formula for accessibility
export function getContrastColor(hexColor) {
    if (!hexColor) return '#000000';

    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
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

export const getSlotsForDate = (date, salonSettings, appointments = [], services = [], workScheduleOverrides = {}, serviceDuration = 60, masterId = null, masters = []) => {
    if (!date || !salonSettings) return [];

    // Use local date to avoid timezone issues (toISOString uses UTC which can shift the date)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
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

    // 2. Generate Raw Slots (configurable interval, default 30 min)
    const slots = [];
    const slotInterval = salonSettings.slotInterval || 30; // minutes
    const startMinutes = timeToMinutes(schedule.start);
    const endMinutes = timeToMinutes(schedule.end);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotInterval) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    }

    // 3. Filter Availability
    const buffer = salonSettings.bufferTime || 0;

    // [DEBUG] Log parameters once per call
    if (typeof window !== 'undefined' && window.location.hash.includes('debug') || true) { // Force log for now
        console.log(`[DEBUG_PARAMS] Date=${dateStr}, Buffer=${buffer}, Duration=${serviceDuration}, Sched=${schedule.start}-${schedule.end}, Offset=${new Date().getTimezoneOffset()}`);
    }

    const finalSlots = slots.filter(slot => {
        const slotStartMin = timeToMinutes(slot);
        const slotEndMin = slotStartMin + serviceDuration + buffer;

        // A. Check if slot has already passed (for today's date)
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (dateStr === todayStr) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            if (slotStartMin <= currentMinutes) {
                // Log the first rejection to see what "now" is
                if (slotStartMin + slotInterval > currentMinutes) { // Log boundary
                    console.log(`[DEBUG_SLOTS] Rejected ${slot} (${slotStartMin}m) <= Now ${Math.floor(currentMinutes / 60)}:${currentMinutes % 60} (${currentMinutes}m). Full Date: ${now.toString()}`);
                }
                return false;
            }
            // Log buffer/interval issues if needed
            // console.log(`Check Slot ${slot}: Start=${slotStartMin}, Gap=${slotStartMin - currentMinutes}`);
        }

        // B. Check if slot fits within working hours
        if (slotEndMin > endMinutes) return false;

        // C. Check Breaks
        if (schedule.breaks?.length) {
            for (const brk of schedule.breaks) {
                const brkStart = timeToMinutes(brk.start);
                const brkEnd = timeToMinutes(brk.end);
                // Slot conflicts with break if slot overlaps with break time
                if (slotStartMin < brkEnd && slotEndMin > brkStart) return false;
            }
        }

        // D. Check Appointments (with Buffer)
        const daysAppointments = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');

        // Helper to check overlap with a specific appointment
        const isOverlapping = (appt) => {
            // Find service duration - support both single service and multi-service
            let apptDuration = appt.totalDuration;
            if (!apptDuration) {
                const service = services.find(s => s.id === appt.serviceId);
                apptDuration = service?.duration || 60;
            }

            const apptStartMin = timeToMinutes(appt.time);

            // NEW: If completed, use actual completion time to free up slots
            if (appt.status === 'completed' && appt.completedAt) {
                const apptDate = new Date(appt.date + 'T' + appt.time);
                const completeDate = new Date(appt.completedAt);

                // Calculate actual minutes used
                // We assume appointments happen on the scheduled date for simplicity in this logic
                if (isSameDay(apptDate, completeDate)) {
                    const diffMs = completeDate - apptDate;
                    const diffMins = Math.ceil(diffMs / 1000 / 60);
                    // Use actual duration, but at least 1 minute (so it doesn't vanish completely if completed instantly?)
                    // Actually if finished instantly, slot is free.
                    if (diffMins < apptDuration) {
                        apptDuration = diffMins > 0 ? diffMins : 0;
                    }
                }
            }

            const apptEndMin = apptStartMin + apptDuration + buffer;

            // Check if slot overlaps with appointment
            return slotStartMin < apptEndMin && slotEndMin > apptStartMin;
        };

        if (masterId) {
            // Case 1: Specific Master selected
            // Slot is blocked if THIS master has an overlapping appointment
            const isBooked = daysAppointments.some(appt => {
                if (!isOverlapping(appt)) return false;
                // If appointment has no masterId (legacy), assume it blocks everyone/this master
                if (!appt.masterId) return true;
                return appt.masterId === masterId;
            });
            if (isBooked) return false;
        } else {
            // Case 2: "Any Master" (masterId is null)
            // Slot is available if AT LEAST ONE master is free
            if (!masters || masters.length === 0) {
                // Fallback: If no masters list provided (or legacy mode), check if ANY appointment overlaps
                const isBooked = daysAppointments.some(appt => isOverlapping(appt));
                if (isBooked) return false;
            } else {
                // Check if ALL masters are booked
                const freeMastersCount = masters.filter(m => {
                    const isMasterBooked = daysAppointments.some(appt => {
                        if (!isOverlapping(appt)) return false;
                        if (!appt.masterId) return true; // Global/Legacy booking - blocks everyone
                        return appt.masterId === m.tgUserId;
                    });
                    return !isMasterBooked;
                }).length;

                if (freeMastersCount === 0) return false; // All active masters are booked
            }
        }

        return true;
    });

    return finalSlots;
};

// Parse vCard (.vcf) file content into array of contacts
// Supports vCard 2.1, 3.0, 4.0
export const parseVCard = (vcfContent) => {
    if (!vcfContent || typeof vcfContent !== 'string') return [];

    const contacts = [];
    const vcards = vcfContent.split(/(?=BEGIN:VCARD)/i);

    for (const vcard of vcards) {
        if (!vcard.trim() || !vcard.toUpperCase().includes('BEGIN:VCARD')) continue;

        const contact = { name: '', phone: '' };
        const lines = vcard.split(/\r?\n/);

        for (const line of lines) {
            // Parse FN (Formatted Name) - preferred
            if (line.toUpperCase().startsWith('FN')) {
                const match = line.match(/^FN[;:](.+)$/i);
                if (match) {
                    contact.name = match[1].replace(/^[;:]+/, '').trim();
                }
            }

            // Parse N (Name) - fallback if no FN
            if (!contact.name && line.toUpperCase().startsWith('N:')) {
                const match = line.match(/^N:([^;]*);([^;]*)/i);
                if (match) {
                    const lastName = match[1]?.trim() || '';
                    const firstName = match[2]?.trim() || '';
                    contact.name = `${firstName} ${lastName}`.trim();
                }
            }

            // Parse TEL (Telephone)
            if (line.toUpperCase().startsWith('TEL')) {
                // Handle various formats: TEL:+123, TEL;TYPE=CELL:+123, TEL;CELL:+123
                const match = line.match(/^TEL[^:]*:(.+)$/i);
                if (match && !contact.phone) {
                    // Clean phone number - keep only digits and +
                    contact.phone = match[1].replace(/[^\d+]/g, '').trim();
                }
            }
        }

        // Only add if has name or phone
        if (contact.name || contact.phone) {
            // Default name if empty
            if (!contact.name && contact.phone) {
                contact.name = contact.phone;
            }
            contacts.push(contact);
        }
    }

    return contacts;
};

// Parse CSV content into array of contacts with optional tags and notes
// Smart detection of columns for name, phone, tags, notes
export const parseCSV = (csvContent) => {
    if (!csvContent || typeof csvContent !== 'string') return [];

    const contacts = [];
    const lines = csvContent.trim().split(/\r?\n/);

    if (lines.length < 2) return []; // Need header + at least one row

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    if (firstLine.includes('\t') && !firstLine.includes(',') && !firstLine.includes(';')) delimiter = '\t';

    // Parse header to find columns
    const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim().replace(/['"]/g, ''));

    let nameIndex = headers.findIndex(h =>
        h === 'name' || h === 'имя' || h === 'фио' || h === 'клиент' || h === 'client' || h === 'аты'
    );
    let phoneIndex = headers.findIndex(h =>
        h === 'phone' || h === 'телефон' || h === 'тел' || h === 'tel' || h === 'mobile' || h === 'мобильный'
    );
    let tagsIndex = headers.findIndex(h =>
        h === 'tags' || h === 'теги' || h === 'тег' || h === 'tag' || h === 'категория' || h === 'category'
    );
    let notesIndex = headers.findIndex(h =>
        h === 'notes' || h === 'заметки' || h === 'заметка' || h === 'note' || h === 'комментарий' || h === 'comment' || h === 'примечание'
    );

    // If no headers found, assume first column is name, second is phone
    if (nameIndex === -1) nameIndex = 0;
    if (phoneIndex === -1) phoneIndex = 1;

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

        const contact = {
            name: cols[nameIndex] || '',
            phone: cols[phoneIndex]?.replace(/[^\d+]/g, '') || ''
        };

        // Parse tags if column exists
        if (tagsIndex !== -1 && cols[tagsIndex]) {
            // Tags can be comma-separated or semicolon-separated
            const tagStr = cols[tagsIndex];
            contact.tags = tagStr.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        // Parse notes if column exists
        if (notesIndex !== -1 && cols[notesIndex]) {
            contact.notes = cols[notesIndex];
        }

        if (contact.name || contact.phone) {
            if (!contact.name && contact.phone) {
                contact.name = contact.phone;
            }
            contacts.push(contact);
        }
    }

    return contacts;
};

// Convert Google Sheets URL to CSV export URL
export const googleSheetToCSV = (url) => {
    if (!url || typeof url !== 'string') return null;

    // Match Google Sheets URL patterns
    const match = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;

    const sheetId = match[1];
    // Get gid (sheet tab) if present
    const gidMatch = url.match(/[?&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

// Parse Excel (.xlsx, .xls) file into array of contacts with optional tags and notes
// Smart detection of name, phone, tags, and notes columns
export const parseExcel = (arrayBuffer) => {
    if (!arrayBuffer) return [];

    try {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (data.length < 2) return [];

        // Find columns in header
        const headers = data[0].map(h => String(h || '').toLowerCase().trim());

        let nameIndex = headers.findIndex(h =>
            h === 'name' || h === 'имя' || h === 'фио' || h === 'клиент' ||
            h === 'client' || h === 'ф.и.о.' || h === 'ф.и.о' || h === 'аты' || h.includes('имя') || h.includes('name')
        );
        let phoneIndex = headers.findIndex(h =>
            h === 'phone' || h === 'телефон' || h === 'тел' || h === 'tel' ||
            h === 'mobile' || h === 'мобильный' || h === 'номер' || h.includes('телефон') || h.includes('phone')
        );
        let tagsIndex = headers.findIndex(h =>
            h === 'tags' || h === 'теги' || h === 'тег' || h === 'tag' || h === 'категория' || h === 'category'
        );
        let notesIndex = headers.findIndex(h =>
            h === 'notes' || h === 'заметки' || h === 'заметка' || h === 'note' ||
            h === 'комментарий' || h === 'comment' || h === 'примечание'
        );

        // If no headers found, assume first is name, second is phone
        if (nameIndex === -1) nameIndex = 0;
        if (phoneIndex === -1) phoneIndex = 1;

        const contacts = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const contact = {
                name: String(row[nameIndex] || '').trim(),
                phone: String(row[phoneIndex] || '').replace(/[^\d+]/g, '')
            };

            // Parse tags if column exists
            if (tagsIndex !== -1 && row[tagsIndex]) {
                const tagStr = String(row[tagsIndex]);
                contact.tags = tagStr.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean);
            }

            // Parse notes if column exists
            if (notesIndex !== -1 && row[notesIndex]) {
                contact.notes = String(row[notesIndex]).trim();
            }

            if (contact.name || contact.phone) {
                if (!contact.name && contact.phone) {
                    contact.name = contact.phone;
                }
                contacts.push(contact);
            }
        }

        return contacts;
    } catch (e) {
        console.error('Excel parse error:', e);
        return [];
    }
};
