'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { propertiesApi } from '../../lib/api';
import styles from './PropertyCard.module.css';

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ opacity: n <= Math.round(rating) ? 1 : 0.25 }}>*</span>
      ))}
    </span>
  );
}

export default function PropertyCard({ property, onUpdate }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const isSaved = user && property.savedBy?.includes(user._id);
  const isOwner = user && property.owner?._id === user._id;

  const img = property.images?.[0] || null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await propertiesApi.toggleSave(property._id);
      if (onUpdate) onUpdate();
    } catch {}
    setSaving(false);
  };

  return (
    <Link href={`/properties/${property._id}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {img ? (
          <img src={img} alt={property.title} className={styles.img} />
        ) : (
          <div className={styles.imgPlaceholder}>[No image]</div>
        )}
        <div className={styles.overlay}>
          <span className={`badge ${property.isAvailable ? 'badge--available' : 'badge--unavailable'}`}>
            {property.isAvailable ? 'Available' : 'Rented'}
          </span>
          <span className={`badge badge--type`}>{property.type}</span>
        </div>
        {user && !isOwner && (
          <button
            className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
            onClick={handleSave}
            disabled={saving}
            title={isSaved ? 'Unsave' : 'Save'}
          >
            {isSaved ? '♥' : '♡'}
          </button>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.city}>{property.city}</span>
          {property.averageRating > 0 && (
            <span className={styles.ratingRow}>
              <Stars rating={property.averageRating} />
              <span className={styles.ratingVal}>{property.averageRating}</span>
              <span className={styles.ratingCount}>({property.reviewCount})</span>
            </span>
          )}
        </div>

        <h3 className={styles.title}>{property.title}</h3>

        <div className={styles.specs}>
          <span>{property.rooms} room(s)</span>
          <span>{property.area} m2</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.price}>
            <span className={styles.priceVal}>${property.pricePerMonth.toLocaleString()}</span>
            <span className={styles.priceSub}>/mo</span>
          </div>
          {property.owner && (
            <div className={styles.owner}>
              <div className={`avatar avatar--sm ${styles.ownerAvatar}`}>
                {property.owner.avatar
                  ? <img src={property.owner.avatar} alt={property.owner.name} className={styles.ownerImg} />
                  : property.owner.name?.[0]?.toUpperCase()}
              </div>
              <span className={styles.ownerName}>{property.owner.name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
