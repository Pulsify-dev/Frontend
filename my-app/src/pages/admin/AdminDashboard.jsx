import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCard from "@/components/admin/StatsCard";

const mockUserGrowthData = [
  { month: "Jan", users: 1200 },
  { month: "Feb", users: 1450 },
  { month: "Mar", users: 1680 },
  { month: "Apr", users: 1920 },
  { month: "May", users: 2150 },
  { month: "Jun", users: 2380 },
];

const mockPlaysData = [
  { day: "Mon", plays: 4500 },
  { day: "Tue", plays: 5200 },
  { day: "Wed", plays: 4800 },
  { day: "Thu", plays: 6100 },
  { day: "Fri", plays: 7200 },
  { day: "Sat", plays: 8500 },
  { day: "Sun", plays: 7900 },
];

const mockContentTypeData = [
  { name: "Music", value: 65 },
  { name: "Podcasts", value: 20 },
  { name: "Audiobooks", value: 15 },
];

const COLORS = ["#ff5500", "#3b82f6", "#22c55e"];

const recentReports = [
  {
    id: 1,
    type: "copyright",
    reporter: { username: "musicfan42", email: "music@email.com" },
    content: { title: "Summer Vibes", artist: "DJ Summer" },
    reason: "This is my original track being stolen",
    status: "pending",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    type: "inappropriate",
    reporter: { username: "cleanlistner", email: "clean@email.com" },
    content: { title: "Late Night", artist: "Unknown Producer" },
    reason: "Contains offensive language",
    status: "pending",
    createdAt: "2024-01-15T09:15:00Z",
  },
  {
    id: 3,
    type: "copyright",
    reporter: { username: "producer_mike", email: "mike@email.com" },
    content: { title: "Beats for Days", artist: "Mike Beats" },
    reason: "Unauthorized sample usage",
    status: "pending",
    createdAt: "2024-01-14T16:45:00Z",
  },
];

const AdminDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("7d");

  const chartPeriods = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-header-title">Dashboard</h1>
            <p className="admin-header-subtitle">
              Platform health and moderation overview
            </p>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-stats-grid">
            <StatsCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              iconClass="admin-stat-icon--users"
              value="23,847"
              label="Total Users"
              change="+12.5%"
              changeType="up"
            />
            <StatsCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
              iconClass="admin-stat-icon--active"
              value="8,421"
              label="Active Users"
              change="+8.3%"
              changeType="up"
            />
            <StatsCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              }
              iconClass="admin-stat-icon--plays"
              value="1.2M"
              label="Total Plays"
              change="+24.1%"
              changeType="up"
            />
            <StatsCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              }
              iconClass="admin-stat-icon--storage"
              value="847 GB"
              label="Storage Used"
              change="+5.2%"
              changeType="up"
            />
          </div>

          <div className="admin-charts-grid">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3 className="admin-chart-title">User Growth</h3>
                <div className="admin-chart-tabs">
                  {chartPeriods.map((period) => (
                    <button
                      key={period.value}
                      className={`admin-chart-tab ${
                        chartPeriod === period.value ? "active" : ""
                      }`}
                      onClick={() => setChartPeriod(period.value)}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockUserGrowthData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#2a2a2a"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${value / 1000}k` : value
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#ff5500"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: "#ff5500" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3 className="admin-chart-title">Content Distribution</h3>
              </div>
              <div className="admin-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockContentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mockContentTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: "#bdbdbd", fontSize: "13px" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-chart-card" style={{ marginBottom: "24px" }}>
            <div className="admin-chart-header">
              <h3 className="admin-chart-title">Plays This Week</h3>
            </div>
            <div className="admin-chart-container" style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockPlaysData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a2a2a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${value / 1000}k` : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="plays"
                    fill="#ff5500"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Pending Reports</h3>
              <a
                href="/admin/reports"
                style={{
                  color: "var(--sc-orange)",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View All
              </a>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reporter</th>
                  <th>Content</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${report.type}`}
                        style={{ textTransform: "capitalize" }}
                      >
                        {report.type}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-user">
                        <img
                          src="https://i1.sndcdn.com/avatars-default.jpg"
                          alt={report.reporter.username}
                          className="admin-table-user-avatar"
                        />
                        <div className="admin-table-user-info">
                          <div className="admin-table-user-name">
                            {report.reporter.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-report-content">
                        <div className="admin-report-content-info">
                          <div className="admin-report-content-title">
                            {report.content.title}
                          </div>
                          <div className="admin-report-content-artist">
                            {report.content.artist}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {report.reason}
                      </span>
                    </td>
                    <td style={{ color: "var(--sc-muted)" }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-quick-stats">
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">12</div>
              <div className="admin-quick-stat-label">Pending Reports</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">847</div>
              <div className="admin-quick-stat-label">Tracks Today</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">34</div>
              <div className="admin-quick-stat-label">New Artists</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">2.4%</div>
              <div className="admin-quick-stat-label">Report Rate</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
