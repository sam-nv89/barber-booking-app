import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, X, User, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PhotoUploader = ({ value, onChange, label = "Фото" }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(value);
    const [isHovered, setIsHovered] = useState(false);

    // Update preview when value changes externally
    React.useEffect(() => {
        setPreview(value);
    }, [value]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                setPreview(result);
                onChange(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />

            <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => fileInputRef.current?.click()}
            >
                {/* Avatar / Preview */}
                <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-300",
                    preview ? "border-primary" : "border-dashed border-muted-foreground/30 bg-muted/30"
                )}>
                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-10 h-10 text-muted-foreground/50" />
                    )}
                </div>

                {/* Overlay with Upload Icon */}
                <div className={cn(
                    "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity duration-200",
                    isHovered ? "opacity-100" : "opacity-0"
                )}>
                    <Upload className="w-6 h-6 text-white" />
                </div>

                {/* Remove Button */}
                {preview && (
                    <button
                        onClick={handleRemove}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                        title="Удалить фото"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
            >
                {label}
            </Button>
        </div>
    );
};
