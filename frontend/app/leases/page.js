'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useWS } from '../../context/WSContext'; 
import { leasesApi } from '../../lib/api';
import styles from './leases.module.css';

const STATUS_COLORS = { pending: 'badge--pending', active: 'badge--active', completed: 'badge--completed', cancelled: 'badge--cancelled' };

function LeaseCard({ lease, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const isOwner = lease.property?.owner?._id === user?._id;
  const isPending = lease.status === 'pending';
  const isActive = lease.status === 'active';

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      await leasesApi.updateStatus(lease._id, status);
      onUpdate();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const cancelLease = async () => {
    if (!confirm('Cancel this lease request?')) return;
    setLoading(true);
    try {
      await leasesApi.cancel(lease._id);
      onUpdate();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className={styles.leaseCard}>
      <div className={styles.leaseHeader}>
        <div>
          <Link href={`/properties/${lease.property?._id}`} className={styles.propTitle}>
            {lease.property?.title || 'Property'}
          </Link>
          <div className={styles.propMeta}>
            {lease.property?.city} · ${lease.property?.pricePerMonth?.toLocaleString()}/mo
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[lease.status] || ''}`}>{lease.status}</span>
      </div>

      <div className={styles.leaseMeta}>
        <div className={styles.metaItem}>
          <span>Tenant</span>
          <strong>{lease.tenant?.name}</strong>
        </div>
        <div className={styles.metaItem}>
          <span>Start</span>
          <strong>{new Date(lease.startDate).toLocaleDateString()}</strong>
        </div>
        <div className={styles.metaItem}>
          <span>End</span>
          <strong>{new Date(lease.endDate).toLocaleDateString()}</strong>
        </div>
        <div className={styles.metaItem}>
          <span>Total</span>
          <strong style={{ color: '#0066cc' }}>${lease.totalPrice?.toLocaleString()}</strong>
        </div>
      </div>

      {lease.notes && (
        <div className={styles.notes}>{lease.notes}</div>
      )}

      <div className={styles.leaseActions}>
        {isOwner && isPending && (
          <>
            <button className="btn btn--primary btn--sm" onClick={() => updateStatus('active')} disabled={loading}>Approve</button>
            <button className="btn btn--danger btn--sm" onClick={() => updateStatus('cancelled')} disabled={loading}>Reject</button>
          </>
        )}
        {isOwner && isActive && (
          <button className="btn btn--secondary btn--sm" onClick={() => updateStatus('completed')} disabled={loading}>Mark Completed</button>
        )}
        {!isOwner && isPending && (
          <button className="btn btn--ghost btn--sm" onClick={cancelLease} disabled={loading} style={{ color: '#0066cc' }}>Cancel Request</button>
        )}
      </div>
    </div>
  );
}

export default function LeasesPage() {
  const { user, loading: authLoading } = useAuth();
  const { on } = useWS(); 
  const router = useRouter();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tenant');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  const fetchLeases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await leasesApi.list({ role: activeTab });
      setLeases(data.leases);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => { fetchLeases(); }, [fetchLeases]);

  useEffect(() => {
    const offNew = on('LEASE_CREATED', ({ lease }) => {
      const isMyLease = 
        lease.tenant._id === user?._id || 
        lease.property?.owner?._id === user?._id;
      
      if (isMyLease) {
        setLeases(prev => [lease, ...prev]);
      }
    });

    const offUpdate = on('LEASE_UPDATED', ({ lease }) => {
      setLeases(prev => prev.map(l => l._id === lease._id ? lease : l));
    });

    const offDelete = on('LEASE_DELETED', ({ leaseId }) => {
      setLeases(prev => prev.filter(l => l._id !== leaseId));
    });

    return () => {
      offNew();
      offUpdate();
      offDelete();
    };
  }, [on, user, activeTab]);

  if (authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  const filtered = (status) => leases.filter((l) => l.status === status);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <p className="page-header__eyebrow">Lease Management</p>
            <h1>My Leases</h1>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'tenant' ? 'active' : ''}`} onClick={() => setActiveTab('tenant')}>As Tenant</button>
          <button className={`tab-btn ${activeTab === 'owner' ? 'active' : ''}`} onClick={() => setActiveTab('owner')}>As Owner</button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : leases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">No leases</div>
            <h3>No leases found</h3>
            <p>{activeTab === 'tenant' ? 'Browse properties to find your next home' : 'Your listing lease requests will appear here'}</p>
            {activeTab === 'tenant' && (
              <Link href="/properties" className="btn btn--primary" style={{ marginTop: 16 }}>Browse Properties</Link>
            )}
          </div>
        ) : (
          <div className={styles.sections}>
            {['pending', 'active', 'completed', 'cancelled'].map((status) => {
              const items = filtered(status);
              if (items.length === 0) return null;
              return (
                <div key={status} className={styles.section}>
                  <h3 className={styles.sectionTitle} style={{ textTransform: 'capitalize' }}>
                    {status} <span className={styles.count}>({items.length})</span>
                  </h3>
                  <div className={styles.list}>
                    {items.map((l) => (
                      <LeaseCard key={l._id} lease={l} onUpdate={fetchLeases} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
