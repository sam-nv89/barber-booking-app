import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Copy, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';

export const BookingQRCode = ({ appointment, onClose }) => {
    const { t, language, services } = useStore();
    const [copied, setCopied] = React.useState(false);

    // Generate unique check-in code from appointment ID
    const checkInCode = appointment.id.slice(-8).toUpperCase();

    const getServiceName = (service) => {
        if (!service) return '';
        if (typeof service.name === 'object') {
            return service.name[language] || service.name['ru'] || Object.values(service.name)[0];
        }
        return service.name;
    };

    const service = services.find(s => s.id === appointment.serviceId);
    const serviceName = getServiceName(service);

    const handleCopy = () => {
        navigator.clipboard.writeText(checkInCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm">
                <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-1">
                            {t('checkin.qrTitle')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('checkin.showToMaster')}
                        </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center py-4">
                        <div className="bg-white p-4 rounded-xl shadow-inner">
                            <QRCodeSVG
                                value={checkInCode}
                                size={180}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                    </div>

                    {/* Code display with copy */}
                    <div className="flex items-center justify-center gap-2">
                        <code className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
                            {checkInCode}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="shrink-0"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </Button>
                    </div>

                    {/* Booking details */}
                    <div className="text-center text-sm text-muted-foreground space-y-1 border-t pt-4">
                        <p className="font-medium text-foreground">{serviceName}</p>
                        <p>{format(new Date(appointment.date), 'dd.MM.yyyy')} • {appointment.time}</p>
                    </div>

                    {/* Close button */}
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={onClose}
                    >
                        {t('common.close')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
