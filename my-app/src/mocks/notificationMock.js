// Mock notification data simulating backend snake_case format
const mockNotifications = [
  {
    id: 'notif-001',
    type: 'like',
    actor_name: 'Dr. Loop',
    actor_avatar: 'https://i.pravatar.cc/150?u=drloop',
    target_title: 'Midnight Syntax',
    message: 'liked your track',
    read: false,
    created_at: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'notif-002',
    type: 'repost',
    actor_name: 'UI/UX Mafia',
    actor_avatar: 'https://i.pravatar.cc/150?u=mafia',
    target_title: 'Glassmorphic Bass',
    message: 'reposted your track',
    read: false,
    created_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'notif-003',
    type: 'follow',
    actor_name: 'Node Ninja',
    actor_avatar: 'https://i.pravatar.cc/150?u=ninja',
    target_title: null,
    message: 'started following you',
    read: false,
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'notif-004',
    type: 'comment',
    actor_name: 'Async Annie',
    actor_avatar: 'https://i.pravatar.cc/150?u=annie',
    target_title: 'Async Await Lullaby',
    message: 'commented on your track',
    read: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-005',
    type: 'like',
    actor_name: 'Bass Dropper',
    actor_avatar: 'https://i.pravatar.cc/150?u=bass',
    target_title: 'Midnight Syntax',
    message: 'liked your track',
    read: true,
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

// Adapter: snake_case to camelCase
const adaptNotification = (n) => ({
  id: n.id,
  type: n.type,
  actorName: n.actor_name,
  actorAvatar: n.actor_avatar,
  targetTitle: n.target_title,
  message: n.message,
  read: n.read,
  createdAt: n.created_at
});

export const fetchNotifications = async () => {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockNotifications.map(adaptNotification)), 300);
  });
};

export const fetchUnreadCount = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const count = mockNotifications.filter(n => !n.read).length;
      resolve(count);
    }, 100);
  });
};

export const markNotificationRead = async (notifId) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const notif = mockNotifications.find(n => n.id === notifId);
      if (notif) notif.read = true;
      resolve({ success: true, id: notifId });
    }, 100);
  });
};

export const markAllNotificationsRead = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      mockNotifications.forEach(n => { n.read = true; });
      resolve({ success: true });
    }, 100);
  });
};
