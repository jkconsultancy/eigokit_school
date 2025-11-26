import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './Teachers.css';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const navigate = useNavigate();
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (!schoolId) {
      navigate('/signin');
      return;
    }
    loadTeachers();
  }, [schoolId, navigate]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await schoolAPI.getTeachers(schoolId);
      setTeachers(response.teachers || []);
      setError('');
    } catch (err) {
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
      setError(err.response?.data?.detail || 'Failed to delete teacher');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({ name: '', email: '' });
  };

  if (loading) {
    return <div className="teachers-page"><div className="teachers-container">Loading...</div></div>;
  }

  return (
    <div className="teachers-page">
      <div className="teachers-container">
        <div className="page-header">
          <h1>Manage Teachers</h1>
          <button className="back-button" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        </div>

        {error && <div className="error-message">{error}</div>}

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
            teachers.map(teacher => (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-info">
                  <h3>{teacher.name}</h3>
                  <p>{teacher.email}</p>
                </div>
                <div className="teacher-actions">
                  <button className="edit-button" onClick={() => handleEdit(teacher)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(teacher.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

