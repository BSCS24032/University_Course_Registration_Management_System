import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);

    // If the user is not logged in, send them to the login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If the route requires specific roles and the user's role isn't in the list, deny access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <div style={{ padding: '50px', color: 'red' }}><h2>Unauthorized Access</h2><p>You do not have permission to view this page.</p></div>;
    }

    // If everything is good, render the page!
    return children;
};

export default PrivateRoute;