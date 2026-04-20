import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const Transcript = () => {
    const { user } = useContext(AuthContext);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchEnrollments = async () => {
        setLoading(true); setError('');
        try {
            const r = await api.get('/enrollment/my');
            setEnrollments(r.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load enrollment history.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchEnrollments(); }, []);

    /** Open the print-ready transcript in a new tab. The token is a URL param
     *  because this is a window.open navigation (not an XHR) and the axios
     *  interceptor wouldn't attach the Authorization header. Backend accepts it. */
    const openPrintView = async () => {
        try {
            const token = localStorage.getItem('token');
            const r = await fetch(
                `${api.defaults.baseURL}/students/me/transcript/pdf`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!r.ok) throw new Error(`Server returned ${r.status}`);
            const html = await r.text();
            const w = window.open('', '_blank');
            w.document.write(html);
            w.document.close();
        } catch (err) {
            alert(`Could not open transcript: ${err.message}`);
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchEnrollments} /></Layout>;

    // Group by semester
    const grouped = {};
    for (const e of enrollments) {
        const key = `${e.semester || '?'} ${e.year || ''}`.trim();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(e);
    }

    // Quick CGPA & credits
    const graded = enrollments.filter(e => e.grade_points !== null);
    const totalCredits = graded.reduce((s, e) => s + Number(e.credits), 0);
    const qualityPts   = graded.reduce((s, e) => s + Number(e.credits) * Number(e.grade_points), 0);
    const cgpa = totalCredits > 0 ? (qualityPts / totalCredits).toFixed(2) : '—';

    return (
        <Layout>
            <div className="card">
                <div className="card-header">
                    <h3>Academic Transcript</h3>
                    <button onClick={openPrintView} disabled={enrollments.length === 0}>
                        Open Print View (Save as PDF)
                    </button>
                </div>
                <div className="alert alert-info">
                    Click <strong>Open Print View</strong> to view a print-ready copy in a new tab.
                    Use your browser's <strong>Print → Save as PDF</strong> to download.
                </div>
            </div>

            <div className="stat-grid">
                <div className="stat-card accent">
                    <div className="label">Cumulative GPA</div>
                    <div className="value">{cgpa}</div>
                    <div className="sub">/ 4.00</div>
                </div>
                <div className="stat-card success">
                    <div className="label">Credits Earned</div>
                    <div className="value">{totalCredits}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Courses Taken</div>
                    <div className="value">{enrollments.length}</div>
                </div>
            </div>

            {enrollments.length === 0 ? (
                <EmptyState title="No coursework yet" message="Your transcript will appear once you have enrollments." />
            ) : (
                Object.entries(grouped).map(([term, courses]) => (
                    <div key={term} className="card">
                        <div className="card-header">
                            <h3>{term}</h3>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th><th>Course</th>
                                        <th className="num">Credits</th>
                                        <th>Grade</th>
                                        <th className="num">GP</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(c => (
                                        <tr key={c.enrollment_id}>
                                            <td>{c.course_code}</td>
                                            <td>{c.course_name}</td>
                                            <td className="num">{c.credits}</td>
                                            <td>{c.grade || '—'}</td>
                                            <td className="num">{c.grade_points !== null ? Number(c.grade_points).toFixed(2) : '—'}</td>
                                            <td>
                                                <span className={`badge badge-${
                                                    c.status === 'Completed' ? 'success' :
                                                    c.status === 'Enrolled' ? 'info' :
                                                    c.status === 'Dropped' ? 'warning' : 'danger'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </Layout>
    );
};

export default Transcript;
