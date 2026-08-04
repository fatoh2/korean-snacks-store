import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useProducts } from '../context/ProductsContext';
import AdminBadge from '../components/admin/AdminBadge';
import { EMPTY_FORM } from '../components/admin/adminStyles';
import ProductsListTab from '../components/admin/ProductsListTab';
import ProductFormTab from '../components/admin/ProductFormTab';
import PromoCodesTab from '../components/admin/PromoCodesTab';
import OrdersTab from '../components/admin/OrdersTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import CustomersTab from '../components/admin/CustomersTab';

export default function Admin() {
  const { products, addProduct, removeProduct, updateProduct, seedProducts } = useProducts();
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Shared orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Categories for product list
  const [categories, setCategories] = useState([
    { name: 'رامن', emoji: '🍜' }, { name: 'رقائق', emoji: '🍟' },
    { name: 'حلوى', emoji: '🍬' }, { name: 'مشروبات', emoji: '🧃' },
    { name: 'بسكويت', emoji: '🍪' },
  ]);

  useEffect(() => {
    getDocs(collection(db, 'categories')).then(snap => {
      const arr = [];
      snap.forEach(d => arr.push({ name: d.id, ...d.data() }));
      if (arr.length) {
        arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setCategories(arr);
      }
    });
  }, []);

  const loadOrders = async () => {
    if (ordersLoaded) return;
    setOrdersLoading(true);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(arr);
      setOrdersLoaded(true);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try { await seedProducts(); setSeeded(true); } finally { setSeeding(false); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      nameAr: p.nameAr || p.name?.replace(/\s*[가-힣]+.*$/, '').trim() || '',
      nameKo: p.nameKo || p.name?.match(/[가-힣].*/)?.[0] || '',
      nameEn: p.nameEn || '',
      nameHe: p.nameHe || '',
      description: p.description, price: String(p.price),
      category: p.category, emoji: p.emoji, brand: p.brand,
      weight: p.weight ?? '', servings: p.servings ?? '',
      heat: p.heat ?? 0, inStock: p.inStock ?? true,
      stock: p.stock != null ? String(p.stock) : '',
      tags: (p.tags ?? []).join(', '), variants: p.variants ?? [],
      imageUrl: p.imageUrl ?? '',
    });
    setTab('add');
  };

  const duplicateProduct = (p) => {
    setEditingId(null);
    const nameAr = p.nameAr || p.name?.replace(/\s*[가-힣]+.*$/, '').trim() || '';
    setForm({
      nameAr: nameAr + ' (نسخة)',
      nameKo: p.nameKo || p.name?.match(/[가-힣].*/)?.[0] || '',
      nameEn: p.nameEn ? p.nameEn + ' (Copy)' : '',
      nameHe: p.nameHe ? p.nameHe + ' (עותק)' : '',
      description: p.description, price: String(p.price),
      category: p.category, emoji: p.emoji, brand: p.brand,
      weight: p.weight ?? '', servings: p.servings ?? '',
      heat: p.heat ?? 0, inStock: p.inStock ?? true,
      stock: p.stock != null ? String(p.stock) : '',
      tags: (p.tags ?? []).join(', '), variants: p.variants ?? [],
      imageUrl: p.imageUrl ?? '',
    });
    setTab('add');
  };

  const handleRemove = async (id) => {
    await removeProduct(id);
  };

  const sortedProducts = [...products].sort((a, b) => (a.sortOrder ?? a.id * 10) - (b.sortOrder ?? b.id * 10));

  const TABS = [
    ['list', '📋 المنتجات'],
    ['add', editingId ? '✏️ تعديل' : '➕ إضافة منتج'],
    ['codes', '🎟️ أكواد الخصم'],
    ['orders', '🗂️ الطلبات'],
    ['analytics', '📊 الإحصاءات'],
    ['customers', '👥 العملاء'],
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 36 }}>⚙️</div>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 24, color: '#1a1a2e', margin: 0 }}>لوحة الإدارة</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>إدارة منتجات متجر Lulu Tokki</p>
        </div>
        <div style={{ marginRight: 'auto' }}>
          <AdminBadge color="var(--brand-blue)" bg="#eff6ff">{products.length} منتج إجمالاً</AdminBadge>
        </div>
      </div>

      {/* Seed banner */}
      {products.length === 0 && !seeded && (
        <div style={{ background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>⚠️ قاعدة البيانات فارغة</div>
            <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>لا يوجد منتجات في Firestore. اضغط لتعبئتها من الملف المحلي.</div>
          </div>
          <button onClick={handleSeed} disabled={seeding} style={{ padding: '10px 22px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 14, cursor: seeding ? 'wait' : 'pointer', opacity: seeding ? 0.7 : 1 }}>
            {seeding ? '⏳ جاري التعبئة...' : '📦 تعبئة قاعدة البيانات'}
          </button>
        </div>
      )}
      {seeded && (
        <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 14, padding: '14px 20px', marginBottom: 20, fontWeight: 700, color: '#166534' }}>
          ✅ تم تعبئة قاعدة البيانات بنجاح!
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'white', borderRadius: 12, padding: 4, border: '1px solid #e5e7eb', width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => {
            setTab(key);
            if (key === 'list') { setEditingId(null); setForm(EMPTY_FORM); setSearch(''); }
            if (key === 'analytics' || key === 'orders' || key === 'customers') loadOrders();
          }} style={{
            padding: '8px 20px', borderRadius: 9, border: 'none',
            background: tab === key ? 'var(--brand)' : 'transparent',
            color: tab === key ? 'white' : '#6b7280',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'list' && (
        <ProductsListTab
          products={sortedProducts}
          categories={categories}
          search={search}
          setSearch={setSearch}
          onEdit={startEdit}
          onDuplicate={duplicateProduct}
          onRemove={handleRemove}
          updateProduct={updateProduct}
        />
      )}

      {tab === 'add' && (
        <ProductFormTab
          key={`${editingId ?? 'new'}-${form.imageUrl || ''}`}
          products={products}
          editingId={editingId}
          setEditingId={setEditingId}
          form={form}
          setForm={setForm}
          onSwitchToList={() => setTab('list')}
          addProduct={addProduct}
          updateProduct={updateProduct}
        />
      )}

      {tab === 'codes' && <PromoCodesTab />}

      {tab === 'orders' && (
        <OrdersTab
          orders={orders}
          setOrders={setOrders}
          loading={ordersLoading}
          loaded={ordersLoaded}
        />
      )}

      {tab === 'analytics' && (
        <AnalyticsTab
          orders={orders}
          products={products}
          loading={ordersLoading}
          loaded={ordersLoaded}
        />
      )}

      {tab === 'customers' && (
        <CustomersTab
          orders={orders}
          loading={ordersLoading}
          loaded={ordersLoaded}
        />
      )}
    </div>
  );
}
