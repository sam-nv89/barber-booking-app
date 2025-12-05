import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, description }) => {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-card border rounded-2xl shadow-2xl p-6 overflow-hidden"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            <div className="flex gap-3 w-full pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    Назад
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                >
                                    Подтвердить
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
