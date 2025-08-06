import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser as apiLoginUser, getCurrentUser as apiGetCurrentUser, logoutUser as apiLogoutUser } from '../services/authService';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                axios.defaults.headers.common['Authorization'] = `Token ${currentToken}`;
                try {
                    const userData = await apiGetCurrentUser();
                    setCurrentUser(userData);
                    setToken(currentToken);
                } catch (error) {
                    console.error('AuthContext: Failed to fetch current user during init', error);
                    localStorage.removeItem('authToken');
                    delete axios.defaults.headers.common['Authorization'];
                    setCurrentUser(null);
                    setToken(null);
                }
            } else {
                delete axios.defaults.headers.common['Authorization'];
                setCurrentUser(null);
                setToken(null);
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (username, password) => {
        setIsLoading(true);
        try {
            const tokenData = await apiLoginUser(username, password);
            setToken(tokenData.token);
            const userData = await apiGetCurrentUser();
            setCurrentUser(userData);
            setIsLoading(false);
            return userData;
        } catch (error) {
            setIsLoading(false);
            setCurrentUser(null);
            setToken(null);
            // apiLoginUser in authService already handles clearing token from localStorage and axios headers on failure.
            throw error;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await apiLogoutUser();
        setCurrentUser(null);
        setToken(null);
        setIsLoading(false);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ currentUser, token, login, logout, isLoading, setCurrentUser, setToken }}>
            {!isLoading && children} 
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
