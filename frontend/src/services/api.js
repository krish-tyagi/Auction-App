import { INITIAL_MOCK_AUCTIONS, INITIAL_MOCK_BIDS } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Standalone LocalStorage State Management
const STORAGE_KEYS = {
  TOKEN: 'auction_token',
  USER: 'auction_current_user',
  AUCTIONS: 'auction_items_store',
  BIDS: 'auction_bids_store',
};

function getStoredAuctions() {
  const saved = localStorage.getItem(STORAGE_KEYS.AUCTIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEYS.AUCTIONS, JSON.stringify(INITIAL_MOCK_AUCTIONS));
  return INITIAL_MOCK_AUCTIONS;
}

function saveStoredAuctions(auctions) {
  localStorage.setItem(STORAGE_KEYS.AUCTIONS, JSON.stringify(auctions));
}

function getStoredBids() {
  const saved = localStorage.getItem(STORAGE_KEYS.BIDS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(INITIAL_MOCK_BIDS));
  return INITIAL_MOCK_BIDS;
}

function saveStoredBids(bids) {
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
}

export const api = {
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'Unexpected server response' };
      }

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (networkError) {
      // If network fails (e.g., backend server not running), use seamless standalone fallback
      console.info(`[Frontend Standalone Mode] Serving fallback for ${endpoint}`);
      return this.handleFallback(endpoint, options);
    }
  },

  handleFallback(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

    // 1. Auth Signup
    if (endpoint === '/api/auth/signup' && method === 'POST') {
      const newUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 8),
        firstName: body.firstName || 'User',
        lastName: body.lastName || '',
        email: body.email,
      };
      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      this.setToken(token);
      return { message: 'User created successfully', user: newUser, token };
    }

    // 2. Auth Login
    if (endpoint === '/api/auth/login' && method === 'POST') {
      const email = body.email || 'buyer@bidpulse.io';
      const isSeller = email.includes('seller') || email.includes('collector');
      const mockUser = {
        id: isSeller ? 'user_seller_1' : 'user_buyer_1',
        firstName: isSeller ? 'Eleanor' : 'Alex',
        lastName: isSeller ? 'Vance' : 'Morgan',
        email: email,
      };
      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
      this.setToken(token);
      return { message: 'Login successful', user: mockUser, token };
    }

    // 3. Auth Me
    if (endpoint === '/api/auth/me') {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        return { user: JSON.parse(saved) };
      }
      return {
        user: {
          id: 'user_buyer_1',
          firstName: 'Alex',
          lastName: 'Morgan',
          email: 'alex@bidpulse.io',
        },
      };
    }

    // 4. Get All Auctions
    if (endpoint === '/api/auction' && method === 'GET') {
      const auctions = getStoredAuctions();
      return { count: auctions.length, auctions };
    }

    // 5. Get Auction By ID
    if (endpoint.startsWith('/api/auction/') && method === 'GET') {
      const id = endpoint.split('/api/auction/')[1];
      const auctions = getStoredAuctions();
      const auction = auctions.find((a) => a._id === id);
      if (!auction) throw new Error('Auction not found');
      return { auction };
    }

    // 6. Create Auction
    if (endpoint === '/api/auction' && method === 'POST') {
      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{"id":"user_buyer_1","firstName":"Alex","lastName":"Morgan","email":"alex@bidpulse.io"}');
      const start = new Date(body.startTime);
      const end = new Date(body.endTime);
      const now = new Date();
      let status = 'upcoming';
      if (now >= start && now < end) {
        status = 'active';
      }

      const newAuction = {
        _id: 'auc_' + Math.random().toString(36).substring(2, 9),
        title: body.title,
        description: body.description,
        seller: currentUser,
        startingPrice: Number(body.startingPrice),
        currentPrice: Number(body.startingPrice),
        minimumBidIncrement: Number(body.minimumBidIncrement),
        highestBidder: null,
        startTime: body.startTime,
        endTime: body.endTime,
        status,
        createdAt: new Date().toISOString(),
      };

      const auctions = getStoredAuctions();
      const updated = [newAuction, ...auctions];
      saveStoredAuctions(updated);
      return { message: 'Auction created successfully', auction: newAuction };
    }

    // 7. Update Auction
    if (endpoint.startsWith('/api/auction/') && method === 'PATCH') {
      const id = endpoint.split('/api/auction/')[1];
      const auctions = getStoredAuctions();
      const idx = auctions.findIndex((a) => a._id === id);
      if (idx === -1) throw new Error('Auction not found');

      auctions[idx] = {
        ...auctions[idx],
        ...body,
        startingPrice: body.startingPrice !== undefined ? Number(body.startingPrice) : auctions[idx].startingPrice,
        minimumBidIncrement: body.minimumBidIncrement !== undefined ? Number(body.minimumBidIncrement) : auctions[idx].minimumBidIncrement,
      };
      saveStoredAuctions(auctions);
      return { message: 'Auction updated successfully', auction: auctions[idx] };
    }

    // 8. Delete Auction
    if (endpoint.startsWith('/api/auction/') && method === 'DELETE') {
      const id = endpoint.split('/api/auction/')[1];
      const auctions = getStoredAuctions();
      const updated = auctions.filter((a) => a._id !== id);
      saveStoredAuctions(updated);
      return { message: 'Auction deleted successfully' };
    }

    // 9. Place Bid
    if (endpoint === '/api/bid' && method === 'POST') {
      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{"id":"user_buyer_1","firstName":"Alex","lastName":"Morgan","email":"alex@bidpulse.io"}');
      const auctions = getStoredAuctions();
      const auction = auctions.find((a) => a._id === body.auctionId);
      if (!auction) throw new Error('Auction not found');

      const amount = Number(body.amount);
      auction.currentPrice = amount;
      auction.highestBidder = currentUser;
      saveStoredAuctions(auctions);

      const allBids = getStoredBids();
      const auctionBids = allBids[body.auctionId] || [];
      const newBid = {
        _id: 'bid_' + Math.random().toString(36).substring(2, 9),
        auction: body.auctionId,
        bidder: currentUser,
        amount,
        createdAt: new Date().toISOString(),
      };
      allBids[body.auctionId] = [newBid, ...auctionBids];
      saveStoredBids(allBids);

      return {
        message: 'Bid placed successfully',
        bid: newBid,
        auction: {
          id: auction._id,
          currentPrice: auction.currentPrice,
          highestBidder: currentUser,
        },
      };
    }

    // 10. Get My Bids
    if (endpoint === '/api/bid/mybids') {
      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{"id":"user_buyer_1","firstName":"Alex","lastName":"Morgan","email":"alex@bidpulse.io"}');
      const allBids = getStoredBids();
      const auctions = getStoredAuctions();

      const userBids = [];
      Object.entries(allBids).forEach(([aucId, bidsList]) => {
        const auc = auctions.find((a) => a._id === aucId);
        bidsList.forEach((b) => {
          if (b.bidder?._id === currentUser.id || b.bidder?.id === currentUser.id) {
            userBids.push({
              ...b,
              auction: auc || { title: 'Auction Item', currentPrice: b.amount },
            });
          }
        });
      });

      return { message: 'Your bids fetched successfully', count: userBids.length, bids: userBids };
    }

    // 11. Get Auction Bids
    if (endpoint.startsWith('/api/bid/')) {
      const auctionId = endpoint.split('/api/bid/')[1];
      const allBids = getStoredBids();
      const bids = allBids[auctionId] || [];
      return { message: 'Auction bids fetched', count: bids.length, bids };
    }

    return { message: 'Success' };
  },

  // Auth APIs
  auth: {
    signup(userData) {
      return api.request('/api/auth/signup', {
        method: 'POST',
        body: userData,
      });
    },
    login(credentials) {
      return api.request('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });
    },
    getCurrentUser() {
      return api.request('/api/auth/me', {
        method: 'GET',
      });
    },
  },

  // Auction APIs
  auctions: {
    getAll() {
      return api.request('/api/auction', {
        method: 'GET',
      });
    },
    getById(id) {
      return api.request(`/api/auction/${id}`, {
        method: 'GET',
      });
    },
    create(auctionData) {
      return api.request('/api/auction', {
        method: 'POST',
        body: auctionData,
      });
    },
    update(id, auctionData) {
      return api.request(`/api/auction/${id}`, {
        method: 'PATCH',
        body: auctionData,
      });
    },
    delete(id) {
      return api.request(`/api/auction/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Bid APIs
  bids: {
    placeBid(auctionId, amount) {
      return api.request('/api/bid', {
        method: 'POST',
        body: { auctionId, amount: Number(amount) },
      });
    },
    getMyBids() {
      return api.request('/api/bid/mybids', {
        method: 'GET',
      });
    },
    getAuctionBids(auctionId) {
      return api.request(`/api/bid/${auctionId}`, {
        method: 'GET',
      });
    },
  },
};
