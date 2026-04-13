import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import EnrollmentPage from './pages/EnrollmentPage';
import FeePayment from './pages/FeePayment'; 

const DashboardRouter = () => {
    const { user } = useContext(AuthContext);
    
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'Student') return <Navigate to="/student" />;
    if (user.role === 'Instructor') return <Navigate to="/instructor" />;
    if (user.role === 'Admin') return <Navigate to="/admin" />;
    
    return <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/dashboard" element={<DashboardRouter />} />

                    {/* Student Routes */}
                    <Route path="/student" element={
                        <PrivateRoute allowedRoles={['Student']}><StudentDashboard /></PrivateRoute>
                    } />
                    <Route path="/enrollment" element={
                        <PrivateRoute allowedRoles={['Student']}><EnrollmentPage /></PrivateRoute>
                    } />
                    <Route path="/fees" element={
                        <PrivateRoute allowedRoles={['Student']}><FeePayment /></PrivateRoute>
                    } />
                    
                    {/* Instructor Routes */}
                    <Route path="/instructor" element={
                        <PrivateRoute allowedRoles={['Instructor']}><InstructorDashboard /></PrivateRoute>
                    } />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <PrivateRoute allowedRoles={['Admin']}><AdminDashboard /></PrivateRoute>
                    } />

                    {/* Catch-all redirect MUST be last */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;