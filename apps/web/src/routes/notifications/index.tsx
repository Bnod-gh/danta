import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, Check } from 'lucide-react';

export const Route = createFileRoute('/notifications/')({
  component: NotificationsPage,
});

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const res = await fetch(`/api/v1/notifications?read=${filter === 'unread' ? 'false' : ''}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<Notification[]>;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">View and manage notifications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'border'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'unread' ? 'bg-primary text-primary-foreground' : 'border'}`}
          >
            Unread
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {notifications?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y">
              {notifications?.map((n) => (
                <div key={n.id} className={`p-4 hover:bg-muted/20 ${!n.readAt ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{n.title}</p>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {!n.readAt && (
                      <button
                        onClick={() => markAsReadMutation.mutate(n.id)}
                        className="p-2 hover:bg-muted rounded"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
