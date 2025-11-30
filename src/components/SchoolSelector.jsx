import { useState, useEffect } from 'react';
import { schoolAPI } from '../lib/api';
import './SchoolSelector.css';

export default function SchoolSelector({ onSchoolSelected, currentSchoolId }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchoolRoles();
  }, []);

  const loadSchoolRoles = async () => {
    try {
      setLoading(true);
      const data = await schoolAPI.getSchoolAdminRoles();
      // Data should be array of { school_id, school_name, role, ... }
      setSchools(data.roles || data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchool = (schoolId) => {
    localStorage.setItem('school_id', schoolId);
    onSchoolSelected(schoolId);
  };

  if (loading) {
    return (
      <div className="school-selector">
        <div className="loading">Loading schools...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="school-selector">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="school-selector">
        <div className="error-message">No schools found. Please contact support.</div>
      </div>
    );
  }

  // If only one school, auto-select it
  if (schools.length === 1) {
    const school = schools[0];
    if (currentSchoolId !== school.school_id) {
      handleSelectSchool(school.school_id);
    }
    return null;
  }

  return (
    <div className="school-selector">
      <h2>Select School to Manage</h2>
      <p className="selector-description">
        You have access to multiple schools. Please select which school you want to manage:
      </p>
      <div className="school-list">
        {schools.map((school) => (
          <button
            key={school.school_id}
            className={`school-card ${currentSchoolId === school.school_id ? 'selected' : ''}`}
            onClick={() => handleSelectSchool(school.school_id)}
          >
            <div className="school-name">{school.school_name || 'Unnamed School'}</div>
            <div className="school-role">School Administrator</div>
            {school.granted_at && (
              <div className="school-meta">
                Member since {new Date(school.granted_at).toLocaleDateString()}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

