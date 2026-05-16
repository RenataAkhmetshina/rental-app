'use client';
import { useState, useEffect, useCallback } from 'react';
import { propertiesApi } from '../../lib/api';
import { useWS } from '../../context/WSContext';
import PropertyCard from '../../components/property/PropertyCard';
import styles from './properties.module.css';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'room', label: 'Room' },
];

export default function PropertiesClient() {
  const { on } = useWS();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '', city: '', type: '', minPrice: '', maxPrice: '', rooms: '', isAvailable: 'true',
  });
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.city) params.city = filters.city;
      if (filters.type) params.type = filters.type;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.rooms) params.rooms = filters.rooms;
      if (filters.isAvailable) params.isAvailable = filters.isAvailable;

      const data = await propertiesApi.list(params);
      setProperties(data.properties);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters.city, filters.type, filters.minPrice, filters.maxPrice, filters.rooms, filters.isAvailable]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  useEffect(() => {
    const offUpdate = on('PROPERTY_UPDATED', (data) => {
      if (!data || !data.property) return;
      const { property } = data;
      setProperties((prev) =>
        prev.map((p) => (p._id === property._id ? property : p))
      );
    });

    const offNew = on('NEW_PROPERTY', ({ property }) => {
      setProperties((prev) => [property, ...prev]);
      setTotal((t) => t + 1);
    });

    const offDelete = on('PROPERTY_DELETED', ({ propertyId }) => {
      setProperties((prev) => {
        const exists = prev.some(p => p._id === propertyId);
        if (exists) {
          setTotal((t) => t - 1); 
        }
        return prev.filter((p) => p._id !== propertyId);
      });
    });

    return () => {
      offUpdate();
      offNew();
      offDelete(); 
    };
  }, [on]);

  const handleFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', city: '', type: '', minPrice: '', maxPrice: '', rooms: '', isAvailable: '' });
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <p className="page-header__eyebrow">Rental Listings</p>
            <h1>Find Your Home</h1>
            {!loading && <p className={styles.count}>{total} properties found</p>}
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filterBar}>
          <input
            className="form-input"
            placeholder="Search by title, city, or description…"
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
          />
          <input
            className="form-input"
            placeholder="City"
            value={filters.city}
            onChange={(e) => handleFilter('city', e.target.value)}
          />
          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => handleFilter('type', e.target.value)}
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            className="form-input"
            type="number"
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(e) => handleFilter('minPrice', e.target.value)}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(e) => handleFilter('maxPrice', e.target.value)}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Rooms"
            min={1}
            value={filters.rooms}
            onChange={(e) => handleFilter('rooms', e.target.value)}
          />
          <select
            className="form-select"
            value={filters.isAvailable}
            onChange={(e) => handleFilter('isAvailable', e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Rented</option>
          </select>
          {hasFilters && (
            <button className="btn btn--ghost btn--sm" onClick={clearFilters}>Clear</button>
          )}
        </div>

        {/* Results */}
        {error && <div className="alert alert--error">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            
            <h3>No properties found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="property-grid">
              {properties.map((p) => (
                <PropertyCard key={p._id} property={p} onUpdate={fetchProperties} />
              ))}
            </div>

            {pages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >←</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                ))}
                <button
                  className="page-btn"
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                >→</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
