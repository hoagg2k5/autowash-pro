import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID cũ
  title: { type: String, required: true },
  description: { type: String, default: '' },
  discountPercentage: { type: Number, required: true },
  targetTiers: [{ type: String }],
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true }, // YYYY-MM-DD
  isActive: { type: Boolean, default: true }
});

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;
