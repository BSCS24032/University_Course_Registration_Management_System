import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const MyFeedback = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get(`/feedback/instructor/${user.linked_id}/summary`);
            setData(r.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load feedback summary.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    const overall = data?.overall || {};
    const bySec   = data?.by_section || [];
    const comments = data?.comments || [];

    if (!overall.response_count) {
        return <Layout><EmptyState title="No feedback yet" message="Once students submit course evaluations they will appear here in aggregate." /></Layout>;
    }

    return (
        <Layout>
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="label">Responses</div>
                    <div className="value">{overall.response_count}</div>
                </div>
                <div className="stat-card accent">
                    <div className="label">Overall Average</div>
                    <div className="value">{Number(overall.avg_overall || 0).toFixed(2)}</div>
                    <div className="sub">/ 5.00</div>
                </div>
                <div className="stat-card">
                    <div className="label">Teaching</div>
                    <div className="value">{Number(overall.avg_teaching || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Content</div>
                    <div className="value">{Number(overall.avg_content || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Fairness</div>
                    <div className="value">{Number(overall.avg_fairness || 0).toFixed(2)}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Breakdown by Section</h3></div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course</th><th>Term</th>
                                <th className="num">Responses</th>
                                <th className="num">Teaching</th>
                                <th className="num">Content</th>
                                <th className="num">Fairness</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bySec.map(s => (
                                <tr key={s.section_id}>
                                    <td><strong>{s.course_code}</strong> — {s.course_name}</td>
                                    <td>{s.semester} {s.year}</td>
                                    <td className="num">{s.response_count}</td>
                                    <td className="num">{s.avg_teaching}</td>
                                    <td className="num">{s.avg_content}</td>
                                    <td className="num">{s.avg_fairness}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {comments.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3>Recent Anonymous Comments</h3></div>
                    {comments.map((c, i) => (
                        <div key={i} style={{
                            padding: '12px 0', borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{c.comments}</div>
                            <div className="text-muted" style={{ fontSize: 11, marginTop: 5 }}>
                                {new Date(c.submitted_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default MyFeedback;
