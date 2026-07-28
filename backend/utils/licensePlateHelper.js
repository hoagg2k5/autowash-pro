/**
 * Helper utility for Vietnam License Plate formatting and validation
 */

export function formatVietnamLicensePlate(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let clean = raw.trim().toUpperCase();

  // If already matches standard 5-digit formatted (e.g. 49A-123.45 or 51LD-123.45)
  if (/^[0-9]{2}[A-Z]{1,2}-[0-9]{3}\.[0-9]{2}$/.test(clean)) {
    return clean;
  }

  // If already matches standard 4-digit formatted (e.g. 49A-1234 or 51LD-1234)
  if (/^[0-9]{2}[A-Z]{1,2}-[0-9]{4}$/.test(clean)) {
    return clean;
  }

  // Strip all non-alphanumeric chars
  const alphaNum = clean.replace(/[^A-Z0-9]/g, '');

  // Case 1: 2 digits + 1-2 letters + 5 digits (e.g. 49A12345 -> 49A-123.45, 51LD12345 -> 51LD-123.45)
  const match5 = alphaNum.match(/^([0-9]{2}[A-Z]{1,2})([0-9]{3})([0-9]{2})$/);
  if (match5) {
    return `${match5[1]}-${match5[2]}.${match5[3]}`;
  }

  // Case 2: 2 digits + 1-2 letters + 4 digits (e.g. 51F1234 -> 51F-1234)
  const match4 = alphaNum.match(/^([0-9]{2}[A-Z]{1,2})([0-9]{4})$/);
  if (match4) {
    return `${match4[1]}-${match4[2]}`;
  }

  return clean;
}

export function isValidVietnamLicensePlate(plate) {
  if (!plate || typeof plate !== 'string') return false;
  const cleaned = plate.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z][A-Z0-9]?[-.\s]?[0-9]{3,4}(\.[0-9]{2}|[0-9]{1,2})?$/;
  return regex.test(cleaned);
}
