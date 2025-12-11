import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const SuperAdminContext = createContext();

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider = ({ children }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superAdminData, setSuperAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role === 'SuperAdmin') {
          setIsSuperAdmin(true);
          setSuperAdminData(user);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  };

  const loginSuperAdmin = async (email, password) => {
    try {
      console.log('Attempting SuperAdmin login with:', { email });
      
      const response = await axios.post(`${API_URL}/api/v1/user/login`, {
        email,
        password,
      });

      console.log('Login response:', response.data);

      if (response.data.status) {
        const { token, data } = response.data;
        
        // Check if user is SuperAdmin
        if (data.role === 'SuperAdmin') {
          localStorage.setItem('token', token);
          localStorage.setItem('userData', JSON.stringify(data));
          
          setIsSuperAdmin(true);
          setSuperAdminData(data);
          
          return { success: true, data };
        } else {
          return { success: false, message: 'Access denied. SuperAdmin privileges required.' };
        }
      }
      
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('SuperAdmin login error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid credentials or server error' 
      };
    }
  };

  const logoutSuperAdmin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setIsSuperAdmin(false);
    setSuperAdminData(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  return (
    <SuperAdminContext.Provider
      value={{
        isSuperAdmin,
        superAdminData,
        loading,
        loginSuperAdmin,
        logoutSuperAdmin,
        getAuthHeaders,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};
