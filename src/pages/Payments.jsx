import { Link } from 'react-router-dom';
import { loadTheme } from '../lib/theme';
import { useEffect } from 'react';
import './Payments.css';

export default function Payments() {
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (schoolId) {
      loadTheme(schoolId);
    }
  }, [schoolId]);

  return (
    <div className="payments-page">
      <div className="payments-container">
        <h1>Payments</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        <div className="payments-message">
          <p>Payments not yet enabled, enjoy our service for free for now 😉</p>
        </div>
      </div>
    </div>
  );
}

