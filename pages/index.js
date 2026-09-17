import Head from 'next/head';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { FOUNDING_CAP, EARLY_BIRD_CAP } from '../lib/pricing';

export async function getServerSideProps() {
  const { data: claims } = await supabaseAdmin
    .from('claims')
    .select('name, tier, logo_url, created_at')
    .order('created_at', { ascending: true });

  return { props: { claims: claims || [] } };
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function WallGrid({ items }) {
  return (
    <div className="wall-grid">
      {items.slice().reverse().map((c, i) => {
        const rank = items.length - i;
        return (
          <div key={i} className={`wall-card ${c.tier === 'founding' ? 'founding' : ''}`}>
            <span className="wall-rank mono">#{rank}</span>
            {c.logo_url ? (
              <img className="wall-logo" src={c.logo_url} alt="" />
            ) : (
              <div className="wall-logo">{initials(c.name)}</div>
            )}
            <span className="wall-name">{c.name}</span>
            <span className="wall-tag">{c.tier === 'founding' ? 'Founding' : 'Standard'}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Home({ claims }) {
  const founding = claims.filter((c) => c.tier === 'founding');
  const standard = claims.filter((c) => c.tier === 'standard');
  // claims already comes back ordered by created_at ascending (first come,
  // first published), used here for the ticker and totals.
  const ordered = claims;
  const remaining = Math.max(FOUNDING_CAP - founding.length, 0);
  const earlyBirdRemaining = Math.max(EARLY_BIRD_CAP - founding.length, 0);
  const recentForTicker = ordered.slice(-15).reverse();

  return (
    <>
      <Head>
        <title>Scroll Your Business</title>
      </Head>

      <div style={{ width: '100%', overflow: 'hidden', background: 'var(--panel)', borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
        <div style={{ display: 'flex', width: 'max-content', whiteSpace: 'nowrap' }}>
          {recentForTicker.length === 0 ? (
            <div style={{ padding: '0 28px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: 'var(--ink-dim)' }}>
              Be the first business on the scroll
            </div>
          ) : (
            recentForTicker.map((c, i) => (
              <div key={i} style={{ padding: '0 28px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: 'var(--ink-dim)', borderRight: '1px solid var(--line)' }}>
                <b style={{ color: 'var(--ink)' }}>{c.name}</b> claimed a {c.tier} spot
              </div>
            ))
          )}
        </div>
      </div>

      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 24px 0' }}>
        <div className="wordmark">Scroll Your <span>Business</span></div>
        <div className="header-nav"><a href="/claim">Get your spot on the scroll</a></div>
      </header>

      <div style={{ maxWidth: 1100, margin: '22px auto 0', padding: '0 24px 22px', display: 'flex', gap: 32, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Founding spots left</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--gold)' }}>{remaining.toLocaleString()}</div>
          {earlyBirdRemaining > 0 && remaining > 0 && (
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--teal)', marginTop: 5 }}>{earlyBirdRemaining.toLocaleString()} left at $50</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Standard spots claimed</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--teal)' }}>{standard.length.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Total on the scroll</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{ordered.length.toLocaleString()}</div>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        {ordered.length === 0 ? (
          <div style={{ padding: '90px 20px', textAlign: 'center', color: 'var(--ink-dim)', fontSize: 15 }}>
            No one has claimed a spot yet. Be the first.
          </div>
        ) : (
          <>
            {founding.length > 0 && (
              <>
                <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '30px 0 4px' }}>
                  Founding ({founding.length.toLocaleString()})
                </div>
                <WallGrid items={founding} />
              </>
            )}
            {standard.length > 0 && (
              <>
                <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '40px 0 4px' }}>
                  Standard ({standard.length.toLocaleString()})
                </div>
                <WallGrid items={standard} />
              </>
            )}
          </>
        )}
      </main>

      <footer style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 50px', borderTop: '1px solid var(--line)', color: 'var(--ink-dim)', fontSize: 13, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>Live — updates on every page load.</span>
        <span>scrollyourbusiness.com</span>
      </footer>
    </>
  );
}
