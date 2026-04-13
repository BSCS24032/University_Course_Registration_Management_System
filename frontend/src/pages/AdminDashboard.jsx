import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);

    return (
        <div style={{ padding: '50px' }}>
            <h2>Admin Dashboard ⚙️</h2>
            <p>Welcome! Here you can approve enrollments, publish vouchers, and manage users.</p>
            <button onClick={logout} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>Logout</button>
        </div>
    );
};

export default AdminDashboard;