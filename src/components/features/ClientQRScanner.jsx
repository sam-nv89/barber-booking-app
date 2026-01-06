import React from 'react';
import { Button } from '@/components/ui/Button';
import { X, Camera } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

export const ClientQRScanner = ({ onClose, onScan, t }) => {
    const scannerRef = React.useRef(null);
    const scannerContainerId = 'client-qr-scanner';
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        // Wait for DOM to be ready
        const timeoutId = setTimeout(() => {
            try {
                const containerElement = document.getElementById(scannerContainerId);
                if (!containerElement) {
                    console.error('QR scanner container not found');
                    setError(t('checkin.cameraError') || 'Ошибка камеры');
                    return;
                }

                const scanner = new Html5QrcodeScanner(
                    scannerContainerId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                        rememberLastUsedCamera: true,
                    },
                    false // verbose
                );

                scanner.render(
                    (decodedText) => {
                        // Success - QR code scanned
                        scanner.clear().catch(console.error);
                        onScan(decodedText);
                    },
                    (errorMessage) => {
                        // Scanning in progress, ignore errors
                    }
                );

                scannerRef.current = scanner;
                setIsInitialized(true);
            } catch (err) {
                console.error('Failed to initialize QR scanner:', err);
                setError(t('checkin.cameraError') || 'Не удалось запустить камеру');
            }
        }, 200);

        return () => {
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4">
                <h2 className="text-white font-bold text-lg">
                    {t('checkin.scanMasterQR') || 'Сканировать QR мастера'}
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-6 h-6 text-white" />
                </Button>
            </div>

            {/* Scanner */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {error ? (
                    <div className="text-center text-white">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <p className="text-lg">{error}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={onClose}
                        >
                            {t('common.close') || 'Закрыть'}
                        </Button>
                    </div>
                ) : (
                    <div
                        id={scannerContainerId}
                        className="w-full max-w-md bg-white rounded-lg overflow-hidden"
                        style={{ minHeight: '350px' }}
                    />
                )}
            </div>

            {/* Hint */}
            <div className="p-4 text-center text-white/70 text-sm">
                {t('checkin.pointCameraToMaster') || 'Наведите камеру на QR-код мастера'}
            </div>
        </div>
    );
};
