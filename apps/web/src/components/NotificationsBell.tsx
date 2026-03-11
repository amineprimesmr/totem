'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsBell() {
  const [count, setCount] = useState(0);
  const [list, setList] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCount = () => {
    api<{ count: number }>('/notifications/unread-count')
      .then((r) => setCount(r.count))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api<Notification[]>('/notifications')
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [open]);

  const markAsRead = (id: string) => {
    api(`/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => {
        setList((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
        setCount((c) => Math.max(0, c - 1));
      })
      .catch(() => {});
  };

  const markAllRead = () => {
    api('/notifications/read-all', { method: 'POST' })
      .then(() => {
        setList((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
        setCount(0);
      })
      .catch(() => {});
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 relative transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-totem-accent text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Notifications</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-totem-accent hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-500 text-sm">Chargement…</div>
              ) : list.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Aucune notification</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {list.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.link || '#'}
                        onClick={() => {
                          if (!n.readAt) markAsRead(n.id);
                          setOpen(false);
                        }}
                        className={`block px-4 py-3 hover:bg-slate-50 transition ${!n.readAt ? 'bg-totem-accent/10' : ''}`}
                      >
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
