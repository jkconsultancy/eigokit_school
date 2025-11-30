import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './Register.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const schoolIdFromUrl = searchParams.get('school_id');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    schoolName: '',
    contactInfo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [isInvitation, setIsInvitation] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If invitation token is present, fetch invitation details
    if (invitationToken) {
      loadInvitationStatus();
    }
  }, [invitationToken]);

  const loadInvitationStatus = async () => {
    setLoadingInvitation(true);
    try {
      const data = await schoolAPI.getInvitationStatus(invitationToken);
      setInvitationData(data);
      setIsInvitation(true);
      setUserExists(data.user_exists || false);
      
      // Pre-fill form with invitation data
      setFormData(prev => ({
        ...prev,
        email: data.email || '',
        name: data.name || '',
        schoolName: data.school_name || ''
      }));
      
      // If user exists, show message to sign in instead
      if (data.user_exists) {
        setError('');
        setSuccess(`You already have an account. Please sign in to accept the invitation. You can use the link below or sign in with your existing password.`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired invitation');
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // If this is an invitation and user exists, use accept-invitation endpoint
    if (isInvitation && userExists && invitationToken) {
      // Validation for existing users (no password confirmation needed)
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      try {
        const response = await schoolAPI.acceptInvitation(
          invitationToken,
          formData.password,
          null, // No password confirmation for existing users
          formData.name || undefined
        );

        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('school_id', response.school_id);
          localStorage.setItem('user_id', response.user_id);
          setSuccess('Invitation accepted! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setError('Failed to accept invitation. Please try again.');
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to accept invitation. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For new users or new school registration
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // If invitation and new user, use accept-invitation endpoint
      if (isInvitation && invitationToken) {
        const response = await schoolAPI.acceptInvitation(
          invitationToken,
          formData.password,
          formData.confirmPassword,
          formData.name || undefined
        );

        if (response.email_confirmation_required) {
          setError('');
          setSuccess(`Registration successful! Please check your email (${response.email}) and click the confirmation link to activate your account. You will be redirected to sign in.`);
          setTimeout(() => navigate('/signin'), 5000);
        } else if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('school_id', response.school_id);
          localStorage.setItem('user_id', response.user_id);
          setSuccess('Invitation accepted! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setError('Registration successful, but no access token received. Please sign in.');
          setTimeout(() => navigate('/signin'), 3000);
        }
      } else {
        // New school registration (no invitation)
        const response = await schoolAPI.signup(
          formData.email,
          formData.password,
          formData.name,
          formData.schoolName,
          formData.contactInfo || null,
          null
        );

        if (response.email_confirmation_required) {
          setError('');
          setSuccess(`Registration successful! Please check your email (${response.email}) and click the confirmation link to activate your account. You will be redirected to sign in.`);
          setTimeout(() => navigate('/signin'), 5000);
        } else if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('school_id', response.school_id);
          localStorage.setItem('user_id', response.user_id);
          navigate('/dashboard');
        } else {
          setError('Registration successful, but no access token received. Please sign in.');
          setTimeout(() => navigate('/signin'), 3000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvitation) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div>Loading invitation details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>{isInvitation ? 'Accept Invitation' : 'Register Your School'}</h1>
        <p className="register-subtitle">
          {isInvitation 
            ? `You've been invited to join ${invitationData?.school_name || 'a school'} as a school administrator`
            : 'Create your school account to get started'}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {isInvitation && invitationData && (
          <div className="invitation-info">
            <p><strong>School:</strong> {invitationData.school_name}</p>
            <p><strong>Email:</strong> {invitationData.email}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isInvitation && (
            <div className="form-group">
              <label htmlFor="schoolName">School Name *</label>
              <input
                type="text"
                id="schoolName"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                required
                placeholder="Enter your school name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Your Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isInvitation}
              placeholder="Enter your email"
            />
            {isInvitation && <small className="field-note">Email is set by invitation</small>}
          </div>

          <div className="form-group">
            <label htmlFor="contactInfo">Contact Information</label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="Phone number or additional contact info (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>

          {(!isInvitation || !userExists) && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isInvitation || !userExists}
                placeholder="Re-enter your password"
              />
            </div>
          )}
          {isInvitation && userExists && (
            <div className="form-group">
              <p className="field-note" style={{ color: '#6b7280', fontSize: '14px', marginTop: '-10px' }}>
                Since you already have an account, password confirmation is not required.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? (isInvitation ? 'Accepting...' : 'Registering...') : (isInvitation ? 'Accept Invitation' : 'Register')}
          </button>
        </form>

        <div className="signin-link">
          {isInvitation && userExists ? (
            <Link to={`/signin?invitation_token=${invitationToken}`}>
              Or sign in with your existing account
            </Link>
          ) : isInvitation ? (
            <Link to="/signin">Already have an account? Sign in</Link>
          ) : (
            <>Already have an account? <Link to="/signin">Sign in</Link></>
          )}
        </div>
      </div>
    </div>
  );
}

