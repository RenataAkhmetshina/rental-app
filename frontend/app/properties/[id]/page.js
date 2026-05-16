'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi, reviewsApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useWS } from '../../../context/WSContext';
import LeaseModal from '../../../components/property/LeaseModal';
import ReviewForm from '../../../components/property/ReviewForm';
import ReviewList from '../../../components/property/ReviewList';
import styles from './property.module.css';

function Stars({ rating, interactive, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="stars" style={{ fontSize: interactive ? '1.6rem' : '1rem', cursor: interactive ? 'pointer' : 'default' }}>
      {[1,2,3,4,5].map((n) => (
        <span
          key={n}
          style={{ opacity: n <= (hovered || Math.round(rating)) ? 1 : 0.25 }}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(n)}
        >*</span>
      ))}
    </span>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const { on, send } = useWS();

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaseOpen, setLeaseOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const fetchProperty = async () => {
    try {
      const data = await propertiesApi.get(id);
      setProperty(data.property);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewsApi.forProperty(id);
      setReviews(data.reviews);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchProperty(), fetchReviews()]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const off = on('PROPERTY_UPDATED', ({ propertyId, isAvailable }) => {
      if (propertyId === id) setProperty((p) => p ? { ...p, isAvailable } : p);
    });
    return off;
  }, [on, id]);

  useEffect(() => {
    const off = on('REVIEW_ADDED', ({ propertyId }) => {
      if (propertyId === id) fetchReviews();
    });
    return off;
  }, [on, id]);

  const handleDelete = async () => {
    if (!confirm('Delete this property?')) return;
    setDeleting(true);
    try {
      await propertiesApi.delete(id);
      router.push('/dashboard');
    } catch (e) {
      alert(e.message);
      setDeleting(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const updated = await propertiesApi.update(id, { isAvailable: !property.isAvailable });
      setProperty(updated.property);
      send({ type: 'PROPERTY_UPDATE', propertyId: id, isAvailable: !property.isAvailable });
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="container" style={{ padding: '60px 24px' }}><div className="alert alert--error">{error}</div></div>;
  if (!property) return null;

  const isOwner = user && property.owner?._id === user._id;
  const images = property.images?.length > 0 ? property.images : [];

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/properties">Properties</Link>
          <span>›</span>
          <span>{property.city}</span>
          <span>›</span>
          <span>{property.title}</span>
        </div>

        <div className={styles.layout}>
          {/* Left: Images + Details */}
          <div className={styles.main}>
            {/* Image gallery */}
            <div className={styles.gallery}>
              {images.length > 0 ? (
                <>
                  <div className={styles.mainImg}>
                    <img src={images[activeImg]} alt={property.title} />
                  </div>
                  {images.length > 1 && (
                    <div className={styles.thumbs}>
                      {images.map((img, i) => (
                        <button
                          key={i}
                          className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                          onClick={() => setActiveImg(i)}
                        >
                          <img src={img} alt={`View ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noImg}>[No image]</div>
              )}
            </div>

            {/* Details */}
            <div className={styles.details}>
              <div className={styles.detailsHeader}>
                <div className={styles.badges}>
                  <span className={`badge ${property.isAvailable ? 'badge--available' : 'badge--unavailable'}`}>
                    {property.isAvailable ? 'Available' : 'Rented'}
                  </span>
                  <span className="badge badge--type">{property.type}</span>
                </div>
                {isOwner && (
                  <div className={styles.ownerActions}>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={handleToggleAvailability}
                    >
                      Mark {property.isAvailable ? 'Rented' : 'Available'}
                    </button>
                    <Link href={`/properties/${id}/edit`} className="btn btn--secondary btn--sm">Edit</Link>
                    <button className="btn btn--danger btn--sm" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              <h1 className={styles.title}>{property.title}</h1>
              <p className={styles.address}>{property.address}, {property.city}</p>

              {property.averageRating > 0 && (
                <div className={styles.rating}>
                  <Stars rating={property.averageRating} />
                  <span>{property.averageRating} ({property.reviewCount} reviews)</span>
                </div>
              )}

              <div className={styles.specs}>
                <div className={styles.spec}><strong>Rooms:</strong> {property.rooms}</div>
                <div className={styles.spec}><strong>Area:</strong> {property.area} m2</div>
                <div className={styles.spec}><strong>Type:</strong> {property.type}</div>
              </div>

              <div className={styles.description}>
                <h3>About this property</h3>
                <p>{property.description}</p>
              </div>

              {property.amenities?.length > 0 && (
                <div className={styles.amenities}>
                  <h3>Amenities</h3>
                  <div className={styles.amenityList}>
                    {property.amenities.map((a) => (
                      <span key={a} className={styles.amenity}>✓ {a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className={styles.reviewSection}>
              <h2>Reviews</h2>
              {user && !isOwner && (
                <ReviewForm
                  propertyId={id}
                  onSuccess={(review) => {
                    setReviews((r) => [review, ...r]);
                    send({ type: 'NEW_REVIEW', propertyId: id, review });
                  }}
                />
              )}
              <ReviewList
                reviews={reviews}
                currentUserId={user?._id}
                onDelete={(reviewId) => setReviews((r) => r.filter((x) => x._id !== reviewId))}
              />
            </div>
          </div>

          {/* Right: Booking sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sideCard}>
              <div className={styles.price}>
                <span className={styles.priceVal}>${property.pricePerMonth.toLocaleString()}</span>
                <span className={styles.priceSub}>/ month</span>
              </div>

              <div className={styles.ownerBox}>
                <div className={`avatar avatar--md`} style={{ background: '#eeeeee', color: '#0066cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
                  {property.owner?.avatar
                    ? <img src={property.owner.avatar} alt={property.owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : property.owner?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className={styles.ownerName}>{property.owner?.name}</div>
                  <div className={styles.ownerLabel}>Property Owner</div>
                </div>
              </div>

              {user && !isOwner && property.isAvailable && (
                <button className="btn btn--primary btn--full btn--lg" onClick={() => setLeaseOpen(true)}>
                  Request to Rent
                </button>
              )}

              {!user && (
                <Link href="/auth/login" className="btn btn--primary btn--full btn--lg">
                  Sign In to Rent
                </Link>
              )}

              {!property.isAvailable && (
                <div className="alert alert--info" style={{ marginBottom: 0 }}>
                  This property is currently rented
                </div>
              )}

              {isOwner && (
                <Link href={`/properties/${id}/edit`} className="btn btn--secondary btn--full">
                  Edit Listing
                </Link>
              )}

              <div className={styles.sideDetails}>
                <div className={styles.sideRow}><span>City</span><strong>{property.city}</strong></div>
                <div className={styles.sideRow}><span>Rooms</span><strong>{property.rooms}</strong></div>
                <div className={styles.sideRow}><span>Area</span><strong>{property.area} m²</strong></div>
                <div className={styles.sideRow}><span>Type</span><strong style={{ textTransform: 'capitalize' }}>{property.type}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {leaseOpen && (
        <LeaseModal
          property={property}
          onClose={() => setLeaseOpen(false)}
          onSuccess={() => { setLeaseOpen(false); fetchProperty(); }}
        />
      )}
    </div>
  );
}
