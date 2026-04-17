import { useState, useEffect } from 'react';
import api from '../api/axios';

const AddCourse = () => {
    const [formData, setFormData] = useState({
        course_code: '',
        name: '',
        description: '',
        credits: 3,
        department_id: '',
        is_elective: 0
    });
    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.get('/admin/departments').then(res => setDepartments(res.data.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/courses/add', formData);
            setMessage(res.data.message);
            setFormData({ course_code: '', name: '', description: '', credits: 3, department_id: '', is_elective: 0 });
        } catch (err) {
            setMessage(err.response?.data?.message || "Error adding course");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px' }}>
            <h2>➕ Add New Course</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input placeholder="Course Code (e.g. CS101)" value={formData.course_code} onChange={e => setFormData({...formData, course_code: e.target.value})} required />
                <input placeholder="Course Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <input type="number" placeholder="Credits" value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} required />
                
                <select value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} required>
                    <option value="">Select Department</option>
                    {departments.map(d => (
                        <option key={d.department_id} value={d.department_id}>{d.name}</option>
                    ))}
                </select>

                <label>
                    <input type="checkbox" checked={formData.is_elective === 1} onChange={e => setFormData({...formData, is_elective: e.target.checked ? 1 : 0})} />
                    Is Elective?
                </label>

                <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>Save Course</button>
            </form>
        </div>
    );
};

export default AddCourse;