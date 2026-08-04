import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import CategoryIcon from '../components/CategoryIcon';

const CAT_META = {
  'رامن':    { icon: 'ramen', en: 'Ramen',    he: 'ראמן',       gradient: 'linear-gradient(135deg,var(--brand) 0%,var(--brand-dark) 100%)' },
  'رقائق':   { icon: 'chips', en: 'Chips',    he: 'צ׳יפס',      gradient: 'linear-gradient(135deg,#b8944f 0%,#80642f 100%)' },
  'حلوى':    { icon: 'candy', en: 'Candy',    he: 'ממתקים',     gradient: 'linear-gradient(135deg,#b8647d 0%,#754153 100%)' },
  'مشروبات': { icon: 'drinks', en: 'Drinks',   he: 'משקאות',     gradient: 'linear-gradient(135deg,#8d6f65 0%,#4d3b36 100%)' },
  'بسكويت':  { icon: 'biscuits', en: 'Biscuits', he: 'ביסקוויטים', gradient: 'linear-gradient(135deg,#c2a060 0%,#74582c 100%)' },
};

const SORT_OPTIONS_AR = [
  { value: 'featured', label: 'المميزة أولاً' },
  { value: 'price-asc', label: 'السعر: الأقل' },
  { value: 'price-desc', label: 'السعر: الأعلى' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'name', label: 'الاسم أبجدياً' },
];
const SORT_OPTIONS_EN = [
  { value: 'featured', label: 'Featured First' },
  { value: 'price-asc', label: 'Price: Low' },
  { value: 'price-desc', label: 'Price: High' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name A–Z' },
];
const SORT_OPTIONS_HE = [
  { value: 'featured', label: 'מומלצים תחילה' },
  { value: 'price-asc', label: 'מחיר: מהנמוך' },
  { value: 'price-desc', label: 'מחיר: מהגבוה' },
  { value: 'rating', label: 'הדירוג הגבוה' },
  { value: 'name', label: 'שם א׳–ת׳' },
];

export default function Category() {
  const { category } = useParams();
  const decoded = decodeURIComponent(category);
  const { products } = useProducts();
  const { tr } = useLanguage();

  const [sort, setSort] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const meta = CAT_META[decoded] || { icon: 'all', en: decoded, he: decoded, gradient: 'linear-gradient(135deg,var(--brand),var(--brand-blue))' };
  const sortOptions = tr(SORT_OPTIONS_AR, SORT_OPTIONS_EN, SORT_OPTIONS_HE);

  const sorted = useMemo(() => {
    let result = products.filter(p => p.category === decoded);
    if (onlyInStock) result = result.filter(p => p.inStock);
    switch (sort) {
      case 'price-asc':  result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'rating':     result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'name':       result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ar')); break;
      default:           result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return result;
  }, [products, decoded, sort, onlyInStock]);

  const allCount = products.filter(p => p.category === decoded).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--subtext)', textDecoration: 'none', fontWeight: 600 }}>
          {tr('الرئيسية', 'Home', 'בית')}
        </Link>
        <span>›</span>
        <Link to="/store" style={{ color: 'var(--subtext)', textDecoration: 'none', fontWeight: 600 }}>
          {tr('المتجر', 'Store', 'החנות')}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{decoded}</span>
      </nav>

      {/* Category Hero */}
      <div style={{
        background: meta.gradient,
        borderRadius: 20, padding: '32px 40px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 6 }}>
            {tr('🐰 منتجات كورية أصيلة', '🐰 Authentic Korean Products', '🐰 מוצרים קוריאניים אותנטיים')}
          </div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
            {tr(decoded, meta.en, meta.he)}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', fontSize: 15 }}>
            {allCount} {tr('منتج', 'products', 'מוצרים')}
          </p>
        </div>
        <div className="category-hero-icon"><CategoryIcon type={meta.icon} size={78} /></div>
        <div style={{ position: 'absolute', top: -20, left: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 160, height: 160, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ color: 'var(--subtext)', fontSize: 14, fontWeight: 600 }}>
          <span style={{ color: 'var(--text)', fontWeight: 800 }}>{sorted.length}</span> {tr('منتج', 'products', 'מוצרים')}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* In-stock toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setOnlyInStock(!onlyInStock)}
              style={{ width: 42, height: 24, borderRadius: 12, cursor: 'pointer', background: onlyInStock ? 'var(--brand)' : 'var(--border)', position: 'relative', flexShrink: 0 }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'right 0.2s', right: onlyInStock ? 3 : 21, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              {tr('المتاح فقط', 'In Stock Only', 'במלאי בלבד')}
            </span>
          </label>
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid var(--border)', fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'var(--card)', color: 'var(--text)', outline: 'none' }}
          >
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Other categories quick links */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {Object.entries(CAT_META).filter(([cat]) => cat !== decoded).map(([cat, m]) => (
          <Link key={cat} to={`/category/${encodeURIComponent(cat)}`} style={{
            textDecoration: 'none', padding: '6px 14px', borderRadius: 20,
            border: '2px solid var(--border)', background: 'var(--card)', color: 'var(--subtext)',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13,
          }}>
            {m.emoji} {tr(cat, m.en, m.he)}
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--subtext)' }}>
          <div className="category-empty-icon"><CategoryIcon type={meta.icon} size={54} /></div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--text)' }}>
            {tr('لا توجد منتجات متاحة', 'No products available', 'אין מוצרים זמינים')}
          </div>
          <Link to="/store" style={{ display: 'inline-block', marginTop: 16, padding: '12px 28px', background: 'var(--brand)', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>
            {tr('تصفح المتجر', 'Browse Store', 'עיון בחנות')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
          {sorted.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
