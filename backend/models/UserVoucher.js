import mongoose from 'mongoose';

const userVoucherSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Mã dạng uv-xxxxx
  userId: { type: String, required: true },
  voucherCode: { type: String, required: true },
  redeemedAt: { type: Date, default: Date.now },
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date },
  expiryDate: { type: String, required: true } // Định dạng YYYY-MM-DD
}, { id: false });

userVoucherSchema.index({ userId: 1 });
userVoucherSchema.index({ isUsed: 1 });
userVoucherSchema.index({ voucherCode: 1 });

const UserVoucher = mongoose.model('UserVoucher', userVoucherSchema);
export default UserVoucher;
