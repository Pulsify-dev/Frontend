import React, { useState, useEffect } from "react";
import { PulsifyPlaylistService } from "../services/pulsifyPlaylistService";
import { PulsifyAlbumService } from "../services/pulsifyAlbumService";
import { PulsifySquarePlaylistCard } from "../components/playlists/PulsifySquarePlaylistCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import FollowingPage from "@/social/pages/FollowingPage";

export const PulsifyLibraryPlaylists = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Playlists");

  // Playlists state
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState(null);

  // Albums state
  const [albums, setAlbums] = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState(null);

  // Fetch playlists when tab is active
  useEffect(() => {
    if (activeTab !== "Playlists") return;
    let isMounted = true;
    const load = async () => {
      setPlaylistsLoading(true);
      setPlaylistsError(null);
      try {
        const data = await PulsifyPlaylistService.retrieveAllPlaylists("me");
        if (isMounted) {
          const rawPlaylists = Array.isArray(data)
            ? data
            : data.playlists || [];
          setPulsifyPlaylists(rawPlaylists);
        }
      } catch (err) {
        if (isMounted)
          setPlaylistsError(err.message || "Failed to retrieve playlists.");
      } finally {
        if (isMounted) setPlaylistsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Fetch albums when tab is active
  useEffect(() => {
    if (activeTab !== "Albums") return;
    if (!user?.id) return;

    let isMounted = true;
    const load = async () => {
      setAlbumsLoading(true);
      setAlbumsError(null);
      try {
        const data = await PulsifyAlbumService.getArtistAlbums(user.id);
        const rawAlbums =
          data.albums || data.data || (Array.isArray(data) ? data : []);
        if (isMounted) setAlbums(rawAlbums);
      } catch (err) {
        if (isMounted)
          setAlbumsError(err.message || "Failed to retrieve albums.");
      } finally {
        if (isMounted) setAlbumsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const TABS = [
    "Overview",
    "Likes",
    "Playlists",
    "Albums",
    "Stations",
    "Following",
    "History",
  ];

  const renderContent = () => {
    if (activeTab === "Playlists") {
      if (playlistsLoading)
        return (
          <div style={{ color: "#999", padding: "40px 0" }}>
            Loading playlists...
          </div>
        );
      if (playlistsError)
        return (
          <div style={{ color: "#f50", padding: "40px 0" }}>
            {playlistsError}
          </div>
        );
      return (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ color: "#fff", fontSize: "18px", margin: 0 }}>
              Hear your own playlists and the playlists you've liked:
            </h2>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                placeholder="Filter"
                style={{
                  backgroundColor: "#222",
                  border: "1px solid #333",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
          {pulsifyPlaylists.length === 0 ? (
            <div style={{ color: "#999", fontSize: "14px", marginTop: "20px" }}>
              You have no playlists yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "24px",
                width: "100%",
              }}
            >
              {pulsifyPlaylists.map((pl) => (
                <PulsifySquarePlaylistCard
                  key={pl._id || pl.id}
                  playlist={pl}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (activeTab === "Albums") {
      if (albumsLoading)
        return (
          <div style={{ color: "#999", padding: "40px 0" }}>
            Loading albums...
          </div>
        );
      if (albumsError)
        return (
          <div style={{ color: "#f50", padding: "40px 0" }}>{albumsError}</div>
        );
      return (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ color: "#fff", fontSize: "18px", margin: 0 }}>
              Your albums and EPs:
            </h2>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                placeholder="Filter"
                style={{
                  backgroundColor: "#222",
                  border: "1px solid #333",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
          {albums.length === 0 ? (
            <div style={{ color: "#999", fontSize: "14px", marginTop: "20px" }}>
              You have no albums yet.{" "}
              <Link
                to="/upload"
                style={{ color: "#f50", textDecoration: "none" }}
              >
                Upload multiple tracks
              </Link>{" "}
              to create one.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "24px",
                width: "100%",
              }}
            >
              {albums.map((album) => {
                const albId = album._id || album.id;
                const artworkUrl =
                  album.artwork_url ||
                  "https://placehold.co/200x200/1a1a1a/333?text=💿";
                const creatorName =
                  album.artist_id?.display_name ||
                  album.artist_id?.username ||
                  "You";
                const trackCount =
                  album.track_count || album.tracks?.length || 0;
                const albumType = album.type || "Album";
                return (
                  <div
                    key={albId}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <Link
                      to={`/albums/${albId}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1/1",
                          position: "relative",
                          overflow: "hidden",
                          borderRadius: "4px",
                          backgroundColor: "#222",
                        }}
                      >
                        <img
                          src={artworkUrl}
                          alt={album.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/200x200/1a1a1a/333?text=💿";
                          }}
                        />
                        {/* Type badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "3px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {albumType}
                        </div>
                        {/* Track count badge */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            color: "#ccc",
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "3px",
                          }}
                        >
                          {trackCount} track{trackCount !== 1 ? "s" : ""}
                        </div>
                        {/* Play button overlay */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0,0,0,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = 1)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = 0)
                          }
                        >
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              backgroundColor: "#f50",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="#fff"
                              style={{ marginLeft: "4px" }}
                            >
                              <polygon points="6,3 20,12 6,21" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <Link
                        to={`/albums/${albId}`}
                        style={{
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {album.title}
                      </Link>
                      <span
                        style={{
                          color: "#999",
                          fontSize: "12px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: "2px",
                        }}
                      >
                        {creatorName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    // For other tabs, show a placeholder
    if (activeTab === "Following") {
      return <FollowingPage hideNav />;
    }
    return (
      <div style={{ color: "#999", fontSize: "14px", marginTop: "20px" }}>
        {activeTab} — coming soon.
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#111",
        minHeight: "100vh",
        fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: "32px", paddingTop: "30px" }}>
          {TABS.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                paddingBottom: "12px",
                fontSize: "18px",
                fontWeight: "bold",
                color: tab === activeTab ? "#fff" : "#999",
                borderBottom:
                  tab === activeTab
                    ? "3px solid #f50"
                    : "3px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (tab !== activeTab) e.currentTarget.style.color = "#ccc";
              }}
              onMouseLeave={(e) => {
                if (tab !== activeTab) e.currentTarget.style.color = "#999";
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        <div style={{ paddingTop: "30px", paddingBottom: "30px" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
