import React from 'react';
import './DiscoveryFeedPage.css';

import ArtistToolsWidget from '../components/common/ArtistToolsWidget';

const MOCK_MORE = [
  { id: 1, title: 'Caribou - Broke My Hea...', artist: '', img: 'https://i1.sndcdn.com/artworks-HwUoYhhL5kRj6QeH-LtoLmw-t200x200.jpg' },
  { id: 2, title: 'أديني رجعتلك- عمرو دياب 2001', artist: 'Someone\'', img: 'https://i1.sndcdn.com/artworks-000570081299-s27eb4-t200x200.jpg' },
  { id: 3, title: 'Metro Showdown', artist: 'HALSKI', img: 'https://i1.sndcdn.com/artworks-bUpx121XrtJdM3I5-Z7M3lA-t200x200.jpg' },
  { id: 4, title: 'عمرو دياب-لو كان يرضيك', artist: 'Roqaiation2', img: 'https://i1.sndcdn.com/artworks-000552763260-2t8ozm-t200x200.jpg' },
  { id: 5, title: 'BRE.AK', artist: '', img: 'https://i1.sndcdn.com/artworks-000490197771-3qpw7o-t200x200.jpg' },
];

const MOCK_MIXED = [
  { id: 6, title: 'vondr, Milzy, SHAKING, ...', artist: '', img: 'https://i1.sndcdn.com/artworks-YV1nN9s6B4Hj4aOQ-p9g1OQ-t200x200.jpg', tag: 'MIX 1', tagColor: '#a886d9' },
  { id: 7, title: 'canary yellow, Dismantl...', artist: '', img: 'https://i1.sndcdn.com/artworks-000185966395-5m3ly9-t200x200.jpg', tag: 'MIX 2', tagColor: '#1b64d1' },
  { id: 8, title: 'HALSKI, INUKA, drea...', artist: '', img: 'https://i1.sndcdn.com/artworks-QW8n2m2kX8R4zP9K-7q7gA3-t200x200.jpg', tag: 'MIX 3', tagColor: '#fff' },
  { id: 9, title: 'Dogs I Know, Aures, wu...', artist: '', img: 'https://i1.sndcdn.com/artworks-2Bqf3u7l9W7x-8P4xN1-t200x200.jpg', tag: 'MIX 4', tagColor: '#f16529' },
  { id: 10, title: 'ONLYTHEI...', artist: '', img: 'https://i1.sndcdn.com/artworks-Pq8L2x4N6o1R-6V3cT1-t200x200.jpg', tag: 'MIX 5', tagColor: '#333' }
];

const MOCK_CURATED = [
  { id: 11, title: 'TECHNO', artist: '', img: 'https://i1.sndcdn.com/artworks-0wK2R8U5Pq6N-7g8C1L-t200x200.jpg' },
  { id: 12, title: 'LEVEL UP', artist: '', img: 'https://i1.sndcdn.com/artworks-5T1v8B2Y4a6S-9K3pM4-t200x200.jpg' },
  { id: 13, title: 'FRESCO', artist: '', img: 'https://i1.sndcdn.com/artworks-2U9v3M7X4b1N-5H6jK2-t200x200.jpg' },
  { id: 14, title: 'DREAMS', artist: '', img: 'https://i1.sndcdn.com/artworks-8N4m1L6Q3p2V-1T7dF9-t200x200.jpg' }
];

const MOCK_ARTISTS = [
  { id: 1, name: 'Milzy', verified: true, followers: '1,264', tracks: '6', img: 'https://i1.sndcdn.com/avatars-0W1L8B3X5N7P-2q6kF4-t50x50.jpg' },
  { id: 2, name: 'MKULTRA', verified: false, followers: '209', tracks: '4', img: 'https://i1.sndcdn.com/avatars-1M4P7L2Q8N5B-9t3vH6-t50x50.jpg' },
  { id: 3, name: 'jouno', verified: false, followers: '120', tracks: '5', img: 'https://i1.sndcdn.com/avatars-5B2K8M3X1T9N-6c4dL7-t50x50.jpg' }
];

const MOCK_LIKES = [
  { id: 1, uploader: "Someone'", title: 'أديني رجعتلك- عمرو دياب 2001', plays: '44.7M', likes: '1.01M', reposts: '16.6K', comments: '2,205', img: 'https://i1.sndcdn.com/artworks-000570081299-s27eb4-t50x50.jpg' },
  { id: 2, uploader: 'Roqaiation2', title: 'عمرو دياب-لو كان يرضيك', plays: '36.5M', likes: '893K', reposts: '12K', comments: '2,169', img: 'https://i1.sndcdn.com/artworks-000552763260-2t8ozm-t50x50.jpg' }
];

const MOCK_HISTORY = [
  { id: 1, uploader: 'Genesis Light Operation', title: 'Still Here', plays: '13.4K', likes: '545', reposts: '8', comments: '8', img: 'https://i1.sndcdn.com/artworks-3F8L1Q6N2P4B-7t5wH2-t50x50.jpg' }
];

