import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Mã viết hoa (ví dụ: AUTOWASH50)
  discountVnd: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  minSpent: { type: Number, default: 0 },
  targetTiers: [{ type: String }],
  isActive: { type: Boolean, default: true },
  pointsRequired: { type: Number, default: 0 },
  expiryDate: { type: String, required: true } // Định dạng YYYY-MM-DD
});

const Voucher = mongoose.model('Voucher', voucherSchema);
export default Voucher;
