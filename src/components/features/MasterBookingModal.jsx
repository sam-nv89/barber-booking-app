import React from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { DateTimeSelector } from '@/components/features/DateTimeSelector';
import { format } from 'date-fns';
import { formatPrice, formatPhoneNumber, formatDuration } from '@/lib/utils';
import { User, Phone, Calendar, Scissors, Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MasterBookingModal = ({ onClose, initialDate = null, initialTime = null, initialMasterId = null }) => {
    const { services, addAppointment, appointments, t, salonSettings, language, locale, workScheduleOverrides, getMasters } = useStore();

    const masters = getMasters();

    const [selectedServices, setSelectedServices] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(initialDate);
    const [selectedTime, setSelectedTime] = React.useState(initialTime);
    const [selectedMasterId, setSelectedMasterId] = React.useState(initialMasterId);
    const [clientName, setClientName] = React.useState('');
    const [clientPhone, setClientPhone] = React.useState('');
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = React.useState(false);
    const [isMasterDropdownOpen, setIsMasterDropdownOpen] = React.useState(false);
    const [serviceSearchQuery, setServiceSearchQuery] = React.useState('');
    const dropdownRef = React.useRef(null);
    const masterDropdownRef = React.useRef(null);

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsServiceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Master dropdown click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (masterDropdownRef.current && !masterDropdownRef.current.contains(event.target)) {
                setIsMasterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    // Toggle service selection
    const toggleService = (service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            } else {
                return [...prev, service];
            }
        });
    };

    // Calculate totals
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    const handleSave = () => {
        if (selectedServices.length === 0 || !selectedDate || !selectedTime || !clientName) return;

        addAppointment({
            serviceIds: selectedServices.map(s => s.id),
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: selectedTime,
            clientName,
            clientPhone,
            totalPrice: totalPrice,
            totalDuration: totalDuration,
            masterId: (selectedMasterId === 'any' ? null : selectedMasterId) || null,
            status: 'confirmed' // Auto-confirm since Master is booking
        });
        onClose();
    };

    // Get master name by ID
    const getMasterName = (masterId) => {
        const master = masters.find(m => (m.tgUserId || m.id) === masterId);
        return master?.name || '';
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Service Selection with Checkboxes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        {t('booking.selectService')}
                    </label>
                    {/* Custom Multi-Select Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <div
                            className={cn(
                                "flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors bg-background",
                                isServiceDropdownOpen ? "border-primary ring-1 ring-primary" : "border-input"
                            )}
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                        >
                            <span className={cn("text-sm", selectedServices.length === 0 && "text-muted-foreground")}>
                                {selectedServices.length > 0
                                    ? selectedServices.map(s => getServiceName(s)).join(', ')
                                    : t('booking.selectService') || "Выберите услуги..."}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform text-muted-foreground", isServiceDropdownOpen && "rotate-180")} />
                        </div>

                        {/* Dropdown Content */}
                        {isServiceDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-60">
                                {/* Search */}
                                <div className="p-2 border-b bg-muted/30 sticky top-0 z-10">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder={t('common.search') || "Поиск..."}
                                            className="w-full pl-8 p-2 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                            value={serviceSearchQuery}
                                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* List */}
                                <div className="overflow-y-auto p-1">
                                    {services
                                        .filter(s => getServiceName(s).toLowerCase().includes(serviceSearchQuery.toLowerCase()))
                                        .map(service => {
                                            const isSelected = selectedServices.some(s => s.id === service.id);
                                            return (
                                                <div
                                                    key={service.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleService(service);
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn("text-sm font-medium", isSelected && "text-primary")}>
                                                            {getServiceName(service)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                            <span>{formatDuration(service.duration, t)}</span>
                                                            {service.price > 0 && <span>• {formatPrice(service.price)} {salonSettings?.currency || '₸'}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {services.filter(s => getServiceName(s).toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            {t('common.notFound') || "Ничего не найдено"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Summary */}
                    {selectedServices.length > 0 && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {t('common.selected')}: {selectedServices.length} • {formatDuration(totalDuration, t)} • {formatPrice(totalPrice)} {salonSettings?.currency || '₸'}
                        </div>
                    )}
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('booking.dateAndTime')}
                    </label>
                    <div className="border rounded-md p-4 bg-muted/20">
                        {initialDate && initialTime ? (
                            // Read-only display when opened from timeline cell
                            <div className="text-center space-y-2">
                                <div className="text-lg font-semibold">
                                    {format(initialDate, 'd MMMM yyyy', { locale: locale() })}
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    {initialTime}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {t('booking.timePreselected') || 'Время выбрано автоматически'}
                                </div>
                            </div>
                        ) : (
                            // Full picker when opened without preset
                            <DateTimeSelector
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                selectedTime={selectedTime}
                                onTimeSelect={setSelectedTime}
                                salonSettings={salonSettings}
                                appointments={appointments}
                                services={services}
                                workScheduleOverrides={workScheduleOverrides}
                                serviceDuration={totalDuration || 60}
                            />
                        )}
                    </div>
                </div>

                {/* Specialist Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('booking.selectMaster') || 'Выберите специалиста'}
                    </label>
                    {initialMasterId ? (
                        // Read-only display when pre-selected from timeline
                        <div className="border rounded-md p-3 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-medium">{getMasterName(initialMasterId)?.[0]}</span>
                                </div>
                                <div>
                                    <div className="font-medium">{getMasterName(initialMasterId)}</div>
                                    <div className="text-xs text-muted-foreground">{t('booking.timePreselected') || 'Выбран автоматически'}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Dropdown for manual selection
                        <div className="relative" ref={masterDropdownRef}>
                            <div
                                className={cn(
                                    "flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors bg-background",
                                    isMasterDropdownOpen ? "border-primary ring-1 ring-primary" : "border-input"
                                )}
                                onClick={() => setIsMasterDropdownOpen(!isMasterDropdownOpen)}
                            >
                                {selectedMasterId ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs">{getMasterName(selectedMasterId)?.[0]}</span>
                                        </div>
                                        <span className="text-sm">{getMasterName(selectedMasterId)}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        {t('booking.selectMaster') || 'Выберите специалиста...'}
                                    </span>
                                )}
                                <ChevronDown className={cn("w-4 h-4 transition-transform text-muted-foreground", isMasterDropdownOpen && "rotate-180")} />
                            </div>

                            {isMasterDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 max-h-48 overflow-y-auto">
                                    {/* Optional: No master */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 p-2 cursor-pointer transition-colors hover:bg-muted",
                                            !selectedMasterId && "bg-primary/10"
                                        )}
                                        onClick={() => {
                                            setSelectedMasterId(null);
                                            setIsMasterDropdownOpen(false);
                                        }}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="text-sm">{t('booking.anyMaster') || 'Любой специалист'}</div>
                                            <div className="text-xs text-muted-foreground">{t('booking.anyMasterDesc') || 'Будет назначен позже'}</div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-border" />

                                    {masters.map(master => {
                                        const masterId = master.tgUserId || master.id;
                                        const isSelected = selectedMasterId === masterId;
                                        return (
                                            <div
                                                key={masterId}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 cursor-pointer transition-colors hover:bg-muted",
                                                    isSelected && "bg-primary/10"
                                                )}
                                                onClick={() => {
                                                    setSelectedMasterId(masterId);
                                                    setIsMasterDropdownOpen(false);
                                                }}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                    {master.avatar ? (
                                                        <img src={master.avatar} alt={master.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-medium">{master.name?.[0]}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm font-medium">{master.name}</div>
                                                {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Client Details */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('booking.yourDetails')}
                    </label>
                    <div className="grid gap-3">
                        <input
                            type="text"
                            placeholder={t('booking.clientName')}
                            className="w-full p-2 border rounded-md"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="tel"
                                placeholder={t('booking.clientPhone')}
                                className="w-full p-2 pl-9 border rounded-md"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {selectedServices.length > 0 && selectedDate && selectedTime && (
                    <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                        <div className="flex justify-between font-medium">
                            <span>{t('common.total')}:</span>
                            <span>{formatDuration(totalDuration, t)} • {formatPrice(totalPrice)} {salonSettings?.currency || '₸'}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {format(selectedDate, 'd MMMM yyyy', { locale: locale() })} {t('common.at')} {selectedTime}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={selectedServices.length === 0 || !selectedDate || !selectedTime || !clientName}
                >
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
};
