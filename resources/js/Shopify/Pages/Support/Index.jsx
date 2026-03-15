import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, Button,
    Modal, FormLayout, TextField, BlockStack, InlineStack, Divider, Box, 
    IndexFilters, useSetIndexFiltersMode, useIndexResourceState
} from '@shopify/polaris';
import { usePage, router } from '@inertiajs/react';
import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';

export default function Support() {
    const { tickets, filters, errors, syncSettings } = usePage().props;
    
    // UI States
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active ticket view
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
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

    const submitTicket = useCallback(() => {
        if (!newSubject.trim() || !newMessage.trim()) return;
        setIsSubmitting(true);
        router.post(route('shopify.support.store'), {
            subject: newSubject,
            message: newMessage,
        }, {
            onSuccess: () => {
                setIsSubmitting(false);
                setIsNewTicketOpen(false);
                setNewSubject('');
                setNewMessage('');
            },
            onError: (err) => { 
                console.error("Submit error", err); 
                setIsSubmitting(false); 
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    }, [newSubject, newMessage]);

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
        const interval = setInterval(() => {
            router.reload({ only: ['tickets'], preserveState: true, preserveScroll: true });
        }, intervalTime);
        return () => clearInterval(interval);
    }, [syncSettings?.manual_refresh_interval_seconds, syncMode]);

    const submitReply = useCallback(() => {
        if (!replyMessage.trim() || !activeTicket) return;
        setIsSubmitting(true);
        router.post(route('shopify.support.reply', activeTicket.id), {
            message: replyMessage,
        }, {
            onSuccess: (page) => {
                setIsSubmitting(false);
                setReplyMessage('');
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
    }, [replyMessage, activeTicket]);

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
                                                <TextField
                                                    value={replyMessage}
                                                    onChange={setReplyMessage}
                                                    multiline={3}
                                                    autoComplete="off"
                                                    placeholder="Type your reply here..."
                                                />
                                                <InlineStack align="end">
                                                    <Button 
                                                        variant="primary" 
                                                        onClick={submitReply} 
                                                        loading={isSubmitting}
                                                        disabled={!replyMessage.trim()}
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
                        disabled: isSubmitting || !newSubject.trim() || !newMessage.trim(),
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
                            <TextField
                                label="Describe your issue"
                                value={newMessage}
                                onChange={setNewMessage}
                                multiline={5}
                                autoComplete="off"
                                error={errors?.message}
                                placeholder="Please provide as much detail as possible..."
                            />
                        </FormLayout>
                    </Modal.Section>
                </Modal>
            </Page>
        </ShopifyLayout>
    );
}
