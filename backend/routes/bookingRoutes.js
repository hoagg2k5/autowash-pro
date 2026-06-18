import express from 'express';
import { 
  listBookings, 
  book, 
  confirm, 
  start, 
  updateNotes, 
  complete, 
  cancel, 
  getOccupancy, 
  getByPlate,
  validateVoucherEndpoint,
  submitFeedback,
  getBookingDetail,
  listActiveVouchers,
  payBooking
} from '../controllers/bookingController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes require JWT authentication
router.use(authenticateToken);

router.get('/', listBookings);
router.get('/validate-voucher', validateVoucherEndpoint);
router.get('/vouchers/active', listActiveVouchers);
router.get('/occupancy', getOccupancy);
router.get('/by-plate', requireRole(['admin', 'staff']), getByPlate);
router.get('/:id', getBookingDetail);

router.post('/book', book);
router.post('/:id/pay', payBooking);
router.post('/:id/confirm', requireRole(['admin', 'staff']), confirm);
router.post('/:id/start', requireRole(['admin', 'staff']), start);
router.post('/:id/notes', requireRole(['admin', 'staff']), updateNotes);
router.post('/complete/:id', requireRole(['admin', 'staff']), complete);
router.post('/cancel/:id', cancel);
router.post('/:id/feedback', submitFeedback);

export default router;

