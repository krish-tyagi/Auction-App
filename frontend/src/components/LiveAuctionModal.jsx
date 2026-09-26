import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { sounds } from '../services/sound';
import { ConfettiEffect } from './ConfettiEffect';
import { 
  X, 
  Flame, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  Trophy, 
  User, 
  Send, 
  Zap, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Edit3, 
  Trash2,
  Lock
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatTimeRemaining, getStatusBadge } from '../utils/formatters';

export const LiveAuctionModal = ({ 
  auction: initialAuction, 
  onClose, 
  onAuctionUpdated,
  onOpenEdit,
  onDeleteAuction
}) => {
  const { user, isAuthenticated, openLogin } = useAuth();
  const { addToast } = useToast();

  const [auction, setAuction] = useState(initialAuction);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confettiActive, setConfettiActive] = useState(false);
  const [priceFlash, setPriceFlash] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => 
    formatTimeRemaining(auction.status === 'upcoming' ? auction.startTime : auction.endTime)
  );

  const bidsEndRef = useRef(null);

  // Compute conditions
  const isSeller = Boolean(user && (
    (typeof auction.seller === 'object' && auction.seller?._id === user.id) ||
    auction.seller === user.id
  ));

  const isHighestBidder = Boolean(user && (
    (typeof auction.highestBidder === 'object' && auction.highestBidder?._id === user.id) ||
    auction.highestBidder === user.id
  ));

  const nextMinimumBid = !auction.highestBidder
    ? auction.startingPrice
    : auction.currentPrice + (auction.minimumBidIncrement || 1);

  // Load initial bids
  const loadBids = useCallback(async () => {
    try {
      const res = await api.bids.getAuctionBids(auction._id);
      if (res && res.bids) {
        setBids(res.bids);
      }
    } catch {
      // If unauthorized or error, bids list might start empty
    }
  }, [auction._id]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  // Live countdown timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      const target = auction.status === 'upcoming' ? auction.startTime : auction.endTime;
      const t = formatTimeRemaining(target);
      setTimeLeft(t);

      // Auto-transition to ended when time expires locally
      if (t.isExpired && auction.status === 'active') {
        setAuction((prev) => ({ ...prev, status: 'ended' }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.status, auction.startTime, auction.endTime]);

  // Setup Socket Room and Real-Time Listeners
  useEffect(() => {
    const auctionId = auction._id;
    socketService.connect();
    socketService.joinAuction(auctionId);

    // 1. Listen for new incoming bids in this auction
    const unsubBid = socketService.onNewBid((data) => {
      if (data.auctionId === auctionId) {
        setAuction((prev) => ({
          ...prev,
          currentPrice: data.currentPrice,
          highestBidder: data.highestBidder,
        }));

        setBids((prev) => {
          const newBidItem = {
            _id: data.bid.id || Math.random().toString(),
            bidder: data.bid.bidder,
            amount: data.bid.amount,
            createdAt: data.bid.createdAt || new Date().toISOString(),
          };
          // Prepend or re-sort
          return [newBidItem, ...prev.filter((b) => b._id !== newBidItem._id)];
        });

        // Visual flash & sound
        setPriceFlash(true);
        setTimeout(() => setPriceFlash(false), 1500);

        if (user && data.highestBidder?._id === user.id) {
          sounds.playBidSound();
          setConfettiActive(true);
          addToast({
            title: 'You are in the lead!',
            message: `Your bid of ${formatCurrency(data.currentPrice)} is currently highest!`,
            type: 'success',
          });
        } else {
          sounds.playOutbidAlert();
          addToast({
            title: 'New Live Bid Placed!',
            message: `${data.highestBidder?.firstName || 'A bidder'} placed ${formatCurrency(data.currentPrice)}`,
            type: 'info',
          });
        }
      }
    });

    // 2. Listen for auction started
    const unsubStart = socketService.onAuctionStarted((data) => {
      if (data.auctionId === auctionId) {
        setAuction((prev) => ({
          ...prev,
          status: 'active',
          currentPrice: data.currentPrice,
          endTime: data.endTime,
        }));
        addToast({
          title: 'Auction is now LIVE!',
          message: `${data.title} has begun! Place your bids now.`,
          type: 'success',
        });
      }
    });

    // 3. Listen for auction ended
    const unsubEnd = socketService.onAuctionEnded((data) => {
      if (data.auctionId === auctionId) {
        setAuction((prev) => ({
          ...prev,
          status: 'ended',
          currentPrice: data.finalPrice,
          highestBidder: data.winner,
        }));

        if (user && data.winner && data.winner._id === user.id) {
          sounds.playWinCelebration();
          setConfettiActive(true);
          addToast({
            title: '🎉 CONGRATULATIONS!',
            message: `You WON the auction for ${formatCurrency(data.finalPrice)}!`,
            type: 'success',
            duration: 8000,
          });
        } else {
          addToast({
            title: 'Auction Ended',
            message: `${data.title} has concluded at ${formatCurrency(data.finalPrice)}.`,
            type: 'warning',
          });
        }
      }
    });

    return () => {
      socketService.leaveAuction(auctionId);
      unsubBid();
      unsubStart();
      unsubEnd();
    };
  }, [auction._id, user, addToast]);

  // Handle Bid Placement
  const handlePlaceBid = async (amountToPlace) => {
    const amount = Number(amountToPlace || bidAmount);

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!amount || isNaN(amount)) {
      addToast({
        title: 'Invalid Amount',
        message: 'Please enter a valid numeric bid amount.',
        type: 'error',
      });
      return;
    }

    if (amount < nextMinimumBid) {
      addToast({
        title: 'Bid Too Low',
        message: `Your bid must be at least ${formatCurrency(nextMinimumBid)}.`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.bids.placeBid(auction._id, amount);
      sounds.playBidSound();
      setBidAmount('');
      setConfettiActive(true);

      // Refresh auction status & notify parent
      if (res.auction) {
        setAuction((prev) => ({
          ...prev,
          currentPrice: res.auction.currentPrice,
          highestBidder: res.auction.highestBidder,
        }));
        if (onAuctionUpdated) {
          onAuctionUpdated(auction._id, res.auction.currentPrice, res.auction.highestBidder);
        }
      }

      // Re-load bids
      loadBids();
    } catch (err) {
      addToast({
        title: 'Could Not Place Bid',
        message: err.message || 'Bid rejected by server.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const badge = getStatusBadge(auction.status, auction.startTime, auction.endTime);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

      <div className="live-room-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Navigation Bar */}
        <div className="room-nav-header">
          <div className="room-nav-left">
            <div className={`status-pill ${badge.color}`}>
              <span className={`status-dot ${badge.dotClass}`} />
              <span>{badge.label}</span>
            </div>

            <div className="room-socket-tag">
              <span className="socket-pulse-ring-small" />
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="font-mono text-xs text-emerald-400">SYNCED</span>
            </div>

            <button
              className="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>

          <div className="room-nav-right">
            {isSeller && auction.status === 'upcoming' && (
              <div className="seller-action-btns">
                <button
                  className="btn-modal-edit"
                  onClick={() => onOpenEdit(auction)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  className="btn-modal-delete"
                  onClick={() => onDeleteAuction(auction._id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}

            <button className="btn-modal-close" onClick={onClose} aria-label="Close Room">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Grid */}
        <div className="room-grid">
          {/* Left Column: Stage & Details */}
          <div className="room-stage-panel">
            {/* Countdown Banner */}
            <div className={`room-countdown-banner ${timeLeft.totalSeconds < 300 && auction.status === 'active' ? 'urgent-pulse' : ''}`}>
              <div className="countdown-icon-box">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="countdown-text-box">
                <span className="countdown-label">
                  {auction.status === 'upcoming'
                    ? 'AUCTION COMMENCES IN'
                    : auction.status === 'active'
                    ? 'TIME REMAINING TO BID'
                    : 'AUCTION CLOSED'}
                </span>
                <span className="countdown-digits font-mono">
                  {timeLeft.text}
                </span>
              </div>
            </div>

            {/* Price Big Display */}
            <div className={`room-price-card ${priceFlash ? 'price-flash-active' : ''}`}>
              <div className="price-card-header">
                <span className="price-title-label">
                  {auction.status === 'ended' ? 'FINAL CLOSING PRICE' : 'CURRENT HIGHEST BID'}
                </span>
                {priceFlash && <span className="live-flash-tag font-mono">● NEW HIGH BID</span>}
              </div>

              <div className="price-big-amount font-mono">
                {formatCurrency(auction.currentPrice || auction.startingPrice)}
              </div>

              <div className="price-card-sub">
                <span>Starting Bid: <strong>{formatCurrency(auction.startingPrice)}</strong></span>
                <span className="bullet-sep">•</span>
                <span>Min Increment: <strong>+{formatCurrency(auction.minimumBidIncrement || 1)}</strong></span>
              </div>
            </div>

            {/* Current Leader Spotlight */}
            <div className={`leader-spotlight-box ${isHighestBidder ? 'leader-is-you' : ''}`}>
              <div className="leader-icon-wrap">
                {auction.status === 'ended' ? (
                  <Trophy className="w-5 h-5 text-amber-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div className="leader-info">
                <span className="leader-subtext">
                  {auction.status === 'ended'
                    ? 'Winning Champion'
                    : isHighestBidder
                    ? '🌟 YOU ARE CURRENTLY WINNING!'
                    : 'Current High Bidder'}
                </span>
                <span className="leader-name font-bold">
                  {auction.highestBidder
                    ? `${auction.highestBidder.firstName} ${auction.highestBidder.lastName}`
                    : 'No bids yet — Be the first!'}
                </span>
              </div>
            </div>

            {/* Auction Description & Seller */}
            <div className="room-details-section">
              <h2 className="room-auction-title">{auction.title}</h2>
              <p className="room-auction-desc">{auction.description}</p>

              <div className="room-meta-grid">
                <div className="meta-box">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="meta-label">Seller</div>
                    <div className="meta-value font-medium">
                      {auction.seller?.firstName} {auction.seller?.lastName} {isSeller ? '(You)' : ''}
                    </div>
                  </div>
                </div>
                <div className="meta-box">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="meta-label">Start Time</div>
                    <div className="meta-value font-mono text-xs">{formatDateTime(auction.startTime)}</div>
                  </div>
                </div>
                <div className="meta-box">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="meta-label">End Time</div>
                    <div className="meta-value font-mono text-xs">{formatDateTime(auction.endTime)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Bidding Panel & Live Feed */}
          <div className="room-bidding-panel">
            {/* Live Feed Header */}
            <div className="bids-feed-header">
              <div className="feed-title-wrap">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h3>Live Bidding Stream</h3>
              </div>
              <span className="bids-count-tag font-mono">{bids.length} Bids</span>
            </div>

            {/* Scrollable Live Bids Log */}
            <div className="bids-scroll-feed">
              {bids.length === 0 ? (
                <div className="empty-bids-state">
                  <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="font-medium text-slate-300">No bids recorded yet</p>
                  <p className="text-xs text-slate-500">
                    {auction.status === 'active'
                      ? 'Place your opening bid below to take the lead!'
                      : 'Bids will appear once the auction starts.'}
                  </p>
                </div>
              ) : (
                bids.map((b, idx) => {
                  const isThisBidderYou = user && (
                    (typeof b.bidder === 'object' && b.bidder?._id === user.id) ||
                    b.bidder === user.id
                  );
                  const isTopBid = idx === 0;

                  return (
                    <div
                      key={b._id || idx}
                      className={`bid-feed-item ${isTopBid ? 'top-bid-item' : ''} ${isThisBidderYou ? 'your-bid-item' : ''}`}
                    >
                      <div className="bid-item-left">
                        <div className="bid-avatar">
                          {b.bidder?.firstName?.[0]?.toUpperCase() || 'B'}
                        </div>
                        <div className="bid-user-meta">
                          <span className="bid-user-name">
                            {b.bidder?.firstName || 'Bidder'} {b.bidder?.lastName || ''}
                            {isThisBidderYou && <span className="tag-you-mini">You</span>}
                          </span>
                          <span className="bid-timestamp font-mono text-xs text-slate-400">
                            {formatDateTime(b.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="bid-item-right">
                        <span className="bid-amount font-mono font-bold text-emerald-400">
                          {formatCurrency(b.amount)}
                        </span>
                        {isTopBid && (
                          <span className="tag-leader-pill font-mono">LEAD</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bidsEndRef} />
            </div>

            {/* Bidding Controls Section */}
            <div className="bidding-controls-box">
              {auction.status === 'ended' ? (
                <div className="bidding-ended-box">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">This auction has closed.</p>
                    <p className="text-xs text-slate-400">
                      {auction.highestBidder
                        ? `Won by ${auction.highestBidder.firstName} ${auction.highestBidder.lastName} for ${formatCurrency(auction.currentPrice)}`
                        : 'No bids were placed.'}
                    </p>
                  </div>
                </div>
              ) : auction.status === 'upcoming' ? (
                <div className="bidding-upcoming-box">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">Auction Not Started Yet</p>
                    <p className="text-xs text-slate-400">
                      Bidding unlocks automatically when the countdown reaches zero.
                    </p>
                  </div>
                </div>
              ) : isSeller ? (
                <div className="bidding-disabled-notice">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>You are the seller of this auction and cannot place bids.</span>
                </div>
              ) : isHighestBidder ? (
                <div className="bidding-winning-notice">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>You are currently the highest bidder at {formatCurrency(auction.currentPrice)}!</span>
                </div>
              ) : (
                <div className="bidding-action-wrapper">
                  {/* Quick Preset Bid Increments */}
                  <div className="quick-increments-row">
                    <button
                      className="btn-quick-bid"
                      onClick={() => handlePlaceBid(nextMinimumBid)}
                      disabled={submitting}
                    >
                      Min: {formatCurrency(nextMinimumBid)}
                    </button>
                    <button
                      className="btn-quick-bid"
                      onClick={() => handlePlaceBid(nextMinimumBid + 50)}
                      disabled={submitting}
                    >
                      +{formatCurrency(50)}
                    </button>
                    <button
                      className="btn-quick-bid"
                      onClick={() => handlePlaceBid(nextMinimumBid + 100)}
                      disabled={submitting}
                    >
                      +{formatCurrency(100)}
                    </button>
                  </div>

                  {/* Custom Bid Input & Place CTA */}
                  <div className="custom-bid-form">
                    <div className="input-currency-wrapper">
                      <span className="currency-prefix">$</span>
                      <input
                        type="number"
                        min={nextMinimumBid}
                        step="1"
                        placeholder={`Min ${nextMinimumBid}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="custom-bid-input font-mono"
                        disabled={submitting}
                      />
                    </div>

                    <button
                      className="btn-submit-bid"
                      onClick={() => handlePlaceBid()}
                      disabled={submitting || (!bidAmount && false)}
                    >
                      {submitting ? (
                        <span className="spinner-dots">Placing...</span>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Place Bid</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="min-bid-hint">
                    Minimum next acceptable bid is{' '}
                    <strong className="text-emerald-400">{formatCurrency(nextMinimumBid)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
