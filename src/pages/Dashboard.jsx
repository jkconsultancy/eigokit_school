import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { loadTheme } from '../lib/theme';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [locations, setLocations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const navigate = useNavigate();
  
  // Use 'school_id' (with underscore) to match what sign-in stores
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (!schoolId) {
      setError('No school ID found. Please sign in again.');
      setLoading(false);
      return;
    }

    // Load theme for branding
    loadTheme(schoolId);
    
    // Load all data in parallel
    Promise.all([
      schoolAPI.getDashboard(schoolId),
      schoolAPI.getLocations(schoolId),
      schoolAPI.getClasses(schoolId),
      schoolAPI.getStudents(schoolId),
      schoolAPI.getSchool(schoolId)
    ])
      .then(([dashboardData, locationsData, classesData, studentsData, schoolData]) => {
        setDashboard(dashboardData);
        setLocations((locationsData.locations || []).filter(l => l.is_active));
        setClasses(classesData.classes || []);
        setStudents(studentsData.students || []);
        setSchool(schoolData.school);
        setSchoolName(schoolData.school?.name || '');
        setError(null);
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          setError('Cannot connect to the server. Please make sure the backend is running and check your API URL configuration.');
        } else if (err.response?.status === 401) {
          // Unauthorized - redirect to sign in
          localStorage.removeItem('access_token');
          localStorage.removeItem('school_id');
          navigate('/signin');
        } else {
          setError(err.response?.data?.detail || 'Failed to load dashboard. Please try again.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [schoolId, navigate]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/signin')}>Go to Sign In</button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div>No data available</div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('school_id');
    localStorage.removeItem('user_id');
    navigate('/signin');
  };

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    setNameError('');
    setNameSuccess('');
    
    if (!schoolName.trim()) {
      setNameError('School name cannot be empty');
      return;
    }
    
    setSavingName(true);
    try {
      const result = await schoolAPI.updateSchool(schoolId, schoolName.trim());
      setSchool(result.school);
      setIsEditingName(false);
      setNameSuccess('School name updated successfully!');
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating school name:', err);
      setNameError(err.response?.data?.detail || 'Failed to update school name');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setSchoolName(school?.name || '');
    setIsEditingName(false);
    setNameError('');
    setNameSuccess('');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="school-name-container">
            {isEditingName ? (
              <div className="school-name-edit-container">
                {nameError && <div className="name-error-message">{nameError}</div>}
                {nameSuccess && <div className="name-success-message">{nameSuccess}</div>}
                <div className="school-name-edit">
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="school-name-input"
                    autoFocus
                  />
                  <button
                    className="save-button"
                    onClick={handleSaveName}
                    disabled={savingName}
                  >
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={savingName}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="school-name-display">
                <h1>{school?.name || 'Loading...'}</h1>
                <button
                  className="edit-icon-button"
                  onClick={handleEditName}
                  title="Edit school name"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
        <nav>
          <Link to="/teachers">Manage Teachers</Link>
          <Link to="/locations">Manage Locations</Link>
          <Link to="/classes">Manage Classes</Link>
          <Link to="/students">Manage Students</Link>
          <Link to="/payments">Payments</Link>
          <Link to="/branding">Branding</Link>
          <Link to="/team">Manage Team</Link>
        </nav>
        <div className="metrics">
          <div className="metric-card">
            <h3>Active Students</h3>
            <p>{dashboard.school_level?.active_students || 0}</p>
          </div>
          <div className="metric-card">
            <h3>Survey Completion</h3>
            <p>{Math.round(dashboard.school_level?.survey_completion_rate || 0)}%</p>
          </div>
          <div className="metric-card">
            <h3>Total Teachers</h3>
            <p>{dashboard.teacher_level?.total_teachers || 0}</p>
          </div>
          <div className="metric-card">
            <h3>Active Locations</h3>
            <p>{locations.length}</p>
          </div>
          <div className="metric-card">
            <h3>Total Classes</h3>
            <p>{classes.length}</p>
          </div>
        </div>
        
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Active Locations ({locations.length})</h2>
            {locations.length === 0 ? (
              <p className="empty-text">No active locations</p>
            ) : (
              <div className="list-items">
                {locations.slice(0, 5).map(location => (
                  <div key={location.id} className="list-item">
                    <span className="item-name">{location.name}</span>
                    {location.city && <span className="item-detail">{location.city}, {location.prefecture}</span>}
                  </div>
                ))}
                {locations.length > 5 && <p className="more-text">+ {locations.length - 5} more</p>}
              </div>
            )}
            <Link to="/locations" className="view-all-link">View All Locations →</Link>
          </div>

          <div className="dashboard-section">
            <h2>Classes ({classes.length})</h2>
            {classes.length === 0 ? (
              <p className="empty-text">No classes</p>
            ) : (
              <div className="list-items">
                {classes.slice(0, 5).map(classItem => (
                  <div key={classItem.id} className="list-item">
                    <span className="item-name">{classItem.name}</span>
                    <span className="item-detail">
                      {classItem.teachers?.name || 'No teacher'} 
                      {classItem.school_locations?.name && ` • ${classItem.school_locations.name}`}
                    </span>
                  </div>
                ))}
                {classes.length > 5 && <p className="more-text">+ {classes.length - 5} more</p>}
              </div>
            )}
            <Link to="/classes" className="view-all-link">View All Classes →</Link>
          </div>

          <div className="dashboard-section">
            <h2>Students ({students.length})</h2>
            {students.length === 0 ? (
              <p className="empty-text">No students</p>
            ) : (
              <div className="list-items">
                {students.slice(0, 5).map(student => (
                  <div key={student.id} className="list-item">
                    <span className="item-name">{student.name}</span>
                    <span className="item-detail">{student.classes?.name || 'No class'}</span>
                  </div>
                ))}
                {students.length > 5 && <p className="more-text">+ {students.length - 5} more</p>}
              </div>
            )}
            <Link to="/students" className="view-all-link">View All Students →</Link>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}

