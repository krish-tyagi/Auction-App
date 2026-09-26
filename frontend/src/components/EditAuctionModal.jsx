import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { X, Edit3, DollarSign, Calendar, Clock, AlertCircle } from 'lucide-react';

export const EditAuctionModal = ({ auction, onClose, onUpdated }) => {
  const { addToast } = useToast();

  const toInputDate = (d) => {
    if (!d) return '';
    return new Date(d).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: auction.title || '',
    description: auction.description || '',
    startingPrice: String(auction.startingPrice || 100),
    minimumBidIncrement: String(auction.minimumBidIncrement || 10),
    startTime: toInputDate(auction.startTime),
    endTime: toInputDate(auction.endTime),
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setErrorMsg('Please provide a title and description.');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    if (end <= new Date()) {
      setErrorMsg('End time must be in the future.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.auctions.update(auction._id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startingPrice: Number(formData.startingPrice),
        minimumBidIncrement: Number(formData.minimumBidIncrement),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      addToast({
        title: 'Auction Updated',
        message: 'Your upcoming auction changes have been saved.',
        type: 'success',
      });

      if (onUpdated) {
        onUpdated(res.auction);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update auction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="form-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="form-modal-title-wrap">
            <div className="form-icon-circle bg-amber-500/20 text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="form-modal-title">Edit Upcoming Auction</h2>
              <p className="form-modal-subtitle">Modify parameters before the auction starts</p>
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
          <div className="form-group">
            <label className="form-label">Item Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Starting Price ($)</label>
              <div className="input-with-icon">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="startingPrice"
                  min="0"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Min Bid Increment ($)</label>
              <div className="input-with-icon">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="minimumBidIncrement"
                  min="1"
                  value={formData.minimumBidIncrement}
                  onChange={handleChange}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>
          </div>

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
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
