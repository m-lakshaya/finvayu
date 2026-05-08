/**
 * Format a rupee amount into a human-readable string.
 * Scales to Cr / L / K for readability. Guards against
 * Infinity, NaN, and scientific-notation blowout.
 *
 * @param {number|string} n  Raw amount (may come straight from DB / parseFloat)
 * @param {Object} [opts]
 * @param {number} [opts.decimals=2]  Decimal places for Cr/L/K display
 * @returns {string}  e.g. "₹12.50 Cr", "₹4.25 L", "₹85 K", "₹9,500"
 */
export const fmtCurrency = (n = 0, { decimals = 2 } = {}) => {
  const num = Number(n);
  if (!isFinite(num) || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(decimals)} Cr`;
  if (abs >= 100_000)   return `${sign}₹${(abs / 100_000).toFixed(decimals)} L`;
  if (abs >= 1_000)     return `${sign}₹${(abs / 1_000).toFixed(1)} K`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
};

/**
 * Inline human-readable preview for live input fields.
 * Returns null when value is empty or zero.
 *
 * @param {string|number} raw  Current field value
 * @returns {string|null}
 */
export const loanPreview = (raw) => {
  const n = parseFloat(raw);
  if (!n || !isFinite(n)) return null;
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
