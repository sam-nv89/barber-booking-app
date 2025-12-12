// ClientList.jsx - CRM page for managing clients (master panel)
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Users, Plus, Phone, User, Trash2, Calendar, Edit, X, FileText, Tag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatPhoneNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ClientList() {
    const { clients, appointments, addClient, removeClient, updateClient, t } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', notes: '', tags: [] });
    const [filterTag, setFilterTag] = useState(null);

    // Available tags with colors - using translations
    const AVAILABLE_TAGS = [
        { id: 'vip', label: 'VIP', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
        { id: 'regular', label: t('clients.regular') || 'Постоянный', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
        { id: 'new', label: t('clients.new') || 'Новый', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
        { id: 'problem', label: t('clients.problem') || 'Проблемный', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
    ];

    // Safe access
    const clientList = clients || [];
    const appointmentList = appointments || [];

    // Highlight matching text - subtle underline style
    const highlightText = (text, query) => {
        if (!query.trim() || !text) return text;

        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index === -1) return text;

        return <>{text.slice(0, index)}<span style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>{text.slice(index, index + query.length)}</span>{text.slice(index + query.length)}</>;
    };

    // Highlight phone - search in digits only but highlight in formatted
    const highlightPhone = (phone, query) => {
        if (!query.trim() || !phone) return phone;

        // Get only digits from query
        const queryDigits = query.replace(/\D/g, '');
        if (!queryDigits) return phone;

        // Get only digits from phone
        const phoneDigits = phone.replace(/\D/g, '');
        const digitIndex = phoneDigits.indexOf(queryDigits);

        if (digitIndex === -1) return phone;

        // Map digit position to original string position
        // Find position of first matching digit
        let digitCount = 0;
        let startPos = -1;
        let endPos = -1;

        for (let i = 0; i < phone.length; i++) {
            if (/\d/.test(phone[i])) {
                if (digitCount === digitIndex) {
                    startPos = i;
                }
                if (digitCount === digitIndex + queryDigits.length - 1) {
                    endPos = i + 1;
                    break;
                }
                digitCount++;
            }
        }

        if (startPos === -1 || endPos === -1) return phone;

        const before = phone.slice(0, startPos);
        const match = phone.slice(startPos, endPos);
        const after = phone.slice(endPos);

        return <span style={{ whiteSpace: 'pre' }}>{before}<span style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>{match}</span>{after}</span>;
    };

    // Calculate visit count for each client
    const clientsWithStats = useMemo(() => {
        return clientList.map(client => {
            const clientPhone = client.phone?.replace(/\D/g, '');
            const visits = appointmentList.filter(a =>
                a.clientPhone?.replace(/\D/g, '') === clientPhone &&
                a.status === 'completed'
            ).length;
            const totalBookings = appointmentList.filter(a =>
                a.clientPhone?.replace(/\D/g, '') === clientPhone
            ).length;
            return { ...client, visits, totalBookings };
        });
    }, [clientList, appointmentList]);

    // Filter clients with smart search
    const filteredClients = useMemo(() => {
        let result = clientsWithStats;

        // Filter by tag
        if (filterTag) {
            result = result.filter(c => c.tags?.includes(filterTag));
        }

        // Filter by search - smart phone search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const queryDigits = searchQuery.replace(/\D/g, ''); // Get only digits

            result = result.filter(c => {
                // Name match
                const nameMatch = c?.name?.toLowerCase().includes(query);

                // Phone match - compare digits only
                const phoneDigits = c?.phone?.replace(/\D/g, '') || '';
                const phoneMatch = queryDigits && phoneDigits.includes(queryDigits);

                // Notes match
                const notesMatch = c?.notes?.toLowerCase().includes(query);

                return nameMatch || phoneMatch || notesMatch;
            });
        }

        return result;
    }, [clientsWithStats, searchQuery, filterTag]);

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const toggleTag = (tagId) => {
        const currentTags = formData.tags || [];
        if (currentTags.includes(tagId)) {
            setFormData({ ...formData, tags: currentTags.filter(t => t !== tagId) });
        } else {
            setFormData({ ...formData, tags: [...currentTags, tagId] });
        }
    };

    const handleAddClient = () => {
        if (!formData.name.trim() || !formData.phone.trim()) return;
        addClient({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            notes: formData.notes.trim(),
            tags: formData.tags
        });
        resetForm();
    };

    const handleEditClient = () => {
        if (!formData.name.trim()) return;
        updateClient(editingId, {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            notes: formData.notes.trim(),
            tags: formData.tags
        });
        resetForm();
    };

    const startEdit = (client) => {
        setEditingId(client.id);
        setFormData({
            name: client.name || '',
            phone: client.phone || '',
            notes: client.notes || '',
            tags: client.tags || []
        });
        setShowForm(false);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', phone: '', notes: '', tags: [] });
    };

    const handleDelete = (id) => {
        if (confirm(t('clients.deleteConfirm') || 'Удалить клиента?')) {
            removeClient(id);
        }
    };

    const getTagInfo = (tagId) => AVAILABLE_TAGS.find(t => t.id === tagId);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    {t('clients.title') || 'База клиентов'}
                </h1>
                <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('clients.add') || 'Добавить'}
                </Button>
            </div>

            {/* Tag Filters */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    size="sm"
                    variant={filterTag === null ? 'default' : 'outline'}
                    onClick={() => setFilterTag(null)}
                >
                    {t('common.all') || 'Все'} ({clientList.length})
                </Button>
                {AVAILABLE_TAGS.map(tag => {
                    const count = clientList.filter(c => c.tags?.includes(tag.id)).length;
                    return (
                        <Button
                            key={tag.id}
                            size="sm"
                            variant={filterTag === tag.id ? 'default' : 'outline'}
                            onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                            className={filterTag === tag.id ? '' : tag.color}
                        >
                            {tag.label} ({count})
                        </Button>
                    );
                })}
            </div>

            {/* Add/Edit Form (inline) */}
            {(showForm || editingId) && (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">
                                {editingId ? (t('clients.edit') || 'Редактирование') : (t('clients.newClient') || 'Новый клиент')}
                            </h3>
                            <Button size="icon" variant="ghost" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('clients.namePlaceholder') || 'Имя клиента'}
                        />
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            placeholder="+7 (___) ___-__-__"
                        />

                        {/* Tags selection */}
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1 mb-2">
                                <Tag className="w-4 h-4" />
                                {t('clients.tags') || 'Теги'}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {AVAILABLE_TAGS.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={cn(
                                            'px-3 py-1 rounded-full text-xs border transition-all',
                                            formData.tags?.includes(tag.id)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : tag.color
                                        )}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('clients.notesPlaceholder') || 'Заметки о клиенте...'}
                            className="w-full min-h-[80px] p-3 rounded-md border bg-background resize-none text-sm"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={editingId ? handleEditClient : handleAddClient}
                                disabled={!formData.name.trim() || (!editingId && formData.phone.replace(/\D/g, '').length < 11)}
                            >
                                {editingId ? (t('common.save') || 'Сохранить') : (t('clients.add') || 'Добавить')}
                            </Button>
                            <Button variant="outline" onClick={resetForm}>
                                {t('common.cancel') || 'Отмена'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('clients.searchPlaceholder') || 'Поиск по имени или телефону...'}
                    className="pl-10"
                />
            </div>

            {/* Stats */}
            <Card>
                <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{filteredClients.length}</div>
                    <div className="text-sm text-muted-foreground">
                        {filterTag || searchQuery ? `${t('clients.found') || 'Найдено'} ${t('clients.of') || 'из'} ${clientList.length}` : (t('clients.total') || 'Всего клиентов')}
                    </div>
                </CardContent>
            </Card>

            {/* Client List */}
            {filteredClients.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                            {clientList.length === 0
                                ? (t('clients.empty') || 'Нет клиентов. Клиенты добавляются автоматически при записи.')
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
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-medium">
                                                {searchQuery ? highlightText(client.name, searchQuery) : client.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {searchQuery ? highlightPhone(client.phone, searchQuery) : client.phone}
                                            </div>
                                            {client.totalBookings > 0 && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {client.visits} {t('clients.of') || 'из'} {client.totalBookings} {t('clients.visits') || 'визитов'}
                                                </div>
                                            )}
                                            {/* Tags */}
                                            {client.tags?.length > 0 && (
                                                <div className="flex gap-1 flex-wrap mt-1">
                                                    {client.tags.map(tagId => {
                                                        const tag = getTagInfo(tagId);
                                                        if (!tag) return null;
                                                        return (
                                                            <span
                                                                key={tagId}
                                                                className={cn('px-2 py-0.5 rounded-full text-xs border', tag.color)}
                                                            >
                                                                {tag.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {client.notes && (
                                                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2 flex gap-1">
                                                    <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span>{searchQuery ? highlightText(client.notes, searchQuery) : client.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => startEdit(client)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(client.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ClientList;
