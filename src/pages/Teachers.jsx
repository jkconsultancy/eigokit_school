import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { loadTheme } from '../lib/theme';
import './Teachers.css';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [resendingInvite, setResendingInvite] = useState({});
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (!schoolId) {
      return;
    }
    // Load theme for branding
    loadTheme(schoolId);
    loadTeachers();
  }, [schoolId]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await schoolAPI.getTeachers(schoolId);
      setTeachers(response.teachers || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        // Session expired or invalid - log out and redirect to sign in
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTeacher) {
        await schoolAPI.updateTeacher(schoolId, editingTeacher.id, formData.name, formData.email);
      } else {
        await schoolAPI.addTeacher(schoolId, formData.name, formData.email);
      }
      setShowForm(false);
      setEditingTeacher(null);
      setFormData({ name: '', email: '' });
      loadTeachers();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || 'Failed to save teacher');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({ name: teacher.name, email: teacher.email });
    setShowForm(true);
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await schoolAPI.deleteTeacher(schoolId, teacherId);
      loadTeachers();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || 'Failed to delete teacher');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({ name: '', email: '' });
  };

  const getTeacherStatus = (teacher) => {
    // Check if teacher is inactive
    if (teacher.is_active === false) {
      return { text: 'Inactive', class: 'status-inactive' };
    }
    
    // If no invitation_status, assume active (legacy teacher or pre-invitation system)
    if (!teacher.invitation_status || teacher.invitation_status === 'accepted') {
      return { text: 'Active', class: 'status-active' };
    }
    
    switch (teacher.invitation_status) {
      case 'pending':
        // Check if expired
        if (teacher.invitation_expires_at) {
          const expiresAt = new Date(teacher.invitation_expires_at);
          if (expiresAt < new Date()) {
            return { text: 'Expired', class: 'status-expired' };
          }
        }
        return { text: 'Awaiting Confirmation', class: 'status-pending' };
      case 'expired':
        return { text: 'Expired', class: 'status-expired' };
      default:
        return { text: 'Inactive', class: 'status-inactive' };
    }
  };

  const handleToggleActive = async (teacher) => {
    try {
      const newActiveStatus = !(teacher.is_active !== false);
      await schoolAPI.updateTeacher(schoolId, teacher.id, teacher.name, teacher.email, newActiveStatus);
      setSuccess(`Teacher ${newActiveStatus ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      loadTeachers();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || 'Failed to update teacher status');
    }
  };

  const handleResendInvite = async (teacherId) => {
    try {
      setResendingInvite(prev => ({ ...prev, [teacherId]: true }));
      setError(''); // Clear previous errors
      setSuccess(''); // Clear previous success messages
      const response = await schoolAPI.resendTeacherInvitation(schoolId, teacherId);
      if (response.invitation_sent) {
        // Reload teachers to get updated status
        await loadTeachers();
        setSuccess('Invitation email sent successfully!');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        // Show more specific error message
        let errorMessage = response.message || 'Failed to send invitation email.';
        
        if (response.error === 'email_service_not_configured') {
          errorMessage = 'Email service is not configured. The invitation token has been updated, but no email was sent. Please configure RESEND_API_KEY in your backend .env file.';
        } else if (response.error === 'email_send_failed') {
          errorMessage = 'Invitation token updated, but email failed to send. Please check your email service configuration (Resend API key and settings).';
        }
        
        setError(errorMessage);
        // Still reload to show updated token/status
        await loadTeachers();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // Treat invalid authentication as an expired session
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(errorDetail || 'Failed to resend invitation. Please try again.');
    } finally {
      setResendingInvite(prev => ({ ...prev, [teacherId]: false }));
    }
  };

  if (loading) {
    return <div className="teachers-page"><div className="teachers-container">Loading...</div></div>;
  }

  return (
    <div className="manage-page">
      <div className="manage-container">
        <h1>Manage Teachers</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="actions-bar">
          <button className="add-button" onClick={() => { setShowForm(true); setEditingTeacher(null); setFormData({ name: '', email: '' }); }}>
            + Add Teacher
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Teacher name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="teacher@example.com"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">{editingTeacher ? 'Update' : 'Create'}</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="teachers-list">
          {teachers.length === 0 ? (
            <div className="empty-state">No teachers found. Add your first teacher to get started.</div>
          ) : (
            teachers.map(teacher => {
              const status = getTeacherStatus(teacher);
              // Show resend button for pending, expired, or teachers without invitation_status (legacy)
              const showResendButton = teacher.invitation_status === 'pending' || 
                                       teacher.invitation_status === 'expired' || 
                                       !teacher.invitation_status ||
                                       status.class === 'status-expired' ||
                                       status.class === 'status-pending';
              
              return (
                <div key={teacher.id} className="teacher-card">
                  <div className="teacher-info">
                    <div className="teacher-header">
                      <h3>{teacher.name}</h3>
                      <span className={`status-badge ${status.class}`}>{status.text}</span>
                    </div>
                    <p>{teacher.email}</p>
                  </div>
                  <div className="teacher-actions">
                    {showResendButton && (
                      <button 
                        className="resend-button" 
                        onClick={() => handleResendInvite(teacher.id)}
                        disabled={resendingInvite[teacher.id]}
                      >
                        {resendingInvite[teacher.id] ? 'Sending...' : 'Resend Invite'}
                      </button>
                    )}
                    <button 
                      className={teacher.is_active !== false ? "deactivate-button" : "activate-button"}
                      onClick={() => handleToggleActive(teacher)}
                    >
                      {teacher.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="edit-button" onClick={() => handleEdit(teacher)}>Edit</button>
                    <button className="delete-button" onClick={() => handleDelete(teacher.id)}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

