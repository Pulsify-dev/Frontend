import { useAuth } from "@/contexts/AuthContext";

/**
 * RoleGate Component
 * Conditionally renders content based on user role
 * 
 * Usage:
 * <RoleGate allowedRoles={["artist"]}>
 *   <UploadButton />
 * </RoleGate>
 * 
 * Or with fallback:
 * <RoleGate allowedRoles={["artist"]} fallback={<UpgradePrompt />}>
 *   <ArtistDashboard />
 * </RoleGate>
 */
const RoleGate = ({ children, allowedRoles = [], fallback = null }) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, don't show anything (or show fallback)
  if (!isAuthenticated) {
    return fallback;
  }

  // Check if user's role is in the allowed roles
  const hasAccess = allowedRoles.includes(user?.role);

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

/**
 * ArtistOnly - Shows content only to artists
 */
export const ArtistOnly = ({ children, fallback = null }) => {
  return (
    <RoleGate allowedRoles={["artist"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
};

/**
 * ListenerOnly - Shows content only to listeners
 */
export const ListenerOnly = ({ children, fallback = null }) => {
  return (
    <RoleGate allowedRoles={["listener"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
};

/**
 * AuthenticatedOnly - Shows content only to authenticated users
 */
export const AuthenticatedOnly = ({ children, fallback = null }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  return children;
};

/**
 * GuestOnly - Shows content only to non-authenticated users
 */
export const GuestOnly = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return null;
  }

  return children;
};

export default RoleGate;
