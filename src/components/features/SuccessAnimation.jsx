import React from 'react';
import { motion } from 'framer-motion';

export const SuccessAnimation = ({ onComplete, title = "Успешно!", message = "Ваша запись подтверждена" }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4 border"
            >
                <div className="relative w-32 h-32 mb-6">
                    {/* Pulsing background */}
                    <motion.div
                        className="absolute inset-0 bg-green-500/20 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Main Circle */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                        {/* Checkmark SVG */}
                        <svg
                            className="w-16 h-16 text-white drop-shadow-md"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                        >
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </motion.div>
                </div>

                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-center mb-2"
                >
                    {title}
                </motion.h2>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-muted-foreground mb-6"
                >
                    {message}
                </motion.p>

                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={onComplete}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors"
                >
                    Отлично
                </motion.button>
            </motion.div>
        </div>
    );
};
