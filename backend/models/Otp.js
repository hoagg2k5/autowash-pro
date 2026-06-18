import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['register', 'forgot-password'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // Tự động xóa sau 300 giây (5 phút)
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
