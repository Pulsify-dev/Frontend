import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DataTable from "@/components/admin/DataTable";
import ReportModal from "@/components/admin/ReportModal";

const mockReports = [
  {
    id: 1,
    type: "copyright",
    reporter: { username: "musicfan42", email: "music@email.com", avatarUrl: null },
    content: { title: "Summer Vibes", artist: "DJ Summer", artworkUrl: null },
    reason: "This is my original track being stolen and posted without permission",
    status: "pending",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    type: "inappropriate",
    reporter: { username: "cleanlistner", email: "clean@email.com", avatarUrl: null },
    content: { title: "Late Night", artist: "Unknown Producer", artworkUrl: null },
    reason: "Contains offensive language and explicit content",
    status: "pending",
    createdAt: "2024-01-15T09:15:00Z",
  },
  {
    id: 3,
    type: "copyright",
    reporter: { username: "producer_mike", email: "mike@email.com", avatarUrl: null },
    content: { title: "Beats for Days", artist: "Mike Beats", artworkUrl: null },
    reason: "Unauthorized sample usage from my production",
    status: "pending",
    createdAt: "2024-01-14T16:45:00Z",
  },
  {
    id: 4,
    type: "inappropriate",
    reporter: { username: "concerned_parent", email: "parent@email.com", avatarUrl: null },
    content: { title: "Party Track", artist: "Night Owl", artworkUrl: null },
    reason: "Inappropriate for younger audiences",
    status: "resolved",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: 5,
    type: "copyright",
    reporter: { username: "original_artist", email: "artist@email.com", avatarUrl: null },
    content: { title: "My Song", artist: "Copycat", artworkUrl: null },
    reason: "Entire track copied from my album",
    status: "dismissed",
    createdAt: "2024-01-13T11:00:00Z",
  },
  {
    id: 6,
    type: "inappropriate",
    reporter: { username: "user123", email: "user@email.com", avatarUrl: null },
    content: { title: "Test Track", artist: "Test Artist", artworkUrl: null },
    reason: "Spam content",
    status: "pending",
    createdAt: "2024-01-13T08:30:00Z",
  },
  {
    id: 7,
    type: "copyright",
    reporter: { username: "record_label", email: "label@email.com", avatarUrl: null },
    content: { title: "Hit Song", artist: "Impersonator", artworkUrl: null },
    reason: "Fraudulent impersonation of our artist",
    status: "pending",
    createdAt: "2024-01-12T15:45:00Z",
  },
];

const AdminReports = () => {
  const [reports, setReports] = useState(mockReports);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const columns = [
    {
      key: "type",
      label: "Type",
      render: (item) => (
        <span
          className={`admin-badge admin-badge--${item.type}`}
          style={{ textTransform: "capitalize" }}
        >
          {item.type}
        </span>
      ),
    },
    {
      key: "reporter",
      label: "Reporter",
      render: (item) => (
        <div className="admin-table-user">
          <img
            src="https://i1.sndcdn.com/avatars-default.jpg"
            alt={item.reporter.username}
            className="admin-table-user-avatar"
          />
          <div className="admin-table-user-info">
            <div className="admin-table-user-name">{item.reporter.username}</div>
            <div className="admin-table-user-email">{item.reporter.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "content",
      label: "Reported Content",
      render: (item) => (
        <div className="admin-report-content">
          <div className="admin-report-content-info">
            <div className="admin-report-content-title">{item.content.title}</div>
            <div className="admin-report-content-artist">{item.content.artist}</div>
          </div>
        </div>
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
      key: "createdAt",
      label: "Date",
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
    },
  ];

  columns[5].actions = [
    {
      type: "view",
      label: "View",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      onClick: (item) => setSelectedReport(item),
    },
  ];

  const filteredReports =
    activeTab === "all"
      ? reports
      : reports.filter((r) => r.status === activeTab);

  const handleResolve = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
    );
    setSelectedReport(null);
  };

  const handleDismiss = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "dismissed" } : r))
    );
    setSelectedReport(null);
  };

  const tabs = [
    { label: "All", value: "all", count: reports.length },
    { label: "Pending", value: "pending", count: reports.filter((r) => r.status === "pending").length },
    { label: "Resolved", value: "resolved", count: reports.filter((r) => r.status === "resolved").length },
    { label: "Dismissed", value: "dismissed", count: reports.filter((r) => r.status === "dismissed").length },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-header-title">Reports</h1>
            <p className="admin-header-subtitle">
              Manage user-reported content
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
            data={filteredReports}
            totalItems={filteredReports.length}
            emptyState={{
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ),
              title: "No reports found",
              text:
                activeTab === "all"
                  ? "There are no reports at this time."
                  : `There are no ${activeTab} reports.`,
            }}
          />
        </div>

        {selectedReport && (
          <ReportModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onResolve={handleResolve}
            onDismiss={handleDismiss}
          />
        )}
      </main>
    </div>
  );
};

export default AdminReports;
