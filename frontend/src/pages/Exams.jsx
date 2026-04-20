import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const Exams = () => {
    const { user } = useContext(AuthContext);
    const isStudent   = user.role === 'Student';
    const isInstructor = user.role === 'Instructor' || user.role === 'Admin';

    const [exams, setExams]       = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedSec, setSelectedSec] = useState('');
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        section_id: '', exam_type: 'Midterm', title: '',
        exam_date: '', start_time: '', duration_minutes: 90,
        room: '', total_marks: 50, weightage: 25
    });
    const [opMsg, setOpMsg] = useState('');
    const [opErr, setOpErr] = useState('');
    const [busy, setBusy]   = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (isStudent) {
                const r = await api.get('/exams/my');
                setExams(r.data.data || []);
            } else if (isInstructor) {
                const s = await api.get('/instructors/me/sections');
                setSections(s.data.data || []);
                if ((s.data.data || []).length > 0 && !selectedSec) {
                    setSelectedSec(s.data.data[0].section_id);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load exams.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (selectedSec) {
            api.get(`/exams/section/${selectedSec}`)
                .then(r => setExams(r.data.data || []))
                .catch(() => setExams([]));
        }
    }, [selectedSec]);

    const createExam = async (e) => {
        e.preventDefault();
        setOpMsg(''); setOpErr('');
        if (!form.section_id)  return setOpErr('Section is required.');
        if (!form.title.trim()) return setOpErr('Title is required.');
        if (!form.exam_date)   return setOpErr('Date is required.');
        if (!form.start_time)  return setOpErr('Start time is required.');
        if (!form.room)        return setOpErr('Room is required.');
        if (form.weightage < 0 || form.weightage > 100) return setOpErr('Weightage must be between 0 and 100.');
        if (form.duration_minutes < 15 || form.duration_minutes > 300)
            return setOpErr('Duration must be between 15 and 300 minutes.');

        setBusy(true);
        try {
            await api.post('/exams', {
                ...form,
                section_id: Number(form.section_id),
                duration_minutes: Number(form.duration_minutes),
                total_marks: Number(form.total_marks),
                weightage: Number(form.weightage)
            });
            setOpMsg('Exam scheduled and enrolled students notified.');
            setShowForm(false);
            setForm({
                section_id: '', exam_type: 'Midterm', title: '',
                exam_date: '', start_time: '', duration_minutes: 90,
                room: '', total_marks: 50, weightage: 25
            });
            if (selectedSec) {
                const r = await api.get(`/exams/section/${selectedSec}`);
                setExams(r.data.data || []);
            }
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Could not create exam.');
        } finally {
            setBusy(false);
        }
    };

    const deleteExam = async (id) => {
        if (!window.confirm('Delete this exam? Students will not be notified of the cancellation automatically.')) return;
        try {
            await api.delete(`/exams/${id}`);
            setExams(exams.filter(e => e.exam_id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.');
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchData} /></Layout>;

    return (
        <Layout>
            {opMsg && <div className="alert alert-success">{opMsg}</div>}
            {opErr && <div className="alert alert-error">{opErr}</div>}

            {isInstructor && (
                <>
                    <div className="card">
                        <div className="card-header">
                            <h3>Exams</h3>
                            <div className="row gap-10">
                                <select
                                    value={selectedSec}
                                    onChange={(e) => setSelectedSec(e.target.value)}
                                >
                                    <option value="">-- pick section --</option>
                                    {sections.map(s => (
                                        <option key={s.section_id} value={s.section_id}>
                                            {s.course_code} ({s.semester} {s.year})
                                        </option>
                                    ))}
                                </select>
                                <button onClick={() => {
                                    setShowForm(!showForm);
                                    if (!showForm && selectedSec) {
                                        setForm(f => ({ ...f, section_id: selectedSec }));
                                    }
                                }}>
                                    {showForm ? 'Cancel' : 'Schedule Exam'}
                                </button>
                            </div>
                        </div>

                        {showForm && (
                            <form onSubmit={createExam} style={{ padding: '10px 0' }}>
                                <div className="form-row">
                                    <label className="field">
                                        <span>Section<span className="req">*</span></span>
                                        <select
                                            value={form.section_id}
                                            onChange={(e) => setForm({ ...form, section_id: e.target.value })}
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
                                        <span>Type<span className="req">*</span></span>
                                        <select
                                            value={form.exam_type}
                                            onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                                        >
                                            <option>Quiz</option>
                                            <option>Midterm</option>
                                            <option>Final</option>
                                        </select>
                                    </label>
                                    <label className="field">
                                        <span>Title<span className="req">*</span></span>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        />
                                    </label>
                                </div>
                                <div className="form-row">
                                    <label className="field">
                                        <span>Date<span className="req">*</span></span>
                                        <input
                                            type="date"
                                            value={form.exam_date}
                                            onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Start time<span className="req">*</span></span>
                                        <input
                                            type="time"
                                            value={form.start_time}
                                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Duration (min)<span className="req">*</span></span>
                                        <input
                                            type="number"
                                            min="15" max="300"
                                            value={form.duration_minutes}
                                            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                                        />
                                    </label>
                                </div>
                                <div className="form-row">
                                    <label className="field">
                                        <span>Room<span className="req">*</span></span>
                                        <input
                                            type="text"
                                            value={form.room}
                                            onChange={(e) => setForm({ ...form, room: e.target.value })}
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Total marks<span className="req">*</span></span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.total_marks}
                                            onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Weightage (%)<span className="req">*</span></span>
                                        <input
                                            type="number"
                                            min="0" max="100" step="0.1"
                                            value={form.weightage}
                                            onChange={(e) => setForm({ ...form, weightage: e.target.value })}
                                        />
                                    </label>
                                </div>
                                <button type="submit" disabled={busy}>
                                    {busy ? 'Scheduling...' : 'Schedule Exam'}
                                </button>
                            </form>
                        )}
                    </div>
                </>
            )}

            <div className="card">
                <div className="card-header">
                    <h3>{isStudent ? 'My Exam Schedule' : 'Scheduled Exams'}</h3>
                </div>
                {exams.length === 0 ? (
                    <EmptyState title="No exams" message="Nothing scheduled yet." />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Title</th>
                                    {isStudent && <th>Course</th>}
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Room</th>
                                    <th className="num">Marks</th>
                                    <th className="num">Weight</th>
                                    {isInstructor && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map(ex => (
                                    <tr key={ex.exam_id}>
                                        <td>
                                            <span className={`badge badge-${ex.exam_type === 'Final' ? 'danger' : ex.exam_type === 'Midterm' ? 'warning' : 'info'}`}>
                                                {ex.exam_type}
                                            </span>
                                        </td>
                                        <td>{ex.title}</td>
                                        {isStudent && <td>{ex.course_code}</td>}
                                        <td>{ex.exam_date}</td>
                                        <td>{String(ex.start_time).slice(0,5)} ({ex.duration_minutes}m)</td>
                                        <td>{ex.room}</td>
                                        <td className="num">{ex.total_marks}</td>
                                        <td className="num">{ex.weightage}%</td>
                                        {isInstructor && (
                                            <td>
                                                <button
                                                    className="btn-danger btn-sm"
                                                    onClick={() => deleteExam(ex.exam_id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
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

export default Exams;
