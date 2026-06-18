import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Khóa phụ tương thích với hệ thống cũ
  userId: { type: String, required: true }, // Lưu User.id chuỗi để tương thích tốt nhất
  licensePlate: { type: String, required: true, unique: true },
  brand: { type: String, default: 'Khác' },
  model: { type: String, default: 'Khác' },
  color: { type: String, default: 'Khác' }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
