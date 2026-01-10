import React from 'react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhotoUploader } from '@/components/features/PhotoUploader';

export const MasterDetailsModal = ({ master, isOpen, onClose }) => {
    const { updateMasterInSalon, activeSalonId } = useStore();
    const [formData, setFormData] = React.useState(master || {});

    React.useEffect(() => {
        if (master) {
            setFormData(master);
        }
    }, [master]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!master) return;
        // master.tgUserId is the identifier
        updateMasterInSalon(activeSalonId, master.tgUserId, formData);
        onClose();
    };

    if (!master) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Профиль специалиста">
            <div className="space-y-4">
                <div className="space-y-2 flex flex-col items-center">
                    <PhotoUploader
                        value={formData.avatar}
                        onChange={(avatar) => setFormData(prev => ({ ...prev, avatar }))}
                        label="Выберите фото"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Имя</label>
                    <Input
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        placeholder="Имя мастера"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Телефон</label>
                    <Input
                        name="phone"
                        value={formData.phone || ''}
                        readOnly
                        className="bg-muted opacity-70"
                    />
                    <p className="text-[10px] text-muted-foreground">Телефон нельзя изменить в этом окне</p>
                </div>

                {formData.role && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Роль</label>
                        <Input
                            value={formData.role === 'owner' ? 'Владелец' : formData.role === 'admin' ? 'Администратор' : 'Мастер'}
                            readOnly
                            className="bg-muted opacity-70"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>Отмена</Button>
                    <Button onClick={handleSave}>Сохранить</Button>
                </div>
            </div>
        </Modal>
    );
};
