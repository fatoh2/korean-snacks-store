export function calculateOrderTotals(subtotal, promoPercent = 0) {
  const shipping = subtotal >= 100 ? 0 : 15;
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
