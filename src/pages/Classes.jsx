import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { loadTheme } from '../lib/theme';
import './Classes.css';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    teacher_id: '',
    location_id: ''
  });
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [teacherDialogData, setTeacherDialogData] = useState({ name: '', email: '' });
  const [locationDialogData, setLocationDialogData] = useState({
    name: '',
    address: '',
    city: '',
    prefecture: '',
    postal_code: '',
    phone: '',
    email: '',
    is_active: true
  });
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (!schoolId) {
      return;
    }
    // Load theme for branding
    loadTheme(schoolId);
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes, locationsRes] = await Promise.all([
        schoolAPI.getClasses(schoolId),
        schoolAPI.getTeachers(schoolId),
        schoolAPI.getLocations(schoolId)
      ]);
      setClasses(classesRes.classes || []);
      setTeachers(teachersRes.teachers || []);
      setLocations(locationsRes.locations || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to load data';
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingClass) {
        await schoolAPI.updateClass(schoolId, editingClass.id, formData);
      } else {
        await schoolAPI.addClass(schoolId, formData.name, formData.teacher_id, formData.location_id || null);
      }
      setShowForm(false);
      setEditingClass(null);
      setFormData({ name: '', teacher_id: '', location_id: '' });
      loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to save class';
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name || '',
      teacher_id: classItem.teacher_id || '',
      location_id: classItem.location_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class? This will also delete all students in this class.')) return;
    try {
      await schoolAPI.deleteClass(schoolId, classId);
      loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to delete class';
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormData({ name: '', teacher_id: '', location_id: '' });
  };

  const handleTeacherSelect = (e) => {
    const value = e.target.value;
    if (value === '__add_new_teacher__') {
      setError(''); // Clear any previous errors
      setShowTeacherDialog(true);
    } else {
      setFormData({ ...formData, teacher_id: value });
    }
  };

  const handleLocationSelect = (e) => {
    const value = e.target.value;
    if (value === '__add_new_location__') {
      setError(''); // Clear any previous errors
      setShowLocationDialog(true);
    } else {
      setFormData({ ...formData, location_id: value });
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await schoolAPI.addTeacher(schoolId, teacherDialogData.name, teacherDialogData.email);
      setShowTeacherDialog(false);
      setTeacherDialogData({ name: '', email: '' });
      setError(''); // Clear any previous errors
      // Reload teachers and select the new one
      const teachersRes = await schoolAPI.getTeachers(schoolId);
      setTeachers(teachersRes.teachers || []);
      setFormData({ ...formData, teacher_id: response.teacher_id });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to create teacher';
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      // Keep dialog open on error so user can fix and retry
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      const response = await schoolAPI.createLocation(schoolId, locationDialogData);
      setShowLocationDialog(false);
      setLocationDialogData({
        name: '',
        address: '',
        city: '',
        prefecture: '',
        postal_code: '',
        phone: '',
        email: '',
        is_active: true
      });
      setError(''); // Clear any previous errors
      // Reload locations and select the new one
      const locationsRes = await schoolAPI.getLocations(schoolId);
      setLocations(locationsRes.locations || []);
      setFormData({ ...formData, location_id: response.location_id });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to create location';
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      // Keep dialog open on error so user can fix and retry
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const getLocationName = (locationId) => {
    if (!locationId) return 'No location';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  if (loading) {
    return <div className="manage-page"><div className="manage-container">Loading...</div></div>;
  }

  return (
    <div className="manage-page">
      <div className="manage-container">
        <h1>Manage Classes</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>

        {error && <div className="error-message">{String(error)}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="actions-bar">
          <button className="add-button" onClick={() => { setShowForm(true); setEditingClass(null); setFormData({ name: '', teacher_id: '', location_id: '' }); }}>
            + Add Class
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Class name"
                />
              </div>
              <div className="form-group">
                <label>Teacher *</label>
                <select
                  value={formData.teacher_id}
                  onChange={handleTeacherSelect}
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>
                  ))}
                  <option value="__add_new_teacher__" className="add-new-option">+ Add New Teacher</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <select
                  value={formData.location_id}
                  onChange={handleLocationSelect}
                >
                  <option value="">No location</option>
                  {locations.filter(l => l.is_active).map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                  <option value="__add_new_location__" className="add-new-option">+ Add New Location</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">{editingClass ? 'Update' : 'Create'}</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Teacher Dialog */}
        {showTeacherDialog && (
          <div className="dialog-overlay" onClick={() => { setShowTeacherDialog(false); setError(''); }}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h2>Add New Teacher</h2>
                <button className="dialog-close" onClick={() => { setShowTeacherDialog(false); setError(''); }}>×</button>
              </div>
              {error && <div className="error-message">{String(error)}</div>}
              <form onSubmit={handleCreateTeacher}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={teacherDialogData.name}
                    onChange={(e) => setTeacherDialogData({ ...teacherDialogData, name: e.target.value })}
                    required
                    placeholder="Teacher name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={teacherDialogData.email}
                    onChange={(e) => setTeacherDialogData({ ...teacherDialogData, email: e.target.value })}
                    required
                    placeholder="teacher@example.com"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button">Create Teacher</button>
                  <button type="button" className="cancel-button" onClick={() => setShowTeacherDialog(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Dialog */}
        {showLocationDialog && (
          <div className="dialog-overlay" onClick={() => { setShowLocationDialog(false); setError(''); }}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h2>Add New Location</h2>
                <button className="dialog-close" onClick={() => { setShowLocationDialog(false); setError(''); }}>×</button>
              </div>
              {error && <div className="error-message">{String(error)}</div>}
              <form onSubmit={handleCreateLocation}>
                <div className="form-group">
                  <label>Location Name *</label>
                  <input
                    type="text"
                    value={locationDialogData.name}
                    onChange={(e) => setLocationDialogData({ ...locationDialogData, name: e.target.value })}
                    required
                    placeholder="Main Campus"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prefecture</label>
                    <input
                      type="text"
                      value={locationDialogData.prefecture}
                      onChange={(e) => setLocationDialogData({ ...locationDialogData, prefecture: e.target.value })}
                      placeholder="Tokyo"
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={locationDialogData.city}
                      onChange={(e) => setLocationDialogData({ ...locationDialogData, city: e.target.value })}
                      placeholder="City name"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={locationDialogData.address}
                    onChange={(e) => setLocationDialogData({ ...locationDialogData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={locationDialogData.postal_code}
                      onChange={(e) => setLocationDialogData({ ...locationDialogData, postal_code: e.target.value })}
                      placeholder="123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={locationDialogData.phone}
                      onChange={(e) => setLocationDialogData({ ...locationDialogData, phone: e.target.value })}
                      placeholder="03-1234-5678"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={locationDialogData.email}
                    onChange={(e) => setLocationDialogData({ ...locationDialogData, email: e.target.value })}
                    placeholder="location@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={locationDialogData.is_active}
                      onChange={(e) => setLocationDialogData({ ...locationDialogData, is_active: e.target.checked })}
                    />
                    Active Location
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button">Create Location</button>
                  <button type="button" className="cancel-button" onClick={() => setShowLocationDialog(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="classes-list">
          {classes.length === 0 ? (
            <div className="empty-state">No classes found. Add your first class to get started.</div>
          ) : (
            classes.map(classItem => (
              <div key={classItem.id} className="class-card">
                <div className="class-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3>{classItem.name}</h3>
                    {classItem.is_active === false && (
                      <span className="status-badge status-inactive">Inactive</span>
                    )}
                  </div>
                  <p><strong>Teacher:</strong> {getTeacherName(classItem.teacher_id)}</p>
                  <p><strong>Location:</strong> {getLocationName(classItem.location_id)}</p>
                </div>
                <div className="class-actions">
                  <button 
                    className={classItem.is_active !== false ? "deactivate-button" : "activate-button"}
                    onClick={() => handleToggleActive(classItem)}
                  >
                    {classItem.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="edit-button" onClick={() => handleEdit(classItem)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(classItem.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

