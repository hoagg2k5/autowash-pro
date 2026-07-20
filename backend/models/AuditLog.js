import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true }, // VD: ADJUST_POINTS, UPDATE_RULES, CREATE_BRANCH, DELETE_BRANCH, etc.
  details: { type: String, required: true }, // Chi tiết hoạt động
  ipAddress: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
