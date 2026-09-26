import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AuctionCard } from './components/AuctionCard';
import { LiveAuctionModal } from './components/LiveAuctionModal';
import { CreateAuctionModal } from './components/CreateAuctionModal';
import { EditAuctionModal } from './components/EditAuctionModal';
import { AuthModal } from './components/AuthModal';
import { MyActivityDrawer } from './components/MyActivityDrawer';
import { api } from './services/api';
import { socketService } from './services/socket';
import { Flame, Layers, Search, Sparkles, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

function AuctionAppContent() {
  const { user, isAuthenticated, openLogin } = useAuth();
  const { addToast } = useToast();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and sorting
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'upcoming' | 'ended'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('endingSoon'); // 'endingSoon' | 'priceHigh' | 'priceLow' | 'newest'

  // Modals and Drawers
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [activityDrawerTab, setActivityDrawerTab] = useState('myBids');

  // Fetch initial auctions
  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.auctions.getAll();
      if (data && data.auctions) {
        setAuctions(data.auctions);
      }
    } catch (err) {
      console.error('Fetch auctions error:', err);
      setError(err.message || 'Could not load auctions from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Global Socket Sync: Real-time update for all cards on the landing page!
  useEffect(() => {
    socketService.connect();

    // 1. Listen for global bid updates
    const unsubBid = socketService.onNewBid((data) => {
      setAuctions((prev) =>
        prev.map((a) => {
          if (a._id === data.auctionId) {
            return {
              ...a,
              currentPrice: data.currentPrice,
              highestBidder: data.highestBidder,
            };
          }
          return a;
        })
      );

      // If user is viewing this auction modal, update it too
      setSelectedAuction((prev) => {
        if (prev && prev._id === data.auctionId) {
          return {
            ...prev,
            currentPrice: data.currentPrice,
            highestBidder: data.highestBidder,
          };
        }
        return prev;
      });
    });

    // 2. Listen for global auction started
    const unsubStart = socketService.onAuctionStarted((data) => {
      setAuctions((prev) =>
        prev.map((a) => {
          if (a._id === data.auctionId) {
            return {
              ...a,
              status: 'active',
              currentPrice: data.currentPrice,
              endTime: data.endTime,
            };
          }
          return a;
        })
      );
      addToast({
        title: '🔥 Live Auction Started!',
        message: `${data.title} is now open for bidding!`,
        type: 'info',
      });
    });

    // 3. Listen for global auction ended
    const unsubEnd = socketService.onAuctionEnded((data) => {
      setAuctions((prev) =>
        prev.map((a) => {
          if (a._id === data.auctionId) {
            return {
              ...a,
              status: 'ended',
              currentPrice: data.finalPrice,
              highestBidder: data.winner,
            };
          }
          return a;
        })
      );
    });

    return () => {
      unsubBid();
      unsubStart();
      unsubEnd();
    };
  }, [addToast]);

  // Handle Auction Created Callback
  const handleAuctionCreated = (newAuction) => {
    setAuctions((prev) => [newAuction, ...prev]);
    // Automatically select to open live room
    setSelectedAuction(newAuction);
  };

  // Handle Auction Updated Callback
  const handleAuctionUpdated = (updatedAuction) => {
    setAuctions((prev) =>
      prev.map((a) => (a._id === updatedAuction._id ? updatedAuction : a))
    );
    if (selectedAuction && selectedAuction._id === updatedAuction._id) {
      setSelectedAuction(updatedAuction);
    }
  };

  // Handle Auction Deletion
  const handleDeleteAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return;
    try {
      await api.auctions.delete(auctionId);
      setAuctions((prev) => prev.filter((a) => a._id !== auctionId));
      if (selectedAuction && selectedAuction._id === auctionId) {
        setSelectedAuction(null);
      }
      addToast({
        title: 'Auction Deleted',
        message: 'The auction listing was removed.',
        type: 'info',
      });
    } catch (err) {
      addToast({
        title: 'Could Not Delete',
        message: err.message || 'Deletion failed.',
        type: 'error',
      });
    }
  };

  // Filter and sort items
  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    // Status filter
    if (activeFilter !== 'all') {
      result = result.filter((a) => a.status === activeFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.seller?.firstName?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'endingSoon') {
        const aTime = new Date(a.endTime).getTime();
        const bTime = new Date(b.endTime).getTime();
        return aTime - bTime;
      }
      if (sortBy === 'priceHigh') {
        const aPrice = a.currentPrice || a.startingPrice || 0;
        const bPrice = b.currentPrice || b.startingPrice || 0;
        return bPrice - aPrice;
      }
      if (sortBy === 'priceLow') {
        const aPrice = a.currentPrice || a.startingPrice || 0;
        const bPrice = b.currentPrice || b.startingPrice || 0;
        return aPrice - bPrice;
      }
      if (sortBy === 'newest') {
        const aCreated = new Date(a.createdAt || 0).getTime();
        const bCreated = new Date(b.createdAt || 0).getTime();
        return bCreated - aCreated;
      }
      return 0;
    });

    return result;
  }, [auctions, activeFilter, searchQuery, sortBy]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreate={() => {
          if (!isAuthenticated) {
            openLogin();
          } else {
            setCreateModalOpen(true);
          }
        }}
        onOpenActivity={() => setActivityDrawerOpen(true)}
        activityTab={activityDrawerTab}
        setActivityTab={setActivityDrawerTab}
      />

      {/* Main Page Layout */}
      <main className="main-content">
        {/* Dynamic Hero with Featured Spotlight & Metrics */}
        <HeroBanner
          auctions={auctions}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onSelectAuction={(auction) => setSelectedAuction(auction)}
          onOpenCreate={() => {
            if (!isAuthenticated) {
              openLogin();
            } else {
              setCreateModalOpen(true);
            }
          }}
          isAuthenticated={isAuthenticated}
          onOpenAuth={openLogin}
        />

        {/* Catalog Section Header & Sorting Bar */}
        <section className="catalog-section">
          <div className="catalog-section-header">
            <h2 className="catalog-title">
              {activeFilter === 'all' && 'All Auction Catalog'}
              {activeFilter === 'active' && '⚡ Live Auctions in Progress'}
              {activeFilter === 'upcoming' && '⏳ Upcoming Scheduled Drops'}
              {activeFilter === 'ended' && '🏆 Concluded Auctions & Winners'}
              <span className="catalog-count-badge font-mono">
                {filteredAuctions.length} {filteredAuctions.length === 1 ? 'item' : 'items'}
              </span>
            </h2>

            <div className="flex items-center gap-3">
              <select
                className="catalog-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="endingSoon">Ending Soonest</option>
                <option value="priceHigh">Highest Price</option>
                <option value="priceLow">Lowest Price</option>
                <option value="newest">Recently Listed</option>
              </select>

              <button
                className="btn-refresh-icon"
                onClick={fetchAuctions}
                title="Refresh listings"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && auctions.length === 0 && (
            <div className="empty-catalog-state">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3 mx-auto" />
              <h3 className="text-lg font-bold text-white">Loading Live Marketplace...</h3>
              <p className="text-sm text-slate-400">Connecting to socket cluster and fetching auctions</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="form-error-alert my-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <strong>Error connecting to backend:</strong> {error}
              </div>
              <button className="btn-demo-pill" onClick={fetchAuctions}>
                Retry
              </button>
            </div>
          )}

          {/* Empty Catalog State */}
          {!loading && filteredAuctions.length === 0 && (
            <div className="empty-catalog-state">
              <div className="empty-icon-wrap">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Auctions Found</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                {searchQuery
                  ? `No matching auctions for "${searchQuery}". Try different keywords.`
                  : activeFilter !== 'all'
                  ? `There are no ${activeFilter} auctions right now.`
                  : 'Be the first to list an item on the live marketplace!'}
              </p>
              {isAuthenticated ? (
                <button
                  className="btn-submit-primary"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Sparkles className="w-4 h-4 inline-block mr-1" />
                  Create First Auction
                </button>
              ) : (
                <button className="btn-submit-primary" onClick={openLogin}>
                  Sign In to List Items
                </button>
              )}
            </div>
          )}

          {/* Auction Cards Grid */}
          <div className="auction-grid">
            {filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction._id}
                auction={auction}
                onSelect={(a) => setSelectedAuction(a)}
                currentUserId={user?.id}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Real-Time Live Auction Room Modal */}
      {selectedAuction && (
        <LiveAuctionModal
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onAuctionUpdated={(id, price, highestBidder) => {
            setAuctions((prev) =>
              prev.map((a) =>
                a._id === id ? { ...a, currentPrice: price, highestBidder } : a
              )
            );
          }}
          onOpenEdit={(a) => {
            setSelectedAuction(null);
            setEditingAuction(a);
          }}
          onDeleteAuction={(id) => handleDeleteAuction(id)}
        />
      )}

      {/* Create Auction Modal */}
      {createModalOpen && (
        <CreateAuctionModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleAuctionCreated}
        />
      )}

      {/* Edit Auction Modal */}
      {editingAuction && (
        <EditAuctionModal
          auction={editingAuction}
          onClose={() => setEditingAuction(null)}
          onUpdated={handleAuctionUpdated}
        />
      )}

      {/* Auth Modal (Login / Signup) */}
      <AuthModal />

      {/* My Activity Drawer (My Bids / My Auctions) */}
      <MyActivityDrawer
        isOpen={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        initialTab={activityDrawerTab}
        auctions={auctions}
        onSelectAuction={(a) => setSelectedAuction(a)}
        onOpenEdit={(a) => setEditingAuction(a)}
        onDeleteAuction={(id) => handleDeleteAuction(id)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuctionAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
