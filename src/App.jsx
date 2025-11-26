import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Locations from './pages/Locations';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Branding from './pages/Branding';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<Students />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/branding" element={<Branding />} />
        <Route path="/" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
