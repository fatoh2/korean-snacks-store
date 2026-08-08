import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { inputStyle, toastStyle } from './adminStyles';

const DEFAULT_CATEGORIES = [
  { name: 'رامن', emoji: '🍜', sortOrder: 0 },
  { name: 'رقائق', emoji: '🍟', sortOrder: 1 },
  { name: 'حلوى', emoji: '🍬', sortOrder: 2 },
  { name: 'مشروبات', emoji: '🧃', sortOrder: 3 },
  { name: 'بسكويت', emoji: '🍪', sortOrder: 4 },
  { name: 'كاندي', emoji: '🍭', sortOrder: 5 },
  { name: 'مجّات', emoji: '☕', sortOrder: 6 },
];

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', emoji: '🍜' });
  const [editingName, setEditingName] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const snap = await getDocs(collection(db, 'categories'));
      const arr = [];
      snap.forEach(d => arr.push({ name: d.id, ...d.data() }));
      const missingCategories = DEFAULT_CATEGORIES.filter(
        defaultCategory => !arr.some(category => category.name === defaultCategory.name),
      );
      if (arr.length > 0 && missingCategories.length > 0) {
        const batch = writeBatch(db);
        missingCategories.forEach(category => {
          batch.set(doc(db, 'categories', category.name), { emoji: category.emoji, sortOrder: category.sortOrder });
          arr.push(category);
        });
        await batch.commit();
      }
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      if (active) {
        if (arr.length === 0) {
          // Auto-seed
          const batch = writeBatch(db);
          DEFAULT_CATEGORIES.forEach(c => batch.set(doc(db, 'categories', c.name), { emoji: c.emoji, sortOrder: c.sortOrder }));
          await batch.commit();
          setCategories(DEFAULT_CATEGORIES);
        } else {
          setCategories(arr);
        }
        setLoading(false);
      }
    };
    load().catch(() => {
      if (active) {
        setCategories(DEFAULT_CATEGORIES);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const entry = { emoji: form.emoji, sortOrder: editingName ? (categories.find(c => c.name === editingName)?.sortOrder ?? categories.length) : categories.length };
    await setDoc(doc(db, 'categories', form.name.trim()), entry);

    if (editingName && editingName !== form.name.trim()) {
      await deleteDoc(doc(db, 'categories', editingName));
      setCategories(prev => [...prev.filter(c => c.name !== editingName), { name: form.name.trim(), ...entry }].sort((a, b) => a.sortOrder - b.sortOrder));
    } else if (editingName) {
      setCategories(prev => prev.map(c => c.name === editingName ? { name: form.name.trim(), ...entry } : c));
    } else {
      setCategories(prev => [...prev, { name: form.name.trim(), ...entry }]);
    }

    toast.success(editingName ? 'تم تحديث الفئة ✅' : 'تم إضافة الفئة ✅', { style: toastStyle });
    setForm({ name: '', emoji: '🍜' });
    setEditingName(null);
  };

  const handleDelete = async (name) => {
    await deleteDoc(doc(db, 'categories', name));
    setCategories(prev => prev.filter(c => c.name !== name));
    setConfirmDelete(null);
    toast.success(`تم حذف الفئة "${name}" ✅`, { style: toastStyle });
  };

  const moveCategory = async (name, direction) => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(c => c.name === name);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx], b = sorted[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, 'categories', a.name), { sortOrder: b.sortOrder });
    batch.update(doc(db, 'categories', b.name), { sortOrder: a.sortOrder });
    await batch.commit();

    setCategories(prev => {
      const next = prev.map(c => {
        if (c.name === a.name) return { ...c, sortOrder: b.sortOrder };
        if (c.name === b.name) return { ...c, sortOrder: a.sortOrder };
        return c;
      });
      return next.sort((x, y) => x.sortOrder - y.sortOrder);
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>جاري التحميل...</div>;

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h4 style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e', margin: '0 0 16px', paddingBottom: 10, borderBottom: '2px solid #f3f4f6' }}>
        📂 إدارة الفئات
      </h4>

      {/* Add/Edit form */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>اسم الفئة</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: صوصات" style={{ ...inputStyle(false), width: 160 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>الرمز</label>
          <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputStyle(false), width: 60, fontSize: 20, textAlign: 'center' }} />
        </div>
        <button onClick={handleSave} style={{ padding: '10px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          {editingName ? '💾 حفظ' : '➕ إضافة'}
        </button>
        {editingName && (
          <button onClick={() => { setEditingName(null); setForm({ name: '', emoji: '🍜' }); }} style={{ padding: '10px 14px', background: 'white', color: '#6b7280', border: '2px solid #e5e7eb', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            إلغاء
          </button>
        )}
      </div>

      {/* Categories list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fafafa', borderRadius: 10, border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 20 }}>{cat.emoji}</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{cat.name}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => moveCategory(cat.name, 'up')} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 11 }}>▲</button>
              <button onClick={() => moveCategory(cat.name, 'down')} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 11 }}>▼</button>
              {confirmDelete === cat.name ? (
                <>
                  <button onClick={() => handleDelete(cat.name)} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>تأكيد</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>إلغاء</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingName(cat.name); setForm({ name: cat.name, emoji: cat.emoji }); }} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #dbeafe', background: '#eff6ff', color: 'var(--brand-blue)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => setConfirmDelete(cat.name)} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', color: 'var(--brand)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
