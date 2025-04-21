import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import apiService from '../../services/apiService';
const { getToken } = apiService;

const ProtectedRoute = () => {
  try {
    console.log('ProtectedRoute rendering');
    const isAuthenticated = !!getToken();
    console.log('isAuthenticated:', isAuthenticated);

    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      console.log('Redirecting to login because user is not authenticated');
      return <Navigate to="/login" replace />;
    }

    // Render the protected content
    console.log('Rendering protected content');
    return <Outlet />;
  } catch (error) {
    console.error('Error in ProtectedRoute:', error);
    return (
      <div style={{ padding: '20px', color: 'white', backgroundColor: '#333', borderRadius: '8px', margin: '20px' }}>
        <h2>Error in ProtectedRoute</h2>
        <pre>{error.toString()}</pre>
      </div>
    );
  }
};

export default ProtectedRoute;
