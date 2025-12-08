import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TRANSLATIONS } from '../lib/i18n'
import { MOCK_APPOINTMENTS, DEFAULT_SCHEDULE } from '../lib/constants'
import { ru, enUS, kk } from 'date-fns/locale'

const locales = {
    ru: ru,
    en: enUS,
    kz: kk
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
                name: 'Alex',
                phone: '77700000000',
                avatar: null,
            },
            setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
            setRole: (role) => set((state) => ({ user: { ...state.user, role } })),

            // Settings State
            language: 'ru',
            theme: 'system',
            salonSettings: {
                name: 'Barber Shop #1',
                address: 'ул. Абая 150',
                phone: '+7 777 000 00 00',
                schedule: DEFAULT_SCHEDULE
            },
            setSalonSettings: (settings) => set((state) => ({ salonSettings: { ...state.salonSettings, ...settings } })),
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
                    message: `${campaign.name}! ${campaign.type === 'discount' ? 'Скидка ' + campaign.value + '%' : 'Специальная цена: ' + campaign.value + ' ₸'}`,
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
                // Snapshot the current price of the service
                // If price is passed from booking wizard (e.g. campaign price), use it.
                // Otherwise fallback to current service price.
                let priceSnapshot = appointment.price;

                if (priceSnapshot === undefined || priceSnapshot === null) {
                    const service = get().services.find(s => s.id === appointment.serviceId);
                    priceSnapshot = service ? service.price : 0;
                }

                const newApp = {
                    ...appointment,
                    price: priceSnapshot, // LOCK THE PRICE
                    id: Date.now().toString(),
                    status: appointment.status || 'pending', // Allow status override (e.g. for Master booking)
                    createdAt: new Date().toISOString(),
                    unreadChanges: true
                };

                set((state) => ({
                    appointments: [...state.appointments, newApp],
                    notifications: [{
                        id: Date.now().toString(),
                        type: 'new',
                        recipient: 'master',
                        appointmentId: newApp.id,
                        titleKey: 'notifications.newBookingTitle',
                        messageKey: 'notifications.newBookingMessage',
                        params: { clientName: appointment.clientName, date: appointment.date, time: appointment.time },

                        // Fallback for old system
                        title: 'Новая заявка',
                        message: `Новая запись от ${appointment.clientName} на ${appointment.date} ${appointment.time}`,

                        date: new Date().toISOString(),
                        read: false
                    }, ...state.notifications]
                }));
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
                dismissedPrompts: state.dismissedPrompts
            }),
        }
    )
)
