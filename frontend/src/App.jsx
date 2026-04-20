import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login              from './pages/Login';
import StudentDashboard   from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard     from './pages/AdminDashboard';
import EnrollmentPage     from './pages/EnrollmentPage';
import FeePayment         from './pages/FeePayment';

// New pages
import Announcements      from './pages/Announcements';
import Timetable          from './pages/Timetable';
import Feedback           from './pages/Feedback';
import MyFeedback         from './pages/MyFeedback';
import Exams              from './pages/Exams';
import Notifications      from './pages/Notifications';
import Transcript         from './pages/Transcript';
import AdminSemesters     from './pages/AdminSemesters';
import AdminProbation     from './pages/AdminProbation';

const DashboardRouter = () => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'Student')    return <Navigate to="/student" />;
    if (user.role === 'Instructor') return <Navigate to="/instructor" />;
    if (user.role === 'Admin')      return <Navigate to="/admin" />;
    if (user.role === 'Librarian')  return <Navigate to="/librarian" />;
    return <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login"     element={<Login />} />
                    <Route path="/dashboard" element={<DashboardRouter />} />

                    {/* Student */}
                    <Route path="/student"    element={<PrivateRoute allowedRoles={['Student']}><StudentDashboard /></PrivateRoute>} />
                    <Route path="/enrollment" element={<PrivateRoute allowedRoles={['Student']}><EnrollmentPage /></PrivateRoute>} />
                    <Route path="/fees"       element={<PrivateRoute allowedRoles={['Student']}><FeePayment /></PrivateRoute>} />
                    <Route path="/transcript" element={<PrivateRoute allowedRoles={['Student']}><Transcript /></PrivateRoute>} />
                    <Route path="/feedback"   element={<PrivateRoute allowedRoles={['Student']}><Feedback /></PrivateRoute>} />

                    {/* Instructor */}
                    <Route path="/instructor"    element={<PrivateRoute allowedRoles={['Instructor']}><InstructorDashboard /></PrivateRoute>} />
                    <Route path="/my-feedback"   element={<PrivateRoute allowedRoles={['Instructor']}><MyFeedback /></PrivateRoute>} />

                    {/* Admin */}
                    <Route path="/admin"            element={<PrivateRoute allowedRoles={['Admin']}><AdminDashboard /></PrivateRoute>} />
                    <Route path="/admin/semesters"  element={<PrivateRoute allowedRoles={['Admin']}><AdminSemesters /></PrivateRoute>} />
                    <Route path="/admin/probation"  element={<PrivateRoute allowedRoles={['Admin']}><AdminProbation /></PrivateRoute>} />

                    {/* Shared (student, instructor, admin) */}
                    <Route path="/announcements" element={<PrivateRoute allowedRoles={['Student','Instructor','Admin','Librarian']}><Announcements /></PrivateRoute>} />
                    <Route path="/notifications" element={<PrivateRoute allowedRoles={['Student','Instructor','Admin','Librarian']}><Notifications /></PrivateRoute>} />
                    <Route path="/timetable"     element={<PrivateRoute allowedRoles={['Student','Instructor']}><Timetable /></PrivateRoute>} />
                    <Route path="/exams"         element={<PrivateRoute allowedRoles={['Student','Instructor','Admin']}><Exams /></PrivateRoute>} />

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
