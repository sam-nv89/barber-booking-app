import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TRANSLATIONS } from '../lib/i18n'
import { MOCK_APPOINTMENTS, DEFAULT_SCHEDULE } from '../lib/constants'
import { ru, enUS, kk, es, tr } from 'date-fns/locale'

const locales = {
    ru: ru,
    en: enUS,
    kz: kk,
    es: es,
    tr: tr
};

export const useStore = create(
    persist(
        (set, get) => ({
            // State
            reviews: [
                { id: 1, clientId: 'client1', clientName: 'Иван Петров', rating: 5, comment: 'Отличный мастер!', date: '2025-10-15', reply: null, isRead: false },
                { id: 2, clientId: 'client2', clientName: 'Елена С.', rating: 4, comment: 'Все понравилось, но пришлось подождать.', date: '2025-10-20', reply: null, isRead: false }
            ],
            dismissedPrompts: [], // IDs of appointments where user clicked "Later"
            dismissedPrompts: [], // IDs of appointments where user clicked "Later"
            // User State
            user: {
                role: 'client', // 'client' | 'master'
                name: '',
                phone: '',
                avatar: null,
                telegramId: null,
                telegramUsername: null,
                telegramPhone: null,
            },
            setUser: (userData) => set((state) => {
                const updatedUser = { ...state.user, ...userData };

                // Sync profile changes to clients CRM
                const userPhone = updatedUser.phone?.replace(/\D/g, '');
                const userTelegramId = updatedUser.telegramId;

                const updatedClients = (state.clients || []).map(client => {
                    const clientPhone = client.phone?.replace(/\D/g, '');
                    const clientTgUser = client.telegramUsername?.replace('@', '').toLowerCase();
                    const userTgUser = updatedUser.telegramUsername?.replace('@', '').toLowerCase();
                    const isMatch =
                        (userPhone && clientPhone && userPhone === clientPhone) ||
                        (userTelegramId && client.telegramId === userTelegramId) ||
                        (userTgUser && clientTgUser && userTgUser === clientTgUser) ||
                        (updatedUser.name && client.name && updatedUser.name.toLowerCase() === client.name.toLowerCase());

                    if (isMatch) {
                        return {
                            ...client,
                            name: updatedUser.name || client.name,
                            phone: updatedUser.phone || client.phone,
                            email: updatedUser.email || client.email,
                            telegramUsername: updatedUser.telegramUsername || client.telegramUsername,
                            telegramId: updatedUser.telegramId || client.telegramId,
                        };
                    }
                    return client;
                });

                return { user: updatedUser, clients: updatedClients };
            }),
            setRole: (role) => set((state) => ({ user: { ...state.user, role } })),

            // Settings State
            language: 'ru',
            theme: 'system',
            salonSettings: {
                name: 'Barber Shop #1',
                address: 'ул. Абая 150',
                phone: '+7 777 000 00 00',
                bufferTime: 10, // minutes between appointments
                slotInterval: 30, // minutes - time slot granularity
                bookingPeriodMonths: 1, // How far ahead clients can book: 1, 3, 6, 12
                scheduleMode: 'weekly', // 'weekly' | 'shift'
                shiftPattern: {
                    workDays: 2,
                    offDays: 2,
                    workHours: { start: '10:00', end: '20:00' }
                },
                schedule: DEFAULT_SCHEDULE,
                currency: '₸' // Default currency
            },
            setSalonSettings: (settings) => set((state) => ({ salonSettings: { ...state.salonSettings, ...settings } })),

            // Blocklist for anti-fraud
            blockedPhones: [],
            addBlockedPhone: (phone) => set((state) => {
                const cleanPhone = phone?.replace(/\D/g, '');
                if (!cleanPhone) return state;
                const alreadyBlocked = state.blockedPhones.some(p => p.replace(/\D/g, '') === cleanPhone);
                return alreadyBlocked ? state : { blockedPhones: [...state.blockedPhones, cleanPhone] };
            }),
            removeBlockedPhone: (phone) => set((state) => {
                const cleanPhone = phone?.replace(/\D/g, '');
                return { blockedPhones: state.blockedPhones.filter(p => p.replace(/\D/g, '') !== cleanPhone) };
            }),

            // Advanced Schedule State
            workScheduleOverrides: {}, // { 'YYYY-MM-DD': { isWorking: boolean, start, end } }
            setWorkScheduleOverrides: (overrides) => set((state) => ({
                workScheduleOverrides: { ...state.workScheduleOverrides, ...overrides }
            })),
            updateSingleOverride: (dateStr, override) => set((state) => ({
                workScheduleOverrides: { ...state.workScheduleOverrides, [dateStr]: override }
            })),
            clearWorkScheduleOverrides: () => set({ workScheduleOverrides: {} }),

            setLanguage: (language) => set({ language }),
            setTheme: (theme) => set({ theme }),

            // Services State
            services: [
                { id: '1', name: 'Мужская стрижка', price: 5000, duration: 60 },
                { id: '2', name: 'Стрижка бороды', price: 3000, duration: 30 },
                { id: '3', name: 'Комплекс (Стрижка + Борода)', price: 7000, duration: 90 },
                { id: '4', name: 'Детская стрижка', price: 4000, duration: 45 },
            ],
            setServices: (services) => set({ services }),
            addService: (service) => set((state) => ({ services: [...state.services, { ...service, id: Date.now().toString() }] })),
            updateService: (id, updates) => set((state) => ({
                services: state.services.map(s => s.id === id ? { ...s, ...updates } : s)
            })),
            deleteService: (id) => set((state) => ({
                services: state.services.filter(s => s.id !== id)
            })),

            // Campaigns/Marketing State
            campaigns: [],
            addCampaign: (campaign) => set((state) => ({
                campaigns: [...state.campaigns, { ...campaign, id: Date.now().toString(), isActive: true }],
                notifications: [{
                    id: Date.now().toString(),
                    type: 'offer',
                    recipient: 'client',
                    title: 'Новая акция! 🏷️',
                    message: `${campaign.name}! ${campaign.type === 'discount' ? 'Скидка ' + campaign.value + '%' : 'Специальная цена: ' + campaign.value + ' ' + (state.salonSettings.currency || '₸')}`,
                    date: new Date().toISOString(),
                    read: false
                }, ...state.notifications]
            })),
            updateCampaign: (id, updates) => set((state) => ({
                campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
            })),
            deleteCampaign: (id) => set((state) => ({
                campaigns: state.campaigns.filter(c => c.id !== id)
            })),

            // Notifications State
            notifications: [],
            addNotification: (notification) => set((state) => ({
                notifications: [{ ...notification, id: Date.now().toString(), date: new Date().toISOString(), read: false }, ...state.notifications]
            })),
            markNotificationAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
            })),
            markAllNotificationsAsRead: (role) => set((state) => ({
                notifications: state.notifications.map(n => (n.recipient === role || !n.recipient) ? { ...n, read: true } : n)
            })),

            // CRM Clients
            clients: [],
            addClient: (client) => set((state) => ({
                clients: [...(state.clients || []), {
                    ...client,
                    id: client.id || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString()
                }]
            })),
            removeClient: (id) => set((state) => ({
                clients: (state.clients || []).filter(c => c.id !== id)
            })),
            updateClient: (id, updates) => set((state) => ({
                clients: (state.clients || []).map(c => c.id === id ? { ...c, ...updates } : c)
            })),

            // Custom Tags for CRM
            customTags: [],
            addCustomTag: (tag) => set((state) => ({
                customTags: [...(state.customTags || []), {
                    ...tag,
                    id: tag.id || `custom_${Date.now()}`,
                    createdAt: new Date().toISOString()
                }]
            })),
            updateCustomTag: (id, updates) => set((state) => ({
                customTags: (state.customTags || []).map(t => t.id === id ? { ...t, ...updates } : t)
            })),
            removeCustomTag: (id) => set((state) => ({
                customTags: (state.customTags || []).filter(t => t.id !== id)
            })),

            // Review Actions
            addReview: (review) => {
                const existingReview = get().reviews.find(r => r.appointmentId === review.appointmentId);
                const t = get().t;

                if (existingReview) {
                    // Update existing
                    set((state) => ({
                        reviews: state.reviews.map(r => r.id === existingReview.id ? { ...r, ...review, isRead: false, date: new Date().toISOString().split('T')[0] } : r)
                    }));

                    // Notify master about update
                    get().addNotification({
                        titleKey: 'notifications.reviewUpdatedTitle',
                        messageKey: 'notifications.reviewUpdatedMessage',
                        params: { clientName: review.clientName || 'Client', rating: review.rating },
                        title: t('notifications.reviewUpdatedTitle') || 'Отзыв обновлен',
                        message: `${review.clientName || 'Client'} изменил отзыв: ${review.rating} ⭐`,
                        type: 'info',
                        recipient: 'master',
                        reviewId: existingReview.id
                    });

                } else {
                    // Create new
                    const newReviewId = Date.now();
                    set((state) => ({
                        reviews: [{
                            id: newReviewId,
                            date: new Date().toISOString().split('T')[0],
                            isRead: false,
                            reply: null,
                            ...review
                        }, ...state.reviews]
                    }));

                    // Notify master
                    get().addNotification({
                        titleKey: 'notifications.newReviewTitle',
                        messageKey: 'notifications.newReviewMessage',
                        params: { clientName: review.clientName || 'Client', rating: review.rating },
                        title: t('reviews.newReview'),
                        message: `${review.clientName || 'Client'} - ${review.rating} ⭐`,
                        type: 'info',
                        recipient: 'master',
                        reviewId: newReviewId
                    });
                }
            },

            replyToReview: (reviewId, replyText) => {
                const state = get();
                const t = state.t;
                const review = state.reviews.find(r => r.id === reviewId);

                set((state) => ({
                    reviews: state.reviews.map(r =>
                        r.id === reviewId ? { ...r, reply: replyText, isRead: true } : r
                    )
                }));

                // Notify Client
                if (review) {
                    get().addNotification({
                        titleKey: 'notifications.replyTitle',
                        messageKey: 'notifications.replyMessage',
                        title: t('notifications.replyTitle'),
                        message: t('notifications.replyMessage'),
                        type: 'info',
                        recipient: 'client',
                        reviewId: reviewId
                    });
                }
            },

            markReviewRead: (reviewId) => set((state) => ({
                reviews: state.reviews.map(r =>
                    r.id === reviewId ? { ...r, isRead: true } : r
                )
            })),

            markAllReviewsAsRead: () => set((state) => ({
                reviews: state.reviews.map(r => ({ ...r, isRead: true }))
            })),

            dismissRatePrompt: (appointmentId) => set((state) => ({
                dismissedPrompts: [...state.dismissedPrompts, appointmentId]
            })),

            // Appointments State
            appointments: MOCK_APPOINTMENTS,
            addAppointment: (appointment) => {
                // Handle both single serviceId and multi-service serviceIds
                const serviceIds = appointment.serviceIds || (appointment.serviceId ? [appointment.serviceId] : []);

                // Calculate total price and duration for multi-service
                let priceSnapshot = appointment.totalPrice || appointment.price;
                let totalDuration = appointment.totalDuration;

                if ((priceSnapshot === undefined || priceSnapshot === null) && serviceIds.length > 0) {
                    const allServices = get().services;
                    priceSnapshot = serviceIds.reduce((sum, id) => {
                        const service = allServices.find(s => s.id === id);
                        return sum + (service?.price || 0);
                    }, 0);
                    totalDuration = serviceIds.reduce((sum, id) => {
                        const service = allServices.find(s => s.id === id);
                        return sum + (service?.duration || 60);
                    }, 0);
                }

                // Check for suspicious booking (client has 2+ active bookings)
                const clientActiveBookings = get().appointments.filter(a =>
                    a.clientPhone === appointment.clientPhone &&
                    a.status !== 'cancelled' &&
                    a.status !== 'completed'
                );
                const isSuspicious = clientActiveBookings.length >= 2;

                const newApp = {
                    ...appointment,
                    serviceIds: serviceIds, // Store array of service IDs
                    serviceId: serviceIds[0], // Keep first for backward compatibility
                    price: priceSnapshot,
                    totalDuration: totalDuration,
                    id: Date.now().toString(),
                    status: appointment.status || 'pending',
                    createdAt: new Date().toISOString(),
                    unreadChanges: true,
                    suspicious: isSuspicious
                };

                const notifications = [{
                    id: Date.now().toString(),
                    type: isSuspicious ? 'warning' : 'new',
                    recipient: 'master',
                    appointmentId: newApp.id,
                    titleKey: isSuspicious ? 'notifications.suspiciousBookingTitle' : 'notifications.newBookingTitle',
                    messageKey: isSuspicious ? 'notifications.suspiciousBookingMessage' : 'notifications.newBookingMessage',
                    params: {
                        clientName: appointment.clientName,
                        date: appointment.date,
                        time: appointment.time,
                        count: clientActiveBookings.length + 1
                    },

                    // Fallback for old system
                    title: isSuspicious ? '⚠️ Подозрительная запись' : 'Новая заявка',
                    message: isSuspicious
                        ? `${appointment.clientName} уже имеет ${clientActiveBookings.length} записей. Новая на ${appointment.date} ${appointment.time}`
                        : `Новая запись от ${appointment.clientName} на ${appointment.date} ${appointment.time}`,

                    date: new Date().toISOString(),
                    read: false
                }];

                set((state) => {
                    // Auto-add client to CRM if not exists
                    const existingClient = (state.clients || []).find(c =>
                        c.phone?.replace(/\D/g, '') === appointment.clientPhone?.replace(/\D/g, '')
                    );

                    const updatedClients = existingClient
                        ? state.clients
                        : [...(state.clients || []), {
                            id: Date.now().toString(),
                            name: appointment.clientName,
                            phone: appointment.clientPhone,
                            telegramUsername: appointment.telegramUsername,
                            createdAt: new Date().toISOString(),
                            source: 'booking'
                        }];

                    return {
                        appointments: [...state.appointments, newApp],
                        notifications: [...notifications, ...state.notifications],
                        clients: updatedClients
                    };
                });
            },
            updateAppointmentStatus: (id, status) => set((state) => {
                const app = state.appointments.find(a => a.id === id);
                let notifications = state.notifications;
                let unreadChanges = app?.unreadChanges;

                // Notifications for Client (triggered by Master actions mostly)
                if (status === 'confirmed' && app?.status !== 'confirmed') {
                    notifications = [{
                        id: Date.now().toString(),
                        type: 'confirmed',
                        recipient: 'client',
                        appointmentId: id,
                        titleKey: 'notifications.confirmedTitle',
                        messageKey: 'notifications.confirmedMessage',
                        params: { date: app.date, time: app.time },

                        title: 'Запись подтверждена',
                        message: `Ваша запись на ${app.date} в ${app.time} подтверждена!`,
                        date: new Date().toISOString(),
                        read: false
                    }, ...notifications];
                } else if (status === 'completed' && app?.status !== 'completed') {
                    notifications = [{
                        id: Date.now().toString(),
                        type: 'completed',
                        recipient: 'client',
                        appointmentId: id,
                        titleKey: 'notifications.completedTitle',
                        messageKey: 'notifications.completedMessage',

                        title: 'Визит завершен',
                        message: `Спасибо, что выбрали нас! Будем рады видеть вас снова.`,
                        date: new Date().toISOString(),
                        read: false
                    }, ...notifications];
                }

                // Notifications for Master (triggered by Client cancellation, OR if Master cancels client should know)
                // If status is cancelled...
                if (status === 'cancelled' && app?.status !== 'cancelled') {
                    // How to know if Client or Master cancelled? 
                    // In real app we use context/token. Here, we can't easily map 1:1.
                    // But we can send notifications based on who would care.
                    // If cancelled:
                    // 1. Notify Master (always good to know)
                    notifications = [{
                        id: Date.now().toString() + '_m',
                        type: 'cancelled',
                        recipient: 'master',
                        appointmentId: id,
                        titleKey: 'notifications.cancelledTitle',
                        messageKey: 'notifications.cancelledMessageMaster',
                        params: { clientName: app.clientName, date: app.date },

                        title: 'Запись отменена',
                        message: `Запись клиента ${app.clientName} на ${app.date} была отменена`,
                        date: new Date().toISOString(),
                        read: false
                    }, ...notifications];
                    unreadChanges = true;

                    // 2. Notify Client (also good to know, especially if Master cancelled)
                    notifications = [{
                        id: Date.now().toString() + '_c',
                        type: 'cancelled',
                        recipient: 'client',
                        appointmentId: id,
                        titleKey: 'notifications.cancelledTitle',
                        messageKey: 'notifications.cancelledMessageClient',
                        params: { date: app.date, time: app.time },

                        title: 'Запись отменена',
                        message: `Запись на ${app.date} в ${app.time} была отменена.`,
                        date: new Date().toISOString(),
                        read: false
                    }, ...notifications];
                }

                return {
                    appointments: state.appointments.map(app => app.id === id ? { ...app, status, unreadChanges: unreadChanges !== undefined ? unreadChanges : app.unreadChanges } : app),
                    notifications
                };
            }),
            updateAppointment: (id, updates) => set((state) => {
                const app = state.appointments.find(a => a.id === id);
                let notifications = state.notifications;
                let unreadChanges = app?.unreadChanges;

                // Detect rescheduling (pending status + date/time change) - Client action -> Notify Master
                if (updates.status === 'pending' && (updates.date !== app.date || updates.time !== app.time)) {
                    notifications = [{
                        id: Date.now().toString(),
                        type: 'rescheduled',
                        recipient: 'master',
                        appointmentId: id,
                        titleKey: 'notifications.rescheduledTitle',
                        messageKey: 'notifications.rescheduledMessage',
                        params: { clientName: app.clientName, date: updates.date, time: updates.time },
                        title: 'Запись перенесена',
                        message: `Клиент ${app.clientName} перенес запись на ${updates.date} ${updates.time}`,
                        date: new Date().toISOString(),
                        read: false
                    }, ...notifications];
                    unreadChanges = true;
                }

                // If explicitly setting unreadChanges (e.g. clearing it), use that value
                if (updates.unreadChanges !== undefined) {
                    unreadChanges = updates.unreadChanges;
                }

                return {
                    appointments: state.appointments.map(app => app.id === id ? { ...app, ...updates, unreadChanges: unreadChanges !== undefined ? unreadChanges : app.unreadChanges } : app),
                    notifications
                };
            }),

            // Generate mock data for testing analytics
            generateMockData: () => set((state) => {
                const services = state.services || [];
                const clientNames = ['Иван', 'Алексей', 'Дмитрий', 'Сергей', 'Михаил', 'Артём', 'Максим', 'Андрей', 'Николай', 'Владимир'];
                const statuses = ['completed', 'completed', 'completed', 'completed', 'cancelled', 'pending', 'confirmed'];
                const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

                const newAppointments = [];
                const newClients = [];
                const newReviews = [];

                // Create a pool of recurring clients (30 clients that will return multiple times)
                const recurringClientPool = [];
                for (let i = 0; i < 30; i++) {
                    const clientName = clientNames[Math.floor(Math.random() * clientNames.length)] + ' ' + (i + 1);
                    const phone = '+7 7' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
                    recurringClientPool.push({ name: clientName, phone });
                }

                // Generate 100 appointments over last 60 days
                for (let i = 0; i < 100; i++) {
                    const daysAgo = Math.floor(Math.random() * 60);
                    const date = new Date();
                    date.setDate(date.getDate() - daysAgo);
                    const dateStr = date.toISOString().split('T')[0];

                    // 70% chance to use a recurring client, 30% new client
                    let clientName, phone;
                    if (Math.random() < 0.7 && recurringClientPool.length > 0) {
                        // Use existing recurring client
                        const recurringClient = recurringClientPool[Math.floor(Math.random() * recurringClientPool.length)];
                        clientName = recurringClient.name;
                        phone = recurringClient.phone;
                    } else {
                        // Create new unique client
                        clientName = clientNames[Math.floor(Math.random() * clientNames.length)] + ' Новый' + (i + 100);
                        phone = '+7 7' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
                    }

                    const service = services[Math.floor(Math.random() * services.length)];
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    const time = times[Math.floor(Math.random() * times.length)];
                    const price = service?.price || Math.floor(Math.random() * 10000) + 3000;

                    const appId = `mock-${Date.now()}-${i}`;

                    newAppointments.push({
                        id: appId,
                        date: dateStr,
                        time: time,
                        serviceId: service?.id,
                        serviceIds: service ? [service.id] : [],
                        clientName,
                        clientPhone: phone,
                        price,
                        status,
                        createdAt: date.toISOString(),
                    });

                    // Add client if not exists (in state or new clients)
                    const clientExists = state.clients?.some(c => c.phone === phone) || newClients.some(c => c.phone === phone);
                    if (!clientExists) {
                        newClients.push({
                            id: `client-${Date.now()}-${i}`,
                            name: clientName,
                            phone,
                            createdAt: date.toISOString(),
                            source: 'mock',
                            totalBookings: 1,
                            visits: status === 'completed' ? 1 : 0,
                        });
                    }

                    // Add review for some completed appointments
                    if (status === 'completed' && Math.random() > 0.6) {
                        newReviews.push({
                            id: `review-${Date.now()}-${i}`,
                            appointmentId: appId,
                            clientName,
                            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                            comment: ['Отлично!', 'Хороший мастер', 'Рекомендую', 'Всё супер'][Math.floor(Math.random() * 4)],
                            date: dateStr,
                            reply: null,
                            isRead: true,
                        });
                    }
                }

                return {
                    appointments: [...state.appointments, ...newAppointments],
                    clients: [...(state.clients || []), ...newClients],
                    reviews: [...(state.reviews || []), ...newReviews],
                };
            }),

            // Selectors/Helpers
            t: (key) => {
                const lang = get().language;
                const keys = key.split('.');
                let value = TRANSLATIONS[lang];
                for (const k of keys) {
                    value = value?.[k];
                }
                return value || key;
            },
            locale: () => locales[get().language] || ru
        }),
        {
            name: 'barber-app-storage',
            partialize: (state) => ({
                user: state.user,
                language: state.language,
                theme: state.theme,
                salonSettings: state.salonSettings,
                appointments: state.appointments,
                notifications: state.notifications,
                services: state.services,
                campaigns: state.campaigns,
                reviews: state.reviews,
                dismissedPrompts: state.dismissedPrompts,
                blockedPhones: state.blockedPhones,
                workScheduleOverrides: state.workScheduleOverrides,
                clients: state.clients
            }),
        }
    )
)
