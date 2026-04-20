import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const Notifications = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [filter, setFilter]   = useState('all');
    const navigate = useNavigate();

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get('/notifications');
            setItems(r.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load notifications.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setItems(items.map(i => i.notification_id === id ? { ...i, is_read: true } : i));
        } catch { /* noop */ }
    };

    const markAllRead = async () => {
        await api.patch('/notifications/read-all');
        setItems(items.map(i => ({ ...i, is_read: true })));
    };

    const deleteOne = async (id) => {
        await api.delete(`/notifications/${id}`);
        setItems(items.filter(i => i.notification_id !== id));
    };

    const filtered = filter === 'unread'
        ? items.filter(i => !i.is_read)
        : filter === 'read'
            ? items.filter(i => i.is_read)
            : items;

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            <div className="card">
                <div className="card-header">
                    <h3>Inbox</h3>
                    <div className="row gap-10">
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">All ({items.length})</option>
                            <option value="unread">Unread ({items.filter(i => !i.is_read).length})</option>
                            <option value="read">Read</option>
                        </select>
                        {items.some(i => !i.is_read) && (
                            <button className="btn-secondary btn-sm" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState title="Nothing here" message="You're all caught up." />
                ) : (
                    filtered.map(n => (
                        <div
                            key={n.notification_id}
                            style={{
                                padding: '14px 18px',
                                marginBottom: 8,
                                borderLeft: `3px solid ${n.is_read ? '#ccc' : 'var(--primary)'}`,
                                background: n.is_read ? 'var(--surface)' : '#f5f8fc',
                                borderRadius: 4,
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div className="flex-between">
                                <div style={{ flex: 1, cursor: n.link ? 'pointer' : 'default' }}
                                     onClick={() => {
                                         if (!n.is_read) markRead(n.notification_id);
                                         if (n.link) navigate(n.link);
                                     }}
                                >
                                    <div style={{ marginBottom: 4 }}>
                                        <span className={`badge badge-${
                                            n.type === 'Fee' ? 'danger' :
                                            n.type === 'Grade' ? 'success' :
                                            n.type === 'Announcement' ? 'info' :
                                            n.type === 'Waitlist' ? 'warning' : 'neutral'
                                        }`}>{n.type}</span>
                                        <strong style={{ marginLeft: 8 }}>{n.title}</strong>
                                    </div>
                                    <div>{n.body}</div>
                                    <div className="text-muted" style={{ fontSize: 11, marginTop: 5 }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="row gap-10">
                                    {!n.is_read && (
                                        <button
                                            className="btn-secondary btn-sm"
                                            onClick={() => markRead(n.notification_id)}
                                        >
                                            Mark read
                                        </button>
                                    )}
                                    <button
                                        className="btn-danger btn-sm"
                                        onClick={() => deleteOne(n.notification_id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
};

export default Notifications;
