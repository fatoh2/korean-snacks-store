import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';

const CATEGORIES = ['الكل', 'رامن', 'رقائق', 'حلوى', 'مشروبات', 'بسكويت'];
const PAGE_SIZE = 20;

export default function Catalog() {
  const { products } = useProducts();
  const { t, tr, isRTL } = useLanguage();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(location.state?.category || 'الكل');
  const [maxPrice, setMaxPrice] = useState(null);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const sortOptions = [
    { value: 'featured', label: t('sortFeatured') },
    { value: 'price-asc', label: t('sortPriceAsc') },
    { value: 'price-desc', label: t('sortPriceDesc') },
    { value: 'rating', label: t('sortRating') },
    { value: 'name', label: t('sortName') },
  ];

  const catLabel = (cat) => ({
    'الكل': t('catAll'), 'رامن': t('catRamen'), 'رقائق': t('catChips'),
    'حلوى': t('catCandy'), 'مشروبات': t('catDrinks'), 'بسكويت': t('catBiscuits'),
  })[cat] ?? cat;

  const maxPriceInData = Math.ceil(Math.max(...products.map(p => p.price))) + 1;
  const effectiveMax = maxPrice ?? maxPriceInData;

  // Reset to the first page whenever the active filters change.
  const filterKey = JSON.stringify([search, category, maxPrice, onlyInStock, minRating, sort]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = [...products];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        (p.nameAr || p.name || '').toLowerCase().includes(q) ||
        (p.nameKo || '').toLowerCase().includes(q) ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        (p.nameHe || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }
    if (category !== 'الكل') result = result.filter(p => p.category === category);
    result = result.filter(p => p.price <= effectiveMax);
    if (onlyInStock) result = result.filter(p => p.inStock);
    if (minRating > 0) result = result.filter(p => p.rating >= minRating);
    switch (sort) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name, 'ar')); break;
      default: result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return result;
  }, [products, search, category, effectiveMax, onlyInStock, minRating, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFiltersCount = [
    category !== 'الكل',
    maxPrice !== null && maxPrice < maxPriceInData,
    onlyInStock,
    minRating > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCategory('الكل');
    setMaxPrice(null);
    setOnlyInStock(false);
    setMinRating(0);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

      {/* Hero */}
      <section className="catalog-hero">
        <div className="catalog-hero__copy">
          <div className="catalog-hero__eyebrow">
            <span className="catalog-hero__eyebrow-line" />
            {t('catalogHeroBadge')}
          </div>
          <h1 className="catalog-hero__title">{t('catalogHeroTitle')}</h1>
          <div className="catalog-hero__meta">
            <span className="catalog-hero__count">{products.length}+</span>
            <span>{tr('نكهة ومنتج مميز', 'curated flavours & products', 'טעמים ומוצרים נבחרים')}</span>
            <span className="catalog-hero__meta-dot" />
            <span>{tr('توصيل حتى باب البيت', 'delivered to your door', 'משלוח עד הבית')}</span>
          </div>
        </div>

        <div className="catalog-hero__showcase" aria-hidden="true">
          <div className="catalog-hero__monogram">LT</div>
          <div className="catalog-hero__seal">
            <span>CURATED</span>
            <img src="/logo-nobg.png" alt="" />
            <span>WORLD FLAVOURS</span>
          </div>
          <span className="catalog-hero__snack catalog-hero__snack--one">🍜</span>
          <span className="catalog-hero__snack catalog-hero__snack--two">🍡</span>
          <span className="catalog-hero__snack catalog-hero__snack--three">🥤</span>
        </div>

        <div className="catalog-hero__edition" aria-hidden="true">LULU TOKKI · EST. 2026</div>
      </section>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', [isRTL ? 'right' : 'left']: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: isRTL ? '14px 50px 14px 20px' : '14px 20px 14px 50px', borderRadius: 12, border: '2px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 15, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'var(--brand)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        )}
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '8px 18px', borderRadius: 24, border: '2px solid',
            borderColor: category === cat ? 'var(--brand)' : 'var(--border)',
            background: category === cat ? 'var(--brand)' : 'var(--card)',
            color: category === cat ? 'white' : 'var(--text)',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>{catLabel(cat)}</button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ color: 'var(--subtext)', fontSize: 14, fontWeight: 600 }}>
          {filtered.length === 0 ? t('noResultsTitle') : (
            <>
              <span style={{ color: 'var(--text)', fontWeight: 800 }}>{filtered.length}</span> {t('productsLabel')}
              {totalPages > 1 && (
                <span style={{ [isRTL ? 'marginRight' : 'marginLeft']: 8, color: '#9ca3af' }}>
                  — {t('pageLabel')} {page} {t('ofLabel')} {totalPages}
                </span>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10,
              border: '2px solid', borderColor: activeFiltersCount > 0 ? 'var(--brand)' : '#e5e7eb',
              background: activeFiltersCount > 0 ? 'var(--brand-soft)' : 'white',
              color: activeFiltersCount > 0 ? 'var(--brand)' : '#374151',
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            <span>{t('filterBtn')}</span>
            {activeFiltersCount > 0 && (
              <span style={{ background: 'var(--brand)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid var(--border)', fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'var(--card)', color: 'var(--text)', outline: 'none' }}>
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {filtersOpen && (
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, marginBottom: 24, border: '2px solid var(--brand)', boxShadow: '0 4px 20px rgba(232,138,166,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', display: 'block', marginBottom: 10 }}>
                {t('maxPriceLabel')}: <span style={{ color: 'var(--brand)' }}>{effectiveMax} {t('currency')}</span>
              </label>
              <input type="range" min={5} max={maxPriceInData} step={0.5}
                value={effectiveMax}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                <span>5 {t('currency')}</span><span>{maxPriceInData} {t('currency')}</span>
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14, color: '#374151', display: 'block', marginBottom: 10 }}>{t('minRatingLabel')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button key={r} onClick={() => setMinRating(r)} style={{
                    padding: '6px 12px', borderRadius: 8, border: '2px solid',
                    borderColor: minRating === r ? '#f59e0b' : '#e5e7eb',
                    background: minRating === r ? '#fffbeb' : 'white',
                    color: minRating === r ? '#d97706' : '#6b7280',
                    fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>{r === 0 ? t('catAll') : `${r}★`}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setOnlyInStock(!onlyInStock)} style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: onlyInStock ? 'var(--brand)' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'right 0.2s', right: onlyInStock ? 4 : 24, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>{t('inStockOnly')}</span>
              </label>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
              <button onClick={resetFilters} style={{ padding: '8px 20px', borderRadius: 10, border: '2px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {t('resetFilters')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{t('noResultsTitle')}</div>
          <div style={{ fontSize: 14 }}>{t('noResultsDesc')}</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
            {paginated.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          {totalPages > 1 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
              {tr('عرض', 'Showing', 'מציג')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {t('ofLabel')} {filtered.length} {t('productsLabel')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
