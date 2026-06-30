import mongoose from 'mongoose';

const baySchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Maintenance', 'Inactive'], 
    default: 'Active' 
  },
  description: { type: String, default: '' }
});

baySchema.index({ branch: 1, status: 1 });

const Bay = mongoose.model('Bay', baySchema);
export default Bay;
