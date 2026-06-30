import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import PointHistory from '../models/PointHistory.js';
import LoyaltyRules from '../models/LoyaltyRules.js';
import Voucher from '../models/Voucher.js';
import UserVoucher from '../models/UserVoucher.js';
import { addVehicle } from '../db-helper.js';

export const getDashboard = async (req, res) => {
  try {

    const userId = req.params.id;

    // Phân quyền: Chỉ cho phép tài khoản của chính họ hoặc admin truy cập
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập thông tin này." });
    }

    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    const vehicles = await Vehicle.find({ userId });
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    
    // Create lookup map of vehicles by id
    const vehicleMap = {};
    vehicles.forEach(v => {
      vehicleMap[v.id] = v;
    });

    const populatedBookings = bookings.map(b => {
      const vehicle = vehicleMap[b.vehicleId];
      return {
        ...b.toObject(),
        licensePlate: vehicle ? vehicle.licensePlate : 'N/A',
        carDetails: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.color})` : 'N/A'
      };
    });

    const pointsHistory = await PointHistory.find({ userId }).sort({ createdAt: -1 });
    const rules = await LoyaltyRules.findOne({});
    
    const currentTier = user.loyaltyTier || 'Member';
    
    let nextTier = null;
    let nextThreshold = 0;
    let progressPercent = 100;

    if (currentTier === 'Member') {
      nextTier = 'Silver';
      nextThreshold = rules.tierSettings.Silver.spendThreshold;
    } else if (currentTier === 'Silver') {
      nextTier = 'Gold';
      nextThreshold = rules.tierSettings.Gold.spendThreshold;
    } else if (currentTier === 'Gold') {
      nextTier = 'Platinum';
      nextThreshold = rules.tierSettings.Platinum.spendThreshold;
    }

    if (nextTier) {
      const currentThreshold = rules.tierSettings[currentTier].spendThreshold;
      const range = nextThreshold - currentThreshold;
      const currentProgress = user.totalSpent - currentThreshold;
      progressPercent = Math.min(100, Math.max(0, Math.floor((currentProgress / range) * 100)));
    }

    res.json({
      user,
      vehicles,
      bookings: populatedBookings,
      pointsHistory,
      rules,
      tierProgress: {
        currentTier,
        nextTier,
        nextThreshold,
        progressPercent
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const userId = req.params.id;

    // Phân quyền: Chỉ cho phép tài khoản của chính họ hoặc admin/staff thêm xe
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền thao tác trên tài khoản này." });
    }

    const { licensePlate, brand, model, color } = req.body;

    if (!licensePlate) {
      return res.status(400).json({ error: "Biển số xe là bắt buộc." });
    }

    // Kiểm tra định dạng biển số xe Việt Nam
    const plateRegex = /^[0-9]{2}[A-Z0-9][- -]?[0-9]{4,5}$/;
    if (!plateRegex.test(licensePlate)) {
      return res.status(400).json({ error: "Biển số xe không đúng định dạng Việt Nam (Ví dụ: 30A-99999 hoặc 51F-1234)." });
    }

    const cleanedPlate = licensePlate.toUpperCase().trim();
    const existingPlate = await Vehicle.findOne({ licensePlate: cleanedPlate });
    if (existingPlate) {
      return res.status(400).json({ error: "Biển số xe này đã tồn tại trên hệ thống." });
    }

    const newVehicle = await addVehicle(userId, { licensePlate, brand, model, color });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Mật khẩu cũ và mật khẩu mới là bắt buộc." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }

    // Phân quyền: Người dùng chỉ được sửa mật khẩu của chính mình (hoặc admin)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này." });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy thông tin người dùng." });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))
      ? bcrypt.compareSync(oldPassword, user.password)
      : user.password === oldPassword;

    if (!isMatch) {
      return res.status(400).json({ error: "Mật khẩu cũ không chính xác." });
    }

    // Lưu mật khẩu mới đã băm
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyVouchers = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }
    const loyaltyTier = user.loyaltyTier || 'Member';
    const today = new Date().toLocaleDateString('sv-SE');

    // Lấy các UserVoucher đang khả dụng của khách hàng
    const userVouchers = await UserVoucher.find({ userId: user.id, status: 'Available' });
    const ownedVoucherIds = userVouchers.map(uv => uv.voucherId.toString());

    const vouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $gte: today },
      targetTiers: loyaltyTier,
      $or: [
        { pointsRequired: { $exists: false } },
        { pointsRequired: 0 },
        { _id: { $in: ownedVoucherIds } }
      ]
    });

    const vouchersWithCount = vouchers.map(v => {
      const vObj = v.toObject();
      const isRedeemed = vObj.pointsRequired > 0;
      if (isRedeemed) {
        vObj.ownedCount = userVouchers.filter(uv => uv.voucherId.toString() === vObj._id.toString()).length;
        // Gắn danh sách mã coupon chi tiết (uniqueCode) để khách hàng xem
        vObj.uniqueCodes = userVouchers
          .filter(uv => uv.voucherId.toString() === vObj._id.toString())
          .map(uv => uv.uniqueCode);
      } else {
        vObj.ownedCount = 1;
        vObj.uniqueCodes = [vObj.code];
      }
      return vObj;
    });

    try {
      fs.writeFileSync('debug_log.txt', JSON.stringify({
        userId: user.id,
        vouchers: vouchersWithCount.map(x => ({ code: x.code, id: x._id, ownedCount: x.ownedCount }))
      }, null, 2));
    } catch (e) {
      console.error("Log error:", e);
    }

    res.json(vouchersWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const redeemVoucher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, voucherId } = req.body;
    if (!userId || !voucherId) {
      return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ userId và voucherId." });
    }

    // Find User
    const user = await User.findOne({ id: userId }).session(session);
    if (!user) {
      throw new Error("Không tìm thấy thông tin người dùng.");
    }

    // Find Voucher
    const voucher = await Voucher.findById(voucherId).session(session);
    if (!voucher) {
      throw new Error("Không tìm thấy thông tin voucher.");
    }

    const pointsRequired = voucher.pointsRequired || 0;
    if (pointsRequired <= 0) {
      throw new Error("Voucher này không hỗ trợ đổi bằng điểm.");
    }

    if (user.pointsBalance < pointsRequired) {
      throw new Error("Số điểm tích lũy của bạn không đủ để đổi voucher này.");
    }

    // Deduct points
    user.pointsBalance -= pointsRequired;
    await user.save({ session });

    // Generate uniqueCode
    const uniqueCode = `${voucher.code}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Add to UserVoucher collection
    const userVoucher = new UserVoucher({
      userId: user.id,
      voucherId: voucher._id,
      uniqueCode,
      status: 'Available'
    });
    await userVoucher.save({ session });

    // Save Point History log
    const history = new PointHistory({
      id: 'ph-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      bookingId: null,
      type: 'Redeemed',
      points: pointsRequired,
      reason: `Đổi điểm lấy mã giảm giá ${voucher.code}`
    });
    await history.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Lấy lại danh sách voucher đã sở hữu (ID) để tương thích ngược
    const uvList = await UserVoucher.find({ userId: user.id, status: 'Available' });
    const ownedIds = uvList.map(uv => uv.voucherId);

    res.json({
      message: `Đổi voucher thành công! Mã của bạn là ${uniqueCode}. Đã dùng ${pointsRequired} điểm.`,
      pointsBalance: user.pointsBalance,
      ownedVouchers: ownedIds
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

export const getRedeemableVouchers = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }
    const loyaltyTier = user.loyaltyTier || 'Member';
    const today = new Date().toLocaleDateString('sv-SE');

    const vouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $gte: today },
      targetTiers: loyaltyTier,
      pointsRequired: { $gt: 0 }
    });

    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
