import { pulsifyAxiosInstance } from './api';

const isMock = () => String(import.meta.env.VITE_USE_MOCKS) === 'true';

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const mockPlans = [
  {
    _id: 'plan_free',
    plan: 'Free',
    can_upload: true,
    upload_track_limit: 10,
    album_limit: 2,
    album_track_limit: 5,
    is_ad_free: false,
    can_offline_listen: false,
  },
  {
    _id: 'plan_pro',
    plan: 'Artist Pro',
    can_upload: true,
    upload_track_limit: null,
    album_limit: null,
    album_track_limit: null,
    is_ad_free: true,
    can_offline_listen: true,
  },
];

let mockSubscription = {
  plan: 'Free',
  status: 'Cancelled',
  current_period_start: null,
  current_period_end: null,
  cancel_at_period_end: false,
};

let mockUsage = {
  uploaded_tracks: { used: 3, limit: 10, remaining: 7 },
  albums: { used: 0, limit: 2, remaining: 2 },
  album_tracks_per_album: { limit: 5 },
};

/* ═══════════════════════════════════════════
   SERVICE
   ═══════════════════════════════════════════ */

export const PulsifyPremiumService = {

  // ──── 1. GET ALL PLANS ────
  async getPlans() {
    if (isMock()) {
      return [...mockPlans];
    }
    const { data } = await pulsifyAxiosInstance.get('/plans');
    return data?.data || data;
  },

  // ──── 2. GET MY SUBSCRIPTION ────
  async getMySubscription() {
    if (isMock()) {
      const savedTier = localStorage.getItem('pulsify_mock_tier') || 'FREE';
      const plan = savedTier === 'PRO' ? 'Artist Pro' : 'Free';
      return {
        subscription: { ...mockSubscription, plan, status: plan === 'Artist Pro' ? 'Active' : 'Cancelled' },
        effective_plan: plan,
        plan_limits: mockPlans.find(p => p.plan === plan),
      };
    }
    const { data } = await pulsifyAxiosInstance.get('/subscriptions/me');
    return data?.data || data;
  },

  // ──── 3. GET MY USAGE ────
  async getMyUsage() {
    if (isMock()) {
      const savedTier = localStorage.getItem('pulsify_mock_tier') || 'FREE';
      if (savedTier === 'PRO') {
        return {
          plan: 'Artist Pro',
          status: 'Active',
          usage: {
            uploaded_tracks: { used: mockUsage.uploaded_tracks.used, limit: null, remaining: null },
            albums: { used: mockUsage.albums.used, limit: null, remaining: null },
            album_tracks_per_album: { limit: null },
          },
          plan_limits: mockPlans.find(p => p.plan === 'Artist Pro'),
        };
      }
      return {
        plan: 'Free',
        status: 'Cancelled',
        usage: { ...mockUsage },
        plan_limits: mockPlans.find(p => p.plan === 'Free'),
      };
    }
    const { data } = await pulsifyAxiosInstance.get('/users/me/usage');
    return data?.data || data;
  },

  // ──── 4. CREATE CHECKOUT (Upgrade to Artist Pro) ────
  async createCheckout() {
    if (isMock()) {
      await new Promise(r => setTimeout(r, 1500));
      const userId = JSON.parse(localStorage.getItem('pulsify_user') || '{}')._id || 'mock_user';
      return {
        checkout_mode: 'mock',
        checkout_url: `${window.location.origin}/premium?success=true`,
        webhook_payload_example: {
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: { user_id: userId, plan: 'Artist Pro' },
            },
          },
        },
      };
    }
    const { data } = await pulsifyAxiosInstance.post('/subscriptions/checkout', {
      plan: 'Artist Pro',
      success_url: `${window.location.origin}/premium?success=true`,
      cancel_url: `${window.location.origin}/premium?cancelled=true`,
    });
    return data?.data || data;
  },

  // ──── 5. FIRE WEBHOOK (complete mock Stripe callback) ────
  async fireWebhook(payload) {
    if (isMock()) {
      await new Promise(r => setTimeout(r, 800));
      localStorage.setItem('pulsify_mock_tier', 'PRO');
      mockSubscription = {
        plan: 'Artist Pro',
        status: 'Active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
      };
      return { received: true, processed: true, event: 'checkout.session.completed' };
    }
    const { data } = await pulsifyAxiosInstance.post('/subscriptions/webhook', payload);
    return data;
  },

  // ──── 6. CANCEL SUBSCRIPTION ────
  async cancelSubscription() {
    if (isMock()) {
      await new Promise(r => setTimeout(r, 1000));
      localStorage.setItem('pulsify_mock_tier', 'FREE');
      mockSubscription = {
        plan: 'Free',
        status: 'Cancelled',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
      };
      return { ...mockSubscription };
    }
    const { data } = await pulsifyAxiosInstance.post('/subscriptions/cancel');
    return data?.data || data;
  },
};
