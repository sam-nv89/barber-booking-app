import React from 'react';
import { useStore } from '@/store/useStore';
import { X, Moon } from 'lucide-react';

export const WelcomeAnimation = ({ previewTimeOfDay, onComplete }) => {
    const { user, language } = useStore();
    const [isVisible, setIsVisible] = React.useState(true);

    // Determine time of day
    const getTimeOfDay = () => {
        if (previewTimeOfDay) return previewTimeOfDay;
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    };

    const timeOfDay = getTimeOfDay();
    const isNight = timeOfDay === 'night' || timeOfDay === 'evening';

    // Greetings
    const greetings = {
        ru: { morning: 'Доброе утро', afternoon: 'Добрый день', evening: 'Добрый вечер', night: 'Доброй ночи' },
        en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night' },
        kz: { morning: 'Қайырлы таң', afternoon: 'Қайырлы күн', evening: 'Қайырлы кеш', night: 'Қайырлы түн' }
    };

    const greeting = greetings[language?.split('-')[0]]?.[timeOfDay] || greetings.ru[timeOfDay];
    const userName = user?.name || '';

    // Sky Gradients
    const skyGradients = {
        morning: 'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)',
        afternoon: 'linear-gradient(to top, #2980b9 0%, #6dd5fa 100%, #ffffff 100%)',
        evening: 'linear-gradient(to bottom, #2c3e50 0%, #fd746c 100%)',
        night: 'linear-gradient(to bottom, #0f2027 0%, #203a43 50%, #2c5364 100%)'
    }[timeOfDay];

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onComplete?.(), 500);
    };

    React.useEffect(() => {
        const timer = setTimeout(handleClose, 6000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    // --- Components for Natural Sun ---

    // Morning Sun: Soft, diffused, rising. Pinkish/Gold glow.
    // Updated: Uses wrapper for precise centering at top-[20%].
    // Morning Sun: Soft, diffused, rising. Pinkish/Gold glow.
    // Updated: Uses w-0 h-0 wrapper to ensure anchor point is the exact center.
    const MorningSun = () => (
        <div className="absolute top-[20%] right-[20%] -translate-y-1/2 z-10 w-0 h-0">
            <div className="animate-sunrise relative">
                {/* Huge atmospheric scatter (Same as Day) */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] opacity-50"
                    style={{ width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.2) 60%, transparent 100%)' }}
                />
                {/* Bright halo */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[30px]"
                    style={{ width: '180px', height: '180px', background: '#FDB813' }}
                />
                {/* Pure White Core */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_60px_rgba(255,255,255,1)]"
                    style={{ width: '100px', height: '100px', background: '#ffffff' }}
                />
            </div>
        </div>
    );

    // Afternoon Sun: Blindingly bright, white center, gold halo.
    // Updated: Uses w-0 h-0 wrapper.
    const DaySun = () => (
        <div className="absolute top-[20%] right-[20%] -translate-y-1/2 z-10 w-0 h-0">
            <div className="animate-pulse-sun-smooth relative">
                {/* Huge atmospheric scatter */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] opacity-50"
                    style={{ width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.2) 60%, transparent 100%)' }}
                />
                {/* Bright halo */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[30px]"
                    style={{ width: '180px', height: '180px', background: '#FDB813' }}
                />
                {/* Pure White Core */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_60px_rgba(255,255,255,1)]"
                    style={{ width: '100px', height: '100px', background: '#ffffff' }}
                />
            </div>
        </div>
    );

    // Evening Sun: Deep orange/red, setting.
    // Updated: Uses w-0 h-0 wrapper.
    const EveningSun = () => (
        <div className="absolute top-[20%] right-[20%] -translate-y-1/2 z-10 w-0 h-0">
            <div className="animate-sunset relative">
                {/* Reddish haze */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[50px] opacity-60"
                    style={{ width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(255,69,0,0.4) 0%, rgba(100,0,0,0.1) 70%, transparent 100%)' }}
                />
                {/* Orange Core */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[15px]"
                    style={{ width: '100px', height: '100px', background: '#ff4500' }}
                />
                {/* Sun Disk Gradient */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: '80px', height: '80px', background: 'linear-gradient(to bottom, #ff8c00, #ff0000)' }}
                />
            </div>
        </div>
    );

    // Night Moon: Realistic, cratered, glowing white/silver.
    // Updated: Uses w-0 h-0 wrapper to match Sun alignment.
    const NaturalMoon = () => (
        <div className="absolute top-[20%] right-[20%] -translate-y-1/2 z-10 w-0 h-0">
            <div className="animate-moonrise relative">
                {/* Cold Atmospheric Glow */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] opacity-30"
                    style={{ width: '250px', height: '250px', background: '#e2e8f0' }}
                />

                {/* Moon Object */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    style={{
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle at 30% 30%, #f8fafc 0%, #cbd5e1 80%, #64748b 100%)',
                        boxShadow: 'inset -15px -15px 30px rgba(0,0,0,0.2)'
                    }}
                >
                    {/* Craters for realism */}
                    <div className="absolute top-[25%] left-[25%] w-5 h-5 rounded-full bg-[#94a3b8] opacity-20 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]" />
                    <div className="absolute top-[55%] left-[60%] w-7 h-7 rounded-full bg-[#94a3b8] opacity-15 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]" />
                    <div className="absolute top-[40%] left-[75%] w-3 h-3 rounded-full bg-[#94a3b8] opacity-20" />
                    <div className="absolute top-[70%] left-[30%] w-4 h-4 rounded-full bg-[#94a3b8] opacity-15" />
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000"
            style={{ background: skyGradients }
            }
            onClick={handleClose}
        >
            {/* Close Button */}
            < button
                className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
            >
                <X className="w-6 h-6" />
            </button >

            {/* --- Celestial Layers --- */}
            < div className="absolute inset-0 w-full h-full pointer-events-none" >

                {timeOfDay === 'morning' && <MorningSun />}
                {timeOfDay === 'afternoon' && <DaySun />}
                {timeOfDay === 'evening' && <EveningSun />}

                {timeOfDay === 'night' && <NaturalMoon />}

                {/* Stars */}
                {
                    (timeOfDay === 'night' || timeOfDay === 'evening') && (
                        <div className="absolute inset-0">
                            {[...Array(60)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-white rounded-full animate-twinkle"
                                    style={{
                                        width: Math.random() * 2 + 1 + 'px',
                                        height: Math.random() * 2 + 1 + 'px',
                                        top: Math.random() * 100 + '%',
                                        left: Math.random() * 100 + '%',
                                        opacity: Math.random(),
                                        animationDelay: Math.random() * 3 + 's'
                                    }}
                                />
                            ))}
                        </div>
                    )
                }

                {/* Clouds (Only daytime) */}
                {
                    !isNight && (
                        <>
                            <div className="absolute top-[25%] left-[-10%] animate-float-cloud opacity-80 blur-[1px]">
                                <CloudSVG width="160" />
                            </div>
                            <div className="absolute top-[45%] right-[-10%] animate-float-cloud-slow opacity-60 blur-[2px]">
                                <CloudSVG width="120" />
                            </div>
                            {/* 3rd Cloud - Lower left, distant */}
                            <div className="absolute top-[60%] left-[10%] animate-float-cloud opacity-50 blur-[1px]">
                                <CloudSVG width="140" />
                            </div>
                        </>
                    )
                }
            </div >

            {/* Greeting Text - Improved Readability */}
            < div className="relative z-40 text-center animate-fade-in px-4 select-none cursor-default" >
                <h1
                    className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight"
                    style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 2px 5px rgba(0,0,0,0.3)' }}
                >
                    {greeting}
                </h1>
                {
                    userName && (
                        <p
                            className="text-5xl md:text-6xl font-bold text-white tracking-wide"
                            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 2px 5px rgba(0,0,0,0.3)' }}
                        >
                            {userName}
                        </p>
                    )
                }
            </div >
        </div >
    );
};

// --- SVGs ---

const CloudSVG = ({ width = "100" }) => (
    <svg width={width} viewBox="0 0 100 50" fill="white">
        <path d="M78,25 Q95,25 95,40 Q95,55 75,55 L25,55 Q5,55 5,35 Q5,15 25,15 Q30,5 50,5 Q70,5 78,25" />
    </svg>
);

export default WelcomeAnimation;
