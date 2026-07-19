import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix lỗi kết nối MongoDB Atlas (querySrv ECONNREFUSED) trên một số đường truyền mạng bằng cách ưu tiên IPv4 và thiết lập DNS Google
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn("Không thể thiết lập máy chủ DNS tuỳ chỉnh:", e.message);
}

process.on('uncaughtException', (err) => {
  console.error('LỖI KHÔNG ĐƯỢC XỬ LÝ (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('LỖI PROMISE KHÔNG ĐƯỢC XỬ LÝ (Unhandled Rejection) tại:', promise, 'Lý do:', reason);
});

import authRouter from './routes/authRoutes.js';
import serviceRouter from './routes/serviceRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import customerRouter from './routes/customerRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import bayRouter from './routes/bayRoutes.js';
import branchRouter from './routes/branchRoutes.js';
import auditRouter from './routes/auditRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import { assignBay } from './controllers/bookingController.js';
import { authenticateToken } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Kết nối cơ sở dữ liệu MongoDB Atlas
if (!MONGODB_URI) {
  console.error("CẢNH BÁO: MONGODB_URI không được định nghĩa trong tệp .env!");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Kết nối tới MongoDB Atlas thành công!"))
    .catch(err => console.error("Lỗi kết nối tới MongoDB Atlas:", err));
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set Socket.io instance on express app so controllers can access it
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user room: user-${userId}`);
    }
  });

  socket.on('join_staff_admin_room', () => {
    socket.join('staff-admin');
    console.log(`Socket ${socket.id} joined staff-admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Standard Middlewares
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRouter);
app.use('/api/services', serviceRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/customers', customerRouter);
app.use('/api/customer', customerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bays', bayRouter);
app.use('/api/branches', branchRouter);
app.use('/api/admin/audit-logs', auditRouter);
app.use('/api/chat', chatRouter);
app.post('/api/staff/assign-bay', authenticateToken, assignBay);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Lỗi máy chủ nội bộ.' });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
