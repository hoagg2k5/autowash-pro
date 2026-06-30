import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const logAdminAction = async (req, action, details) => {
  try {
    const adminId = req.user?.id || 'Unknown';
    let adminName = 'Admin';
    if (req.user?.id) {
      const user = await User.findOne({ id: req.user.id });
      if (user) {
        adminName = user.fullName;
      }
    }
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';

    const log = new AuditLog({
      adminId,
      adminName,
      action,
      details,
      ipAddress
    });
    await log.save();
    console.log(`[AUDIT LOG] ${adminName} (${adminId}): ${action} - ${details}`);
  } catch (error) {
    console.error("Lỗi khi ghi nhật ký hoạt động hệ thống (Audit Log):", error.message);
  }
};
