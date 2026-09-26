import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { X, PlusCircle, Sparkles, DollarSign, Calendar, Clock, AlertCircle } from 'lucide-react';

export const CreateAuctionModal = ({ onClose, onCreated }) => {
  const { isAuthenticated, openLogin } = useAuth();
  const { addToast } = useToast();

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '100',
    minimumBidIncrement: '10',
    startTime: defaultStart,
    endTime: defaultEnd,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const applyPreset = (type) => {
    const current = new Date();
    if (type === 'now_1h') {
      // starts right now, ends in 1 hour
      setFormData((prev) => ({
        ...prev,
        startTime: current.toISOString().slice(0, 16),
        endTime: new Date(current.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
      }));
    } else if (type === 'now_24h') {
      setFormData((prev) => ({
        ...prev,
        startTime: current.toISOString().slice(0, 16),
        endTime: new Date(current.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      }));
    } else if (type === 'upcoming_10m') {
      setFormData((prev) => ({
        ...prev,
        startTime: new Date(current.getTime() + 10 * 60 * 1000).toISOString().slice(0, 16),
        endTime: new Date(current.getTime() + 70 * 60 * 1000).toISOString().slice(0, 16),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setErrorMsg('Please fill in both title and description.');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMsg('Please specify valid start and end dates.');
      return;
    }

    if (end <= start) {
      setErrorMsg('End time must be after the start time.');
      return;
    }

    if (end <= new Date()) {
      setErrorMsg('Auction end time cannot be in the past.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.auctions.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        startingPrice: Number(formData.startingPrice),
        minimumBidIncrement: Number(formData.minimumBidIncrement),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      addToast({
        title: 'Auction Listed!',
        message: `"${res.auction?.title || formData.title}" was published successfully.`,
        type: 'success',
      });

      if (onCreated) {
        onCreated(res.auction);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create auction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="form-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="form-modal-title-wrap">
            <div className="form-icon-circle">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="form-modal-title">Create New Auction</h2>
              <p className="form-modal-subtitle">List an item for live real-time bidding</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Item / Auction Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Vintage 1978 Rolex Submariner Watch"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Provide condition, provenance, authenticity details, specifications..."
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              required
            />
          </div>

          {/* Pricing Row */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Starting Price ($)</label>
              <div className="input-with-icon">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="startingPrice"
                  min="0"
                  step="1"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Min. Bid Increment ($)</label>
              <div className="input-with-icon">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="minimumBidIncrement"
                  min="1"
                  step="1"
                  value={formData.minimumBidIncrement}
                  onChange={handleChange}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Time Presets */}
          <div className="presets-box">
            <span className="presets-label">⚡ Quick Schedule Presets:</span>
            <div className="presets-buttons">
              <button
                type="button"
                className="preset-btn"
                onClick={() => applyPreset('now_1h')}
              >
                Go Live Now (1 Hour)
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => applyPreset('now_24h')}
              >
                Go Live Now (24 Hours)
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => applyPreset('upcoming_10m')}
              >
                Starts in 10 mins
              </button>
            </div>
          </div>

          {/* Schedule Row */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <div className="input-with-icon">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <div className="input-with-icon">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit-primary"
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : 'Launch Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
