import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './SignIn.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await schoolAPI.signin(email, password);
      
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        if (response.school_id) {
          localStorage.setItem('school_id', response.school_id);
        }
        navigate('/dashboard');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 'Invalid email or password';
      setError(errorDetail);
      
      // If it's an email confirmation error, make it more prominent
      if (errorDetail.includes('confirm') || errorDetail.includes('verification')) {
        // The error message already contains helpful text from the backend
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h1>School Admin Sign In</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            disabled={loading}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="register-link">
          Don't have an account? <Link to="/register">Register your school</Link>
        </div>
      </div>
    </div>
  );
}

