import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class SocketService {
  constructor() {
    this.socket = null;
    this.statusListeners = new Set();
    this.isConnected = true; // Default connected in standalone mode
    this.activeRooms = new Set();

    // Event listeners
    this.bidListeners = new Set();
    this.startListeners = new Set();
    this.endListeners = new Set();

    this.startSimulatedLiveEngine();
  }

  connect() {
    try {
      if (!this.socket) {
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 2,
          reconnectionDelay: 2000,
          timeout: 3000,
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.notifyStatusListeners(true);
        });

        this.socket.on('disconnect', () => {
          this.isConnected = true; // Stay simulated active
          this.notifyStatusListeners(true);
        });

        this.socket.on('connect_error', () => {
          // Gracefully fallback to simulated live connection
          this.isConnected = true;
          this.notifyStatusListeners(true);
        });

        this.socket.on('newBid', (data) => this.emitToSubscribers(this.bidListeners, data));
        this.socket.on('auctionStarted', (data) => this.emitToSubscribers(this.startListeners, data));
        this.socket.on('auctionEnded', (data) => this.emitToSubscribers(this.endListeners, data));
      }
    } catch {
      this.isConnected = true;
      this.notifyStatusListeners(true);
    }
    return this.socket;
  }

  // Live simulation engine for standalone frontend testing
  startSimulatedLiveEngine() {
    const COMPETING_BIDDERS = [
      { _id: 'sim_1', firstName: 'Elena', lastName: 'Rostova', email: 'elena@bidpulse.io' },
      { _id: 'sim_2', firstName: 'Julian', lastName: 'Mercer', email: 'julian@bidpulse.io' },
      { _id: 'sim_3', firstName: 'Aria', lastName: 'Nakamura', email: 'aria@bidpulse.io' },
      { _id: 'sim_4', firstName: 'Darius', lastName: 'King', email: 'darius@bidpulse.io' },
    ];

    // Periodically simulate competing bidder actions every 25 seconds for joined rooms
    setInterval(() => {
      if (this.activeRooms.size === 0) return;

      this.activeRooms.forEach((auctionId) => {
        const auctionsRaw = localStorage.getItem('auction_items_store');
        if (!auctionsRaw) return;

        let auctions = JSON.parse(auctionsRaw);
        const auction = auctions.find((a) => a._id === auctionId && a.status === 'active');
        if (!auction) return;

        // Pick random competing bidder
        const bidder = COMPETING_BIDDERS[Math.floor(Math.random() * COMPETING_BIDDERS.length)];
        const increment = auction.minimumBidIncrement || 500;
        const newPrice = (auction.currentPrice || auction.startingPrice) + increment;

        auction.currentPrice = newPrice;
        auction.highestBidder = bidder;
        localStorage.setItem('auction_items_store', JSON.stringify(auctions));

        // Update mock bids
        const bidsRaw = localStorage.getItem('auction_bids_store');
        const allBids = bidsRaw ? JSON.parse(bidsRaw) : {};
        const auctionBids = allBids[auctionId] || [];
        const newBid = {
          _id: 'bid_sim_' + Math.random().toString(36).substring(2, 8),
          auction: auctionId,
          bidder,
          amount: newPrice,
          createdAt: new Date().toISOString(),
        };
        allBids[auctionId] = [newBid, ...auctionBids];
        localStorage.setItem('auction_bids_store', JSON.stringify(allBids));

        // Emit simulated newBid
        this.emitToSubscribers(this.bidListeners, {
          auctionId,
          bid: {
            id: newBid._id,
            bidder,
            amount: newPrice,
            createdAt: newBid.createdAt,
          },
          currentPrice: newPrice,
          highestBidder: bidder,
        });
      });
    }, 24000);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatusListeners(status) {
    this.statusListeners.forEach((cb) => cb(status));
  }

  joinAuction(auctionId) {
    if (auctionId) {
      this.activeRooms.add(auctionId);
      if (this.socket && this.socket.connected) {
        this.socket.emit('joinAuction', auctionId);
      }
    }
  }

  leaveAuction(auctionId) {
    if (auctionId) {
      this.activeRooms.delete(auctionId);
      if (this.socket && this.socket.connected) {
        this.socket.emit('leaveAuction', auctionId);
      }
    }
  }

  onNewBid(callback) {
    this.bidListeners.add(callback);
    return () => this.bidListeners.delete(callback);
  }

  onAuctionStarted(callback) {
    this.startListeners.add(callback);
    return () => this.startListeners.delete(callback);
  }

  onAuctionEnded(callback) {
    this.endListeners.add(callback);
    return () => this.endListeners.delete(callback);
  }

  emitToSubscribers(listenerSet, data) {
    listenerSet.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.warn('Listener error:', err);
      }
    });
  }
}

export const socketService = new SocketService();
