import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Star, MessageSquare, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // Assuming you have this utility

export const Reviews = () => {
    const { reviews, t, replyToReview, markReviewRead, locale } = useStore();
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

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">{t('reviews.reviews')}</h1>

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
                    <Card key={review.id} className={cn("transition-colors", !review.isRead && "border-primary/50 bg-primary/5")}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {review.clientName}
                                        {!review.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(review.date), 'd MMMM yyyy', { locale: locale() })} • {review.serviceName || 'Service'}
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
                            {review.reply ? (
                                <div className="bg-muted p-3 rounded-lg text-sm mt-2">
                                    <div className="font-medium text-xs mb-1 opacity-70">You replied:</div>
                                    {review.reply}
                                </div>
                            ) : (
                                <div className="mt-2">
                                    {replyingTo === review.id ? (
                                        <div className="space-y-2">
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
                                    ) : (
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
                                    )}
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
