import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Scissors } from 'lucide-react';

// Greetings based on time of day
const GREETINGS = {
    morning: { ru: 'Доброе утро', en: 'Good morning', kz: 'Қайырлы таң' },
    afternoon: { ru: 'Добрый день', en: 'Good afternoon', kz: 'Қайырлы күн' },
    evening: { ru: 'Добрый вечер', en: 'Good evening', kz: 'Қайырлы кеш' },
    night: { ru: 'Доброй ночи', en: 'Good night', kz: 'Қайырлы түн' }
};

const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
};

const getSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
};

// Snowflake component for winter
const Snowflake = ({ style }) => (
    <div className="absolute text-white/70 animate-fall pointer-events-none" style={style}>❄</div>
);

// Leaf component for autumn  
const Leaf = ({ style }) => (
    <div className="absolute animate-leaf pointer-events-none" style={style}>🍂</div>
);

// Petal component for spring
const Petal = ({ style }) => (
    <div className="absolute animate-petal pointer-events-none" style={style}>🌸</div>
);

// Animated Sun component
const AnimatedSun = ({ timeOfDay }) => {
    const positionClass = timeOfDay === 'morning' ? 'bottom-1/3 left-1/4'
        : 'top-1/4 left-1/2 -translate-x-1/2';

    return (
        <div className={`absolute ${positionClass}`}>
            <div className="relative">
                {/* Sun glow */}
                <div className="absolute -inset-4 w-28 h-28 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" />
                {/* Sun body */}
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500 rounded-full shadow-2xl shadow-yellow-500/50 flex items-center justify-center animate-bounce-slow">
                    <span className="text-4xl">☀️</span>
                </div>
                {/* Animated rays */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-6 bg-gradient-to-t from-yellow-400 to-transparent rounded-full animate-ray"
                        style={{
                            left: '50%',
                            top: '50%',
                            transformOrigin: 'center center',
                            transform: `translateX(-50%) rotate(${i * 30}deg) translateY(-50px)`,
                            animationDelay: `${i * 0.1}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

// Animated Moon component with stars
const AnimatedMoon = () => (
    <div className="absolute top-16 right-1/4">
        <div className="relative">
            {/* Moon glow */}
            <div className="absolute -inset-4 w-24 h-24 bg-blue-200/20 rounded-full blur-xl animate-pulse" />
            {/* Moon body */}
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 via-slate-200 to-gray-300 rounded-full shadow-xl shadow-blue-200/40 relative overflow-hidden">
                {/* Moon craters */}
                <div className="absolute w-4 h-4 bg-gray-400/30 rounded-full top-2 left-3" />
                <div className="absolute w-3 h-3 bg-gray-400/30 rounded-full top-7 left-9" />
                <div className="absolute w-2 h-2 bg-gray-400/30 rounded-full top-10 left-4" />
            </div>
        </div>
    </div>
);

// Evening sunset component
const Sunset = () => (
    <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none">
        {/* Sunset glow layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/50 via-pink-500/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/30 via-transparent to-transparent" />
        {/* Setting sun */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-32 h-32 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-md opacity-80" />
        </div>
    </div>
);

// Twinkling stars for night
const Stars = () => (
    <>
        {[...Array(40)].map((_, i) => (
            <div
                key={i}
                className="absolute text-white animate-twinkle pointer-events-none"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 70}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                    fontSize: `${6 + Math.random() * 10}px`,
                    opacity: 0.4 + Math.random() * 0.6
                }}
            >
                {i % 4 === 0 ? '★' : '✦'}
            </div>
        ))}
    </>
);

export const WelcomeAnimation = ({ onComplete, previewTimeOfDay, previewSeason }) => {
    const { user, language } = useStore();
    const [isVisible, setIsVisible] = useState(true);
    const [stage, setStage] = useState(0);

    // Use preview values if provided, otherwise detect automatically
    const timeOfDay = previewTimeOfDay || getTimeOfDay();
    const season = previewSeason || getSeason();
    const greeting = GREETINGS[timeOfDay][language] || GREETINGS[timeOfDay].ru;
    const userName = user?.name?.split(' ')[0] || 'Гость';

    const particleCount = 12;

    useEffect(() => {
        // If in preview mode, don't auto-close
        if (previewTimeOfDay || previewSeason) return;

        const timer1 = setTimeout(() => setStage(1), 100);
        const timer2 = setTimeout(() => setStage(2), 4000);
        const timer3 = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, 5000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete, previewTimeOfDay, previewSeason]);

    // In preview mode, always show stage 1
    useEffect(() => {
        if (previewTimeOfDay || previewSeason) {
            setStage(1);
        }
    }, [previewTimeOfDay, previewSeason]);

    if (!isVisible) return null;

    // Background gradients based on time of day
    const backgrounds = {
        morning: 'linear-gradient(180deg, #87CEEB 0%, #FFE4B5 40%, #FDB99B 70%, #E8D5B7 100%)',
        afternoon: 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #B8E986 80%, #98FB98 100%)',
        evening: 'linear-gradient(180deg, #2D1B4E 0%, #553C9A 20%, #B7791F 50%, #ED8936 70%, #F6AD55 100%)',
        night: 'linear-gradient(180deg, #0D1B2A 0%, #1B263B 30%, #415A77 70%, #778DA9 100%)'
    };

    return (
        <div
            className={`fixed inset-0 z-[100] overflow-hidden transition-all duration-700 ${stage === 2 ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                }`}
            style={{ background: backgrounds[timeOfDay] }}
        >
            {/* Time of day elements */}
            {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && <AnimatedSun timeOfDay={timeOfDay} />}
            {timeOfDay === 'evening' && <Sunset />}
            {timeOfDay === 'night' && (
                <>
                    <AnimatedMoon />
                    <Stars />
                </>
            )}

            {/* Season-specific particles */}
            {season === 'winter' && [...Array(particleCount)].map((_, i) => (
                <Snowflake
                    key={i}
                    style={{
                        left: `${5 + Math.random() * 90}%`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${5 + Math.random() * 5}s`,
                        fontSize: `${12 + Math.random() * 16}px`
                    }}
                />
            ))}
            {season === 'autumn' && [...Array(particleCount)].map((_, i) => (
                <Leaf
                    key={i}
                    style={{
                        left: `${5 + Math.random() * 90}%`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${6 + Math.random() * 6}s`,
                        fontSize: `${16 + Math.random() * 14}px`
                    }}
                />
            ))}
            {season === 'spring' && [...Array(particleCount)].map((_, i) => (
                <Petal
                    key={i}
                    style={{
                        left: `${5 + Math.random() * 90}%`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${6 + Math.random() * 5}s`,
                        fontSize: `${14 + Math.random() * 12}px`
                    }}
                />
            ))}
            {season === 'summer' && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* Summer sun rays from top */}
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bg-gradient-to-b from-yellow-300/30 to-transparent animate-ray"
                            style={{
                                left: `${10 + i * 9}%`,
                                width: '3px',
                                height: `${30 + Math.random() * 30}%`,
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main content */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${stage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                <div className="text-center relative z-10 px-4">
                    {/* Scissors icon with animation */}
                    <div className={`flex justify-center mb-6 transition-all duration-700 delay-100 ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}>
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-2xl">
                                <Scissors className="w-10 h-10 text-white drop-shadow-lg animate-scissors" />
                            </div>
                            {/* Sparkles */}
                            <div className="absolute -top-2 -right-2 text-xl animate-twinkle">✨</div>
                            <div className="absolute -bottom-1 -left-2 text-lg animate-twinkle" style={{ animationDelay: '0.5s' }}>✨</div>
                        </div>
                    </div>

                    {/* Season icon */}
                    <div className={`text-4xl mb-4 transition-all duration-500 delay-200 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        }`}>
                        {season === 'winter' && '❄️'}
                        {season === 'spring' && '🌷'}
                        {season === 'summer' && '🌻'}
                        {season === 'autumn' && '🍁'}
                    </div>

                    {/* Greeting text */}
                    <h1 className={`text-4xl font-bold mb-3 drop-shadow-lg transition-all duration-500 delay-300 ${stage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                        style={{
                            color: (timeOfDay === 'night' || timeOfDay === 'evening') ? '#fff' : '#1a1a2e',
                        }}>
                        {greeting}
                    </h1>

                    {/* User name */}
                    <p className={`text-3xl font-semibold drop-shadow-md transition-all duration-500 delay-500 ${stage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                        style={{
                            color: (timeOfDay === 'night' || timeOfDay === 'evening') ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,46,0.85)'
                        }}>
                        {userName}! ✂️
                    </p>

                    {/* Decorative line */}
                    <div className={`mt-6 flex justify-center transition-all duration-700 delay-700 ${stage >= 1 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                        }`}>
                        <div className={`w-32 h-0.5 rounded-full ${(timeOfDay === 'night' || timeOfDay === 'evening')
                                ? 'bg-gradient-to-r from-transparent via-white/50 to-transparent'
                                : 'bg-gradient-to-r from-transparent via-gray-800/30 to-transparent'
                            }`} />
                    </div>
                </div>
            </div>

            {/* Loading dots at bottom */}
            {!previewTimeOfDay && !previewSeason && (
                <div className={`absolute bottom-8 left-0 right-0 flex justify-center transition-all duration-500 delay-800 ${stage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    }`}>
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{
                                    backgroundColor: (timeOfDay === 'night' || timeOfDay === 'evening') ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.4)',
                                    animationDelay: `${i * 0.2}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Close button for preview mode */}
            {(previewTimeOfDay || previewSeason) && (
                <button
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl hover:bg-white/30 transition-colors"
                    onClick={onComplete}
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default WelcomeAnimation;
