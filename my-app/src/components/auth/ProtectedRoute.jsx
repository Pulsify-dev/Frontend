import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * Optionally restricts access based on user role
 */

function LoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-spinner">
        <svg
          className="auth-spinner"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="auth-spinner-track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p>Loading...</p>
    </div>
  );
}

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user?.role);
    if (!hasAllowedRole) {
      // Redirect to unauthorized page or home
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

/**
 * ArtistRoute - Only allows artists
 */
export const ArtistRoute = ({ children }) => {
  return <ProtectedRoute allowedRoles={["artist", "Artist"]}>{children}</ProtectedRoute>;
};

/**
 * AdminRoute - Only allows admins
 */
export const AdminRoute = ({ children }) => {
  return <ProtectedRoute allowedRoles={["admin", "Admin"]}>{children}</ProtectedRoute>;
};

/**
 * ListenerRoute - Only allows listeners
 */
export const ListenerRoute = ({ children }) => {
  return <ProtectedRoute allowedRoles={["listener"]}>{children}</ProtectedRoute>;
};

/**
 * GuestRoute - Only allows non-authenticated users
 * Redirects to home if already logged in
 */
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Redirect to the page they came from, or home
    const from = location.state?.from?.pathname || "/home";
    return <Navigate to={from} replace />;
  }

  return children;
};

export default ProtectedRoute;
