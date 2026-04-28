import React, { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { PulsifyAuthVaultContext } from "../store/PulsifyAuthVault";
import { PulsifyPremiumService } from "../services/pulsifyPremiumService";
import "../components/premium/css/PulsifyPremium.css";

const isMockMode =
  String(
    import.meta.env.VITE_USE_MOCKS ??
      import.meta.env.VITE_USE_MOCK_API ??
      import.meta.env.VITE_USE_MOCK ??
      "false",
  ).toLowerCase() === "true";

export const PulsifyPremiumUpgradePage = () => {
  const { subscriptionTier, setSubscriptionTierOverride, refreshSubscription } =
    useContext(PulsifyAuthVaultContext) || {};

  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errMessage, setErrMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [subInfo, setSubInfo] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(null); // null | 'checkout' | 'webhook' | 'done'

  const isPro = subscriptionTier === "PRO";

  // Load subscription & usage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [sub, usage] = await Promise.all([
          PulsifyPremiumService.getMySubscription(),
          PulsifyPremiumService.getMyUsage(),
        ]);
        setSubInfo(sub);
        setUsageInfo(usage);
      } catch (e) {
        // Non-blocking — page still works
      }
    };
    load();
  }, [subscriptionTier]);

  // ──── UPGRADE FLOW ────
  const handleUpgrade = async () => {
    try {
      setErrMessage(null);
      setSuccessMessage(null);
      setLoading(true);

      // Step 1: Create Checkout
      setCheckoutStep("checkout");
      const checkoutData = await PulsifyPremiumService.createCheckout();

      // Step 2: Fire Webhook (simulate Stripe callback)
      setCheckoutStep("webhook");
      const webhookPayload = checkoutData.webhook_payload_example;
      await PulsifyPremiumService.fireWebhook(webhookPayload);

      // Step 3: Update local state
      setCheckoutStep("done");
      if (setSubscriptionTierOverride) {
        setSubscriptionTierOverride("PRO");
      }
      if (refreshSubscription) {
        await refreshSubscription();
      }

      // Refresh info
      const [sub, usage] = await Promise.all([
        PulsifyPremiumService.getMySubscription(),
        PulsifyPremiumService.getMyUsage(),
      ]);
      setSubInfo(sub);
      setUsageInfo(usage);

      setSuccessMessage(
        "🎉 Payment successful! You are now subscribed to Artist Pro.",
      );
    } catch (err) {
      setErrMessage("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setCheckoutStep(null), 2000);
    }
  };

  // ──── CANCEL FLOW ────
  const handleCancel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel your Artist Pro subscription? You will lose access to unlimited uploads and premium features.",
      )
    ) {
      return;
    }
    try {
      setCancelling(true);
      setErrMessage(null);
      setSuccessMessage(null);

      await PulsifyPremiumService.cancelSubscription();

      // Force immediate downgrade in the UI
      // (The real backend only schedules cancel_at_period_end, but for demo we show instant)
      localStorage.setItem("pulsify_mock_tier", "FREE");
      if (setSubscriptionTierOverride) {
        setSubscriptionTierOverride("FREE");
      }
      // NOTE: Do NOT call refreshSubscription() here — it re-fetches from the backend
      // which still returns 'Artist Pro' (cancel only schedules end-of-period),
      // and that would override our local FREE state.

      // Update local display info
      setSubInfo((prev) => ({
        ...prev,
        subscription: {
          ...(prev?.subscription || {}),
          plan: "Free",
          status: "Cancelled",
          cancel_at_period_end: false,
        },
        effective_plan: "Free",
        plan_limits: {
          plan: "Free",
          can_upload: true,
          upload_track_limit: 10,
          album_limit: 2,
          album_track_limit: 5,
          is_ad_free: false,
          can_offline_listen: false,
        },
      }));
      setUsageInfo((prev) => ({
        ...prev,
        plan: "Free",
        status: "Cancelled",
        usage: {
          uploaded_tracks: {
            used: prev?.usage?.uploaded_tracks?.used ?? 0,
            limit: 10,
            remaining: Math.max(
              0,
              10 - (prev?.usage?.uploaded_tracks?.used ?? 0),
            ),
          },
          albums: prev?.usage?.albums || { used: 0, limit: 2, remaining: 2 },
          album_tracks_per_album: { limit: 5 },
        },
        plan_limits: {
          plan: "Free",
          can_upload: true,
          upload_track_limit: 10,
          album_limit: 2,
          album_track_limit: 5,
          is_ad_free: false,
          can_offline_listen: false,
        },
      }));

      setSuccessMessage(
        "Subscription cancelled. You are now on the Free plan.",
      );
    } catch (err) {
      setErrMessage("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // ──── USAGE DISPLAY HELPERS ────
  const trackUsed = usageInfo?.usage?.uploaded_tracks?.used ?? 0;
  const trackLimit =
    usageInfo?.usage?.uploaded_tracks?.limit ?? (isPro ? null : 10);
  const trackRemaining =
    usageInfo?.usage?.uploaded_tracks?.remaining ??
    (isPro ? null : Math.max(0, 10 - trackUsed));
  const usagePercent = trackLimit
    ? Math.min((trackUsed / trackLimit) * 100, 100)
    : 0;

  return (
    <div className="pulsify-premium-page">
      {/* ─── HERO GRADIENT SECTION ─── */}
      <div className="pulsify-premium-hero">
        <h1>
          Get unlimited uploads, pro stats, and{" "}
          <span className="pulsify-hero-highlight">ad-free listening</span>
        </h1>
        <p>Upgrade to Artist Pro to unlock the full Pulsify experience.</p>

        {/* Current Plan Badge */}
        <div className="pulsify-current-plan-badge">
          <span
            className={`plan-badge ${isPro ? "plan-badge-pro" : "plan-badge-free"}`}
          >
            {isPro ? "★ Artist Pro" : "Free Plan"}
          </span>
          {subInfo?.subscription?.status && (
            <span className="plan-status">
              Status: {subInfo.subscription.status}
            </span>
          )}
        </div>

        {/* Usage Bar (Free users only) */}
        {!isPro && trackLimit && (
          <div className="pulsify-usage-bar-hero">
            <div className="usage-bar-label">
              <span>
                {trackUsed > trackLimit
                  ? `⚠ Over limit: ${trackUsed} / ${trackLimit} tracks`
                  : `Uploads: ${trackUsed} / ${trackLimit} tracks used`}
              </span>
              <span>{Math.max(trackRemaining ?? 0, 0)} remaining</span>
            </div>
            <div className="usage-bar-track">
              <div
                className="usage-bar-fill"
                style={{
                  width: `${usagePercent}%`,
                  background:
                    trackUsed > trackLimit
                      ? "linear-gradient(90deg, #f50 0%, #ff3333 100%)"
                      : undefined,
                }}
              />
            </div>
          </div>
        )}

        {errMessage && (
          <div className="pulsify-premium-toast">{errMessage}</div>
        )}
        {successMessage && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div className="pulsify-premium-toast pulsify-toast-success">
              {successMessage}
            </div>
            <Link
              to="/my-tracks"
              style={{
                padding: "10px 28px",
                backgroundColor: "#fff",
                color: "#111",
                borderRadius: "50px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                transition: "opacity 0.15s",
              }}
            >
              Go to My Tracks
            </Link>
          </div>
        )}
      </div>

      {/* ─── CHECKOUT PROGRESS ─── */}
      {checkoutStep && (
        <div className="pulsify-checkout-progress">
          <div
            className={`checkout-step ${checkoutStep === "checkout" ? "active" : checkoutStep === "webhook" || checkoutStep === "done" ? "done" : ""}`}
          >
            <div className="step-circle">1</div>
            <span>Creating checkout</span>
          </div>
          <div className="checkout-connector" />
          <div
            className={`checkout-step ${checkoutStep === "webhook" ? "active" : checkoutStep === "done" ? "done" : ""}`}
          >
            <div className="step-circle">2</div>
            <span>Processing payment</span>
          </div>
          <div className="checkout-connector" />
          <div
            className={`checkout-step ${checkoutStep === "done" ? "active done" : ""}`}
          >
            <div className="step-circle">3</div>
            <span>Activating plan</span>
          </div>
        </div>
      )}

      {/* ─── PRICING CARDS ─── */}
      <div className="pulsify-pricing-section">
        <div className="pulsify-pricing-grid">
          {/* FREE TIER CARD */}
          <div
            className={`pulsify-pricing-card ${!isPro ? "pulsify-pricing-current" : ""}`}
          >
            {!isPro && (
              <div className="pulsify-current-badge">CURRENT PLAN</div>
            )}
            <div className="pulsify-card-tier-name">
              Free <span className="pulsify-tier-icon">♪</span>
            </div>
            <p className="pulsify-tier-tagline">Get started with the basics</p>
            <div className="pulsify-price-row">
              <span className="pulsify-price-amount">$0</span>
              <span className="pulsify-price-period">/ forever</span>
            </div>

            {isPro ? (
              <button
                className="pulsify-btn-subscribe pulsify-btn-outline"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Downgrade to Free"}
              </button>
            ) : (
              <button
                className="pulsify-btn-subscribe pulsify-btn-outline"
                disabled
              >
                Your current plan
              </button>
            )}

            <div className="pulsify-perks-divider" />
            <ul className="pulsify-perk-list">
              <li>
                <svg
                  className="pulsify-perk-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v20M2 12h20" />
                </svg>
                <span>10 track uploads</span>
                <span className="pulsify-perk-badge">LIMITED</span>
              </li>
              <li>
                <svg
                  className="pulsify-perk-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>2 album limit</span>
              </li>
              <li>
                <svg
                  className="pulsify-perk-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
                <span>Standard audio quality</span>
              </li>
              <li className="pulsify-perk-disabled">
                <svg
                  className="pulsify-perk-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Contains ads</span>
              </li>
              <li className="pulsify-perk-disabled">
                <svg
                  className="pulsify-perk-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>No offline listening</span>
              </li>
            </ul>
          </div>

          {/* ARTIST PRO CARD */}
          <div
            className={`pulsify-pricing-card pulsify-pricing-featured ${isPro ? "pulsify-pricing-current" : ""}`}
          >
            {isPro ? (
              <div className="pulsify-current-badge pulsify-current-badge-pro">
                ACTIVE ★
              </div>
            ) : (
              <div className="pulsify-featured-badge">MOST POPULAR</div>
            )}
            <div className="pulsify-card-tier-name">
              Artist Pro{" "}
              <span className="pulsify-tier-icon pulsify-tier-gold">★</span>
            </div>
            <p className="pulsify-tier-tagline">
              Unlimited access to all artist tools
            </p>
            <div className="pulsify-price-row">
              <span className="pulsify-price-amount">$12</span>
              <span className="pulsify-price-period">/ month</span>
            </div>

            {isPro ? (
              <button
                className="pulsify-btn-subscribe pulsify-btn-gold"
                disabled
              >
                ★ Your current plan
              </button>
            ) : (
              <button
                className="pulsify-btn-subscribe pulsify-btn-dark"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? "Processing..." : "Subscribe to Pro"}
              </button>
            )}

            <div className="pulsify-perks-divider" />
            <ul className="pulsify-perk-list">
              <li>
                <svg
                  className="pulsify-perk-icon pulsify-perk-icon-pro"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v20M2 12h20" />
                </svg>
                <span>Unlimited track uploads</span>
                <span className="pulsify-perk-badge pulsify-badge-unlimited">
                  UNLIMITED
                </span>
              </li>
              <li>
                <svg
                  className="pulsify-perk-icon pulsify-perk-icon-pro"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>Unlimited albums</span>
                <span className="pulsify-perk-badge pulsify-badge-unlimited">
                  UNLIMITED
                </span>
              </li>
              <li>
                <svg
                  className="pulsify-perk-icon pulsify-perk-icon-pro"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Advanced audience stats</span>
              </li>
              <li>
                <svg
                  className="pulsify-perk-icon pulsify-perk-icon-pro"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Ad-free experience</span>
                <span className="pulsify-perk-badge pulsify-badge-pro">
                  PRO
                </span>
              </li>
              <li>
                <svg
                  className="pulsify-perk-icon pulsify-perk-icon-pro"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Offline listening (download)</span>
                <span className="pulsify-perk-badge pulsify-badge-pro">
                  PRO
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── BOTTOM LINK ─── */}
        <div className="pulsify-free-tier-link">
          <Link to="/my-tracks">← Back to My Tracks</Link>
        </div>
      </div>
    </div>
  );
};
