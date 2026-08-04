import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { productName } from '../utils/productName';
import toast from 'react-hot-toast';

const HEAT_LABELS = ['', '🌶️', '🌶️🌶️', '🌶️🌶️🌶️', '🌶️🌶️🌶️🌶️', '🌶️🌶️🌶️🌶️🌶️'];

export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const navigate = useNavigate();
  const { t, isRTL, lang } = useLanguage();
  const { toggleWishlist, inWishlist } = useWishlist();
  const inCart = items.find(i => i.id === product.id);
  const wishlisted = inWishlist(product.id);
  const outOfStock = !product.inStock || product.stock === 0;
  const lowStock = product.inStock && product.stock != null && product.stock > 0 && product.stock <= 5;

  const handleWishlist = (e) => {
    e.stopPropagation();
    const added = toggleWishlist(product.id);
    if (!added) {
      toast(isRTL ? t('loginToWishlistMsg') : t('loginToWishlistMsg'), {
        icon: '❤️',
        style: { fontFamily: 'Cairo, sans-serif', direction: isRTL ? 'rtl' : 'ltr' },
      });
    }
  };

  const handleAdd = () => {
    addItem(product);
    const msg = isRTL
      ? `تمت الإضافة إلى السلة! ${product.emoji}`
      : `Added to cart! ${product.emoji}`;
    toast.success(msg, {
      style: { fontFamily: 'Cairo, sans-serif', direction: isRTL ? 'rtl' : 'ltr', fontWeight: 600 },
      iconTheme: { primary: 'var(--brand)', secondary: '#fff' },
    });
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        border: 'var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    >
      {/* Wishlist heart */}
      <button
        onClick={handleWishlist}
        style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: wishlisted ? 'var(--brand-soft)' : 'var(--card)', border: `2px solid ${wishlisted ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, boxShadow: 'var(--shadow-sm)' }}
        title={wishlisted ? t('removeFromWishlist') : t('addToWishlist')}
      >
        {wishlisted ? '❤️' : '🤍'}
      </button>

      {/* Badges */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1 }}>
        {product.isNew && (
          <span style={{ background: 'var(--brand-blue)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{t('badgeNew')}</span>
        )}
        {product.isFeatured && (
          <span style={{ background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{t('badgeFeatured')}</span>
        )}
        {outOfStock && (
          <span style={{ background: '#6b7280', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{t('badgeOutOfStock')}</span>
        )}
        {lowStock && (
          <span style={{ background: '#f97316', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>🔥 {isRTL ? `بقي ${product.stock} فقط!` : `Only ${product.stock} left!`}</span>
        )}
      </div>

      {/* Image */}
      <div style={{ background: 'linear-gradient(135deg, var(--brand-soft) 0%, #fbf3df 100%)', aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, overflow: 'hidden' }}>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={productName(product, lang)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : product.emoji}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, background: 'var(--brand-soft)', padding: '2px 8px', borderRadius: 6 }}>
            {product.category}
          </span>
          {product.heat > 0 && (
            <span style={{ fontSize: 11 }} title={`Heat: ${product.heat}/5`}>
              {HEAT_LABELS[product.heat]}
            </span>
          )}
        </div>

        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }} className="line-clamp-2">
          {productName(product, lang)}
        </div>

        <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5, flex: 1 }} className="line-clamp-2">
          {product.description}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 13, color: s <= Math.round(product.rating) ? '#f59e0b' : 'var(--border)' }}>★</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{product.rating} ({product.reviews})</span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{product.brand}</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
            {product.price.toFixed(2)} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--subtext)' }}>{t('currency')}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleAdd(); }}
            disabled={outOfStock}
            style={{
              background: outOfStock ? 'var(--muted-bg)' : inCart ? 'var(--brand-blue)' : 'var(--brand)',
              color: outOfStock ? 'var(--muted)' : 'white',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
              fontSize: 13,
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {outOfStock ? t('outOfStock') : inCart ? t('inCart') : t('addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}
