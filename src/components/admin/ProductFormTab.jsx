import { useState, useRef, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import toast from 'react-hot-toast';
import AdminField from './AdminField';
import { inputStyle, EMPTY_FORM, toastStyle } from './adminStyles';
import { translateArToEnHe } from '../../utils/translate';
import { useIsMobile } from '../../hooks/useIsMobile';

const IMAGE_UPLOAD_URL = import.meta.env.DEV
  ? import.meta.env.VITE_IMAGE_UPLOAD_URL
  : '/api/upload';

export default function ProductFormTab({
  products, editingId, setEditingId, form, setForm, onSwitchToList, addProduct, updateProduct,
}) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(form.imageUrl || '');
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [translating, setTranslating] = useState(false);
  const translateTimer = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const defaults = [{ name: 'رامن' }, { name: 'رقائق' }, { name: 'حلوى' }, { name: 'مشروبات' }, { name: 'بسكويت' }, { name: 'كاندي' }, { name: 'مجّات' }];
    const fallback = () => setCategories(defaults);
    getDocs(collection(db, 'categories')).then(snap => {
      const arr = [];
      snap.forEach(d => arr.push({ name: d.id, ...d.data() }));
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      defaults.forEach(defaultCategory => {
        if (!arr.some(category => category.name === defaultCategory.name)) arr.push(defaultCategory);
      });
      if (arr.length) setCategories(arr);
      else fallback();
    }).catch(fallback);
  }, []);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  // Auto-translate Arabic → English + Hebrew (debounced)
  const triggerTranslate = useCallback((arabicText) => {
    if (translateTimer.current) clearTimeout(translateTimer.current);
    if (!arabicText || !arabicText.trim()) return;
    translateTimer.current = setTimeout(async () => {
      setTranslating(true);
      try {
        const { en, he } = await translateArToEnHe(arabicText);
        setForm(f => ({
          ...f,
          nameEn: f.nameEn || en, // only auto-fill if empty
          nameHe: f.nameHe || he,
        }));
      } finally {
        setTranslating(false);
      }
    }, 800);
  }, [setForm]);

  // Force re-translate (overwrites existing values)
  const forceTranslate = useCallback(async () => {
    if (!form.nameAr.trim()) return;
    setTranslating(true);
    try {
      const { en, he } = await translateArToEnHe(form.nameAr);
      setForm(f => ({ ...f, nameEn: en, nameHe: he }));
    } finally {
      setTranslating(false);
    }
  }, [form.nameAr, setForm]);

  const validate = () => {
    const e = {};
    if (!form.nameAr.trim()) e.nameAr = 'الاسم بالعربية مطلوب';
    if (!form.nameKo.trim()) e.nameKo = 'الاسم بالكورية مطلوب';
    if (!form.description.trim()) e.description = 'الوصف مطلوب';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'سعر صحيح مطلوب';
    if (!form.brand.trim()) e.brand = 'العلامة التجارية مطلوبة';
    return e;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error(Object.values(errs)[0], { style: toastStyle });
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = imagePreview && !imageFile ? imagePreview : '';
      if (imageFile) {
        const targetId = editingId ?? (products.reduce((max, p) => Math.max(max, p.id), 0) + 1);
        const idToken = await auth.currentUser.getIdToken();
        const body = new FormData();
        body.append('file', imageFile);
        body.append('key', `product-images/${targetId}`);
        const res = await fetch(IMAGE_UPLOAD_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'فشل رفع الصورة');
        }
        ({ url: imageUrl } = await res.json());
      }
      const stockVal = form.stock !== '' ? Number(form.stock) : null;
      const data = {
        ...form,
        name: form.nameAr, // backward compat
        price: Number(form.price),
        heat: Number(form.heat),
        stock: stockVal,
        inStock: stockVal == null ? form.inStock : stockVal > 0,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(imageUrl ? { imageUrl } : {}),
      };
      if (editingId) {
        await updateProduct(editingId, data);
        toast.success(`تم تحديث "${form.nameAr}" ✅`, { style: toastStyle });
      } else {
        await addProduct(data);
        toast.success(`تم إضافة "${form.nameAr}" بنجاح! ✅`, { style: toastStyle });
      }
      setForm(EMPTY_FORM);
      setImageFile(null);
      setImagePreview('');
      setEditingId(null);
      onSwitchToList();
    } catch (err) {
      toast.error(`فشل الحفظ: ${err.message}`, { style: toastStyle });
    } finally {
      setSubmitting(false);
    }
  };

  const catNames = categories.map(c => c.name);

  const nameInputStyle = (hasError) => ({
    ...inputStyle(hasError),
  });

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginTop: 0, marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid #f3f4f6' }}>
          {editingId ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

          {/* === Multilingual Name Section === */}
          <div style={{ gridColumn: '1 / -1', background: '#f8f9fb', borderRadius: 14, padding: '18px 20px', border: '1px solid #e5e7eb', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🌐</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e' }}>أسماء المنتج بعدة لغات</span>
              {translating && <span style={{ fontSize: 12, color: '#6b7280', marginRight: 'auto' }}>⏳ جاري الترجمة...</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              {/* Arabic Name */}
              <AdminField label="🇸🇦 الاسم بالعربية" required error={errors.nameAr}>
                <input value={form.nameAr}
                  onChange={e => {
                    set('nameAr', e.target.value);
                    triggerTranslate(e.target.value);
                  }}
                  placeholder="مثال: رامن بلدق الحار"
                  style={nameInputStyle(!!errors.nameAr)}
                  onFocus={e => { if (!errors.nameAr) e.target.style.borderColor = 'var(--brand)'; }}
                  onBlur={e => { if (!errors.nameAr) e.target.style.borderColor = '#e5e7eb'; }}
                />
              </AdminField>

              {/* Korean Name */}
              <AdminField label="🇰🇷 الاسم بالكورية" required error={errors.nameKo}>
                <input value={form.nameKo}
                  onChange={e => set('nameKo', e.target.value)}
                  placeholder="مثال: 불닭볶음면"
                  style={nameInputStyle(!!errors.nameKo)}
                  onFocus={e => { if (!errors.nameKo) e.target.style.borderColor = 'var(--brand)'; }}
                  onBlur={e => { if (!errors.nameKo) e.target.style.borderColor = '#e5e7eb'; }}
                />
              </AdminField>

              {/* English Name (auto-translated) */}
              <div style={{ position: 'relative' }}>
                <AdminField label="🇬🇧 الاسم بالإنجليزية (ترجمة تلقائية)">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={form.nameEn}
                      onChange={e => set('nameEn', e.target.value)}
                      placeholder={translating ? 'جاري الترجمة...' : 'يتم تعبئته تلقائياً من العربية'}
                      style={{ ...nameInputStyle(false), flex: 1, opacity: translating ? 0.6 : 1 }}
                      onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button type="button" onClick={forceTranslate} disabled={translating || !form.nameAr.trim()}
                      title="إعادة الترجمة"
                      style={{ padding: '8px 10px', borderRadius: 10, border: '2px solid #e5e7eb', background: 'white', cursor: translating ? 'wait' : 'pointer', fontSize: 14, flexShrink: 0, opacity: !form.nameAr.trim() ? 0.4 : 1 }}>
                      🔄
                    </button>
                  </div>
                </AdminField>
              </div>

              {/* Hebrew Name (auto-translated) */}
              <div style={{ position: 'relative' }}>
                <AdminField label="🇮🇱 الاسم بالعبرية (ترجمة تلقائية)">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={form.nameHe}
                      onChange={e => set('nameHe', e.target.value)}
                      placeholder={translating ? 'جاري الترجمة...' : 'يتم تعبئته تلقائياً من العربية'}
                      style={{ ...nameInputStyle(false), flex: 1, opacity: translating ? 0.6 : 1 }}
                      onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button type="button" onClick={forceTranslate} disabled={translating || !form.nameAr.trim()}
                      title="إعادة الترجمة"
                      style={{ padding: '8px 10px', borderRadius: 10, border: '2px solid #e5e7eb', background: 'white', cursor: translating ? 'wait' : 'pointer', fontSize: 14, flexShrink: 0, opacity: !form.nameAr.trim() ? 0.4 : 1 }}>
                      🔄
                    </button>
                  </div>
                </AdminField>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <AdminField label="الوصف المختصر" required error={errors.description}>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="جملة أو جملتان عن المنتج..." rows={2}
                style={{ ...inputStyle(!!errors.description), resize: 'vertical', fontFamily: 'Cairo, sans-serif' }}
                onFocus={e => { if (!errors.description) e.target.style.borderColor = 'var(--brand)'; }}
                onBlur={e => { if (!errors.description) e.target.style.borderColor = '#e5e7eb'; }}
              />
            </AdminField>
          </div>

          {/* Price */}
          <AdminField label="السعر (₪)" required error={errors.price}>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
              placeholder="0.00" style={inputStyle(!!errors.price)}
              onFocus={e => { if (!errors.price) e.target.style.borderColor = 'var(--brand)'; }}
              onBlur={e => { if (!errors.price) e.target.style.borderColor = '#e5e7eb'; }}
            />
          </AdminField>

          {/* Category */}
          <AdminField label="الفئة" required>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              style={{ ...inputStyle(false), cursor: 'pointer' }}>
              <option value="">اختر فئة</option>
              {catNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </AdminField>

          {/* Brand */}
          <AdminField label="العلامة التجارية" required error={errors.brand}>
            <input value={form.brand} onChange={e => set('brand', e.target.value)}
              placeholder="مثال: Samyang" style={inputStyle(!!errors.brand)}
              onFocus={e => { if (!errors.brand) e.target.style.borderColor = 'var(--brand)'; }}
              onBlur={e => { if (!errors.brand) e.target.style.borderColor = '#e5e7eb'; }}
            />
          </AdminField>

          {/* Emoji */}
          <AdminField label="الرمز (إيموجي)">
            <input value={form.emoji} onChange={e => set('emoji', e.target.value)}
              placeholder="🍜" style={{ ...inputStyle(false), fontSize: 20, textAlign: 'center' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </AdminField>

          {/* Image upload */}
          <div style={{ gridColumn: '1 / -1' }}>
            <AdminField label="صورة المنتج (اختياري — تحل محل الإيموجي)">
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.2s', background: '#fafafa' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{imageFile?.name || 'الصورة الحالية'}</div>
                      <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 4 }}>اضغط لتغيير الصورة</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 72, height: 72, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>📷</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>اضغط لرفع صورة</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PNG, JPG, WEBP — بدون صورة يُستخدم الإيموجي</div>
                    </div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            </AdminField>
          </div>

          {/* Weight + Servings */}
          <AdminField label="الوزن">
            <input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="مثال: 140g" style={inputStyle(false)}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </AdminField>
          <AdminField label="الحصص">
            <input value={form.servings} onChange={e => set('servings', e.target.value)} placeholder="مثال: حصتان" style={inputStyle(false)}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </AdminField>

          {/* Stock */}
          <AdminField label="الكمية المتوفرة (اتركه فارغاً = غير محدود)">
            <input type="number" min="0" step="1" value={form.stock} onChange={e => set('stock', e.target.value)}
              placeholder="مثال: 10" style={inputStyle(false)}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </AdminField>

          {/* Heat */}
          <div style={{ gridColumn: '1 / -1' }}>
            <AdminField label={`مستوى الحرارة: ${form.heat}/5 ${'🌶️'.repeat(form.heat) || 'لا يوجد'}`}>
              <input type="range" min={0} max={5} step={1} value={form.heat} onChange={e => set('heat', e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                <span>0 — لا حرارة</span><span>5 — ناري!</span>
              </div>
            </AdminField>
          </div>

          {/* Tags */}
          <div style={{ gridColumn: '1 / -1' }}>
            <AdminField label="الوسوم (مفصولة بفاصلة)">
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="حار, جديد, Samyang, كلاسيك" style={inputStyle(false)}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </AdminField>
          </div>

          {/* Variants */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>
              أحجام العبوات (اختياري) — مثال: 1x، 3x، 6x
            </div>
            {form.variants.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={v.label} placeholder="الحجم (1x)"
                  onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], label: e.target.value }; set('variants', vs); }}
                  style={{ ...inputStyle(false), width: 80, flexShrink: 0 }} />
                <input type="number" min="1" value={v.multiplier} placeholder="الكمية"
                  onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], multiplier: Number(e.target.value) }; set('variants', vs); }}
                  style={{ ...inputStyle(false), width: 90, flexShrink: 0 }} />
                <input type="number" min="0" max="100" value={v.discountPct ?? ''} placeholder="خصم %"
                  onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], discountPct: e.target.value === '' ? 0 : Number(e.target.value) }; set('variants', vs); }}
                  style={{ ...inputStyle(false), width: 90, flexShrink: 0 }} />
                <button type="button" onClick={() => set('variants', form.variants.filter((_, j) => j !== i))}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: 'var(--brand-soft)', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <button type="button"
              onClick={() => set('variants', [...form.variants, { label: `${(form.variants.length + 1)}x`, multiplier: form.variants.length + 1, discountPct: 0 }])}
              style={{ padding: '7px 16px', borderRadius: 8, border: '2px dashed #e5e7eb', background: 'white', color: '#6b7280', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13 }}>
              + إضافة حجم
            </button>
          </div>

          {/* Toggle */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => set('inStock', !form.inStock)} style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: form.inStock ? 'var(--brand)' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'right 0.2s', right: form.inStock ? 4 : 24, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>متاح في المخزون</span>
            </label>
          </div>

          {/* Preview */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ background: '#f8f9fb', borderRadius: 12, padding: 16, border: '1px dashed #e5e7eb' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 10 }}>معاينة المنتج</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, var(--brand-soft), #fbf3df)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                  {form.emoji || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{form.nameAr || 'اسم المنتج'}</div>
                  {form.nameKo && <div style={{ fontSize: 12, color: '#6b7280' }}>{form.nameKo}</div>}
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{form.brand || 'العلامة التجارية'} • {form.category || '—'}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand)', marginTop: 2 }}>
                    {form.price ? `${Number(form.price).toFixed(2)} ₪` : '0.00 ₪'}
                  </div>
                </div>
              </div>
              {(form.nameEn || form.nameHe) && (
                <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 11, color: '#9ca3af' }}>
                  {form.nameEn && <span>EN: {form.nameEn}</span>}
                  {form.nameHe && <span>HE: {form.nameHe}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, borderTop: '2px solid #f3f4f6', paddingTop: 20 }}>
          <button type="submit" disabled={submitting} style={{ flex: 1, padding: '13px 20px', background: submitting ? '#9ca3af' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 15, cursor: submitting ? 'wait' : 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = 'var(--brand-dark)'; }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = 'var(--brand)'; }}
          >
            {submitting ? (imageFile ? '⏳ جاري رفع الصورة...' : '⏳ جاري الحفظ...') : editingId ? '💾 حفظ التعديلات' : '✅ إضافة المنتج للمتجر'}
          </button>
          <button type="button" onClick={() => { setForm(EMPTY_FORM); setErrors({}); setImageFile(null); setImagePreview(''); setEditingId(null); }}
            style={{ padding: '13px 24px', background: 'white', color: '#6b7280', border: '2px solid #e5e7eb', borderRadius: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            مسح النموذج
          </button>
        </div>
      </div>
    </form>
  );
}
