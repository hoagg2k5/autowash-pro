import express from 'express';
import { getDashboard, createVehicle, changePassword } from '../controllers/customerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect customer dashboard and vehicle creation routes
router.use(authenticateToken);

router.get('/:id/dashboard', getDashboard);
router.post('/:id/vehicles', createVehicle);
router.post('/:id/change-password', changePassword);

export default router;
