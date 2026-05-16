'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../lib/api';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' });
    }
  }, [user]);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(''); setSuccess('');
    try {
      const data = await usersApi.updateProfile(form);
      updateUser(data.user);
      setSuccess('Profile updated successfully!');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return setPwError('Passwords do not match');
    if (pwForm.newPassword.length < 6) return setPwError('New password must be at least 6 characters');
    setPwSaving(true);
    setPwError(''); setPwSuccess('');
    try {
      await usersApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className="container--narrow">
        <div className={styles.header}>
          <div className={styles.avatarWrap}>
            <div className={`avatar avatar--xl ${styles.avatar}`} style={{ background: '#eeeeee', color: '#0066cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </div>
          </div>
          <div>
            <h1>{user?.name}</h1>
            <p style={{ color: '#999999' }}>{user?.email}</p>
            {user?.phone && <p style={{ color: '#999999', fontSize: '0.88rem', marginTop: 4 }}>{user.phone}</p>}
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
          <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>Password</button>
        </div>

        {activeTab === 'profile' && (
          <div className={styles.card}>
            <h3>Edit Profile</h3>
            {error && <div className="alert alert--error">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}
            <form onSubmit={handleProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} placeholder="+7 777 000 0000" onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input className="form-input" value={form.avatar} placeholder="https://…" onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))} />
                <span className="form-hint">Paste a URL to an image, or use UploadThing to upload.</span>
              </div>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className={styles.card}>
            <h3>Change Password</h3>
            {pwError && <div className="alert alert--error">{pwError}</div>}
            {pwSuccess && <div className="alert alert--success">{pwSuccess}</div>}
            <form onSubmit={handlePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={pwForm.newPassword} placeholder="Min 6 characters" onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn--primary" disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        <div className={styles.danger}>
          <h4>Account Actions</h4>
          <button className="btn btn--danger btn--sm" onClick={() => { logout(); router.push('/'); }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
