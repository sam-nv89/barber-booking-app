import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export const FeedbackModal = ({ isOpen, onClose, appointment }) => {
    const { t, addReview, user, reviews } = useStore();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    React.useEffect(() => {
        if (isOpen && appointment) {
            const existingReview = reviews.find(r => r.appointmentId === appointment.id);
            if (existingReview) {
                setRating(existingReview.rating);
                setComment(existingReview.comment || '');
            } else {
                setRating(0);
                setComment('');
            }
        }
    }, [isOpen, appointment, reviews]);

    const getEmoji = (r) => {
        if (r === 0) return '🤔';
        if (r <= 1) return '😢';
        if (r <= 2) return '😞';
        if (r <= 3) return '😐';
        if (r <= 4) return '🙂';
        return '🤩';
    };

    const getLabel = (r) => {
        if (r === 0) return '';
        if (r <= 1) return t('reviews.terrible');
        if (r <= 2) return t('reviews.bad');
        if (r <= 3) return t('reviews.average');
        if (r <= 4) return t('reviews.good');
        return t('reviews.awesome');
    };

    const handleSubmit = () => {
        addReview({
            clientId: user.phone, // using phone as ID for simplicity
            clientName: user.name,
            appointmentId: appointment?.id,
            rating,
            comment,
            serviceName: appointment?.serviceName // Pass service name for context
        });
        setIsSubmitted(true);
        setTimeout(() => {
            onClose();
            setIsSubmitted(false);
            setRating(0);
            setComment('');
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-background rounded-2xl w-full max-w-sm shadow-xl overflow-hidden relative"
                >
                    {!isSubmitted ? (
                        <div className="p-6 flex flex-col items-center text-center space-y-6">
                            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>

                            <div>
                                <h2 className="text-xl font-bold">{t('reviews.title')}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{t('reviews.rateExperience')}</p>
                            </div>

                            {/* Emoji Animation */}
                            <motion.div
                                key={hoverRating || rating}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-6xl"
                            >
                                {getEmoji(hoverRating || rating)}
                            </motion.div>

                            <div className="h-6 font-medium text-primary">
                                {getLabel(hoverRating || rating)}
                            </div>

                            {/* Stars */}
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                                    >
                                        <Star
                                            className={cn(
                                                "w-8 h-8 transition-colors",
                                                (hoverRating || rating) >= star
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-muted-foreground/30"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Comment */}
                            <textarea
                                className="w-full p-3 bg-muted/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder={t('reviews.placeholder')}
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <Button className="w-full font-bold" disabled={rating === 0} onClick={handleSubmit}>
                                {t('reviews.submit')}
                            </Button>
                        </div>
                    ) : (
                        <div className="p-12 flex flex-col items-center text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"
                            >
                                <Star className="w-10 h-10 fill-current" />
                            </motion.div>
                            <h3 className="text-2xl font-bold">{t('reviews.thankYou')}</h3>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
