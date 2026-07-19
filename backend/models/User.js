import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Để tương thích với hệ thống cũ (id dạng chuỗi ngẫu nhiên)
  phone: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'customer'], required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  loyaltyTier: { type: String, enum: ['Member', 'Silver', 'Gold', 'Platinum'], default: 'Member' },
  isWalkInOnly: { type: Boolean, default: false },
  totalSpent: { type: Number, default: 0 },
  pointsBalance: { type: Number, default: 0 },
  pointsExpiredSoon: { type: Number, default: 0 },
  ownedVouchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }],
  tierExpiryDate: { type: Date },
  tierExpiryWarningSent: { type: Boolean, default: false },
  branch: { type: String }, // Tên chi nhánh cho tài khoản Staff/Branch Admin
  email: { type: String, unique: true, sparse: true }, // Email liên kết (bắt buộc khi đăng ký mới)
  sessionSalt: { type: String, default: '' },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Nam' },
  dateOfBirth: { type: String },
  avatar: { type: String, default: '' }
}, { id: false });

const User = mongoose.model('User', userSchema);
export default User;
