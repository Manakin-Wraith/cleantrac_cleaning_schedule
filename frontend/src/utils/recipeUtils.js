/**
 * Parse a raw quantity value (number or string) to float.
 * Returns 0 if parse fails.
 */
export const parseQuantity = (raw) => {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'number') return raw;
  // remove any non-numeric except dot and minus
  const cleaned = String(raw).replace(/[^0-9.+-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Scale a base quantity by the batch multiplier.
 * Both inputs can be string or number; returns Number rounded to 4 dp.
 */
export const scaleQty = (baseRaw, batchRaw = 1) => {
  const base = parseQuantity(baseRaw);
  const batch = parseQuantity(batchRaw) || 1;
  return Number((base * batch).toFixed(4));
};
