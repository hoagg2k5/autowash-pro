import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID cũ (s-express, s-deluxe, s-premium)
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  details: [{ type: String }]
}, { id: false });

const Service = mongoose.model('Service', serviceSchema);
export default Service;
