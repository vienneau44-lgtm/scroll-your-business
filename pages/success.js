import Head from 'next/head';

export default function Success() {
  return (
    <>
      <Head><title>You're on the scroll — Scroll Your Business</title></Head>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div className="wordmark" style={{ marginBottom: 24 }}>Scroll Your <span>Business</span></div>
        <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 14 }}>You're on the scroll.</h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 15.5, lineHeight: 1.6, marginBottom: 30 }}>
          Payment confirmed. It can take a few seconds to show up — refresh the scroll if you don't see it right away.
        </p>
        <a href="/" className="btn btn-gold" style={{ display: 'inline-block', textDecoration: 'none' }}>View the scroll</a>
      </div>
    </>
  );
}
