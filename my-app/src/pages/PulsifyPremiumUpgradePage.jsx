import React, { useState, useContext } from 'react';
import { pulsifyAxiosInstance } from '../services/api';
import { Link } from 'react-router-dom';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import '../components/premium/css/PulsifyPremium.css';

export const PulsifyPremiumUpgradePage = () => {
  const [loadingPro, setLoadingPro] = useState(false);
  const [loadingGoPlus, setLoadingGoPlus] = useState(false);
  const [errMessage, setErrMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { subscriptionTier, setSubscriptionTierOverride } = useContext(PulsifyAuthVaultContext) || {};

  const initStripeSession = async (planType) => {
    try {
      setErrMessage(null);
      setSuccessMessage(null);
      if (planType === 'pro') setLoadingPro(true);
      if (planType === 'goplus') setLoadingGoPlus(true);
      
      if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
        // Simulate Stripe processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newTier = planType === 'pro' ? 'PRO' : 'GO_PLUS';
        const planLabel = planType === 'pro' ? 'Artist Pro' : 'Go+';
        
        // Actually upgrade the user's tier in the global context
        if (setSubscriptionTierOverride) {
          setSubscriptionTierOverride(newTier);
        }
        
        setSuccessMessage(`Payment successful! You are now subscribed to ${planLabel}.`);
        setLoadingPro(false);
        setLoadingGoPlus(false);
        return;
      }

      const response = await pulsifyAxiosInstance.post('/subscriptions/checkout', { plan: planType });
      const checkoutUrl = response.data.checkout_url || response.data.url;
      
      if (checkoutUrl) {
         window.location.href = checkoutUrl;
      } else {
         setErrMessage('Stripe session URL missing from response.');
      }
    } catch (err) {
      setErrMessage('Payment gateway unreachable. Try again.');
    } finally {
      setLoadingPro(false);
      setLoadingGoPlus(false);
    }
  };

  return (
    <div className="pulsify-premium-page">
      {/* ─── HERO GRADIENT SECTION ─── */}
      <div className="pulsify-premium-hero">
        <h1>Get unlimited uploads, pro stats, and <span className="pulsify-hero-highlight">ad-free listening</span></h1>
        <p>Choose the plan that fits your needs — whether you're a listener or an artist.</p>
        {errMessage && <div className="pulsify-premium-toast">{errMessage}</div>}
        {successMessage && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="pulsify-premium-toast pulsify-toast-success">{successMessage}</div>
            <Link to="/playlists" style={{
              padding: '10px 28px', backgroundColor: '#fff', color: '#111',
              borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
              transition: 'opacity 0.15s'
            }}>
              Back to Sets
            </Link>
          </div>
        )}
      </div>

      {/* ─── PRICING CARDS ─── */}
      <div className="pulsify-pricing-section">
        <div className="pulsify-pricing-grid">

          {/* GO+ CARD (Left — Listener) */}
          <div className="pulsify-pricing-card">
            <div className="pulsify-card-tier-name">
              Go+ <span className="pulsify-tier-icon">✦</span>
            </div>
            <p className="pulsify-tier-tagline">The ultimate listening experience</p>
            <div className="pulsify-price-row">
              <span className="pulsify-price-amount">$15</span>
              <span className="pulsify-price-period">/ month</span>
            </div>
            <button 
              className="pulsify-btn-subscribe pulsify-btn-dark" 
              onClick={() => initStripeSession('goplus')}
              disabled={loadingGoPlus}
            >
              {loadingGoPlus ? 'Connecting...' : 'Subscribe to Go+'}
            </button>

            <div className="pulsify-perks-divider" />
            <ul className="pulsify-perk-list">
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                <span>Ad-free listening</span>
              </li>
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span>Offline sync support</span>
              </li>
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <span>High quality audio</span>
              </li>
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.5 14a9 9 0 105-7.5L1 10"/></svg>
                <span>Full catalogue access</span>
              </li>
            </ul>
          </div>

          {/* ARTIST PRO CARD (Right — Featured) */}
          <div className="pulsify-pricing-card pulsify-pricing-featured">
            <div className="pulsify-featured-badge">MOST POPULAR</div>
            <div className="pulsify-card-tier-name">
              Artist Pro <span className="pulsify-tier-icon pulsify-tier-gold">★</span>
            </div>
            <p className="pulsify-tier-tagline">Unlimited access to all artist tools</p>
            <div className="pulsify-price-row">
              <span className="pulsify-price-amount">$12</span>
              <span className="pulsify-price-period">/ month</span>
            </div>
            <button 
              className="pulsify-btn-subscribe pulsify-btn-dark" 
              onClick={() => initStripeSession('pro')}
              disabled={loadingPro}
            >
              {loadingPro ? 'Connecting...' : 'Subscribe to Pro'}
            </button>

            <div className="pulsify-perks-divider" />
            <ul className="pulsify-perk-list">
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                <span>Unlimited track uploads</span>
              </li>
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span>Advanced audience stats</span>
              </li>
              <li>
                <svg className="pulsify-perk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <span>Custom profile controls</span>
              </li>
            </ul>
            <a href="#" className="pulsify-see-all-link">See all benefits</a>
          </div>

        </div>

        {/* ─── BOTTOM LINK ─── */}
        <div className="pulsify-free-tier-link">
          <Link to="/playlists">Or continue without a paid plan →</Link>
        </div>
      </div>
    </div>
  );
};
