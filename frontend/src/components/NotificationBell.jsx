import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    // Poll unread count every 30 seconds
    useEffect(() => {
        let mounted = true;
        const fetchCount = async () => {
            try {
                const r = await api.get('/notifications/unread-count');
                if (mounted) setUnread(r.data.data.unread || 0);
            } catch { /* silent — bell will just stay at 0 */ }
        };
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const toggle = async () => {
        if (!open) {
            setLoading(true);
            try {
                const r = await api.get('/notifications');
                setItems(r.data.data || []);
            } catch { setItems([]); }
            setLoading(false);
        }
        setOpen(o => !o);
    };

    const handleItemClick = async (n) => {
        try {
            if (!n.is_read) await api.patch(`/notifications/${n.notification_id}/read`);
            setItems(prev => prev.map(i =>
                i.notification_id === n.notification_id ? { ...i, is_read: true } : i
            ));
            setUnread(u => Math.max(0, u - (n.is_read ? 0 : 1)));
        } catch { /* noop */ }
        setOpen(false);
        if (n.link) navigate(n.link);
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setItems(prev => prev.map(i => ({ ...i, is_read: true })));
            setUnread(0);
        } catch { /* noop */ }
    };

    const formatTime = (t) => {
        const d = new Date(t);
        const diffMs = Date.now() - d.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="bell-wrap" ref={ref}>
            <button className="bell-btn" onClick={toggle} aria-label="Notifications">
                &#x1F514;
                {unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
            </button>
            {open && (
                <div className="bell-dropdown">
                    <div className="bell-header">
                        <span>Notifications</span>
                        {items.some(i => !i.is_read) && (
                            <button onClick={markAllRead}>Mark all read</button>
                        )}
                    </div>
                    {loading && <div className="loading"><div className="spinner"/></div>}
                    {!loading && items.length === 0 && (
                        <div className="empty-state" style={{ padding: 25 }}>
                            <em>No notifications yet.</em>
                        </div>
                    )}
                    {!loading && items.map(n => (
                        <div
                            key={n.notification_id}
                            className={`notif-item ${n.is_read ? '' : 'unread'}`}
                            onClick={() => handleItemClick(n)}
                        >
                            <div className="title">{n.title}</div>
                            <div className="body">{n.body}</div>
                            <div className="time">{formatTime(n.created_at)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
