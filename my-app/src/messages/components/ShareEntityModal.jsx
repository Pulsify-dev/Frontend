import { useEffect, useState } from "react";
import { Search, Music, FolderOpen, Disc, X, Loader2 } from "lucide-react";
import * as discoveryService from "@/services/discoveryService";

export const ShareEntityModal = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentTracks, setRecentTracks] = useState([]);
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("recent");
    setSearchQuery("");
    setError("");
    loadRecentData();
  }, [isOpen]);

  const loadRecentData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [tracks, playlists] = await Promise.all([
        discoveryService.getRecentTracks(5),
        discoveryService.getMyPlaylists(5),
      ]);
      setRecentTracks(tracks);
      setMyPlaylists(playlists);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      if (activeTab === "search") {
        const [tracks, playlists, albums] = await Promise.all([
          discoveryService.searchTracks(searchQuery),
          discoveryService.searchPlaylists(searchQuery),
          discoveryService.searchAlbums(searchQuery),
        ]);
        setSearchResults([...tracks, ...playlists, ...albums]);
      } else if (activeTab === "playlists") {
        const playlists = await discoveryService.searchPlaylists(searchQuery);
        setSearchResults(playlists);
      }
    } catch (err) {
      setError("Search failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    if (tab === "recent") {
      loadRecentData();
    }
  };

  const handleSelect = (entity) => {
    let type = "Track";
    if (entity.trackId) {
      type = "Track";
    } else if (entity.title && entity.trackCount !== undefined) {
      type = "Playlist";
    } else if (entity.title && entity.artist) {
      type = "Album";
    }
    onSelect({
      type,
      id: entity.trackId || entity.id,
      title: entity.title,
      artist: entity.artist?.name,
    });
    onClose();
  };

  const getEntityIcon = (entity) => {
    if (entity.trackId) return <Music size={16} />;
    if (entity.trackCount !== undefined) return <FolderOpen size={16} />;
    return <Disc size={16} />;
  };

  const formatEntitySubtitle = (entity) => {
    if (entity.artist?.name) return entity.artist.name;
    if (entity.owner?.username) return `by ${entity.owner.username}`;
    if (entity.trackCount) return `${entity.trackCount} tracks`;
    return "";
  };

  if (!isOpen) return null;

  const displayItems =
    activeTab === "recent"
      ? [...recentTracks, ...myPlaylists]
      : activeTab === "playlists"
      ? myPlaylists
      : searchResults;

  return (
    <div className="messages-modal-overlay" onClick={onClose}>
      <div className="messages-share-modal" onClick={(e) => e.stopPropagation()}>
        <header className="messages-share-modal-header">
          <h3>Share</h3>
          <button
            type="button"
            className="messages-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="messages-share-modal-tabs">
          <button
            type="button"
            className={`messages-share-tab${activeTab === "recent" ? " active" : ""}`}
            onClick={() => handleTabChange("recent")}
          >
            Recent
          </button>
          <button
            type="button"
            className={`messages-share-tab${activeTab === "search" ? " active" : ""}`}
            onClick={() => handleTabChange("search")}
          >
            Search
          </button>
          <button
            type="button"
            className={`messages-share-tab${activeTab === "playlists" ? " active" : ""}`}
            onClick={() => handleTabChange("playlists")}
          >
            Playlists
          </button>
        </div>

        {(activeTab === "search" || activeTab === "playlists") && (
          <div className="messages-share-modal-search">
            <Search size={16} className="messages-share-search-icon" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "search" ? "tracks, albums..." : "playlists..."}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="messages-share-search-input"
            />
          </div>
        )}

        <div className="messages-share-modal-body">
          {isLoading ? (
            <div className="messages-share-loading">
              <Loader2 size={20} className="messages-loading-spinner" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="messages-share-error">{error}</div>
          ) : displayItems.length === 0 ? (
            <div className="messages-share-empty">
              {activeTab === "recent"
                ? "No recent tracks or playlists"
                : "No results found"}
            </div>
          ) : (
            <div className="messages-share-list">
              {displayItems.map((entity) => (
                <button
                  type="button"
                  key={entity.trackId || entity.id}
                  className="messages-share-item"
                  onClick={() => handleSelect(entity)}
                >
                  <div className="messages-share-item-icon">
                    {getEntityIcon(entity)}
                  </div>
                  <div className="messages-share-item-info">
                    <span className="messages-share-item-title">
                      {entity.title}
                    </span>
                    <span className="messages-share-item-subtitle">
                      {formatEntitySubtitle(entity)}
                    </span>
                  </div>
                  <span className="messages-share-item-select">Select</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};