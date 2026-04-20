import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/global.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in both email and password.');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>University Management System</h1>
                <p className="subtitle">Sign in to access your portal</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    <label className="field">
                        <span>Email<span className="req">*</span></span>
                        <input
                            type="email"
                            placeholder="you@ums.edu.pk"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={loading}
                        />
                    </label>
                    <label className="field">
                        <span>Password<span className="req">*</span></span>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '11px' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    marginTop: 20, paddingTop: 15, borderTop: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--text-muted)'
                }}>
                    <strong>Seed accounts:</strong> admin@ums.edu.pk, ahmed.khan@ums.edu.pk,
                    ali.ahmad@stu.ums.edu.pk, librarian@ums.edu.pk — password <code>Admin@123</code>
                </div>
            </div>
        </div>
    );
};

export default Login;
