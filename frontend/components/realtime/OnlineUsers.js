'use client';
import { useWS } from '../../context/WSContext';
import styles from './OnlineUsers.module.css';

export default function OnlineUsers() {
  const { onlineUsers, connected } = useWS();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4>Online Now</h4>
        <span className={`${styles.dot} ${connected ? styles.connected : ''}`} />
      </div>
      {onlineUsers.length === 0 ? (
        <p className={styles.empty}>No one else online</p>
      ) : (
        <div className={styles.list}>
          {onlineUsers.map((u) => (
            <div key={u.id} className={styles.user}>
              <div className={styles.avatar}>
                {u.avatar
                  ? <img src={u.avatar} alt={u.name} className={styles.avatarImg} />
                  : u.name?.[0]?.toUpperCase()}
              </div>
              <span className={styles.name}>{u.name}</span>
              <span className={styles.activeDot} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
