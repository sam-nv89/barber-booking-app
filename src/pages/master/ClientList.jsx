// ClientList.jsx - CRM page for managing clients (master panel)
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Users, Plus, Phone, User, Trash2, Calendar, Edit, X, FileText, Tag, Upload, Check, AlertCircle, Link, FileSpreadsheet, Palette, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatPhoneNumber, parseVCard, parseCSV, googleSheetToCSV, parseExcel, getContrastColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ClientList() {
    const { clients, appointments, addClient, removeClient, updateClient, customTags, addCustomTag, updateCustomTag, removeCustomTag, t } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', notes: '', tags: [] });
    const [filterTag, setFilterTag] = useState(null);
    const [sortBy, setSortBy] = useState('name'); // name, phone, date, visits
    const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

    // Import state
    const [showImport, setShowImport] = useState(false);
    const [importContacts, setImportContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState(new Set());
    const fileInputRef = useRef(null);
    const [googleUrl, setGoogleUrl] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const [showImportOptions, setShowImportOptions] = useState(false);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, name: '', phone: '', notes: '', tags: [] });
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

    // Add client modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addFormData, setAddFormData] = useState({ name: '', phone: '', notes: '', tags: [] });
    const [showAddSuccess, setShowAddSuccess] = useState(false);


    // Available tags with colors - using translations + custom tags
    const BUILTIN_TAGS = [
        { id: 'vip', label: 'VIP', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
        { id: 'regular', label: t('clients.regular') || 'Постоянный', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
        { id: 'new', label: t('clients.new') || 'Новый', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
        { id: 'problem', label: t('clients.problem') || 'Проблемный', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
    ];

    // Merge built-in tags with custom tags from store
    const AVAILABLE_TAGS = useMemo(() => {
        const custom = (customTags || []).map(tag => ({
            id: tag.id,
            label: tag.label,
            color: tag.colorClass, // Use tailwind class
            isCustom: true
        }));
        return [...BUILTIN_TAGS, ...custom];
    }, [customTags, t]);

    // Preset colors for custom tags (matching built-in tag style)
    const COLOR_PRESETS = [
        // Outline only (no fill)
        { id: 'outline', color: 'bg-transparent text-foreground border-border', preview: 'border-2 border-muted-foreground' },
        // Filled colors
        { id: 'purple', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
        { id: 'pink', color: 'bg-pink-500/20 text-pink-600 border-pink-500/30' },
        { id: 'indigo', color: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30' },
        { id: 'violet', color: 'bg-violet-500/20 text-violet-600 border-violet-500/30' },
        { id: 'fuchsia', color: 'bg-fuchsia-500/20 text-fuchsia-600 border-fuchsia-500/30' },
        { id: 'cyan', color: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30' },
        { id: 'teal', color: 'bg-teal-500/20 text-teal-600 border-teal-500/30' },
        { id: 'emerald', color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
        { id: 'lime', color: 'bg-lime-500/20 text-lime-600 border-lime-500/30' },
        { id: 'orange', color: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
        { id: 'rose', color: 'bg-rose-500/20 text-rose-600 border-rose-500/30' },
        { id: 'sky', color: 'bg-sky-500/20 text-sky-600 border-sky-500/30' },
        { id: 'slate', color: 'bg-slate-500/20 text-slate-600 border-slate-500/30' },
        { id: 'zinc', color: 'bg-zinc-500/20 text-zinc-600 border-zinc-500/30' },
    ];

    // Tag management state
    const [showTagManager, setShowTagManager] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColorId, setSelectedColorId] = useState('purple');
    const [editingTag, setEditingTag] = useState(null); // { id, label, colorId }


    // Safe access
    // Safe access with useMemo for proper reactivity
    const clientList = useMemo(() => clients || [], [clients]);
    const appointmentList = useMemo(() => appointments || [], [appointments]);

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

        // Apply sorting
        result = [...result].sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '', 'ru');
                    break;
                case 'phone':
                    comparison = (a.phone || '').localeCompare(b.phone || '');
                    break;
                case 'date':
                    comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    break;
                case 'visits':
                    comparison = (b.visits || 0) - (a.visits || 0);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [clientsWithStats, searchQuery, filterTag, sortBy, sortOrder]);

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

    // Add client from modal with animation
    const handleAddFromModal = () => {
        if (!addFormData.name.trim() || !addFormData.phone.trim()) return;
        addClient({
            name: addFormData.name.trim(),
            phone: formatPhoneNumber(addFormData.phone),
            notes: addFormData.notes.trim(),
            tags: addFormData.tags
        });
        setShowAddModal(false);
        setAddFormData({ name: '', phone: '', notes: '', tags: [] });
        setShowAddSuccess(true);
        setTimeout(() => setShowAddSuccess(false), 3000);
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
        setEditFormData({
            id: client.id,
            name: client.name || '',
            phone: client.phone || '',
            notes: client.notes || '',
            tags: client.tags || []
        });
        setShowEditModal(true);
    };

    const saveEdit = () => {
        if (editFormData.id) {
            updateClient(editFormData.id, {
                name: editFormData.name,
                phone: formatPhoneNumber(editFormData.phone),
                notes: editFormData.notes,
                tags: editFormData.tags
            });
            setShowEditModal(false);
            setShowUpdateSuccess(true);
            setTimeout(() => setShowUpdateSuccess(false), 2000);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', phone: '', notes: '', tags: [] });
    };

    // Smart file import handler - detects format automatically
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        setImportError('');

        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        const isCSV = fileName.endsWith('.csv');
        const isVCard = fileName.endsWith('.vcf') || fileName.endsWith('.vcard');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                let contacts = [];

                if (isExcel) {
                    // Excel file - read as array buffer
                    contacts = parseExcel(event.target?.result);
                } else if (isCSV) {
                    // CSV file - read as text
                    contacts = parseCSV(event.target?.result);
                } else if (isVCard) {
                    // vCard file - read as text
                    contacts = parseVCard(event.target?.result);
                } else {
                    // Try to auto-detect based on content
                    const content = event.target?.result;
                    if (typeof content === 'string') {
                        if (content.includes('BEGIN:VCARD')) {
                            contacts = parseVCard(content);
                        } else {
                            contacts = parseCSV(content);
                        }
                    }
                }

                if (contacts.length === 0) {
                    setImportError(t('clients.noContacts') || 'Контакты не найдены');
                } else {
                    setImportContacts(contacts);
                    setSelectedContacts(new Set(contacts.map((_, i) => i)));
                    setShowImportOptions(false);
                    setShowImport(true);
                }
            } catch (err) {
                setImportError(t('clients.importError') || 'Ошибка импорта');
            }
            setImportLoading(false);
        };

        if (isExcel) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
        e.target.value = ''; // Reset input
    };

    // Google Sheets import handler
    const handleGoogleImport = async () => {
        if (!googleUrl.trim()) return;

        const csvUrl = googleSheetToCSV(googleUrl);
        if (!csvUrl) {
            setImportError(t('clients.invalidUrl') || 'Неверная ссылка на Google Sheets');
            return;
        }

        setImportLoading(true);
        setImportError('');

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Fetch failed');

            const csvContent = await response.text();
            const contacts = parseCSV(csvContent);

            if (contacts.length === 0) {
                setImportError(t('clients.noContacts') || 'Контакты не найдены');
            } else {
                setImportContacts(contacts);
                setSelectedContacts(new Set(contacts.map((_, i) => i)));
                setShowImportOptions(false);
                setShowImport(true);
                setGoogleUrl('');
            }
        } catch (err) {
            setImportError(t('clients.googleError') || 'Не удалось загрузить. Убедитесь, что таблица открыта для всех.');
        }
        setImportLoading(false);
    };

    const toggleContactSelection = (index) => {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedContacts(newSelected);
    };

    const toggleAllContacts = () => {
        if (selectedContacts.size === importContacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(importContacts.map((_, i) => i)));
        }
    };

    const isContactDuplicate = (contact) => {
        const phoneDigits = contact.phone?.replace(/\D/g, '') || '';
        return clientList.some(c => {
            const existingDigits = c.phone?.replace(/\D/g, '') || '';
            return phoneDigits && existingDigits && phoneDigits === existingDigits;
        });
    };

    // Count duplicates and deselect them
    const duplicateCount = importContacts.filter(c => isContactDuplicate(c)).length;

    const deselectDuplicates = () => {
        const newSelected = new Set(selectedContacts);
        importContacts.forEach((contact, index) => {
            if (isContactDuplicate(contact)) {
                newSelected.delete(index);
            }
        });
        setSelectedContacts(newSelected);
    };

    const importSelectedContacts = () => {
        let imported = 0;
        importContacts.forEach((contact, index) => {
            if (selectedContacts.has(index) && !isContactDuplicate(contact)) {
                // Use imported tags or default to 'new', merge notes
                const importedTags = contact.tags && contact.tags.length > 0
                    ? contact.tags
                    : ['new'];
                addClient({
                    name: contact.name,
                    phone: formatPhoneNumber(contact.phone),
                    notes: contact.notes || '',
                    tags: importedTags
                });
                imported++;
            }
        });
        setShowImport(false);
        setImportContacts([]);
        setSelectedContacts(new Set());
        if (imported > 0) {
            setSuccessCount(imported);
            setShowSuccess(true);
        }
    };

    // Delete confirmation handlers
    const handleDelete = (client) => {
        setClientToDelete(client);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (clientToDelete) {
            removeClient(clientToDelete.id);
            setShowDeleteConfirm(false);
            setClientToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setClientToDelete(null);
    };

    const getTagInfo = (tagId) => AVAILABLE_TAGS.find(t => t.id === tagId);

    // Create new custom tag with preset color
    const createCustomTag = () => {
        if (!newTagName.trim()) return;
        const selectedPreset = COLOR_PRESETS.find(p => p.id === selectedColorId);
        addCustomTag({
            label: newTagName.trim(),
            colorClass: selectedPreset?.color || COLOR_PRESETS[0].color,
            colorId: selectedColorId
        });
        setNewTagName('');
        setSelectedColorId('purple');
    };

    // Start editing a tag
    const startEditTag = (tag) => {
        setEditingTag({
            id: tag.id,
            label: tag.label,
            colorId: tag.colorId || 'purple'
        });
    };

    // Save edited tag
    const saveEditTag = () => {
        if (!editingTag || !editingTag.label.trim()) return;
        const selectedPreset = COLOR_PRESETS.find(p => p.id === editingTag.colorId);
        updateCustomTag(editingTag.id, {
            label: editingTag.label.trim(),
            colorClass: selectedPreset?.color || COLOR_PRESETS[0].color,
            colorId: editingTag.colorId
        });
        setEditingTag(null);
    };

    // Cancel editing
    const cancelEditTag = () => {
        setEditingTag(null);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Hidden file input - accepts all supported formats */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,.vcard,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    {t('clients.title') || 'База клиентов'}
                </h1>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowImportOptions(true)}>
                        <Upload className="w-4 h-4 mr-1" />
                        {t('clients.import') || 'Импорт'}
                    </Button>
                    <Button size="sm" onClick={() => { setAddFormData({ name: '', phone: '', notes: '', tags: [] }); setShowAddModal(true); }}>
                        <Plus className="w-4 h-4 mr-1" />
                        {t('clients.add') || 'Добавить'}
                    </Button>
                </div>
            </div>

            {/* Import Options Modal */}
            {showImportOptions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 relative">
                        <CardContent className="p-6 space-y-5">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-primary" />
                                    {t('clients.importContacts') || 'Импорт контактов'}
                                </h2>
                                <button
                                    onClick={() => { setShowImportOptions(false); setImportError(''); }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Supported formats hint */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                                    {t('clients.supportedFormats') || 'Поддерживаемые форматы'}:
                                </div>
                                <div className="text-sm text-muted-foreground pl-6 space-y-1">
                                    <p>• <span className="font-medium text-foreground">Excel</span> (.xlsx, .xls)</p>
                                    <p>• <span className="font-medium text-foreground">CSV</span></p>
                                    <p>• <span className="font-medium text-foreground">vCard</span> (.vcf)</p>
                                </div>
                                <p className="text-xs text-muted-foreground pl-6 mt-2">
                                    {t('clients.columnHint') || 'Колонки: Имя/Name, Телефон/Phone'}
                                </p>
                            </div>

                            {/* File Upload Button */}
                            <Button
                                variant="outline"
                                className="w-full h-20 border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importLoading}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-6 h-6 text-primary" />
                                    <span>{t('clients.selectFile') || 'Выбрать файл'}</span>
                                </div>
                            </Button>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground uppercase">{t('common.or') || 'или'}</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            {/* Google Sheets URL input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Link className="w-4 h-4 text-green-600" />
                                    Google Sheets
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('clients.googlePlaceholder') || 'Вставьте ссылку на таблицу...'}
                                        value={googleUrl}
                                        onChange={(e) => setGoogleUrl(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleGoogleImport}
                                        disabled={!googleUrl.trim() || importLoading}
                                    >
                                        {importLoading ? (
                                            <span className="animate-pulse">{t('clients.loading') || '...'}</span>
                                        ) : (
                                            t('clients.loadFromGoogle') || 'Загрузить'
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.googleHint') || 'Таблица должна быть открыта для всех (Файл → Открыть доступ)'}
                                </p>
                            </div>

                            {/* Error message */}
                            {importError && (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {importError}
                                </div>
                            )}

                            {/* Loading overlay */}
                            {importLoading && (
                                <div className="absolute inset-0 bg-card/90 flex flex-col items-center justify-center rounded-lg">
                                    <div className="relative w-16 h-16 mb-4">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="text-sm text-muted-foreground animate-pulse">
                                        {t('clients.processingFile') || 'Обработка файла...'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tag Filters */}
            <div className="flex gap-2 flex-wrap items-center">
                <Button
                    size="sm"
                    variant={filterTag === null ? 'default' : 'outline'}
                    onClick={() => setFilterTag(null)}
                >
                    {t('common.all') || 'Все'} ({clientList.length})
                </Button>
                {AVAILABLE_TAGS.map(tag => {
                    const count = clientList.filter(c => c.tags?.includes(tag.id)).length;
                    const isActive = filterTag === tag.id;
                    return (
                        <Button
                            key={tag.id}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            onClick={() => setFilterTag(isActive ? null : tag.id)}
                            className={isActive ? '' : (tag.color || '')}
                        >
                            {tag.label} ({count})
                        </Button>
                    );
                })}

                {/* Tag Manager Button */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTagManager(true)}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Palette className="w-4 h-4 mr-1" />
                    {t('clients.manageTags') || 'Теги'}
                </Button>
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

            {/* Sort Controls */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('clients.sortBy') || 'Сортировка'}:</span>
                <div className="flex gap-1 flex-wrap">
                    {[
                        { id: 'name', label: t('clients.name') || 'Имя' },
                        { id: 'phone', label: t('clients.phone') || 'Телефон' },
                        { id: 'date', label: t('clients.dateAdded') || 'Дата' },
                        { id: 'visits', label: t('clients.visitsSort') || 'Визиты' },
                    ].map(option => (
                        <Button
                            key={option.id}
                            size="sm"
                            variant={sortBy === option.id ? 'default' : 'ghost'}
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                                if (sortBy === option.id) {
                                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                } else {
                                    setSortBy(option.id);
                                    setSortOrder('asc');
                                }
                            }}
                        >
                            {option.label}
                            {sortBy === option.id && (
                                <ArrowUpDown className={cn('w-3 h-3 ml-1', sortOrder === 'desc' && 'rotate-180')} />
                            )}
                        </Button>
                    ))}
                </div>
            </div>

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
                                            onClick={() => handleDelete(client)}
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

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
                        <CardContent className="p-4 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    {t('clients.importContacts') || 'Импорт контактов'}
                                </h2>
                                <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {importContacts.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    {t('clients.noContacts') || 'Контакты не найдены'}
                                </p>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-3 text-sm">
                                        <button
                                            onClick={toggleAllContacts}
                                            className="text-primary hover:underline"
                                        >
                                            {selectedContacts.size === importContacts.length
                                                ? (t('clients.deselectAll') || 'Снять выбор')
                                                : (t('clients.selectAll') || 'Выбрать все')}
                                        </button>
                                        <span className="text-muted-foreground">
                                            {t('clients.selected') || 'Выбрано'}: {selectedContacts.size} / {importContacts.length}
                                        </span>
                                    </div>

                                    {/* Duplicate warning */}
                                    {duplicateCount > 0 && (
                                        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                                            <div className="flex items-center gap-2 text-amber-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{t('clients.duplicatesFound') || 'Найдено дубликатов'}: {duplicateCount}</span>
                                            </div>
                                            <button
                                                onClick={deselectDuplicates}
                                                className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2 py-1 rounded hover:bg-amber-500/20 transition-colors"
                                            >
                                                {t('clients.skipDuplicates') || 'Пропустить'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                        {importContacts.map((contact, index) => {
                                            const isDuplicate = isContactDuplicate(contact);
                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => toggleContactSelection(index)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer border",
                                                        selectedContacts.has(index)
                                                            ? "border-primary/50 bg-primary/5"
                                                            : "border-border bg-card hover:bg-accent/50",
                                                        isDuplicate && "opacity-60"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center",
                                                        selectedContacts.has(index) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                                                    )}>
                                                        {selectedContacts.has(index) && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{contact.name || 'Без имени'}</p>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {formatPhoneNumber(contact.phone) || 'Без номера'}
                                                        </p>
                                                    </div>
                                                    {isDuplicate && (
                                                        <div className="flex items-center gap-1 text-amber-500 text-xs">
                                                            <AlertCircle className="w-4 h-4" />
                                                            {t('clients.duplicate') || 'Дубликат'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setShowImport(false)}
                                        >
                                            {t('common.cancel') || 'Отмена'}
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={importSelectedContacts}
                                            disabled={selectedContacts.size === 0}
                                        >
                                            {t('clients.importSelected') || 'Импортировать'} ({selectedContacts.size})
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Success Modal with animations */}
            {showSuccess && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={() => setShowSuccess(false)}
                >
                    <div
                        className="bg-card rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Animated checkmark circle */}
                        <div className="relative mx-auto w-20 h-20 mb-6">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                <svg
                                    className="w-10 h-10 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    style={{
                                        strokeDasharray: 50,
                                        strokeDashoffset: 0,
                                        animation: 'checkmark 0.5s ease-in-out forwards'
                                    }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        {/* Confetti particles */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        left: `${50 + (Math.random() - 0.5) * 60}%`,
                                        top: '50%',
                                        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                                        animation: `confetti-${i % 3} 1s ease-out forwards`,
                                        animationDelay: `${i * 0.05}s`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Text */}
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {t('clients.importSuccess') || 'Успешно!'}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {t('clients.imported') || 'Импортировано'}: <span className="font-bold text-primary text-xl">{successCount}</span> {t('clients.contacts') || 'контактов'}
                        </p>

                        {/* Close button */}
                        <Button
                            onClick={() => setShowSuccess(false)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                        >
                            {t('common.great') || 'Отлично!'}
                        </Button>
                    </div>

                    {/* CSS animations for confetti */}
                    <style>{`
                        @keyframes confetti-0 {
                            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                            100% { transform: translate(-40px, -80px) rotate(360deg); opacity: 0; }
                        }
                        @keyframes confetti-1 {
                            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                            100% { transform: translate(40px, -90px) rotate(-360deg); opacity: 0; }
                        }
                        @keyframes confetti-2 {
                            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                            100% { transform: translate(0px, -100px) rotate(180deg); opacity: 0; }
                        }
                        @keyframes checkmark {
                            0% { stroke-dashoffset: 50; }
                            100% { stroke-dashoffset: 0; }
                        }
                    `}</style>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && clientToDelete && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={cancelDelete}
                >
                    <Card
                        className="w-full max-w-sm animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardContent className="p-6 text-center">
                            {/* Warning icon */}
                            <div className="relative mx-auto w-16 h-16 mb-4">
                                <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse" />
                                <div className="relative w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Trash2 className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                {t('clients.deleteTitle') || 'Удалить клиента?'}
                            </h2>

                            {/* Client info */}
                            <div className="bg-muted/50 rounded-lg p-3 mb-4">
                                <p className="font-medium text-foreground">{clientToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">{clientToDelete.phone}</p>
                            </div>

                            {/* Warning text */}
                            <p className="text-sm text-muted-foreground mb-6">
                                {t('clients.deleteWarning') || 'Это действие нельзя отменить'}
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={cancelDelete}
                                >
                                    {t('common.cancel') || 'Отмена'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={confirmDelete}
                                >
                                    {t('common.delete') || 'Удалить'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit Client Modal */}
            {showEditModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={() => setShowEditModal(false)}
                >
                    <Card
                        className="w-full max-w-md animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Edit className="w-5 h-5 text-primary" />
                                    {t('clients.editClient') || 'Редактировать клиента'}
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">{t('clients.name') || 'Имя'}</label>
                                    <Input
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder={t('clients.namePlaceholder') || 'Введите имя'}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">{t('clients.phone') || 'Телефон'}</label>
                                    <Input
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+7 (___) ___-__-__"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">{t('clients.notes') || 'Заметки'}</label>
                                    <Input
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData(p => ({ ...p, notes: e.target.value }))}
                                        placeholder={t('clients.notesPlaceholder') || 'Примечания о клиенте'}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t('clients.tags') || 'Теги'}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {AVAILABLE_TAGS.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    const newTags = editFormData.tags.includes(tag.id)
                                                        ? editFormData.tags.filter(t => t !== tag.id)
                                                        : [...editFormData.tags, tag.id];
                                                    setEditFormData(p => ({ ...p, tags: newTags }));
                                                }}
                                                className={cn(
                                                    'px-3 py-1 rounded-full text-xs border transition-all',
                                                    editFormData.tags.includes(tag.id)
                                                        ? tag.color
                                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                                                )}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    {t('common.cancel') || 'Отмена'}
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={saveEdit}
                                    disabled={!editFormData.name.trim()}
                                >
                                    {t('common.save') || 'Сохранить'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Update Success Toast */}
            {showUpdateSuccess && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">{t('clients.updated') || 'Данные обновлены'}</span>
                    </div>
                </div>
            )}

            {/* Add Client Modal */}
            {showAddModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={() => setShowAddModal(false)}
                >
                    <Card
                        className="w-full max-w-md animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    {t('clients.newClient') || 'Новый клиент'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">{t('clients.name') || 'Имя'} *</label>
                                    <Input
                                        value={addFormData.name}
                                        onChange={(e) => setAddFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder={t('clients.namePlaceholder') || 'Введите имя'}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">{t('clients.phone') || 'Телефон'} *</label>
                                    <Input
                                        value={addFormData.phone}
                                        onChange={(e) => setAddFormData(p => ({ ...p, phone: formatPhoneNumber(e.target.value) }))}
                                        placeholder="+7 (___) ___-__-__"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">{t('clients.notes') || 'Заметки'}</label>
                                    <Input
                                        value={addFormData.notes}
                                        onChange={(e) => setAddFormData(p => ({ ...p, notes: e.target.value }))}
                                        placeholder={t('clients.notesPlaceholder') || 'Примечания о клиенте'}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t('clients.tags') || 'Теги'}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {AVAILABLE_TAGS.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    const newTags = addFormData.tags.includes(tag.id)
                                                        ? addFormData.tags.filter(t => t !== tag.id)
                                                        : [...addFormData.tags, tag.id];
                                                    setAddFormData(p => ({ ...p, tags: newTags }));
                                                }}
                                                className={cn(
                                                    'px-3 py-1 rounded-full text-xs border transition-all',
                                                    addFormData.tags.includes(tag.id)
                                                        ? tag.color
                                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                                                )}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    {t('common.cancel') || 'Отмена'}
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleAddFromModal}
                                    disabled={!addFormData.name.trim() || !addFormData.phone.trim()}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t('clients.add') || 'Добавить'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Success Modal with Confetti */}
            {showAddSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        {/* Confetti Animation - positioned at edges, not over content */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {/* Left side confetti */}
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={`left-${i}`}
                                    className="absolute w-2 h-2 rounded-full opacity-80"
                                    style={{
                                        left: `${5 + i * 3}%`,
                                        top: '-8px',
                                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i],
                                        animation: `fall ${1.5 + i * 0.2}s ease-in forwards`,
                                        animationDelay: `${i * 0.15}s`
                                    }}
                                />
                            ))}
                            {/* Right side confetti */}
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={`right-${i}`}
                                    className="absolute w-2 h-2 rounded-full opacity-80"
                                    style={{
                                        right: `${5 + i * 3}%`,
                                        top: '-8px',
                                        backgroundColor: ['#8b5cf6', '#10b981', '#ec4899', '#3b82f6', '#f59e0b', '#ef4444'][i],
                                        animation: `fall ${1.5 + i * 0.2}s ease-in forwards`,
                                        animationDelay: `${0.1 + i * 0.15}s`
                                    }}
                                />
                            ))}
                        </div>

                        <CardContent className="p-8 text-center relative z-10">
                            {/* Success Icon with Pulse */}
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                                <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-10 h-10 text-white" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{t('clients.addedSuccess') || 'Клиент добавлен!'}</h3>
                            <p className="text-muted-foreground mb-6">{t('clients.addedSuccessDesc') || 'Новый клиент успешно добавлен в базу'}</p>

                            <Button
                                onClick={() => setShowAddSuccess(false)}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                                {t('common.great') || 'Отлично!'}
                            </Button>
                        </CardContent>

                        {/* CSS for fall animation */}
                        <style>{`
                            @keyframes fall {
                                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                                100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
                            }
                        `}</style>
                    </Card>
                </div>
            )}

            {/* Tag Manager Modal */}
            {showTagManager && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={() => setShowTagManager(false)}
                >
                    <Card
                        className="w-full max-w-md animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-primary" />
                                    {t('clients.manageTags') || 'Управление тегами'}
                                </h2>
                                <button
                                    onClick={() => setShowTagManager(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Create new tag */}
                            <div className="space-y-4 mb-6">
                                <label className="text-sm font-medium block">{t('clients.createTag') || 'Создать тег'}</label>

                                {/* Name input */}
                                <Input
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder={t('clients.tagName') || 'Название тега'}
                                />

                                {/* Color palette */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">{t('clients.pickColor') || 'Выберите цвет'}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {COLOR_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setSelectedColorId(preset.id)}
                                                className={cn(
                                                    'w-8 h-8 rounded-full transition-all',
                                                    preset.id === 'outline'
                                                        ? 'border-2 border-dashed border-muted-foreground bg-background'
                                                        : preset.color,
                                                    selectedColorId === preset.id
                                                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                                                        : 'hover:scale-105'
                                                )}
                                                title={preset.id === 'outline' ? (t('clients.noFill') || 'Без заливки') : preset.id}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Preview and create button */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{t('clients.preview') || 'Превью'}:</span>
                                        <span
                                            className={cn(
                                                'px-3 py-1 rounded-full text-xs font-medium border',
                                                COLOR_PRESETS.find(p => p.id === selectedColorId)?.color
                                            )}
                                        >
                                            {newTagName.trim() || '...'}
                                        </span>
                                    </div>
                                    <Button onClick={createCustomTag} disabled={!newTagName.trim()}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        {t('common.add') || 'Добавить'}
                                    </Button>
                                </div>
                            </div>

                            {/* Existing custom tags */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium block">{t('clients.customTags') || 'Ваши теги'}</label>
                                {(customTags || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        {t('clients.noCustomTags') || 'Нет созданных тегов'}
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {(customTags || []).map(tag => (
                                            <div
                                                key={tag.id}
                                                className="p-2 rounded-lg bg-muted/50"
                                            >
                                                {editingTag?.id === tag.id ? (
                                                    // Edit mode
                                                    <div className="space-y-3">
                                                        <Input
                                                            value={editingTag.label}
                                                            onChange={(e) => setEditingTag(prev => ({ ...prev, label: e.target.value }))}
                                                            placeholder={t('clients.tagName') || 'Название тега'}
                                                            className="h-8"
                                                        />
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {COLOR_PRESETS.map(preset => (
                                                                <button
                                                                    key={preset.id}
                                                                    onClick={() => setEditingTag(prev => ({ ...prev, colorId: preset.id }))}
                                                                    className={cn(
                                                                        'w-6 h-6 rounded-full transition-all',
                                                                        preset.id === 'outline'
                                                                            ? 'border-2 border-dashed border-muted-foreground bg-background'
                                                                            : preset.color,
                                                                        editingTag.colorId === preset.id
                                                                            ? 'ring-2 ring-primary ring-offset-1 scale-110'
                                                                            : 'hover:scale-105'
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="outline" onClick={cancelEditTag} className="flex-1">
                                                                {t('common.cancel') || 'Отмена'}
                                                            </Button>
                                                            <Button size="sm" onClick={saveEditTag} className="flex-1" disabled={!editingTag.label.trim()}>
                                                                {t('common.save') || 'Сохранить'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // View mode
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={cn(
                                                                'px-3 py-1 rounded-full text-xs font-medium border',
                                                                tag.colorClass
                                                            )}
                                                        >
                                                            {tag.label}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7"
                                                                onClick={() => startEditTag(tag)}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                                onClick={() => removeCustomTag(tag.id)}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Close button */}
                            <Button
                                variant="outline"
                                className="w-full mt-6"
                                onClick={() => setShowTagManager(false)}
                            >
                                {t('common.close') || 'Закрыть'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default ClientList;
