import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import '../styles/global.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [probation, setProbation] = useState([]);
    const [trend, setTrend] = useState([]);
    const [feedbackOverview, setFeedbackOverview] = useState([]);
    const [sectionFill, setSectionFill] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [s, p, t, f, fill] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/probation'),
                api.get('/admin/enrollment-trend'),
                api.get('/admin/feedback-overview'),
                api.get('/admin/section-fill')
            ]);
            setStats(s.data.data);
            setProbation(p.data.data || []);
            setTrend(t.data.data || []);
            setFeedbackOverview(f.data.data || []);
            setSectionFill(fill.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    if (loading) return <Layout><Loading message="Loading dashboard..." /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    const c = stats?.counts || {};
    const fees = stats?.fee_summary || [];
    const totalBilled    = fees.reduce((s, f) => s + Number(f.total_billed || 0), 0);
    const totalCollected = fees.reduce((s, f) => s + Number(f.total_collected || 0), 0);
    const collectionPct  = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0;

    return (
        <Layout>
            {/* Stat cards */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="label">Active Students</div>
                    <div className="value">{c.active_students ?? 0}</div>
                </div>
                <div className="stat-card accent">
                    <div className="label">Instructors</div>
                    <div className="value">{c.active_instructors ?? 0}</div>
                </div>
                <div className="stat-card success">
                    <div className="label">Courses</div>
                    <div className="value">{c.total_courses ?? 0}</div>
                    <div className="sub">{c.total_sections ?? 0} sections this term</div>
                </div>
                <div className="stat-card">
                    <div className="label">Active Enrollments</div>
                    <div className="value">{c.active_enrollments ?? 0}</div>
                </div>
                <div className="stat-card warning">
                    <div className="label">Books on Loan</div>
                    <div className="value">{c.books_on_loan ?? 0}</div>
                    <div className="sub">{c.available_copies ?? 0} copies available</div>
                </div>
                <div className="stat-card danger">
                    <div className="label">On Probation</div>
                    <div className="value">{probation.length}</div>
                    <div className="sub">CGPA below 2.0</div>
                </div>
            </div>

            {/* Charts row */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Enrollment Trend</h3></div>
                    <LineChart
                        data={trend.map(t => ({
                            label: `${t.semester.slice(0,3)} ${String(t.year).slice(2)}`,
                            value: Number(t.enrollments)
                        }))}
                    />
                </div>
                <div className="card">
                    <div className="card-header"><h3>Students by Department</h3></div>
                    <BarChart
                        data={(stats?.by_department || []).map(d => ({
                            label: d.department,
                            value: Number(d.student_count)
                        }))}
                        color="#1a3a6e"
                    />
                </div>
            </div>

            <div className="grid-2">
                {/* Fee collection summary */}
                <div className="card">
                    <div className="card-header"><h3>Fee Collection</h3></div>
                    <div style={{ padding: '5px 0 15px' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-dark)' }}>
                            PKR {Number(totalCollected).toLocaleString()}
                        </div>
                        <div className="text-muted">
                            collected of PKR {Number(totalBilled).toLocaleString()} billed ({collectionPct}%)
                        </div>
                        <div style={{
                            marginTop: 10, background: 'var(--bg)', borderRadius: 4,
                            height: 10, overflow: 'hidden', border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                width: `${collectionPct}%`,
                                height: '100%',
                                background: 'var(--success)'
                            }} />
                        </div>
                    </div>
                    <table className="data-table" style={{ marginTop: 10 }}>
                        <thead>
                            <tr><th>Status</th><th className="num">Vouchers</th><th className="num">Billed</th><th className="num">Collected</th></tr>
                        </thead>
                        <tbody>
                            {fees.map((f, i) => (
                                <tr key={i}>
                                    <td><span className={`badge badge-${f.status === 'Paid' ? 'success' : f.status === 'Partial' ? 'warning' : 'danger'}`}>{f.status}</span></td>
                                    <td className="num">{f.voucher_count}</td>
                                    <td className="num">{Number(f.total_billed).toLocaleString()}</td>
                                    <td className="num">{Number(f.total_collected).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Top enrolled courses */}
                <div className="card">
                    <div className="card-header"><h3>Top Enrolled Courses</h3></div>
                    <BarChart
                        data={(stats?.top_enrolled_courses || []).map(c => ({
                            label: `${c.course_code}`,
                            value: Number(c.enrollment_count)
                        }))}
                        color="#c9a94b"
                    />
                </div>
            </div>

            {/* Section fill rates */}
            <div className="card">
                <div className="card-header"><h3>Section Fill Rates (Top 10)</h3></div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Term</th>
                                <th className="num">Enrolled</th>
                                <th className="num">Capacity</th>
                                <th className="num">Fill %</th>
                                <th className="num">Waitlist</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionFill.map(s => (
                                <tr key={s.section_id}>
                                    <td><strong>{s.course_code}</strong> — {s.course_name}</td>
                                    <td>{s.semester} {s.year}</td>
                                    <td className="num">{s.enrolled_count}</td>
                                    <td className="num">{s.capacity}</td>
                                    <td className="num">
                                        <span className={`badge badge-${s.fill_pct >= 90 ? 'danger' : s.fill_pct >= 70 ? 'warning' : 'success'}`}>
                                            {s.fill_pct}%
                                        </span>
                                    </td>
                                    <td className="num">{s.waitlist_size || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Probation list */}
            {probation.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3>Academic Probation</h3></div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Program</th>
                                    <th>Email</th>
                                    <th className="num">CGPA</th>
                                    <th>Standing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {probation.map(p => (
                                    <tr key={p.student_id}>
                                        <td>{p.student_name}</td>
                                        <td>{p.program_name}</td>
                                        <td>{p.email}</td>
                                        <td className="num">{Number(p.cgpa).toFixed(2)}</td>
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
                </div>
            )}

            {/* Feedback overview */}
            {feedbackOverview.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3>Instructor Feedback Overview</h3></div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Instructor</th>
                                    <th>Department</th>
                                    <th className="num">Responses</th>
                                    <th className="num">Avg Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedbackOverview.map(f => (
                                    <tr key={f.instructor_id}>
                                        <td>{f.instructor_name}</td>
                                        <td>{f.department}</td>
                                        <td className="num">{f.response_count}</td>
                                        <td className="num">
                                            <strong>{Number(f.avg_overall).toFixed(2)}</strong> / 5.00
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminDashboard;
