import express from 'express';
import { 
  listCustomers, 
  adjustPoints, 
  getRules, 
  updateRules, 
  listPromotions, 
  createPromotion, 
  togglePromotion, 
  runReview, 
  simulateData, 
  exportData,
  listStaffs,
  createStaff,
  editStaff,
  removeStaff,
  listVouchers,
  createVoucher,
  editVoucher,
  removeVoucher,
  removeCustomer
} from '../controllers/adminController.js';
import { createService, editService, removeService } from '../controllers/serviceController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all admin endpoints. Must be logged in and have 'admin' role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Customer management
router.get('/customers', listCustomers);
router.post('/customers/:id/adjust-points', adjustPoints);
router.delete('/customers/:id', removeCustomer);

// Rules management
router.get('/rules', getRules);
router.post('/rules', updateRules);

// Promotions management
router.get('/promotions', listPromotions);
router.post('/promotions', createPromotion);
router.post('/promotions/:id/toggle', togglePromotion);

// Voucher management
router.get('/vouchers', listVouchers);
router.post('/vouchers', createVoucher);
router.put('/vouchers/:id', editVoucher);
router.delete('/vouchers/:id', removeVoucher);

// Service management (Administrative CRUD)
router.post('/services', createService);
router.put('/services/:id', editService);
router.delete('/services/:id', removeService);

// Simulation & review
router.post('/run-review', runReview);
router.post('/simulate-data', simulateData);
router.get('/export-data', exportData);

// Staff management (Super Admin only, checked via branch restriction)
router.get('/staffs', listStaffs);
router.post('/staffs', createStaff);
router.put('/staffs/:id', editStaff);
router.delete('/staffs/:id', removeStaff);

export default router;
