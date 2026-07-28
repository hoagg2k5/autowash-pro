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
import { formatVietnamLicensePlate, isValidVietnamLicensePlate } from '../utils/licensePlateHelper.js';

export const getDashboard = async (req, res) => {
  try {

    const userId = req.params.id;

    // Phân quyền: Chỉ cho phép tài khoản của chính họ hoặc admin truy cập
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập thông tin này." });
    }

    const [user, vehicles, bookings, pointsHistory, rules] = await Promise.all([
      User.findOne({ id: userId }),
      Vehicle.find({ userId }),
      Booking.find({ userId }).sort({ createdAt: -1 }),
      PointHistory.find({ userId }).sort({ createdAt: -1 }),
      LoyaltyRules.findOne({})
    ]);
    
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    // Create lookup map of vehicles by id
    const vehicleMap = {};
    vehicles.forEach(v => {
      vehicleMap[v.id] = v;
    });

    const populatedBookings = bookings.map(b => {
      const bObj = b.toObject ? b.toObject() : b;
      const vehicle = vehicleMap[b.vehicleId];
      return {
        ...bObj,
        licensePlate: vehicle ? vehicle.licensePlate : (bObj.licensePlate || 'N/A'),
        carDetails: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.color})` : (bObj.carDetails || 'Xe đã gỡ khỏi TK')
      };
    });
    
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

    let { licensePlate, brand, model, color } = req.body;

    if (!licensePlate) {
      return res.status(400).json({ error: "Biển số xe là bắt buộc." });
    }

    // Tự động định dạng biển số xe Việt Nam (VD: 49A12345 -> 49A-123.45)
    const formattedPlate = formatVietnamLicensePlate(licensePlate);

    // Kiểm tra định dạng biển số xe Việt Nam
    if (!isValidVietnamLicensePlate(formattedPlate)) {
      return res.status(400).json({ error: "Biển số xe không đúng định dạng. Vui lòng nhập lại theo mẫu (Ví dụ: 30A-123.45 hoặc 30A12345)" });
    }

    const existingPlate = await Vehicle.findOne({ licensePlate: formattedPlate });
    if (existingPlate) {
      return res.status(400).json({ error: "Biển số xe này đã tồn tại trên hệ thống." });
    }

    const newVehicle = await addVehicle(userId, { licensePlate: formattedPlate, brand, model, color });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const userId = req.params.id;
    const vehicleId = req.params.vehicleId;

    if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền thao tác trên tài khoản này." });
    }

    const vehicle = await Vehicle.findOne({ id: vehicleId, userId });
    if (!vehicle) {
      return res.status(404).json({ error: "Không tìm thấy xe hoặc xe này không thuộc về bạn." });
    }

    const pendingBooking = await Booking.findOne({ 
      licensePlate: vehicle.licensePlate, 
      status: { $in: ['Pending', 'Confirmed', 'Waiting', 'In Progress'] } 
    });
    if (pendingBooking) {
      return res.status(400).json({ error: "Không thể xóa xe này vì đang có lịch đặt sắp diễn ra hoặc đang thực hiện." });
    }

    await Vehicle.deleteOne({ id: vehicleId, userId });
    res.json({ message: "Xóa xe thành công!" });
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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { fullName, email, phone, gender, dateOfBirth, avatar } = req.body;

    // Phân quyền: Người dùng chỉ được sửa thông tin của chính mình (hoặc admin)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này." });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy thông tin người dùng." });
    }

    if (fullName !== undefined) user.fullName = (fullName || '').trim();
    if (email !== undefined) user.email = (email || '').trim().toLowerCase();
    if (phone !== undefined) {
      const cleanPhone = (phone || '').trim();
      const existingUser = await User.findOne({ phone: cleanPhone, id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
      }
      user.phone = cleanPhone;
    }
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      message: "Cập nhật thông tin cá nhân thành công!",
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        loyaltyTier: user.loyaltyTier,
        pointsBalance: user.pointsBalance,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatar
      }
    });
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
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Lấy các UserVoucher đang khả dụng (chưa sử dụng) của khách hàng
    const userVouchers = await UserVoucher.find({ userId: user.id, isUsed: false });
    const ownedVoucherCodes = userVouchers.map(uv => uv.voucherCode);

    const vouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $gte: today },
      targetTiers: loyaltyTier,
      $or: [
        // 1. Voucher hệ thống: không bắt đầu bằng 'RW-' (không phải đổi điểm) và pointsRequired là 0 hoặc không có
        {
          code: { $not: /^RW-/i },
          $or: [
            { pointsRequired: { $exists: false } },
            { pointsRequired: 0 }
          ]
        },
        // 2. Voucher đổi điểm: mã nằm trong danh sách voucher người dùng đang sở hữu
        {
          code: { $in: ownedVoucherCodes }
        }
      ]
    });

    const vouchersWithCount = vouchers.map(v => {
      const vObj = v.toObject();
      const isRedeemed = vObj.code.toUpperCase().startsWith('RW-') || (vObj.pointsRequired > 0);
      if (isRedeemed) {
        vObj.pointsRequired = vObj.pointsRequired || 1; // Đảm bảo pointsRequired > 0 để frontend hiển thị nhãn "Đổi bằng điểm"
        const matchingUVs = userVouchers.filter(uv => uv.voucherCode === vObj.code);
        vObj.ownedCount = matchingUVs.length;
        vObj.uniqueCodes = matchingUVs.map(uv => uv.voucherCode);
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

    // Bảo mật: Chỉ người dùng hoặc Admin mới được phép đổi voucher
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này cho tài khoản khác." });
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

    // sinh mã ngẫu nhiên có tiền tố RW-
    const randomCode = 'RW-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Tạo bản ghi Voucher mới cho user này
    const newVoucher = new Voucher({
      code: randomCode,
      discountVnd: voucher.discountVnd,
      discountPercent: voucher.discountPercent,
      minSpent: voucher.minSpent,
      targetTiers: ['Member', 'Silver', 'Gold', 'Platinum'],
      isActive: true,
      pointsRequired: voucher.pointsRequired,
      expiryDate
    });
    await newVoucher.save({ session });

    // Add to UserVoucher collection
    const userVoucher = new UserVoucher({
      id: 'uv-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      voucherCode: randomCode,
      redeemedAt: new Date(),
      isUsed: false,
      expiryDate
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

    res.json({
      message: `Đổi voucher thành công! Mã của bạn là ${randomCode}. Đã dùng ${pointsRequired} điểm.`,
      pointsBalance: user.pointsBalance,
      voucher: { code: randomCode }
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
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

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
