import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './SignIn.css';

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation_token');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [invitationInfo, setInvitationInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If invitation token is present, fetch invitation details
    if (invitationToken) {
      loadInvitationStatus();
    }
  }, [invitationToken]);

  const loadInvitationStatus = async () => {
    try {
      const data = await schoolAPI.getInvitationStatus(invitationToken);
      setInvitationInfo(data);
      setEmail(data.email || ''); // Pre-fill email from invitation
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired invitation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If there's an invitation token, use accept-invitation endpoint instead of signin
      // This handles both signin and role update in one step
      if (invitationToken) {
        const response = await schoolAPI.acceptInvitation(
          invitationToken,
          password,
          null, // No password confirmation needed for existing users
          null  // Name already set from invitation
        );
        
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          if (response.school_id) {
            localStorage.setItem('school_id', response.school_id);
          }
          if (response.user_id) {
            localStorage.setItem('user_id', response.user_id);
          }
          navigate('/dashboard');
        } else if (response.email_confirmation_required) {
          setError(`Please check your email (${response.email}) and click the confirmation link to activate your account.`);
        } else {
          setError('Failed to accept invitation. Please try again.');
        }
      } else {
        // Regular signin (no invitation)
        const response = await schoolAPI.signin(email, password);
        
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          
          // Multi-role support: Check if user has multiple school_admin roles
          if (response.roles && response.roles.length > 1) {
            // User has multiple schools - store roles and show selection
            localStorage.setItem('user_roles', JSON.stringify(response.roles));
            // If no school_id in response, navigate to school selection
            if (!response.school_id) {
              navigate('/select-school');
              return;
            }
          }
          
          // Single school or school_id provided
          if (response.school_id) {
            localStorage.setItem('school_id', response.school_id);
          } else if (response.roles && response.roles.length === 1) {
            // Only one school, auto-select it
            localStorage.setItem('school_id', response.roles[0].school_id);
          }
          
          navigate('/dashboard');
        } else {
          setError('Sign in failed. Please try again.');
        }
      }
    } catch (err) {
      const errorDetail = err.response?.data?.detail || (invitationToken ? 'Failed to accept invitation' : 'Invalid email or password');
      setError(errorDetail);
      
      // If it's an email confirmation error, make it more prominent
      if (errorDetail.includes('confirm') || errorDetail.includes('verification')) {
        // The error message already contains helpful text from the backend
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetMessage('');
    setResetError('');
    try {
      const response = await schoolAPI.requestPasswordReset(email);
      setResetMessage(response.message || 'If an account exists, a reset email has been sent.');
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Unable to request password reset. Please try again later.');
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h1>School Admin Sign In</h1>
        {invitationInfo && (
          <div className="info-message" style={{ marginBottom: '20px', padding: '15px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px' }}>
            <strong>Accepting Invitation</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              You've been invited to join <strong>{invitationInfo.school_name}</strong> as a school administrator.
              Sign in with your existing account to accept the invitation.
            </p>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {resetMessage && <div className="info-message">{resetMessage}</div>}
        {resetError && <div className="error-message">{resetError}</div>}
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
        <div className="forgot-password">
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={loading || !email}
            className="forgot-password-link"
          >
            Forgot password?
          </button>
        </div>
        <div className="register-link">
          Don't have an account? <Link to="/register">Register your school</Link>
        </div>
      </div>
    </div>
  );
}

