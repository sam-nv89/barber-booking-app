import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { QrCode, Search, User, Clock, Scissors, CheckCircle, Play, ArrowLeft, Camera, AlertTriangle, X, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export const CheckIn = () => {
    const { t, language, locale, appointments, services, updateAppointment, addNotification } = useStore();
    const navigate = useNavigate();

    const [code, setCode] = React.useState('');
    const [foundAppointment, setFoundAppointment] = React.useState(null);
    const [isOtherDay, setIsOtherDay] = React.useState(false);
    const [error, setError] = React.useState('');
    const [processing, setProcessing] = React.useState(false);
    const [showScanner, setShowScanner] = React.useState(false);
    const videoRef = React.useRef(null);
    const streamRef = React.useRef(null);

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const handleSearch = () => {
        setError('');
        setFoundAppointment(null);
        setIsOtherDay(false);

        if (code.length < 4) {
            setError(t('checkin.minChars'));
            return;
        }

        const searchCode = code.toUpperCase().trim();

        // First try to find today's booking
        let found = appointments.find(a =>
            a.id.slice(-8).toUpperCase() === searchCode &&
            a.status === 'confirmed' &&
            isToday(parseISO(a.date))
        );

        if (found) {
            setFoundAppointment(found);
            setIsOtherDay(false);
        } else {
            // Try to find on other days
            found = appointments.find(a =>
                a.id.slice(-8).toUpperCase() === searchCode &&
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

    // Camera QR Scanner
    const startScanner = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setShowScanner(true);
        } catch (err) {
            console.error('Camera error:', err);
            setError(t('checkin.cameraError'));
        }
    };

    const stopScanner = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowScanner(false);
    };

    React.useEffect(() => {
        return () => stopScanner();
    }, []);

    const service = foundAppointment ? services.find(s => s.id === foundAppointment.serviceId) : null;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <QrCode className="w-6 h-6" />
                    {t('checkin.title')}
                </h1>
            </div>

            {/* Code input */}
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
                        <Button variant="outline" size="icon" onClick={startScanner} title={language === 'en' ? 'Scan QR' : 'Сканировать QR'}>
                            <Camera className="w-5 h-5" />
                        </Button>
                        <Button onClick={handleSearch} disabled={code.length < 4}>
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

            {/* Camera Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-white font-bold">{t('checkin.scanQR')}</h2>
                        <Button variant="ghost" size="icon" onClick={stopScanner}>
                            <X className="w-6 h-6 text-white" />
                        </Button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-4 border-white/20">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 border-2 border-primary m-8 rounded-lg" />
                        </div>
                    </div>
                    <div className="p-4 text-center text-white/70 text-sm">
                        {t('checkin.pointCamera')}
                    </div>
                </div>
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

            {/* Instructions */}
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
        </div>
    );
};
