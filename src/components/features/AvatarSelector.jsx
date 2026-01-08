import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
    Dumbbell, Sparkles, Droplets, Palette, Zap, Crown, Sun, Trophy,
    User, Smile, Gem, Scissors, Activity, Heart, Coffee, Star, ChevronDown
} from 'lucide-react';

const ICONS = [
    { id: 'scissors', Icon: Scissors, label: 'Barber', animation: 'group-hover:animate-snip' },
    { id: 'sparkles', Icon: Sparkles, label: 'Beauty', animation: 'group-hover:animate-twinkle' },
    { id: 'palette', Icon: Palette, label: 'Nails', animation: 'group-hover:animate-wiggle' },
    { id: 'droplets', Icon: Droplets, label: 'Peeling', animation: 'group-hover:animate-drip' },
    { id: 'zap', Icon: Zap, label: 'Sugaring', animation: 'group-hover:animate-pulse' },
    { id: 'user', Icon: User, label: 'Style', animation: 'group-hover:animate-bounce-slight' },
    { id: 'crown', Icon: Crown, label: 'VIP', animation: 'group-hover:animate-float' },
    { id: 'gem', Icon: Gem, label: 'Premium', animation: 'group-hover:animate-shine' },
    { id: 'sun', Icon: Sun, label: 'Massage', animation: 'group-hover:animate-spin-slow' },
    { id: 'dumbbell', Icon: Dumbbell, label: 'Gym', animation: 'group-hover:animate-pump' },
    { id: 'trophy', Icon: Trophy, label: 'Sport', animation: 'group-hover:animate-float' },
    { id: 'activity', Icon: Activity, label: 'Health', animation: 'group-hover:animate-pulse' },
    { id: 'heart', Icon: Heart, label: 'Care', animation: 'group-hover:animate-beat' },
    { id: 'smile', Icon: Smile, label: 'Happy', animation: 'group-hover:animate-bounce-slight' },
];

export const AvatarSelector = ({ value, onChange, label, editLabel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = ICONS.find(i => i.id === value) || ICONS[0];
    const SelectedIcon = selected.Icon;

    return (
        <>
            <style>{`
                @keyframes snip {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-30deg); }
                    50% { transform: rotate(0deg); }
                    75% { transform: rotate(-30deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.85); }
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                @keyframes drip {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(3px); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pump {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes beat {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.1); }
                }
                @keyframes bounce-slight {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                
                .animate-snip { animation: snip 0.6s ease-in-out; }
                .animate-twinkle { animation: twinkle 1.5s ease-in-out infinite; }
                .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
                .animate-drip { animation: drip 2s ease-in-out infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-pump { animation: pump 1s ease-in-out infinite; }
                .animate-beat { animation: beat 1s ease-in-out infinite; }
                .animate-bounce-slight { animation: bounce-slight 2s ease-in-out infinite; }
            `}</style>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors cursor-pointer group h-14" onClick={() => setIsOpen(true)}>
                <div className="flex items-center gap-3">
                    <div className="relative group-hover:scale-105 transition-transform duration-300">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 flex items-center justify-center text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                            <SelectedIcon className={cn("w-5 h-5 relative z-10", selected.animation)} />
                        </div>
                    </div>
                    <span className="text-sm font-medium">{selected.label}</span>
                </div>

                <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </div>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={label}>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 p-2">
                    {ICONS.map(({ id, Icon, label, animation }) => (
                        <button
                            key={id}
                            onClick={() => {
                                onChange(id);
                                setIsOpen(false);
                            }}
                            className="flex flex-col items-center gap-2 group relative p-2"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                                value === id
                                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                    : "bg-muted hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 text-muted-foreground hover:text-blue-600"
                            )}>
                                {value === id && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                )}
                                <Icon className={cn("w-7 h-7 transition-all duration-300", value === id ? animation : `group-hover:${animation.split(':')[1] || animation}`)} />
                            </div>
                            <span className={cn("text-xs font-medium text-center", value === id ? "text-blue-600" : "text-muted-foreground")}>
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </Modal>
        </>
    );
};
