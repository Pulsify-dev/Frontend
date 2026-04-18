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
  return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 300));
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
    return new Promise(resolve => 
      setTimeout(() => resolve({ status: 'success', data: { report: { _id: Date.now().toString(), ...reportData, status: 'Pending' } } }), 500)
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
}

export default new ModerationMockService();
