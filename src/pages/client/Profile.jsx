import React from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useTMA } from '@/components/providers/TMAProvider';
import { SuccessAnimation } from '@/components/features/SuccessAnimation';
import { formatPhoneNumber, isValidEmail } from '@/lib/utils';
import { Phone, RefreshCw, Trash2, Download, Upload, User } from 'lucide-react';

export const Profile = () => {
    const { user, setUser, t } = useStore();
    const { isTelegram, telegramUser, requestPhonePermission } = useTMA();
    const [formData, setFormData] = React.useState(user);
    const [title, setTitle] = React.useState('');
    const [isDirty, setIsDirty] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [requestingPhone, setRequestingPhone] = React.useState(false);

    // Sync formData when user changes
    React.useEffect(() => {
        setFormData(user);
    }, [user]);

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

    const handleRequestPhone = async () => {
        setRequestingPhone(true);
        try {
            const result = await requestPhonePermission();
            if (result) {
                // Handle different response formats
                let phone = null;
                if (typeof result === 'string') {
                    phone = result;
                } else if (result?.contact?.phone_number) {
                    phone = result.contact.phone_number;
                } else if (result?.responseUnsafe?.contact?.phone_number) {
                    phone = result.responseUnsafe.contact.phone_number;
                }

                if (phone) {
                    // Remove leading + and format according to app settings
                    phone = phone.replace(/^\+/, '');
                    const formattedPhone = formatPhoneNumber(phone);
                    setFormData(prev => ({ ...prev, phone: formattedPhone }));
                    setUser({ phone: formattedPhone, telegramPhone: phone });
                    setIsDirty(true);
                }
            }
        } catch (error) {
            console.warn('[Profile] Phone request error:', error);
        } finally {
            setRequestingPhone(false);
        }
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
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-6">
                        <div
                            className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-4xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                            onClick={handleAvatarClick}
                        >
                            {formData.avatar ? (
                                <img src={formData.avatar} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                            ) : (
                                <User className="w-10 h-10 text-muted-foreground" />
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Avatar delete button */}
                        {formData.avatar && (
                            <button
                                className="mt-2 text-xs text-red-500 hover:underline"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, avatar: null }));
                                    setUser({ avatar: null });
                                }}
                            >
                                {t('profile.deletePhoto')}
                            </button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {/* Telegram username badge */}
                        {user.telegramUsername && (
                            <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
                                <span className="text-blue-500">@{user.telegramUsername}</span>
                                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">TG</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.name')}</label>
                        <Input name="name" value={formData.name || ''} onChange={handleChange} placeholder={t('profile.namePlaceholder')} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.phone')}</label>
                        <div className="relative">
                            <Input
                                name="phone"
                                type="tel"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                placeholder="+7 700 000 00 00"
                                className="pr-10"
                            />
                            {isTelegram && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-blue-500/10 transition-colors"
                                    onClick={handleRequestPhone}
                                    disabled={requestingPhone}
                                    title={t('profile.loadFromTelegram')}
                                >
                                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {formData.phone && user.telegramPhone && formatPhoneNumber(user.telegramPhone) === formData.phone && (
                            <span className="text-xs text-blue-500">📱 {t('profile.fromTelegram')}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.email')}</label>
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
            )
            }
            {
                showSuccess && (
                    <SuccessAnimation
                        onComplete={() => setShowSuccess(false)}
                        title={t('common.success')}
                        message={t('settings.profileSaved')}
                        buttonText={t('common.great')}
                    />
                )
            }
        </div >
    );
};
