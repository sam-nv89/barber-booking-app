import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';
import { useStore } from '@/store/useStore';

export const ClockWidget = () => {
    const [time, setTime] = useState(new Date());
    const { locale } = useStore();

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-bold tracking-tight text-primary tabular-nums">
                    {format(time, 'HH:mm')}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium capitalize">
                    {format(time, 'EEEE, d MMMM yyyy', { locale: locale() })}
                </div>
            </CardContent>
        </Card>
    );
};
