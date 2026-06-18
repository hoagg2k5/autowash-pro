import express from 'express';
import { register, login, sendOtpEndpoint, resetPasswordEndpoint } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtpEndpoint);
router.post('/reset-password', resetPasswordEndpoint);

export default router;
