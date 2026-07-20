export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Hỗ trợ kiểm thử và xác thực biển số xe toàn hệ thống
export const VIETNAMESE_PLATE_REGEX = /^[0-9]{2}[A-Z]-[0-9]{3,5}(\.[0-9]{2})?$/;
export const validateLicensePlate = (plate) => {
  const clean = plate.replace(/\s+/g, '').toUpperCase();
  return VIETNAMESE_PLATE_REGEX.test(clean);
};
