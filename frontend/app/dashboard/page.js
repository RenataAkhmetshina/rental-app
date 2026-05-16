'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { propertiesApi, leasesApi } from '../../lib/api';
import { useWS } from '../../context/WSContext';
import PropertyCard from '../../components/property/PropertyCard';
import OnlineUsers from '../../components/realtime/OnlineUsers';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('properties');
  const [myProperties, setMyProperties] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [leasesData, allProps] = await Promise.all([
          leasesApi.list({ role: 'tenant' }),
          propertiesApi.list({ limit: 100 }),
        ]);
        const myProps = allProps.properties.filter(
          (p) => p.owner?._id === user._id || p.owner === user._id
        );
        setMyProperties(myProps);
        setLeases(leasesData.leases);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (authLoading || loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.header}>
              <div>
                <p className="page-header__eyebrow">My Dashboard</p>
                <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
              </div>
              <Link href="/properties/new" className="btn btn--primary">
                + List Property
              </Link>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryNum}>{myProperties.length}</div>
                <div className={styles.summaryLabel}>My Listings</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryNum}>{myProperties.filter((p) => p.isAvailable).length}</div>
                <div className={styles.summaryLabel}>Available</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryNum}>{leases.length}</div>
                <div className={styles.summaryLabel}>My Leases</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryNum}>{leases.filter((l) => l.status === 'active').length}</div>
                <div className={styles.summaryLabel}>Active Leases</div>
              </div>
            </div>

            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
                My Listings ({myProperties.length})
              </button>
              <button className={`tab-btn ${activeTab === 'leases' ? 'active' : ''}`} onClick={() => setActiveTab('leases')}>
                My Leases ({leases.length})
              </button>
            </div>

            {activeTab === 'properties' && (
              myProperties.length === 0 ? (
                <div className="empty-state">
                  <h3>No listings yet</h3>
                  <p>Start earning by listing your property</p>
                  <Link href="/properties/new" className="btn btn--primary" style={{ marginTop: 16 }}>List a Property</Link>
                </div>
              ) : (
                <div className="property-grid">
                  {myProperties.map((p) => (
                    <PropertyCard key={p._id} property={p} onUpdate={() => {}} />
                  ))}
                </div>
              )
            )}

            {activeTab === 'leases' && (
              leases.length === 0 ? (
                <div className="empty-state">
                  <h3>No leases yet</h3>
                  <p>Browse properties and request a lease</p>
                  <Link href="/properties" className="btn btn--primary" style={{ marginTop: 16 }}>Browse Properties</Link>
                </div>
              ) : (
                <div className={styles.leaseList}>
                  {leases.map((l) => (
                    <Link key={l._id} href={`/leases/${l._id}`} className={styles.leaseCard}>
                      <div className={styles.leaseProp}>
                        <strong>{l.property?.title || 'Property'}</strong>
                        <span>{l.property?.city}</span>
                      </div>
                      <div className={styles.leaseDates}>
                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                      </div>
                      <div className={styles.leaseFooter}>
                        <span className={`badge badge--${l.status}`}>{l.status}</span>
                        <strong>${l.totalPrice?.toLocaleString()}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>

          <div className={styles.sidebar}>
            <OnlineUsers />
            <div className={styles.profileCard}>
              <div className={`avatar avatar--lg`} style={{ margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong>{user?.name}</strong>
                <div style={{ fontSize: '0.82rem', color: '#999999', marginTop: 4 }}>{user?.email}</div>
              </div>
              <Link href="/profile" className="btn btn--secondary btn--full btn--sm" style={{ marginTop: 14 }}>
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
