import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios'; // This automatically attaches our JWT token!

const InstructorDashboard = () => {
    const { logout, user } = useContext(AuthContext);
    
    // Form State
    const [sectionId, setSectionId] = useState('');
    const [date, setDate] = useState('');
    const [student1Id, setStudent1Id] = useState('');
    const [student1Status, setStudent1Status] = useState('Present');
    
    // UI Feedback State
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // 1. Client-Side Validation (Required by Phase 3 Rubric)
        if (!sectionId || !date || !student1Id) {
            setError('Please fill in all fields before submitting.');
            return;
        }

        // 2. Prepare the payload matching our backend API
        const payload = {
            section_id: parseInt(sectionId),
            date: date,
            records: [
                { student_id: parseInt(student1Id), status: student1Status }
            ]
        };

        setLoading(true);

        // 3. Send the API Request
        try {
            const response = await api.post('/attendance', payload);
            setMessage(response.data.message); // "Attendance marked successfully"
            
            // Clear the form on success
            setStudent1Id('');
        } catch (err) {
           setError("RAW ERROR: " + JSON.stringify(err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>👨‍🏫 Instructor Dashboard</h2>
                <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
            </div>
            
            <p>Welcome, Instructor! Use the form below to mark attendance.</p>

            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Mark Attendance</h3>
                
                {/* Error and Success Feedback (Required by Phase 3 Rubric) */}
                {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}
                {message && <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>{message}</div>}

                <form onSubmit={handleMarkAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div>
                        <label>Section ID: </label>
                        <input type="number" value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="e.g., 1" style={{ width: '100%', padding: '8px' }} />
                    </div>

                    <div>
                        <label>Date: </label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <div>
                            <label>Student ID: </label>
                            <input type="number" value={student1Id} onChange={(e) => setStudent1Id(e.target.value)} placeholder="e.g., 1" style={{ padding: '8px', width: '100px' }} />
                        </div>
                        <div>
                            <label>Status: </label>
                            <select value={student1Status} onChange={(e) => setStudent1Status(e.target.value)} style={{ padding: '8px' }}>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'Submitting...' : 'Submit Attendance'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InstructorDashboard;