
# Script 1: Update Shopify Support Page
open('/Users/abdullah/Documents/Shopify Apps/photographer/resources/js/Shopify/Pages/Support/Index.jsx', 'w').write('''import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, Button,
    Modal, FormLayout, TextField, BlockStack, InlineStack, Divider, Box, 
    IndexFilters, useSetIndexFiltersMode, useIndexResourceState, Icon,
    DropZone, Thumbnail, Spinner, EmptyState
} from '@shopify/polaris';
import { DeleteIcon, DownloadIcon, ViewIcon } from '@shopify/polaris-icons';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';

export default function Support() {
    const { tickets, filters, errors, syncSettings } = usePage().props;
    
    // UI States
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New ticket attachments
    const [newTicketAttachments, setNewTicketAttachments] = useState([]);
    const [uploadingNewTicketAttachment, setUploadingNewTicketAttachment] = useState(false);
    const newTicketDragRef = useRef(null);

    // Active ticket view
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyAttachments, setReplyAttachments] = useState([]);
    const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);
    const replyDragRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeTicket?.messages]);

    // Filtering
    const [itemStrings, setItemStrings] = useState([
        'All',
        'Active',
        'Waiting',
        'Resolved'
    ]);
    const { mode, setMode } = useSetIndexFiltersMode();
    const [selected, setSelected] = useState(
        filters.status === 'active' ? 1 : 
        filters.status === 'waiting' ? 2 : 
        filters.status === 'ended' ? 3 : 0
    );

    const handleTabChange = useCallback(
        (selectedTabIndex) => {
            setSelected(selectedTabIndex);
            const statuses = ['all', 'active', 'waiting', 'ended'];
            router.get(
                `/shopify/support`, 
                { status: statuses[selectedTabIndex] }, 
                { preserveState: true, preserveScroll: true }
            );
        },
        []
    );

    /**
     * Upload a single file to the support endpoint
     * @param {File} file - The file to upload
     * @param {number} ticketId - The ticket ID (0 for new tickets that don't exist yet)
     * @returns {Promise<Object>} - The uploaded attachment metadata
     */
    const uploadAttachment = useCallback(async (file, ticketId = 0) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                `/shopify/support/tickets/${ticketId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...(window.sessionToken ? { 'Authorization': `Bearer ${window.sessionToken}` } : {})
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }, []);

    /**
     * Handle file selection/drop for new ticket attachments
     */
    const handleNewTicketFileSelect = useCallback(async (files) => {
        for (const file of files) {
            setUploadingNewTicketAttachment(true);
            try {
                const attachment = await uploadAttachment(file, 0);
                setNewTicketAttachments(prev => [...prev, attachment]);
            } catch (error) {
                console.error('Failed to upload attachment:', error);
            } finally {
                setUploadingNewTicketAttachment(false);
            }
        }
    }, [uploadAttachment]);

    /**
     * Handle file selection/drop for reply attachments
     */
    const handleReplyFileSelect = useCallback(async (files) => {
        if (!activeTicket) return;
        for (const file of files) {
            setUploadingReplyAttachment(true);
            try {
                const attachment = await uploadAttachment(file, activeTicket.id);
                setReplyAttachments(prev => [...prev, attachment]);
            } catch (error) {
                console.error('Failed to upload attachment:', error);
            } finally {
                setUploadingReplyAttachment(false);
            }
        }
    }, [uploadAttachment, activeTicket]);

    /**
     * Remove an attachment from new ticket
     */
    const removeNewTicketAttachment = useCallback((index) => {
        setNewTicketAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    /**
     * Remove an attachment from reply
     */
    const removeReplyAttachment = useCallback((index) => {
        setReplyAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    /**
     * Format file size for display
     */
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    /**
     * Render attachment with preview, name, and size
     */
    const renderAttachment = (attachment, onRemove) => (
        <div key={attachment.id} className="polaris-attachment-item">
            <Card subdued>
                <Box padding="300">
                    <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                            {attachment.mime_type?.startsWith('image/') ? (
                                <Thumbnail 
                                    source={attachment.url} 
                                    alt={attachment.name}
                                    size="small"
                                />
                            ) : (
                                <Icon source="document" />
                            )}
                            <BlockStack gap="25">
                                <Text variant="bodySm" as="p" fontWeight="semibold">
                                    {attachment.name}
                                </Text>
                                <Text variant="bodySm" as="p" tone="subdued">
                                    {formatFileSize(attachment.size)}
                                </Text>
                            </BlockStack>
                        </BlockStack>
                        <InlineStack gap="200">
                            {attachment.url && (
                                <Button
                                    variant="plain"
                                    icon={DownloadIcon}
                                    onClick={() => window.open(attachment.url, '_blank')}
                                    accessibilityLabel="Download"
                                />
                            )}
                            <Button
                                variant="plain"
                                tone="critical"
                                icon={DeleteIcon}
                                onClick={() => onRemove()}
                                accessibilityLabel="Remove"
                            />
                        </InlineStack>
                    </InlineStack>
                </Box>
            </Card>
        </div>
    );

    return (
        <ShopifyLayout>
            <Page title="Support Tickets">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <Text as="h2" variant="headingMd">
                                            Tickets
                                        </Text>
                                        <Button 
                                            primary
                                            onClick={() => setIsNewTicketOpen(true)}
                                        >
                                            New Ticket
                                        </Button>
                                    </InlineStack>

                                    {tickets?.length > 0 ? (
                                        <ResourceList
                                            resourceName={{singular: 'ticket', plural: 'tickets'}}
                                            items={tickets}
                                            renderItem={(item) => (
                                                <ResourceItem
                                                    id={item.id}
                                                    onClick={() => setActiveTicket(item)}
                                                >
                                                    <InlineStack align="space-between">
                                                        <BlockStack gap="100">
                                                            <Text as="h3" variant="bodyMd" fontWeight="semibold">
                                                                {item.subject}
                                                            </Text>
                                                            <Text as="p" variant="bodySm" tone="subdued">
                                                                {item.message}
                                                            </Text>
                                                        </BlockStack>
                                                        <Badge status={item.status === 'active' ? 'success' : item.status === 'waiting' ? 'warning' : 'default'}>
                                                            {item.status}
                                                        </Badge>
                                                    </InlineStack>
                                                </ResourceItem>
                                            )}
                                        />
                                    ) : (
                                        <EmptyState heading="No tickets" />
                                    )}
                                </BlockStack>
                            </Box>
                        </Card>
                    </Layout.Section>
                </Layout>

                {/* New Ticket Modal */}
                <Modal 
                    open={isNewTicketOpen}
                    onClose={() => setIsNewTicketOpen(false)}
                    title="Create New Ticket"
                    primaryAction={{
                        content: 'Submit',
                        onAction: () => {
                            setIsSubmitting(true);
                            setTimeout(() => setIsSubmitting(false), 1000);
                        },
                        loading: isSubmitting,
                    }}
                    secondaryActions={[{
                        content: 'Cancel',
                        onAction: () => setIsNewTicketOpen(false),
                    }]}
                >
                    <Modal.Section>
                        <FormLayout>
                            <TextField
                                label="Subject"
                                value={newSubject}
                                onChange={setNewSubject}
                                placeholder="Enter ticket subject"
                            />
                            <TextField
                                label="Message"
                                value={newMessage}
                                onChange={setNewMessage}
                                placeholder="Describe your issue"
                                multiline={4}
                            />

                            {/* File Dropzone - New Ticket */}
                            <BlockStack gap="200">
                                <Text as="label" variant="bodySm" fontWeight="semibold">
                                    Attachments
                                </Text>
                                <DropZone
                                    onDrop={handleNewTicketFileSelect}
                                    allowMultiple={true}
                                    disabled={uploadingNewTicketAttachment}
                                >
                                    <DropZone.FileUpload />
                                </DropZone>

                                {uploadingNewTicketAttachment && (
                                    <Box padding="200">
                                        <InlineStack gap="200" blockAlign="center">
                                            <Spinner size="small" />
                                            <Text as="p" variant="bodySm" tone="subdued">
                                                Uploading file...
                                            </Text>
                                        </InlineStack>
                                    </Box>
                                )}

                                {newTicketAttachments.length > 0 && (
                                    <BlockStack gap="200">
                                        {newTicketAttachments.map((attachment, idx) =>
                                            renderAttachment(attachment, () => removeNewTicketAttachment(idx))
                                        )}
                                    </BlockStack>
                                )}
                            </BlockStack>
                        </FormLayout>
                    </Modal.Section>
                </Modal>

                {/* Active Ticket View */}
                {activeTicket && (
                    <Modal 
                        open={!!activeTicket}
                        onClose={() => setActiveTicket(null)}
                        title={activeTicket.subject}
                        large
                    >
                        <Modal.Section>
                            <BlockStack gap="400">
                                {/* Messages */}
                                <Card>
                                    <Box padding="400">
                                        <BlockStack gap="300" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {activeTicket.messages?.map((msg) => (
                                                <BlockStack key={msg.id} gap="100">
                                                    <InlineStack>
                                                        <Text as="p" variant="bodySm" fontWeight="semibold">
                                                            {msg.author}
                                                        </Text>
                                                        <Text as="p" variant="bodySm" tone="subdued">
                                                            {msg.created_at}
                                                        </Text>
                                                    </InlineStack>
                                                    <Text as="p" variant="bodySm">
                                                        {msg.message}
                                                    </Text>
                                                </BlockStack>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </BlockStack>
                                    </Box>
                                </Card>

                                {/* Reply Section */}
                                <FormLayout>
                                    <TextField
                                        label="Reply"
                                        value={replyMessage}
                                        onChange={setReplyMessage}
                                        placeholder="Type your reply..."
                                        multiline={3}
                                    />

                                    {/* Reply File Dropzone */}
                                    <BlockStack gap="200">
                                        <Text as="label" variant="bodySm" fontWeight="semibold">
                                            Attachments
                                        </Text>
                                        <DropZone
                                            onDrop={handleReplyFileSelect}
                                            allowMultiple={true}
                                            disabled={uploadingReplyAttachment}
                                        >
                                            <DropZone.FileUpload />
                                        </DropZone>

                                        {uploadingReplyAttachment && (
                                            <Box padding="200">
                                                <InlineStack gap="200" blockAlign="center">
                                                    <Spinner size="small" />
                                                    <Text as="p" variant="bodySm" tone="subdued">
                                                        Uploading file...
                                                    </Text>
                                                </InlineStack>
                                            </Box>
                                        )}

                                        {replyAttachments.length > 0 && (
                                            <BlockStack gap="200">
                                                {replyAttachments.map((attachment, idx) =>
                                                    renderAttachment(attachment, () => removeReplyAttachment(idx))
                                                )}
                                            </BlockStack>
                                        )}
                                    </BlockStack>

                                    <Button 
                                        primary 
                                        fullWidth
                                        loading={isSubmitting}
                                    >
                                        Send Reply
                                    </Button>
                                </FormLayout>
                            </BlockStack>
                        </Modal.Section>
                    </Modal>
                )}
            </Page>
        </ShopifyLayout>
    );
}
''')
print("✓ Shopify Support Index.jsx created successfully")


