const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

// Auth
export const authApi = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => apiFetch('/auth/me'),
};

// Properties
export const propertiesApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/properties${q ? '?' + q : ''}`);
  },
  get: (id) => apiFetch(`/properties/${id}`),
  create: (body) => apiFetch('/properties', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/properties/${id}`, { method: 'DELETE' }),
  toggleSave: (id) => apiFetch(`/properties/${id}/save`, { method: 'POST' }),
};

// Leases
export const leasesApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/leases${q ? '?' + q : ''}`);
  },
  get: (id) => apiFetch(`/leases/${id}`),
  create: (body) => apiFetch('/leases', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id, status) =>
    apiFetch(`/leases/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  cancel: (id) => apiFetch(`/leases/${id}`, { method: 'DELETE' }),
};

// Reviews
export const reviewsApi = {
  forProperty: (propertyId) => apiFetch(`/reviews/property/${propertyId}`),
  create: (body) => apiFetch('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/reviews/${id}`, { method: 'DELETE' }),
};

// Users
export const usersApi = {
  get: (id) => apiFetch(`/users/${id}`),
  updateProfile: (body) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => apiFetch('/users/password', { method: 'PUT', body: JSON.stringify(body) }),
  savedProperties: () => apiFetch('/users/saved'),
};
