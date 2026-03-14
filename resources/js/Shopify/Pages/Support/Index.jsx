import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, Button,
    Modal, FormLayout, TextField, BlockStack, InlineStack, Divider, Box, 
    IndexFilters, useSetIndexFiltersMode, useIndexResourceState
} from '@shopify/polaris';
import { usePage, router } from '@inertiajs/react';
import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';

export default function Support() {
    const { tickets, filters, errors } = usePage().props;
    
    // UI States
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uiModalRef = useRef(null);

    useEffect(() => {
        const el = uiModalRef.current;
        if (!el) return;
        if (isNewTicketOpen) el.show?.(); else el.hide?.();
    }, [isNewTicketOpen]);

    useEffect(() => {
        const el = uiModalRef.current;
        if (!el) return;
        const onHide = () => setIsNewTicketOpen(false);
        el.addEventListener('hide', onHide);
        return () => el.removeEventListener('hide', onHide);
    }, []);

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
        router.post(`/shopify/support/tickets${window.location.search}`, {
            subject: newSubject,
            message: newMessage,
        }, {
            headers: window.sessionToken ? { Authorization: `Bearer ${window.sessionToken}` } : {},
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

    const submitReply = useCallback(() => {
        if (!replyMessage.trim() || !activeTicket) return;
        setIsSubmitting(true);
        router.post(`/shopify/support/tickets/${activeTicket.id}/reply${window.location.search}`, {
            message: replyMessage,
        }, {
            headers: window.sessionToken ? { Authorization: `Bearer ${window.sessionToken}` } : {},
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
                >
                    <Layout>
                        <Layout.Section>
                            <Card padding="400">
                                <BlockStack gap="400">
                                    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {publicMessages.map((msg) => {
                                            const isMerchant = msg.sender_type === 'merchant' || msg.sender_type === 'customer';
                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    style={{
                                                        alignSelf: isMerchant ? 'flex-end' : 'flex-start',
                                                        maxWidth: '80%',
                                                        backgroundColor: isMerchant ? 'var(--p-color-bg-surface-brand)' : 'var(--p-color-bg-surface-secondary)',
                                                        color: isMerchant ? 'var(--p-color-text-brand-on-bg-fill)' : 'var(--p-color-text)',
                                                        borderRadius: '12px',
                                                        borderBottomRightRadius: isMerchant ? '2px' : '12px',
                                                        borderBottomLeftRadius: !isMerchant ? '2px' : '12px',
                                                        padding: '12px 16px',
                                                    }}
                                                >
                                                    <BlockStack gap="100">
                                                        <InlineStack align="space-between" gap="400">
                                                            <Text variant="headingSm" as="h3" tone={isMerchant ? "textInverse" : undefined}>
                                                                {isMerchant ? 'You' : 'Support Team'}
                                                            </Text>
                                                            <Text variant="bodyXs" as="span" tone={isMerchant ? "textInverse" : "subdued"}>
                                                                {formatDate(msg.created_at)}
                                                            </Text>
                                                        </InlineStack>
                                                        <span style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{msg.body}</span>
                                                    </BlockStack>
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
                <ui-modal ref={uiModalRef} id="new-ticket-modal">
                    <div style={{ padding: '16px' }}>
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
                    </div>
                    <ui-title-bar title="Open a Support Ticket">
                        <button variant="primary" onClick={submitTicket} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                        <button onClick={() => setIsNewTicketOpen(false)}>Cancel</button>
                    </ui-title-bar>
                </ui-modal>
            </Page>
        </ShopifyLayout>
    );
}
