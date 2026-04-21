import React from 'react';
import './ArtistToolsWidget.css';

const ArtistToolsWidget = () => {
  return (
    <div className="sc-sidebar-widget sc-artist-tools">
      <div className="sc-widget-header">
        <h3>ARTIST TOOLS</h3>
        <span className="sc-widget-chevron">▼</span>
      </div>
      
      <div className="sc-tools-grid">
        <div className="sc-tool-btn">
          <div className="sc-tool-icon">⚡+</div>
          <div className="sc-tool-label">Amplify</div>
        </div>
        <div className="sc-tool-btn">
          <div className="sc-tool-icon">🔄+</div>
          <div className="sc-tool-label">Replace</div>
        </div>
        <div className="sc-tool-btn">
          <div className="sc-tool-icon">🌐+</div>
          <div className="sc-tool-label">Distribute</div>
        </div>
        <div className="sc-tool-btn">
          <div className="sc-tool-icon">🎙+</div>
          <div className="sc-tool-label">Master</div>
        </div>
      </div>
      <button className="sc-tools-promo">
        <span className="sc-promo-icon">★</span> Unlock Artist tools from EGP 29.99/month.
      </button>
    </div>
  );
};

export default ArtistToolsWidget;