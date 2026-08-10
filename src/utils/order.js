export function calculateOrderTotals(subtotal, promoPercent = 0) {
  const shipping = 15;
  const safePercent = Math.min(100, Math.max(0, Number(promoPercent) || 0));
  const discount = +(subtotal * safePercent / 100).toFixed(2);

  return {
    shipping,
    discount,
    total: +(subtotal - discount + shipping).toFixed(2),
  };
}

export function isValidPhone(phone) {
  return /^[0-9+\s-]{7,15}$/.test(phone.trim());
}

export function normalizeWhatsAppPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('5')) return `972${digits}`;
  return digits;
}
