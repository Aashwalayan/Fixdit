import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';

interface NotificationsPanelProps {
  token: string;
  notifications: any[];
  fetchNotifications: () => Promise<void>;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ token, notifications, setNotifications, fetchNotifications, }) => {
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  setLoading(true);

  fetchNotifications().finally(() => {
    setLoading(false);
  });
}, [token]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Notifications</p>
          <h3 className="text-xl font-black text-slate-950 mt-1">Recent activity</h3>
        </div>
        <button onClick={markAllRead} className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-500 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <Bell className="w-5 h-5 mx-auto mb-2 text-slate-300" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification._id}
              onClick={() => markRead(notification._id)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                notification.readAt ? 'bg-white border-slate-200' : 'bg-orange-50 border-orange-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                </div>
                {!notification.readAt && <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
