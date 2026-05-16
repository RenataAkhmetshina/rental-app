'use client';
import { useState } from 'react';
import { reviewsApi } from '../../lib/api';

export default function ReviewForm({ propertyId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(0);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return setError('Please select a rating');
    if (comment.length < 10) return setError('Comment must be at least 10 characters');

    setLoading(true);
    setError('');
    try {
      const data = await reviewsApi.create({ propertyId, rating, comment });
      onSuccess(data.review);
      setRating(0);
      setComment('');
      setOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn--secondary" style={{ marginBottom: 24 }} onClick={() => setOpen(true)}>
        Write a Review
      </button>
    );
  }

  return (
    <div style={{ background: '#f5f5f5', borderRadius: '2px', padding: 24, marginBottom: 32 }}>
      <h4 style={{ marginBottom: 16 }}>Write a Review</h4>
      {error && <div className="alert alert--error">{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Rating</div>
        <span style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4,5].map((n) => (
            <span
              key={n}
              style={{
                fontSize: '2rem', cursor: 'pointer',
                color: '#cc8800',
                opacity: n <= (hovered || rating) ? 1 : 0.25,
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
            >★</span>
          ))}
        </span>
      </div>

      <div className="form-group">
        <label className="form-label">Comment</label>
        <textarea
          className="form-textarea"
          placeholder="Share your experience…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn--primary btn--sm" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Posting…' : 'Post Review'}
        </button>
      </div>
    </div>
  );
}
