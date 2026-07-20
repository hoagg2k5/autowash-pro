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
  listMyUsedVouchers,
  assignStaff,
  listStaffForAssignment,
  vnpayIpn,
  vnpayVerify,
  refundBooking,
  getPaymentUrlForExistingBooking
} from '../controllers/bookingController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoints for VNPay (do not require authenticateToken)
router.get('/vnpay-ipn', vnpayIpn);
router.get('/vnpay-verify', vnpayVerify);

// All booking routes require JWT authentication
router.use(authenticateToken);

router.get('/', listBookings);
router.get('/validate-voucher', validateVoucherEndpoint);
router.get('/vouchers/active', listActiveVouchers);
router.get('/vouchers/my', listMyVouchers);
router.get('/vouchers/my-used', listMyUsedVouchers);
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
router.post('/:id/refund', requireRole(['admin']), refundBooking);
router.get('/:id/pay-url', getPaymentUrlForExistingBooking);

export default router;


