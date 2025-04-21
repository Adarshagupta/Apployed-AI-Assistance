import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/apiService';
const { authAPI, setToken } = apiService;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // For debugging
  useEffect(() => {
    console.log('Login component mounted');
    return () => console.log('Login component unmounted');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      console.log('Attempting login with email:', email);

      // For testing purposes, let's use a mock response
      // Comment this out when the backend is ready
      const mockResponse = {
        id: '123',
        name: 'Test User',
        email: email,
        token: 'mock-token-123',
        profilePicture: null
      };

      // Uncomment this when the backend is ready
      // const response = await authAPI.login({ email, password });
      const response = mockResponse;

      console.log('Login successful, response:', response);

      // Store token and user info
      setToken(response.token);
      localStorage.setItem('apployd_user', JSON.stringify({
        id: response.id,
        name: response.name,
        email: response.email,
        profilePicture: response.profilePicture
      }));

      // Redirect to home page
      console.log('Redirecting to home page');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome to Apployd AI</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
