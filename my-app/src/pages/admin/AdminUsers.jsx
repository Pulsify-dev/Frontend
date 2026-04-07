import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DataTable from "@/components/admin/DataTable";
import UserModal from "@/components/admin/UserModal";

const mockUsers = [
  {
    id: 1,
    username: "dj_mike",
    email: "djmike@email.com",
    role: "Artist",
    status: "active",
    avatarUrl: null,
    createdAt: "2023-06-15",
    totalTracks: 45,
    totalPlays: 125000,
    reportsCount: 0,
  },
  {
    id: 2,
    username: "musiclover",
    email: "music@email.com",
    role: "User",
    status: "active",
    avatarUrl: null,
    createdAt: "2023-08-22",
    totalTracks: 0,
    totalPlays: 890,
    reportsCount: 0,
  },
  {
    id: 3,
    username: "prod_sarah",
    email: "sarah@email.com",
    role: "Artist",
    status: "active",
    avatarUrl: null,
    createdAt: "2023-09-10",
    totalTracks: 28,
    totalPlays: 89000,
    reportsCount: 1,
  },
  {
    id: 4,
    username: "spammer99",
    email: "spam@email.com",
    role: "User",
    status: "suspended",
    avatarUrl: null,
    createdAt: "2024-01-05",
    totalTracks: 0,
    totalPlays: 50,
    reportsCount: 5,
  },
  {
    id: 5,
    username: "audiophile",
    email: "audio@email.com",
    role: "User",
    status: "active",
    avatarUrl: null,
    createdAt: "2023-11-30",
    totalTracks: 0,
    totalPlays: 2340,
    reportsCount: 0,
  },
  {
    id: 6,
    username: "beatmaker_pro",
    email: "beats@email.com",
    role: "Artist",
    status: "active",
    avatarUrl: null,
    createdAt: "2023-05-20",
    totalTracks: 112,
    totalPlays: 456000,
    reportsCount: 0,
  },
  {
    id: 7,
    username: "newuser123",
    email: "new@email.com",
    role: "User",
    status: "active",
    avatarUrl: null,
    createdAt: "2024-01-14",
    totalTracks: 0,
    totalPlays: 120,
    reportsCount: 0,
  },
  {
    id: 8,
    username: "violin_master",
    email: "violin@email.com",
    role: "Artist",
    status: "suspended",
    avatarUrl: null,
    createdAt: "2023-07-18",
    totalTracks: 15,
    totalPlays: 34000,
    reportsCount: 3,
  },
];

const AdminUsers = () => {
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const columns = [
    {
      key: "user",
      label: "User",
      render: (item) => (
        <div className="admin-table-user">
          <img
            src={item.avatarUrl || "https://i1.sndcdn.com/avatars-default.jpg"}
            alt={item.username}
            className="admin-table-user-avatar"
          />
          <div className="admin-table-user-info">
            <div className="admin-table-user-name">{item.username}</div>
            <div className="admin-table-user-email">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (item) => (
        <span className={`admin-badge admin-badge--${item.role?.toLowerCase()}`}>
          {item.role}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <span
          className={`admin-badge admin-badge--${item.status}`}
          style={{ textTransform: "capitalize" }}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "tracks",
      label: "Tracks",
      render: (item) => item.totalTracks,
    },
    {
      key: "plays",
      label: "Plays",
      render: (item) => item.totalPlays?.toLocaleString() || 0,
    },
    {
      key: "reports",
      label: "Reports",
      render: (item) => item.reportsCount || 0,
    },
    {
      key: "actions",
      label: "",
    },
  ];

  columns[6].actions = [
    {
      type: "view",
      label: "View",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      onClick: (item) => setSelectedUser(item),
    },
  ];

  const filteredUsers =
    activeTab === "all"
      ? users
      : activeTab === "suspended"
      ? users.filter((u) => u.status === "suspended")
      : users.filter((u) => u.role?.toLowerCase() === activeTab.toLowerCase());

  const handleSuspend = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "suspended" } : u))
    );
    setSelectedUser(null);
  };

  const handleUnsuspend = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "active" } : u))
    );
    setSelectedUser(null);
  };

  const tabs = [
    { label: "All Users", value: "all", count: users.length },
    { label: "Artists", value: "artist", count: users.filter((u) => u.role === "Artist").length },
    { label: "Listeners", value: "user", count: users.filter((u) => u.role === "User").length },
    { label: "Suspended", value: "suspended", count: users.filter((u) => u.status === "suspended").length },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-header-title">Users</h1>
            <p className="admin-header-subtitle">
              Manage user accounts and permissions
            </p>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-filter-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`admin-filter-tab ${
                  activeTab === tab.value ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
            totalItems={filteredUsers.length}
            emptyState={{
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              title: "No users found",
              text:
                activeTab === "all"
                  ? "There are no users at this time."
                  : `There are no ${activeTab} users.`,
            }}
          />
        </div>

        {selectedUser && (
          <UserModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSuspend={handleSuspend}
            onUnsuspend={handleUnsuspend}
          />
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
