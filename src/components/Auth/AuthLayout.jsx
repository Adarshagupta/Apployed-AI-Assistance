import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import apiService from '../../services/apiService';
const { getToken } = apiService;

const AuthLayout = ({ requireAuth = false }) => {
  try {
    console.log('AuthLayout rendering, requireAuth:', requireAuth);
    const isAuthenticated = !!getToken();
    console.log('isAuthenticated:', isAuthenticated);

    // If authentication is required but user is not authenticated, redirect to login
    if (requireAuth && !isAuthenticated) {
      console.log('Redirecting to login because authentication is required');
      return <Navigate to="/login" replace />;
    }

    // If user is already authenticated and tries to access login/register, redirect to home
    if (!requireAuth && isAuthenticated) {
      console.log('Redirecting to home because user is already authenticated');
      return <Navigate to="/" replace />;
    }

    return (
      <div className="auth-layout">
        <div className="auth-logo">
          <h1 className="app-logo-text">Apployd AI</h1>
        </div>
        <Outlet />
      </div>
    );
  } catch (error) {
    console.error('Error in AuthLayout:', error);
    return (
      <div style={{ padding: '20px', color: 'white', backgroundColor: '#333', borderRadius: '8px', margin: '20px' }}>
        <h2>Error in AuthLayout</h2>
        <pre>{error.toString()}</pre>
      </div>
    );
  }
};

export default AuthLayout;
