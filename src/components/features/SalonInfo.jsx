import React from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { MapPin, Phone, Navigation, Scissors, Calendar as CalendarIcon, Clock, Dumbbell, Sparkles, Droplets, Palette, Zap, Crown, Sun, Trophy, User, Smile, Gem, Activity, Heart, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper to clean phone number for URLs
const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
};

export const SalonInfo = ({ showClock = false, className }) => {
    const { salonSettings, language, locale } = useStore();
    const { icon, address, phone, name } = salonSettings || {};
    const cleanedPhone = cleanPhone(phone);
    const [time, setTime] = React.useState(new Date());

    // Dynamic icon map with animations
    const { IconComponent, animation } = React.useMemo(() => {
        const icons = {
            scissors: { Icon: Scissors, animation: 'animate-snip' },
            dumbbell: { Icon: Dumbbell, animation: 'animate-pump' },
            sparkles: { Icon: Sparkles, animation: 'animate-twinkle' },
            droplets: { Icon: Droplets, animation: 'animate-drip' },
            palette: { Icon: Palette, animation: 'animate-wiggle' },
            zap: { Icon: Zap, animation: 'animate-pulse' }, // Built-in pulse
            crown: { Icon: Crown, animation: 'animate-float' },
            sun: { Icon: Sun, animation: 'animate-spin-slow' },
            trophy: { Icon: Trophy, animation: 'animate-float' },
            user: { Icon: User, animation: 'animate-bounce-slight' },
            smile: { Icon: Smile, animation: 'animate-bounce-slight' },
            gem: { Icon: Gem, animation: 'animate-pulse' },
            activity: { Icon: Activity, animation: 'animate-pulse' },
            heart: { Icon: Heart, animation: 'animate-beat' }
        };
        const selected = icons[icon] || icons['scissors'];
        return { IconComponent: selected.Icon, animation: selected.animation };
    }, [icon]);

    // Clock update
    React.useEffect(() => {
        if (!showClock) return;
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [showClock]);

    // Don't render if no useful info
    if (!address && !phone && !showClock) return null;

    const translations = {
        howToReach: {
            ru: 'Как добраться',
            en: 'Directions',
            kz: 'Жол',
            tr: 'Yol tarifi',
            es: 'Direcciones'
        },
        contact: {
            ru: 'Связаться',
            en: 'Contact',
            kz: 'Байланыс',
            tr: 'İletişim',
            es: 'Contacto'
        },
        callAction: {
            ru: 'Позвонить',
            en: 'Call',
            kz: 'Қоңырау шалу',
            tr: 'Ara',
            es: 'Llamar'
        }
    };

    const getText = (key) => translations[key]?.[language] || translations[key]?.ru;

    return (
        <Card className={cn("overflow-hidden border-0 shadow-xl", className)}>
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

                .group:hover .animate-snip { animation: snip 0.6s ease-in-out forwards; }
                .group:hover .animate-twinkle { animation: twinkle 1s ease-in-out infinite; }
                .group:hover .animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }
                .group:hover .animate-drip { animation: drip 1.5s ease-in-out infinite; }
                .group:hover .animate-float { animation: float 2s ease-in-out infinite; }
                .group:hover .animate-spin-slow { animation: spin-slow 4s linear infinite; }
                .group:hover .animate-pump { animation: pump 0.8s ease-in-out infinite; }
                .group:hover .animate-beat { animation: beat 0.8s ease-in-out infinite; }
                .group:hover .animate-bounce-slight { animation: bounce-slight 1s ease-in-out infinite; }
                
                /* Standard pulse override for hover control if needed, but Tailwind 'animate-pulse' is continuous. 
                   We use custom classes for hover-only control. */
            `}</style>

            {/* Header: Salon | Clock | Calendar Date */}
            <div className="bg-slate-900 text-white relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                <div className="px-5 py-4 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-3 relative min-h-[50px]">

                        {/* Top Row on Mobile: Salon Info + Date Icon */}
                        <div className="w-full flex items-center justify-between sm:w-auto sm:flex-1 sm:justify-start gap-3">
                            {/* Salon info - left */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 shadow-lg group cursor-pointer">
                                    <IconComponent className={cn("w-5 h-5 text-white/90", animation)} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg leading-tight truncate tracking-tight">{name || 'Салон'}</h3>
                                    {address && (
                                        <p className="text-xs text-white/60 flex items-center gap-1.5 truncate mt-1 font-medium uppercase tracking-widest">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{address}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date info - visible only on mobile here (optional, or keeping layout consistent) */}
                            {/* Actually, let's keep Date on the right for Desktop, and maybe show just icon on mobile right? */}
                            {/* For now, let's stick to the plan: Stack Clock below */}
                            {showClock && (
                                <div className="sm:hidden w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                                    <CalendarIcon className="w-5 h-5 text-white/90" />
                                </div>
                            )}
                        </div>

                        {/* Clock - Stacked on Mobile, Centered on Desktop */}
                        {showClock && (
                            <div className="text-center z-10 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
                                <div className="text-5xl sm:text-5xl font-bold tabular-nums tracking-tighter leading-none bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent drop-shadow-sm">
                                    {format(time, 'HH:mm')}
                                </div>
                                {/* Date text below clock on mobile? */}
                                <div className="sm:hidden text-xs text-white/60 mt-1 uppercase tracking-widest font-medium">
                                    {format(time, 'd MMM, EEEE', { locale: locale() })}
                                </div>
                            </div>
                        )}

                        {/* Date info - Desktop Right */}
                        {showClock && (
                            <div className="hidden sm:flex items-center gap-3 min-w-0 flex-1 justify-end z-20 text-right">
                                <div className="min-w-0 flex flex-col items-center">
                                    <h3 className="font-bold text-lg leading-tight truncate tracking-tight">
                                        {format(time, 'd MMMM yyyy', { locale: locale() })}
                                    </h3>
                                    <p className="text-xs text-white/60 mt-1 uppercase tracking-widest font-medium">
                                        {format(time, 'EEEE', { locale: locale() })}
                                    </p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                                    <CalendarIcon className="w-5 h-5 text-white/90" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CardContent className="p-0 bg-background">
                {/* Quick actions row */}
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
                    {/* Navigation buttons */}
                    {address && (
                        <div className="flex-1 p-5">
                            <div className="flex items-center gap-2 mb-3.5">
                                <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/20">
                                    <Navigation className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-sm font-semibold text-foreground/80">{getText('howToReach')}</span>
                            </div>
                            <div className="flex gap-2.5 flex-wrap">
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/20 dark:to-slate-800 border border-blue-100/50 dark:border-blue-800/30 text-white hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 group relative"
                                    title="Google Maps"
                                >
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-7 h-7 opacity-90 group-hover:scale-110 transition-transform duration-300" />
                                </a>
                                <a
                                    href={`https://yandex.ru/maps/?rtext=~${encodeURIComponent(address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50/50 to-white dark:from-red-900/20 dark:to-slate-800 border border-red-100/50 dark:border-red-800/30 text-white hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 transition-all duration-300 group relative"
                                    title="Yandex Maps"
                                >
                                    <img src="https://yandex.ru/favicon.ico" alt="Yandex" className="w-7 h-7 opacity-90 group-hover:scale-110 transition-transform duration-300" />
                                </a>
                                <a
                                    href={`https://2gis.ru/search/${encodeURIComponent(address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50/50 to-white dark:from-green-900/20 dark:to-slate-800 border border-green-100/50 dark:border-green-800/30 text-white hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 transition-all duration-300 group relative"
                                    title="2GIS"
                                >
                                    <img src="https://2gis.ru/favicon.ico" alt="2GIS" className="w-7 h-7 opacity-90 group-hover:scale-110 transition-transform duration-300" />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Vertical divider */}
                    {/* The vertical divider is now handled by `divide-x` on the parent div */}
                    {/* {address && phone && cleanedPhone && (
                        <div className="w-px bg-border self-stretch my-3" />
                    )} */}

                    {/* Contact buttons */}
                    {phone && cleanedPhone && (
                        <div className="flex-1 p-5">
                            <div className="flex items-center gap-2 mb-3.5">
                                <div className="p-1 rounded-md bg-green-50 dark:bg-green-900/20">
                                    <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-semibold text-foreground/80">{getText('contact')}</span>
                            </div>
                            <div className="flex gap-2.5 flex-wrap">
                                {/* Call */}
                                <a
                                    href={`tel:+${cleanedPhone}`}
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                                    title={getText('callAction')}
                                >
                                    <Phone className="w-5 h-5" />
                                </a>

                                {/* WhatsApp */}
                                <a
                                    href={`https://wa.me/${cleanedPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                                    title="WhatsApp"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </a>

                                {/* Telegram */}
                                <a
                                    href={`https://t.me/+${cleanedPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#0077b5] text-white hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                                    title="Telegram"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SalonInfo;
