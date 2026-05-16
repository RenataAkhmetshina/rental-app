'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useWS } from '../../context/WSContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected, onlineUsers } = useWS();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Rental System</span>
        </Link>

        <div className={styles.links}>
          <Link href="/properties" className={styles.link}>Browse</Link>
          {user && <Link href="/dashboard" className={styles.link}>Dashboard</Link>}
          {user && <Link href="/leases" className={styles.link}>Leases</Link>}
        </div>

        <div className={styles.actions}>
          {connected && (
            <span className={styles.online} title={`${onlineUsers.length} online`}>
              <span className={styles.dot} />
              {onlineUsers.length} online
            </span>
          )}

          {user ? (
            <div className={styles.userMenu}>
              <button
                className={styles.avatarBtn}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className={`avatar avatar--sm`} />
                ) : (
                  <span className={`avatar avatar--sm ${styles.avatarFallback}`}>{initials}</span>
                )}
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownName}>{user.name}</div>
                    <div className={styles.dropdownEmail}>{user.email}</div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    My Profile
                  </Link>
                  <Link href="/properties/new" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    List a Property
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                    onClick={() => { logout(); setMenuOpen(false); }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn--ghost btn--sm" style={{ color: '#ccddff', borderColor: '#aaaacc' }}>Sign In</Link>
              <Link href="/auth/register" className="btn btn--primary btn--sm">Get Started</Link>
            </>
          )}

          <button className={styles.hamburger} onClick={() => setMenuOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
