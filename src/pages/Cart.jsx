import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { productName } from '../utils/productName';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Cart() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const { t, tr, lang } = useLanguage();
  const isMobile = useIsMobile();

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🛒</div>
        <h2 style={{ fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 10 }}>{t('emptyCartTitle')}</h2>
        <p style={{ color: 'var(--subtext)', fontSize: 16, marginBottom: 32 }}>{t('emptyCartMsg')}</p>
        <Link
          to="/store"
          style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 12, background: 'var(--brand)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: 16 }}
        >
          {t('browseStore')}
        </Link>
      </div>
    );
  }

  const shipping = 15;
  const total = totalPrice + shipping;
  const itemsText = tr(
    `${items.length} ${items.length === 1 ? 'منتج' : 'منتجات'} في سلتك`,
    `${items.length} ${items.length === 1 ? 'item' : 'items'} in your cart`,
    `${items.length} ${items.length === 1 ? 'מוצר' : 'מוצרים'} בעגלה שלך`,
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontWeight: 800, fontSize: 26, color: 'var(--text)', marginBottom: 8 }}>{t('cartTitle')}</h1>
      <p style={{ color: 'var(--subtext)', fontSize: 14, marginBottom: 28 }}>{itemsText}</p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={clearCart}
              style={{ background: 'none', border: '2px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', color: '#9ca3af', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              {t('clearCart')}
            </button>
          </div>

          {items.map(item => (
            <div
              key={item.id}
              style={{ background: 'var(--card)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16, alignItems: isMobile ? 'stretch' : 'center', boxShadow: 'var(--shadow-sm)', border: 'var(--card-border)' }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-soft), #fbf3df)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, overflow: 'hidden' }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>{productName(item, lang)}</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 8 }}>
                    {item.brand} • {item.category}
                    {item.variant && <span style={{ marginInlineStart: 6, background: '#eff6ff', color: 'var(--brand-blue)', fontWeight: 700, padding: '1px 7px', borderRadius: 5 }}>{item.variant.label}</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand)' }}>
                    {(item.price * item.quantity).toFixed(2)} {t('currency')}
                    <span style={{ fontWeight: 500, fontSize: 12, color: '#9ca3af', marginInlineStart: 6 }}>
                      ({item.price.toFixed(2)} × {item.quantity})
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '2px solid var(--border)', background: 'var(--card)', fontSize: 16, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>−</button>
                  <span style={{ fontWeight: 800, fontSize: 16, minWidth: 28, textAlign: 'center', color: 'var(--text)' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '2px solid var(--brand)', background: 'var(--brand-soft)', fontSize: 16, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>+</button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', flexShrink: 0, padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-lg)', border: 'var(--card-border)', position: 'sticky', top: 84 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', marginTop: 0, marginBottom: 20 }}>{t('orderSummaryTitle')}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--subtext)' }}>
              <span>{t('subtotal')}</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{totalPrice.toFixed(2)} {t('currency')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--subtext)' }}>
              <span>{t('shippingFee')}</span>
              <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{shipping.toFixed(2)} {t('currency')}</span>
            </div>
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                <span style={{ color: 'var(--text)' }}>{t('totalLabel')}</span>
                <span style={{ color: 'var(--brand)' }}>{total.toFixed(2)} {t('currency')}</span>
              </div>
            </div>
          </div>

          <Link
            to="/checkout"
            style={{ display: 'block', textAlign: 'center', padding: '14px 20px', background: 'var(--brand)', color: 'white', textDecoration: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
          >
            {t('checkoutBtn')}
          </Link>

          <Link
            to="/store"
            style={{ display: 'block', textAlign: 'center', padding: '12px 20px', marginTop: 10, background: 'white', color: '#374151', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, border: '2px solid #e5e7eb' }}
          >
            {t('continueShoppingBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
