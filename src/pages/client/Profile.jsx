import React from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

import { SuccessAnimation } from '@/components/features/SuccessAnimation';
import { formatPhoneNumber, isValidEmail } from '@/lib/utils';

export const Profile = () => {
    const { user, setUser, t } = useStore();
    const [formData, setFormData] = React.useState(user);
    const [title, setTitle] = React.useState('');
    const [isDirty, setIsDirty] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [errors, setErrors] = React.useState({});

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'phone') {
            value = formatPhoneNumber(value);
        }

        if (name === 'email') {
            setErrors(prev => ({ ...prev, email: null }));
        }

        setFormData({ ...formData, [name]: value });
        setIsDirty(true);
    };

    const handleSave = () => {
        if (formData.email && !isValidEmail(formData.email)) {
            setErrors({ email: 'Некорректный email' });
            return;
        }

        setUser(formData);
        setIsDirty(false);
        setShowSuccess(true);
    };

    const fileInputRef = React.useRef(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result });
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('nav.profile')}</h1>

            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-4xl cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden group"
                            onClick={handleAvatarClick}
                        >
                            {formData.avatar ? (
                                <img src={formData.avatar} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                '👤'
                            )}
                            <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white text-xs">
                                Изменить
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Имя</label>
                        <Input name="name" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Телефон</label>
                        <Input
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+7 700 000 00 00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            placeholder="example@mail.com"
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                    </div>
                </CardContent>
            </Card>

            {isDirty && (
                <div className="fixed bottom-20 left-4 right-4 animate-in slide-in-from-bottom-5">
                    <Button className="w-full shadow-lg" onClick={handleSave}>
                        {t('common.save')}
                    </Button>
                </div>
            )}
            {showSuccess && (
                <SuccessAnimation
                    onComplete={() => setShowSuccess(false)}
                    title={t('common.success')}
                    message={t('settings.profileSaved')}
                />
            )}
        </div>
    );
};
