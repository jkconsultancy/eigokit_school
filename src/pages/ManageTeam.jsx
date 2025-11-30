import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { loadTheme } from '../lib/theme';
import './ManageTeam.css';

export default function ManageTeam() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [resendingInvite, setResendingInvite] = useState({});
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (!schoolId) {
      return;
    }
    // Load theme for branding
    loadTheme(schoolId);
    loadAdmins();
  }, [schoolId]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await schoolAPI.getSchoolAdmins(schoolId);
      setAdmins(response.admins || []);
      setError('');
    } catch (err) {
      console.error('Error loading admins:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load team members';
      setError(errorMessage);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      if (editingAdmin) {
        await schoolAPI.updateSchoolAdmin(schoolId, editingAdmin.id, formData.name.trim(), formData.email.trim());
        setSuccess('Admin updated successfully!');
      } else {
        await schoolAPI.inviteSchoolAdmin(schoolId, formData.email.trim(), formData.name.trim());
        setSuccess('Invitation sent successfully!');
      }
      setShowForm(false);
      setEditingAdmin(null);
      setFormData({ name: '', email: '' });
      loadAdmins();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || (editingAdmin ? 'Failed to update admin' : 'Failed to send invitation'));
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({ name: admin.name || '', email: admin.email });
    setShowForm(true);
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to remove this team member from the school?')) return;
    try {
      await schoolAPI.deleteSchoolAdmin(schoolId, adminId);
      setSuccess('Team member removed successfully!');
      setTimeout(() => setSuccess(''), 5000);
      loadAdmins();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || 'Failed to remove team member');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAdmin(null);
    setFormData({ name: '', email: '' });
    setError('');
    setSuccess('');
  };

  const getAdminStatus = (admin) => {
    // Check if admin is inactive (only for accepted admins with user accounts)
    if (admin.id && admin.is_active === false) {
      return { text: 'Inactive', class: 'status-inactive' };
    }
    
    // If no invitation_status or status is accepted, assume active
    if (!admin.invitation_status || admin.invitation_status === 'accepted') {
      return { text: 'Active', class: 'status-active' };
    }
    
    switch (admin.invitation_status) {
      case 'pending':
        // Check if expired
        if (admin.invitation_expires_at) {
          const expiresAt = new Date(admin.invitation_expires_at);
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

  const handleToggleActive = async (admin) => {
    if (!admin.id) {
      setError('Cannot change status for pending invitations');
      return;
    }
    try {
      const newActiveStatus = !(admin.is_active !== false);
      await schoolAPI.updateSchoolAdmin(schoolId, admin.id, admin.name, admin.email, newActiveStatus);
      setSuccess(`Team member ${newActiveStatus ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      loadAdmins();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      setError(err.response?.data?.detail || 'Failed to update team member status');
    }
  };

  const handleResendInvite = async (adminId) => {
    try {
      setResendingInvite(prev => ({ ...prev, [adminId]: true }));
      setError('');
      setSuccess('');
      const response = await schoolAPI.resendSchoolAdminInvitation(schoolId, adminId);
      if (response.invitation_sent) {
        await loadAdmins();
        setSuccess('Invitation email sent successfully!');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        let errorMessage = response.message || 'Failed to send invitation email.';
        
        if (response.error === 'email_service_not_configured') {
          errorMessage = 'Email service is not configured. The invitation token has been updated, but no email was sent. Please configure RESEND_API_KEY in your backend .env file.';
        } else if (response.error === 'email_send_failed') {
          errorMessage = 'Invitation token updated, but email failed to send. Please check your email service configuration (Resend API key and settings).';
        }
        
        setError(errorMessage);
        await loadAdmins();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        localStorage.removeItem('user_id');
        window.location.href = '/signin';
        return;
      }
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(errorDetail || 'Failed to resend invitation. Please try again.');
    } finally {
      setResendingInvite(prev => ({ ...prev, [adminId]: false }));
    }
  };

  if (loading) {
    return <div className="manage-page"><div className="manage-container">Loading...</div></div>;
  }

  return (
    <div className="manage-page">
      <div className="manage-container">
        <h1>Manage Team</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="actions-bar">
          <button className="add-button" onClick={() => { setShowForm(true); setEditingAdmin(null); setFormData({ name: '', email: '' }); }}>
            + Invite Team Member
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingAdmin ? 'Edit Team Member' : 'Invite School Admin'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Team member name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">{editingAdmin ? 'Update' : 'Send Invitation'}</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="admins-list">
          {admins.length === 0 ? (
            <div className="empty-state">No team members found. Invite your first team member to get started.</div>
          ) : (
            admins.map(admin => {
              const status = getAdminStatus(admin);
              // Use invitation_id for pending invitations, id for accepted admins
              const identifier = admin.id || admin.invitation_id;
              const isPending = !admin.id && admin.invitation_status === 'pending';
              
              // Show resend button for pending, expired, or admins without invitation_status
              const showResendButton = admin.invitation_status === 'pending' || 
                                       admin.invitation_status === 'expired' || 
                                       !admin.invitation_status ||
                                       status.class === 'status-expired' ||
                                       status.class === 'status-pending';
              
              return (
                <div key={identifier || admin.email} className="admin-card">
                  <div className="admin-info">
                    <div className="admin-header">
                      <h3>{admin.name || admin.email.split('@')[0] || 'School Admin'}</h3>
                      <span className={`status-badge ${status.class}`}>{status.text}</span>
                    </div>
                    <p>{admin.email}</p>
                  </div>
                  <div className="admin-actions">
                    {showResendButton && (
                      <button 
                        className="resend-button" 
                        onClick={() => handleResendInvite(identifier)}
                        disabled={resendingInvite[identifier]}
                      >
                        {resendingInvite[identifier] ? 'Sending...' : 'Resend Invite'}
                      </button>
                    )}
                    {!isPending && admin.id && (
                      <button 
                        className={admin.is_active !== false ? "deactivate-button" : "activate-button"}
                        onClick={() => handleToggleActive(admin)}
                      >
                        {admin.is_active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {!isPending && (
                      <button className="edit-button" onClick={() => handleEdit(admin)}>Edit</button>
                    )}
                    <button className="delete-button" onClick={() => handleDelete(identifier)}>Delete</button>
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
