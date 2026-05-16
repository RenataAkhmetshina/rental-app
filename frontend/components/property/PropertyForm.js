'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { propertiesApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ImageUploader from './ImageUploader';
import styles from './PropertyForm.module.css';

const TYPES = ['apartment', 'house', 'room'];
const AMENITIES = ['WiFi', 'Parking', 'Gym', 'Pool', 'Air Conditioning', 'Heating', 'Washer', 'Dryer', 'Balcony', 'Garden', 'Elevator', 'Security', 'Furnished', 'Pet Friendly'];

export default function PropertyForm({ propertyId }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!propertyId;

  const [form, setForm] = useState({
    title: '', description: '', address: '', city: '',
    pricePerMonth: '', rooms: '', area: '', type: 'apartment',
    isAvailable: true, amenities: [], images: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (isEdit) {
      propertiesApi.get(propertyId)
        .then((data) => {
          const p = data.property;
          setForm({
            title: p.title, description: p.description,
            address: p.address, city: p.city,
            pricePerMonth: p.pricePerMonth, rooms: p.rooms, area: p.area,
            type: p.type, isAvailable: p.isAvailable,
            amenities: p.amenities || [], images: p.images || [],
          });
        })
        .catch((e) => setError(e.message))
        .finally(() => setFetchLoading(false));
    }
  }, [isEdit, propertyId]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        pricePerMonth: Number(form.pricePerMonth),
        rooms: Number(form.rooms),
        area: Number(form.area),
      };
      if (isEdit) {
        await propertiesApi.update(propertyId, payload);
        router.push(`/properties/${propertyId}`);
      } else {
        const data = await propertiesApi.create(payload);
        router.push(`/properties/${data.property._id}`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className="container--narrow">
        <div className={styles.header}>
          <p className="page-header__eyebrow">{isEdit ? 'Edit Listing' : 'New Listing'}</p>
          <h1>{isEdit ? 'Update your property' : 'List your property'}</h1>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3>Basic Information</h3>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Cosy 2BR apartment in city centre" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe your property…" rows={5} required />
            </div>
            <div className={styles.grid2}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Almaty" required />
              </div>
              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select className="form-select" value={form.type} onChange={(e) => set('type', e.target.value)} required>
                  {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" required />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <h3>Pricing & Details</h3>
            <div className={styles.grid3}>
              <div className="form-group">
                <label className="form-label">Price / Month ($) *</label>
                <input className="form-input" type="number" min="1" value={form.pricePerMonth} onChange={(e) => set('pricePerMonth', e.target.value)} placeholder="850" required />
              </div>
              <div className="form-group">
                <label className="form-label">Rooms *</label>
                <input className="form-input" type="number" min="1" max="20" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} placeholder="2" required />
              </div>
              <div className="form-group">
                <label className="form-label">Area (m²) *</label>
                <input className="form-input" type="number" min="10" value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="60" required />
              </div>
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Availability</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => set('isAvailable', e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Property is available for rent</span>
                </label>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <h3>Amenities</h3>
            <div className={styles.amenityGrid}>
              {AMENITIES.map((a) => (
                <label key={a} className={`${styles.amenityCheck} ${form.amenities.includes(a) ? styles.amenityChecked : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    style={{ display: 'none' }}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <h3>Photos</h3>
            <ImageUploader images={form.images} onChange={(imgs) => set('images', imgs)} />
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn--secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Update Listing' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
