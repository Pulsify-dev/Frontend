import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../components/premium/css/PulsifyPremium.css';

export const PulsifyPremiumUpgradePage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = (tierName) => {
    setIsProcessing(true);
    // Mocking Stripe Checkout latency
    setTimeout(() => {
      alert(`Success! You have purchased the ${tierName} subscription. Payment simulated.`);
      setIsProcessing(false);
      // In a real app we would update Context/Redux here
      // localStorage.setItem('isPulsifyPremium', 'true');
      navigate('/upload');
    }, 1500);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <Link to="/playlists" style={{ display: 'block', textAlign: 'left', marginBottom: '20px', color: '#f50', textDecoration: 'none' }}>
        &larr; Back to Dashboard
      </Link>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Upgrade Your Sound</h1>
      <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '40px' }}>
        Get unlimited uploads, advanced analytics, and priority support.
      </p>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* Basic Tier (Current) */}
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
          <h2>Basic</h2>
          <h3 style={{ fontSize: '2rem', margin: '20px 0' }}>Free</h3>
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 30px auto', maxWidth: '200px' }}>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; Listen ad-free</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; Create Playlists</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333', color: '#f50' }}>&#10007; Max 3 Uploads</li>
            <li style={{ padding: '10px 0', color: '#666' }}>&#10007; No Analytics</li>
          </ul>
          <button disabled style={{ width: '100%', padding: '15px', backgroundColor: '#333', color: '#888', border: 'none', borderRadius: '4px', cursor: 'not-allowed' }}>
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#222', padding: '30px', borderRadius: '8px', border: '2px solid #f50', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f50', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            MOST POPULAR
          </div>
          <h2>Pro</h2>
          <h3 style={{ fontSize: '2rem', margin: '20px 0' }}>$4.99<span style={{ fontSize: '1rem', color: '#888' }}>/mo</span></h3>
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 30px auto', maxWidth: '200px' }}>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; Listen ad-free</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; Create Playlists</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333', color: '#1db954' }}>&#10003; Unlimited Uploads</li>
            <li style={{ padding: '10px 0' }}>&#10003; Basic Analytics</li>
          </ul>
          <button 
            data-testid="upgrade-pro-btn"
            onClick={() => handleCheckout('Pro')}
            disabled={isProcessing}
            style={{ width: '100%', padding: '15px', backgroundColor: '#f50', color: 'white', border: 'none', borderRadius: '4px', cursor: isProcessing ? 'wait' : 'pointer', fontWeight: 'bold' }}
          >
            {isProcessing ? 'Processing Payment...' : 'Subscribe to Pro'}
          </button>
        </div>

        {/* Go+ Tier */}
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
          <h2>Go+</h2>
          <h3 style={{ fontSize: '2rem', margin: '20px 0' }}>$9.99<span style={{ fontSize: '1rem', color: '#888' }}>/mo</span></h3>
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 30px auto', maxWidth: '200px' }}>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; Everything in Pro</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; Offline Listening</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>&#10003; High Quality Audio</li>
            <li style={{ padding: '10px 0' }}>&#10003; Priority Support</li>
          </ul>
          <button 
            data-testid="upgrade-go-btn"
            onClick={() => handleCheckout('Go+')}
            disabled={isProcessing}
            style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: isProcessing ? 'wait' : 'pointer', fontWeight: 'bold' }}
          >
            {isProcessing ? 'Processing Payment...' : 'Subscribe to Go+'}
          </button>
        </div>

      </div>
    </div>
  );
};
