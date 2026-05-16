'use client';
import { useState } from 'react';
import { leasesApi } from '../../lib/api';

export default function LeaseModal({ property, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateMonths = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    if (end.getDate() < start.getDate()) months--;
    
    return Math.max(1, months);
  };

  const totalMonths = calculateMonths();
  const totalPrice = totalMonths > 0 ? totalMonths * property.pricePerMonth : 0;

  const handleSubmit = async () => {
    if (!startDate || !endDate) return setError('Please select start and end dates');
    if (new Date(endDate) <= new Date(startDate)) return setError('End date must be after start date');

    setLoading(true);
    setError('');
    try {
      await leasesApi.create({ propertyId: property._id, startDate, endDate, notes });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <div>
            <h3>Request to Rent</h3>
            <p style={{ fontSize: '0.88rem', color: '#999999', marginTop: 4 }}>{property.title}</p>
          </div>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-input"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Any message for the owner…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {totalPrice > 0 && (
          <div style={{ background: '#f5f5f5', borderRadius: '2px', padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#999999', marginBottom: 6 }}>
              <span>${property.pricePerMonth}/mo × {totalMonths} {totalMonths === 1 ? 'month' : 'months'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0066cc', fontSize: '1.1rem' }}>
              <span>Total</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--secondary btn--full" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary btn--full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}