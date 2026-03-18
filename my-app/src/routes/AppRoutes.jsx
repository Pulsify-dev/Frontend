/**
 * App Routes Configuration
 * Simplified routes for page demos
 */

import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

// Auth Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';

/**
 * Main App Routes Component
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Routes with MainLayout (Navbar + Footer) */}
      <Route element={<MainLayout />}>
        {/* Home - redirects to login */}
        <Route path="/" element={<Login />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
