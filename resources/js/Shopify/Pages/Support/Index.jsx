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
            const params = new URLSearchParams(window.location.search); params.set('status', statuses[selectedTabIndex]); router.get(`/shopify/support?${params.toString()}`, { preserveState: true });
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

    const fetchMessages = useCallback(async () => {
        if (!activeTicket) return;
        try {
            const url = new URL(`/shopify/support/tickets/${activeTicket.id}/poll`, window.location.origin);
            url.search = window.location.search; // keep shopify token
            const res = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    ...(window.sessionToken ? { 'Authorization': `Bearer ${window.sessionToken}` } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setActiveTicket(prev => ({ ...prev, messages: data.messages }));
                }
            }
        } catch (err) {
            console.error("Polled messages fail", err);
        }
    }, [activeTicket]);

    useEffect(() => {
        let interval;
        if (activeTicket && syncSettings?.realtime_enabled) {
            interval = setInterval(fetchMessages, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTicket, syncSettings?.realtime_enabled, fetchMessages]);

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
                    titleMetadata={getStatusBadge(activeTicket.status)}
                    primaryAction={{
                        content: 'Refresh Thread',
                        onAction: fetchMessages,
                        disabled: syncSettings?.realtime_enabled
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
                                                                {isMerchant ? 'You' : 'Support Team'}
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
                                    const { id, subject, status, preview, updated_at } = item;
                                    return (
                                        <ResourceItem
                                            id={id}
                                            onClick={() => setActiveTicket(item)}
                                            accessibilityLabel={`View details for ${subject}`}
                                        >
                                            <InlineStack align="space-between" blockAlign="start">
                                                <BlockStack gap="100">
                                                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                        {subject}
                                                    </Text>
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
