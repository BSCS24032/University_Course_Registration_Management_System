import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const Announcements = () => {
    const { user } = useContext(AuthContext);
    const canPost = user.role === 'Admin' || user.role === 'Instructor';

    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    // Compose form state
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: '', body: '', audience: 'All', target_id: '',
        expires_at: '', is_pinned: false
    });
    const [opMsg, setOpMsg] = useState('');
    const [opErr, setOpErr] = useState('');
    const [busy, setBusy]   = useState(false);

    const [instructorSections, setInstructorSections] = useState([]);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get('/announcements');
            setItems(r.data.data || []);
            if (user.role === 'Instructor') {
                try {
                    const s = await api.get('/instructors/me/sections');
                    setInstructorSections(s.data.data || []);
                } catch { /* ignore */ }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load announcements.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setOpMsg(''); setOpErr('');

        if (!form.title.trim())   return setOpErr('Title is required.');
        if (!form.body.trim())    return setOpErr('Body is required.');
        if (form.title.length > 200) return setOpErr('Title must be 200 characters or fewer.');
        if (['Program', 'Section', 'Department'].includes(form.audience) && !form.target_id) {
            return setOpErr(`target_id is required for '${form.audience}' audience.`);
        }

        setBusy(true);
        try {
            await api.post('/announcements', {
                ...form,
                target_id: form.target_id ? Number(form.target_id) : null,
                expires_at: form.expires_at || null,
            });
            setOpMsg('Announcement posted.');
            setForm({ title: '', body: '', audience: 'All', target_id: '', expires_at: '', is_pinned: false });
            setShowForm(false);
            fetchAll();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Post failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            setItems(items.filter(a => a.announcement_id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.');
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            {opMsg && <div className="alert alert-success">{opMsg}</div>}
            {opErr && <div className="alert alert-error">{opErr}</div>}

            {canPost && (
                <div className="card">
                    <div className="card-header">
                        <h3>Notice Board</h3>
                        <button onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel' : 'New Announcement'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit}>
                            <label className="field">
                                <span>Title<span className="req">*</span></span>
                                <input
                                    type="text"
                                    maxLength={200}
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </label>
                            <label className="field">
                                <span>Body<span className="req">*</span></span>
                                <textarea
                                    rows={4}
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                />
                            </label>
                            <div className="form-row">
                                <label className="field">
                                    <span>Audience<span className="req">*</span></span>
                                    <select
                                        value={form.audience}
                                        onChange={(e) => setForm({ ...form, audience: e.target.value, target_id: '' })}
                                    >
                                        {user.role === 'Admin' ? (
                                            <>
                                                <option>All</option>
                                                <option>Students</option>
                                                <option>Instructors</option>
                                                <option>Program</option>
                                                <option>Department</option>
                                                <option>Section</option>
                                            </>
                                        ) : (
                                            <option>Section</option>
                                        )}
                                    </select>
                                </label>
                                {['Program', 'Section', 'Department'].includes(form.audience) && (
                                    <label className="field">
                                        <span>Target {form.audience} ID<span className="req">*</span></span>
                                        {form.audience === 'Section' && user.role === 'Instructor' ? (
                                            <select
                                                value={form.target_id}
                                                onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                                            >
                                                <option value="">-- choose --</option>
                                                {instructorSections.map(s => (
                                                    <option key={s.section_id} value={s.section_id}>
                                                        {s.course_code} ({s.semester} {s.year})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="number"
                                                value={form.target_id}
                                                onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                                            />
                                        )}
                                    </label>
                                )}
                                <label className="field">
                                    <span>Expires (optional)</span>
                                    <input
                                        type="date"
                                        value={form.expires_at}
                                        onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                                    />
                                </label>
                            </div>
                            {user.role === 'Admin' && (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 15 }}>
                                    <input
                                        type="checkbox"
                                        checked={form.is_pinned}
                                        onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                                    />
                                    Pin to top
                                </label>
                            )}
                            <div>
                                <button type="submit" disabled={busy}>
                                    {busy ? 'Posting...' : 'Post Announcement'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {items.length === 0 ? (
                <EmptyState title="Nothing to see here" message="No announcements yet." />
            ) : (
                items.map(a => (
                    <div key={a.announcement_id} className="card">
                        <div className="flex-between">
                            <div>
                                <h3 style={{ margin: '0 0 4px', color: 'var(--primary-dark)' }}>
                                    {a.is_pinned && <span className="badge badge-info" style={{ marginRight: 6 }}>PINNED</span>}
                                    {a.title}
                                </h3>
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                    {a.audience}{a.target_id ? ` · #${a.target_id}` : ''} ·
                                    Posted {new Date(a.posted_at).toLocaleString()} by {a.posted_by_email}
                                </div>
                            </div>
                            {(user.role === 'Admin' || user.id === a.posted_by_user_id) && (
                                <button
                                    className="btn-secondary btn-sm"
                                    onClick={() => handleDelete(a.announcement_id)}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{a.body}</div>
                    </div>
                ))
            )}
        </Layout>
    );
};

export default Announcements;
