import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const EnrollmentPage = () => {
    const { user } = useContext(AuthContext);
    const [sections, setSections] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const response = await api.get('/courses/sections');
                setSections(response.data.data || response.data);
            } catch (err) {
                setError('Failed to load sections.');
            }
        };
        fetchSections();
    }, []);

    const handleEnroll = async (section_id) => {
        setMessage('');
        setError('');
        try {
            const response = await api.post('/enrollment', {
                student_id: user.id,
                section_id: section_id
            });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Enrollment failed');
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
            <h2>📚 Course Enrollment</h2>
            <p>Welcome, Student ID: {user?.id}</p>

            {message && <div style={{ color: 'green', padding: '10px', backgroundColor: '#e6ffed', marginBottom: '10px' }}>{message}</div>}
            {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffe6e6', marginBottom: '10px' }}>{error}</div>}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Course</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Section</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Capacity</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sections.map((section) => (
                        <tr key={section.section_id}>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>{section.course_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>{section.section_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                                {section.enrolled_count} / {section.capacity}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                                <button 
                                    onClick={() => handleEnroll(section.section_id)}
                                    disabled={section.enrolled_count >= section.capacity}
                                    style={{ 
                                        padding: '5px 10px', 
                                        backgroundColor: section.enrolled_count >= section.capacity ? '#ccc' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {section.enrolled_count >= section.capacity ? 'Full' : 'Enroll'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EnrollmentPage;