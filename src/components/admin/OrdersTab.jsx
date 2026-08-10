import { useState, useMemo } from 'react';
import { writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import AdminBadge from './AdminBadge';
import { ORDER_STATUS, inputStyle, toastStyle } from './adminStyles';
import { normalizeWhatsAppPhone } from '../../utils/order';
import { useLanguage } from '../../context/LanguageContext';
import { formatAdminDate, formatAdminDateTime, latinNumber } from './adminFormat';

export default function OrdersTab({ orders, setOrders, loading, loaded }) {
  const { tr } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const statusLabel = (status) => ({
    pending: tr('قيد الانتظار', 'Pending', 'ממתין'),
    confirmed: tr('تم التأكيد', 'Confirmed', 'אושר'),
    shipped: tr('تم الشحن', 'Shipped', 'נשלח'),
    delivered: tr('تم التوصيل', 'Delivered', 'נמסר'),
    cancelled: tr('ملغي', 'Cancelled', 'בוטל'),
  })[status] || status;

  // Repeat customer counts
  const customerCounts = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.phone || o.userId || '';
      if (key) map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [orders]);

  const orderCounts = useMemo(() => {
    const counts = { all: orders.length };
    Object.keys(ORDER_STATUS).forEach(s => { counts[s] = orders.filter(o => (o.status || 'pending') === s).length; });
    return counts;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    let result = filter === 'all' ? orders : orders.filter(o => (o.status || 'pending') === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q) ||
        (o.id || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filter, search]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const order = orders.find(item => item.id === orderId);
    const shouldNotify = order && (newStatus === 'confirmed' || newStatus === 'shipped');
    const whatsappWindow = shouldNotify ? window.open('', '_blank') : null;
    if (whatsappWindow) whatsappWindow.opener = null;
    const { updateDoc: ud } = await import('firebase/firestore');
    try {
      await ud(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (shouldNotify) {
        const phone = normalizeWhatsAppPhone(order.phone);
        if (!phone) {
          whatsappWindow?.close();
          toast.error(tr('تم تحديث الحالة، لكن رقم الهاتف غير صالح', 'Status updated, but the phone number is invalid', 'הסטטוס עודכן, אך מספר הטלפון אינו תקין'), { style: toastStyle });
          return;
        }
        const statusMessage = newStatus === 'confirmed'
          ? tr(
              `مرحباً ${order.customerName || ''}، تم تأكيد طلبك رقم #${order.id?.slice(0, 8)} من Lulu Tokki ✅\nسنتواصل معك عند شحن الطلب. شكراً لك!`,
              `Hello ${order.customerName || ''}, your Lulu Tokki order #${order.id?.slice(0, 8)} has been confirmed ✅\nWe will contact you when it ships. Thank you!`,
              `שלום ${order.customerName || ''}, ההזמנה שלך מ-Lulu Tokki מספר #${order.id?.slice(0, 8)} אושרה ✅\nנעדכן אותך כשהיא תישלח. תודה!`,
            )
          : tr(
              `مرحباً ${order.customerName || ''}، تم شحن طلبك رقم #${order.id?.slice(0, 8)} من Lulu Tokki 🚚\nالطلب في طريقه إليك!`,
              `Hello ${order.customerName || ''}, your Lulu Tokki order #${order.id?.slice(0, 8)} has shipped 🚚\nIt is on its way to you!`,
              `שלום ${order.customerName || ''}, ההזמנה שלך מ-Lulu Tokki מספר #${order.id?.slice(0, 8)} נשלחה 🚚\nהיא בדרך אליך!`,
            );
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(statusMessage)}`;
        if (whatsappWindow) whatsappWindow.location.href = url;
        else window.location.assign(url);
      }
    } catch {
      whatsappWindow?.close();
      toast.error(tr('فشل تحديث حالة الطلب', 'Failed to update order status', 'עדכון סטטוס ההזמנה נכשל'), { style: toastStyle });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setConfirmDelete(null);
      setExpanded(null);
      toast.success(tr('تم حذف الطلب', 'Order deleted', 'ההזמנה נמחקה'), { style: toastStyle });
    } catch {
      toast.error(tr('تعذر حذف الطلب', 'Could not delete the order', 'לא ניתן למחוק את ההזמנה'), { style: toastStyle });
    }
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.update(doc(db, 'orders', id), { status: bulkStatus }));
    await batch.commit();
    setOrders(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, status: bulkStatus } : o));
    toast.success(tr(`تم تحديث ${latinNumber(selectedIds.size)} طلب إلى "${statusLabel(bulkStatus)}" ✅`, `${latinNumber(selectedIds.size)} orders updated to "${statusLabel(bulkStatus)}" ✅`, `${latinNumber(selectedIds.size)} הזמנות עודכנו ל-"${statusLabel(bulkStatus)}" ✅`), { style: toastStyle });
    setSelectedIds(new Set());
    setBulkStatus('');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === visibleOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleOrders.map(o => o.id)));
    }
  };

  const openWhatsApp = (order) => {
    const phone = normalizeWhatsAppPhone(order.phone);
    if (!phone) {
      toast.error('رقم الهاتف غير صالح', { style: toastStyle });
      return;
    }
    const items = (order.items || []).map(i => `• ${i.emoji || ''} ${i.name} × ${i.quantity}`).join('\n');
    const msg = tr(
      `مرحباً ${order.customerName || ''},\n\nتفاصيل طلبك من Lulu Tokki:\n${items}\n\nالمجموع: ${(order.total || 0).toFixed(2)} ₪\nالحالة: ${statusLabel(order.status || 'pending')}\n\nشكراً لتسوقك معنا! 🐰`,
      `Hello ${order.customerName || ''},\n\nYour Lulu Tokki order details:\n${items}\n\nTotal: ${(order.total || 0).toFixed(2)} ₪\nStatus: ${statusLabel(order.status || 'pending')}\n\nThank you for shopping with us! 🐰`,
      `שלום ${order.customerName || ''},\n\nפרטי ההזמנה שלך מ-Lulu Tokki:\n${items}\n\nסה״כ: ${(order.total || 0).toFixed(2)} ₪\nסטטוס: ${statusLabel(order.status || 'pending')}\n\nתודה שקנית אצלנו! 🐰`,
    );
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const printOrder = (order) => {
    const items = (order.items || []).map(i =>
      `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee"><div style="display:flex;align-items:center;gap:8px">${i.imageUrl ? `<img src="${i.imageUrl}" alt="" style="width:38px;height:38px;object-fit:cover;border-radius:6px">` : `<span>${i.emoji || '🛍️'}</span>`}<span>${i.name}${i.variant ? `<small style="display:block;color:#777">${i.variant}</small>` : ''}</span></div></td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:left">${((i.price || 0) * i.quantity).toFixed(2)} ₪</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>فاتورة #${order.id?.slice(0, 8)}</title><style>body{font-family:Cairo,Tahoma,sans-serif;padding:30px;max-width:400px;margin:0 auto;color:#1a1a2e}h2{text-align:center;margin:0}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f8f9fb;padding:8px 10px;font-size:13px;text-align:right}td{font-size:13px}.total{font-size:18px;font-weight:800;text-align:center;margin:16px 0;color:#e88aa6}.footer{text-align:center;font-size:12px;color:#9ca3af;margin-top:24px;border-top:1px solid #eee;padding-top:12px}</style></head><body>
    <h2>🐰 Lulu Tokki</h2>
    <p style="text-align:center;color:#6b7280;font-size:13px;margin:4px 0 20px">فاتورة طلب</p>
    <div style="background:#f8f9fb;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px">
      <div><b>رقم الطلب:</b> ${order.id?.slice(0, 8)}</div>
      <div><b>${tr('التاريخ:', 'Date:', 'תאריך:')}</b> ${formatAdminDate(order.date)}</div>
      <div><b>الزبون:</b> ${order.customerName || ''}</div>
      <div><b>الهاتف:</b> <span dir="ltr">${order.phone || ''}</span></div>
      ${order.address ? `<div><b>العنوان:</b> ${[order.address.city, order.address.district, order.address.street, order.address.building].filter(Boolean).join(', ')}</div>` : ''}
    </div>
    <table><thead><tr><th style="text-align:right">المنتج</th><th style="text-align:center">الكمية</th><th style="text-align:left">المبلغ</th></tr></thead><tbody>${items}</tbody></table>
    <div style="font-size:13px;padding:8px 0;border-top:2px solid #f3f4f6">
      <div style="display:flex;justify-content:space-between"><span>المجموع الفرعي</span><span>${(order.subtotal || 0).toFixed(2)} ₪</span></div>
      ${(order.discount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a"><span>الخصم</span><span>-${order.discount.toFixed(2)} ₪</span></div>` : ''}
      <div style="display:flex;justify-content:space-between"><span>الشحن</span><span>${(order.shipping || 0).toFixed(2)} ₪</span></div>
    </div>
    <div class="total">الإجمالي: ${(order.total || 0).toFixed(2)} ₪</div>
    <div class="footer">شكراً لتسوقك مع Lulu Tokki 🐰<br/>باقة الغربية</div>
    </body></html>`;
    const w = window.open('', '_blank', 'width=420,height=600');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const exportCSV = () => {
    const headers = ['رقم الطلب', 'التاريخ', 'الزبون', 'الهاتف', 'المدينة', 'المنتجات', 'المجموع الفرعي', 'الخصم', 'الشحن', 'الإجمالي', 'الحالة', 'كود الخصم'];
    const rows = visibleOrders.map(o => [
      o.id || '', formatAdminDate(o.date),
      o.customerName || '', o.phone || '', o.address?.city || '',
      (o.items || []).map(i => `${i.name} ×${i.quantity}`).join(' | '),
      (o.subtotal || 0).toFixed(2), (o.discount || 0).toFixed(2),
      (o.shipping || 0).toFixed(2), (o.total || 0).toFixed(2),
      statusLabel(o.status || 'pending'),
      o.promoCode || '',
    ]);
    const csv = '﻿' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${visibleOrders.length} طلب ✅`, { style: toastStyle });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 15 }}>⏳ جاري تحميل الطلبات...</div>;
  if (!loaded) return null;

  return (
    <div>
      {/* Search + Export */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input type="text" placeholder={tr('ابحث بالاسم، الهاتف، أو رقم الطلب...', 'Search by name, phone, or order number...', 'חיפוש לפי שם, טלפון או מספר הזמנה...')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle(false), paddingRight: 38 }}
            onFocus={e => e.target.style.borderColor = 'var(--brand)'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        <button onClick={exportCSV} style={{ padding: '10px 18px', borderRadius: 10, border: '2px solid #d1fae5', background: '#ecfdf5', color: '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.color = '#059669'; }}
        >
          📥 {tr('تصدير CSV', 'Export CSV', 'ייצוא CSV')}
        </button>
        {selectedIds.size > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={selectedIds.size === visibleOrders.length} onChange={toggleAll} style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>{tr('تحديد الكل', 'Select all', 'בחירת הכול')}</span>
          </label>
        )}
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[['all', tr('الكل', 'All', 'הכול')], ...Object.keys(ORDER_STATUS).map(s => [s, statusLabel(s)])].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 16px', borderRadius: 20, border: '2px solid',
            borderColor: filter === key ? 'var(--brand)' : '#e5e7eb',
            background: filter === key ? 'var(--brand)' : 'white',
            color: filter === key ? 'white' : '#374151',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            {label}{orderCounts[key] > 0 ? ` (${latinNumber(orderCounts[key])})` : ''}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 14 }}>{tr('لا توجد طلبات مطابقة', 'No matching orders', 'לא נמצאו הזמנות מתאימות')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleOrders.map(order => {
            const status = order.status || 'pending';
            const sc = ORDER_STATUS[status] || ORDER_STATUS.pending;
            const isExpanded = expanded === order.id;
            const repeatCount = customerCounts[order.phone || order.userId || ''] || 0;
            const fullAddress = order.address
              ? [order.address.city, order.address.district, order.address.street, order.address.building].filter(Boolean).join('، ')
              : '';
            return (
              <div key={order.id} style={{ background: 'white', borderRadius: 16, border: selectedIds.has(order.id) ? '2px solid var(--brand)' : '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 8, flexShrink: 0 }}>{sc.icon} {statusLabel(status)}</span>
                  <div style={{ flex: 1, minWidth: 160, cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : order.id)}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {order.customerName || 'زبون'}
                      {repeatCount > 1 && <AdminBadge color="#7c3aed" bg="#f5f3ff">🔄 زبون متكرر ({repeatCount})</AdminBadge>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', direction: 'ltr' }}>{order.phone} • {formatAdminDate(order.date)}</div>
                  </div>
                  {order.address?.city && <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>📍 {order.address.city}</div>}
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand)', flexShrink: 0 }}>{(order.total || 0).toFixed(2)} ₪</div>
                  <span onClick={() => setExpanded(isExpanded ? null : order.id)} style={{ fontSize: 16, color: '#9ca3af', cursor: 'pointer' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px 18px', background: 'var(--bg)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 18 }}>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--brand)', marginBottom: 10 }}>👤 بيانات الزبون</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
                          <div><b>الاسم:</b> {order.customerName || 'غير مسجل'}</div>
                          <div><b>الهاتف:</b> <span dir="ltr">{order.phone || 'غير مسجل'}</span></div>
                          <div><b>معرّف المستخدم:</b> <span dir="ltr" style={{ fontSize: 11, wordBreak: 'break-all', color: 'var(--subtext)' }}>{order.userId || 'طلب ضيف'}</span></div>
                          {repeatCount > 1 && <div><b>عدد الطلبات:</b> {repeatCount}</div>}
                        </div>
                      </div>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--brand)', marginBottom: 10 }}>📍 عنوان التوصيل</div>
                        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>{fullAddress || 'لم يُسجّل عنوان'}</div>
                        {order.address && (
                          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--subtext)' }}>
                            المدينة: {order.address.city || '—'} · الحي: {order.address.district || '—'} · الشارع: {order.address.street || '—'} · المبنى: {order.address.building || '—'}
                          </div>
                        )}
                      </div>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--brand)', marginBottom: 10 }}>🧾 بيانات الطلب</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
                          <div><b>رقم الطلب:</b> <span dir="ltr" style={{ fontSize: 11, wordBreak: 'break-all' }}>{order.id}</span></div>
                          <div><b>{tr('التاريخ:', 'Date:', 'תאריך:')}</b> {formatAdminDateTime(order.date)}</div>
                          <div><b>{tr('الحالة:', 'Status:', 'סטטוס:')}</b> {sc.icon} {statusLabel(status)}</div>
                          <div><b>{tr('عدد المنتجات:', 'Item count:', 'מספר פריטים:')}</b> {latinNumber((order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0))}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 10 }}>🛍️ المنتجات المطلوبة</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                    {(order.items || []).map((item, i) => (
                      <div key={`${item.id || 'item'}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                        <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 10, overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand-soft), #fbf3df)', fontSize: 30 }}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (item.emoji || '🛍️')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 800 }}>{item.name || 'منتج بدون اسم'}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 5, fontSize: 11, color: 'var(--subtext)' }}>
                            <span>رقم المنتج: {item.id ?? '—'}</span>
                            {item.variant && <span style={{ background: 'var(--muted-bg)', padding: '1px 7px', borderRadius: 5 }}>الخيار: {item.variant}</span>}
                            <span>سعر الوحدة: {(item.price || 0).toFixed(2)} ₪</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: 64 }}>
                          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>الكمية</div>
                          <div style={{ fontWeight: 900, fontSize: 17, color: 'var(--text)' }}>× {item.quantity || 0}</div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)', minWidth: 82, textAlign: 'end' }}>{((item.price || 0) * (item.quantity || 0)).toFixed(2)} ₪</div>
                      </div>
                    ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, margin: '16px 0' }}>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--brand)', marginBottom: 8 }}>💰 ملخص الدفع</div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--subtext)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>المجموع الفرعي</span><b style={{ color: 'var(--text)' }}>{(order.subtotal || 0).toFixed(2)} ₪</b></div>
                          {(order.discount || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>الخصم</span><b style={{ color: '#16a34a' }}>-{order.discount.toFixed(2)} ₪</b></div>}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>الشحن</span><b style={{ color: 'var(--text)' }}>{(order.shipping || 0).toFixed(2)} ₪</b></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 7, fontSize: 15 }}><span style={{ fontWeight: 800, color: 'var(--text)' }}>الإجمالي</span><b style={{ color: 'var(--brand)' }}>{(order.total || 0).toFixed(2)} ₪</b></div>
                          <div><b>كود الخصم:</b> {order.promoCode || 'لا يوجد'}</div>
                          <div><b>طريقة الدفع:</b> الدفع عند الاستلام</div>
                        </div>
                      </div>
                      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--brand)', marginBottom: 8 }}>📝 ملاحظات الطلب</div>
                        <div style={{ fontSize: 13, color: order.notes ? 'var(--text)' : 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{order.notes || 'لا توجد ملاحظات'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {sc.next && (
                        <button onClick={() => handleUpdateStatus(order.id, sc.next)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          {ORDER_STATUS[sc.next].icon} {tr('تحديث إلى:', 'Update to:', 'עדכון ל:')} {statusLabel(sc.next)}
                        </button>
                      )}
                      {status !== 'cancelled' && status !== 'delivered' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} style={{ padding: '7px 18px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        ❌ {tr('إلغاء', 'Cancel order', 'ביטול הזמנה')}
                        </button>
                      )}
                      <button onClick={() => openWhatsApp(order)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#25d366', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        💬 {tr('واتساب', 'WhatsApp', 'WhatsApp')}
                      </button>
                      <button onClick={() => printOrder(order)} style={{ padding: '7px 18px', borderRadius: 8, border: '2px solid #dbeafe', background: '#eff6ff', color: 'var(--brand-blue)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        🖨️ {tr('طباعة', 'Print', 'הדפסה')}
                      </button>
                      {confirmDelete === order.id ? (
                        <>
                          <button onClick={() => handleDeleteOrder(order.id)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                            {tr('تأكيد الحذف', 'Confirm delete', 'אישור מחיקה')}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--subtext)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            {tr('إلغاء', 'Cancel', 'ביטול')}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(order.id)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          🗑️ {tr('حذف الطلب', 'Delete order', 'מחיקת הזמנה')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk status bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'white', borderTop: '2px solid var(--brand)', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e' }}>
            {selectedIds.size} طلب محدد
          </span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ ...inputStyle(false), width: 180 }}>
            <option value="">{tr('اختر الحالة...', 'Choose status...', 'בחירת סטטוס...')}</option>
            {Object.entries(ORDER_STATUS).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {statusLabel(key)}</option>
            ))}
          </select>
          <button onClick={handleBulkStatus} disabled={!bulkStatus} style={{
            padding: '10px 22px', background: bulkStatus ? 'var(--brand)' : '#d1d5db', color: 'white',
            border: 'none', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 14, cursor: bulkStatus ? 'pointer' : 'default',
          }}>
            ✅ {tr('تطبيق', 'Apply', 'החלה')}
          </button>
          <button onClick={() => { setSelectedIds(new Set()); setBulkStatus(''); }} style={{
            padding: '10px 18px', background: 'white', color: '#6b7280', border: '2px solid #e5e7eb',
            borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            {tr('إلغاء التحديد', 'Clear selection', 'ניקוי הבחירה')}
          </button>
        </div>
      )}
    </div>
  );
}
