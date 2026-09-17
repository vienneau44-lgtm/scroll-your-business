import Head from 'next/head';
import { useState } from 'react';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { supabase } from '../lib/supabaseClient';
import { FOUNDING_CAP, EARLY_BIRD_CAP, foundingPriceForCount } from '../lib/pricing';

export async function getServerSideProps() {
  const { count } = await supabaseAdmin
    .from('claims')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'founding');

  return { props: { foundingCount: count || 0 } };
}

export default function Claim({ foundingCount }) {
  const [tier, setTier] = useState(foundingCount >= FOUNDING_CAP ? 'standard' : 'founding');
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const remaining = Math.max(FOUNDING_CAP - foundingCount, 0);
  const earlyBirdRemaining = Math.max(EARLY_BIRD_CAP - foundingCount, 0);
  const price = tier === 'founding' ? foundingPriceForCount(foundingCount) : 10;
  const foundingSoldOut = remaining <= 0;

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setError('');
    if (!name.trim()) {
      setError('Enter a business name first.');
      return;
    }
    setSubmitting(true);

    try {
      let logoUrl = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(path, logoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(path);
        logoUrl = publicUrlData.publicUrl;
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), tier, logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      window.location.href = data.url; // redirect to Stripe Checkout
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head><title>Get your spot — Scroll Your Business</title></Head>

      <header style={{ maxWidth: 720, margin: '0 auto', padding: '26px 24px 0' }}>
        <div className="wordmark">Scroll Your <span>Business</span></div>
        <div className="header-nav"><a href="/">Back to the scroll</a></div>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 0' }}>
        <h1 style={{ fontSize: 34, margin: '0 0 12px', fontWeight: 700 }}>Get your spot on the scroll.</h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 16, lineHeight: 1.6, maxWidth: 520 }}>
          Pick a tier, add your business, and it joins the scroll permanently after payment.
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--gold)', marginBottom: 8 }}>Step 1</div>
        <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 700 }}>Choose your tier</h2>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14.5, marginBottom: 22 }}>
          {foundingSoldOut
            ? 'Founding tier is sold out. Standard is open, no limit.'
            : earlyBirdRemaining > 0
              ? `${earlyBirdRemaining.toLocaleString()} of the first 100 spots left at $50. ${remaining.toLocaleString()} of 1,000 founding spots remain overall.`
              : `${remaining.toLocaleString()} of 1,000 founding spots remain, at $100.`}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ border: '1px solid var(--line)', padding: 14, cursor: foundingSoldOut ? 'not-allowed' : 'pointer', opacity: foundingSoldOut ? 0.4 : 1, background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span><input type="radio" name="tier" checked={tier === 'founding'} disabled={foundingSoldOut} onChange={() => setTier('founding')} /> Founding</span>
            <span className="mono" style={{ color: 'var(--gold)', fontSize: 16 }}>${foundingPriceForCount(foundingCount)}</span>
          </label>
          <label style={{ border: '1px solid var(--line)', padding: 14, cursor: 'pointer', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span><input type="radio" name="tier" checked={tier === 'standard'} onChange={() => setTier('standard')} /> Standard</span>
            <span className="mono" style={{ color: 'var(--gold)', fontSize: 16 }}>$10</span>
          </label>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--gold)', marginBottom: 8 }}>Step 2</div>
        <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 700 }}>Your business</h2>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14.5, marginBottom: 22 }}>This is exactly how your name will appear on the scroll.</p>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Business name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="e.g. LaBoard"
          style={{ width: '100%', background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, padding: 12, borderRadius: 2 }}
        />
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--gold)', marginBottom: 8 }}>Step 3</div>
        <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 700 }}>Your logo</h2>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14.5, marginBottom: 22 }}>Optional. If you skip this, your initials are shown instead.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, border: '1px solid var(--line)', background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 11, color: 'var(--ink-dim)' }}>
            {logoPreview ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Logo'}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handleFile} />
            <p style={{ fontSize: 12.5, color: 'var(--ink-dim)', margin: '6px 0 0' }}>PNG or JPG.</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--gold)', marginBottom: 8 }}>Step 4</div>
        <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 700 }}>Review &amp; pay</h2>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14.5, marginBottom: 22 }}>You'll be taken to Stripe to complete payment. Your spot is added to the scroll as soon as it's confirmed.</p>
        <div style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px', marginBottom: 20, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}><span style={{ color: 'var(--ink-dim)' }}>Business</span><span className="mono">{name.trim() || '—'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}><span style={{ color: 'var(--ink-dim)' }}>Tier</span><span className="mono">{tier === 'founding' ? 'Founding' : 'Standard'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span style={{ color: 'var(--ink-dim)' }}>Price</span><span className="mono" style={{ color: 'var(--gold)' }}>${price}</span></div>
        </div>
        <button className="btn btn-gold" style={{ width: '100%' }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Redirecting to payment…' : 'Continue to payment'}
        </button>
        {error && <div style={{ marginTop: 14, fontSize: 13.5, color: 'var(--red)' }}>{error}</div>}
      </div>

      <footer style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 50px', borderTop: '1px solid var(--line)', color: 'var(--ink-dim)', fontSize: 13, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>Scroll Your Business</span>
        <span>scrollyourbusiness.com</span>
      </footer>
    </>
  );
}
