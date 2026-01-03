import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
    { code: 'en', label: 'English', short: 'En' },
    { code: 'es', label: 'Español', short: 'Es' },
    { code: 'kz', label: 'Қазақша', short: 'Kz' },
    { code: 'ru', label: 'Русский', short: 'Ru' },
    { code: 'tr', label: 'Türkçe', short: 'Tr' },
];

export const LanguageSelector = () => {
    const { language, setLanguage } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors outline-none"
            >
                <span className="text-sm font-bold">{currentLang.short}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-40 rounded-xl border bg-popover p-1 shadow-lg backdrop-blur-lg z-50"
                    >
                        <div className="flex flex-col gap-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                        language === lang.code
                                            ? "bg-accent text-accent-foreground font-medium"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span>{lang.label}</span>
                                    {language === lang.code && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
