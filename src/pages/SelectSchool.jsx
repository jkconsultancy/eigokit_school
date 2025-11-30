import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import SchoolSelector from '../components/SchoolSelector';
import './SelectSchool.css';

export default function SelectSchool() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSchoolRoles();
  }, []);

  const loadSchoolRoles = async () => {
    try {
      setLoading(true);
      // Try to get from localStorage first (set during signin)
      const storedRoles = localStorage.getItem('user_roles');
      if (storedRoles) {
        const roles = JSON.parse(storedRoles);
        setSchools(roles.filter(r => r.role === 'school_admin'));
        setLoading(false);
        return;
      }
      
      // Fallback: fetch from API
      const data = await schoolAPI.getSchoolAdminRoles();
      setSchools(data.roles || data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelected = (schoolId) => {
    localStorage.removeItem('user_roles'); // Clean up
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="select-school-page">
        <div className="loading">Loading schools...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="select-school-page">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/signin')} className="back-button">
          Back to Sign In
        </button>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="select-school-page">
        <div className="error-message">No schools found. Please contact support.</div>
        <button onClick={() => navigate('/signin')} className="back-button">
          Back to Sign In
        </button>
      </div>
    );
  }

  // Auto-select if only one school
  if (schools.length === 1) {
    const schoolId = schools[0].school_id;
    localStorage.setItem('school_id', schoolId);
    localStorage.removeItem('user_roles');
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="select-school-page">
      <SchoolSelector 
        onSchoolSelected={handleSchoolSelected}
        currentSchoolId={localStorage.getItem('school_id')}
      />
    </div>
  );
}

