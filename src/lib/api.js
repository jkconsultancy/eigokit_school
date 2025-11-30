import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData - browser will set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Global auth error handling: redirect to sign in when token is invalid/expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // Only redirect on 401 (authentication errors), not 403 (authorization errors)
    // 403 errors should be handled by the component (e.g., access denied messages)
    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('school_id');
      if (!window.location.pathname.startsWith('/signin')) {
        window.location.href = '/signin';
      }
    }
    // For 403 errors, let the component handle the error message
    return Promise.reject(error);
  }
);

export const schoolAPI = {
  signin: (email, password) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    return api.post('/api/auth/school-admin/signin', formData).then(r => r.data);
  },
  signup: (email, password, name, schoolName, contactInfo) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);
    formData.append('school_name', schoolName);
    if (contactInfo) {
      formData.append('contact_info', contactInfo);
    }
    return api.post('/api/auth/school-admin/signup', formData).then(r => r.data);
  },
  requestPasswordReset: (email) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('app', 'school_admin');
    return api.post('/api/auth/password-reset-request', formData).then(r => r.data);
  },
  // Teachers
  getTeachers: (schoolId) => api.get(`/api/schools/${schoolId}/teachers`).then(r => r.data),
  addTeacher: (schoolId, name, email) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    return api.post(`/api/schools/${schoolId}/teachers`, formData).then(r => r.data);
  },
  updateTeacher: (schoolId, teacherId, name, email) => {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (email) formData.append('email', email);
    return api.put(`/api/schools/${schoolId}/teachers/${teacherId}`, formData).then(r => r.data);
  },
  deleteTeacher: (schoolId, teacherId) => api.delete(`/api/schools/${schoolId}/teachers/${teacherId}`).then(r => r.data),
  resendTeacherInvitation: (schoolId, teacherId) => api.post(`/api/schools/${schoolId}/teachers/${teacherId}/resend-invitation`).then(r => r.data),
  
  // Locations
  getLocations: (schoolId) => api.get(`/api/schools/${schoolId}/locations`).then(r => r.data),
  createLocation: (schoolId, locationData) => {
    const formData = new FormData();
    formData.append('name', locationData.name);
    if (locationData.address) formData.append('address', locationData.address);
    if (locationData.city) formData.append('city', locationData.city);
    if (locationData.prefecture) formData.append('prefecture', locationData.prefecture);
    if (locationData.postal_code) formData.append('postal_code', locationData.postal_code);
    if (locationData.phone) formData.append('phone', locationData.phone);
    if (locationData.email) formData.append('email', locationData.email);
    formData.append('is_active', String(locationData.is_active !== undefined ? locationData.is_active : true));
    return api.post(`/api/schools/${schoolId}/locations`, formData).then(r => r.data);
  },
  updateLocation: (schoolId, locationId, locationData) => {
    const formData = new FormData();
    if (locationData.name) formData.append('name', locationData.name);
    if (locationData.address !== undefined) formData.append('address', locationData.address || '');
    if (locationData.city !== undefined) formData.append('city', locationData.city || '');
    if (locationData.prefecture !== undefined) formData.append('prefecture', locationData.prefecture || '');
    if (locationData.postal_code !== undefined) formData.append('postal_code', locationData.postal_code || '');
    if (locationData.phone !== undefined) formData.append('phone', locationData.phone || '');
    if (locationData.email !== undefined) formData.append('email', locationData.email || '');
    if (locationData.is_active !== undefined) formData.append('is_active', String(locationData.is_active));
    return api.put(`/api/schools/${schoolId}/locations/${locationId}`, formData).then(r => r.data);
  },
  deleteLocation: (schoolId, locationId) => api.delete(`/api/schools/${schoolId}/locations/${locationId}`).then(r => r.data),
  
  // Students
  getStudents: (schoolId) => api.get(`/api/schools/${schoolId}/students`).then(r => r.data),
  getAvailableIconSequence: (schoolId, studentName) => api.get(`/api/schools/${schoolId}/students/available-icon-sequence`, { params: { student_name: studentName } }).then(r => r.data),
  addStudent: (schoolId, name, classId, iconSequence) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('class_id', classId);
    if (iconSequence) {
      formData.append('icon_sequence', iconSequence);
    }
    return api.post(`/api/schools/${schoolId}/students`, formData).then(r => r.data);
  },
  updateStudent: (schoolId, studentId, studentData) => {
    const formData = new FormData();
    if (studentData.name) formData.append('name', studentData.name);
    if (studentData.class_id) formData.append('class_id', studentData.class_id);
    if (studentData.icon_sequence !== undefined) formData.append('icon_sequence', studentData.icon_sequence || '');
    return api.put(`/api/schools/${schoolId}/students/${studentId}`, formData).then(r => r.data);
  },
  deleteStudent: (schoolId, studentId) => api.delete(`/api/schools/${schoolId}/students/${studentId}`).then(r => r.data),
  
  // Classes
  getClasses: (schoolId) => api.get(`/api/schools/${schoolId}/classes`).then(r => r.data),
  addClass: (schoolId, name, teacherId, locationId) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('teacher_id', teacherId);
    if (locationId) formData.append('location_id', locationId);
    return api.post(`/api/schools/${schoolId}/classes`, formData).then(r => r.data);
  },
  updateClass: (schoolId, classId, classData) => {
    const formData = new FormData();
    if (classData.name) formData.append('name', classData.name);
    if (classData.teacher_id) formData.append('teacher_id', classData.teacher_id);
    if (classData.location_id !== undefined) formData.append('location_id', classData.location_id || '');
    return api.put(`/api/schools/${schoolId}/classes/${classId}`, formData).then(r => r.data);
  },
  deleteClass: (schoolId, classId) => api.delete(`/api/schools/${schoolId}/classes/${classId}`).then(r => r.data),
  getPayments: (schoolId) => api.get(`/api/schools/${schoolId}/payments`).then(r => r.data),
  getPaymentStatus: (schoolId) => api.get(`/api/schools/${schoolId}/payments/status`).then(r => r.data),
  createPayment: (schoolId, payment) => api.post(`/api/schools/${schoolId}/payments`, payment).then(r => r.data),
  getTheme: (schoolId) => api.get(`/api/schools/${schoolId}/theme`).then(r => r.data),
  updateTheme: (schoolId, theme) => api.post(`/api/schools/${schoolId}/theme`, theme).then(r => r.data),
  uploadBrandingAsset: (schoolId, file, assetType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('asset_type', assetType);
    return api.post(`/api/schools/${schoolId}/branding/upload`, formData).then(r => r.data);
  },
  getDashboard: (schoolId) => api.get(`/api/schools/${schoolId}/dashboard`).then(r => r.data),
};

export default api;

