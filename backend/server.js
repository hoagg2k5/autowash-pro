import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRouter from './routes/authRoutes.js';
import serviceRouter from './routes/serviceRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import customerRouter from './routes/customerRoutes.js';
import adminRouter from './routes/adminRoutes.js';

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
    origin: "*",
    methods: ["GET", "POST"]
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

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRouter);
app.use('/api/services', serviceRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/customers', customerRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Lỗi máy chủ nội bộ.' });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
