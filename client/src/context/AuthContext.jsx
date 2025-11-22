import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { id, name, role }
    const [token, setToken] = useState(null);

    const login = async (email, password) => {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
            email,
            password,
        });
        const { accessToken, user: loggedUser } = res.data;
        setToken(accessToken);
        setUser(loggedUser);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const isAdmin = user?.role === 'admin' || user?.email === 'zdevbro@gmail.com';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
