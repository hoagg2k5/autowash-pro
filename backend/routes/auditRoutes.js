import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Chỉ Admin mới được xem nhật ký hoạt động hệ thống
router.get('/', authenticateToken, requireRole(['admin']), listAuditLogs);

export default router;
