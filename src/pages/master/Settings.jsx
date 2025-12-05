import React from 'react';
import { useStore } from '@/store/useStore';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatPrice } from '@/lib/utils';

import { SuccessAnimation } from '@/components/features/SuccessAnimation';

export const Settings = () => {
    const { t, salonSettings, setSalonSettings } = useStore();
    const [formData, setFormData] = React.useState(salonSettings);
    const [isDirty, setIsDirty] = React.useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
    const [scheduleData, setScheduleData] = React.useState(salonSettings.schedule);
    const [successMessage, setSuccessMessage] = React.useState(null); // Title for success

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSaveProfile = () => {
        setSalonSettings(formData);
        setIsDirty(false);
        setSuccessMessage('Настройки сохранены');
    };

    const handleSaveSchedule = () => {
        setSalonSettings({ ...salonSettings, schedule: scheduleData });
        setIsScheduleModalOpen(false);
        setSuccessMessage('График обновлен');
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
        if (!schedule.start || !schedule.end) return 'Выходной';
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
                    <CardTitle className="text-lg">Профиль салона</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Название</label>
                        <Input name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Адрес</label>
                        <Input name="address" value={formData.address} onChange={handleChange} />
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
                    <CardTitle className="text-lg">График работы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {days.map(day => (
                        <div key={day.key} className="flex justify-between items-center">
                            <span>{day.label}</span>
                            <span className={cn("text-muted-foreground", (!salonSettings.schedule[day.key].start) && "text-destructive")}>
                                {formatScheduleDisplay(salonSettings.schedule[day.key])}
                            </span>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full mt-4" onClick={() => setIsScheduleModalOpen(true)}>
                        Изменить график
                    </Button>
                </CardContent>
            </Card>

            <ServicesManager onSuccess={setSuccessMessage} />
            <MarketingManager onSuccess={setSuccessMessage} />

            <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Редактирование графика">
                <div className="space-y-6">
                    <datalist id="time-options">
                        {timeOptions.map(time => <option key={time} value={time} />)}
                    </datalist>

                    {days.map(day => (
                        <div key={day.key} className="space-y-2 pb-4 border-b last:border-0">
                            <div className="flex justify-between items-center">
                                <label className="font-medium">{day.label}</label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("text-xs h-6", (!scheduleData[day.key].start) ? "text-destructive" : "text-muted-foreground")}
                                    onClick={() => toggleDayOff(day.key)}
                                >
                                    {(!scheduleData[day.key].start) ? 'Сделать рабочим' : 'Сделать выходным'}
                                </Button>
                            </div>

                            {(!scheduleData[day.key].start) ? (
                                <div className="p-2 bg-muted rounded-md text-center text-sm text-muted-foreground">
                                    Выходной
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

            {successMessage && (
                <SuccessAnimation
                    onComplete={() => setSuccessMessage(null)}
                    title={successMessage}
                    message="Изменения успешно применены"
                />
            )}
        </div>
    );
};

const MarketingManager = ({ onSuccess }) => {
    const { campaigns, addCampaign, deleteCampaign, services } = useStore();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        type: 'discount',
        value: '',
        startDate: '',
        endDate: '',
        serviceIds: []
    });

    const handleSave = () => {
        if (!formData.name || !formData.value || !formData.startDate || !formData.endDate) return;

        addCampaign(formData);
        onSuccess('Акция создана');
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
        if (confirm('Удалить акцию?')) {
            deleteCampaign(id);
            onSuccess('Акция удалена');
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
                    <CardTitle className="text-lg">Маркетинг и Акции</CardTitle>
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>Создать акцию</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="flex justify-between items-center p-3 bg-muted rounded-lg border">
                            <div>
                                <div className="font-medium">{campaign.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {campaign.type === 'discount' ? `Скидка ${campaign.value}%` : `Фикс. цена ${campaign.value} ₸`} • {campaign.startDate} - {campaign.endDate}
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
                    {campaigns.length === 0 && <div className="text-center text-muted-foreground py-4">Нет активных акций</div>}
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая акция">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Название акции</label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Например: Скидка выходного дня"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Тип</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="discount">Скидка (%)</option>
                                <option value="fixed">Новая цена (₸)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Значение</label>
                            <Input
                                type="number"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                placeholder={formData.type === 'discount' ? "20" : "5000"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Выберите услуги (пусто = все)</label>
                        <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-background">
                            {services && services.length > 0 ? services.map(service => (
                                <label key={service.id} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                        checked={formData.serviceIds.includes(service.id)}
                                        onChange={() => toggleService(service.id)}
                                    />
                                    <span className="text-sm flex-1">{service.name}</span>
                                    <span className="text-xs text-muted-foreground">{formatPrice(service.price)} ₸</span>
                                </label>
                            )) : <div className="text-sm text-muted-foreground text-center">Нет доступных услуг</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Начало</label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Конец</label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleSave}>Создать</Button>
                </div>
            </Modal>
        </>
    );
};

const ServicesManager = ({ onSuccess }) => {
    const { services, addService, updateService, deleteService } = useStore();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState(null);
    const [formData, setFormData] = React.useState({ name: '', price: '', duration: '' });

    const handleOpenAdd = () => {
        setEditingService(null);
        setFormData({ name: '', price: '', duration: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        setFormData({ name: service.name, price: service.price, duration: service.duration });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.price || !formData.duration) return;

        if (editingService) {
            updateService(editingService.id, {
                name: formData.name,
                price: parseInt(formData.price),
                duration: parseInt(formData.duration)
            });
            onSuccess('Услуга обновлена');
        } else {
            addService({
                name: formData.name,
                price: parseInt(formData.price),
                duration: parseInt(formData.duration)
            });
            onSuccess('Услуга добавлена');
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
            deleteService(id);
            onSuccess('Услуга удалена');
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Услуги</CardTitle>
                    <Button size="sm" onClick={handleOpenAdd}>Добавить</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {services.map(service => (
                        <div key={service.id} className="flex justify-between items-center p-3 bg-muted rounded-lg border hover:border-primary/50 transition-colors">
                            <div>
                                <div className="font-medium">{service.name}</div>
                                <div className="text-sm text-muted-foreground">{service.duration} мин • {formatPrice(service.price)} ₸</div>
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
                    {services.length === 0 && <div className="text-center text-muted-foreground py-4">Нет услуг</div>}
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Редактирование услуги" : "Новая услуга"}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Название</label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Например: Стрижка"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Цена (₸)</label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="5000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Длительность (мин)</label>
                            <Input
                                type="number"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="60"
                            />
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleSave}>Сохранить</Button>
                </div>
            </Modal>
        </>
    );
};
