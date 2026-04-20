import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const AdminSemesters = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]       = useState({
        term: 'Spring', year: new Date().getFullYear() + 1,
        start_date: '', end_date: '',
        registration_open: '', registration_close: '',
        add_drop_deadline: '', status: 'Upcoming'
    });
    const [opMsg, setOpMsg] = useState('');
    const [opErr, setOpErr] = useState('');

    const fetchAll = async () => {
        setLoading(true); setError('');
        try {
            const r = await api.get('/semesters');
            setItems(r.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load semesters.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        setOpMsg(''); setOpErr('');
        try {
            await api.post('/semesters', form);
            setOpMsg('Semester created.');
            setShowForm(false);
            fetchAll();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Creation failed.');
        }
    };

    const changeStatus = async (id, status) => {
        if (status === 'Active' && !window.confirm('Setting this semester Active will mark any other Active semester Completed. Continue?')) return;
        try {
            await api.patch(`/semesters/${id}/status`, { status });
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed.');
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            {opMsg && <div className="alert alert-success">{opMsg}</div>}
            {opErr && <div className="alert alert-error">{opErr}</div>}

            <div className="card">
                <div className="card-header">
                    <h3>Semesters</h3>
                    <button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'New Semester'}
                    </button>
                </div>
                {showForm && (
                    <form onSubmit={submit}>
                        <div className="form-row">
                            <label className="field">
                                <span>Term<span className="req">*</span></span>
                                <select
                                    value={form.term}
                                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                                >
                                    <option>Fall</option><option>Spring</option><option>Summer</option>
                                </select>
                            </label>
                            <label className="field">
                                <span>Year<span className="req">*</span></span>
                                <input
                                    type="number" min="2020" max="2100"
                                    value={form.year}
                                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                                />
                            </label>
                            <label className="field">
                                <span>Initial status</span>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option>Upcoming</option><option>Active</option><option>Completed</option>
                                </select>
                            </label>
                        </div>
                        <div className="form-row">
                            <label className="field">
                                <span>Start date</span>
                                <input type="date" value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                            </label>
                            <label className="field">
                                <span>End date</span>
                                <input type="date" value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                            </label>
                        </div>
                        <div className="form-row">
                            <label className="field">
                                <span>Registration open</span>
                                <input type="date" value={form.registration_open}
                                    onChange={(e) => setForm({ ...form, registration_open: e.target.value })} />
                            </label>
                            <label className="field">
                                <span>Registration close</span>
                                <input type="date" value={form.registration_close}
                                    onChange={(e) => setForm({ ...form, registration_close: e.target.value })} />
                            </label>
                            <label className="field">
                                <span>Add/Drop deadline</span>
                                <input type="date" value={form.add_drop_deadline}
                                    onChange={(e) => setForm({ ...form, add_drop_deadline: e.target.value })} />
                            </label>
                        </div>
                        <button type="submit">Create Semester</button>
                    </form>
                )}

                {items.length === 0 ? (
                    <EmptyState title="No semesters configured" />
                ) : (
                    <div className="table-wrap" style={{ marginTop: 20 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Term</th><th>Year</th>
                                    <th>Dates</th>
                                    <th>Registration</th>
                                    <th>Add/Drop</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(s => (
                                    <tr key={s.semester_id}>
                                        <td>{s.term}</td>
                                        <td>{s.year}</td>
                                        <td>{s.start_date?.slice(0,10)} → {s.end_date?.slice(0,10)}</td>
                                        <td>{s.registration_open?.slice(0,10)} → {s.registration_close?.slice(0,10)}</td>
                                        <td>{s.add_drop_deadline?.slice(0,10)}</td>
                                        <td>
                                            <span className={`badge badge-${s.status === 'Active' ? 'success' : s.status === 'Upcoming' ? 'info' : 'neutral'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                defaultValue={s.status}
                                                onChange={(e) => changeStatus(s.semester_id, e.target.value)}
                                            >
                                                <option>Upcoming</option>
                                                <option>Active</option>
                                                <option>Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminSemesters;
