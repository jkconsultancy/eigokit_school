import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolAPI } from '../lib/api';
import { API_URL } from '../config';
import { applyTheme } from '../lib/theme';
import './Branding.css';

const GOOGLE_FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif' },
  { name: 'Custom', value: 'custom' }
];

const DEFAULT_THEMES = [
  {
    name: 'Professional Blue',
    primary_color: '#2563EB',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    font_family: 'Inter, sans-serif',
    background_color: '#FFFFFF',
    description: 'Modern & Trustworthy - Best for professional language schools'
  },
  {
    name: 'Vibrant Purple',
    primary_color: '#7C3AED',
    secondary_color: '#EC4899',
    accent_color: '#FBBF24',
    font_family: 'Roboto, sans-serif',
    background_color: '#FFF7ED',
    description: 'Creative & Energetic - Best for kids programs'
  },
  {
    name: 'Classic Teal',
    primary_color: '#0D9488',
    secondary_color: '#059669',
    accent_color: '#F59E0B',
    font_family: 'Open Sans, sans-serif',
    background_color: '#F0FDFA',
    description: 'Calm & Professional - Best for traditional schools'
  }
];

export default function Branding() {
  const [theme, setTheme] = useState({
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    font_family: 'Inter, sans-serif',
    logo_url: null,
    app_icon_url: null,
    favicon_url: null,
    background_color: '#FFFFFF',
    button_style: null,
    card_style: null
  });
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  // Use 'school_id' (with underscore) to match what sign-in stores
  const schoolId = localStorage.getItem('school_id');

  useEffect(() => {
    if (!schoolId) {
      setMessage({ type: 'error', text: 'No school ID found. Please sign in again.' });
      return;
    }

    schoolAPI.getTheme(schoolId).then(data => {
      if (data) {
        const themeData = {
          primary_color: data.primary_color || '#3B82F6',
          secondary_color: data.secondary_color || '#10B981',
          accent_color: data.accent_color || '#F59E0B',
          font_family: data.font_family || 'Inter, sans-serif',
          logo_url: data.logo_url || null,
          app_icon_url: data.app_icon_url || null,
          favicon_url: data.favicon_url || null,
          background_color: data.background_color || '#FFFFFF',
          button_style: data.button_style || null,
          card_style: data.card_style || null
        };
        setTheme(themeData);
        // Apply theme immediately when loaded
        applyTheme(themeData);
      }
    }).catch(err => {
      console.error('Failed to load theme:', err);
      setMessage({ type: 'error', text: 'Failed to load current theme' });
    });
  }, [schoolId]);

  const handleFileUpload = async (file, assetType) => {
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload PNG, JPEG, SVG, or ICO files.' });
      return;
    }
    
    setUploading({ ...uploading, [assetType]: true });
    setMessage(null);
    
    try {
      const response = await schoolAPI.uploadBrandingAsset(schoolId, file, assetType);
      setTheme({ ...theme, [`${assetType}_url`]: response.url });
      setMessage({ type: 'success', text: `${assetType} uploaded successfully!` });
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Handle error messages properly
      let errorMessage = `Failed to upload ${assetType}. Please try again.`;
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setUploading({ ...uploading, [assetType]: false });
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.(); // Prevent form submission if button is in a form
    console.log('handleSave called', { schoolId, theme });
    setSaving(true);
    setMessage(null);
    
    // Validate schoolId
    if (!schoolId) {
      console.warn('No schoolId found');
      setMessage({ 
        type: 'error', 
        text: 'No school ID found. Please sign in again.' 
      });
      setSaving(false);
      return;
    }
    
    try {
      // Prepare theme data - convert empty strings to null for optional fields
      const themeData = {
        school_id: schoolId,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        accent_color: theme.accent_color,
        font_family: theme.font_family || null,
        logo_url: (theme.logo_url && typeof theme.logo_url === 'string' && theme.logo_url.trim() !== '') ? theme.logo_url : null,
        app_icon_url: (theme.app_icon_url && typeof theme.app_icon_url === 'string' && theme.app_icon_url.trim() !== '') ? theme.app_icon_url : null,
        favicon_url: (theme.favicon_url && typeof theme.favicon_url === 'string' && theme.favicon_url.trim() !== '') ? theme.favicon_url : null,
        background_color: theme.background_color || null,
        button_style: theme.button_style || null,
        card_style: theme.card_style || null
      };
      
      console.log('Sending theme data:', themeData);
      const response = await schoolAPI.updateTheme(schoolId, themeData);
      console.log('Theme update response:', response);
      
      // Apply the updated theme immediately to the school admin app
      applyTheme(themeData);
      
      setMessage({ type: 'success', text: 'Branding updated! Changes are now applied to this app and will appear in teacher and student apps.' });
    } catch (error) {
      console.error('Save failed:', error);
      
      // Prevent the interceptor from redirecting by handling the error here
      const status = error?.response?.status;
      
      // Handle Pydantic validation errors (array of error objects)
      let errorMessage = 'Failed to save branding. Please try again.';
      
      if (status === 403) {
        errorMessage = error.response?.data?.detail || 'Access denied. Please verify you have permission to update this school\'s branding.';
      } else if (status === 401) {
        errorMessage = 'Authentication expired. Please sign in again.';
        // Let the interceptor handle 401 (authentication errors)
      } else if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors are an array
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      
      // Only let 401 errors propagate to trigger logout
      // For 403 and other errors, we've handled them above
      if (status !== 401) {
        // Prevent default error handling for non-auth errors
        error.preventDefault = true;
      }
    } finally {
      setSaving(false);
    }
  };

  const applyDefaultTheme = (defaultTheme) => {
    setTheme({
      ...theme,
      primary_color: defaultTheme.primary_color,
      secondary_color: defaultTheme.secondary_color,
      accent_color: defaultTheme.accent_color,
      font_family: defaultTheme.font_family,
      background_color: defaultTheme.background_color
    });
    setMessage({ type: 'info', text: `Applied ${defaultTheme.name} theme. Click Save to apply changes.` });
  };

  const loadGoogleFont = (fontFamily) => {
    if (fontFamily === 'custom' || !fontFamily) return;
    const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    const existingLink = document.querySelector(`link[href*="${fontName}"]`);
    
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  };

  useEffect(() => {
    if (theme.font_family && theme.font_family !== 'custom') {
      loadGoogleFont(theme.font_family);
    }
  }, [theme.font_family]);

  return (
    <div className="branding-page">
      <div className="branding-container">
        <h1>Custom Branding</h1>
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        
        {message && (
          <div className={`message message-${message.type}`}>
            {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
          </div>
        )}

        {/* Default Theme Templates */}
        <div className="branding-section">
          <h2>Quick Start Templates</h2>
          <p className="section-description">Choose a pre-designed theme to get started, then customize as needed.</p>
          <div className="theme-templates">
            {DEFAULT_THEMES.map((template, idx) => (
              <div key={idx} className="theme-template-card" onClick={() => applyDefaultTheme(template)}>
                <div className="template-preview" style={{
                  '--template-primary': template.primary_color,
                  '--template-secondary': template.secondary_color,
                  '--template-accent': template.accent_color,
                  '--template-bg': template.background_color
                }}>
                  <div className="template-color-bar" style={{ backgroundColor: template.primary_color }}></div>
                  <div className="template-colors">
                    <div className="template-color-dot" style={{ backgroundColor: template.primary_color }}></div>
                    <div className="template-color-dot" style={{ backgroundColor: template.secondary_color }}></div>
                    <div className="template-color-dot" style={{ backgroundColor: template.accent_color }}></div>
                  </div>
                </div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="branding-section">
          <h2>Company Logo</h2>
          <div className="upload-area">
            {theme.logo_url && (typeof theme.logo_url === 'string' ? theme.logo_url.trim() !== '' : true) && (
              <div className="preview-wrapper">
                <img src={theme.logo_url} alt="Logo preview" className="logo-preview" />
                <button 
                  className="remove-button"
                  onClick={() => setTheme({ ...theme, logo_url: null })}
                  title="Remove logo"
                >
                  ×
                </button>
              </div>
            )}
            <label className="file-input-label">
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                disabled={uploading.logo}
              />
              {uploading.logo ? 'Uploading...' : theme.logo_url ? 'Replace Logo' : 'Upload Logo'}
            </label>
            <p className="help-text">Recommended: PNG or SVG, transparent background, max 500px width, max 5MB</p>
          </div>
        </div>

        {/* Colors Section */}
        <div className="branding-section">
          <h2>Color Scheme</h2>
          <div className="color-grid">
            <div className="color-input">
              <label>Primary Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={theme.primary_color}
                  onChange={e => setTheme({...theme, primary_color: e.target.value})}
                />
                <input
                  type="text"
                  value={theme.primary_color}
                  onChange={e => setTheme({...theme, primary_color: e.target.value})}
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            <div className="color-input">
              <label>Secondary Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={theme.secondary_color}
                  onChange={e => setTheme({...theme, secondary_color: e.target.value})}
                />
                <input
                  type="text"
                  value={theme.secondary_color}
                  onChange={e => setTheme({...theme, secondary_color: e.target.value})}
                  placeholder="#10B981"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            <div className="color-input">
              <label>Accent Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={theme.accent_color}
                  onChange={e => setTheme({...theme, accent_color: e.target.value})}
                />
                <input
                  type="text"
                  value={theme.accent_color}
                  onChange={e => setTheme({...theme, accent_color: e.target.value})}
                  placeholder="#F59E0B"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            <div className="color-input">
              <label>Background Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={theme.background_color || '#FFFFFF'}
                  onChange={e => setTheme({...theme, background_color: e.target.value})}
                />
                <input
                  type="text"
                  value={theme.background_color || '#FFFFFF'}
                  onChange={e => setTheme({...theme, background_color: e.target.value})}
                  placeholder="#FFFFFF"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Font Selection */}
        <div className="branding-section">
          <h2>Typography</h2>
          <label>Font Family</label>
          <select
            value={theme.font_family || 'Inter, sans-serif'}
            onChange={e => setTheme({...theme, font_family: e.target.value})}
            className="font-select"
          >
            {GOOGLE_FONTS.map(font => (
              <option key={font.value} value={font.value}>{font.name}</option>
            ))}
          </select>
          {theme.font_family === 'custom' && (
            <input
              type="text"
              className="custom-font-input"
              placeholder="e.g., 'Arial, sans-serif' or 'Times New Roman, serif'"
              onChange={e => setTheme({...theme, font_family: e.target.value})}
            />
          )}
        </div>

        {/* Favicon & App Icon */}
        <div className="branding-section">
          <h2>Icons</h2>
          <div className="icon-upload-grid">
            <div className="icon-upload">
              <label>Favicon (16x16 or 32x32)</label>
              {theme.favicon_url && (typeof theme.favicon_url === 'string' ? theme.favicon_url.trim() !== '' : true) && (
                <div className="preview-wrapper">
                  <img src={theme.favicon_url} alt="Favicon" className="icon-preview" />
                  <button 
                    className="remove-button"
                    onClick={() => setTheme({ ...theme, favicon_url: null })}
                    title="Remove favicon"
                  >
                    ×
                  </button>
                </div>
              )}
              <label className="file-input-label">
                <input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'favicon')}
                  disabled={uploading.favicon}
                />
                {uploading.favicon ? 'Uploading...' : theme.favicon_url ? 'Replace Favicon' : 'Upload Favicon'}
              </label>
            </div>
            <div className="icon-upload">
              <label>App Icon (512x512 recommended)</label>
              {theme.app_icon_url && (typeof theme.app_icon_url === 'string' ? theme.app_icon_url.trim() !== '' : true) && (
                <div className="preview-wrapper">
                  <img src={theme.app_icon_url} alt="App Icon" className="icon-preview" />
                  <button 
                    className="remove-button"
                    onClick={() => setTheme({ ...theme, app_icon_url: null })}
                    title="Remove app icon"
                  >
                    ×
                  </button>
                </div>
              )}
              <label className="file-input-label">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'app_icon')}
                  disabled={uploading.app_icon}
                />
                {uploading.app_icon ? 'Uploading...' : theme.app_icon_url ? 'Replace App Icon' : 'Upload App Icon'}
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="branding-section">
          <h2>Live Preview</h2>
          <p className="section-description">See how your branding will appear in the teacher and student apps.</p>
          <div className="preview-container" style={{
            '--primary-color': theme.primary_color,
            '--secondary-color': theme.secondary_color,
            '--accent-color': theme.accent_color,
            '--background-color': theme.background_color || '#FFFFFF',
            '--font-family': theme.font_family || 'Inter, sans-serif'
          }}>
            {theme.logo_url && (typeof theme.logo_url === 'string' ? theme.logo_url.trim() !== '' : true) && (
              <img src={theme.logo_url} alt="Logo" className="preview-logo" />
            )}
            <h3 style={{ color: 'var(--primary-color)' }}>Sample Heading</h3>
            <p style={{ color: '#374151' }}>This is how your branding will appear in the teacher and student apps.</p>
            <button 
              className="preview-button"
              style={{ 
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)'
              }}
            >
              Sample Button
            </button>
          </div>
        </div>

        <button 
          onClick={(e) => {
            console.log('Button clicked!', e);
            handleSave(e);
          }} 
          className="save-button"
          disabled={saving}
          type="button"
        >
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}
