import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FeedbackModal } from '@/components/features/FeedbackModal';

export const FeedbackPrompt = () => {
    const { appointments, reviews, dismissedPrompts, dismissRatePrompt, user, t, services, language } = useStore();
    const [promptApp, setPromptApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        // Only for clients
        if (user.role !== 'client') return;

        // Find an appointment that:
        // 1. Is completed
        // 2. Has NO review
        // 3. Is NOT dismissed
        // 4. Belongs to current user
        const eligible = appointments.find(app =>
            app.clientPhone === user.phone &&
            app.status === 'completed' &&
            !reviews.find(r => r.appointmentId === app.id) &&
            !dismissedPrompts.includes(app.id)
        );

        if (eligible) {
            // Small delay to not be annoying immediately on load
            const timer = setTimeout(() => {
                setPromptApp(eligible);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // Only clear if NOT showing the hint
            if (!showHint) {
                setPromptApp(null);
            }
        }
    }, [appointments, reviews, dismissedPrompts, user, showHint]);

    const handleRateNow = () => {
        setShowModal(true);
        // We don't dismiss yet, we dismiss after submission inside modal logic or here?
        // Actually FeedbackModal handles submission. 
        // But if they close FeedbackModal without rating? They might want to be prompted again? 
        // For now, let's keep it simple. If they open the modal, we consider them "engaged".
    };

    const handleLater = () => {
        if (promptApp) {
            // Dismiss permanently
            dismissRatePrompt(promptApp.id);
            // Show hint UI
            setShowHint(true);
        }
    };

    const handleDismissHint = () => {
        setPromptApp(null);
        setShowHint(false);
    };

    const handleModalClose = () => {
        setShowModal(false);
        // If they successfully rated, the 'reviews' array updates, and the useEffect will automatically clear promptApp.
        // If they closed without rating, promptApp stays (unless we want to dismiss it too).
        // Let's dismiss it to avoid loop.
        if (promptApp) {
            dismissRatePrompt(promptApp.id);
            setPromptApp(null);
        }
    };

    const getServiceName = (app) => {
        if (!app) return '';
        const service = services.find(s => s.id === app.serviceId);
        if (!service) return app.serviceName || 'Service'; // Fallback to stored name if any
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    if (!promptApp && !showModal) return null;

    return (
        <>
            <AnimatePresence>
                {promptApp && !showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <AnimatePresence mode='wait'>
                            {showHint ? (
                                <motion.div
                                    key="hint"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-background rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative border border-border p-8"
                                >
                                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                {t('reviews.rateLater')}
                                            </h3>
                                            <p className="text-muted-foreground text-sm mt-2">
                                                {t('reviews.rateLaterHint')}
                                            </p>
                                        </div>
                                        <div className="w-full bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-center justify-center gap-2 mb-2">
                                            <span className="font-medium">{t('nav.visits')}</span>
                                            <span>→</span>
                                            <span className="font-medium">{t('reviews.history')}</span>
                                        </div>
                                        <Button onClick={handleDismissHint} className="w-full" variant="secondary">
                                            {t('common.gotIt')}
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="prompt"
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="bg-background rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative border border-border"
                                >
                                    <div className="p-6 text-center space-y-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Star className="w-8 h-8 text-primary fill-primary/20" />
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-bold">{t('reviews.ratePromptTitle')}</h2>
                                            <p className="text-muted-foreground text-sm mt-1">{t('reviews.ratePromptDesc')}</p>
                                            <p className="text-xs font-medium text-primary mt-2 uppercase tracking-wide">
                                                {getServiceName(promptApp)}
                                            </p>
                                        </div>

                                        <div className="grid gap-3 pt-2">
                                            <Button onClick={handleRateNow} className="w-full text-base py-6 shadow-lg shadow-primary/20">
                                                <Star className="w-5 h-5 mr-2" />
                                                {t('reviews.title')}
                                            </Button>
                                            <Button variant="ghost" onClick={handleLater} className="text-muted-foreground hover:text-foreground">
                                                <Clock className="w-4 h-4 mr-2" />
                                                {t('reviews.rateLater')}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </AnimatePresence>

            {/* The Actual Rating Modal */}
            <FeedbackModal
                isOpen={showModal}
                onClose={handleModalClose}
                appointment={promptApp}
            />
        </>
    );
};
