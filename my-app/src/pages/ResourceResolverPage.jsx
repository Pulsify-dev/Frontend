import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import serviceLocator from '../utils/serviceLocator';

const ResourceResolverPage = () => {
  const location = useLocation();
  const [resolvedPath, setResolvedPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      try {
        setLoading(true);
        // The URL path could be /username or /username/track-permalink
        // The backend expects the raw path
        const res = await serviceLocator.discovery.resolveUrl(location.pathname);
        if (!mounted) return;

        if (res?.success && res?.data) {
          const { type, data } = res.data;
          // Dynamically map the resolved type to the internal route structure
          if (type === 'user') {
            setResolvedPath(`/profile/${data._id}`);
          } else if (type === 'track') {
            setResolvedPath(`/tracks/${data._id}`);
          } else if (type === 'album') {
            setResolvedPath(`/albums/${data._id}`);
          } else if (type === 'playlist') {
             setResolvedPath(`/playlists/${data._id}`);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [location.pathname]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="sc-loader"><div className="sc-loader-bar"></div></div>
      </div>
    );
  }

  if (error || !resolvedPath) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px', color: '#fff' }}>404</h1>
        <h2 style={{ color: '#fff' }}>We can't find that page.</h2>
        <p style={{ color: '#888', marginTop: '10px' }}>A URL resolver error occurred. The link you followed may be broken, or the page may have been removed.</p>
        <button onClick={() => window.location.href = '/'} style={{ marginTop: '20px', padding: '10px 20px', background: '#f50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Go to Home
        </button>
      </div>
    );
  }

  // Seamlessly navigate without adding the resolver logic step to browser history
  return <Navigate to={resolvedPath} replace />;
};

export default ResourceResolverPage;
