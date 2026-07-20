import AuditLog from '../models/AuditLog.js';

export const listAuditLogs = async (req, res) => {
  try {
    const { action, adminName, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (action) {
      query.action = action;
    }
    if (adminName) {
      query.adminName = { $regex: adminName, $options: 'i' };
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
