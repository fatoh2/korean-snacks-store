import { useState } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import AdminBadge from './AdminBadge';
import { inputStyle, toastStyle } from './adminStyles';
import CategoryManager from './CategoryManager';
import { useLanguage } from '../../context/LanguageContext';
import { latinNumber } from './adminFormat';

export default function ProductsListTab({
  products, categories, search, setSearch, onEdit, onDuplicate, onRemove,
  updateProduct,
}) {
  const { tr } = useLanguage();
  const [confirmId, setConfirmId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkPct, setBulkPct] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.nameAr || p.name || '').toLowerCase().includes(q) ||
      (p.nameKo || '').toLowerCase().includes(q) ||
      (p.nameEn || '').toLowerCase().includes(q) ||
      (p.nameHe || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.includes(search);
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkPrice = async () => {
    const pct = Number(bulkPct);
    if (!pct || isNaN(pct)) return;
    const selected = products.filter(p => selectedIds.has(p.id));
    if (!selected.length) return;

    const batch = writeBatch(db);
    const updates = [];
    selected.forEach(p => {
      const newPrice = Math.round(p.price * (1 + pct / 100) * 100) / 100;
      if (newPrice > 0) {
        batch.update(doc(db, 'products', String(p.id)), { price: newPrice });
        updates.push({ id: p.id, price: newPrice });
      }
    });
    await batch.commit();
    for (const u of updates) {
      await updateProduct(u.id, { price: u.price });
    }
    toast.success(`تم تحديث أسعار ${updates.length} منتج ${pct > 0 ? '⬆' : '⬇'}`, { style: toastStyle });
    setSelectedIds(new Set());
    setBulkPct('');
  };

  const moveProduct = async (product, direction) => {
    const sorted = [...products].sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
    const idx = sorted.findIndex(p => p.id === product.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    const aOrder = product.sortOrder ?? product.id * 10;
    const bOrder = other.sortOrder ?? other.id * 10;

    const batch = writeBatch(db);
    batch.update(doc(db, 'products', String(product.id)), { sortOrder: bOrder });
    batch.update(doc(db, 'products', String(other.id)), { sortOrder: aOrder });
    await batch.commit();
    await updateProduct(product.id, { sortOrder: bOrder });
    await updateProduct(other.id, { sortOrder: aOrder });
  };

  const handleRemove = async (id) => {
    await onRemove(id);
    setConfirmId(null);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => onRemove(id)));
    toast.success(`تم حذف ${ids.length} منتج 🗑️`, { style: toastStyle });
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const catNames = categories.map(c => c.name);

  return (
    <div>
      {/* Search + Category toggle */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            type="text" placeholder={tr('ابحث في المنتجات...', 'Search items...', 'חיפוש מוצרים...')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle(false), paddingRight: 38 }}
            onFocus={e => e.target.style.borderColor = 'var(--brand)'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        <button onClick={() => setShowCategories(!showCategories)} style={{
          padding: '10px 18px', borderRadius: 10,
          border: '2px solid', borderColor: showCategories ? 'var(--brand)' : '#e5e7eb',
          background: showCategories ? 'var(--brand-soft)' : 'white',
          color: showCategories ? 'var(--brand)' : '#6b7280',
          fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          📂 {tr('إدارة الفئات', 'Manage categories', 'ניהול קטגוריות')}
        </button>
      </div>

      {/* Category Manager (collapsible) */}
      {showCategories && <CategoryManager />}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {catNames.map(cat => {
          const count = products.filter(p => p.category === cat).length;
          return (
            <div key={cat} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', fontSize: 13 }}>
              <span style={{ fontWeight: 800, color: 'var(--brand)', marginLeft: 6 }}>{count}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>{cat}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '36px 50px minmax(220px, 1fr) 110px 82px 82px 105px 150px 86px', gap: 0, minWidth: 980, background: '#f8f9fb', borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontSize: 12, fontWeight: 800, color: '#6b7280', alignItems: 'center' }}>
          <span>
            <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
          </span>
          <span>{tr('رمز', 'Icon', 'סמל')}</span>
          <span>{tr('اسم المنتج', 'Item name', 'שם המוצר')}</span>
          <span>{tr('الفئة', 'Category', 'קטגוריה')}</span>
          <span>{tr('السعر', 'Price', 'מחיר')}</span>
          <span>{tr('التقييم', 'Rating', 'דירוג')}</span>
          <span>{tr('المخزون', 'Stock', 'מלאי')}</span>
          <span>{tr('إجراء', 'Actions', 'פעולות')}</span>
          <span>{tr('ترتيب', 'Order', 'סדר')}</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            {tr('لا توجد منتجات مطابقة', 'No matching items', 'לא נמצאו מוצרים מתאימים')}
          </div>
        ) : filtered.map((p, i) => (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '36px 50px minmax(220px, 1fr) 110px 82px 82px 105px 150px 86px',
            gap: 0, minWidth: 980, padding: '12px 16px', alignItems: 'center',
            background: selectedIds.has(p.id) ? 'var(--brand-soft)' : i % 2 === 0 ? 'white' : '#fafafa',
            borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s',
          }}
            onMouseEnter={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = '#fef2f7'; }}
            onMouseLeave={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'; }}
          >
            <div>
              <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 24, textAlign: 'center' }}>{p.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{p.brand} • ID: {latinNumber(p.id)}</div>
            </div>
            <div><AdminBadge color="var(--brand-blue)" bg="#eff6ff">{p.category}</AdminBadge></div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e' }}>{p.price.toFixed(2)}</div>
            <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>{p.rating > 0 ? `${p.rating}★` : '—'}</div>
            <div>
              {!p.inStock
                ? <AdminBadge color="#6b7280" bg="#f3f4f6">&#x274C; نفد</AdminBadge>
                : p.stock != null && p.stock <= 5
                  ? <AdminBadge color="#d97706" bg="#fffbeb">&#x26A0;&#xFE0F; {p.stock} فقط</AdminBadge>
                  : <AdminBadge color="#16a34a" bg="#f0fdf4">&#x2705; {p.stock != null ? p.stock : '∞'}</AdminBadge>
              }
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
              {confirmId === p.id ? (
                <>
                  <button onClick={() => handleRemove(p.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{tr('تأكيد', 'Confirm', 'אישור')}</button>
                  <button onClick={() => setConfirmId(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{tr('إلغاء', 'Cancel', 'ביטול')}</button>
                </>
              ) : (
                <>
                  <button onClick={() => onEdit(p)} title="تعديل" style={{ padding: '6px 10px', borderRadius: 8, border: '2px solid #dbeafe', background: '#eff6ff', color: 'var(--brand-blue)', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-blue)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = 'var(--brand-blue)'; }}
                  >&#x270F;&#xFE0F;</button>
                  <button onClick={() => onDuplicate(p)} title="نسخ" style={{ padding: '6px 10px', borderRadius: 8, border: '2px solid #d1fae5', background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.color = '#059669'; }}
                  >&#x1F4CB;</button>
                  <button onClick={() => setConfirmId(p.id)} title="حذف" style={{ padding: '6px 10px', borderRadius: 8, border: '2px solid #fee2e2', background: 'var(--brand-soft)', color: 'var(--brand)', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand-soft)'; e.currentTarget.style.color = 'var(--brand)'; }}
                  >&#x1F5D1;&#xFE0F;</button>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              <button aria-label={tr('تحريك لأعلى', 'Move up', 'הזזה למעלה')} title={tr('تحريك لأعلى', 'Move up', 'הזזה למעלה')} onClick={() => moveProduct(p, 'up')} style={{ width: 34, padding: '4px 0', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12 }}>&#x25B2;</button>
              <button aria-label={tr('تحريك لأسفل', 'Move down', 'הזזה למטה')} title={tr('تحريك لأسفل', 'Move down', 'הזזה למטה')} onClick={() => moveProduct(p, 'down')} style={{ width: 34, padding: '4px 0', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12 }}>&#x25BC;</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
        {tr('عرض', 'Showing', 'מציג')} {latinNumber(filtered.length)} {tr('من', 'of', 'מתוך')} {latinNumber(products.length)} {tr('منتج', 'items', 'מוצרים')}
      </div>

      {/* Bulk price bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'white', borderTop: '2px solid var(--brand)', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e' }}>
            {selectedIds.size} منتج محدد
          </span>
          <input
            type="number" value={bulkPct} onChange={e => setBulkPct(e.target.value)}
            placeholder="نسبة التعديل % (مثال: 10 أو -5)"
            style={{ ...inputStyle(false), width: 240 }}
          />
          <button onClick={handleBulkPrice} disabled={!bulkPct} style={{
            padding: '10px 22px', background: bulkPct ? 'var(--brand)' : '#d1d5db', color: 'white',
            border: 'none', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 14, cursor: bulkPct ? 'pointer' : 'default',
          }}>
            💰 تحديث الأسعار
          </button>
          {confirmBulkDelete ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>تأكيد حذف {selectedIds.size} منتج؟</span>
              <button onClick={handleBulkDelete} style={{
                padding: '10px 18px', background: 'var(--brand)', color: 'white', border: 'none',
                borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer',
              }}>
                تأكيد
              </button>
              <button onClick={() => setConfirmBulkDelete(false)} style={{
                padding: '10px 18px', background: 'white', color: '#6b7280', border: '2px solid #e5e7eb',
                borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                إلغاء
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmBulkDelete(true)} style={{
              padding: '10px 18px', background: 'var(--brand-soft)', color: 'var(--brand)', border: '2px solid #fee2e2',
              borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>
              🗑️ حذف المحدد
            </button>
          )}
          <button onClick={() => { setSelectedIds(new Set()); setBulkPct(''); setConfirmBulkDelete(false); }} style={{
            padding: '10px 18px', background: 'white', color: '#6b7280', border: '2px solid #e5e7eb',
            borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            إلغاء التحديد
          </button>
        </div>
      )}
    </div>
  );
}
