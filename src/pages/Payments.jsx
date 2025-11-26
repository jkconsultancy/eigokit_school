import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import './Payments.css';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState(null);
  const schoolId = localStorage.getItem('schoolId') || 'default';

  useEffect(() => {
    Promise.all([
      schoolAPI.getPayments(schoolId),
      schoolAPI.getPaymentStatus(schoolId),
    ]).then(([p, s]) => {
      setPayments(p.payments || []);
      setStatus(s);
    });
  }, [schoolId]);

  return (
    <div className="payments-page">
      <div className="payments-container">
        <h1>Payment Management</h1>
        <Link to="/dashboard">← Back</Link>
        {status && (
          <div className="status-card">
            <h3>Current Status: {status.status}</h3>
            <p>Amount: ¥{status.amount}</p>
            <p>Period: {status.billing_period_start} to {status.billing_period_end}</p>
          </div>
        )}
        <div className="payments-list">
          <h2>Payment History</h2>
          {payments.map(p => (
            <div key={p.id} className="payment-card">
              <p>Amount: ¥{p.amount}</p>
              <p>Status: {p.status}</p>
              <p>Date: {p.payment_date || p.created_at}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

