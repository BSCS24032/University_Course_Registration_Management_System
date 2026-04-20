import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [enrollments, setEnrollments]   = useState([]);
    const [creditLoad, setCreditLoad]     = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [activeSemester, setActiveSemester] = useState(null);
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [enr, ann, ex, sem] = await Promise.all([
                api.get('/enrollment/my'),
                api.get('/announcements'),
                api.get('/exams/my'),
                api.get('/semesters/active'),
            ]);
            setEnrollments(enr.data.data || []);
            setAnnouncements((ann.data.data || []).slice(0, 3));
            // only exams from today onwards
            const today = new Date().toISOString().slice(0, 10);
            setUpcomingExams((ex.data.data || [])
                .filter(e => e.exam_date >= today)
                .slice(0, 5));
            setActiveSemester(sem.data.data);

            // credit-load is student-only — swallow 404
            try {
                const cl = await api.get('/students/me/credit-load');
                setCreditLoad(cl.data.data);
            } catch { /* ignore */ }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    const current = enrollments.filter(e => e.status === 'Enrolled');

    return (
        <Layout>
            {/* Active semester banner */}
            {activeSemester && (
                <div className="alert alert-info">
                    <strong>Current Term:</strong> {activeSemester.term} {activeSemester.year} —
                    Add/drop closes <strong>{activeSemester.add_drop_deadline?.slice(0, 10)}</strong>,
                    Registration closes <strong>{activeSemester.registration_close?.slice(0, 10)}</strong>
                </div>
            )}

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="label">Active Courses</div>
                    <div className="value">{current.length}</div>
                </div>
                {creditLoad && (
                    <>
                        <div className="stat-card accent">
                            <div className="label">Current Credits</div>
                            <div className="value">{creditLoad.current_credits}</div>
                            <div className="sub">of {creditLoad.credit_limit} limit</div>
                        </div>
                        <div className="stat-card success">
                            <div className="label">Credits Remaining</div>
                            <div className="value">{creditLoad.credits_remaining}</div>
                        </div>
                    </>
                )}
                <div className="stat-card warning">
                    <div className="label">Upcoming Exams</div>
                    <div className="value">{upcomingExams.length}</div>
                </div>
            </div>

            <div className="grid-2">
                {/* Current courses */}
                <div className="card">
                    <div className="card-header">
                        <h3>My Courses</h3>
                        <button className="btn-sm" onClick={() => navigate('/enrollment')}>
                            Browse Sections
                        </button>
                    </div>
                    {current.length === 0 ? (
                        <EmptyState title="Not enrolled" message="Head to Enrollment to register for classes." />
                    ) : (
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Instructor</th>
                                        <th className="num">Credits</th>
                                        <th>Schedule</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {current.map(e => (
                                        <tr key={e.enrollment_id}>
                                            <td><strong>{e.course_code}</strong> — {e.course_name}</td>
                                            <td>{e.instructor_name}</td>
                                            <td className="num">{e.credits}</td>
                                            <td>{e.schedule_days} {String(e.schedule_time).slice(0, 5)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Upcoming exams */}
                <div className="card">
                    <div className="card-header">
                        <h3>Upcoming Exams</h3>
                        <button className="btn-sm" onClick={() => navigate('/exams')}>
                            View All
                        </button>
                    </div>
                    {upcomingExams.length === 0 ? (
                        <EmptyState title="Nothing scheduled" message="No exams coming up." />
                    ) : (
                        <div>
                            {upcomingExams.map(ex => (
                                <div key={ex.exam_id} style={{
                                    padding: '10px 12px', borderBottom: '1px solid var(--border)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div><strong>{ex.course_code}</strong> — {ex.title}</div>
                                        <div className="text-muted" style={{ fontSize: 12 }}>
                                            {ex.exam_date} at {String(ex.start_time).slice(0, 5)} · {ex.room}
                                        </div>
                                    </div>
                                    <span className={`badge badge-${ex.exam_type === 'Final' ? 'danger' : ex.exam_type === 'Midterm' ? 'warning' : 'info'}`}>
                                        {ex.exam_type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent announcements */}
            <div className="card">
                <div className="card-header">
                    <h3>Latest Announcements</h3>
                    <button className="btn-sm" onClick={() => navigate('/announcements')}>
                        See All
                    </button>
                </div>
                {announcements.length === 0 ? (
                    <EmptyState title="Quiet around here" message="No announcements right now." />
                ) : (
                    announcements.map(a => (
                        <div key={a.announcement_id} style={{
                            padding: '12px 0', borderBottom: '1px solid var(--border)'
                        }}>
                            <div className="flex-between">
                                <strong>
                                    {a.is_pinned && <span className="badge badge-info">PINNED</span>} {a.title}
                                </strong>
                                <span className="text-muted" style={{ fontSize: 12 }}>
                                    {new Date(a.posted_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div style={{ marginTop: 5 }}>{a.body.slice(0, 200)}{a.body.length > 200 ? '…' : ''}</div>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
};

export default StudentDashboard;
