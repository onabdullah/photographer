import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, Button,
    Modal, FormLayout, TextField, BlockStack, InlineStack, Divider, Box, 
    IndexFilters, useSetIndexFiltersMode, useIndexResourceState, Icon
} from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';
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
     * Setup drag & drop for new ticket modal
     */
    const handleNewTicketDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (newTicketDragRef.current) {
            newTicketDragRef.current.style.backgroundColor = '#f0f0f0';
            newTicketDragRef.current.style.borderColor = '#0071e3';
        }
    };

    const handleNewTicketDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (newTicketDragRef.current) {
            newTicketDragRef.current.style.backgroundColor = 'transparent';
            newTicketDragRef.current.style.borderColor = '#ccc';
        }
    };

    const handleNewTicketDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (newTicketDragRef.current) {
            newTicketDragRef.current.style.backgroundColor = 'transparent';
            newTicketDragRef.current.style.borderColor = '#ccc';
        }
        if (e.dataTransfer.files) {
            handleNewTicketFileSelect(Array.from(e.dataTransfer.files));
        }
    };

    /**
     * Setup drag & drop for reply area
     */
    const handleReplyDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (replyDragRef.current) {
            replyDragRef.current.style.backgroundColor = '#f0f0f0';
            replyDragRef.current.style.borderColor = '#0071e3';
        }
    };

    const handleReplyDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (replyDragRef.current) {
            replyDragRef.current.style.backgroundColor = 'transparent';
            replyDragRef.current.style.borderColor = '#ccc';
        }
    };

    const handleReplyDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (replyDragRef.current) {
            replyDragRef.current.style.backgroundColor = 'transparent';
            replyDragRef.current.style.borderColor = '#ccc';
        }
        if (e.dataTransfer.files) {
            handleReplyFileSelect(Array.from(e.dataTransfer.files));
        }
    };

    /**
     * Remove an attachment from new ticket
     */
    const removeNewTicketAttachment = (id) => {
        setNewTicketAttachments(prev => prev.filter(att => att.id !== id));
    };

    /**
     * Remove an attachment from reply
     */
    const removeReplyAttachment = (id) => {
        setReplyAttachments(prev => prev.filter(att => att.id !== id));
    };

    const submitTicket = useCallback(() => {
        if (!newSubject.trim() || !newMessage.trim()) return;
        setIsSubmitting(true);
        
        const attachmentIds = newTicketAttachments.map(a => a.id);
        
        router.post(route('shopify.support.store'), {
            subject: newSubject,
            message: newMessage,
            attachment_ids: attachmentIds,
        }, {
            onSuccess: () => {
                setIsSubmitting(false);
                setIsNewTicketOpen(false);
                setNewSubject('');
                setNewMessage('');
                setNewTicketAttachments([]);
            },
            onError: (err) => { 
                console.error("Submit error", err); 
                setIsSubmitting(false); 
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    }, [newSubject, newMessage, newTicketAttachments]);

    const activeTicketId = activeTicket?.id;
    const lastMessageIdRef = useRef(null);

    // Update ref whenever messages change
    useEffect(() => {
        if (activeTicket?.messages?.length > 0) {
            lastMessageIdRef.current = activeTicket.messages[activeTicket.messages.length - 1].id;
        } else {
            lastMessageIdRef.current = null;
        }
    }, [activeTicket?.messages]);

    const fetchMessages = useCallback(async () => {
        if (!activeTicketId) return;
        try {
            const url = new URL(`/shopify/support/tickets/${activeTicketId}/poll`, window.location.origin);
            
            // Send after_id to only fetch new messages
            if (lastMessageIdRef.current) {
                url.searchParams.set('after_id', lastMessageIdRef.current);
            }

            // Ensure fresh session token before polling
            if (window.shopify && typeof window.shopify.idToken === 'function') {
                try {
                    const token = await window.shopify.idToken();
                    if (token) window.sessionToken = token;
                } catch (e) {
                    console.warn('[Support] Failed to refresh session token:', e);
                }
            }

            const res = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    ...(window.sessionToken ? { 'Authorization': `Bearer ${window.sessionToken}` } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setActiveTicket(prev => {
                        if (!prev) return prev;
                        // Append new messages to existing ones, avoiding duplicates if any
                        const existingIds = new Set(prev.messages?.map(m => m.id) || []);
                        const newMessages = data.messages.filter(m => !existingIds.has(m.id));
                        
                        return { 
                            ...prev, 
                            messages: [...(prev.messages || []), ...newMessages], 
                            unread_count: data.unread_count_cleared ? 0 : prev.unread_count 
                        };
                    });
                } else if (data.unread_count_cleared) {
                    setActiveTicket(prev => {
                        if (!prev) return prev;
                        return { ...prev, unread_count: 0 };
                    });
                }
            }
        } catch (err) {
            console.error("Polled messages fail", err);
        }
    }, [activeTicketId]);

    // Realtime connection state & Fallback Mode
    const [syncMode, setSyncMode] = useState(syncSettings?.realtime_enabled ? 'live' : 'manual');

    // Manage Realtime lifecycle & Fallback thresholds
    useEffect(() => {
        if (!syncSettings?.realtime_enabled) {
            setSyncMode('manual');
            return;
        }

        setSyncMode('live');
        let fallbackTimer = null;
        let recoveryTimer = null;

        const handleSuccess = () => {
            setSyncMode(prev => {
                if (prev === 'manual' && syncSettings?.auto_return_realtime) {
                    if (!recoveryTimer) {
                        recoveryTimer = setTimeout(() => {
                           setSyncMode('live');
                        }, (syncSettings?.recovery_threshold_seconds || 20) * 1000);
                    }
                    return 'manual'; 
                }
                return 'live';
            });
            if (fallbackTimer) clearTimeout(fallbackTimer);
        };

        const handleError = () => {
            if (recoveryTimer) { clearTimeout(recoveryTimer); recoveryTimer = null; }
            if (syncSettings?.auto_fallback_enabled) {
                 if (!fallbackTimer) {
                     fallbackTimer = setTimeout(() => {
                         setSyncMode('manual');
                     }, (syncSettings?.fallback_threshold_seconds || 20) * 1000);
                 }
            } else {
                 setSyncMode('live'); 
            }
        };

        // Realtime connection logic
        let reconnectAttempts = 0;
        let channel = null;

        const setupEcho = () => {
            if (!window.Echo) {
                handleError();
                return;
            }

            // Provide app bridge token for private channel auth
            if (window.sessionToken) {
                window.Echo.connector.options.auth = {
                    headers: {
                        Authorization: `Bearer ${window.sessionToken}`,
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                };
                window.Echo.connector.options.authEndpoint = '/shopify/broadcasting/auth';
            }

            handleSuccess();

            // Only subscribe if we have an active ticket open
            if (activeTicketId) {
                // leave old channel if exists
                if (channel) {
                    window.Echo.leave(`chat.${activeTicketId}`);
                }
                
                channel = window.Echo.private(`chat.${activeTicketId}`)
                    .listen('.message.new', (e) => {
                        console.log("New message via Reverb:", e);
                        setActiveTicket(prev => {
                            if (!prev || prev.id !== activeTicketId) return prev;
                            const exists = prev.messages.find(m => m.id === e.id);
                            if (exists) return prev;
                            return { ...prev, messages: [...prev.messages, e] };
                        });
                        scrollToBottom();
                    });
            }
        };

        const timer = setTimeout(() => {
            try {
                setupEcho();
            } catch (err) {
                handleError();
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            if (recoveryTimer) clearTimeout(recoveryTimer);
            if (activeTicketId && window.Echo) {
                window.Echo.leave(`chat.${activeTicketId}`);
            }
        };
    }, [syncSettings, setSyncMode, activeTicketId]);

    useEffect(() => {
        let intervalTime = (syncSettings?.manual_refresh_interval_seconds || 12) * 1000;
        let interval;
        if (activeTicketId && syncMode === 'manual') {
            fetchMessages(); // Fetch immediately to mark as read
            interval = setInterval(fetchMessages, intervalTime);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTicketId, syncSettings?.manual_refresh_interval_seconds, syncMode, fetchMessages]);

    // Global tickets refresh for the merchant list view
    useEffect(() => {
        if (syncMode === 'live') return; // Only poll if in manual fallback mode
        let intervalTime = (syncSettings?.manual_refresh_interval_seconds || 12) * 1000;
        const interval = setInterval(async () => {
            if (window.shopify && typeof window.shopify.idToken === 'function') {
                try {
                    const token = await window.shopify.idToken();
                    if (token) window.sessionToken = token;
                } catch (e) {
                    console.warn('[Support] App Bridge token error:', e);
                }
            }
            router.reload({ only: ['tickets'], preserveState: true, preserveScroll: true });
        }, intervalTime);
        return () => clearInterval(interval);
    }, [syncSettings?.manual_refresh_interval_seconds, syncMode]);

    const submitReply = useCallback(() => {
        if (!replyMessage.trim() || !activeTicket) return;
        setIsSubmitting(true);
        
        const attachmentIds = replyAttachments.map(a => a.id);
        
        router.post(route('shopify.support.reply', activeTicket.id), {
            message: replyMessage,
            attachment_ids: attachmentIds,
        }, {
            onSuccess: (page) => {
                setIsSubmitting(false);
                setReplyMessage('');
                setReplyAttachments([]);
                // Refresh active ticket from new props
                const updated = page.props.tickets.find(t => t.id === activeTicket.id);
                if (updated) setActiveTicket(updated);
            },
            onError: (err) => { 
                console.error("Reply error", err); 
                setIsSubmitting(false); 
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    }, [replyMessage, activeTicket, replyAttachments]);

    // Helpers
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <Badge tone="success">Active</Badge>;
            case 'waiting': return <Badge tone="warning">Waiting on us</Badge>;
            case 'ended': return <Badge tone="info">Resolved</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleString(undefined, { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    };

    /**
     * Render attachment list for UI display
     */
    const AttachmentList = ({ attachments, onRemove, isLoading }) => {
        if (!attachments.length && !isLoading) return null;
        
        return (
            <Box
                borderColor="border"
                borderRadius="200"
                borderWidth="1px"
                padding="300"
                marginBlockStart="200"
            >
                <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="semibold">
                        Attachments ({attachments.length})
                    </Text>
                    {attachments.map((attachment) => (
                        <InlineStack
                            key={attachment.id}
                            align="space-between"
                            blockAlign="center"
                            gap="200"
                        >
                            <Text variant="bodySm" truncate>
                                📎 {attachment.filename} ({(attachment.file_size / 1024).toFixed(2)} KB)
                            </Text>
                            <Button
                                variant="plain"
                                size="slim"
                                icon={DeleteIcon}
                                onClick={() => onRemove(attachment.id)}
                                disabled={isLoading}
                            />
                        </InlineStack>
                    ))}
                    {isLoading && (
                        <Text variant="bodySm" color="subdued">
                            Uploading attachment...
                        </Text>
                    )}
                </BlockStack>
            </Box>
        );
    };

    /**
     * Render message attachments
     */
    const MessageAttachments = ({ attachments }) => {
        if (!attachments || !attachments.length) return null;
        
        return (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {attachments.map((attachment) => (
                    <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            color: 'inherit'
                        }}
                    >
                        📎 {attachment.filename}
                    </a>
                ))}
            </div>
        );
    };

    if (activeTicket) {
        // Filter out internal notes completely for the merchant view
        const publicMessages = activeTicket.messages.filter(m => !m.is_internal_note);

        return (
            <ShopifyLayout title={`Ticket #${activeTicket.id}`}>
                <Page 
                    backAction={{content: 'Support', onAction: () => setActiveTicket(null)}}
                    title={activeTicket.subject}
                    titleMetadata={
                        <InlineStack gap="200" blockAlign="center">
                            {getStatusBadge(activeTicket.status)}
                            {syncSettings?.show_status_badge_customers !== false && (
                                <Badge tone={syncMode === 'live' ? 'success' : 'info'}>
                                    {syncMode === 'live' ? 'Live' : 'Polling'}
                                </Badge>
                            )}
                        </InlineStack>
                    }
                    primaryAction={{
                        content: 'Refresh Thread',
                        onAction: fetchMessages,
                        disabled: syncMode === 'live'
                    }}
                >
                    <Layout>
                        <Layout.Section>
                            <Card padding="400">
                                <BlockStack gap="400">
                                    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {publicMessages.map((msg) => {
                                            const isMerchant = msg.sender_type === 'merchant' || msg.sender_type === 'customer';
                                            const isSystem = msg.sender_type === 'system';

                                            if (isSystem) {
                                                return (
                                                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                                                        <span style={{ fontSize: '12px', color: '#6d7175', backgroundColor: '#f4f6f8', padding: '4px 12px', borderRadius: '12px' }}>
                                                            {msg.body}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: isMerchant ? 'flex-end' : 'flex-start',
                                                        marginBottom: '4px'
                                                    }}
                                                >
                                                    <div 
                                                        style={{
                                                            maxWidth: '85%',
                                                            backgroundColor: isMerchant ? '#1a1a1a' : '#f1f2f4',
                                                            color: isMerchant ? '#ffffff' : '#202223',
                                                            borderRadius: '16px',
                                                            borderBottomRightRadius: isMerchant ? '4px' : '16px',
                                                            borderBottomLeftRadius: !isMerchant ? '4px' : '16px',
                                                            padding: '12px 16px',
                                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                    >
                                                        <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>
                                                                {isMerchant 
                                                                    ? 'You' 
                                                                    : (activeTicket.status === 'active' && msg.sender_name) 
                                                                        ? msg.sender_name 
                                                                        : 'Support Team'}
                                                            </span>
                                                            <span style={{ fontSize: '11px', opacity: 0.8 }}>
                                                                {formatDate(msg.created_at)}
                                                            </span>
                                                        </div>
                                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.4' }}>{msg.body}</div>
                                                        <MessageAttachments attachments={msg.attachments} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {publicMessages.length === 0 && (
                                            <Text alignment="center" color="subdued">No messages yet.</Text>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {activeTicket.status !== 'ended' && (
                                        <Box paddingBlockStart="400" borderBlockStartWidth="025" borderColor="border">
                                            <FormLayout>
                                                <div
                                                    ref={replyDragRef}
                                                    onDragOver={handleReplyDragOver}
                                                    onDragLeave={handleReplyDragLeave}
                                                    onDrop={handleReplyDrop}
                                                    style={{
                                                        border: '1px dashed #ccc',
                                                        borderRadius: '4px',
                                                        padding: '12px',
                                                        marginBottom: '12px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <TextField
                                                        value={replyMessage}
                                                        onChange={setReplyMessage}
                                                        multiline={3}
                                                        autoComplete="off"
                                                        placeholder="Type your reply here... (Drag files to attach)"
                                                    />
                                                </div>
                                                <AttachmentList 
                                                    attachments={replyAttachments}
                                                    onRemove={removeReplyAttachment}
                                                    isLoading={uploadingReplyAttachment}
                                                />
                                                <InlineStack align="end">
                                                    <Button 
                                                        variant="primary" 
                                                        onClick={submitReply} 
                                                        loading={isSubmitting || uploadingReplyAttachment}
                                                        disabled={!replyMessage.trim() || uploadingReplyAttachment}
                                                    >
                                                        Send Reply
                                                    </Button>
                                                </InlineStack>
                                            </FormLayout>
                                        </Box>
                                    )}
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    </Layout>
                </Page>
            </ShopifyLayout>
        );
    }

    return (
        <ShopifyLayout title="Support">
            <Page
                title="Support Center"
                primaryAction={{
                    content: 'Open New Ticket',
                    onAction: () => setIsNewTicketOpen(true),
                }}
                secondaryActions={[
                    {
                        content: 'Refresh',
                        onAction: () => {
                            router.reload({ only: ['tickets'], preserveState: true, preserveScroll: true });
                        },
                    }
                ]}
            >
                <Layout>
                    <Layout.Section>
                        <Card padding="0">
                            <IndexFilters
                                sortOptions={[]}
                                sortSelected={[]}
                                onSort={() => {}}
                                tabs={itemStrings.map((item, index) => ({
                                    content: item,
                                    id: item,
                                    isLocked: index === 0,
                                }))}
                                selected={selected}
                                onSelect={handleTabChange}
                                canCreateNewView={false}
                                mode={mode}
                                setMode={setMode}
                                cancelAction={{
                                    onAction: () => {},
                                    disabled: false,
                                    loading: false,
                                }}
                                filters={[]}
                                appliedFilters={[]}
                                onClearAll={() => {}}
                            />
                            <ResourceList
                                resourceName={{ singular: 'ticket', plural: 'tickets' }}
                                items={tickets}
                                emptyState={
                                    <Box padding="400">
                                        <BlockStack inlineAlign="center" gap="400">
                                            <Text alignment="center" as="p">
                                                No tickets found in this view.
                                            </Text>
                                            <Button onClick={() => setIsNewTicketOpen(true)}>
                                                Create your first ticket
                                            </Button>
                                        </BlockStack>
                                    </Box>
                                }
                                renderItem={(item) => {
                                    const { id, subject, status, preview, updated_at, unread_count } = item;
                                    return (
                                        <ResourceItem
                                            id={id}
                                            onClick={() => setActiveTicket(item)}
                                            accessibilityLabel={`View details for ${subject}`}
                                        >
                                            <InlineStack align="space-between" blockAlign="start">
                                                <BlockStack gap="100">
                                                    <InlineStack gap="200" blockAlign="center">
                                                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                            {subject}
                                                        </Text>
                                                        {unread_count > 0 && (
                                                            <span style={{ 
                                                                backgroundColor: '#d82c0d', 
                                                                color: '#fff', 
                                                                fontSize: '11px', 
                                                                fontWeight: 'bold', 
                                                                padding: '2px 6px', 
                                                                borderRadius: '10px' 
                                                            }}>
                                                                {unread_count} new
                                                            </span>
                                                        )}
                                                    </InlineStack>
                                                    <Text variant="bodySm" color="subdued" as="p" truncate>
                                                        {preview || 'No messages yet.'}
                                                    </Text>
                                                </BlockStack>
                                                <BlockStack align="end" gap="100" inlineAlign="end">
                                                    {getStatusBadge(status)}
                                                    <Text variant="bodySm" color="subdued" as="span">
                                                        {formatDate(updated_at)}
                                                    </Text>
                                                </BlockStack>
                                            </InlineStack>
                                        </ResourceItem>
                                    );
                                }}
                            />
                        </Card>
                    </Layout.Section>
                </Layout>

                {/* New Ticket Modal */}
                <Modal
                    open={isNewTicketOpen}
                    onClose={() => setIsNewTicketOpen(false)}
                    title="Open a Support Ticket"
                    primaryAction={{
                        content: isSubmitting ? 'Submitting...' : 'Submit Ticket',
                        onAction: submitTicket,
                        disabled: isSubmitting || !newSubject.trim() || !newMessage.trim() || uploadingNewTicketAttachment,
                        loading: isSubmitting,
                    }}
                    secondaryActions={[
                        {
                            content: 'Cancel',
                            onAction: () => setIsNewTicketOpen(false),
                            disabled: isSubmitting,
                        },
                    ]}
                >
                    <Modal.Section>
                        <FormLayout>
                            <TextField
                                label="Subject"
                                value={newSubject}
                                onChange={setNewSubject}
                                autoComplete="off"
                                error={errors?.subject}
                                placeholder="E.g., Issue with generating product backgrounds"
                            />
                            <div
                                ref={newTicketDragRef}
                                onDragOver={handleNewTicketDragOver}
                                onDragLeave={handleNewTicketDragLeave}
                                onDrop={handleNewTicketDrop}
                                style={{
                                    border: '1px dashed #ccc',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <TextField
                                    label="Describe your issue"
                                    value={newMessage}
                                    onChange={setNewMessage}
                                    multiline={5}
                                    autoComplete="off"
                                    error={errors?.message}
                                    placeholder="Please provide as much detail as possible... (Drag files to attach)"
                                />
                            </div>
                            <AttachmentList 
                                attachments={newTicketAttachments}
                                onRemove={removeNewTicketAttachment}
                                isLoading={uploadingNewTicketAttachment}
                            />
                        </FormLayout>
                    </Modal.Section>
                </Modal>
            </Page>
        </ShopifyLayout>
    );
}
