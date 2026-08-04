import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { toastStyle } from './adminStyles';

export default function PromoCodesTab() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', pct: 10, active: true });
  const [errors, setErrors] = useState({});
  const [editingCode, setEditingCode] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let active = true;
    getDocs(collection(db, 'promoCodes')).then(snap => {
      const arr = [];
      snap.forEach(d => arr.push({ code: d.id, ...d.data() }));
      arr.sort((a, b) => a.code.localeCompare(b.code));
      if (active) setPromoCodes(arr);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    const errs = {};
    const code = form.code.trim().toUpperCase();
    if (!code) errs.code = 'الكود مطلوب';
    if (!form.pct || Number(form.pct) < 1 || Number(form.pct) > 100) errs.pct = 'نسبة 1–100';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const entry = { pct: Number(form.pct), active: form.active };
    await setDoc(doc(db, 'promoCodes', code), entry);
    if (editingCode && editingCode !== code) {
      await deleteDoc(doc(db, 'promoCodes', editingCode));
      setPromoCodes(prev => [...prev.filter(c => c.code !== editingCode), { code, ...entry }].sort((a, b) => a.code.localeCompare(b.code)));
    } else if (editingCode) {
      setPromoCodes(prev => prev.map(c => c.code === code ? { code, ...entry } : c));
    } else {
      setPromoCodes(prev => [...prev.filter(c => c.code !== code), { code, ...entry }].sort((a, b) => a.code.localeCompare(b.code)));
    }
    toast.success(`${editingCode ? 'تم تحديث' : 'تم إضافة'} الكود ${code} ✅`, { style: toastStyle });
    setForm({ code: '', pct: 10, active: true });
    setErrors({});
    setEditingCode(null);
  };

  const handleDelete = async (code) => {
    await deleteDoc(doc(db, 'promoCodes', code));
    setPromoCodes(prev => prev.filter(c => c.code !== code));
    setConfirmDelete(null);
    toast.success(`تم حذف الكود ${code} ✅`, { style: toastStyle });
  };

  const toggleActive = async (code, current) => {
    await updateDoc(doc(db, 'promoCodes', code), { active: !current });
    setPromoCodes(prev => prev.map(c => c.code === code ? { ...c, active: !current } : c));
  };

  const seedDefaults = async () => {
    const defaults = [
      { code: 'HANOOK10', pct: 10, active: true },
      { code: 'HANOOK20', pct: 20, active: true },
      { code: 'WELCOME', pct: 15, active: true },
      { code: 'KOREA', pct: 5, active: true },
    ];
    await Promise.all(defaults.map(({ code, ...rest }) => setDoc(doc(db, 'promoCodes', code), rest)));
    setPromoCodes(defaults);
    toast.success('تم إضافة الأكواد الافتراضية ✅', { style: toastStyle });
  };

  return (
    <div>
      {/* Form */}
      <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '2px solid #f3f4f6' }}>
          {editingCode ? `✏️ تعديل الكود: ${editingCode}` : '➕ إضافة كود خصم'}
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 5 }}>الكود <span style={{ color: 'var(--brand)' }}>*</span></label>
            <input value={form.code} onChange={e => { setForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setErrors(v => ({ ...v, code: '' })); }}
              placeholder="مثال: SAVE15" style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${errors.code ? 'var(--brand)' : '#e5e7eb'}`, fontFamily: 'Cairo, sans-serif', fontSize: 14, color: '#1a1a2e', outline: 'none', width: 160, background: 'white', letterSpacing: 1 }}
              onFocus={e => { if (!errors.code) e.target.style.borderColor = 'var(--brand)'; }} onBlur={e => { if (!errors.code) e.target.style.borderColor = '#e5e7eb'; }} />
            {errors.code && <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 3, fontWeight: 600 }}>⚠ {errors.code}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 5 }}>نسبة الخصم % <span style={{ color: 'var(--brand)' }}>*</span></label>
            <input type="number" min="1" max="100" value={form.pct} onChange={e => { setForm(f => ({ ...f, pct: e.target.value })); setErrors(v => ({ ...v, pct: '' })); }}
              style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${errors.pct ? 'var(--brand)' : '#e5e7eb'}`, fontFamily: 'Cairo, sans-serif', fontSize: 14, color: '#1a1a2e', outline: 'none', width: 100, background: 'white' }}
              onFocus={e => { if (!errors.pct) e.target.style.borderColor = 'var(--brand)'; }} onBlur={e => { if (!errors.pct) e.target.style.borderColor = '#e5e7eb'; }} />
            {errors.pct && <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 3, fontWeight: 600 }}>⚠ {errors.pct}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
            <div onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: form.active ? 'var(--brand)' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'right 0.2s', right: form.active ? 3 : 23, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>فعّال</span>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
            <button onClick={handleSave} style={{ padding: '10px 22px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {editingCode ? '💾 حفظ' : '✅ إضافة'}
            </button>
            {editingCode && (
              <button onClick={() => { setEditingCode(null); setForm({ code: '', pct: 10, active: true }); setErrors({}); }} style={{ padding: '10px 18px', background: 'white', color: '#6b7280', border: '2px solid #e5e7eb', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>إلغاء</button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>⏳ جاري التحميل...</div>
      ) : promoCodes.length === 0 ? (
        <div style={{ background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>لا توجد أكواد خصم بعد</div>
            <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>يمكنك إضافة الأكواد يدوياً أو تعبئة الأكواد الافتراضية.</div>
          </div>
          <button onClick={seedDefaults} style={{ padding: '10px 22px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>🎟️ إضافة الأكواد الافتراضية</button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', gap: 0, minWidth: 460, background: '#f8f9fb', borderBottom: '2px solid #e5e7eb', padding: '12px 20px', fontSize: 12, fontWeight: 800, color: '#6b7280' }}>
            <span>الكود</span><span>الخصم</span><span>الحالة</span><span>إجراء</span>
          </div>
          {promoCodes.map((c, i) => (
            <div key={c.code} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', gap: 0, minWidth: 460, padding: '12px 20px', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
            >
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e', letterSpacing: 1 }}>{c.code}</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand)' }}>{c.pct}%</span>
              <div>
                <div onClick={() => toggleActive(c.code, c.active)} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: c.active ? 'var(--brand)' : '#d1d5db', position: 'relative', transition: 'background 0.2s', display: 'inline-block' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'right 0.2s', right: c.active ? 3 : 23, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {confirmDelete === c.code ? (
                  <>
                    <button onClick={() => handleDelete(c.code)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>تأكيد</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>إلغاء</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingCode(c.code); setForm({ code: c.code, pct: c.pct, active: c.active }); setErrors({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '2px solid #dbeafe', background: '#eff6ff', color: 'var(--brand-blue)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-blue)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = 'var(--brand-blue)'; }}>✏️</button>
                    <button onClick={() => setConfirmDelete(c.code)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '2px solid #fee2e2', background: 'var(--brand-soft)', color: 'var(--brand)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand-soft)'; e.currentTarget.style.color = 'var(--brand)'; }}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div style={{ padding: '10px 20px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
            {promoCodes.length} كود — {promoCodes.filter(c => c.active).length} فعّال
          </div>
        </div>
      )}
    </div>
  );
}
