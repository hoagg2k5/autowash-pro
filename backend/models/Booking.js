import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID cũ
  userId: { type: String, required: true },
  vehicleId: { type: String, required: true },
  bookingDate: { type: String, required: true }, // Dạng YYYY-MM-DD
  timeSlot: { type: String, required: true },
  servicePackage: { type: String, required: true },
  branch: { type: String, required: true },
  bay: { type: String },
  status: { type: String, enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending' },
  price: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  totalPaid: { type: Number, required: true },
  promoCode: { type: String, default: '' },
  voucherDiscount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
  notes: { type: String, default: '' }, // Ý kiến nhân viên
  rating: { type: Number }, // Điểm đánh giá (1-5)
  comment: { type: String }, // Lời bình luận của khách
  feedbackCreatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { id: false });

bookingSchema.index({ userId: 1 });
bookingSchema.index({ vehicleId: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ branch: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
