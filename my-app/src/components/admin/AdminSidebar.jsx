import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminSidebar = () => {
  const { user } = useAuth();

  const navItems = [
    {
      section: "Overview",
      items: [
        {
          path: "/admin",
          label: "Dashboard",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          ),
        },
      ],
    },
    {
      section: "Moderation",
      items: [
        {
          path: "/admin/reports",
          label: "Reports",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
          badge: 12,
        },
      ],
    },
    {
      section: "Management",
      items: [
        {
          path: "/admin/users",
          label: "Users",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          path: "/admin/tracks",
          label: "Tracks",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <Link to="/home" className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">P</div>
          <span className="admin-sidebar-logo-text">Pulsify</span>
        </Link>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="admin-nav-section">
            <div className="admin-nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `admin-nav-item${isActive ? " active" : ""}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="admin-nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <img
            src={user?.avatarUrl || "https://i1.sndcdn.com/avatars-default.jpg"}
            alt={user?.displayName}
            className="admin-user-avatar"
          />
          <div className="admin-user-details">
            <div className="admin-user-name">{user?.displayName || "Admin"}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
