import express from 'express';
import { register, login, sendOtpEndpoint, resetPasswordEndpoint, getMe, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtpEndpoint);
router.post('/reset-password', resetPasswordEndpoint);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;
