export const MOCK_APPOINTMENTS = [
    {
        id: '1',
        serviceId: '1',
        date: '2025-12-05',
        time: '10:00',
        clientName: 'Алексей',
        clientPhone: '77712345678',
        status: 'confirmed',
        createdAt: '2025-12-01T10:00:00Z',
    },
    {
        id: '2',
        serviceId: '2',
        date: '2025-12-06',
        time: '14:00',
        clientName: 'Ержан',
        clientPhone: '77798765432',
        status: 'pending',
        createdAt: '2025-12-03T15:00:00Z',
    }
];

export const AVAILABLE_TIMES = [
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Пн' },
    { key: 'tuesday', label: 'Вт' },
    { key: 'wednesday', label: 'Ср' },
    { key: 'thursday', label: 'Чт' },
    { key: 'friday', label: 'Пт' },
    { key: 'saturday', label: 'Сб' },
    { key: 'sunday', label: 'Вс' },
];

export const DEFAULT_SCHEDULE = {
    monday: { start: '10:00', end: '20:00' },
    tuesday: { start: '10:00', end: '20:00' },
    wednesday: { start: '10:00', end: '20:00' },
    thursday: { start: '10:00', end: '20:00' },
    friday: { start: '10:00', end: '20:00' },
    saturday: { start: '11:00', end: '18:00' },
    sunday: { start: '', end: '' }
};
