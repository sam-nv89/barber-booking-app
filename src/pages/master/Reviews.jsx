import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Star, MessageSquare, Check, RotateCcw, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // Assuming you have this utility

export const Reviews = () => {
    const { reviews, t, replyToReview, markReviewRead, locale } = useStore();
    const location = useLocation();
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const sortedReviews = [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    const handleReplySubmit = (id) => {
        replyToReview(id, replyText);
        setReplyingTo(null);
        setReplyText('');
    };

    // Handle navigation
    // Handle navigation
    const { appointments, services } = useStore();
    const [searchParams, setSearchParams] = useSearchParams(); // Use search params
    const highlightId = searchParams.get('reviewId') || location.state?.highlightId;

    // Additional state for controlling the animation class explicitly
    const [animatedReviewId, setAnimatedReviewId] = useState(null);

    useEffect(() => {
        if (highlightId) {
            // Need small delay to ensure rendering
            setTimeout(() => {
                const el = document.getElementById(`review-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setAnimatedReviewId(Number(highlightId));

                    // Clear search params to prevent re-animation on refresh/update
                    // Use replace: true to avoid adding to history stack
                    if (searchParams.get('reviewId')) {
                        setSearchParams({}, { replace: true });
                    }

                    // Clear animation after 3 seconds
                    setTimeout(() => setAnimatedReviewId(null), 3000);
                }
            }, 300);
        }
    }, [highlightId, reviews, searchParams, setSearchParams]);

    const getReviewServiceName = (review) => {
        if (review.serviceName) return review.serviceName;
        // Fallback: finding service name via available appointments
        const app = appointments.find(a => a.id === review.appointmentId);
        if (app) {
            const service = services.find(s => s.id === app.serviceId);
            if (service) {
                if (typeof service.name === 'object') {
                    return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
                }
                return service.name;
            }
        }
        return t('booking.service');
    };

    const hasUnread = reviews.some(r => !r.isRead);
    const { markAllReviewsAsRead } = useStore();

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('reviews.reviews')}</h1>
                {hasUnread && (
                    <Button variant="ghost" size="sm" onClick={markAllReviewsAsRead}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        {t('reviews.markAllRead')}
                    </Button>
                )}
            </div>

            {/* Stats Card */}
            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <div className="text-4xl font-bold flex items-center gap-2">
                            {averageRating}
                            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="text-muted-foreground mt-1">
                            {reviews.length} {t('reviews.reviews').toLowerCase()}
                        </div>
                    </div>
                    {/* Mini breakdown bars could go here */}
                </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
                {sortedReviews.map((review) => (
                    <Card
                        key={review.id}
                        id={`review-${review.id}`}
                        className={cn(
                            "transition-all duration-1000",
                            !review.isRead && "border-primary/50 bg-primary/5",
                            animatedReviewId === review.id && "ring-2 ring-primary ring-offset-2 bg-yellow-50 dark:bg-yellow-900/20 scale-[1.02]"
                        )}
                    >
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {review.clientName}
                                        {!review.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(review.date), 'd MMMM yyyy', { locale: locale() })} • {getReviewServiceName(review)}
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={cn("w-4 h-4", star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                                    ))}
                                </div>
                            </div>

                            <p className="text-sm">{review.comment}</p>

                            {/* Reply Section */}
                            {/* Reply Section */}
                            {replyingTo === review.id ? (
                                <div className="mt-2 space-y-2">
                                    <textarea
                                        className="w-full p-2 text-sm border rounded-md"
                                        placeholder={t('reviews.replyPlaceholder')}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleReplySubmit(review.id)}>{t('reviews.sendReply')}</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>{t('common.cancel')}</Button>
                                    </div>
                                </div>
                            ) : review.reply ? (
                                <div className="bg-muted p-3 rounded-lg text-sm mt-2 group relative">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-xs mb-1 opacity-70">{t('reviews.youReplied')}</div>
                                            {review.reply}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                setReplyingTo(review.id);
                                                setReplyText(review.reply);
                                            }}
                                        >
                                            <span className="text-xs">✏️</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(review.id)}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            {t('reviews.reply')}
                                        </Button>
                                        {!review.isRead && (
                                            <Button variant="ghost" size="sm" onClick={() => markReviewRead(review.id)}>
                                                <Check className="w-4 h-4 mr-2" />
                                                {t('reviews.markRead')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {reviews.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">{t('reviews.noReviews')}</div>
                )}
            </div>
        </div>
    );
};
