// utils/idUtils.js
// Utility helpers for dealing with composite/slug IDs returned by the backend
// Example formats we may encounter:
//   "cleaning-414"  "production-52"  99
// We always want the numeric primary key portion for API URLs.

/**
 * Extract the numeric primary key from a composite slug or already-numeric id.
 * @param {string|number} value The id string returned by the API or a plain number.
 * @returns {number} The numeric primary key. If extraction fails it returns NaN.
 */
export function extractNumericId(value) {
  if (value == null) return NaN;
  if (typeof value === 'number') return value;
  // Keep only trailing digits, e.g. "cleaning-414" -> "414"
  const match = String(value).match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : NaN;
}

/**
 * Convenience check to ensure we never send slugs to the backend.
 * Throws an error if the id cannot be resolved.
 */
export function requireNumericId(value, contextMsg = '') {
  const id = extractNumericId(value);
  if (Number.isNaN(id)) {
    throw new Error(`Unable to resolve numeric ID from "${value}"${contextMsg ? ` (${contextMsg})` : ''}`);
  }
  return id;
}
