import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const Layout = ({ children }) => {
    return (
        <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
            <Header />
            <main className="flex-1 container px-4 py-6 pb-24">
                {children}
            </main>
            <BottomNav />
        </div>
    );
};
