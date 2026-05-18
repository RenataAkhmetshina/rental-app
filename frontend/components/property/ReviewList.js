'use client';
import { useState, useEffect } from 'react';
import { reviewsApi } from '../../lib/api';
import { useWS } from '../../context/WSContext';
import { useUploadThing } from '../../lib/uploadthingClient';
import styles from './ReviewList.module.css';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
}

export default function ReviewList({ reviews: initialReviews, currentUserId, onDelete }) {
  const { on } = useWS();
  const [localReviews, setLocalReviews] = useState(initialReviews);
  const [deleting, setDeleting] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState([]);
  const [editPhotoFiles, setEditPhotoFiles] = useState([]);
  const [updating, setUpdating] = useState(false);

  const { startUpload } = useUploadThing('propertyImages', {
    headers: () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      return token ? { 'x-ut-token': `Bearer ${token}` } : {};
    },
  });

  useEffect(() => {
    setLocalReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    if (!on) return;

    const unsubscribeDelete = on('REVIEW_DELETED', (data) => {
      setLocalReviews((prev) => prev.filter((r) => r._id !== data.reviewId));
      if (onDelete) onDelete(data.reviewId);
    });

    const unsubscribeUpdate = on('REVIEW_UPDATED', (data) => {
      setLocalReviews((prev) =>
        prev.map((r) => (r._id === data.review._id ? data.review : r))
      );
    });

    return () => {
      unsubscribeDelete();
      unsubscribeUpdate();
    };
  }, [on, onDelete]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    setDeleting(id);
    try {
      await reviewsApi.delete(id);
      setLocalReviews((prev) => prev.filter((r) => r._id !== id));
      if (onDelete) onDelete(id);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const startEditing = (review) => {
    setEditingId(review._id);
    setEditComment(review.comment);
    setEditRating(review.rating);
    setEditPhotoPreviews(review.photos || []);
    setEditPhotoFiles([]);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditComment('');
    setEditRating(5);
    setEditPhotoPreviews([]);
    setEditPhotoFiles([]);
  };

  const handleUpdate = async (id) => {
    if (!editComment.trim()) return alert('Comment cannot be empty');
    setUpdating(true);
    try {
      let photoUrls = editPhotoPreviews.filter((p) => !p.startsWith('blob:'));

      if (editPhotoFiles.length > 0) {
        const uploaded = await startUpload(editPhotoFiles);
        if (uploaded) photoUrls = [...photoUrls, ...uploaded.map((f) => f.url)];
      }

      const response = await reviewsApi.update(id, {
        comment: editComment,
        rating: editRating,
        photos: photoUrls,
      });

      setLocalReviews((prev) =>
        prev.map((r) => (r._id === id ? response.review : r))
      );
      cancelEditing();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  if (localReviews.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 0' }}>
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {localReviews.map((r) => {
        const isEditing = editingId === r._id;

        return (
          <div key={r._id} className={styles.review}>
            <div className={styles.reviewHeader}>
              <div className={styles.authorRow}>
                <div
                  className={`avatar avatar--sm ${styles.avatar}`}
                  style={{ background: '#e8eef8', color: '#0066cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  {r.author?.avatar ? (
                    <img src={r.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    r.author?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <div className={styles.authorName}>{r.author?.name}</div>
                  <div className={styles.date}>{timeAgo(r.createdAt)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!isEditing ? (
                  <span className="stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} style={{ opacity: n <= r.rating ? 1 : 0.25 }}>★</span>
                    ))}
                  </span>
                ) : (
                  <span className="stars" style={{ cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        style={{ opacity: n <= editRating ? 1 : 0.25 }}
                        onClick={() => setEditRating(n)}
                      >★</span>
                    ))}
                  </span>
                )}

                {currentUserId && r.author?._id === currentUserId && !isEditing && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => startEditing(r)}
                      style={{ color: '#0066cc', padding: '4px 8px' }}
                    >✏️</button>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleDelete(r._id)}
                      disabled={deleting === r._id}
                      style={{ color: '#dc3545', padding: '4px 8px' }}
                    >{deleting === r._id ? '…' : '🗑'}</button>
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  className={styles.textarea}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  rows={3}
                />

                {editPhotoPreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {editPhotoPreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={src}
                          alt=""
                          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <button
                          onClick={() => setEditPhotoPreviews((prev) => prev.filter((_, j) => j !== i))}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#dc3545', color: '#fff',
                            border: 'none', borderRadius: '50%',
                            width: 18, height: 18, cursor: 'pointer',
                            fontSize: 11, lineHeight: '18px', textAlign: 'center',
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ fontSize: '0.85rem' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setEditPhotoFiles(files);
                    setEditPhotoPreviews((prev) => [
                      ...prev,
                      ...files.map((f) => URL.createObjectURL(f)),
                    ]);
                  }}
                />

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={cancelEditing}
                    disabled={updating}
                  >Cancel</button>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleUpdate(r._id)}
                    disabled={updating}
                    style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px' }}
                  >{updating ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            ) : (
              <p className={styles.comment}>{r.comment}</p>
            )}

            {!isEditing && r.photos?.length > 0 && (
              <div className={styles.photos}>
                {r.photos.map((p, i) => (
                  <img key={i} src={p} alt={`Review photo ${i + 1}`} className={styles.photo} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}