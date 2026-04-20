import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const InstructorDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [sections, setSections] = useState([]);
    const [feedbackSummary, setFeedbackSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Attendance mini-form state
    const [attSection, setAttSection] = useState('');
    const [attDate, setAttDate] = useState('');
    const [roster, setRoster] = useState([]);
    const [records, setRecords] = useState({});
    const [msg, setMsg] = useState('');
    const [mErr, setMErr] = useState('');
    const [busy, setBusy] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [s, fb] = await Promise.all([
                api.get('/instructors/me/sections'),
                api.get(`/feedback/instructor/${user.linked_id}/summary`).catch(() => ({ data: { data: null } }))
            ]);
            setSections(s.data.data || []);
            setFeedbackSummary(fb.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const loadRoster = async (section_id) => {
        setRoster([]);
        setRecords({});
        if (!section_id) return;
        try {
            const r = await api.get(`/instructors/sections/${section_id}/roster`);
            const list = r.data.data || [];
            setRoster(list);
            setRecords(Object.fromEntries(list.map(s => [s.student_id, 'Present'])));
        } catch (e) {
            setMErr('Could not load roster.');
        }
    };

    const submitAttendance = async (e) => {
        e.preventDefault();
        setMsg(''); setMErr('');
        if (!attSection || !attDate) {
            setMErr('Select a section and date.');
            return;
        }
        setBusy(true);
        try {
            const payload = {
                section_id: parseInt(attSection),
                date: attDate,
                records: roster.map(s => ({ student_id: s.student_id, status: records[s.student_id] || 'Present' }))
            };
            const r = await api.post('/attendance', payload);
            setMsg(r.data.message || 'Attendance marked.');
        } catch (err) {
            setMErr(err.response?.data?.message || 'Submission failed.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="label">My Sections</div>
                    <div className="value">{sections.length}</div>
                </div>
                <div className="stat-card accent">
                    <div className="label">Total Students</div>
                    <div className="value">
                        {sections.reduce((sum, s) => sum + Number(s.enrolled_count || 0), 0)}
                    </div>
                </div>
                {feedbackSummary?.overall && (
                    <>
                        <div className="stat-card success">
                            <div className="label">Feedback Rating</div>
                            <div className="value">
                                {feedbackSummary.overall.avg_overall
                                    ? Number(feedbackSummary.overall.avg_overall).toFixed(2)
                                    : '—'}
                            </div>
                            <div className="sub">{feedbackSummary.overall.response_count || 0} responses</div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>My Sections</h3></div>
                    {sections.length === 0 ? (
                        <EmptyState title="No sections assigned" />
                    ) : (
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Course</th><th>Term</th>
                                        <th>Schedule</th><th className="num">Roster</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map(s => (
                                        <tr key={s.section_id}>
                                            <td><strong>{s.course_code}</strong> — {s.course_name}</td>
                                            <td>{s.semester} {s.year}</td>
                                            <td>{s.schedule_days} {String(s.schedule_time).slice(0,5)}</td>
                                            <td className="num">{s.enrolled_count}/{s.capacity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Attendance mini-form */}
                <div className="card">
                    <div className="card-header"><h3>Mark Attendance</h3></div>
                    {msg  && <div className="alert alert-success">{msg}</div>}
                    {mErr && <div className="alert alert-error">{mErr}</div>}
                    <form onSubmit={submitAttendance}>
                        <div className="form-row">
                            <label className="field">
                                <span>Section</span>
                                <select
                                    value={attSection}
                                    onChange={(e) => {
                                        setAttSection(e.target.value);
                                        loadRoster(e.target.value);
                                    }}
                                >
                                    <option value="">-- choose --</option>
                                    {sections.map(s => (
                                        <option key={s.section_id} value={s.section_id}>
                                            {s.course_code} ({s.semester} {s.year})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="field">
                                <span>Date</span>
                                <input
                                    type="date"
                                    value={attDate}
                                    onChange={(e) => setAttDate(e.target.value)}
                                />
                            </label>
                        </div>

                        {roster.length > 0 && (
                            <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Student</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        {roster.map(s => (
                                            <tr key={s.student_id}>
                                                <td>{s.student_name}</td>
                                                <td>
                                                    <select
                                                        value={records[s.student_id] || 'Present'}
                                                        onChange={(e) =>
                                                            setRecords({ ...records, [s.student_id]: e.target.value })
                                                        }
                                                    >
                                                        <option>Present</option>
                                                        <option>Absent</option>
                                                        <option>Late</option>
                                                        <option>Excused</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={busy || roster.length === 0}
                            style={{ marginTop: 12 }}
                        >
                            {busy ? 'Submitting...' : 'Submit Attendance'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Feedback breakdown */}
            {feedbackSummary?.by_section?.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3>Feedback by Section</h3></div>
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
                                {feedbackSummary.by_section.map(s => (
                                    <tr key={s.section_id}>
                                        <td><strong>{s.course_code}</strong> {s.course_name}</td>
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
            )}
        </Layout>
    );
};

export default InstructorDashboard;
