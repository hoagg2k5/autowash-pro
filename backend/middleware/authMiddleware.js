import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-autowash';

// Validate JWT Token Middleware
export const authenticateToken = (req, res, next) => {
  let token = null;

  // 1. Ưu tiên lấy token từ Cookie để đồng bộ phiên làm việc của trình duyệt (tránh login chồng chéo)
  if (req.headers.cookie) {
    const cookies = {};
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        cookies[parts[0]] = parts.slice(1).join('=');
      }
    });
    token = cookies['token'];
  }

  // 2. Dự phòng lấy token từ Authorization Header (Bearer Token)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  // 3. Hỗ trợ lấy token từ query parameter (cho tải tài liệu/hình ảnh)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  const expectedUserId = req.headers['x-expected-user-id'];
  console.log(`[AuthMiddleware] Request to: ${req.method} ${req.originalUrl || req.url}`);
  console.log(`[AuthMiddleware] X-Expected-User-Id: ${expectedUserId || 'none'}, Token: ${token ? 'present' : 'absent'}`);

  if (!token) {
    console.log(`[AuthMiddleware] Verification failed: Token absent`);
    return res.status(401).json({ error: "Yêu cầu đăng nhập để truy cập tài nguyên này." });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log(`[AuthMiddleware] Verification failed: JWT error: ${err.message}`);
      return res.status(401).json({ error: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
    }
    
    try {
      const user = await User.findOne({ id: decoded.id });
      if (!user) {
        console.log(`[AuthMiddleware] Verification failed: User ${decoded.id} not found in DB`);
        return res.status(401).json({ error: "Người dùng không tồn tại trên hệ thống." });
      }

      // Phát hiện đăng nhập chồng chéo chéo giữa các tab trên cùng trình duyệt
      if (expectedUserId && decoded.id !== expectedUserId) {
        console.log(`[AuthMiddleware] Verification failed: ID Mismatch! Decoded: ${decoded.id}, Expected: ${expectedUserId}`);
        return res.status(401).json({ error: "Phiên làm việc đã thay đổi do đăng nhập tài khoản khác." });
      }

      if (user.sessionSalt && decoded.sessionSalt && user.sessionSalt !== decoded.sessionSalt) {
        console.log(`[AuthMiddleware] Verification failed: Session salt mismatch`);
        return res.status(401).json({ error: "Tài khoản đã đăng nhập ở thiết bị khác." });
      }

      console.log(`[AuthMiddleware] Verification successful for user: ${decoded.id} (${decoded.role})`);
      req.user = decoded; // Attach user payload: { id, role }
      next();
    } catch (dbErr) {
      return res.status(500).json({ error: "Lỗi hệ thống khi xác thực tài khoản." });
    }
  });
};

// Role Checking Middleware Factory
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Chưa xác thực thông tin." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập chức năng này." });
    }

    next();
  };
};
