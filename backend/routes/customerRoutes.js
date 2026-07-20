import express from 'express';
import { 
  getDashboard, 
  createVehicle, 
  deleteVehicle,
  changePassword, 
  updateProfile,
  getMyVouchers, 
  redeemVoucher, 
  getRedeemableVouchers 
} from '../controllers/customerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect customer dashboard and vehicle creation routes
router.use(authenticateToken);

router.get('/my-vouchers', getMyVouchers);
router.get('/redeemable-vouchers', getRedeemableVouchers);
router.post('/redeem-voucher', redeemVoucher);
router.get('/:id/dashboard', getDashboard);
router.post('/:id/vehicles', createVehicle);
router.delete('/:id/vehicles/:vehicleId', deleteVehicle);
router.post('/:id/change-password', changePassword);
router.put('/:id/profile', updateProfile);

export default router;
