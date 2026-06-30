import express from 'express';
import { 
  listBookings, 
  book, 
  confirm, 
  start, 
  updateNotes, 
  complete, 
  checkout,
  cancel, 
  getOccupancy, 
  getByPlate,
  validateVoucherEndpoint,
  submitFeedback,
  getBookingDetail,
  listActiveVouchers,
  payBooking,
  checkin,
  createWalkInBooking,
  undoCheckin,
  assignBay,
  redeemVoucher,
  listMyVouchers,
  assignStaff,
  listStaffForAssignment
} from '../controllers/bookingController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes require JWT authentication
router.use(authenticateToken);

router.get('/', listBookings);
router.get('/validate-voucher', validateVoucherEndpoint);
router.get('/vouchers/active', listActiveVouchers);
router.get('/vouchers/my', listMyVouchers);
router.get('/occupancy', getOccupancy);
router.get('/by-plate', requireRole(['admin', 'staff']), getByPlate);
router.get('/:id', getBookingDetail);

router.post('/book', book);
router.post('/walk-in', requireRole(['admin', 'staff']), createWalkInBooking);
router.post('/:id/pay', payBooking);
router.post('/:id/confirm', requireRole(['admin', 'staff']), confirm);
router.post('/:id/checkin', requireRole(['admin', 'staff']), checkin);
router.post('/:id/undo-checkin', requireRole(['admin', 'staff']), undoCheckin);
router.post('/:id/start', requireRole(['admin', 'staff']), start);
router.post('/:id/notes', requireRole(['admin', 'staff']), updateNotes);
router.post('/:id/assign-bay', requireRole(['admin', 'staff']), assignBay);
router.post('/complete/:id', requireRole(['admin', 'staff']), complete);
router.post('/:id/checkout', requireRole(['admin', 'staff']), checkout);
router.post('/cancel/:id', cancel);
router.post('/:id/feedback', submitFeedback);
router.post('/vouchers/redeem', redeemVoucher);
router.get('/staffs/list', listStaffForAssignment);
router.post('/:id/assign-staff', requireRole(['admin', 'staff']), assignStaff);

export default router;


