import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const adminActions = [
        { title: "Manage Courses", desc: "Add or edit university courses", path: "/admin/add-course", color: "#4e73df" },
        { title: "Enrollment Requests", desc: "Approve or reject student sign-ups", path: "/admin/enrollments", color: "#1cc88a" },
        { title: "Financial Vouchers", desc: "Issue and track fee payments", path: "/admin/finances", color: "#36b9cc" }
    ];

    return (
        <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
            <h1>Admin Control Panel ⚙️</h1>
            <p>Welcome! What would you like to manage today?</p>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px', 
                marginTop: '30px' 
            }}>
                {adminActions.map((action, index) => (
                    <div 
                        key={index}
                        onClick={() => navigate(action.path)}
                        style={{
                            background: '#2c2c2c',
                            padding: '20px',
                            borderRadius: '10px',
                            borderLeft: `5px solid ${action.color}`,
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <h3>{action.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{action.desc}</p>
                    </div>
                ))}
            </div>

            <button 
                onClick={logout} 
                style={{ marginTop: '40px', padding: '10px 30px', background: '#e74a3b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
                Logout
            </button>
        </div>
    );
};

export default AdminDashboard;