import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-autowash';

// Validate JWT Token Middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  // Support token as query parameter for media/file downloads
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Yêu cầu đăng nhập để truy cập tài nguyên này." });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
    }
    
    try {
      const user = await User.findOne({ id: decoded.id });
      if (!user) {
        return res.status(401).json({ error: "Người dùng không tồn tại trên hệ thống." });
      }

      if (user.sessionSalt && decoded.sessionSalt && user.sessionSalt !== decoded.sessionSalt) {
        return res.status(401).json({ error: "Tài khoản đã đăng nhập ở thiết bị khác." });
      }

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
