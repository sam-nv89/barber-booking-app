import React from 'react';
import { useStore } from '@/store/useStore';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { cn, formatPhoneNumber, formatPrice } from '@/lib/utils';
import { AvatarSelector } from '@/components/features/AvatarSelector';
import { CurrencySelector } from '@/components/features/CurrencySelector';
import { SuccessAnimation } from '@/components/features/SuccessAnimation';
import { WelcomeAnimation } from '@/components/features/WelcomeAnimation';
import { format } from 'date-fns';
import { Trash2, UserX, Plus, Clock, Play, Globe, ChevronDown, Edit, Check } from 'lucide-react';
import { translateToAllLanguages, detectSourceLanguage } from '@/lib/translate';

export const Settings = () => {
    const { t, salonSettings, setSalonSettings, setWorkScheduleOverrides, workScheduleOverrides, clearWorkScheduleOverrides, language, blockedPhones, addBlockedPhone, removeBlockedPhone } = useStore();
    const [formData, setFormData] = React.useState(salonSettings);
    const [isDirty, setIsDirty] = React.useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
    const [isShiftModalOpen, setIsShiftModalOpen] = React.useState(false);
    const [scheduleData, setScheduleData] = React.useState(salonSettings.schedule);
    const [successMessage, setSuccessMessage] = React.useState(null);
    const [pendingMode, setPendingMode] = React.useState(null); // For confirm dialog
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    const [newBlockedPhone, setNewBlockedPhone] = React.useState('');

    // TODO: Address autocomplete - activate when project generates revenue (DaData/Yandex API)

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'phone') {
            value = formatPhoneNumber(value);
        }
        setFormData({ ...formData, [name]: value });
        setIsDirty(true);
    };

    const handleSaveProfile = () => {
        setSalonSettings(formData);
        setIsDirty(false);
        setSuccessMessage(t('settings.profileSaved'));
    };

    const handleSaveSchedule = () => {
        setSalonSettings({ ...salonSettings, schedule: scheduleData });
        setIsScheduleModalOpen(false);
        setSuccessMessage(t('settings.scheduleSaved'));
    };

    const handleModeChange = (newMode) => {
        if (newMode === salonSettings.scheduleMode) return;

        // If switching FROM shift mode and there are overrides, show confirm
        if (salonSettings.scheduleMode === 'shift' && Object.keys(workScheduleOverrides).length > 0) {
            setPendingMode(newMode);
            setIsConfirmModalOpen(true);
        } else {
            // Direct switch
            setSalonSettings({ ...salonSettings, scheduleMode: newMode });
            if (newMode === 'weekly') {
                clearWorkScheduleOverrides();
            }
        }
    };

    const confirmModeChange = () => {
        clearWorkScheduleOverrides();
        setSalonSettings({ ...salonSettings, scheduleMode: pendingMode });
        setIsConfirmModalOpen(false);
        setPendingMode(null);
        setSuccessMessage(t('settings.scheduleSaved'));
    };

    const toggleDayOff = (day) => {
        setScheduleData(prev => {
            const current = prev[day];
            if (current.start && current.end) {
                return { ...prev, [day]: { start: '', end: '', breaks: [] } };
            } else {
                return { ...prev, [day]: { start: '10:00', end: '20:00', breaks: [] } };
            }
        });
    };

    // Add a break to a specific day
    const addBreak = (day) => {
        setScheduleData(prev => {
            const current = prev[day];
            const breaks = current.breaks || [];
            return {
                ...prev,
                [day]: {
                    ...current,
                    breaks: [...breaks, { start: '13:00', end: '14:00' }]
                }
            };
        });
    };

    // Remove a break from a specific day
    const removeBreak = (day, index) => {
        setScheduleData(prev => {
            const current = prev[day];
            const breaks = [...(current.breaks || [])];
            breaks.splice(index, 1);
            return {
                ...prev,
                [day]: { ...current, breaks }
            };
        });
    };

    // Update a break time
    const updateBreak = (day, index, field, value) => {
        setScheduleData(prev => {
            const current = prev[day];
            const breaks = [...(current.breaks || [])];
            breaks[index] = { ...breaks[index], [field]: value };
            return {
                ...prev,
                [day]: { ...current, breaks }
            };
        });
    };

    const formatScheduleDisplay = (schedule) => {
        if (!schedule.start || !schedule.end) return t('settings.dayOff');
        return `${schedule.start} - ${schedule.end} `;
    };

    const timeOptions = Array.from({ length: 13 }, (_, i) => {
        const hour = i + 9; // 09:00 to 21:00
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    const days = DAYS_OF_WEEK;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('settings.profile')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Icon Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.name')}</label>
                        <Input name="name" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.avatar') || 'Аватар сервиса'}</label>
                        <AvatarSelector
                            value={formData.icon || 'scissors'}
                            onChange={(icon) => {
                                setFormData({ ...formData, icon });
                                setIsDirty(true);
                            }}
                            label={t('settings.avatar') || 'Аватар сервиса'}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.address')}</label>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder={language === 'en' ? 'Enter your address...' : language === 'kz' ? 'Мекенжайды енгізіңіз...' : language === 'tr' ? 'Adresinizi girin...' : language === 'es' ? 'Ingrese su dirección...' : 'Введите адрес...'}
                        />
                        {/* Navigation links - show only if address is filled */}
                        {formData.address && (
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-muted-foreground">
                                    {language === 'en' ? 'Build route:' : language === 'kz' ? 'Маршрут құру:' : language === 'tr' ? 'Rota oluştur:' : language === 'es' ? 'Crear ruta:' : 'Построить маршрут:'}
                                </span>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formData.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                                    title="Google Maps"
                                >
                                    <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                                    <span className="hidden sm:inline">Google</span>
                                </a >
                                <a
                                    href={`https://yandex.ru/maps/?rtext=~${encodeURIComponent(formData.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                                    title="Yandex Maps"
                                >
                                    <img src="https://yandex.ru/favicon.ico" alt="" className="w-4 h-4" />
                                    <span className="hidden sm:inline">Yandex</span>
                                </a>
                                <a
                                    href={`https://2gis.ru/search/${encodeURIComponent(formData.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                                    title="2GIS"
                                >
                                    <img src="https://2gis.ru/favicon.ico" alt="" className="w-4 h-4" />
                                    <span className="hidden sm:inline">2GIS</span>
                                </a>
                            </div >
                        )}
                    </div >

                    {/* Currency Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.currency')}</label>
                        <CurrencySelector
                            value={formData.currency || '₸'}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Check-in Mode Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.checkinMode') || 'Режим Check-in'}</label>
                        <p className="text-xs text-muted-foreground">
                            {t('settings.checkinModeDesc') || 'Выберите, кто инициирует регистрацию прихода'}
                        </p>
                        <div className="relative group">
                            <select
                                name="checkinMode"
                                value={formData.checkinMode || 'master_scans'}
                                onChange={handleChange}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                            >
                                <option value="master_scans">{t('settings.masterScansClient') || 'Мастер сканирует клиента'}</option>
                                <option value="client_scans">{t('settings.clientScansMaster') || 'Клиент сканирует мастера'}</option>
                                <option value="both">{t('settings.bothModes') || 'Оба варианта'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.phone')}</label>
                        <PhoneInput
                            value={formData.phone || ''}
                            onChange={(phone) => {
                                setFormData({ ...formData, phone });
                                setIsDirty(true);
                            }}
                        />
                    </div>
                    {
                        isDirty && (
                            <Button className="w-full" onClick={handleSaveProfile}>
                                {t('common.save')}
                            </Button>
                        )
                    }
                </CardContent >
            </Card >

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('settings.schedule')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Mode Switcher */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.scheduleMode')}</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scheduleMode"
                                    checked={salonSettings.scheduleMode === 'weekly'}
                                    onChange={() => handleModeChange('weekly')}
                                    className="w-4 h-4 accent-primary"
                                />
                                <span className={cn(salonSettings.scheduleMode === 'weekly' && 'font-medium')}>
                                    {t('settings.weeklyMode')}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scheduleMode"
                                    checked={salonSettings.scheduleMode === 'shift'}
                                    onChange={() => handleModeChange('shift')}
                                    className="w-4 h-4 accent-primary"
                                />
                                <span className={cn(salonSettings.scheduleMode === 'shift' && 'font-medium')}>
                                    {t('settings.shiftMode')}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Weekly Mode Content */}
                    {salonSettings.scheduleMode === 'weekly' && (
                        <>
                            {days.map(day => (
                                <div key={day.key} className="flex justify-between items-center">
                                    <span className={cn(!salonSettings.schedule[day.key].start && "text-destructive")}>{t(`days.${day.key}`)}</span>
                                    <span className={cn("text-muted-foreground", (!salonSettings.schedule[day.key].start) && "text-destructive")}>
                                        {formatScheduleDisplay(salonSettings.schedule[day.key])}
                                    </span>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full mt-4" onClick={() => setIsScheduleModalOpen(true)}>
                                {t('settings.editSchedule')}
                            </Button>

                            {/* Booking Period */}
                            <div className="space-y-2 mt-4 pt-4 border-t">
                                <label className="text-sm font-medium">{t('settings.bookingPeriod')}</label>
                                <p className="text-xs text-muted-foreground">{t('settings.bookingPeriodDesc')}</p>
                                <div className="relative group">
                                    <select
                                        value={salonSettings.bookingPeriodMonths || 1}
                                        onChange={(e) => setSalonSettings({ ...salonSettings, bookingPeriodMonths: parseInt(e.target.value) })}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    >
                                        <option value={1}>1 {t('common.month')}</option>
                                        <option value={3}>3 {t('common.months')}</option>
                                        <option value={6}>6 {t('common.months')}</option>
                                        <option value={12}>12 {t('common.months')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors pointer-events-none" />
                                </div>
                            </div>

                            {/* Buffer Time */}
                            <div className="space-y-3 mt-4 pt-4 border-t">
                                <label className="text-sm font-medium">{t('settings.bufferTime')}</label>
                                <p className="text-xs text-muted-foreground">{t('settings.bufferTimeDesc')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 5, 10, 15, 30].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setSalonSettings({ ...salonSettings, bufferTime: val })}
                                            className={cn(
                                                "min-w-[52px] px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                                salonSettings.bufferTime === val
                                                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                                                    : "border-border bg-card hover:bg-muted text-foreground"
                                            )}
                                        >
                                            {val} {t('common.min')}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">{t('settings.customValue')}:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={salonSettings.bufferTime || 0}
                                        onChange={(e) => setSalonSettings({ ...salonSettings, bufferTime: parseInt(e.target.value) || 0 })}
                                        className="w-20 h-9 text-center font-medium"
                                    />
                                    <span className="text-sm text-muted-foreground">{t('common.min')}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Shift Mode Content */}
                    {salonSettings.scheduleMode === 'shift' && (
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{t('settings.currentPattern')}</span>
                                    <span className="font-medium">
                                        {salonSettings.shiftPattern?.workDays || 2} {t('settings.workingDays')} / {salonSettings.shiftPattern?.offDays || 2} {t('settings.daysOff')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-muted-foreground">{t('settings.workHours')}</span>
                                    <span className="font-medium">
                                        {salonSettings.shiftPattern?.workHours?.start || '10:00'} - {salonSettings.shiftPattern?.workHours?.end || '20:00'}
                                    </span>
                                </div>
                            </div>
                            <Button variant="secondary" className="w-full" onClick={() => setIsShiftModalOpen(true)}>
                                {t('settings.shiftGenerator')}
                            </Button>

                            {/* Buffer Time */}
                            <div className="space-y-3 mt-4 pt-4 border-t">
                                <label className="text-sm font-medium">{t('settings.bufferTime')}</label>
                                <p className="text-xs text-muted-foreground">{t('settings.bufferTimeDesc')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 5, 10, 15, 30].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setSalonSettings({ ...salonSettings, bufferTime: val })}
                                            className={cn(
                                                "min-w-[52px] px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                                salonSettings.bufferTime === val
                                                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                                                    : "border-border bg-card hover:bg-muted text-foreground"
                                            )}
                                        >
                                            {val} {t('common.min')}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">{t('settings.customValue')}:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={salonSettings.bufferTime || 0}
                                        onChange={(e) => setSalonSettings({ ...salonSettings, bufferTime: parseInt(e.target.value) || 0 })}
                                        className="w-20 h-9 text-center font-medium"
                                    />
                                    <span className="text-sm text-muted-foreground">{t('common.min')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Show calendar only in shift mode */}
            {salonSettings.scheduleMode === 'shift' && <GeneratedScheduleCalendar />}

            {/* Blocklist Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserX className="w-5 h-5" />
                        {t('settings.blocklist')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <PhoneInput
                                value={newBlockedPhone}
                                onChange={setNewBlockedPhone}
                                placeholder={t('settings.enterPhone')}
                            />
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (newBlockedPhone.replace(/\D/g, '').length >= 10) {
                                    addBlockedPhone(newBlockedPhone);
                                    setNewBlockedPhone('');
                                    setSuccessMessage(t('settings.addedToBlocklist'));
                                }
                            }}
                        >
                            {t('common.add')}
                        </Button>
                    </div>

                    {blockedPhones.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('settings.blocklistEmpty')}</p>
                    ) : (
                        <div className="space-y-2">
                            {blockedPhones.map((phone, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-destructive/10 border border-destructive/20">
                                    <span className="text-sm font-medium">{phone}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                                        onClick={() => removeBlockedPhone(phone)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Animation Preview */}
            <AnimationPreviewCard />

            <TeamManager onSuccess={setSuccessMessage} />
            <ServicesManager onSuccess={setSuccessMessage} />
            <MarketingManager onSuccess={setSuccessMessage} />

            <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title={t('settings.editSchedule')}>
                <div className="space-y-6">
                    <datalist id="time-options">
                        {timeOptions.map(time => <option key={time} value={time} />)}
                    </datalist>

                    {days.map(day => (
                        <div key={day.key} className="space-y-2 pb-4 border-b last:border-0">
                            <div className="flex justify-between items-center">
                                <label className="font-medium">{t(`days.${day.key}`)}</label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("text-xs h-6", (!scheduleData[day.key].start) ? "text-destructive" : "text-muted-foreground")}
                                    onClick={() => toggleDayOff(day.key)}
                                >
                                    {(!scheduleData[day.key].start) ? t('settings.makeWork') : t('settings.makeDayOff')}
                                </Button>
                            </div>

                            {(!scheduleData[day.key].start) ? (
                                <div className="p-2 bg-muted rounded-md text-center text-sm text-muted-foreground">
                                    {t('settings.dayOff')}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Work hours */}
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="time"
                                            list="time-options"
                                            value={scheduleData[day.key].start}
                                            onChange={(e) => setScheduleData({ ...scheduleData, [day.key]: { ...scheduleData[day.key], start: e.target.value } })}
                                        />
                                        <span>-</span>
                                        <Input
                                            type="time"
                                            list="time-options"
                                            value={scheduleData[day.key].end}
                                            onChange={(e) => setScheduleData({ ...scheduleData, [day.key]: { ...scheduleData[day.key], end: e.target.value } })}
                                        />
                                    </div>

                                    {/* Breaks */}
                                    {(scheduleData[day.key].breaks || []).length > 0 && (
                                        <div className="space-y-2 pl-2 border-l-2 border-muted">
                                            {scheduleData[day.key].breaks.map((brk, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    <Input
                                                        type="time"
                                                        className="w-24"
                                                        value={brk.start}
                                                        onChange={(e) => updateBreak(day.key, idx, 'start', e.target.value)}
                                                    />
                                                    <span className="text-sm">-</span>
                                                    <Input
                                                        type="time"
                                                        className="w-24"
                                                        value={brk.end}
                                                        onChange={(e) => updateBreak(day.key, idx, 'end', e.target.value)}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive"
                                                        onClick={() => removeBreak(day.key, idx)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add break button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs gap-1"
                                        onClick={() => addBreak(day.key)}
                                    >
                                        <Plus className="w-3 h-3" />
                                        {t('settings.addBreak')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}

                    <Button className="w-full" onClick={handleSaveSchedule}>
                        {t('common.save')}
                    </Button>
                </div>
            </Modal>

            <ShiftGeneratorModal
                isOpen={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
                onSave={(overrides, pattern) => {
                    // Save both overrides and the pattern settings
                    setWorkScheduleOverrides(overrides);
                    if (pattern) {
                        setSalonSettings({
                            ...salonSettings,
                            scheduleMode: 'shift',
                            shiftPattern: pattern
                        });
                    }
                    setSuccessMessage(t('settings.scheduleSaved'));
                    setIsShiftModalOpen(false);
                }}
            />

            {/* Confirm Mode Change Dialog */}
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={t('settings.confirmModeChange')}>
                <div className="space-y-4">
                    <p className="text-muted-foreground">{t('settings.confirmModeChangeMessage')}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsConfirmModalOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={confirmModeChange}>
                            {t('common.confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {
                successMessage && (
                    <SuccessAnimation
                        onComplete={() => setSuccessMessage(null)}
                        title={t('common.success')}
                        message={successMessage}
                        buttonText={t('common.great')}
                    />
                )
            }
        </div >
    );
};

// Shift Generator Modal with period selection and work hours
const ShiftGeneratorModal = ({ isOpen, onClose, onSave }) => {
    const { t, salonSettings } = useStore();
    const [workDays, setWorkDays] = React.useState(salonSettings.shiftPattern?.workDays || 2);
    const [offDays, setOffDays] = React.useState(salonSettings.shiftPattern?.offDays || 2);
    const [workStart, setWorkStart] = React.useState(salonSettings.shiftPattern?.workHours?.start || '10:00');
    const [workEnd, setWorkEnd] = React.useState(salonSettings.shiftPattern?.workHours?.end || '20:00');
    const [breaks, setBreaks] = React.useState(salonSettings.shiftPattern?.breaks || []);
    const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
    const [periodMonths, setPeriodMonths] = React.useState(3);

    // Break management
    const addBreak = () => setBreaks(prev => [...prev, { start: '13:00', end: '14:00' }]);
    const removeBreak = (index) => setBreaks(prev => prev.filter((_, i) => i !== index));
    const updateBreak = (index, field, value) => {
        setBreaks(prev => prev.map((brk, i) => i === index ? { ...brk, [field]: value } : brk));
    };

    const handleGenerate = () => {
        const overrides = {};
        const start = new Date(startDate);
        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + periodMonths);

        let dayCounter = 0;
        const cycleLength = workDays + offDays;

        for (let d = new Date(start); d < endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const positionInCycle = dayCounter % cycleLength;
            const isWorking = positionInCycle < workDays;

            overrides[dateStr] = {
                isWorking,
                start: isWorking ? workStart : '',
                end: isWorking ? workEnd : '',
                breaks: isWorking ? breaks : []
            };
            dayCounter++;
        }

        // Pass both overrides and pattern
        const pattern = {
            workDays,
            offDays,
            workHours: { start: workStart, end: workEnd },
            breaks: breaks
        };
        onSave(overrides, pattern);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('settings.shiftGenerator')}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.shiftPattern')}</label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            max="7"
                            value={workDays}
                            onChange={(e) => setWorkDays(parseInt(e.target.value) || 1)}
                            className="w-20"
                        />
                        <span className="text-muted-foreground">{t('settings.workingDays')}</span>
                        <span>/</span>
                        <Input
                            type="number"
                            min="1"
                            max="7"
                            value={offDays}
                            onChange={(e) => setOffDays(parseInt(e.target.value) || 1)}
                            className="w-20"
                        />
                        <span className="text-muted-foreground">{t('settings.daysOff')}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.workHours')}</label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="time"
                            value={workStart}
                            onChange={(e) => setWorkStart(e.target.value)}
                        />
                        <span>-</span>
                        <Input
                            type="time"
                            value={workEnd}
                            onChange={(e) => setWorkEnd(e.target.value)}
                        />
                    </div>
                </div>

                {/* Breaks section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.breaks')}</label>
                    {breaks.length > 0 && (
                        <div className="space-y-2 pl-2 border-l-2 border-muted">
                            {breaks.map((brk, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        type="time"
                                        className="w-24"
                                        value={brk.start}
                                        onChange={(e) => updateBreak(idx, 'start', e.target.value)}
                                    />
                                    <span className="text-sm">-</span>
                                    <Input
                                        type="time"
                                        className="w-24"
                                        value={brk.end}
                                        onChange={(e) => updateBreak(idx, 'end', e.target.value)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive"
                                        onClick={() => removeBreak(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={addBreak}
                    >
                        <Plus className="w-3 h-3" />
                        {t('settings.addBreak')}
                    </Button>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.startDate')}</label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.generationPeriod')}</label>
                    <div className="relative group">
                        <select
                            value={periodMonths}
                            onChange={(e) => setPeriodMonths(parseInt(e.target.value))}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                            <option value={1}>1 {t('common.month')}</option>
                            <option value={3}>3 {t('common.months')}</option>
                            <option value={6}>6 {t('common.months')}</option>
                            <option value={12}>12 {t('common.months')}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors pointer-events-none" />
                    </div>
                </div>

                <Button className="w-full" onClick={handleGenerate}>
                    {t('settings.generate')}
                </Button>
            </div>
        </Modal>
    );
};

// Visual calendar for generated schedule
const GeneratedScheduleCalendar = () => {
    const { t, workScheduleOverrides, clearWorkScheduleOverrides, language } = useStore();

    if (!workScheduleOverrides || Object.keys(workScheduleOverrides).length === 0) {
        return null;
    }

    const dates = Object.keys(workScheduleOverrides).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Group by months
    const monthGroups = {};
    dates.forEach(date => {
        const monthKey = date.substring(0, 7); // yyyy-MM
        if (!monthGroups[monthKey]) {
            monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(date);
    });

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t('settings.generatedSchedule')}</CardTitle>
                <Button size="sm" variant="outline" onClick={clearWorkScheduleOverrides}>
                    {t('settings.clearSchedule')}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {t('common.from')} {new Date(startDate).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')} {t('common.to')} {new Date(endDate).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}
                </p>

                {Object.keys(monthGroups).map(monthKey => (
                    <div key={monthKey} className="space-y-2">
                        <h4 className="font-medium capitalize">{formatMonthLabel(monthKey)}</h4>
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground font-medium">
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                                <div key={day} className="p-1">{day}</div>
                            ))}
                        </div>
                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {/* Empty cells for offset to align with weekday */}
                            {(() => {
                                const firstDate = new Date(monthGroups[monthKey][0]);
                                const dayOfWeek = firstDate.getDay();
                                const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
                                return Array.from({ length: offset }, (_, i) => (
                                    <div key={`offset-${i}`} className="p-2"></div>
                                ));
                            })()}
                            {monthGroups[monthKey].map(date => {
                                const override = workScheduleOverrides[date];
                                const day = new Date(date).getDate();
                                return (
                                    <div
                                        key={date}
                                        className={cn(
                                            "p-2 rounded-md text-xs font-bold",
                                            override.isWorking
                                                ? "bg-primary/20 text-primary"
                                                : "bg-destructive/20 text-destructive"
                                        )}
                                        title={override.isWorking ? `${override.start} - ${override.end}` : t('settings.dayOff')}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const MarketingManager = ({ onSuccess }) => {
    const { campaigns, addCampaign, deleteCampaign, services, t, language } = useStore();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        type: 'discount',
        value: '',
        startDate: '',
        endDate: '',
        serviceIds: []
    });

    const getServiceName = (service) => {
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleSave = () => {
        if (!formData.name || !formData.value || !formData.startDate || !formData.endDate) return;

        addCampaign(formData);
        onSuccess(t('marketing.campaignCreated'));
        setIsModalOpen(false);
        setFormData({
            name: '',
            type: 'discount',
            value: '',
            startDate: '',
            endDate: '',
            serviceIds: []
        });
    };

    const handleDelete = (id) => {
        if (confirm(t('marketing.deleteConfirm'))) {
            deleteCampaign(id);
            onSuccess(t('marketing.campaignDeleted'));
        }
    };

    const toggleService = (serviceId) => {
        setFormData(prev => {
            const ids = prev.serviceIds || [];
            if (ids.includes(serviceId)) {
                return { ...prev, serviceIds: ids.filter(id => id !== serviceId) };
            } else {
                return { ...prev, serviceIds: [...ids, serviceId] };
            }
        });
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{t('settings.marketing')}</CardTitle>
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>{t('marketing.createCampaign')}</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="flex justify-between items-center p-3 bg-muted rounded-lg border">
                            <div>
                                <div className="font-medium">{campaign.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {campaign.type === 'discount' ? `${t('marketing.discount').split('(')[0]} ${campaign.value}%` : `${t('marketing.fixed').split('(')[0]} ${campaign.value} ₸`} • {campaign.startDate} - {campaign.endDate}
                                </div>
                                {campaign.serviceIds && campaign.serviceIds.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Для {campaign.serviceIds.length} услуг(и)
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(campaign.id)}>
                                🗑️
                            </Button>
                        </div>
                    ))}
                    {campaigns.length === 0 && <div className="text-center text-muted-foreground py-4">{t('marketing.empty')}</div>}
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('marketing.createCampaign')}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('marketing.name')}</label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Например: Скидка выходного дня"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('marketing.type')}</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="discount">{t('marketing.discount')}</option>
                                <option value="fixed">{t('marketing.fixed')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('marketing.value')}</label>
                            <Input
                                type="number"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                placeholder={formData.type === 'discount' ? "20" : "5000"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('marketing.selectServices')}</label>
                        <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-background">
                            {services && services.length > 0 ? services.map(service => (
                                <label key={service.id} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                        checked={formData.serviceIds.includes(service.id)}
                                        onChange={() => toggleService(service.id)}
                                    />
                                    <span className="text-sm flex-1">{getServiceName(service)}</span>
                                    <span className="text-xs text-muted-foreground">{formatPrice(service.price)} ₸</span>
                                </label>
                            )) : <div className="text-sm text-muted-foreground text-center">{t('marketing.noServices')}</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('marketing.start')}</label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('marketing.end')}</label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleSave}>{t('common.create')}</Button>
                </div>
            </Modal>
        </>
    );
};

// Team Management Component for multi-master salons
const TeamManager = ({ onSuccess }) => {
    const {
        t,
        salons,
        userSalons,
        activeSalonId,
        user,
        generateInviteLink,
        invitations,
        getActiveRole,
        getMasters,
        terminateMaster,
        addMasterToSalon,
        addNotification,
        language,
        updateMasterInSalon
    } = useStore();

    const [showInviteModal, setShowInviteModal] = React.useState(false);
    const [copiedLink, setCopiedLink] = React.useState(false);
    const [editingMember, setEditingMember] = React.useState(null);
    const [editFormData, setEditFormData] = React.useState({ name: '', phone: '', role: 'employee', level: 'master' });
    const [memberToDelete, setMemberToDelete] = React.useState(null);
    const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);
    const [levelDropdownOpen, setLevelDropdownOpen] = React.useState(false);
    const roleDropdownRef = React.useRef(null);
    const levelDropdownRef = React.useRef(null);

    // Click outside handler for dropdowns
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
                setRoleDropdownOpen(false);
            }
            if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target)) {
                setLevelDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get current salon and role
    const activeSalon = salons?.find(s => s.id === activeSalonId);
    const activeRole = getActiveRole?.() || 'owner'; // Default to owner for solo masters
    const masters = getMasters?.(activeSalonId) || [];

    // Check if user can manage team (owner or admin)
    const canManageTeam = activeRole === 'owner' || activeRole === 'admin';

    // Get current invite link for this salon
    const currentInvite = invitations?.find(inv => inv.salonId === activeSalonId && new Date(inv.expiresAt) > new Date());

    // Translations for TeamManager
    const tr = {
        team: { ru: 'Команда', en: 'Team', kz: 'Команда', tr: 'Ekip', es: 'Equipo' },
        invite: { ru: 'Пригласить', en: 'Invite', kz: 'Шақыру', tr: 'Davet Et', es: 'Invitar' },
        teamMembers: { ru: 'Участники команды', en: 'Team Members', kz: 'Команда мүшелері', tr: 'Ekip Üyeleri', es: 'Miembros del equipo' },
        onlyMember: { ru: 'Вы единственный участник', en: 'You are the only team member', kz: 'Сіз жалғыз қатысушысыз', tr: 'Tek ekip üyesi sizsiniz', es: 'Eres el único miembro' },
        inviteMasters: { ru: 'Пригласите мастеров в команду', en: 'Invite masters to grow your team', kz: 'Шеберлерді командаға шақырыңыз', tr: 'Ekibinizi büyütmek için ustalar davet edin', es: 'Invita maestros para hacer crecer tu equipo' },
        expires: { ru: 'До', en: 'Expires', kz: 'Дейін', tr: 'Bitiş', es: 'Expira' },
        inviteMaster: { ru: 'Пригласить мастера', en: 'Invite Master', kz: 'Шеберді шақыру', tr: 'Usta Davet Et', es: 'Invitar Maestro' },
        inviteDesc: { ru: 'Отправьте эту ссылку мастеру. Он увидит информацию о салоне и сможет принять приглашение.', en: 'Share this link with a master. They will see salon info and can accept the invitation.', kz: 'Бұл сілтемені шеберге жіберіңіз. Ол салон туралы ақпаратты көріп, шақыруды қабылдай алады.', tr: 'Bu bağlantıyı bir usta ile paylaşın. Salon bilgilerini görecek ve daveti kabul edebilecek.', es: 'Comparte este enlace con un maestro. Verá la información del salón y podrá aceptar la invitación.' },
        copyLink: { ru: 'Копировать ссылку', en: 'Copy Link', kz: 'Сілтемені көшіру', tr: 'Bağlantıyı Kopyala', es: 'Copiar enlace' },
        copied: { ru: 'Скопировано!', en: 'Copied!', kz: 'Көшірілді!', tr: 'Kopyalandı!', es: '¡Copiado!' },
        linkExpires: { ru: 'Ссылка действует 7 дней', en: 'Link expires in 7 days', kz: 'Сілтеме 7 күн жарамды', tr: 'Bağlantı 7 gün geçerli', es: 'El enlace expira en 7 días' },
        generateLink: { ru: 'Сгенерировать ссылку', en: 'Generate Invite Link', kz: 'Сілтеме жасау', tr: 'Davet Bağlantısı Oluştur', es: 'Generar enlace' },
        terminateTitle: { ru: 'Увольнение мастера', en: 'Terminate Master', kz: 'Шеберді жұмыстан шығару', tr: 'Ustayı İşten Çıkar', es: 'Despedir maestro' },
        terminateConfirm: { ru: 'Вы уверены, что хотите уволить этого мастера?', en: 'Are you sure you want to terminate this master?', kz: 'Бұл шеберді жұмыстан шығарғыңыз келетініне сенімдісіз бе?', tr: 'Bu ustayı işten çıkarmak istediğinizden emin misiniz?', es: '¿Está seguro de que desea despedir a este maestro?' },
        terminateWarning: { ru: 'Мастер сохранит доступ к истории в течение 30 дней.', en: 'Master will retain access to history for 30 days.', kz: 'Шебер 30 күн ішінде тарихқа қол жеткізе алады.', tr: 'Usta 30 gün boyunca geçmişe erişimini koruyacak.', es: 'El maestro conservará acceso al historial durante 30 días.' },
        terminated: { ru: 'Мастер уволен', en: 'Master terminated', kz: 'Шебер жұмыстан шығарылды', tr: 'Usta işten çıkarıldı', es: 'Maestro despedido' },
        terminatedStatus: { ru: 'Уволен', en: 'Terminated', kz: 'Шығарылды', tr: 'İşten çıkarıldı', es: 'Despedido' },
        addTestMaster: { ru: 'Добавить тестового мастера', en: 'Add Test Master', kz: 'Тест шеберін қосу', tr: 'Test Ustası Ekle', es: 'Añadir maestro de prueba' },
        editMember: { ru: 'Редактировать', en: 'Edit', kz: 'Өңдеу', tr: 'Düzenle', es: 'Editar' },
        deleteMember: { ru: 'Уволить', en: 'Terminate', kz: 'Жұмыстан шығару', tr: 'İşten çıkar', es: 'Despedir' },
        editMemberTitle: { ru: 'Редактирование участника', en: 'Edit Team Member', kz: 'Қатысушыны өңдеу', tr: 'Ekip Üyesini Düzenle', es: 'Editar miembro' },
        name: { ru: 'Имя', en: 'Name', kz: 'Аты', tr: 'İsim', es: 'Nombre' },
        phone: { ru: 'Телефон', en: 'Phone', kz: 'Телефон', tr: 'Telefon', es: 'Teléfono' },
        role: { ru: 'Роль', en: 'Role', kz: 'Рөлі', tr: 'Rol', es: 'Rol' },
        level: { ru: 'Уровень', en: 'Level', kz: 'Деңгей', tr: 'Seviye', es: 'Nivel' },
        save: { ru: 'Сохранить', en: 'Save', kz: 'Сақтау', tr: 'Kaydet', es: 'Guardar' },
        cancel: { ru: 'Отмена', en: 'Cancel', kz: 'Болдырмау', tr: 'İptal', es: 'Cancelar' },
        confirm: { ru: 'Подтвердить', en: 'Confirm', kz: 'Растау', tr: 'Onayla', es: 'Confirmar' },
        memberUpdated: { ru: 'Данные обновлены', en: 'Member updated', kz: 'Деректер жаңартылды', tr: 'Üye güncellendi', es: 'Miembro actualizado' }
    };

    const lang = language || 'ru';
    const getText = (key) => tr[key]?.[lang] || tr[key]?.ru || key;

    // Generate or get invite link
    const handleGenerateInvite = () => {
        if (!currentInvite) {
            generateInviteLink?.(activeSalonId);
        }
        setShowInviteModal(true);
    };

    // Copy invite link
    const handleCopyLink = async () => {
        const invite = invitations?.find(inv => inv.salonId === activeSalonId);
        const link = `${window.location.origin}/#/invite/${invite?.token}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Add test master function
    const handleAddTestMaster = () => {
        const testNames = ['Алексей', 'Мария', 'Дмитрий', 'Анна', 'Сергей', 'Елена', 'Максим', 'Ольга'];
        const testLevels = ['apprentice', 'master', 'senior', 'top'];
        const testRoles = ['employee', 'admin'];

        const testMaster = {
            tgUserId: `test_${Date.now()}`,
            name: testNames[Math.floor(Math.random() * testNames.length)],
            phone: '+7 7' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0'),
            avatar: null,
            role: testRoles[Math.floor(Math.random() * testRoles.length)],
            level: testLevels[Math.floor(Math.random() * testLevels.length)],
            compensation: { model: 'percent', value: 50 + Math.floor(Math.random() * 20) }
        };

        addMasterToSalon?.(activeSalonId, testMaster);
        onSuccess?.(lang === 'en' ? 'Test master added' : 'Тестовый мастер добавлен');
    };

    // Handle edit member
    const handleEditMember = (member) => {
        setEditingMember(member);
        setEditFormData({
            name: member.name || '',
            phone: member.phone || '',
            role: member.role || 'employee',
            level: member.level || 'master'
        });
    };

    // Save edited member
    const handleSaveEdit = () => {
        if (editingMember && updateMasterInSalon) {
            updateMasterInSalon(activeSalonId, editingMember.tgUserId, editFormData);
            onSuccess?.(getText('memberUpdated'));
            setEditingMember(null);
        }
    };

    // Confirm terminate
    const handleConfirmTerminate = () => {
        if (memberToDelete && terminateMaster) {
            terminateMaster(activeSalonId, memberToDelete.tgUserId);
            onSuccess?.(getText('terminated'));
            setMemberToDelete(null);
        }
    };

    // Level options with descriptions
    const levelOptions = [
        {
            value: 'apprentice',
            label: { ru: 'Ученик', en: 'Apprentice', kz: 'Шәкірт', es: 'Aprendiz', tr: 'Çırak' },
            desc: { ru: 'Начинающий, базовые цены', en: 'Beginner, basic prices', kz: 'Бастаушы, негізгі бағалар', tr: 'Başlangıç, temel fiyatlar', es: 'Principiante, precios básicos' },
            emoji: '🌱'
        },
        {
            value: 'master',
            label: { ru: 'Мастер', en: 'Master', kz: 'Шебер', es: 'Maestro', tr: 'Usta' },
            desc: { ru: 'Опытный, стандартные цены', en: 'Experienced, standard prices', kz: 'Тәжірибелі, стандартты бағалар', tr: 'Tecrübeli, standart fiyatlar', es: 'Experimentado, precios estándar' },
            emoji: '✂️'
        },
        {
            value: 'senior',
            label: { ru: 'Старший', en: 'Senior', kz: 'Аға шебер', es: 'Senior', tr: 'Kıdemli' },
            desc: { ru: 'Высокий приоритет в списке', en: 'High priority in list', kz: 'Тізімде жоғары басымдық', tr: 'Listede yüksek öncelik', es: 'Alta prioridad en lista' },
            emoji: '⭐'
        },
        {
            value: 'top',
            label: { ru: 'Топ', en: 'Top', kz: 'Топ', es: 'Top', tr: 'Top' },
            desc: { ru: 'VIP-мастер, премиум цены', en: 'VIP master, premium prices', kz: 'VIP-шебер, премиум бағалар', tr: 'VIP usta, premium fiyatlar', es: 'Maestro VIP, precios premium' },
            emoji: '👑'
        }
    ];

    // Role options with descriptions  
    const roleOptions = [
        {
            value: 'employee',
            label: { ru: 'Специалист', en: 'Specialist', kz: 'Маман', tr: 'Uzman', es: 'Especialista' },
            desc: { ru: 'Видит только своих клиентов и записи', en: 'Sees only own clients and bookings', kz: 'Тек өз клиенттерін және жазбаларын көреді', tr: 'Sadece kendi müşterilerini görür', es: 'Ve solo sus clientes y citas' },
            color: 'bg-green-500',
            emoji: '👤'
        },
        {
            value: 'admin',
            label: { ru: 'Админ', en: 'Admin', kz: 'Әкімші', tr: 'Yönetici', es: 'Admin' },
            desc: { ru: 'Управляет командой, видит все записи', en: 'Manages team, sees all bookings', kz: 'Команданы басқарады, барлық жазбаларды көреді', tr: 'Ekibi yönetir, tüm randevuları görür', es: 'Gestiona equipo, ve todas las citas' },
            color: 'bg-blue-500',
            emoji: '🛡️'
        }
    ];

    // Legacy labels for display
    const levelLabels = Object.fromEntries(levelOptions.map(o => [o.value, o.label]));
    const roleBadges = {
        owner: { label: { ru: 'Владелец', en: 'Owner', kz: 'Иесі', tr: 'Sahip', es: 'Propietario' }, color: 'bg-amber-500' },
        ...Object.fromEntries(roleOptions.map(o => [o.value, { label: o.label, color: o.color }]))
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>👥 {getText('team')}</span>
                    {canManageTeam && (
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={handleAddTestMaster} title={getText('addTestMaster')}>
                                +🧪
                            </Button>
                            <Button size="sm" onClick={handleGenerateInvite}>
                                <Plus className="w-4 h-4 mr-1" />
                                {getText('invite')}
                            </Button>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Salon Info */}
                {activeSalon && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                🏠
                            </div>
                            <div>
                                <div className="font-medium">{activeSalon.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {activeSalon.subscription?.plan === 'trial'
                                        ? `Trial • ${getText('expires')}: ${new Date(activeSalon.subscription.expiresAt).toLocaleDateString()}`
                                        : activeSalon.subscription?.plan || 'Solo'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Masters List */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        {getText('teamMembers')} ({masters.length})
                    </div>

                    {masters.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <div className="text-3xl mb-2">👤</div>
                            <p>{getText('onlyMember')}</p>
                            <p className="text-xs mt-1">{getText('inviteMasters')}</p>
                        </div>
                    ) : (
                        masters.map((member, index) => (
                            <div key={member.tgUserId || index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-lg">👤</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {member.name || 'Мастер'}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${roleBadges[member.role]?.color || 'bg-gray-500'}`}>
                                                {roleBadges[member.role]?.label?.[lang] || member.role}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {levelLabels[member.level]?.[lang] || member.level}
                                            {member.status === 'terminated' && (
                                                <span className="text-destructive ml-2">• {getText('terminatedStatus')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {canManageTeam && member.role !== 'owner' && member.status !== 'terminated' && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleEditMember(member)}
                                            title={getText('editMember')}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setMemberToDelete(member)}
                                            title={getText('deleteMember')}
                                        >
                                            <UserX className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            {/* Invite Modal */}
            <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title={getText('inviteMaster')}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {getText('inviteDesc')}
                    </p>

                    {currentInvite || invitations?.find(inv => inv.salonId === activeSalonId) ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg text-sm break-all font-mono">
                                {`${window.location.origin}/#/invite/${(currentInvite || invitations?.find(inv => inv.salonId === activeSalonId))?.token}`}
                            </div>

                            <Button className="w-full" onClick={handleCopyLink}>
                                {copiedLink ? `✓ ${getText('copied')}` : getText('copyLink')}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                {getText('linkExpires')}
                            </p>
                        </div>
                    ) : (
                        <Button className="w-full" onClick={() => generateInviteLink?.(activeSalonId)}>
                            {getText('generateLink')}
                        </Button>
                    )}
                </div>
            </Modal>

            {/* Edit Member Modal */}
            <Modal isOpen={!!editingMember} onClose={() => setEditingMember(null)} title={getText('editMemberTitle')}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{getText('name')}</label>
                        <Input
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={getText('name')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{getText('phone')}</label>
                        <PhoneInput
                            value={editFormData.phone}
                            onChange={(value) => setEditFormData(prev => ({ ...prev, phone: value }))}
                        />
                    </div>

                    {/* Role Dropdown */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{getText('role')}</label>
                        <div className="relative" ref={roleDropdownRef}>
                            <div
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/5 transition-colors group"
                                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{roleOptions.find(r => r.value === editFormData.role)?.emoji}</span>
                                    <span className="font-medium">{roleOptions.find(r => r.value === editFormData.role)?.label?.[lang] || editFormData.role}</span>
                                </div>
                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-all", roleDropdownOpen && "rotate-180")} />
                            </div>

                            {roleDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md outline-none animate-in fade-in-0 zoom-in-95 overflow-hidden">
                                    <div className="p-1">
                                        {roleOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={cn(
                                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                                    editFormData.role === option.value && "bg-accent/50"
                                                )}
                                                onClick={() => {
                                                    setEditFormData(prev => ({ ...prev, role: option.value }));
                                                    setRoleDropdownOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-lg">{option.emoji}</span>
                                                    <div>
                                                        <div className="font-medium">{option.label?.[lang]}</div>
                                                        <div className="text-xs text-muted-foreground">{option.desc?.[lang]}</div>
                                                    </div>
                                                </div>
                                                {editFormData.role === option.value && (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level Dropdown */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{getText('level')}</label>
                        <div className="relative" ref={levelDropdownRef}>
                            <div
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/5 transition-colors group"
                                onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{levelOptions.find(l => l.value === editFormData.level)?.emoji}</span>
                                    <span className="font-medium">{levelOptions.find(l => l.value === editFormData.level)?.label?.[lang] || editFormData.level}</span>
                                </div>
                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-all", levelDropdownOpen && "rotate-180")} />
                            </div>

                            {levelDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md outline-none animate-in fade-in-0 zoom-in-95 overflow-hidden">
                                    <div className="p-1">
                                        {levelOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={cn(
                                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                                    editFormData.level === option.value && "bg-accent/50"
                                                )}
                                                onClick={() => {
                                                    setEditFormData(prev => ({ ...prev, level: option.value }));
                                                    setLevelDropdownOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-lg">{option.emoji}</span>
                                                    <div>
                                                        <div className="font-medium">{option.label?.[lang]}</div>
                                                        <div className="text-xs text-muted-foreground">{option.desc?.[lang]}</div>
                                                    </div>
                                                </div>
                                                {editFormData.level === option.value && (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingMember(null)}>
                            {getText('cancel')}
                        </Button>
                        <Button className="flex-1" onClick={handleSaveEdit}>
                            {getText('save')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirm Terminate Modal */}
            <Modal isOpen={!!memberToDelete} onClose={() => setMemberToDelete(null)} title={getText('terminateTitle')}>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                            <UserX className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <div className="font-medium">{memberToDelete?.name || 'Мастер'}</div>
                            <div className="text-sm text-muted-foreground">
                                {levelLabels[memberToDelete?.level]?.[lang] || memberToDelete?.level}
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {getText('terminateConfirm')}
                    </p>

                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md">
                        ⚠️ {getText('terminateWarning')}
                    </p>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setMemberToDelete(null)}>
                            {getText('cancel')}
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={handleConfirmTerminate}>
                            {getText('confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

const ServicesManager = ({ onSuccess }) => {
    const { services, addService, updateService, deleteService, t, language, salonSettings } = useStore();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState(null);

    // Store names for each language
    const [formData, setFormData] = React.useState({
        name: { ru: '', kz: '', en: '', es: '', tr: '' },
        price: '',
        duration: ''
    });
    const [isTranslating, setIsTranslating] = React.useState(false);

    // Auto-translate service name to all languages
    const handleAutoTranslate = async () => {
        const sourceLang = detectSourceLanguage(formData.name);
        if (!sourceLang) {
            alert(t('services.enterNameFirst') || 'Сначала введите название на любом языке');
            return;
        }

        setIsTranslating(true);
        try {
            const translations = await translateToAllLanguages(formData.name[sourceLang], sourceLang);
            setFormData({
                ...formData,
                name: translations
            });
        } catch (error) {
            console.error('Translation error:', error);
            alert(t('services.translationError') || 'Ошибка перевода. Попробуйте позже.');
        } finally {
            setIsTranslating(false);
        }
    };

    // Get price placeholder - $10 USD equivalent in selected currency, rounded to nearest 10
    const getPricePlaceholder = () => {
        const currency = salonSettings?.currency || '₸';
        // Approximate $10 USD equivalents (rounded to nearest 10)
        const rates = {
            '₸': 5000,      // KZT
            '$': 10,        // USD
            '€': 10,        // EUR
            '£': 10,        // GBP
            '₽': 1000,      // RUB
            '₴': 420,       // UAH
            'Br': 30,       // BYN
            '₼': 20,        // AZN
            'soʻm': 130000, // UZS
            '₾': 30,        // GEL
            '֏': 4000,      // AMD
            'сом': 900,     // KGS
            'SM': 110,      // TJS
            'TMT': 40,      // TMT
            'zł': 40,       // PLN
            'Kč': 240,      // CZK
            'Ft': 3700,     // HUF
            'lei': 50,      // RON
            'лв': 20,       // BGN
            '₺': 350,       // TRY
            '₹': 840,       // INR
            '¥': 1500,      // CNY/JPY avg
            '₩': 14000,     // KRW
            '฿': 360,       // THB
            'RM': 50,       // MYR
            'S$': 14,       // SGD
            'A$': 16,       // AUD
            'CA$': 14,      // CAD
            'CHF': 10,      // CHF
            'kr': 110,      // SEK/NOK/DKK avg
            'د.إ': 40,      // AED
            'ر.س': 40,      // SAR
            '₪': 40,        // ILS
            'R': 190,       // ZAR
            'R$': 60,       // BRL
            'MX$': 180,     // MXN
            'COP$': 43000,  // COP
            'S/.': 40,      // PEN
            'CLP$': 9800,   // CLP
            'ARS$': 9800,   // ARS
        };
        const value = rates[currency] || 5000;
        return value.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    const getServiceName = (service) => {
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleOpenAdd = () => {
        setEditingService(null);
        setFormData({ name: { ru: '', kz: '', en: '', es: '', tr: '' }, price: '', duration: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        // Handle legacy string names by putting them in RU slot by default
        const names = typeof service.name === 'object'
            ? { ru: service.name.ru || '', kz: service.name.kz || '', en: service.name.en || '', es: service.name.es || '', tr: service.name.tr || '' }
            : { ru: service.name, kz: '', en: '', es: '', tr: '' };

        setFormData({ name: names, price: service.price, duration: service.duration });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        // Fallbacks for empty fields
        const finalNames = { ...formData.name };
        if (!finalNames.ru) finalNames.ru = finalNames.en || finalNames.kz || 'Service';
        if (!finalNames.kz) finalNames.kz = finalNames.ru;
        if (!finalNames.en) finalNames.en = finalNames.ru;

        if (!formData.price || !formData.duration) return;

        if (editingService) {
            updateService(editingService.id, {
                name: finalNames,
                price: parseInt(formData.price),
                duration: parseInt(formData.duration)
            });
            onSuccess(t('services.serviceUpdated'));
        } else {
            addService({
                name: finalNames,
                price: parseInt(formData.price),
                duration: parseInt(formData.duration)
            });
            onSuccess(t('services.serviceAdded'));
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm(t('services.deleteConfirm'))) {
            deleteService(id);
            onSuccess(t('services.serviceDeleted'));
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{t('settings.services')}</CardTitle>
                    <Button size="sm" onClick={handleOpenAdd}>{t('common.add')}</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {services.map(service => (
                        <div key={service.id} className="flex justify-between items-center p-3 bg-muted rounded-lg border hover:border-primary/50 transition-colors">
                            <div>
                                <div className="font-medium">{getServiceName(service)}</div>
                                <div className="text-sm text-muted-foreground">{service.duration} {t('common.min')} • {formatPrice(service.price)} {salonSettings?.currency || '₸'}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(service)}>
                                    ✏️
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)}>
                                    🗑️
                                </Button>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && <div className="text-center text-muted-foreground py-4">{t('services.empty')}</div>}
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? t('services.editService') : t('services.newService')}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('services.name')} (RU)</label>
                        <Input
                            value={formData.name.ru}
                            onChange={e => setFormData({ ...formData, name: { ...formData.name, ru: e.target.value } })}
                            placeholder="Стрижка"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('services.name')} (KZ)</label>
                        <Input
                            value={formData.name.kz}
                            onChange={e => setFormData({ ...formData, name: { ...formData.name, kz: e.target.value } })}
                            placeholder="Шаш қию"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('services.name')} (EN)</label>
                        <Input
                            value={formData.name.en}
                            onChange={e => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                            placeholder="Haircut"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('services.name')} (ES)</label>
                        <Input
                            value={formData.name.es}
                            onChange={e => setFormData({ ...formData, name: { ...formData.name, es: e.target.value } })}
                            placeholder="Corte de pelo"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('services.name')} (TR)</label>
                        <Input
                            value={formData.name.tr}
                            onChange={e => setFormData({ ...formData, name: { ...formData.name, tr: e.target.value } })}
                            placeholder="Saç kesimi"
                        />
                    </div>

                    {/* Auto-translate button */}
                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleAutoTranslate}
                            disabled={isTranslating}
                        >
                            <Globe className="w-4 h-4 text-blue-500" />
                            {isTranslating
                                ? (t('services.translating') || 'Перевод...')
                                : (t('services.autoTranslateBtnText') || 'Автоперевод на все языки')}
                        </Button>
                        <div className="text-xs text-muted-foreground text-left space-y-1">
                            <p>{t('services.translateHintPurpose') || 'Клиент увидит название на выбранном языке, а у вас оно останется на оригинальном.'}</p>
                            <p>⚠️ {t('services.translateHintWarning') || 'Перевод может быть приближённым — при необходимости отредактируйте вручную.'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('services.price')} ({salonSettings?.currency || '₸'})</label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder={getPricePlaceholder()}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('services.duration')}</label>
                            <Input
                                type="number"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="60"
                            />
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleSave}>{t('common.save')}</Button>
                </div>
            </Modal>
        </>
    );
};

// Animation Preview Card for testing all welcome animations
const AnimationPreviewCard = () => {
    const { t } = useStore();
    const [showPreview, setShowPreview] = React.useState(false);
    const [previewTimeOfDay, setPreviewTimeOfDay] = React.useState('morning');

    const timeOptions = [
        { value: 'morning', label: '🌅 Утро', labelEn: 'Morning' },
        { value: 'afternoon', label: '☀️ День', labelEn: 'Afternoon' },
        { value: 'evening', label: '🌆 Вечер', labelEn: 'Evening' },
        { value: 'night', label: '🌙 Ночь', labelEn: 'Night' }
    ];

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        Тест анимации приветствия
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Время суток</label>
                        <div className="grid grid-cols-2 gap-2">
                            {timeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    className={cn(
                                        "p-2 rounded-md border text-sm transition-all",
                                        previewTimeOfDay === opt.value
                                            ? "border-primary bg-primary/10 font-medium"
                                            : "border-border hover:bg-muted"
                                    )}
                                    onClick={() => setPreviewTimeOfDay(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full gap-2"
                        onClick={() => setShowPreview(true)}
                    >
                        <Play className="w-4 h-4" />
                        Показать анимацию
                    </Button>
                </CardContent>
            </Card>

            {showPreview && (
                <WelcomeAnimation
                    previewTimeOfDay={previewTimeOfDay}
                    onComplete={() => setShowPreview(false)}
                />
            )}
        </>
    );
};
