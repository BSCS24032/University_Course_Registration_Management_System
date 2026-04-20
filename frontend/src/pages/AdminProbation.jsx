import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const AdminProbation = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [q, setQ]             = useState('');

    const fetchAll = async () => {
        setLoading(true); setError('');
        try {
            const r = await api.get('/admin/probation');
            setItems(r.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load probation list.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const filtered = items.filter(p =>
        !q.trim() ||
        p.student_name.toLowerCase().includes(q.toLowerCase()) ||
        p.email.toLowerCase().includes(q.toLowerCase()) ||
        p.program_name.toLowerCase().includes(q.toLowerCase())
    );

    const critical = items.filter(i => i.standing === 'Critical').length;
    const probation = items.filter(i => i.standing === 'Probation').length;

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            <div className="stat-grid">
                <div className="stat-card danger">
                    <div className="label">Critical (CGPA &lt; 1.50)</div>
                    <div className="value">{critical}</div>
                </div>
                <div className="stat-card warning">
                    <div className="label">Probation (CGPA &lt; 2.00)</div>
                    <div className="value">{probation}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Total At-Risk</div>
                    <div className="value">{items.length}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Students on Academic Probation</h3>
                </div>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search by name, email, or program..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <span className="count">{filtered.length} of {items.length}</span>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState title="Nobody on probation" message={items.length === 0 ? 'All students are in good standing.' : 'No matches for your search.'} />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th><th>Program</th>
                                    <th>Email</th>
                                    <th className="num">CGPA</th>
                                    <th>Standing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.student_id}>
                                        <td>{p.student_name}</td>
                                        <td>{p.program_name}</td>
                                        <td>{p.email}</td>
                                        <td className="num"><strong>{Number(p.cgpa).toFixed(2)}</strong></td>
                                        <td>
                                            <span className={`badge badge-${p.standing === 'Critical' ? 'danger' : 'warning'}`}>
                                                {p.standing}
                                            </span>
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

export default AdminProbation;
