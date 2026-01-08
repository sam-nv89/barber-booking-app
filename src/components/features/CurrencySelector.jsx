import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

// Currency to Country Code map for flags
const CURRENCY_MAP = [
    { code: 'KZT', country: 'kz', symbol: '₸' },
    { code: 'RUB', country: 'ru', symbol: '₽' },
    { code: 'USD', country: 'us', symbol: '$' },
    { code: 'EUR', country: 'eu', symbol: '€' },
    { code: 'TRY', country: 'tr', symbol: '₺' },
    { code: 'UZS', country: 'uz', symbol: "s'om" },
    { code: 'KGS', country: 'kg', symbol: 'c' },
    { code: 'GBP', country: 'gb', symbol: '£' },
    { code: 'AED', country: 'ae', symbol: 'DH' }, // UAE Dirham
    { code: 'CNY', country: 'cn', symbol: '¥' },
    { code: 'KRW', country: 'kr', symbol: '₩' },
    { code: 'UAH', country: 'ua', symbol: '₴' },
    { code: 'BYN', country: 'by', symbol: 'Br' },
    { code: 'AZN', country: 'az', symbol: '₼' },
    { code: 'AMD', country: 'am', symbol: '֏' },
    { code: 'GEL', country: 'ge', symbol: '₾' },
    { code: 'TJS', country: 'tj', symbol: 'SM' },
    { code: 'ARS', country: 'ar', symbol: '$' }, // Peso
    { code: 'MXN', country: 'mx', symbol: '$' },
    { code: 'BRL', country: 'br', symbol: 'R$' },
    { code: 'INR', country: 'in', symbol: '₹' },
];

const FlagIcon = ({ countryCode, className }) => (
    <img
        src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
        alt=""
        className={cn("inline-block object-cover rounded-sm shrink-0", className)}
        style={{ width: '20px', height: '15px' }}
        loading="lazy"
    />
);

export const CurrencySelector = ({ value, onChange }) => {
    const { language } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Normalize value to currency code (if cleaner logic existed, but current app uses Symbols or mix)
    // Wait, the app uses symbols as VALUES in some places (formData.currency || '₸').
    // But map uses Codes.
    // I need to reverse match the symbol to the Code to find the item, OR update the app to use Codes.
    // Given user constraint, I must support existing Values (Symbols) but mapped.
    // Actually Settings.jsx previously had: value="₸".
    // So the stored value IS the symbol.
    // Challenge: Multiple currencies use '$'. (USD, MXN, ARS).
    // If the stored value is just '$', we don't know if it's USD or MXN.
    // FOR SAFETY: The app likely defaulted to '₸' or specific symbols.
    // I should probably switch to storing CODES ('KZT', 'USD') ideally, but that might break existing data logic if it relies on symbol display.
    // BUT the previous <select> had <option value="KZT">KZT</option> in some versions?
    // No, previous viewed file showed <option value="₸">...
    // Only generic symbols. This is weak design but I must respect it OR improve it carefully.
    // If I select 'USD', the value becomes '$'. Next time I load, '$' maps to... USD?
    // Let's assume unique symbols where possible or accept ambiguity for '$' defaulting to USD.
    // Or better: I will try to map by Code if value matches Code, OR Symbol.

    // BETTER APPROACH: Use the exact value passed. If it matches a symbol, find the first one.
    // Ideally I should start saving CODES. But let's stick to the current "Value" prop.

    const MANUAL_TRANSLATIONS = {
        kk: {
            KZT: 'Теңге',
            USD: 'АҚШ доллары',
            RUB: 'Ресей рублі',
            EUR: 'Еуро',
            UZS: 'Өзбек сомы',
            CNY: 'Қытай юані',
            TRY: 'Түрік лирасы',
            KGS: 'Қырғыз сомы',
            AED: 'БАӘ дирхамы',
            GBP: 'Фунт стерлинг'
        }
    };

    // Sort Currencies by Localized Name
    const getLocalizedName = (code) => {
        let locale = language || 'ru';
        // Map common app language codes to BCP 47 if needed errors
        if (locale === 'kz') locale = 'kk';

        // Check manual translations first
        if (MANUAL_TRANSLATIONS[locale]?.[code]) {
            return MANUAL_TRANSLATIONS[locale][code];
        }

        try {
            const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(code);
            // Capitalize first letter (Title Case)
            return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
        } catch (e) {
            return code;
        }
    };

    const items = CURRENCY_MAP.map(item => ({
        ...item,
        name: getLocalizedName(item.code)
    })).sort((a, b) => a.name.localeCompare(b.name));

    // Find selected item
    // Find selected item from enriched items (to get the name)
    const selectedItem = items.find(c => c.symbol === value) || items.find(c => c.code === value) || items[0];

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        // For ambiguous symbols (like '$'), use the Currency Code (e.g. 'ARS', 'MXN')
        // For USD and others, use the Symbol (e.g. '$', '€', '₸') to preserve existing behavior and display
        // This ensures flags load correctly for ARS/MXN while keeping '$' for USD as default
        const valueToStore = (item.symbol === '$' && item.code !== 'USD') ? item.code : item.symbol;
        onChange({ target: { name: 'currency', value: valueToStore } });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/5 transition-colors group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <FlagIcon countryCode={selectedItem.country} className="shrink-0" />

                    {/* Separator */}
                    <div className="h-4 w-px bg-border/50 shrink-0" />

                    <span className="font-medium w-11 text-center shrink-0">{selectedItem.symbol}</span>

                    {/* Separator */}
                    <div className="h-4 w-px bg-border/50 shrink-0" />

                    <span className="truncate">{selectedItem.name}</span>
                </div>

                {/* Chevron matching unified style */}
                <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0 ml-2" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md outline-none animate-in fade-in-0 zoom-in-95 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {items.map((item) => (
                            <div
                                key={item.code}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                    selectedItem.code === item.code && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => handleSelect(item)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FlagIcon countryCode={item.country} className="shrink-0" />

                                    {/* Separator */}
                                    <div className="h-4 w-px bg-border/50 shrink-0" />

                                    <span className="font-medium w-11 text-center shrink-0">{item.symbol}</span>

                                    {/* Separator */}
                                    <div className="h-4 w-px bg-border/50 shrink-0" />

                                    <span className="truncate">{item.name}</span>
                                </div>

                                {selectedItem.code === item.code && (
                                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <Check className="h-4 w-4" />
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
