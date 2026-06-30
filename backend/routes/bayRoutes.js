import express from 'express';
import { listBays, createBay, updateBay, deleteBay } from '../controllers/bayController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các request yêu cầu đăng nhập
router.use(authenticateToken);

router.get('/', listBays);
router.post('/', requireRole(['admin']), createBay);
router.put('/:id', requireRole(['admin']), updateBay);
router.delete('/:id', requireRole(['admin']), deleteBay);

export default router;
