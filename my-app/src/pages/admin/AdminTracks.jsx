import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DataTable from "@/components/admin/DataTable";
import TrackModal from "@/components/admin/TrackModal";

const mockTracks = [
  {
    id: 1,
    title: "Summer Vibes",
    artist: "DJ Summer",
    genre: "Electronic",
    duration: "3:45",
    artworkUrl: null,
    plays: 45000,
    likes: 2300,
    status: "active",
    reportsCount: 1,
    createdAt: "2024-01-10",
  },
  {
    id: 2,
    title: "Late Night Sessions",
    artist: "Night Owl",
    genre: "House",
    duration: "5:12",
    artworkUrl: null,
    plays: 12000,
    likes: 890,
    status: "active",
    reportsCount: 0,
    createdAt: "2024-01-08",
  },
  {
    id: 3,
    title: "Beats for Days",
    artist: "Mike Beats",
    genre: "Hip Hop",
    duration: "2:58",
    artworkUrl: null,
    plays: 89000,
    likes: 5600,
    status: "active",
    reportsCount: 2,
    createdAt: "2024-01-05",
  },
  {
    id: 4,
    title: "Spam Track 123",
    artist: "Spammer",
    genre: "Other",
    duration: "0:30",
    artworkUrl: null,
    plays: 10,
    likes: 0,
    status: "removed",
    reportsCount: 8,
    createdAt: "2024-01-14",
  },
  {
    id: 5,
    title: "Acoustic Dreams",
    artist: "Sarah Music",
    genre: "Acoustic",
    duration: "4:22",
    artworkUrl: null,
    plays: 6700,
    likes: 450,
    status: "hidden",
    reportsCount: 3,
    createdAt: "2024-01-03",
  },
  {
    id: 6,
    title: "Techno Revolution",
    artist: "Techno King",
    genre: "Techno",
    duration: "6:30",
    artworkUrl: null,
    plays: 34000,
    likes: 1800,
    status: "active",
    reportsCount: 0,
    createdAt: "2024-01-01",
  },
  {
    id: 7,
    title: "Jazz in the Morning",
    artist: "Jazz Ensemble",
    genre: "Jazz",
    duration: "5:45",
    artworkUrl: null,
    plays: 12300,
    likes: 920,
    status: "active",
    reportsCount: 0,
    createdAt: "2023-12-28",
  },
  {
    id: 8,
    title: "Copyright Track",
    artist: "Bad Actor",
    genre: "Pop",
    duration: "3:15",
    artworkUrl: null,
    plays: 500,
    likes: 10,
    status: "removed",
    reportsCount: 5,
    createdAt: "2024-01-12",
  },
];

const AdminTracks = () => {
  const [tracks, setTracks] = useState(mockTracks);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const columns = [
    {
      key: "content",
      label: "Track",
      render: (item) => (
        <div className="admin-content-row">
          <img
            src={item.artworkUrl || "https://i1.sndcdn.com/artworks-default.jpg"}
            alt={item.title}
            className="admin-content-img"
          />
          <div className="admin-content-info">
            <div className="admin-content-title">{item.title}</div>
            <div className="admin-content-artist">{item.artist}</div>
          </div>
        </div>
      ),
    },
    {
      key: "genre",
      label: "Genre",
      render: (item) => item.genre,
    },
    {
      key: "plays",
      label: "Plays",
      render: (item) => item.plays?.toLocaleString() || 0,
    },
    {
      key: "likes",
      label: "Likes",
      render: (item) => item.likes?.toLocaleString() || 0,
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
      onClick: (item) => setSelectedTrack(item),
    },
  ];

  const filteredTracks =
    activeTab === "all"
      ? tracks
      : tracks.filter((t) => t.status === activeTab);

  const handleHide = (id) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "hidden" } : t))
    );
    setSelectedTrack(null);
  };

  const handleUnhide = (id) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "active" } : t))
    );
    setSelectedTrack(null);
  };

  const handleRemove = (id) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "removed" } : t))
    );
    setSelectedTrack(null);
  };

  const tabs = [
    { label: "All Tracks", value: "all", count: tracks.length },
    { label: "Active", value: "active", count: tracks.filter((t) => t.status === "active").length },
    { label: "Hidden", value: "hidden", count: tracks.filter((t) => t.status === "hidden").length },
    { label: "Removed", value: "removed", count: tracks.filter((t) => t.status === "removed").length },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-header-title">Tracks</h1>
            <p className="admin-header-subtitle">
              Manage platform content
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
            data={filteredTracks}
            totalItems={filteredTracks.length}
            emptyState={{
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              ),
              title: "No tracks found",
              text:
                activeTab === "all"
                  ? "There are no tracks at this time."
                  : `There are no ${activeTab} tracks.`,
            }}
          />
        </div>

        {selectedTrack && (
          <TrackModal
            track={selectedTrack}
            onClose={() => setSelectedTrack(null)}
            onHide={handleHide}
            onUnhide={handleUnhide}
            onRemove={handleRemove}
          />
        )}
      </main>
    </div>
  );
};

export default AdminTracks;
