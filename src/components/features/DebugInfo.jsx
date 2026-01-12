import React from 'react';
import { useTMA } from '@/components/providers/TMAProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const DebugInfo = () => {
    const { isTelegram, platform, themeParams, colorScheme, ready } = useTMA();

    const dump = JSON.stringify({
        isTelegram,
        platform,
        ready,
        themeParams,
        path: window.location.pathname,
        userAgent: navigator.userAgent
    }, null, 2);

    return (
        <Card className="mt-8 border-yellow-500 bg-yellow-500/10 dark:bg-yellow-900/10">
            <CardHeader>
                <CardTitle className="text-sm font-mono text-yellow-700 dark:text-yellow-500">
                    🛠 DEBUG T.M.A.
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="text-xs font-mono break-all whitespace-pre-wrap bg-black/5 dark:bg-black/50 p-2 rounded">
                    {dump}
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
