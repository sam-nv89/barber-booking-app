import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { QrCode, Search, User, Clock, Scissors, CheckCircle, Play, ArrowLeft, Camera, AlertTriangle, X, Calendar, Share2 } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClientQRScanner } from '@/components/features/ClientQRScanner';
import { QRCodeSVG } from 'qrcode.react';

export const CheckIn = () => {
    const { t, language, locale, appointments, services, updateAppointment, addNotification, salonSettings } = useStore();
    const navigate = useNavigate();

    const [code, setCode] = React.useState('');
    const [foundAppointment, setFoundAppointment] = React.useState(null);
    const [isOtherDay, setIsOtherDay] = React.useState(false);
    const [error, setError] = React.useState('');
    const [processing, setProcessing] = React.useState(false);
    const [showScanner, setShowScanner] = React.useState(false);
    const [showMasterQR, setShowMasterQR] = React.useState(false);

    // Check-in mode from settings (default: master scans client)
    const checkinMode = salonSettings?.checkinMode || 'master_scans';

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleSearch = (searchCode = code) => {
        setError('');
        setFoundAppointment(null);
        setIsOtherDay(false);

        const cleanCode = searchCode.toUpperCase().trim();

        if (cleanCode.length < 4) {
            setError(t('checkin.minChars'));
            return;
        }

        // First try to find today's booking
        let found = appointments.find(a =>
            a.id.slice(-8).toUpperCase() === cleanCode &&
            a.status === 'confirmed' &&
            isToday(parseISO(a.date))
        );

        if (found) {
            setFoundAppointment(found);
            setIsOtherDay(false);
        } else {
            // Try to find on other days
            found = appointments.find(a =>
                a.id.slice(-8).toUpperCase() === cleanCode &&
                a.status === 'confirmed'
            );

            if (found) {
                setFoundAppointment(found);
                setIsOtherDay(true);
            } else {
                setError(t('checkin.notFound'));
            }
        }
    };

    const handleStartWork = () => {
        if (!foundAppointment) return;
        setProcessing(true);

        // Update to today's date if it's from another day
        const updates = { status: 'in_progress' };
        if (isOtherDay) {
            updates.date = format(new Date(), 'yyyy-MM-dd');
            updates.originalDate = foundAppointment.date; // Keep original date
        }

        updateAppointment(foundAppointment.id, updates);

        addNotification({
            id: `checkin-${Date.now()}`,
            type: isOtherDay ? 'warning' : 'new',
            recipient: 'master',
            titleKey: isOtherDay ? 'notifications.clientArrivedTransferred' : 'notifications.clientArrived',
            messageKey: isOtherDay ? 'notifications.clientArrivedTransferredMessage' : 'notifications.clientArrivedMessage',
            params: {
                clientName: foundAppointment.clientName,
                time: foundAppointment.time,
                originalDate: foundAppointment.date
            },
            date: new Date().toISOString(),
            appointmentId: foundAppointment.id,
            read: false
        });

        setTimeout(() => {
            setProcessing(false);
            navigate('/master/records', { state: { highlightId: foundAppointment.id } });
        }, 500);
    };

    const handleNotifyBusy = () => {
        if (!foundAppointment) return;

        addNotification({
            id: `busy-${Date.now()}`,
            type: 'cancelled',
            recipient: 'client',
            titleKey: 'notifications.masterBusy',
            messageKey: 'notifications.masterBusyMessage',
            date: new Date().toISOString(),
            appointmentId: foundAppointment.id,
            read: false
        });

        setFoundAppointment(null);
        setCode('');
        setIsOtherDay(false);
    };

    // Generate Master QR code for clients to scan
    const masterQRValue = React.useMemo(() => {
        // Simple format: barber://checkin/<master_id>/<timestamp>
        const masterId = salonSettings?.name?.replace(/\s/g, '_') || 'master';
        return `BARBER_CHECKIN:${masterId}:${Date.now()}`;
    }, [salonSettings]);

    const service = foundAppointment ? services.find(s => s.id === foundAppointment.serviceId) : null;

    if (checkinMode === 'disabled') {
        return (
            <div className="space-y-6 pb-20 pt-10 text-center">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <QrCode className="h-10 w-10 text-muted-foreground" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold">{t('checkin.disabledTitle') || 'Check-in отключен'}</h2>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                        {t('checkin.disabledDesc') || 'В настройках салона отключена система QR регистрации.'}
                    </p>
                </div>
                <Button onClick={() => navigate(-1)} variant="outline">
                    {t('common.back')}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <QrCode className="w-6 h-6" />
                        {t('checkin.title')}
                    </h1>
                </div>
                {/* Toggle to show Master QR - only if 'client_scans' or 'both' */}
                {(checkinMode === 'client_scans' || checkinMode === 'both') && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMasterQR(!showMasterQR)}
                        className="gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        {showMasterQR ? t('common.close') : t('checkin.masterQR') || 'Мой QR'}
                    </Button>
                )}
            </div>

            {/* Master QR Mode - Clients scan this */}
            {showMasterQR && (checkinMode === 'client_scans' || checkinMode === 'both') && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            {t('checkin.masterQRTitle') || 'QR для клиентов'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t('checkin.masterQRDesc') || 'Покажите этот QR клиенту для регистрации'}
                        </p>
                        <div className="flex justify-center py-4">
                            <div className="bg-white p-4 rounded-xl shadow-inner">
                                <QRCodeSVG
                                    value={masterQRValue}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            {salonSettings?.name || 'Barber Shop'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Code input - only if 'master_scans' or 'both' */}
            {(checkinMode === 'master_scans' || checkinMode === 'both') && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t('checkin.enterCode')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="XXXXXXXX"
                                className="font-mono text-lg tracking-widest uppercase"
                                maxLength={8}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button variant="outline" size="icon" onClick={() => setShowScanner(true)} title={t('checkin.scanQR')}>
                                <Camera className="w-5 h-5" />
                            </Button>
                            <Button onClick={() => handleSearch()} disabled={code.length < 4}>
                                <Search className="w-4 h-4 mr-2" />
                                {t('checkin.find')}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {t('checkin.hint')}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Reused Client Scanner Component */}
            {showScanner && (
                <ClientQRScanner
                    onClose={() => setShowScanner(false)}
                    onScan={(decodedText) => {
                        setCode(decodedText);
                        setShowScanner(false);
                        handleSearch(decodedText);
                    }}
                    t={t}
                />
            )}

            {/* Found appointment - Today */}
            {foundAppointment && !isOtherDay && (
                <Card className="border-green-500/50 bg-green-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            {t('checkin.bookingFound')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{foundAppointment.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Scissors className="w-4 h-4 text-muted-foreground" />
                                <span>{getServiceName(service)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{format(parseISO(foundAppointment.date), 'dd.MM.yyyy')} • {foundAppointment.time}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={handleStartWork}
                            disabled={processing}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {t('checkin.startWork')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Found appointment - Other Day (Yellow Warning) */}
            {foundAppointment && isOtherDay && (
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="w-5 h-5" />
                            {t('checkin.otherDayWarning')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-yellow-500/20 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium">
                                <Calendar className="w-4 h-4" />
                                {t('checkin.scheduledFor', { date: format(parseISO(foundAppointment.date), 'dd MMMM yyyy', { locale: locale() }) })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{foundAppointment.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Scissors className="w-4 h-4 text-muted-foreground" />
                                <span>{getServiceName(service)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{foundAppointment.time}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handleStartWork}
                                disabled={processing}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {t('checkin.acceptNow')}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                onClick={handleNotifyBusy}
                            >
                                <X className="w-4 h-4 mr-2" />
                                {t('checkin.cannotAccept')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions - only show for master_scans or both mode */}
            {(checkinMode === 'master_scans' || checkinMode === 'both') && (
                <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <h3 className="font-medium mb-2">
                            {t('checkin.howItWorks')}
                        </h3>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>{t('checkin.step1')}</li>
                            <li>{t('checkin.step2')}</li>
                            <li>{t('checkin.step3')}</li>
                        </ol>
                    </CardContent>
                </Card>
            )}

            {/* Instructions for client_scans mode */}
            {checkinMode === 'client_scans' && (
                <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <h3 className="font-medium mb-2">
                            {t('checkin.howItWorks')}
                        </h3>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>{t('checkin.clientStep1') || 'Нажмите "Мой QR" чтобы показать код'}</li>
                            <li>{t('checkin.clientStep2') || 'Клиент сканирует QR своим телефоном'}</li>
                            <li>{t('checkin.clientStep3') || 'Вы получите уведомление о регистрации'}</li>
                        </ol>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
