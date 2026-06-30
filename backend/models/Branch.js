import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên chi nhánh (định danh liên kết dạng String)
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
});

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
