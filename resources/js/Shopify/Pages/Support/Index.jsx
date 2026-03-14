import React, { useState, useCallback } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, Button,
    Modal, FormLayout, TextField, BlockStack, InlineStack, Divider, Box, 
    IndexFilters, useSetIndexFiltersMode, useIndexResourceState
} from '@shopify/polaris';
import { usePage, router } from '@inertiajs/react';
import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';

export default function Support() {
    const { tickets, filters } = usePage().props;
    
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
            router.get('/shopify/support', { status: statuses[selectedTabIndex] }, { preserveState: true });
        },
        []
    );

    const submitTicket = useCallback(() => {
        if (!newSubject.trim() || !newMessage.trim()) return;
        setIsSubmitting(true);
        router.post('/shopify/support/tickets', {
            subject: newSubject,
            message: newMessage,
        }, {
            onSuccess: () => {
                setIsSubmitting(false);
                setIsNewTicketOpen(false);
                setNewSubject('');
                setNewMessage('');
            },
            onError: () => setIsSubmitting(false)
        });
    }, [newSubject, newMessage]);

    const submitReply = useCallback(() => {
        if (!replyMessage.trim() || !activeTicket) return;
        setIsSubmitting(true);
        router.post(`/shopify/support/tickets/${activeTicket.id}/reply`, {
            message: replyMessage,
        }, {
            onSuccess: (page) => {
                setIsSubmitting(false);
                setReplyMessage('');
                // Refresh active ticket from new props
                const updated = page.props.tickets.find(t => t.id === activeTicket.id);
                if (updated) setActiveTicket(updated);
            },
            onError: () => setIsSubmitting(false)
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
        return (
            <ShopifyLayout title={`Ticket #${activeTicket.id}`}>
                <Page 
                    backAction={{content: 'Support', onAction: () => setActiveTicket(null)}}
                    title={activeTicket.subject}
                    titleMetadata={getStatusBadge(activeTicket.status)}
                >
                    <Layout>
                        <Layout.Section>
                            <BlockStack gap="400">
                                {activeTicket.messages.map((msg) => (
                                    <Card key={msg.id}>
                                        <BlockStack gap="200">
                                            <InlineStack align="space-between">
                                                <Text variant="headingSm" as="h3">
                                                    {msg.sender_type === 'merchant' || msg.sender_type === 'customer' ? 'You' : 'Support Team'}
                                                </Text>
                                                <Text color="subdued" as="span">{formatDate(msg.created_at)}</Text>
                                            </InlineStack>
                                            <Text as="p" variant="bodyMd">{msg.body}</Text>
                                        </BlockStack>
                                    </Card>
                                ))}

                                {activeTicket.status !== 'ended' && (
                                    <Box paddingBlockStart="400">
                                        <Card>
                                            <BlockStack gap="400">
                                                <Text variant="headingMd" as="h2">Reply</Text>
                                                <FormLayout>
                                                    <TextField
                                                        value={replyMessage}
                                                        onChange={setReplyMessage}
                                                        multiline={4}
                                                        autoComplete="off"
                                                        placeholder="Write your message here..."
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
                                            </BlockStack>
                                        </Card>
                                    </Box>
                                )}
                            </BlockStack>
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
                        content: 'Submit Ticket',
                        onAction: submitTicket,
                        loading: isSubmitting,
                    }}
                    secondaryActions={[
                        {
                            content: 'Cancel',
                            onAction: () => setIsNewTicketOpen(false),
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
                                placeholder="E.g., Issue with generating product backgrounds"
                            />
                            <TextField
                                label="Describe your issue"
                                value={newMessage}
                                onChange={setNewMessage}
                                multiline={5}
                                autoComplete="off"
                                placeholder="Please provide as much detail as possible..."
                            />
                        </FormLayout>
                    </Modal.Section>
                </Modal>
            </Page>
        </ShopifyLayout>
    );
}
