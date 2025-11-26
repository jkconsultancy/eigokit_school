import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './Branding.css';

export default function Branding() {
  const [theme, setTheme] = useState({ primary_color: '#3B82F6', secondary_color: '#10B981', accent_color: '#F59E0B' });
  const schoolId = localStorage.getItem('schoolId') || 'default';

  useEffect(() => {
    schoolAPI.getTheme(schoolId).then(setTheme);
  }, [schoolId]);

  const handleSave = async () => {
    await schoolAPI.updateTheme(schoolId, theme);
    alert('Theme updated!');
  };

  return (
    <div className="branding-page">
      <div className="branding-container">
        <h1>Custom Branding</h1>
        <Link to="/dashboard">← Back</Link>
        <div className="theme-form">
          <label>Primary Color</label>
          <input type="color" value={theme.primary_color} onChange={e => setTheme({...theme, primary_color: e.target.value})} />
          <label>Secondary Color</label>
          <input type="color" value={theme.secondary_color} onChange={e => setTheme({...theme, secondary_color: e.target.value})} />
          <label>Accent Color</label>
          <input type="color" value={theme.accent_color} onChange={e => setTheme({...theme, accent_color: e.target.value})} />
          <button onClick={handleSave}>Save Theme</button>
        </div>
      </div>
    </div>
  );
}

