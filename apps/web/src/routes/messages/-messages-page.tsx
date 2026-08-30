import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { apiGet, apiPost } from '../../lib/api/request';
import { toast } from 'sonner';
import type { Message } from '@danta/schemas';

const CHANNEL_OPTIONS = [
  { value: '', label: 'All channels' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    sent: 'default',
    delivered: 'default',
    failed: 'destructive',
    read: 'default',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

export function MessagesPage() {
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['messages', search, channel, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (channel) params.set('channel', channel);
      if (status) params.set('status', status);
      const response = await apiGet<{ messages: Message[] }>(`/messages?${params.toString()}`);
      return response;
    },
  });

  const handleSend = async () => {
    if (!recipient || !messageBody.trim()) return;
    setSending(true);
    try {
      await apiPost('/communication/send', { recipient, body: messageBody, channel: 'sms' });
      toast.success('Message sent');
      setMessageBody('');
      setRecipient('');
      refetch();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Communication history</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load messages</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Communication history</p>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium">Send Message</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Recipient phone or email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Message..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSend} loading={sending} disabled={sending || !recipient || !messageBody.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {CHANNEL_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.messages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              data?.messages?.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.recipient}</TableCell>
                  <TableCell className="max-w-md truncate">{msg.body}</TableCell>
                  <TableCell className="capitalize">{msg.channel}</TableCell>
                  <TableCell>{getStatusBadge(msg.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {msg.sentAt ? new Date(msg.sentAt).toLocaleString('en-AU') : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
