'use client';
import { useState } from 'react';
import { reviewsApi } from '../../lib/api';
import { useUploadThing } from '../../lib/uploadthingClient';

export default function ReviewForm({ propertyId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(0);
  const [open, setOpen] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { startUpload } = useUploadThing('propertyImages', {
    headers: () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      return token ? { 'x-ut-token': `Bearer ${token}` } : {};
    },
    onUploadError: (err) => {
      setUploadError(err.message || 'Upload failed');
      setUploading(false);
    },
  });

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotoFiles(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return setError('Please select a rating');
    if (comment.length < 10) return setError('Comment must be at least 10 characters');

    setLoading(true);
    setError('');
    setUploadError('');

    try {
      let photoUrls = [];

      if (photoFiles.length > 0) {
        setUploading(true);
        const uploaded = await startUpload(photoFiles);
        setUploading(false);

        if (!uploaded || uploadError) throw new Error(uploadError || 'Photo upload failed');

        photoUrls = uploaded.map((f) => f.url);
      }

      const data = await reviewsApi.create({
        propertyId,
        rating,
        comment,
        photos: photoUrls,
      });

      onSuccess(data.review);
      setRating(0);
      setComment('');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setUploading(false);
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
      {(error || uploadError) && (
        <div className="alert alert--error">{error || uploadError}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Rating</div>
        <span style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
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

      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label">Photos (optional)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          style={{ display: 'block', marginBottom: 8 }}
        />
        {photoPreviews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {photoPreviews.map((src, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={src}
                  alt=""
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    background: '#dc3545', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    width: 20, height: 20, cursor: 'pointer',
                    fontSize: 12, lineHeight: '20px', textAlign: 'center',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn--primary btn--sm" onClick={handleSubmit} disabled={loading || uploading}>
          {uploading ? 'Uploading photos…' : loading ? 'Posting…' : 'Post Review'}
        </button>
      </div>
    </div>
  );
}