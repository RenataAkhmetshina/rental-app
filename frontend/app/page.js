import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <h1>Find a Place to Rent</h1>
          <p className={styles.subtext}>
            Browse apartments, houses, and rooms.
          </p>
          <div className={styles.heroActions}>
            <Link href="/properties" className="btn btn--primary btn--lg">
              Browse Properties
            </Link>
            <Link href="/auth/register" className="btn btn--secondary btn--lg">
              List Your Property
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.howSection}>
        <div className="container">
          <h2>How it works</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1.</div>
              <h3>Search and Filter</h3>
              <p>Browse listings by city, type, price range, and number of rooms.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2.</div>
              <h3>Request a Lease</h3>
              <p>Find a place you like and send a lease request directly to the owner.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3.</div>
              <h3>Move In</h3>
              <p>Owner approves your request. Sign digitally and move into your new home.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container">
          <h2>Ready to find the perfect rental?</h2>
          <div className={styles.ctaActions}>
            <Link href="/properties" className="btn btn--primary btn--lg">Start Browsing</Link>
            <Link href="/auth/register" className="btn btn--secondary btn--lg">Create Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
