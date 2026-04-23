const mockReports = [
  {
    _id: '65e2b3c4d5e6f7a8b9c0d1e2',
    reporter_id: { _id: '64f1a2b3c4d5e6f7a8b9c0d1', username: 'johndoe', email: 'johndoe@example.com' },
    entity_type: 'Track',
    status: 'Pending',
    reason: 'Copyright',
    description: 'Mock report description'
  }
];

export const createReport = async (reportData) => {
  const report = {
    _id: Date.now().toString(),
    reporter_id: { _id: 'mock-user', username: 'current_user', email: 'current_user@pulsify.dev' },
    entity_type: reportData.entity_type,
    entity_id: reportData.entity_id,
    reason: reportData.reason,
    description: reportData.description || '',
    status: 'Pending'
  };
  mockReports.unshift(report);
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success', data: { report } }), 300));
};

export const getReports = async ({ status = 'Pending' } = {}) => {
  const filtered = mockReports.filter(r => r.status === status);
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success', data: { reports: filtered, total: filtered.length } }), 300));
};

export const resolveReport = async (reportId, status, adminNotes) => {
  const report = mockReports.find(r => r._id === reportId);
  if (report) {
    report.status = status;
    report.admin_notes = adminNotes;
  }
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 300));
};

export const suspendUser = async (userId) => {
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success', message: 'User suspended' }), 300));
};

export const restoreUser = async (userId) => {
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success', message: 'User restored' }), 300));
};

const mockUsersData = [
  { _id: 'u1', username: 'johndoe', email: 'john@example.com', role: 'User', is_suspended: false, created_at: '2023-01-01' },
  { _id: 'u2', username: 'janedoe', email: 'jane@example.com', role: 'Artist', is_suspended: false, created_at: '2023-05-12' },
  { _id: 'u3', username: 'spammer99', email: 'spam@example.com', role: 'User', is_suspended: true, created_at: '2024-02-10' },
  { _id: 'u4', username: 'admin_boss', email: 'boss@pulsify.com', role: 'Admin', is_suspended: false, created_at: '2022-10-01' }
];

export const getUsers = async ({ role = 'All', search = '' } = {}) => {
  let filtered = mockUsersData;
  if (role !== 'All') filtered = filtered.filter(u => u.role === role);
  if (search) filtered = filtered.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success', data: { users: filtered, total: filtered.length } }), 300));
};

export const updateUserRole = async (userId, role) => {
  const user = mockUsersData.find(u => u._id === userId);
  if (user) user.role = role;
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success', message: 'Role updated' }), 300));
};

// Mock logic for development when VITE_USE_MOCK_API is true
class ModerationMockService {
  constructor() {
    this.mockReports = [
      {
        _id: '65e2b3c4d5e6f7a8b9c0d1e2',
        reporter_id: { _id: '64f1a2b3c4d5e6f7a8b9c0d1', username: 'johndoe', email: 'johndoe@example.com' },
        entity_type: 'Track',
        status: 'Pending',
        reason: 'Copyright',
        description: 'Mock report description'
      },
      {
        _id: '8212b3c4d5e6f7a8b9c0d9e4',
        reporter_id: { _id: '12f1a2b3c4d5e6f7a8b9c0d3', username: 'janedoe', email: 'jane@example.com' },
        entity_type: 'User',
        status: 'Pending',
        reason: 'InappropriateContent',
        description: 'Account spamming comments.'
      }
    ];
  }

  async createReport(reportData) {
    console.log('MOCK: createReport', reportData);
    const report = {
      _id: Date.now().toString(),
      reporter_id: { _id: 'mock-user', username: 'current_user', email: 'current_user@pulsify.dev' },
      entity_type: reportData.entity_type,
      entity_id: reportData.entity_id,
      reason: reportData.reason,
      description: reportData.description || '',
      status: 'Pending'
    };
    this.mockReports.unshift(report);
    return new Promise(resolve => 
      setTimeout(() => resolve({ status: 'success', data: { report } }), 500)
    );
  }

  async getReports({ page = 1, limit = 20, status = 'Pending' } = {}) {
    console.log(`MOCK: getReports status=${status}`);
    const filtered = this.mockReports.filter(r => r.status === status);
    return new Promise(resolve => 
      setTimeout(() => resolve({ status: 'success', data: { reports: filtered, total: filtered.length } }), 500)
    );
  }

  async resolveReport(reportId, status, adminNotes) {
    console.log(`MOCK: resolveReport ${reportId} to ${status}`);
    const report = this.mockReports.find(r => r._id === reportId);
    if (report) {
      report.status = status;
      report.admin_notes = adminNotes;
    }
    return new Promise(resolve => 
      setTimeout(() => resolve({ status: 'success', data: { report: { _id: reportId, status, admin_notes: adminNotes } } }), 500)
    );
  }

  async getAnalytics() {
    const totalUsers = mockUsersData.length;
    const suspendedUsers = mockUsersData.filter((user) => user.is_suspended).length;
    const activeUsers = Math.max(0, totalUsers - suspendedUsers);
    const pendingReports = this.mockReports.filter((report) => report.status === 'Pending').length;
    const playThroughRate = 0.72;
    const totalStorageBytes = totalUsers * 185000000000;

    return new Promise((resolve) =>
      setTimeout(() => resolve({
        status: 'success',
        data: {
          total_active_users: activeUsers,
          play_through_rate: playThroughRate,
          total_storage_bytes: totalStorageBytes,
          new_users_this_month: 3,
          suspended_users_count: suspendedUsers,
          pending_reports_count: pendingReports,
          plan_distribution: { Free: 2, Artist: 1, ArtistPro: 1 }
        }
      }), 300)
    );
  }

  async suspendUser(userId) {
    console.log(`MOCK: suspendUser ${userId}`);
    return new Promise(resolve => 
      setTimeout(() => resolve({ status: 'success', message: 'User suspended', data: { user: { _id: userId, is_suspended: true } } }), 500)
    );
  }

  async restoreUser(userId) {
    console.log(`MOCK: restoreUser ${userId}`);
    return new Promise(resolve => 
      setTimeout(() => resolve({ status: 'success', message: 'User restored', data: { user: { _id: userId, is_suspended: false } } }), 500)
    );
  }

  async getSystemLogs({ level = 'All' } = {}) {
    console.log(`MOCK: getSystemLogs (level: ${level})`);
    const logs = [
      { id: 'log-1', category: 'SECURITY', level: 'CRITICAL', action: 'Multiple Failed Logins', user: 'Unknown IP', details: '192.168.1.99 tried 15 times', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
      { id: 'log-2', category: 'MODERATION', level: 'WARNING', action: 'User Suspended', user: 'Admin (admin@pulsify.com)', details: 'Suspended user ID: user-004', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: 'log-3', category: 'SYSTEM', level: 'INFO', action: 'Database Backup', user: 'System', details: 'Automated backup completed', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { id: 'log-4', category: 'MODERATION', level: 'INFO', action: 'Role Upgraded', user: 'Admin (admin@pulsify.com)', details: 'Upgraded user-002 to Artist', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { id: 'log-5', category: 'CONTENT', level: 'WARNING', action: 'Track Takedown', user: 'Admin (admin@pulsify.com)', details: 'Removed track trk-991 due to copyright', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    ];
    return new Promise(resolve => 
      setTimeout(() => {
        const filtered = level === 'All' ? logs : logs.filter(l => l.level === level);
        resolve({ status: 'success', data: { logs: filtered, total: filtered.length } });
      }, 500)
    );
  }
}

export default new ModerationMockService();
