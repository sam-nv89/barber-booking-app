import React from 'react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Произошла критическая ошибка приложения. Мы уже работаем над её устранением.
                    </p>

                    <div className="p-4 bg-muted/50 rounded-lg text-left text-xs font-mono mb-6 max-w-full overflow-auto max-h-48 w-full border border-border">
                        <p className="font-bold text-red-500 mb-2">{this.state.error?.toString()}</p>
                        <pre className="whitespace-pre-wrap opacity-70">{this.state.errorInfo?.componentStack}</pre>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={this.handleReload} variant="outline">
                            Обновить страницу
                        </Button>
                        <Button onClick={this.handleReset} variant="destructive">
                            Сброс данных (Hard Reset)
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