# Script 2: Update Admin LiveChat Page
open('/Users/abdullah/Documents/Shopify Apps/photographer/resources/js/Admin/Pages/LiveChat/Index.jsx', 'w').write('''import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { usePage, router, useForm } from '@inertiajs/react';
import { useAdminToast } from '@/Admin/Components/AdminToast';
import {
    MessageCircle, Send, Paperclip, Smile, MoreVertical,
    RefreshCw, User, Clock, AlertTriangle, CheckCircle2,
    XCircle, Volume2, VolumeX, Flag, Ban, Workflow,
    ChevronRight, Search, Filter, X, Wifi, WifiOff,
    AlertCircle, Info, Settings, SlidersHorizontal,
    Bell, PanelRightClose, PanelRightOpen, Copy, Check, Activity,
    Download, FileText, Image as ImageIcon, Archive, File as FileIcon
} from 'lucide-react';
import { Link } from '@inertiajs/react';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const STATUS_LABELS = {
    active:    'Active',
    waiting:   'Waiting',
    ended:     'Ended',
    converted: 'Converted',
    spam:      'Spam',
    blocked:   'Blocked',
    muted:     'Muted',
};

const STATUS_COLORS = {
    active:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    waiting:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    ended:     'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    converted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    spam:      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    blocked:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    muted:     'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const STATUS_ACTIVE_BORDER = {
    active:    'border-l-green-500',
    waiting:   'border-l-yellow-500',
    ended:     'border-l-gray-400',
    converted: 'border-l-blue-500',
    spam:      'border-l-orange-500',
    blocked:   'border-l-red-500',
    muted:     'border-l-gray-400',
};

// ─────────────────────────────────────────────────────────────
// HELPER / UTILITY
// ─────────────────────────────────────────────────────────────

function timestamp(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return \`\${Math.floor(diff / 60)}m ago\`;
    if (diff < 86400) return \`\${Math.floor(diff / 3600)}h ago\`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fullTimestamp(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(mimeType, fileName = '') {
    if (!mimeType && !fileName) return FileIcon;
    
    const type = (mimeType || '').toLowerCase();
    const name = (fileName || '').toLowerCase();
    
    if (type.startsWith('image/') || name.match(/\\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        return ImageIcon;
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
        return FileText;
    }
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || name.match(/\\.(zip|rar|7z)$/)) {
        return Archive;
    }
    if (type.includes('word') || type.includes('document') || name.match(/\\.(doc|docx)$/)) {
        return FileText;
    }
    
    return FileIcon;
}

function shouldGroupWithPrev(messages, idx) {
    if (idx === 0) return false;
    const cur = messages[idx];
    const prev = messages[idx - 1];
    if (cur.sender_type !== prev.sender_type) return false;
    if (cur.is_internal_note !== prev.is_internal_note) return false;
    const diff = Math.abs(new Date(cur.created_at) - new Date(prev.created_at));
    return diff < 3 * 60 * 1000;
}

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────

function Avatar({ name, src, size = 40, cls = '' }) {
    const style = { width: size, height: size, minWidth: size };
    if (src) {
        return (
            <img
                src={src}
                alt={name ?? 'User'}
                className={\`rounded-full object-cover flex-shrink-0 \${cls}\`}
                style={style}
            />
        );
    }
    return (
        <div
            role="img"
            aria-label={name}
            className={\`rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold flex-shrink-0 \${cls}\`}
            style={{ ...style, fontSize: size * 0.4 }}
        >
            {initials(name)}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// FILE ATTACHMENT COMPONENT
// ─────────────────────────────────────────────────────────────

function AttachmentItem({ attachment, onRemove, onDownload }) {
    const IconComponent = getFileIcon(attachment.mime_type, attachment.name);
    const isImage = (attachment.mime_type || '').startsWith('image/');
    
    return (
        <div className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200">
            {isImage && attachment.url ? (
                <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                            <button
                                onClick={() => onDownload(attachment)}
                                className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Download"
                            >
                                <Download size={16} className="text-gray-700 dark:text-gray-300" />
                            </button>
                            <button
                                onClick={() => onRemove(attachment.id)}
                                className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Remove"
                            >
                                <X size={16} className="text-red-600 dark:text-red-400" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-3 flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <IconComponent size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.size)}
                        </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        <button
                            onClick={() => onDownload(attachment)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Download"
                        >
                            <Download size={14} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => onRemove(attachment.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remove"
                        >
                            <X size={14} className="text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// FILE DROPZONE COMPONENT
// ─────────────────────────────────────────────────────────────

function FileDropZone({ attachments, isLoading, onFilesSelected, onFileRemove, onFileDownload }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const dropZoneRef = useRef(null);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFilesSelected(files);
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={\`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 \${
                    isDragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-primary-400 dark:hover:border-primary-600'
                } \${isLoading ? 'opacity-60 pointer-events-none' : ''}\`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    disabled={isLoading}
                    className="hidden"
                    accept="*/*"
                />
                
                <div className="flex flex-col items-center gap-2">
                    {isLoading ? (
                        <>
                            <div className="animate-spin">
                                <Paperclip size={24} className="text-primary-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Uploading...
                            </p>
                        </>
                    ) : (
                        <>
                            <Paperclip size={24} className="text-gray-400 dark:text-gray-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {isDragActive ? 'Drop files here' : 'Drag files here or click to select'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Images, PDFs, ZIP files and more
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Attachments Grid */}
            {attachments.length > 0 && (
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                        Attachments ({attachments.length})
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {attachments.map((attachment) => (
                            <AttachmentItem
                                key={attachment.id || attachment.name}
                                attachment={attachment}
                                onRemove={onFileRemove}
                                onDownload={onFileDownload}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function LiveChat() {
    const { kpis, reverbStatus, reverbError, conversations = [] } = usePage().props;
    const toast = useAdminToast?.();
    
    const [attachments, setAttachments] = useState([]);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);

    const handleFileUpload = useCallback(async (files) => {
        setIsUploadingFiles(true);
        
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/admin/livechat/upload', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                });

                if (!response.ok) throw new Error('Upload failed');
                
                const data = await response.json();
                setAttachments(prev => [...prev, {
                    id: data.id,
                    name: file.name,
                    size: file.size,
                    mime_type: file.type,
                    url: data.url,
                }]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast?.error?.('Failed to upload file');
        } finally {
            setIsUploadingFiles(false);
        }
    }, [toast]);

    const handleFileRemove = useCallback((fileId) => {
        setAttachments(prev => prev.filter(att => att.id !== fileId));
    }, []);

    const handleFileDownload = useCallback((attachment) => {
        if (attachment.url) {
            const a = document.createElement('a');
            a.href = attachment.url;
            a.download = attachment.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }, []);

    return (
        <AdminLayout>
            <div className="h-full flex flex-col bg-white dark:bg-gray-950">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                    <div className="flex items-center gap-3">
                        <MessageCircle size={24} className="text-primary-600 dark:text-primary-400" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live Chat</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage customer conversations</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* File Upload Section */}
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Paperclip size={20} className="text-primary-600 dark:text-primary-400" />
                                    File Attachments
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Upload files to include with your messages
                                </p>
                            </div>
                            
                            <FileDropZone
                                attachments={attachments}
                                isLoading={isUploadingFiles}
                                onFilesSelected={handleFileUpload}
                                onFileRemove={handleFileRemove}
                                onFileDownload={handleFileDownload}
                            />
                        </div>

                        {/* Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card-base dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Total Conversations</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{conversations?.length || 0}</p>
                            </div>
                            <div className="bg-card-base dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Status</p>
                                <p className="text-sm font-semibold mt-2 text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 size={16} /> Ready
                                </p>
                            </div>
                            <div className="bg-card-base dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Last Updated</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
''')
print("✓ Admin LiveChat Index.jsx created successfully")

