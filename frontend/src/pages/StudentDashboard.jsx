import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await api.get('/attendance/my-records');
                setAttendanceRecords(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <nav style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: '#333', 
                padding: '15px 25px', 
                borderRadius: '8px',
                color: 'white',
                marginBottom: '30px'
            }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Portal</h3>
                    <button onClick={() => navigate('/enrollment')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Enrollment</button>
                    <button onClick={() => navigate('/fees')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Fee Payment</button>
                </div>
                <button onClick={logout} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
            </nav>

            <header style={{ marginBottom: '30px' }}>
                <h2>Welcome, Student</h2>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderLeft: '5px solid #007bff' }}>
                    <strong>User ID:</strong> {user?.id} <br />
                    <strong>Email:</strong> {user?.email}
                </div>
            </header>

            <section>
                <h3>My Attendance Records</h3>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                
                {loading ? (
                    <p>Loading records...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#007bff', color: 'white', textAlign: 'left' }}>
                                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Date</th>
                                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Course</th>
                                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRecords.length > 0 ? (
                                attendanceRecords.map((record, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{new Date(record.attendance_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{record.course_name}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #ddd', 
                                            fontWeight: 'bold',
                                            color: record.status === 'Present' ? '#28a745' : '#dc3545'
                                        }}>
                                            {record.status}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No attendance history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default StudentDashboard;