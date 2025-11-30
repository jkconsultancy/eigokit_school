import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { loadTheme } from '../lib/theme';
import { ICONS, getIconsByIds } from '../constants/icons';
import './Students.css';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [generatingSequence, setGeneratingSequence] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    icon_sequence: []
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

  // Generate icon sequence when form opens for new student (if name is already filled)
  useEffect(() => {
    if (showForm && !editingStudent && formData.name.trim() && formData.icon_sequence.length === 0) {
      generateIconSequence(formData.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, editingStudent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        schoolAPI.getStudents(schoolId),
        schoolAPI.getClasses(schoolId)
      ]);
      setStudents(studentsRes.students || []);
      setClasses(classesRes.classes || []);
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
    setSuccess('');
    try {
      // Convert icon_sequence array to comma-separated string for API
      const iconSequenceStr = Array.isArray(formData.icon_sequence) && formData.icon_sequence.length > 0
        ? formData.icon_sequence.join(', ')
        : null;

      if (editingStudent) {
        await schoolAPI.updateStudent(schoolId, editingStudent.id, {
          ...formData,
          icon_sequence: iconSequenceStr
        });
      } else {
        await schoolAPI.addStudent(schoolId, formData.name, formData.class_id, iconSequenceStr);
      }
      setShowForm(false);
      setEditingStudent(null);
      setFormData({ name: '', class_id: '', icon_sequence: [] });
      loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to save student';
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

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      class_id: student.class_id || '',
      icon_sequence: Array.isArray(student.icon_sequence) ? student.icon_sequence : []
    });
    setShowForm(true);
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await schoolAPI.deleteStudent(schoolId, studentId);
      loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to delete student';
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

  const handleToggleActive = async (student) => {
    try {
      setError('');
      const newActiveStatus = !(student.is_active !== false);
      await schoolAPI.updateStudent(schoolId, student.id, { is_active: newActiveStatus });
      setSuccess(`Student ${newActiveStatus ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      setSuccess('');
      setError(err.response?.data?.detail || 'Failed to update student status');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: '', class_id: '', icon_sequence: [] });
  };

  const generateIconSequence = async (studentName) => {
    if (!studentName || !studentName.trim()) {
      setFormData(prev => ({ ...prev, icon_sequence: [] }));
      return;
    }

    try {
      setGeneratingSequence(true);
      const response = await schoolAPI.getAvailableIconSequence(schoolId, studentName.trim());
      setFormData(prev => ({ ...prev, icon_sequence: response.icon_sequence || [] }));
    } catch (err) {
      console.error('Failed to generate icon sequence:', err);
      // Fallback: generate a random sequence locally (order matters, don't sort!)
      const randomSequence = [];
      const availableIds = Array.from({ length: 24 }, (_, i) => i + 1);
      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * availableIds.length);
        randomSequence.push(availableIds.splice(randomIndex, 1)[0]);
      }
      // Don't sort - order matters for authentication!
      setFormData(prev => ({ ...prev, icon_sequence: randomSequence }));
    } finally {
      setGeneratingSequence(false);
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    // Generate sequence when name changes (debounced would be better, but this works)
    if (newName.trim() && !editingStudent) {
      generateIconSequence(newName);
    }
  };

  const getClassName = (classId) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown';
  };

  if (loading) {
    return <div className="students-page"><div className="students-container">Loading...</div></div>;
  }

  return (
    <div className="manage-page">
      <div className="manage-container">
        <h1>Manage Students</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>

        {error && <div className="error-message">{String(error)}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="actions-bar">
          <button className="add-button" onClick={() => { 
            setShowForm(true); 
            setEditingStudent(null); 
            setFormData({ name: '', class_id: '', icon_sequence: [] }); 
          }}>
            + Add Student
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  placeholder="Student name"
                />
              </div>
              <div className="form-group">
                <label>Class *</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map(classItem => (
                    <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Registration Code {generatingSequence && <span className="generating-text">(Generating...)</span>}</label>
                {formData.icon_sequence && formData.icon_sequence.length === 4 ? (
                  <div className="icon-sequence-display">
                    <div className="icon-sequence-icons">
                      {formData.icon_sequence.map((iconId, index) => {
                        const icon = ICONS.find(i => i.id === iconId);
                        return (
                          <div key={index} className="sequence-icon-item">
                            <span className="icon-emoji-large">{icon?.emoji || '?'}</span>
                            <span className="icon-position">{index + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      type="button" 
                      className="regenerate-button"
                      onClick={() => generateIconSequence(formData.name)}
                      disabled={generatingSequence || !formData.name.trim()}
                    >
                      {generatingSequence ? 'Generating...' : '🔄 Generate New Code'}
                    </button>
                    <small className="form-help">Students will use these 4 icons in this order to sign in</small>
                  </div>
                ) : (
                  <div className="icon-sequence-placeholder">
                    <p>Enter a student name to generate a registration code</p>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">{editingStudent ? 'Update' : 'Create'}</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="students-list">
          {students.length === 0 ? (
            <div className="empty-state">No students found. Add your first student to get started.</div>
          ) : (
            students.map(student => (
              <div key={student.id} className="student-card">
                <div className="student-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3>{student.name}</h3>
                    {student.is_active === false && (
                      <span className="status-badge status-inactive">Inactive</span>
                    )}
                  </div>
                  <p><strong>Class:</strong> {getClassName(student.class_id)}</p>
                  {student.icon_sequence && Array.isArray(student.icon_sequence) && student.icon_sequence.length > 0 && (
                    <div className="student-registration-code">
                      <strong>Registration Code:</strong>
                      <div className="student-icon-sequence">
                        {student.icon_sequence.map((iconId, index) => {
                          const icon = ICONS.find(i => i.id === iconId);
                          return (
                            <span key={index} className="student-icon-item" title={`Position ${index + 1}`}>
                              {icon?.emoji || '?'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p><strong>Status:</strong> {student.registration_status || 'pending'}</p>
                </div>
                <div className="student-actions">
                  <button 
                    className={student.is_active !== false ? "deactivate-button" : "activate-button"}
                    onClick={() => handleToggleActive(student)}
                  >
                    {student.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="edit-button" onClick={() => handleEdit(student)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(student.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

