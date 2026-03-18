/**
 * Navbar Component
 * Global navigation bar following SoundCloud's design
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Menu, X } from 'lucide-react';
import SoundCloudLogo from '@/components/common/SoundCloudLogo';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Feed', path: '/feed' },
    { name: 'Library', path: '/library' },
  ];

  // Check if link is active
  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="flex items-center gap-8">
        <SoundCloudLogo />
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`hover:text-foreground transition-colors ${
                isActiveLink(link.path) ? 'text-foreground' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-input rounded-sm overflow-hidden">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search for artists, bands, tracks, podcasts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm px-4 py-2 w-80 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 hover:w-96 focus:w-96"
            />
            <button type="submit" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Auth Links */}
        <Link
          to="/login"
          className="text-sm px-5 py-2 rounded-full bg-foreground/10 text-foreground font-medium hover:bg-foreground/20 backdrop-blur-sm transition-all duration-200"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="text-sm px-5 py-2 rounded-full border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
        >
          Create account
        </Link>
        <a href="#" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
          Upload
        </a>

        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={20} />
        </button>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border md:hidden p-4 z-50">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex items-center bg-input rounded-sm overflow-hidden">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button type="submit" className="px-3 py-2 text-muted-foreground">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Mobile Nav Links */}
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${
                isActiveLink(link.path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <hr className="my-2 border-border" />

          <Link
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-sm text-muted-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-sm text-primary"
          >
            Create account
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
