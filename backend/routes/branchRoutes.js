import express from 'express';
import { 
  listBranches, 
  createBranch, 
  updateBranch, 
  deleteBranch 
} from '../controllers/branchController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Bất kỳ ai đăng nhập đều xem được danh sách chi nhánh
router.get('/', listBranches);

// Chỉ Admin mới được Thêm/Sửa/Xóa chi nhánh
router.post('/', authenticateToken, requireRole(['admin']), createBranch);
router.put('/:id', authenticateToken, requireRole(['admin']), updateBranch);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteBranch);

export default router;
