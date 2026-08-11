import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

export const Route = createFileRoute('/patient-portal/notifications/')({
  component: PatientPortalNotifications,
});

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function PatientPortalNotifications() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['patient-portal', 'notifications'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<Notification[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Notifications</h1>
      </div>
      {!notifications || notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No notifications found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Message</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications.map((n) => (
                <tr key={n.id} className={`hover:bg-muted/20 ${!n.read ? 'bg-muted/10' : ''}`}>
                  <td className="px-4 py-3">{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{n.title}</td>
                  <td className="px-4 py-3">{n.message}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${n.read ? 'bg-gray-100 text-gray-800' : 'bg-primary/10 text-primary'}`}>
                      {n.read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
