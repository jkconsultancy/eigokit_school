import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { loadTheme } from '../lib/theme';
import './Locations.css';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
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
    loadLocations();
  }, [schoolId]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await schoolAPI.getLocations(schoolId);
      setLocations(response.locations || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to load locations';
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
      if (editingLocation) {
        await schoolAPI.updateLocation(schoolId, editingLocation.id, formData);
      } else {
        await schoolAPI.createLocation(schoolId, formData);
      }
      setShowForm(false);
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        prefecture: '',
        postal_code: '',
        phone: '',
        email: '',
        is_active: true
      });
      loadLocations();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to save location';
      if (err.response?.data) {
        // Handle FastAPI validation errors (array of error objects)
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name || '',
      address: location.address || '',
      city: location.city || '',
      prefecture: location.prefecture || '',
      postal_code: location.postal_code || '',
      phone: location.phone || '',
      email: location.email || '',
      is_active: location.is_active !== undefined ? location.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      await schoolAPI.deleteLocation(schoolId, locationId);
      loadLocations();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_id');
        window.location.href = '/signin';
        return;
      }
      let errorMessage = 'Failed to delete location';
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
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      prefecture: '',
      postal_code: '',
      phone: '',
      email: '',
      is_active: true
    });
  };

  if (loading) {
    return <div className="locations-page"><div className="locations-container">Loading...</div></div>;
  }

  return (
    <div className="manage-page">
      <div className="manage-container">
        <h1>Manage Locations</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>

        {error && <div className="error-message">{String(error)}</div>}

        <div className="actions-bar">
          <button className="add-button" onClick={() => { setShowForm(true); setEditingLocation(null); setFormData({ name: '', address: '', city: '', prefecture: '', postal_code: '', phone: '', email: '', is_active: true }); }}>
            + Add Location
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingLocation ? 'Edit Location' : 'Add New Location'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Location Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Main Campus"
                  />
                </div>
                <div className="form-group">
                  <label>Prefecture</label>
                  <input
                    type="text"
                    value={formData.prefecture}
                    onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                    placeholder="Tokyo"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City name"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="123-4567"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03-1234-5678"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="location@example.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active Location
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">{editingLocation ? 'Update' : 'Create'}</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="locations-list">
          {locations.length === 0 ? (
            <div className="empty-state">No locations found. Add your first location to get started.</div>
          ) : (
            locations.map(location => (
              <div key={location.id} className={`location-card ${!location.is_active ? 'inactive' : ''}`}>
                <div className="location-info">
                  <h3>{location.name} {!location.is_active && <span className="inactive-badge">Inactive</span>}</h3>
                  {location.address && <p><strong>Address:</strong> {location.address}</p>}
                  {(location.city || location.prefecture) && (
                    <p><strong>Location:</strong> {[location.city, location.prefecture].filter(Boolean).join(', ')}</p>
                  )}
                  {location.postal_code && <p><strong>Postal Code:</strong> {location.postal_code}</p>}
                  {location.phone && <p><strong>Phone:</strong> {location.phone}</p>}
                  {location.email && <p><strong>Email:</strong> {location.email}</p>}
                </div>
                <div className="location-actions">
                  <button className="edit-button" onClick={() => handleEdit(location)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(location.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

