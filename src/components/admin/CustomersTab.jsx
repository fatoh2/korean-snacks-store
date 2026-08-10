import { useState, useMemo } from 'react';
import AdminBadge from './AdminBadge';
import { formatAdminDate } from './adminFormat';
import { inputStyle } from './adminStyles';

export default function CustomersTab({ orders, loading, loaded }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortDir, setSortDir] = useState('desc');

  const customers = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.phone || o.userId || '';
      if (!key) return;
      if (!map[key]) map[key] = { name: o.customerName || '', phone: o.phone || '', orders: 0, totalSpent: 0, lastDate: null, cities: new Set() };
      map[key].orders++;
      map[key].totalSpent += (o.total || 0);
      if (o.customerName) map[key].name = o.customerName;
      const d = new Date(o.date);
      if (!map[key].lastDate || d > map[key].lastDate) map[key].lastDate = d;
      if (o.address?.city) map[key].cities.add(o.address.city);
    });
    return Object.values(map).map(c => ({ ...c, cities: [...c.cities] }));
  }, [orders]);

  const filtered = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'totalSpent') cmp = a.totalSpent - b.totalSpent;
      else if (sortBy === 'orders') cmp = a.orders - b.orders;
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'lastDate') cmp = (a.lastDate || 0) - (b.lastDate || 0);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [customers, search, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const sortIcon = (field) => sortBy === field ? (sortDir === 'desc' ? ' ▼' : ' ▲') : '';

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 15 }}>⏳ جاري تحميل البيانات...</div>;
  if (!loaded) return null;

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const repeatCustomers = customers.filter(c => c.orders > 1).length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '👥', label: 'إجمالي العملاء', value: customers.length, color: 'var(--brand-blue)', bg: '#eff6ff' },
          { icon: '🔄', label: 'عملاء متكررون', value: repeatCustomers, color: '#7c3aed', bg: '#f5f3ff' },
          { icon: '💰', label: 'إجمالي الإنفاق', value: `${totalRevenue.toFixed(0)} ₪`, color: 'var(--brand)', bg: 'var(--brand-soft)' },
          { icon: '📊', label: 'متوسط لكل عميل', value: `${customers.length ? (totalRevenue / customers.length).toFixed(0) : 0} ₪`, color: '#16a34a', bg: '#f0fdf4' },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: `1px solid ${bg}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>{label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
        <input type="text" placeholder="ابحث بالاسم أو الهاتف..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle(false), paddingRight: 38 }}
          onFocus={e => e.target.style.borderColor = 'var(--brand)'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 120px 120px', gap: 0, minWidth: 640, background: '#f8f9fb', borderBottom: '2px solid #e5e7eb', padding: '12px 20px', fontSize: 12, fontWeight: 800, color: '#6b7280' }}>
          <span onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>الزبون{sortIcon('name')}</span>
          <span>الهاتف</span>
          <span onClick={() => toggleSort('orders')} style={{ cursor: 'pointer' }}>الطلبات{sortIcon('orders')}</span>
          <span onClick={() => toggleSort('totalSpent')} style={{ cursor: 'pointer' }}>الإنفاق{sortIcon('totalSpent')}</span>
          <span onClick={() => toggleSort('lastDate')} style={{ cursor: 'pointer' }}>آخر طلب{sortIcon('lastDate')}</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>لا يوجد عملاء مطابقون</div>
        ) : filtered.map((c, i) => (
          <div key={c.phone} style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 100px 120px 120px',
            gap: 0, minWidth: 640, padding: '12px 20px', alignItems: 'center',
            background: i % 2 === 0 ? 'white' : '#fafafa',
            borderBottom: '1px solid #f3f4f6',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.name || 'بدون اسم'}
                {c.orders > 1 && <AdminBadge color="#7c3aed" bg="#f5f3ff">🔄 متكرر</AdminBadge>}
              </div>
              {c.cities.length > 0 && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>📍 {c.cities.join(', ')}</div>}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', direction: 'ltr' }}>{c.phone}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand-blue)' }}>{c.orders}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)' }}>{c.totalSpent.toFixed(2)} ₪</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {c.lastDate ? formatAdminDate(c.lastDate) : '—'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
        {filtered.length} من {customers.length} عميل
      </div>
    </div>
  );
}
