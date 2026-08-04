import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import Logo from '../components/Logo';
import CategoryIcon from '../components/CategoryIcon';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const HERO_BG = 'https://images.unsplash.com/photo-1744870132190-5c02d3f8d9f9?w=1600&q=80&auto=format&fit=crop';

const CATEGORIES = [
  { key: 'رامن', icon: 'ramen', tKey: 'catRamen' },
  { key: 'رقائق', icon: 'chips', tKey: 'catChips' },
  { key: 'حلوى', icon: 'candy', tKey: 'catCandy' },
  { key: 'مشروبات', icon: 'drinks', tKey: 'catDrinks' },
  { key: 'بسكويت', icon: 'biscuits', tKey: 'catBiscuits' },
];

const FEATURES = [
  { icon: '✦', number: '01', t1: 'feat2Title', t2: 'feat2Desc' },
  { icon: '↗', number: '02', t1: 'feat3Title', t2: 'feat3Desc' },
  { icon: '◇', number: '03', t1: 'feat4Title', t2: 'feat4Desc' },
];

export default function Home() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const mostBought = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
  const catCount = (key) => products.filter(p => p.category === key).length;

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{
        backgroundImage: `linear-gradient(125deg, rgba(83,46,55,0.93) 0%, rgba(142,72,94,0.89) 48%, rgba(190,151,76,0.78) 100%), url(${HERO_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: isMobile ? '32px 20px 38px' : '40px 20px 46px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
            <Logo size={isMobile ? 270 : 330} natural />
          </div>
          <h1 style={{ color: 'white', fontSize: isMobile ? 28 : 38, fontWeight: 900, margin: '0 0 18px', lineHeight: 1.25 }}>
            {t('heroTitle')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 1.75, marginBottom: 40, maxWidth: 560, marginInline: 'auto' }}>
            {t('heroSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/store')}
              style={{ padding: '14px 38px', borderRadius: 14, background: 'var(--brand-ivory)', color: 'var(--brand-dark)', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 8px 28px rgba(31,20,18,0.22)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
            >
              {t('heroShopNow')} ←
            </button>
            <button
              onClick={() => navigate('/store')}
              style={{ padding: '14px 38px', borderRadius: 14, background: 'transparent', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 16, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.6)', transition: 'background 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            >
              {t('heroBrowse')}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, justifyContent: 'center', marginTop: 38, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 26 }}>
            {[
              { num: `${products.length}+`, label: t('heroStatProducts') },
              { num: '5', label: t('heroStatCategories') },
              { num: '100%', label: t('heroStatAuthentic') },
              { num: '⚡', label: t('heroStatDelivery') },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1 }}>{stat.num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section className="home-services">
        <div className="home-services__grid">
          {FEATURES.map(f => (
            <article key={f.t1} className="home-service-card">
              <div className="home-service-card__topline">
                <span className="home-service-card__icon" aria-hidden="true">{f.icon}</span>
                <span className="home-service-card__number">{f.number}</span>
              </div>
              <h2 className="home-service-card__title">{t(f.t1)}</h2>
              <p className="home-service-card__description">{t(f.t2)}</p>
              <span className="home-service-card__rule" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
            🔥 {t('mostBoughtSubtitle')}
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 30, color: 'var(--text)', margin: 0 }}>
            {t('mostBoughtTitle')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
          {mostBought.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={() => navigate('/store')}
            style={{ padding: '13px 44px', borderRadius: 12, background: 'var(--brand)', color: 'white', border: 'none', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
          >
            {t('viewAllProducts')} →
          </button>
        </div>
      </div>

      {/* ── Categories ── */}
      <div style={{ background: 'var(--muted-bg)', padding: '64px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: 900, fontSize: 28, color: 'var(--text)', marginTop: 0, marginBottom: 40 }}>
            {t('categoriesTitle')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.key}
                to={`/category/${encodeURIComponent(cat.key)}`}
                style={{ background: 'var(--card)', border: '2px solid var(--card-border)', borderRadius: 20, padding: '28px 12px', textAlign: 'center', fontFamily: 'Cairo, sans-serif', textDecoration: 'none', display: 'block' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,138,166,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="category-icon-frame"><CategoryIcon type={cat.icon} size={46} /></div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{t(cat.tKey)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{catCount(cat.key)} {t('catItems')}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
