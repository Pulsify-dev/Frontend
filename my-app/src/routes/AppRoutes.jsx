import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";

/**
 * Main App Routes Component
 * 
 * Auth Routes (Module 1):
 * - /login - Sign in page
 * - /register - Create account page
 * - /forgot-password - Request password reset
 * - /reset-password - Set new password (from email link)
 * - /verify-email - Email verification (from email link)
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
