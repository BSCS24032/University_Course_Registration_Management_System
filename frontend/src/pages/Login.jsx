import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            // Call your backend login route
            const response = await api.post('/auth/login', { email, password });
            
            // Assume your backend sends { token: "..." }
            const token = response.data.token; 
            login(token);

            // Redirect based on role (We will build these dashboards in Step 3!)
            navigate('/dashboard'); 
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>University Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Login</button>
            </form>
        </div>
    );
};

export default Login;