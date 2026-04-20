import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const EnrollmentPage = () => {
    const { user } = useContext(AuthContext);

    const [sections, setSections]     = useState([]);
    const [myEnrollments, setMy]      = useState([]);
    const [myWaitlist, setMyWaitlist] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [msg, setMsg]               = useState('');
    const [opMsg, setOpMsg]           = useState('');
    const [opErr, setOpErr]           = useState('');
    const [busy, setBusy]             = useState(false);

    // Search + filter state
    const [q, setQ]                   = useState('');
    const [filterTerm, setFilterTerm] = useState('all');
    const [filterSeats, setFilterSeats] = useState('all');

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [s, m, w] = await Promise.all([
                api.get('/courses/sections'),
                api.get('/enrollment/my').catch(() => ({ data: { data: [] } })),
                api.get('/waitlist/my').catch(() => ({ data: { data: [] } })),
            ]);
            setSections(s.data.data || s.data || []);
            setMy(m.data.data || []);
            setMyWaitlist(w.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load sections.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const enrolledIds = useMemo(
        () => new Set(myEnrollments.filter(e => e.status === 'Enrolled').map(e => e.section_id)),
        [myEnrollments]
    );
    const waitlistedIds = useMemo(
        () => new Set(myWaitlist.map(w => w.section_id)),
        [myWaitlist]
    );

    const termOptions = useMemo(() => {
        const set = new Set(sections.map(s => `${s.semester} ${s.year}`));
        return ['all', ...Array.from(set)];
    }, [sections]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return sections.filter(s => {
            if (filterTerm !== 'all' && `${s.semester} ${s.year}` !== filterTerm) return false;
            const seatsLeft = (s.capacity || 0) - (s.enrolled_count || 0);
            if (filterSeats === 'available' && seatsLeft <= 0) return false;
            if (filterSeats === 'full' && seatsLeft > 0) return false;
            if (needle) {
                const hay = `${s.course_code} ${s.course_name} ${s.instructor_name || ''}`.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        });
    }, [sections, q, filterTerm, filterSeats]);

    const enroll = async (section_id) => {
        setOpMsg(''); setOpErr(''); setBusy(true);
        try {
            const r = await api.post('/enrollment', {
                student_id: user.linked_id,
                section_id
            });
            setOpMsg(r.data.message || 'Enrolled successfully.');
            await fetchAll();
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message || 'Enrollment failed.';
            if (status === 409 && message.startsWith('SECTION_FULL')) {
                if (window.confirm('This section is full. Would you like to join the waitlist?')) {
                    await joinWaitlist(section_id);
                }
            } else {
                setOpErr(message);
            }
        } finally {
            setBusy(false);
        }
    };

    const joinWaitlist = async (section_id) => {
        setOpMsg(''); setOpErr(''); setBusy(true);
        try {
            const r = await api.post('/waitlist', { section_id });
            setOpMsg(r.data.message || 'Added to waitlist.');
            await fetchAll();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Could not join waitlist.');
        } finally {
            setBusy(false);
        }
    };

    const drop = async (enrollment_id) => {
        if (!window.confirm('Drop this course? If anyone is waitlisted, the top entry will be auto-promoted.')) return;
        setBusy(true);
        try {
            await api.patch(`/enrollment/${enrollment_id}/drop`);
            setOpMsg('Course dropped.');
            await fetchAll();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Could not drop.');
        } finally {
            setBusy(false);
        }
    };

    const cancelWaitlist = async (waitlist_id) => {
        if (!window.confirm('Cancel this waitlist entry?')) return;
        setBusy(true);
        try {
            await api.delete(`/waitlist/${waitlist_id}`);
            setOpMsg('Waitlist cancelled.');
            await fetchAll();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Could not cancel.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            {opMsg && <div className="alert alert-success">{opMsg}</div>}
            {opErr && <div className="alert alert-error">{opErr}</div>}

            {/* My current enrollments */}
            <div className="card">
                <div className="card-header"><h3>My Current Enrollments</h3></div>
                {myEnrollments.filter(e => e.status === 'Enrolled').length === 0 ? (
                    <EmptyState title="Not enrolled yet" message="Browse the catalogue below." />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Course</th><th>Instructor</th>
                                    <th className="num">Credits</th>
                                    <th>Schedule</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {myEnrollments.filter(e => e.status === 'Enrolled').map(e => (
                                    <tr key={e.enrollment_id}>
                                        <td><strong>{e.course_code}</strong> — {e.course_name}</td>
                                        <td>{e.instructor_name}</td>
                                        <td className="num">{e.credits}</td>
                                        <td>{e.schedule_days} {String(e.schedule_time).slice(0,5)}</td>
                                        <td className="text-right">
                                            <button
                                                className="btn-danger btn-sm"
                                                onClick={() => drop(e.enrollment_id)}
                                                disabled={busy}
                                            >
                                                Drop
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Waitlist */}
            {myWaitlist.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3>My Waitlist</h3></div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr><th>Course</th><th>Term</th><th className="num">Position</th><th></th></tr>
                            </thead>
                            <tbody>
                                {myWaitlist.map(w => (
                                    <tr key={w.waitlist_id}>
                                        <td><strong>{w.course_code}</strong> — {w.course_name}</td>
                                        <td>{w.semester} {w.year}</td>
                                        <td className="num">#{w.position}</td>
                                        <td className="text-right">
                                            <button
                                                className="btn-secondary btn-sm"
                                                onClick={() => cancelWaitlist(w.waitlist_id)}
                                                disabled={busy}
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Catalogue with search + filter */}
            <div className="card">
                <div className="card-header">
                    <h3>Available Sections</h3>
                </div>
                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search by course code, name, or instructor..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}>
                        {termOptions.map(t => (
                            <option key={t} value={t}>
                                {t === 'all' ? 'All terms' : t}
                            </option>
                        ))}
                    </select>
                    <select value={filterSeats} onChange={(e) => setFilterSeats(e.target.value)}>
                        <option value="all">All sections</option>
                        <option value="available">Seats available</option>
                        <option value="full">Full (waitlist)</option>
                    </select>
                    <span className="count">{filtered.length} of {sections.length}</span>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState title="No sections match" message="Try clearing your filters." />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Course</th><th>Instructor</th>
                                    <th>Term</th><th>Schedule</th>
                                    <th className="num">Seats</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => {
                                    const seats = (s.capacity || 0) - (s.enrolled_count || 0);
                                    const full = seats <= 0;
                                    const enrolled = enrolledIds.has(s.section_id);
                                    const waitlisted = waitlistedIds.has(s.section_id);
                                    return (
                                        <tr key={s.section_id}>
                                            <td>
                                                <strong>{s.course_code}</strong> — {s.course_name}
                                                <div className="text-muted" style={{ fontSize: 11 }}>{s.credits} credits</div>
                                            </td>
                                            <td>{s.instructor_name}</td>
                                            <td>{s.semester} {s.year}</td>
                                            <td>{s.schedule_days} {String(s.schedule_time).slice(0,5)}</td>
                                            <td className="num">
                                                <span className={`badge badge-${full ? 'danger' : seats <= 3 ? 'warning' : 'success'}`}>
                                                    {seats}/{s.capacity}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                {enrolled ? (
                                                    <span className="badge badge-success">Enrolled</span>
                                                ) : waitlisted ? (
                                                    <span className="badge badge-warning">Waitlisted</span>
                                                ) : full ? (
                                                    <button
                                                        className="btn-secondary btn-sm"
                                                        onClick={() => joinWaitlist(s.section_id)}
                                                        disabled={busy}
                                                    >
                                                        Join Waitlist
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-sm"
                                                        onClick={() => enroll(s.section_id)}
                                                        disabled={busy}
                                                    >
                                                        Enroll
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EnrollmentPage;
