import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import '../styles/global.css';

const StarInput = ({ value, onChange, readOnly = false }) => (
    <div className={`stars ${readOnly ? 'read-only' : ''}`}>
        {[1,2,3,4,5].map(n => (
            <button
                key={n}
                type="button"
                className={`star ${value >= n ? 'on' : ''}`}
                onClick={() => !readOnly && onChange(n)}
                aria-label={`${n} stars`}
            >
                ★
            </button>
        ))}
    </div>
);

const Feedback = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    const [selected, setSelected] = useState(null);
    const [ratings, setRatings]   = useState({ teaching: 0, content: 0, fairness: 0 });
    const [comments, setComments] = useState('');
    const [opMsg, setOpMsg] = useState('');
    const [opErr, setOpErr] = useState('');
    const [busy, setBusy]   = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get('/feedback/pending');
            setPending(r.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load pending feedback.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchPending(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        setOpMsg(''); setOpErr('');

        if (!selected) return setOpErr('Pick a course first.');
        if (!ratings.teaching || !ratings.content || !ratings.fairness) {
            return setOpErr('Please rate all three areas before submitting.');
        }

        setBusy(true);
        try {
            const r = await api.post('/feedback', {
                enrollment_id: selected.enrollment_id,
                rating_teaching: ratings.teaching,
                rating_content: ratings.content,
                rating_fairness: ratings.fairness,
                comments: comments.trim() || null
            });
            setOpMsg(r.data.message || 'Thanks for your feedback.');
            setSelected(null);
            setRatings({ teaching: 0, content: 0, fairness: 0 });
            setComments('');
            fetchPending();
        } catch (err) {
            setOpErr(err.response?.data?.message || 'Submission failed.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <Layout><Loading /></Layout>;
    if (error)   return <Layout><ErrorMessage message={error} onRetry={fetchPending} /></Layout>;

    return (
        <Layout>
            {opMsg && <div className="alert alert-success">{opMsg}</div>}
            {opErr && <div className="alert alert-error">{opErr}</div>}

            <div className="alert alert-info">
                Your feedback is <strong>anonymous</strong>. Instructors see aggregate ratings only,
                never your identity or which response is yours.
            </div>

            <div className="card">
                <div className="card-header"><h3>Courses Awaiting Your Feedback</h3></div>
                {pending.length === 0 ? (
                    <EmptyState title="All caught up" message="You have no pending course feedback." />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Course</th>
                                    <th>Instructor</th>
                                    <th>Term</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(p => (
                                    <tr
                                        key={p.enrollment_id}
                                        style={{
                                            background: selected?.enrollment_id === p.enrollment_id ? '#e6edf6' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelected(p)}
                                    >
                                        <td>
                                            <input
                                                type="radio"
                                                checked={selected?.enrollment_id === p.enrollment_id}
                                                onChange={() => setSelected(p)}
                                            />
                                        </td>
                                        <td><strong>{p.course_code}</strong> — {p.course_name}</td>
                                        <td>{p.instructor_name}</td>
                                        <td>{p.semester} {p.year}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selected && (
                <div className="card">
                    <div className="card-header">
                        <h3>Feedback — {selected.course_code}</h3>
                    </div>
                    <form onSubmit={submit}>
                        <label className="field">
                            <span>Teaching quality<span className="req">*</span></span>
                            <StarInput
                                value={ratings.teaching}
                                onChange={(v) => setRatings({ ...ratings, teaching: v })}
                            />
                        </label>
                        <label className="field">
                            <span>Content depth<span className="req">*</span></span>
                            <StarInput
                                value={ratings.content}
                                onChange={(v) => setRatings({ ...ratings, content: v })}
                            />
                        </label>
                        <label className="field">
                            <span>Fairness of grading<span className="req">*</span></span>
                            <StarInput
                                value={ratings.fairness}
                                onChange={(v) => setRatings({ ...ratings, fairness: v })}
                            />
                        </label>
                        <label className="field">
                            <span>Comments (optional)</span>
                            <textarea
                                rows={4}
                                maxLength={2000}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="What worked well? What could be improved?"
                            />
                        </label>
                        <button type="submit" disabled={busy}>
                            {busy ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            style={{ marginLeft: 10 }}
                            onClick={() => setSelected(null)}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}
        </Layout>
    );
};

export default Feedback;
