import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  X, 
  History, 
  Layers, 
  Flame, 
  Clock, 
  Trophy, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusBadge } from '../utils/formatters';

export const MyActivityDrawer = ({
  isOpen,
  onClose,
  initialTab = 'myBids',
  auctions,
  onSelectAuction,
  onOpenEdit,
  onDeleteAuction,
}) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [myBids, setMyBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const fetchMyBids = useCallback(async () => {
    if (!user) return;
    setLoadingBids(true);
    try {
      const res = await api.bids.getMyBids();
      if (res && res.bids) {
        setMyBids(res.bids);
      }
    } catch (err) {
      console.error('Error fetching my bids:', err);
    } finally {
      setLoadingBids(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && tab === 'myBids') {
      fetchMyBids();
    }
  }, [isOpen, tab, fetchMyBids]);

  if (!isOpen) return null;

  const myCreatedAuctions = auctions.filter((a) => {
    if (!user) return false;
    const sellerId = typeof a.seller === 'object' ? a.seller?._id : a.seller;
    return sellerId === user.id;
  });

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="activity-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <h2 className="drawer-title">My Activity Center</h2>
            <p className="drawer-subtitle">Manage your bids and listed inventory</p>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="drawer-tabs-row">
          <button
            className={`drawer-tab-btn ${tab === 'myBids' ? 'active' : ''}`}
            onClick={() => setTab('myBids')}
          >
            <History className="w-4 h-4" />
            <span>My Bids ({myBids.length})</span>
          </button>
          <button
            className={`drawer-tab-btn ${tab === 'myAuctions' ? 'active' : ''}`}
            onClick={() => setTab('myAuctions')}
          >
            <Layers className="w-4 h-4" />
            <span>My Auctions ({myCreatedAuctions.length})</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {tab === 'myBids' ? (
            <div className="drawer-bids-list">
              <div className="drawer-sub-header">
                <span className="text-xs text-slate-400">All bids placed by your account</span>
                <button className="btn-refresh-icon" onClick={fetchMyBids} title="Refresh">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBids ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingBids ? (
                <div className="drawer-loading-state">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                  <span>Loading bidding history...</span>
                </div>
              ) : myBids.length === 0 ? (
                <div className="drawer-empty-state">
                  <History className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">No Bids Placed Yet</p>
                  <p className="text-xs text-slate-500">
                    Join an active live auction to place your first bid!
                  </p>
                </div>
              ) : (
                myBids.map((b) => {
                  const auctionItem = typeof b.auction === 'object' ? b.auction : null;
                  const isLeading = auctionItem && auctionItem.currentPrice === b.amount;

                  return (
                    <div key={b._id} className="drawer-bid-card">
                      <div className="bid-card-header">
                        <h4 className="bid-auction-name">
                          {auctionItem?.title || 'Auction Item'}
                        </h4>
                        <span className={`bid-status-pill ${isLeading ? 'status-winning' : 'status-outbid'}`}>
                          {isLeading ? 'Leading Bid' : 'Outbid / Historic'}
                        </span>
                      </div>

                      <div className="bid-card-meta">
                        <div>
                          <span className="text-xs text-slate-400">Your Bid: </span>
                          <strong className="font-mono text-emerald-400 text-sm">
                            {formatCurrency(b.amount)}
                          </strong>
                        </div>
                        {auctionItem && (
                          <div>
                            <span className="text-xs text-slate-400">Current Price: </span>
                            <span className="font-mono text-slate-300 text-sm">
                              {formatCurrency(auctionItem.currentPrice)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bid-card-footer">
                        <span className="font-mono text-xs text-slate-500">
                          {formatDateTime(b.createdAt)}
                        </span>
                        {auctionItem && (
                          <button
                            className="btn-view-auction-link"
                            onClick={() => {
                              onSelectAuction(auctionItem);
                              onClose();
                            }}
                          >
                            <span>Open Room</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="drawer-auctions-list">
              <div className="drawer-sub-header">
                <span className="text-xs text-slate-400">Auctions created and listed by you</span>
              </div>

              {myCreatedAuctions.length === 0 ? (
                <div className="drawer-empty-state">
                  <Layers className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">No Auctions Listed</p>
                  <p className="text-xs text-slate-500">
                    Click "Create Auction" on the navbar to list your first item.
                  </p>
                </div>
              ) : (
                myCreatedAuctions.map((a) => {
                  const badge = getStatusBadge(a.status, a.startTime, a.endTime);
                  return (
                    <div key={a._id} className="drawer-my-auction-card">
                      <div className="my-auction-top">
                        <div className={`status-pill ${badge.color}`}>
                          <span className={`status-dot ${badge.dotClass}`} />
                          <span>{badge.label}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(a.currentPrice || a.startingPrice)}
                        </span>
                      </div>

                      <h4 className="my-auction-title">{a.title}</h4>
                      <p className="my-auction-desc">{a.description?.slice(0, 80)}...</p>

                      <div className="my-auction-actions">
                        <button
                          className="btn-drawer-open"
                          onClick={() => {
                            onSelectAuction(a);
                            onClose();
                          }}
                        >
                          <span>Open Live Room</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {a.status === 'upcoming' && (
                          <div className="my-auction-edit-group">
                            <button
                              className="btn-icon-action"
                              onClick={() => {
                                onOpenEdit(a);
                                onClose();
                              }}
                              title="Edit Auction"
                            >
                              <Edit3 className="w-4 h-4 text-amber-400" />
                            </button>
                            <button
                              className="btn-icon-action"
                              onClick={() => onDeleteAuction(a._id)}
                              title="Delete Auction"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
