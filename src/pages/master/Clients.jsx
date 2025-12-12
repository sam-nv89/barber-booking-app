import { useState, useMemo } from 'react';
import { User, Search, Plus, Phone, Trash2, Edit, Users, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import useStore from '@/store/useStore';

export function Clients() {
    const { t, clients = [], addClient, updateClient, removeClient } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', notes: '' });

    // Safe filter with fallback
    const filteredClients = useMemo(() => {
        const clientList = clients || [];
        if (!searchQuery.trim()) return clientList;
        const query = searchQuery.toLowerCase();
        return clientList.filter(c =>
            c?.name?.toLowerCase().includes(query) ||
            c?.phone?.includes(query)
        );
    }, [clients, searchQuery]);

    const handleAddClient = () => {
        if (!formData.name || !formData.phone) return;
        addClient({
            name: formData.name,
            phone: formData.phone,
            notes: formData.notes,
            source: 'manual'
        });
        setFormData({ name: '', phone: '', notes: '' });
        setIsAddModalOpen(false);
    };

    const handleEditClient = () => {
        if (!editingClient || !formData.name) return;
        updateClient(editingClient.id, {
            name: formData.name,
            phone: formData.phone,
            notes: formData.notes
        });
        setEditingClient(null);
        setFormData({ name: '', phone: '', notes: '' });
    };

    const openEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            phone: client.phone || '',
            notes: client.notes || ''
        });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    {t('clients.title') || 'Клиенты'}
                </h1>
                <Button size="sm" onClick={() => {
                    setFormData({ name: '', phone: '', notes: '' });
                    setIsAddModalOpen(true);
                }}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('clients.add') || 'Добавить'}
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('clients.search') || 'Поиск...'}
                    className="pl-10"
                />
            </div>

            {/* Stats */}
            <Card>
                <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{(clients || []).length}</div>
                    <div className="text-sm text-muted-foreground">{t('clients.total') || 'Всего клиентов'}</div>
                </CardContent>
            </Card>

            {/* List */}
            {filteredClients.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                            {(clients || []).length === 0
                                ? (t('clients.empty') || 'Нет клиентов. Добавьте первого!')
                                : (t('clients.notFound') || 'Клиенты не найдены')
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredClients.map(client => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{client.name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {client.phone}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => openEdit(client)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                                            if (confirm(t('clients.deleteConfirm') || 'Удалить клиента?')) {
                                                removeClient(client.id);
                                            }
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                {client.notes && (
                                    <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {client.notes}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('clients.addTitle') || 'Новый клиент'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">{t('clients.name') || 'Имя'} *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Введите имя"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('clients.phone') || 'Телефон'} *</label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+7 777 123 45 67"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('clients.notes') || 'Заметки'}</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Заметки о клиенте..."
                            className="w-full min-h-[80px] p-3 rounded-md border bg-background resize-none"
                        />
                    </div>
                    <Button onClick={handleAddClient} className="w-full" disabled={!formData.name || !formData.phone}>
                        {t('clients.add') || 'Добавить'}
                    </Button>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} title={t('clients.editTitle') || 'Редактирование'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">{t('clients.name') || 'Имя'} *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('clients.phone') || 'Телефон'}</label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('clients.notes') || 'Заметки'}</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full min-h-[80px] p-3 rounded-md border bg-background resize-none"
                        />
                    </div>
                    <Button onClick={handleEditClient} className="w-full" disabled={!formData.name}>
                        {t('common.save') || 'Сохранить'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default Clients;
