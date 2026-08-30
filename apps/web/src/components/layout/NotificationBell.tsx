import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@danta/ui/popover';
import { ScrollArea } from '@danta/ui/scroll-area';
import { Skeleton } from '@danta/ui/skeleton';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from '../../lib/api/notifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications(),
    enabled: open,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    await refresh();
  };

  const handleMarkOne = async (id: string) => {
    await markNotificationAsRead(id);
    await refresh();
  };

  const count = unreadQuery.data?.count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}>
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={count === 0} className="h-8 gap-1.5 text-xs">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {listQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (listQuery.data?.data.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="divide-y">
              {listQuery.data!.data.slice(0, 15).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => !notification.readAt && handleMarkOne(notification.id)}
                  className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted ${notification.readAt ? '' : 'bg-primary/5'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {!notification.readAt && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
                    {notification.title}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
