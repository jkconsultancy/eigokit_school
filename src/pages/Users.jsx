import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './Users.css';

export default function Users() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const schoolId = localStorage.getItem('schoolId') || 'default';

  useEffect(() => {
    Promise.all([
      schoolAPI.getTeachers(schoolId),
      schoolAPI.getStudents(schoolId),
      schoolAPI.getClasses(schoolId),
    ]).then(([t, s, c]) => {
      setTeachers(t.teachers || []);
      setStudents(s.students || []);
      setClasses(c.classes || []);
    });
  }, [schoolId]);

  return (
    <div className="users-page">
      <div className="users-container">
        <h1>Manage Users</h1>
        <Link to="/dashboard">← Back</Link>
        <div className="tabs">
          <div className="tab-section">
            <h2>Teachers ({teachers.length})</h2>
            {teachers.map(t => <div key={t.id} className="user-card">{t.name} - {t.email}</div>)}
          </div>
          <div className="tab-section">
            <h2>Students ({students.length})</h2>
            {students.map(s => <div key={s.id} className="user-card">{s.name}</div>)}
          </div>
          <div className="tab-section">
            <h2>Classes ({classes.length})</h2>
            {classes.map(c => <div key={c.id} className="user-card">{c.name}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

