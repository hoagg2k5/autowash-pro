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
  assignedStaffId: { type: String, default: null },
  bookingType: { type: String, enum: ['Pre-booked', 'Walk-in'], default: 'Pre-booked' },
  assignedBay: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['Waiting', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'], default: 'Waiting' },
  checkInTime: { type: Date },
  washStartTime: { type: Date },
  appliedVoucherId: { type: String, default: null },
  price: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  totalPaid: { type: Number, required: true },
  promoCode: { type: String, default: '' },
  voucherDiscount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Refund Pending', 'Refunded'], default: 'Unpaid' },
  vnpTransactionNo: { type: String, default: null },
  vnpPayDate: { type: String, default: null },

  notes: { type: String, default: '' }, // Ý kiến nhân viên
  rating: { type: Number }, // Điểm đánh giá (1-5)
  comment: { type: String }, // Lời bình luận của khách
  feedbackCreatedAt: { type: Date },
  cancelReason: { type: String, default: '' },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { id: false });

bookingSchema.index({ userId: 1 });
bookingSchema.index({ vehicleId: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ branch: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
