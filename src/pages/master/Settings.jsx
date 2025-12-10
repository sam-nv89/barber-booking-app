import React from 'react';
import { useStore } from '@/store/useStore';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatPrice, formatPhoneNumber } from '@/lib/utils';
import { SuccessAnimation } from '@/components/features/SuccessAnimation';
import { format } from 'date-fns';
import { Trash2, UserX } from 'lucide-react';

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
                return { ...prev, [day]: { start: '', end: '' } };
            } else {
                return { ...prev, [day]: { start: '10:00', end: '20:00' } };
            }
        });
    };

    const formatScheduleDisplay = (schedule) => {
        if (!schedule.start || !schedule.end) return t('settings.dayOff');
        return `${schedule.start} - ${schedule.end}`;
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
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.name')}</label>
                        <Input name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.address')}</label>
                        <Input name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.phone')}</label>
                        <Input
                            name="phone"
                            type="tel"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            placeholder="+7 700 000 00 00"
                        />
                    </div>
                    {isDirty && (
                        <Button className="w-full" onClick={handleSaveProfile}>
                            {t('common.save')}
                        </Button>
                    )}
                </CardContent>
            </Card>

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
                                <select
                                    value={salonSettings.bookingPeriodMonths || 1}
                                    onChange={(e) => setSalonSettings({ ...salonSettings, bookingPeriodMonths: parseInt(e.target.value) })}
                                    className="w-full p-2 rounded-md border bg-background"
                                >
                                    <option value={1}>1 {t('common.month')}</option>
                                    <option value={3}>3 {t('common.months')}</option>
                                    <option value={6}>6 {t('common.months')}</option>
                                    <option value={12}>12 {t('common.months')}</option>
                                </select>
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
                        <Input
                            type="tel"
                            placeholder={t('settings.enterPhone')}
                            value={newBlockedPhone}
                            onChange={(e) => setNewBlockedPhone(formatPhoneNumber(e.target.value))}
                        />
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

            {successMessage && (
                <SuccessAnimation
                    onComplete={() => setSuccessMessage(null)}
                    title={t('common.success')}
                    message={successMessage}
                />
            )}
        </div>
    );
};

// Shift Generator Modal with period selection and work hours
const ShiftGeneratorModal = ({ isOpen, onClose, onSave }) => {
    const { t, salonSettings } = useStore();
    const [workDays, setWorkDays] = React.useState(salonSettings.shiftPattern?.workDays || 2);
    const [offDays, setOffDays] = React.useState(salonSettings.shiftPattern?.offDays || 2);
    const [workStart, setWorkStart] = React.useState(salonSettings.shiftPattern?.workHours?.start || '10:00');
    const [workEnd, setWorkEnd] = React.useState(salonSettings.shiftPattern?.workHours?.end || '20:00');
    const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
    const [periodMonths, setPeriodMonths] = React.useState(3);

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
                end: isWorking ? workEnd : ''
            };
            dayCounter++;
        }

        // Pass both overrides and pattern
        const pattern = {
            workDays,
            offDays,
            workHours: { start: workStart, end: workEnd }
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
                    <select
                        value={periodMonths}
                        onChange={(e) => setPeriodMonths(parseInt(e.target.value))}
                        className="w-full p-2 rounded-md border bg-background"
                    >
                        <option value={1}>1 {t('common.month')}</option>
                        <option value={3}>3 {t('common.months')}</option>
                        <option value={6}>6 {t('common.months')}</option>
                        <option value={12}>12 {t('common.months')}</option>
                    </select>
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

const ServicesManager = ({ onSuccess }) => {
    const { services, addService, updateService, deleteService, t, language } = useStore();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState(null);

    // Store names for each language
    const [formData, setFormData] = React.useState({
        name: { ru: '', kz: '', en: '' },
        price: '',
        duration: ''
    });

    const getServiceName = (service) => {
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleOpenAdd = () => {
        setEditingService(null);
        setFormData({ name: { ru: '', kz: '', en: '' }, price: '', duration: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        // Handle legacy string names by putting them in RU slot by default
        const names = typeof service.name === 'object'
            ? service.name
            : { ru: service.name, kz: '', en: '' };

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
                                <div className="text-sm text-muted-foreground">{service.duration} {t('common.min')} • {formatPrice(service.price)} ₸</div>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('services.price')}</label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="5000"
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
