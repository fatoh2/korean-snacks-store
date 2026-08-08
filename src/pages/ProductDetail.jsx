import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import { productName } from '../utils/productName';
import { useIsMobile } from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const HEAT_COLORS = ['', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b'];

function ProductSpecs({ title, rows }) {
  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--muted-bg)', padding: '12px 16px', fontWeight: 800, fontSize: 14, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label} style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--muted-bg)' }}>
              <td style={{ padding: '9px 16px', fontWeight: 700, color: 'var(--subtext)', width: '40%', borderBottom: '1px solid var(--border)' }}>{label}</td>
              <td style={{ padding: '9px 16px', color: 'var(--text)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const GALLERY_BG = {
  رامن: [
    { decorEmoji: '', bg: 'linear-gradient(135deg, var(--brand-soft) 0%, #fce7f3 100%)' },
    { decorEmoji: '🥢', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
    { decorEmoji: '🫙', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { decorEmoji: '📦', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
  ],
  رقائق: [
    { decorEmoji: '', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
    { decorEmoji: '🫙', bg: 'linear-gradient(135deg, var(--brand-soft) 0%, #fce7f3 100%)' },
    { decorEmoji: '🧂', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { decorEmoji: '📦', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
  ],
  حلوى: [
    { decorEmoji: '', bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)' },
    { decorEmoji: '🎁', bg: 'linear-gradient(135deg, var(--brand-soft) 0%, #fce7f3 100%)' },
    { decorEmoji: '✨', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
    { decorEmoji: '🎀', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
  ],
  مشروبات: [
    { decorEmoji: '', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
    { decorEmoji: '🧊', bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' },
    { decorEmoji: '🥤', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { decorEmoji: '📦', bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)' },
  ],
  بسكويت: [
    { decorEmoji: '', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
    { decorEmoji: '☕', bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)' },
    { decorEmoji: '🫙', bg: 'linear-gradient(135deg, var(--brand-soft) 0%, #fce7f3 100%)' },
    { decorEmoji: '🎁', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
  ],
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addItem, items, updateQty } = useCart();
  const { t, tr, isRTL, lang } = useLanguage();
  const [qty, setQty] = useState(1);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const isMobile = useIsMobile();

  const product = products.find(p => p.id === Number(id));

  const recentlyViewed = useMemo(() => {
    if (!product) return [];
    try {
      const ids = JSON.parse(localStorage.getItem('hanook-recently-viewed')) || [];
      return ids.filter(rid => rid !== product.id).slice(0, 6).map(rid => products.find(p => p.id === rid)).filter(Boolean);
    } catch { return []; }
  }, [product, products]);

  useEffect(() => {
    if (!product) return;
    try {
      const key = 'hanook-recently-viewed';
      const existing = JSON.parse(localStorage.getItem(key)) || [];
      localStorage.setItem(key, JSON.stringify([product.id, ...existing.filter(id => id !== product.id)].slice(0, 8)));
    } catch { /* localStorage unavailable */ }
  }, [product]);

  if (!product) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 64 }}>😕</div>
        <h2 style={{ fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>{t('productNotFound')}</h2>
        <Link to="/store" style={{ display: 'inline-block', marginTop: 16, padding: '12px 28px', background: 'var(--brand)', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
          {t('backToStoreBtn')}
        </Link>
      </div>
    );
  }

  const galleryBg = GALLERY_BG[product.category] ?? GALLERY_BG['رامن'];
  const productView = galleryBg[0];
  const heatLabels = t('heatLabels');
  const inCart = items.find(i => i.id === product.id);
  const outOfStock = !product.inStock || product.stock === 0;
  const lowStock = product.inStock && product.stock != null && product.stock > 0 && product.stock <= 5;
  const variants = product.variants ?? [];
  const activeVariant = variants.length > 0 ? variants[selectedVariantIdx] : null;
  const displayPrice = activeVariant
    ? +(product.price * activeVariant.multiplier * (1 - (activeVariant.discountPct ?? 0) / 100)).toFixed(2)
    : product.price;

  const handleAddToCart = () => {
    if (inCart) {
      updateQty(product.id, inCart.quantity + qty);
    } else {
      for (let i = 0; i < qty; i++) addItem(product, activeVariant);
    }
    const label = activeVariant ? ` (${activeVariant.label})` : '';
    const msg = tr(
      `تمت إضافة ${qty} إلى السلة! ${product.emoji}${label}`,
      `Added ${qty} to cart! ${product.emoji}${label}`,
      `${qty} נוספו לעגלה! ${product.emoji}${label}`,
    );
    toast.success(msg, {
      style: { fontFamily: 'Cairo, sans-serif', direction: isRTL ? 'rtl' : 'ltr', fontWeight: 600 },
      iconTheme: { primary: 'var(--brand)', secondary: '#fff' },
    });
  };

  const addToCartLabel = tr(
    (qty > 1 ? `🛒 أضف ${qty} قطع للسلة` : '🛒 أضف للسلة'),
    (qty > 1 ? `🛒 Add ${qty} to Cart` : '🛒 Add to Cart'),
    (qty > 1 ? `🛒 הוספת ${qty} לעגלה` : '🛒 הוספה לעגלה'),
  );

  const inCartBadge = tr(
    `✓ ${inCart?.quantity} في السلة`,
    `✓ ${inCart?.quantity} in cart`,
    `✓ ${inCart?.quantity} בעגלה`,
  );

  const heatLevelText = tr(
    `مستوى ${product.heat}/5`,
    `Level ${product.heat}/5`,
    `רמה ${product.heat}/5`,
  );

  const relatedTitle = tr(
    `منتجات مشابهة في فئة ${product.category}`,
    `Similar Products in ${product.category}`,
    `מוצרים דומים בקטגוריה ${product.category}`,
  );

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const specRows = [
    [t('specWeight'), product.weight],
    [t('specServings'), product.servings],
    [t('specOrigin'), product.origin],
    [t('specBrand'), product.brand],
    [t('specCategory'), product.category],
    ...(product.heat > 0 ? [[t('specHeat'), `${product.heat}/5 — ${heatLabels[product.heat]}`]] : []),
    [t('specAvailability'), product.inStock ? t('specAvailable') : t('specOutOfStock')],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 36px' }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9ca3af', marginBottom: 18, flexWrap: 'wrap' }}>
        <Link to="/store" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: 600 }}>{t('storeLink')}</Link>
        <span>›</span>
        <button
          onClick={() => navigate('/store', { state: { category: product.category } })}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          {product.category}
        </button>
        <span>›</span>
        <span style={{ color: '#374151', fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {productName(product, lang)}
        </span>
      </nav>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 32, alignItems: 'start' }}>

        {/* Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ borderRadius: 20, background: productView.bg, height: isMobile ? 340 : 360, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={productName(product, lang)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <>
                <div style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.4)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -40, right: -20, width: 180, height: 180, background: 'rgba(255,255,255,0.3)', borderRadius: '50%' }} />
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 120, lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}>{product.emoji}</div>
                  {productView.decorEmoji && (
                    <div style={{ position: 'absolute', bottom: -20, left: -30, fontSize: 48, opacity: 0.6 }}>{productView.decorEmoji}</div>
                  )}
                </div>
              </>
            )}
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
              {product.isNew && <span style={{ background: 'var(--brand-blue)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>{t('badgeNew')}</span>}
              {product.isFeatured && <span style={{ background: 'var(--brand)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>{t('badgeFeatured')}</span>}
            </div>
          </div>
          {!isMobile && <ProductSpecs title={t('specsTitle')} rows={specRows} />}
        </div>

        {/* Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>{product.category}</span>
            <span style={{ background: '#eff6ff', color: 'var(--brand-blue)', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>{product.brand}</span>
            {outOfStock && <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>{t('outOfStockBadge')}</span>}
            {lowStock && <span style={{ background: '#fff7ed', color: '#f97316', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>🔥 {tr(`بقي ${product.stock} فقط!`, `Only ${product.stock} left!`, `נותרו ${product.stock} בלבד!`)}</span>}
          </div>

          <div>
            <h1 style={{ fontWeight: 800, fontSize: 26, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>{productName(product, lang)}</h1>
            {product.nameKo && <div style={{ fontSize: 15, color: 'var(--subtext)', fontWeight: 600, marginTop: 4 }}>{product.nameKo}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 18, color: s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db' }}>★</span>)}
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{product.rating}</span>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>({product.reviews} {t('reviewsLabel')})</span>
          </div>

          {product.heat > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `${HEAT_COLORS[product.heat]}15`, border: `1px solid ${HEAT_COLORS[product.heat]}40`, borderRadius: 10, padding: '8px 14px', alignSelf: 'flex-start' }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: HEAT_COLORS[product.heat] }}>{heatLabels[product.heat]}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{heatLevelText}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 36, color: 'var(--brand)' }}>{displayPrice.toFixed(2)}</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#6b7280' }}>{t('currency')}</span>
            {activeVariant && activeVariant.discountPct > 0 && (
              <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through', marginInlineStart: 4 }}>
                {(product.price * activeVariant.multiplier).toFixed(2)}
              </span>
            )}
            {inCart && (
              <span style={{ marginInlineStart: 8, fontSize: 13, color: 'var(--brand-blue)', fontWeight: 700, background: '#eff6ff', padding: '3px 10px', borderRadius: 6 }}>
                {inCartBadge}
              </span>
            )}
          </div>

          {/* Variant selector */}
          {variants.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 10 }}>
                {tr('اختر الحجم:', 'Choose size:', 'בחרו גודל:')}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {variants.map((v, i) => {
                  const vPrice = +(product.price * v.multiplier * (1 - (v.discountPct ?? 0) / 100)).toFixed(2);
                  const isActive = selectedVariantIdx === i;
                  return (
                    <button key={v.label} onClick={() => setSelectedVariantIdx(i)} style={{
                      padding: '10px 18px', borderRadius: 12, border: `2px solid ${isActive ? 'var(--brand)' : '#e5e7eb'}`,
                      background: isActive ? 'var(--brand-soft)' : 'var(--card)', cursor: 'pointer', textAlign: 'center',
                      fontFamily: 'Cairo, sans-serif', transition: 'all 0.15s', minWidth: 80,
                    }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: isActive ? 'var(--brand)' : '#1a1a2e' }}>{v.label}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? 'var(--brand)' : '#6b7280', marginTop: 2 }}>{vPrice.toFixed(2)} {t('currency')}</div>
                      {v.discountPct > 0 && (
                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>-{v.discountPct}%</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.8, margin: 0 }}>{product.longDescription}</p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {product.tags.map(tag => (
              <span key={tag} style={{ background: 'var(--muted-bg)', color: 'var(--subtext)', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>#{tag}</span>
            ))}
          </div>

          {/* Low stock warning */}
          {lowStock && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#c2410c' }}>
                {tr(`بقي ${product.stock} قطعة فقط في المخزن!`, `Only ${product.stock} left in stock!`, `נותרו ${product.stock} פריטים בלבד במלאי!`)}
              </span>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div style={{ background: 'var(--muted-bg)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#374151', minWidth: 60 }}>{t('quantityLabel')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--card)', borderRadius: 12, border: '2px solid var(--border)', overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 42, height: 42, border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', fontWeight: 700, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>−</button>
                <span style={{ fontWeight: 800, fontSize: 18, minWidth: 40, textAlign: 'center', color: '#1a1a2e' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 42, height: 42, border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--brand)', fontWeight: 700, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-soft)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>+</button>
              </div>
              <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>= {(displayPrice * qty).toFixed(2)} {t('currency')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                style={{ flex: 1, padding: '14px 20px', background: outOfStock ? '#e5e7eb' : 'var(--brand)', color: outOfStock ? '#9ca3af' : 'white', border: 'none', borderRadius: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 16, cursor: outOfStock ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => { if (!outOfStock) e.currentTarget.style.background = 'var(--brand-dark)'; }}
                onMouseLeave={e => { if (!outOfStock) e.currentTarget.style.background = 'var(--brand)'; }}
              >
                {outOfStock ? t('unavailableBtn') : addToCartLabel}
              </button>
              <Link to="/cart" style={{ padding: '14px 20px', borderRadius: 12, border: '2px solid var(--brand)', color: 'var(--brand)', textDecoration: 'none', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-soft)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {t('viewCartBtn')}
              </Link>
            </div>
          </div>

          {isMobile && <ProductSpecs title={t('specsTitle')} rows={specRows} />}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>{relatedTitle}</h2>
            <Link to="/store" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              {t('viewAllLink')} ←
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 20 }}>
            {tr('🕐 شاهدتها مؤخراً', '🕐 Recently Viewed', '🕐 נצפו לאחרונה')}
          </h2>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {recentlyViewed.map(p => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                style={{ textDecoration: 'none', flexShrink: 0, width: 150 }}
              >
                <div style={{ background: 'var(--card)', borderRadius: 16, padding: 14, border: 'var(--card-border)', boxShadow: 'var(--shadow-sm)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, background: 'linear-gradient(135deg, var(--brand-soft), #fbf3df)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, marginBottom: 10, overflow: 'hidden' }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt={productName(p, lang)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.emoji}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{productName(p, lang)}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)' }}>{p.price.toFixed(2)} {t('currency')}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
