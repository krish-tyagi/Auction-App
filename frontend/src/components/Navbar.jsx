import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';
import { 
  Gavel, 
  PlusCircle, 
  User, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Layers, 
  Clock, 
  Flame,
  Search,
  ChevronDown,
  Sparkles,
  History
} from 'lucide-react';

export const Navbar = ({ 
  activeFilter, 
  setActiveFilter, 
  searchQuery, 
  setSearchQuery, 
  onOpenCreate,
  onOpenActivity,
  activityTab,
  setActivityTab 
}) => {
  const { user, isAuthenticated, logout, openLogin, openSignup } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    socketService.connect();
    const unsub = socketService.onStatusChange((connected) => {
      setSocketConnected(connected);
    });
    return unsub;
  }, []);

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => setActiveFilter('all')}>
          <div className="brand-icon-wrapper">
            <Gavel className="brand-gavel-icon" />
            <span className="brand-pulse-glow" />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">BidPulse</span>
            <span className="brand-tagline">Live Market</span>
          </div>
        </div>

        {/* Live Socket Status Indicator */}
        <div className={`socket-status-badge ${socketConnected ? 'connected' : 'disconnected'}`}>
          {socketConnected ? (
            <>
              <span className="socket-pulse-ring" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="socket-label">Live Socket</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="socket-label">Reconnecting</span>
            </>
          )}
        </div>

        {/* Quick Nav Filters */}
        <nav className="navbar-nav-tabs">
          <button
            className={`nav-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <Layers className="w-4 h-4" />
            <span>All Auctions</span>
          </button>
          <button
            className={`nav-tab-btn ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>Live Now</span>
            <span className="live-dot-mini" />
          </button>
          <button
            className={`nav-tab-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Upcoming</span>
          </button>
        </nav>

        {/* Search Bar */}
        <div className="navbar-search-wrapper">
          <Search className="search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Search items, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Actions & User Section */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <button className="btn-create-auction" onClick={onOpenCreate}>
                <PlusCircle className="w-4 h-4" />
                <span>Create Auction</span>
              </button>

              <div className="user-profile-menu-container">
                <button
                  className="user-profile-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <div className="user-avatar-circle">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-profile-meta">
                    <span className="user-name-text">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 dropdown-arrow" />
                </button>

                {userDropdownOpen && (
                  <div 
                    className="user-dropdown-card"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="dropdown-user-header">
                      <p className="dropdown-user-name">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="dropdown-user-email">{user?.email}</p>
                    </div>

                    <div className="dropdown-divider" />

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setActivityTab('myBids');
                        onOpenActivity();
                        setUserDropdownOpen(false);
                      }}
                    >
                      <History className="w-4 h-4 text-cyan-400" />
                      <span>My Bids & Bidding History</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setActivityTab('myAuctions');
                        onOpenActivity();
                        setUserDropdownOpen(false);
                      }}
                    >
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>My Listed Auctions</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        onOpenCreate();
                        setUserDropdownOpen(false);
                      }}
                    >
                      <PlusCircle className="w-4 h-4 text-indigo-400" />
                      <span>Create New Auction</span>
                    </button>

                    <div className="dropdown-divider" />

                    <button
                      className="dropdown-item dropdown-logout"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons-group">
              <button className="btn-auth-login" onClick={openLogin}>
                Sign In
              </button>
              <button className="btn-auth-signup" onClick={openSignup}>
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
