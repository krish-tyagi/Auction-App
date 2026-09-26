import React from 'react';
import { Flame, Clock, Trophy, Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { formatCurrency, formatTimeRemaining } from '../utils/formatters';

export const HeroBanner = ({
  auctions,
  activeFilter,
  setActiveFilter,
  onSelectAuction,
  onOpenCreate,
  isAuthenticated,
  onOpenAuth,
}) => {
  const activeCount = auctions.filter((a) => a.status === 'active').length;
  const upcomingCount = auctions.filter((a) => a.status === 'upcoming').length;
  const totalVolume = auctions.reduce((acc, a) => acc + (a.currentPrice || a.startingPrice || 0), 0);

  // Find a top featured active auction
  const featuredAuction = auctions.find((a) => a.status === 'active') || auctions[0];
  const featuredCountdown = featuredAuction ? formatTimeRemaining(featuredAuction.endTime) : null;

  return (
    <section className="hero-banner-root">
      <div className="hero-glow-blob hero-blob-1" />
      <div className="hero-glow-blob hero-blob-2" />

      <div className="hero-content-grid">
        {/* Left column: Text & CTA */}
        <div className="hero-text-side">
          <div className="hero-pill-badge">
            <span className="hero-pulse-dot" />
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Next-Gen Real-Time Bidding Engine</span>
          </div>

          <h1 className="hero-main-title">
            Bid in Real-Time. <br />
            <span className="gradient-text-hero">Win Exclusive Assets.</span>
          </h1>

          <p className="hero-description">
            Experience ultra-low latency live auctions powered by instant WebSockets. 
            Track high-frequency bidding wars, place precision bids, and list your own items seamlessly.
          </p>

          <div className="hero-cta-group">
            <button
              className="hero-primary-btn"
              onClick={() => {
                if (featuredAuction) {
                  onSelectAuction(featuredAuction);
                } else {
                  setActiveFilter('active');
                }
              }}
            >
              <Flame className="w-5 h-5 text-emerald-300" />
              <span>Explore Live Rooms</span>
            </button>

            {isAuthenticated ? (
              <button className="hero-secondary-btn" onClick={onOpenCreate}>
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>List an Item</span>
              </button>
            ) : (
              <button className="hero-secondary-btn" onClick={onOpenAuth}>
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Join Platform</span>
              </button>
            )}
          </div>

          {/* Dynamic Metrics */}
          <div className="hero-metrics-row">
            <div className="metric-item">
              <span className="metric-value font-mono">
                <span className="metric-live-dot" />
                {activeCount}
              </span>
              <span className="metric-label">Live Active Rooms</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-value font-mono">{upcomingCount}</span>
              <span className="metric-label">Upcoming Scheduled</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-value font-mono">{formatCurrency(totalVolume)}</span>
              <span className="metric-label">Current Live Volume</span>
            </div>
          </div>
        </div>

        {/* Right column: Spotlight Card */}
        {featuredAuction && (
          <div className="hero-spotlight-side">
            <div className="spotlight-card">
              <div className="spotlight-header">
                <div className="spotlight-tag">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Featured Live Auction</span>
                </div>
                <div className="spotlight-timer font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{featuredCountdown?.text}</span>
                </div>
              </div>

              <div className="spotlight-body">
                <h3 className="spotlight-item-title">{featuredAuction.title}</h3>
                <p className="spotlight-item-desc">
                  {featuredAuction.description?.slice(0, 110)}
                  {featuredAuction.description?.length > 110 ? '...' : ''}
                </p>

                <div className="spotlight-stats-box">
                  <div className="spotlight-stat">
                    <span className="stat-label">Current Bid</span>
                    <span className="stat-price font-mono text-emerald-400">
                      {formatCurrency(featuredAuction.currentPrice || featuredAuction.startingPrice)}
                    </span>
                  </div>
                  <div className="spotlight-stat">
                    <span className="stat-label">Min. Increment</span>
                    <span className="stat-increment font-mono">
                      +{formatCurrency(featuredAuction.minimumBidIncrement || 1)}
                    </span>
                  </div>
                </div>

                <div className="spotlight-leader-bar">
                  <span className="leader-label">Top Bidder:</span>
                  <span className="leader-name">
                    {featuredAuction.highestBidder
                      ? `${featuredAuction.highestBidder.firstName} ${featuredAuction.highestBidder.lastName}`
                      : 'No bids placed yet'}
                  </span>
                </div>

                <button
                  className="spotlight-action-btn"
                  onClick={() => onSelectAuction(featuredAuction)}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Enter Live Room & Bid</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="hero-filter-bar">
        <div className="filter-chips-list">
          <button
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Auctions ({auctions.length})
          </button>
          <button
            className={`filter-chip chip-live ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            <span className="chip-dot-live" />
            Live Now ({activeCount})
          </button>
          <button
            className={`filter-chip chip-upcoming ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Upcoming ({upcomingCount})
          </button>
          <button
            className={`filter-chip chip-ended ${activeFilter === 'ended' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ended')}
          >
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            Past Winners ({auctions.filter((a) => a.status === 'ended').length})
          </button>
        </div>
      </div>
    </section>
  );
};
