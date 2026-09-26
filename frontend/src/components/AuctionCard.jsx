import React, { useState, useEffect } from 'react';
import { Flame, Clock, Trophy, Shield, ArrowRight, User, Sparkles } from 'lucide-react';
import { formatCurrency, formatDateTime, formatTimeRemaining, getStatusBadge } from '../utils/formatters';

export const AuctionCard = ({ auction, onSelect, currentUserId }) => {
  const [timeLeft, setTimeLeft] = useState(() =>
    formatTimeRemaining(auction.status === 'upcoming' ? auction.startTime : auction.endTime)
  );
  const [priceUpdated, setPriceUpdated] = useState(false);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      const target = auction.status === 'upcoming' ? auction.startTime : auction.endTime;
      setTimeLeft(formatTimeRemaining(target));
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.status, auction.startTime, auction.endTime]);

  // Flash card price when currentPrice changes
  useEffect(() => {
    setPriceUpdated(true);
    const timeout = setTimeout(() => setPriceUpdated(false), 1200);
    return () => clearTimeout(timeout);
  }, [auction.currentPrice]);

  const badge = getStatusBadge(auction.status, auction.startTime, auction.endTime);
  const isSeller = currentUserId && (
    auction.seller?._id === currentUserId || auction.seller === currentUserId
  );
  const isHighestBidder = currentUserId && (
    auction.highestBidder?._id === currentUserId || auction.highestBidder === currentUserId
  );

  const nextMinimumBid = !auction.highestBidder
    ? auction.startingPrice
    : auction.currentPrice + (auction.minimumBidIncrement || 1);

  return (
    <div
      className={`auction-card-root ${auction.status} ${priceUpdated ? 'flash-update' : ''}`}
      onClick={() => onSelect(auction)}
    >
      {/* Top Bar with Badges */}
      <div className="card-top-bar">
        <div className={`status-pill ${badge.color}`}>
          <span className={`status-dot ${badge.dotClass}`} />
          <span>{badge.label}</span>
        </div>

        <div className={`countdown-pill font-mono ${timeLeft.totalSeconds < 300 && auction.status === 'active' ? 'urgent' : ''}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>
            {auction.status === 'upcoming' ? `Starts: ${timeLeft.text}` : timeLeft.text}
          </span>
        </div>
      </div>

      {/* Item Info */}
      <div className="card-body">
        <h3 className="card-title" title={auction.title}>
          {auction.title}
        </h3>
        
        <p className="card-desc">
          {auction.description?.slice(0, 95)}
          {auction.description?.length > 95 ? '...' : ''}
        </p>

        {/* Pricing Matrix */}
        <div className="card-pricing-box">
          <div className="pricing-col">
            <span className="pricing-label">Current Price</span>
            <div className="pricing-value-wrap">
              <span className="pricing-amount font-mono text-emerald-400">
                {formatCurrency(auction.currentPrice || auction.startingPrice)}
              </span>
              {priceUpdated && <span className="price-up-tag font-mono">LIVE ▲</span>}
            </div>
          </div>

          <div className="pricing-col text-right">
            <span className="pricing-label">
              {auction.status === 'active' ? 'Min. Next Bid' : 'Starting Bid'}
            </span>
            <span className="pricing-next font-mono">
              {auction.status === 'active' ? formatCurrency(nextMinimumBid) : formatCurrency(auction.startingPrice)}
            </span>
          </div>
        </div>

        {/* Seller & Highest Bidder Badges */}
        <div className="card-meta-footer">
          <div className="seller-badge">
            <User className="w-3 h-3 text-slate-400" />
            <span>
              Seller: {auction.seller?.firstName || 'Host'}
            </span>
            {isSeller && <span className="tag-you">(You)</span>}
          </div>

          {auction.highestBidder ? (
            <div className={`bidder-badge ${isHighestBidder ? 'badge-you-winning' : ''}`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>
                {isHighestBidder ? 'You are leading!' : `${auction.highestBidder?.firstName || 'Bidder'}`}
              </span>
            </div>
          ) : (
            <div className="bidder-badge text-slate-500">No bids yet</div>
          )}
        </div>

        {/* Winner display if ended */}
        {auction.status === 'ended' && (
          <div className="card-ended-banner">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>
              Winner:{' '}
              <strong>
                {auction.highestBidder
                  ? `${auction.highestBidder.firstName} ${auction.highestBidder.lastName}`
                  : 'Unsold (No bids)'}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="card-action-footer">
        <button
          className={`card-cta-btn ${
            auction.status === 'active'
              ? 'btn-live-action'
              : auction.status === 'upcoming'
              ? 'btn-upcoming-action'
              : 'btn-ended-action'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(auction);
          }}
        >
          {auction.status === 'active' && (
            <>
              <Flame className="w-4 h-4 text-emerald-300" />
              <span>Join Live Bidding Room</span>
              <ArrowRight className="w-4 h-4 cta-arrow" />
            </>
          )}
          {auction.status === 'upcoming' && (
            <>
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Preview & Set Alert</span>
              <ArrowRight className="w-4 h-4 cta-arrow" />
            </>
          )}
          {auction.status === 'ended' && (
            <>
              <Trophy className="w-4 h-4 text-slate-400" />
              <span>View Results & Bids</span>
              <ArrowRight className="w-4 h-4 cta-arrow" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
