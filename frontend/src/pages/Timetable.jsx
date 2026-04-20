import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

/** Round HH:MM:SS down to the start of the hour slot. */
const slotFor = (time) => {
    if (!time) return null;
    const hh = String(time).slice(0, 2).padStart(2, '0');
    return `${hh}:00`;
};

const Timetable = () => {
    const [meetings, setMeetings] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get('/timetable/my');
            setMeetings(r.data.data?.meetings || []);
            setSections(r.data.data?.sections || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load timetable.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    // Index meetings by [day][timeSlot]
    const grid = {};
    for (const d of DAYS) grid[d] = {};
    meetings.forEach(m => {
        const slot = slotFor(m.time);
        if (DAYS.includes(m.day) && slot) {
            if (!grid[m.day][slot]) grid[m.day][slot] = [];
            grid[m.day][slot].push(m);
        }
    });

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchAll} /></Layout>;

    return (
        <Layout>
            {sections.length === 0 ? (
                <EmptyState title="No classes scheduled" message="You have no enrolled or taught sections this term." />
            ) : (
                <>
                    <div className="card">
                        <div className="card-header"><h3>Weekly Schedule</h3></div>
                        <div className="timetable">
                            <div className="cell head">&nbsp;</div>
                            {DAYS.map(d => <div key={d} className="cell head">{d}</div>)}
                            {TIMES.map(t => (
                                <div key={t} style={{ display: 'contents' }}>
                                    <div className="cell time-cell">{t}</div>
                                    {DAYS.map(d => (
                                        <div key={`${d}-${t}`} className="cell">
                                            {(grid[d][t] || []).map((m, i) => (
                                                <div key={i} className="event">
                                                    <div className="course">{m.course_code}</div>
                                                    <div>{String(m.time).slice(0, 5)}</div>
                                                    <div className="room">{m.room}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3>Section Details</h3></div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Course</th><th>Days</th>
                                        <th>Time</th><th>Room</th>
                                        <th>Instructor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map(s => (
                                        <tr key={s.section_id}>
                                            <td><strong>{s.course_code}</strong> — {s.course_name}</td>
                                            <td>{s.schedule_days}</td>
                                            <td>{String(s.schedule_time).slice(0,5)}</td>
                                            <td>{s.room}</td>
                                            <td>{s.instructor_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default Timetable;
