import { Link } from "react-router-dom";

/**
 * Unauthorized Page
 * Shown when a user tries to access a page they don't have permission for
 */
const Unauthorized = () => {
  return (
    <div className="auth-unauthorized">
      <svg
        className="auth-unauthorized-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <h1>Access Denied</h1>
      <p>
        You don't have permission to access this page. This area may be
        restricted to certain user roles.
      </p>

      <Link to="/home" className="auth-unauthorized-btn">
        Go to Home
      </Link>
    </div>
  );
};

export default Unauthorized;
