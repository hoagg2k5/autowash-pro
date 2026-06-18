import mongoose from 'mongoose';

const pointHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID cũ
  userId: { type: String, required: true },
  bookingId: { type: String, default: null }, // ID lịch đặt liên quan (nếu có)
  type: { type: String, enum: ['Earned', 'Redeemed'], required: true },
  points: { type: Number, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PointHistory = mongoose.model('PointHistory', pointHistorySchema);
export default PointHistory;
