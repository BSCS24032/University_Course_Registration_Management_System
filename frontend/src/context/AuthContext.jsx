import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Fixes the import for the latest version

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Check if the user is already logged in when the app loads
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                setUser(decodedUser);
            } catch (error) {
                console.error("Invalid token");
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};