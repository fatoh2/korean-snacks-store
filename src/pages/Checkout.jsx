import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { calculateOrderTotals, isValidPhone } from '../utils/order';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 6 }}>
        {label} {required && <span style={{ color: 'var(--brand)' }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>⚠ {error}</div>}
    </div>
  );
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { t, tr, isRTL } = useLanguage();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null); // snapshot before cart is cleared
  const [form, setForm] = useState({ name: '', phone: '', city: '', district: '', street: '', building: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, pct }
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  const { shipping, discount: discountAmt, total } = calculateOrderTotals(totalPrice, appliedPromo?.pct);

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    try {
      const snap = await getDoc(doc(db, 'promoCodes', code));
      if (snap.exists() && snap.data().active) {
        setAppliedPromo({ code, pct: snap.data().pct });
        setPromoError('');
        setPromoInput('');
      } else {
        setPromoError(t('promoInvalid'));
      }
    } catch {
      setPromoError(t('promoInvalid'));
    } finally {
      setPromoChecking(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
    setPromoInput('');
  };

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('nameRequired');
    if (!form.phone.trim()) e.phone = t('phoneRequired');
    else if (!isValidPhone(form.phone)) e.phone = t('phoneInvalid');
    if (!form.city.trim()) e.city = t('cityRequired');
    if (!form.street.trim()) e.street = t('streetRequired');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error(t('formError'), { style: { fontFamily: 'Cairo, sans-serif', direction: isRTL ? 'rtl' : 'ltr' } });
      return;
    }

    const sep = '━━━━━━━━━━━━━━━';
    const itemLines = items.map(item => `• ${item.name} × ${item.quantity} — ₪${(item.price * item.quantity).toFixed(2)}`).join('\n');
    const shippingText = shipping === 0
      ? tr('مجاني 🎉', 'Free 🎉', 'חינם 🎉')
      : `₪${shipping.toFixed(2)}`;
    const addressParts = [form.city, form.district, form.street, form.building].filter(Boolean).join(', ');

    const msg = tr(
      [
        '🛒 طلب جديد - Lulu Tokki',
        sep,
        `👤 الاسم: ${form.name}`,
        `📱 التلفون: ${form.phone}`,
        `📍 العنوان: ${addressParts}`,
        form.notes.trim() ? `📝 ملاحظات: ${form.notes}` : '',
        sep,
        '🛍️ المنتجات:',
        itemLines,
        sep,
        `💰 المجموع الفرعي: ₪${totalPrice.toFixed(2)}`,
        appliedPromo ? `🎟️ كود الخصم (${appliedPromo.code} — ${appliedPromo.pct}%): -₪${discountAmt.toFixed(2)}` : '',
        `🚚 الشحن: ${shippingText}`,
        `✅ الإجمالي: ₪${total.toFixed(2)}`,
      ].filter(line => line !== '').join('\n'),
      [
        '🛒 New Order - Lulu Tokki',
        sep,
        `👤 Name: ${form.name}`,
        `📱 Phone: ${form.phone}`,
        `📍 Address: ${addressParts}`,
        form.notes.trim() ? `📝 Notes: ${form.notes}` : '',
        sep,
        '🛍️ Items:',
        itemLines,
        sep,
        `💰 Subtotal: ₪${totalPrice.toFixed(2)}`,
        appliedPromo ? `🎟️ Promo (${appliedPromo.code} — ${appliedPromo.pct}%): -₪${discountAmt.toFixed(2)}` : '',
        `🚚 Shipping: ${shippingText}`,
        `✅ Total: ₪${total.toFixed(2)}`,
      ].filter(line => line !== '').join('\n'),
      [
        '🛒 הזמנה חדשה - Lulu Tokki',
        sep,
        `👤 שם: ${form.name}`,
        `📱 טלפון: ${form.phone}`,
        `📍 כתובת: ${addressParts}`,
        form.notes.trim() ? `📝 הערות: ${form.notes}` : '',
        sep,
        '🛍️ מוצרים:',
        itemLines,
        sep,
        `💰 סכום ביניים: ₪${totalPrice.toFixed(2)}`,
        appliedPromo ? `🎟️ קוד הנחה (${appliedPromo.code} — ${appliedPromo.pct}%): -₪${discountAmt.toFixed(2)}` : '',
        `🚚 משלוח: ${shippingText}`,
        `✅ סה״כ: ₪${total.toFixed(2)}`,
      ].filter(line => line !== '').join('\n'),
    );

    try {
      await addDoc(collection(db, 'orders'), {
        userId: user?.id || null,
        customerName: form.name,
        phone: form.phone,
        address: { city: form.city, district: form.district, street: form.street, building: form.building },
        notes: form.notes || '',
        items: items.map(({ id, name, emoji, imageUrl, price, quantity, variant }) => ({ id, name, emoji, imageUrl: imageUrl || null, price, quantity, variant: variant?.label || null })),
        subtotal: totalPrice,
        discount: discountAmt,
        promoCode: appliedPromo?.code || null,
        shipping,
        total,
        status: 'pending',
        date: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to save order', e);
      toast.error(tr(
        'تعذر حفظ الطلب. لم يتم إرسال الطلب؛ يرجى المحاولة مرة أخرى.',
        'The order could not be saved. Nothing was submitted; please try again.',
        'לא ניתן היה לשמור את ההזמנה. ההזמנה לא נשלחה; נסו שוב.',
      ), { style: { fontFamily: 'Cairo, sans-serif', direction: isRTL ? 'rtl' : 'ltr' } });
      return;
    }

    window.open(`https://wa.me/972547639465?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmittedOrder({
      items: [...items],
      subtotal: totalPrice,
      discountAmt,
      appliedPromo,
      shipping,
      total,
      form: { ...form },
    });
    setSubmitted(true);
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (items.length === 0 && !submitted) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: '#1a1a2e', marginBottom: 10 }}>{t('emptyCartTitle')}</h2>
        <Link to="/store" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--brand)', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
          {t('backToStoreBtn')}
        </Link>
      </div>
    );
  }

  if (submitted && submittedOrder) {
    const o = submittedOrder;
    const addressParts = [o.form.city, o.form.district, o.form.street, o.form.building].filter(Boolean).join(', ');
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ background: 'var(--card)', borderRadius: 24, padding: '40px 32px', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 12 }}>📲</div>
          <h2 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 8 }}>{t('orderSuccessTitle')}</h2>
          <p style={{ color: 'var(--subtext)', fontSize: 16, lineHeight: 1.6, marginBottom: 6 }}>
            {tr(
              <>شكراً لك يا <strong style={{ color: 'var(--text)' }}>{o.form.name}</strong>! 🎉</>,
              <>Thank you, <strong style={{ color: 'var(--text)' }}>{o.form.name}</strong>! 🎉</>,
              <>תודה רבה, <strong style={{ color: 'var(--text)' }}>{o.form.name}</strong>! 🎉</>,
            )}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            {tr(
              'تم فتح واتساب لإرسال طلبك. سنتواصل معك قريباً لتأكيد التفاصيل. 🐰',
              "WhatsApp opened to send your order. We'll reach out shortly to confirm. 🐰",
              'וואטסאפ נפתח לשליחת ההזמנה. ניצור איתך קשר בקרוב לאישור הפרטים. 🐰',
            )}
          </p>

          {/* Order details card */}
          <div style={{ background: 'var(--muted-bg)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
              {tr('🛍️ ملخص طلبك', '🛍️ Your Order Summary', '🛍️ סיכום ההזמנה')}
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {o.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, gap: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: 600, minWidth: 0 }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt="" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      : <span style={{ flexShrink: 0 }}>{item.emoji}</span>}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name} × {item.quantity}</span>
                  </span>
                  <span style={{ color: 'var(--text)', fontWeight: 700, flexShrink: 0 }}>{(item.price * item.quantity).toFixed(2)} {t('currency')}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {o.discountAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a' }}>
                  <span>{t('discountLabel')} ({o.appliedPromo?.pct}%)</span>
                  <span style={{ fontWeight: 700 }}>-{o.discountAmt.toFixed(2)} {t('currency')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--subtext)' }}>
                <span>{t('shippingLabel')}</span>
                <span style={{ fontWeight: 700, color: o.shipping === 0 ? '#16a34a' : 'var(--text)' }}>
                  {o.shipping === 0 ? t('freeLabel') : `${o.shipping.toFixed(2)} ${t('currency')}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                <span>{t('totalLabel')}</span>
                <span style={{ color: 'var(--brand)' }}>{o.total.toFixed(2)} {t('currency')}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {tr('* السعر يشمل מע"מ', '* Price includes VAT', '* המחיר כולל מע״מ')}
              </div>
            </div>

            {/* Delivery address */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--subtext)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>📍 {tr('عنوان التوصيل:', 'Delivery to:', 'כתובת למשלוח:')}</span>{' '}
              {addressParts}
            </div>
          </div>

          <Link
            to="/store"
            style={{ display: 'inline-block', padding: '14px 40px', background: 'var(--brand)', color: 'white', textDecoration: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16 }}
          >
            {t('shopAgainBtn')}
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle = (hasError) => ({
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `2px solid ${hasError ? 'var(--brand)' : '#e5e7eb'}`,
    fontFamily: 'Cairo, sans-serif', fontSize: 14, color: '#1a1a2e',
    outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s',
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link to="/cart" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>{t('backToCartLink')}</Link>
        <span style={{ color: '#d1d5db' }}>|</span>
        <h1 style={{ fontWeight: 800, fontSize: 24, color: '#1a1a2e', margin: 0 }}>{t('checkoutTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 24, alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal Info */}
            <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginTop: 0, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f3f4f6' }}>
                {t('personalInfoTitle')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label={t('fullNameLabel')} required error={errors.name}>
                    <input value={form.name} onChange={e => update('name', e.target.value)} placeholder={t('namePlaceholder')} style={inputStyle(!!errors.name)} onFocus={e => { if (!errors.name) e.target.style.borderColor = 'var(--brand)'; }} onBlur={e => { if (!errors.name) e.target.style.borderColor = '#e5e7eb'; }} />
                  </Field>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label={t('phoneLabel')} required error={errors.phone}>
                    <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder={t('phonePlaceholder')} type="tel" style={inputStyle(!!errors.phone)} onFocus={e => { if (!errors.phone) e.target.style.borderColor = 'var(--brand)'; }} onBlur={e => { if (!errors.phone) e.target.style.borderColor = '#e5e7eb'; }} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginTop: 0, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f3f4f6' }}>
                {t('addressTitle')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <Field label={t('cityLabel')} required error={errors.city}>
                  <input value={form.city} onChange={e => update('city', e.target.value)} placeholder={t('cityPlaceholder')} style={inputStyle(!!errors.city)} onFocus={e => { if (!errors.city) e.target.style.borderColor = 'var(--brand)'; }} onBlur={e => { if (!errors.city) e.target.style.borderColor = '#e5e7eb'; }} />
                </Field>
                <Field label={t('districtLabel')}>
                  <input value={form.district} onChange={e => update('district', e.target.value)} placeholder={t('districtPlaceholder')} style={inputStyle(false)} onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                <Field label={t('streetLabel')} required error={errors.street}>
                  <input value={form.street} onChange={e => update('street', e.target.value)} placeholder={t('streetPlaceholder')} style={inputStyle(!!errors.street)} onFocus={e => { if (!errors.street) e.target.style.borderColor = 'var(--brand)'; }} onBlur={e => { if (!errors.street) e.target.style.borderColor = '#e5e7eb'; }} />
                </Field>
                <Field label={t('buildingLabel')}>
                  <input value={form.building} onChange={e => update('building', e.target.value)} placeholder={t('buildingPlaceholder')} style={inputStyle(false)} onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label={t('notesLabel')}>
                    <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder={t('notesPlaceholder')} rows={3} style={{ ...inputStyle(false), resize: 'vertical', fontFamily: 'Cairo, sans-serif' }} onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: 84 }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginTop: 0, marginBottom: 20 }}>{t('orderSummaryTitle')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, maxHeight: 280, overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-soft), #fbf3df)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
                      {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }} className="line-clamp-2">{item.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>× {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1a1a2e', flexShrink: 0 }}>{(item.price * item.quantity).toFixed(2)} {t('currency')}</div>
                  </div>
                ))}
              </div>
              {/* Promo code */}
              <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: 14, marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>{t('promoCodeLabel')}</div>
                {appliedPromo ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                      🎟️ {appliedPromo.code} — {appliedPromo.pct}% {tr('خصم', 'off', 'הנחה')}
                    </span>
                    <button type="button" onClick={removePromo} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', padding: '2px 6px' }}>
                      {t('removePromoBtn')}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                      placeholder={t('promoPlaceholder')}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: `2px solid ${promoError ? 'var(--brand)' : '#e5e7eb'}`, fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#1a1a2e', outline: 'none', background: 'white' }}
                      onFocus={e => { if (!promoError) e.target.style.borderColor = 'var(--brand)'; }}
                      onBlur={e => { if (!promoError) e.target.style.borderColor = '#e5e7eb'; }}
                    />
                    <button type="button" onClick={applyPromo} disabled={promoChecking} style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: promoChecking ? '#9ca3af' : '#1a1a2e', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: promoChecking ? 'wait' : 'pointer', flexShrink: 0 }}>
                      {promoChecking ? '...' : t('applyPromoBtn')}
                    </button>
                  </div>
                )}
                {promoError && <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 5, fontWeight: 600 }}>⚠ {promoError}</div>}
              </div>

              <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
                  <span>{t('subtotal')}</span>
                  <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{totalPrice.toFixed(2)} {t('currency')}</span>
                </div>
                {discountAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16a34a' }}>
                    <span style={{ fontWeight: 600 }}>{t('discountLabel')} ({appliedPromo.pct}%)</span>
                    <span style={{ fontWeight: 700 }}>-{discountAmt.toFixed(2)} {t('currency')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
                  <span>{t('shippingLabel')}</span>
                  <span style={{ fontWeight: 700, color: shipping === 0 ? '#16a34a' : '#1a1a2e' }}>
                    {shipping === 0 ? t('freeLabel') : `${shipping.toFixed(2)} ${t('currency')}`}
                  </span>
                </div>
                <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800 }}>
                    <span style={{ color: '#1a1a2e' }}>{t('totalLabel')}</span>
                    <span style={{ color: 'var(--brand)' }}>{total.toFixed(2)} {t('currency')}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {tr('* السعر يشمل מע"מ', '* Price includes VAT', '* המחיר כולל מע״מ')}
                  </div>
                </div>
              </div>
              <button type="submit" style={{ width: '100%', marginTop: 20, padding: '14px 20px', background: '#25d366', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1aab52'}
                onMouseLeave={e => e.currentTarget.style.background = '#25d366'}
              >
                {t('confirmOrderBtn')}
              </button>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#9ca3af', fontSize: 12 }}>
                <span>🔒</span><span>{t('secureInfo')}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
