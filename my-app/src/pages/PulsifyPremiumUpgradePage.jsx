import React, { useState } from 'react';
import { pulsifyAxiosInstance } from '../services/api';
import '../components/premium/css/PulsifyPremium.css';

export const PulsifyPremiumUpgradePage = () => {
  const [loadingPro, setLoadingPro] = useState(false);
  const [loadingGoPlus, setLoadingGoPlus] = useState(false);
  const [errMessage, setErrMessage] = useState(null);

  const initStripeSession = async (planType) => {
    try {
      if (planType === 'pro') setLoadingPro(true);
      if (planType === 'goplus') setLoadingGoPlus(true);
      
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
    <div className="pulsify-premium-container">
      <div className="pulsify-premium-header">
        <h1>Support the artists you love with Next Pro</h1>
        <p>Get unlimited uploads, pro stats, and ad-free listening.</p>
        {errMessage && <div className="pulsify-premium-error">{errMessage}</div>}
      </div>
      <div className="pulsify-pricing-grid">
        <div className="pulsify-pricing-card">
          <h2>Next Pro</h2>
          <div className="pulsify-price">$12<span>/mo</span></div>
          <ul className="pulsify-perk-list">
            <li>Unlimited track uploads</li>
            <li>Advanced audience stats</li>
            <li>Custom profile controls</li>
          </ul>
          <button 
            className="pulsify-btn-premium" 
            onClick={() => initStripeSession('pro')}
            disabled={loadingPro}
          >
            {loadingPro ? 'Connecting Sandbox...' : 'Subscribe to Pro'}
          </button>
        </div>
        
        <div className="pulsify-pricing-card pulsify-pricing-featured">
          <div className="pulsify-featured-badge">MOST POPULAR</div>
          <h2>SoundCloud Go+</h2>
          <div className="pulsify-price">$15<span>/mo</span></div>
          <ul className="pulsify-perk-list">
            <li>Ad-free listening</li>
            <li>Offline sync support</li>
            <li>High quality audio</li>
            <li>Full catalogue access</li>
          </ul>
          <button 
            className="pulsify-btn-premium" 
            onClick={() => initStripeSession('goplus')}
            disabled={loadingGoPlus}
          >
            {loadingGoPlus ? 'Connecting Sandbox...' : 'Subscribe to Go+'}
          </button>
        </div>
      </div>
    </div>
  );
};
