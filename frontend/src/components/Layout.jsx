import { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = {
    Student: [
        { section: 'Main',     items: [
            { to: '/student',        label: 'Dashboard' },
            { to: '/announcements',  label: 'Announcements' },
            { to: '/notifications',  label: 'Notifications' },
        ]},
        { section: 'Academic', items: [
            { to: '/enrollment',     label: 'Enrollment' },
            { to: '/timetable',      label: 'Timetable' },
            { to: '/exams',          label: 'Exam Schedule' },
            { to: '/transcript',     label: 'Transcript' },
            { to: '/feedback',       label: 'Course Feedback' },
        ]},
        { section: 'Finance',  items: [
            { to: '/fees',           label: 'Fee Payment' },
        ]},
    ],
    Instructor: [
        { section: 'Main',     items: [
            { to: '/instructor',     label: 'Dashboard' },
            { to: '/announcements',  label: 'Announcements' },
            { to: '/notifications',  label: 'Notifications' },
        ]},
        { section: 'Teaching', items: [
            { to: '/timetable',      label: 'My Timetable' },
            { to: '/my-feedback',    label: 'My Feedback' },
        ]},
    ],
    Admin: [
        { section: 'Main',     items: [
            { to: '/admin',           label: 'Dashboard' },
            { to: '/announcements',   label: 'Announcements' },
            { to: '/notifications',   label: 'Notifications' },
        ]},
        { section: 'Academic', items: [
            { to: '/admin/semesters', label: 'Semesters' },
            { to: '/admin/probation', label: 'Probation List' },
        ]},
    ],
    Librarian: [
        { section: 'Main',     items: [
            { to: '/librarian',       label: 'Dashboard' },
            { to: '/announcements',   label: 'Announcements' },
            { to: '/notifications',   label: 'Notifications' },
        ]},
    ],
};

const pageTitleFor = (pathname) => {
    const map = {
        '/student':       'Student Dashboard',
        '/instructor':    'Instructor Dashboard',
        '/admin':         'Admin Dashboard',
        '/librarian':     'Librarian Dashboard',
        '/enrollment':    'Course Enrollment',
        '/timetable':     'Weekly Timetable',
        '/exams':         'Exam Schedule',
        '/transcript':    'Academic Transcript',
        '/feedback':      'Course Feedback',
        '/my-feedback':   'Feedback Received',
        '/fees':          'Fee Payment',
        '/announcements': 'Announcements',
        '/notifications': 'All Notifications',
        '/admin/semesters': 'Semester Management',
        '/admin/probation': 'Academic Probation',
    };
    return map[pathname] || 'University Portal';
};

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const groups = user ? (NAV_ITEMS[user.role] || []) : [];

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="brand">
                    UMS
                    <small>{user?.role || 'Portal'}</small>
                </div>
                <nav>
                    {groups.map((g, gi) => (
                        <div key={gi}>
                            <div className="section-label">{g.section}</div>
                            {g.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/student' || item.to === '/admin' || item.to === '/instructor' || item.to === '/librarian'}
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                    <div className="section-label">Account</div>
                    <button onClick={logout}>Logout</button>
                </nav>
            </aside>

            <header className="topbar">
                <h1 className="page-title">{pageTitleFor(location.pathname)}</h1>
                <div className="top-actions">
                    <NotificationBell />
                    <div className="user-chip">
                        <strong>{user?.role}</strong>
                        <small> &middot; ID {user?.linked_id ?? user?.id}</small>
                    </div>
                </div>
            </header>

            <main className="content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
