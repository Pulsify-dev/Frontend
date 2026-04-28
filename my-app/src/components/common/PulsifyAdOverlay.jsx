import React, { useEffect, useRef, useState } from 'react';

/**
 * PulsifyAdOverlay — Full-screen ad video overlay for Free-tier users.
 * 
 * Props:
 *   adVideoUrl   — S3 URL of the ad video to play
 *   isVisible    — whether to show the overlay
 *   onAdComplete — callback when ad finishes (resumes music playback)
 */
const PulsifyAdOverlay = ({ adVideoUrl, isVisible, onAdComplete }) => {
  const videoRef = useRef(null);
  const [countdown, setCountdown] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay blocked — allow skip immediately
        setCanSkip(true);
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    // Allow skip after 5 seconds
    const timer = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setCanSkip(false);
      setCountdown(0);
    }
  }, [isVisible]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const remaining = Math.ceil(videoRef.current.duration - videoRef.current.currentTime);
    setCountdown(remaining > 0 ? remaining : 0);
  };

  const handleEnded = () => {
    if (onAdComplete) onAdComplete();
  };

  const handleSkip = () => {
    if (videoRef.current) videoRef.current.pause();
    if (onAdComplete) onAdComplete();
  };

  if (!isVisible || !adVideoUrl) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif'
    }}>
      {/* Ad label */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px',
        color: '#999', fontSize: '12px', fontWeight: 'bold',
        letterSpacing: '1px', textTransform: 'uppercase'
      }}>
        Advertisement
      </div>

      {/* Countdown / Skip */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        {canSkip ? (
          <button
            onClick={handleSkip}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', padding: '8px 20px', borderRadius: '4px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
              backdropFilter: 'blur(8px)', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          >
            Skip Ad ▶
          </button>
        ) : (
          <div style={{
            color: '#999', fontSize: '13px', fontWeight: 'bold',
            backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 16px',
            borderRadius: '4px'
          }}>
            Ad · {countdown}s
          </div>
        )}
      </div>

      {/* Video player */}
      <video
        ref={videoRef}
        src={adVideoUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        style={{
          maxWidth: '80%', maxHeight: '70%', borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}
        playsInline
      />

      {/* Pulsify branding */}
      <div style={{
        position: 'absolute', bottom: '24px',
        color: '#555', fontSize: '12px'
      }}>
        Upgrade to <span style={{ color: '#f50', fontWeight: 'bold' }}>Artist Pro</span> for ad-free listening
      </div>
    </div>
  );
};

export default PulsifyAdOverlay;