const DiscoveryFeedPage = () => {
  return (
    <div className="sc-discover-page" data-testid="discovery-feed-page">
      <div className="sc-discover-content">
        
        {/* Main Content Area */}
        <div className="sc-discover-main">
          
          <section className="sc-discover-shelf">
            <h2 className="sc-shelf-title">More of what you like</h2>
            <div className="sc-shelf-subtext">Suggestions based on what you've liked or played</div>
            <div className="sc-shelf-grid">
              {MOCK_MORE.map(item => (
                <div className="sc-card" key={item.id}>
                  <div className="sc-card-artwork">
                    <img src={item.img} alt={item.title} />
                  </div>
                  <div className="sc-card-title">{item.title}</div>
                  {item.artist && <div className="sc-card-artist">{item.artist}</div>}
                </div>
              ))}
            </div>
          </section>

          <section className="sc-discover-shelf">
            <h2 className="sc-shelf-title">Mixed for Ahmed A. Farag</h2>
            <div className="sc-shelf-subtext"></div>
            <div className="sc-shelf-grid sc-shelf-grid-mixed">
              {MOCK_MIXED.map(item => (
                <div className="sc-card sc-card-mixed" key={item.id}>
                  <div className="sc-card-artwork-wrapper">
                    <img src={item.img} alt={item.title} className="sc-card-mixed-img" />
                    {item.tag && (
                      <div className="sc-card-mixer-tag" style={{ backgroundColor: item.tagColor, color: item.tagColor === '#fff' ? '#000' : '#fff' }}>
                        {item.tag}
                      </div>
                    )}
                  </div>
                  <div className="sc-card-title">{item.title}</div>
                  {item.artist && <div className="sc-card-artist">{item.artist}</div>}
                </div>
              ))}
            </div>
          </section>

          <section className="sc-discover-shelf">
            <h2 className="sc-shelf-title">Curated by SoundCloud</h2>
            <div className="sc-shelf-subtext"></div>
            <div className="sc-shelf-grid">
              {MOCK_CURATED.map(item => (
                <div className="sc-card sc-card-curated" key={item.id}>
                  <div className="sc-card-artwork-wrapper">
                    <img src={item.img} alt={item.title} />
                    <div className="sc-card-curator-icon">☁</div>
                  </div>
                  <div className="sc-card-title">{item.title}</div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Sidebar */}
        <aside className="sc-discover-sidebar">
          
          <ArtistToolsWidget />

          {/* Artists You Should Follow */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>ARTISTS YOU SHOULD FOLLOW</h3>
              <button className="sc-widget-header-btn">Refresh list</button>
            </div>
            <div className="sc-list-items">
              {MOCK_ARTISTS.map(artist => (
                <div className="sc-artist-item" key={artist.id}>
                  <img src={artist.img} alt={artist.name} className="sc-artist-avatar" />
                  <div className="sc-artist-info">
                    <div className="sc-artist-name">
                      {artist.name}
                      {artist.verified && <span className="sc-verified-badge">✔</span>}
                    </div>
                    <div className="sc-artist-stats">
                      <span>👥 {artist.followers}</span>
                      <span style={{marginLeft: '6px'}}>🎶 {artist.tracks}</span>
                    </div>
                  </div>
                  <button className="sc-follow-btn">Follow</button>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Likes */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>5 LIKES</h3>
              <a href="#" className="sc-widget-header-link">View all</a>
            </div>
            <div className="sc-list-items">
              {MOCK_LIKES.map(track => (
                <div className="sc-track-mini" key={track.id}>
                  <img src={track.img} alt={track.title} className="sc-track-mini-art" />
                  <div className="sc-track-info">
                    <div className="sc-track-uploader">{track.uploader}</div>
                    <div className="sc-track-title">{track.title}</div>
                    <div className="sc-track-stats">
                      <span>▶ {track.plays}</span>
                      <span>♥ {track.likes}</span>
                      <span>🔁 {track.reposts}</span>
                      <span>💬 {track.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Listening History */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>LISTENING HISTORY</h3>
              <a href="#" className="sc-widget-header-link">View all</a>
            </div>
            <div className="sc-list-items">
              {MOCK_HISTORY.map(track => (
                <div className="sc-track-mini" key={track.id}>
                  <img src={track.img} alt={track.title} className="sc-track-mini-art" />
                  <div className="sc-track-info">
                    <div className="sc-track-uploader">{track.uploader}</div>
                    <div className="sc-track-title">{track.title}</div>
                    <div className="sc-track-stats">
                      <span>▶ {track.plays}</span>
                      <span>♥ {track.likes}</span>
                      <span>🔁 {track.reposts}</span>
                      <span>💬 {track.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="sc-sidebar-footer-links">
            <a href="#">Legal</a> - <a href="#">Privacy</a> - <a href="#">Cookie Policy/Imprint</a> - <a href="#">Charts</a> - <a href="#">Newsroom</a>
            <div className="sc-lang" style={{marginTop: '4px'}}>Language: <a href="#">English (US)</a></div>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default DiscoveryFeedPage;
