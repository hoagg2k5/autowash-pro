import bcrypt from 'bcryptjs';
import { 
  manualAdjustPoints, 
  runMonthlyReview 
} from '../db-helper.js';
import { generateSyntheticLogs, convertToCSV } from '../synthetic-generator.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import LoyaltyRules from '../models/LoyaltyRules.js';
import Promotion from '../models/Promotion.js';
import Voucher from '../models/Voucher.js';

// Cache cho logs giả lập
let currentSyntheticLogs = [];

export const listCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' });
    const list = [];
    
    for (const u of customers) {
      const vehicles = await Vehicle.find({ userId: u.id });
      const userBookings = await Booking.find({ userId: u.id });
      
      list.push({
        ...u.toObject(),
        vehicles,
        bookingCount: userBookings.length,
        completedCount: userBookings.filter(b => b.status === 'Completed').length
      });
    }
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adjustPoints = async (req, res) => {
  try {
    const { newPoints, pointsChange, reason } = req.body;
    const finalPoints = newPoints !== undefined ? newPoints : pointsChange;
    if (finalPoints === undefined) return res.status(400).json({ error: "Số điểm mới là bắt buộc." });
    
    const user = await manualAdjustPoints(req.params.id, finalPoints, reason);
    res.json({ message: "Điều chỉnh điểm thưởng khách hàng thành công.", pointsBalance: user.pointsBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRules = async (req, res) => {
  try {
    const rules = await LoyaltyRules.findOne({});
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRules = async (req, res) => {
  try {
    const newRules = req.body;
    const rules = await LoyaltyRules.findOneAndUpdate({}, newRules, { new: true, upsert: true });
    res.json({ message: "Cập nhật cấu hình tích điểm & nâng hạng thành công.", loyaltyRules: rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({});
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPromotion = async (req, res) => {
  try {
    const { title, description, discountPercentage, targetTiers, startDate, endDate } = req.body;

    if (!title || !discountPercentage || !targetTiers || targetTiers.length === 0) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề, phần trăm giảm giá và đối tượng áp dụng." });
    }

    const newPromo = new Promotion({
      id: 'promo-' + Math.random().toString(36).substr(2, 9),
      title,
      description: description || '',
      discountPercentage: Number(discountPercentage),
      targetTiers,
      startDate: startDate || new Date().toLocaleDateString('sv-SE'),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE'),
      isActive: true
    });

    await newPromo.save();
    res.status(201).json(newPromo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const togglePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findOne({ id: req.params.id });
    if (!promo) return res.status(404).json({ error: "Không tìm thấy khuyến mãi" });

    promo.isActive = !promo.isActive;
    await promo.save();
    res.json(promo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const runReview = async (req, res) => {
  try {
    const updatedCount = await runMonthlyReview();
    res.json({ message: `Đã hoàn thành rà soát tháng. Cập nhật hạng cho ${updatedCount} khách hàng.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const simulateData = (req, res) => {
  try {
    const { count } = req.body;
    const numRecords = parseInt(count) || 2000;
    
    currentSyntheticLogs = generateSyntheticLogs(numRecords);
    
    res.json({
      message: `Tạo thành công ${currentSyntheticLogs.length} bản ghi log mô phỏng.`,
      recordCount: currentSyntheticLogs.length,
      sample: currentSyntheticLogs.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportData = (req, res) => {
  try {
    const { format } = req.query;
    
    if (currentSyntheticLogs.length === 0) {
      currentSyntheticLogs = generateSyntheticLogs(2000);
    }

    if (format === 'csv') {
      const csvData = convertToCSV(currentSyntheticLogs);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=autowash_research_logs.csv');
      return res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=autowash_research_logs.json');
      return res.send(JSON.stringify(currentSyntheticLogs, null, 2));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listStaffs = async (req, res) => {
  try {
    if (req.user.branch) {
      return res.status(403).json({ error: "Chỉ Quản trị viên hệ thống (Super Admin) mới được quyền truy cập danh sách nhân viên." });
    }

    const staffs = await User.find({
      role: { $in: ['staff', 'admin'] },
      id: { $ne: 'admin-id' }
    });
    res.json(staffs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    if (req.user.branch) {
      return res.status(403).json({ error: "Chỉ Quản trị viên hệ thống (Super Admin) mới được quyền thêm nhân viên." });
    }

    const { phone, fullName, password, role, branch } = req.body;
    if (!phone || !fullName || !password || !role || !branch) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin: SĐT, Họ tên, Mật khẩu, Vai trò, Chi nhánh." });
    }

    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Số điện thoại không đúng định dạng Việt Nam." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự trở lên." });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: "Số điện thoại này đã đăng ký tài khoản khác." });
    }

    const newStaff = new User({
      id: 'staff-' + Math.random().toString(36).substr(2, 9),
      phone,
      fullName,
      role,
      password: bcrypt.hashSync(password, 10),
      createdAt: new Date(),
      loyaltyTier: 'Member',
      totalSpent: 0,
      pointsBalance: 0,
      pointsExpiredSoon: 0,
      tierExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      branch
    });

    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editStaff = async (req, res) => {
  try {
    if (req.user.branch) {
      return res.status(403).json({ error: "Chỉ Quản trị viên hệ thống (Super Admin) mới được quyền cập nhật nhân viên." });
    }

    const staffId = req.params.id;
    const { fullName, phone, role, branch, password } = req.body;

    const staff = await User.findOne({ id: staffId });
    if (!staff) return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    if (phone) {
      const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Số điện thoại không đúng định dạng Việt Nam." });
      }
      const existing = await User.findOne({ phone, id: { $ne: staffId } });
      if (existing) return res.status(400).json({ error: "Số điện thoại này đã được sử dụng." });
      staff.phone = phone;
    }

    if (fullName) staff.fullName = fullName;
    if (role) staff.role = role;
    if (branch) staff.branch = branch;
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự trở lên." });
      }
      staff.password = bcrypt.hashSync(password, 10);
    }

    await staff.save();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeStaff = async (req, res) => {
  try {
    if (req.user.branch) {
      return res.status(403).json({ error: "Chỉ Quản trị viên hệ thống (Super Admin) mới được quyền xóa nhân viên." });
    }

    const staffId = req.params.id;
    if (staffId === 'admin-id') {
      return res.status(400).json({ error: "Không thể xóa tài khoản Quản trị tối cao chính." });
    }

    const result = await User.deleteOne({ id: staffId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    res.json({ message: "Xóa tài khoản nhân viên thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({});
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createVoucher = async (req, res) => {
  try {
    const { code, discountVnd, discountPercent, minSpent, targetTiers, isActive, expiryDate } = req.body;

    if (!code || !expiryDate) {
      return res.status(400).json({ error: "Mã voucher và Ngày hết hạn là bắt buộc." });
    }

    const uppercaseCode = code.toUpperCase().trim();

    const existing = await Voucher.findOne({ code: uppercaseCode });
    if (existing) {
      return res.status(400).json({ error: "Mã voucher này đã tồn tại." });
    }

    const newVoucher = new Voucher({
      code: uppercaseCode,
      discountVnd: Number(discountVnd) || 0,
      discountPercent: Number(discountPercent) || 0,
      minSpent: Number(minSpent) || 0,
      targetTiers: targetTiers || ['Member', 'Silver', 'Gold', 'Platinum'],
      isActive: isActive !== undefined ? isActive : true,
      expiryDate
    });

    await newVoucher.save();
    res.status(201).json(newVoucher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editVoucher = async (req, res) => {
  try {
    const voucherId = req.params.id;
    const { code, discountVnd, discountPercent, minSpent, targetTiers, isActive, expiryDate } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ error: "Không tìm thấy voucher này." });
    }

    if (code) {
      const uppercaseCode = code.toUpperCase().trim();
      const existing = await Voucher.findOne({ code: uppercaseCode, _id: { $ne: voucherId } });
      if (existing) {
        return res.status(400).json({ error: "Mã voucher này đã được sử dụng." });
      }
      voucher.code = uppercaseCode;
    }

    if (discountVnd !== undefined) voucher.discountVnd = Number(discountVnd);
    if (discountPercent !== undefined) voucher.discountPercent = Number(discountPercent);
    if (minSpent !== undefined) voucher.minSpent = Number(minSpent);
    if (targetTiers !== undefined) voucher.targetTiers = targetTiers;
    if (isActive !== undefined) voucher.isActive = isActive;
    if (expiryDate !== undefined) voucher.expiryDate = expiryDate;

    await voucher.save();
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeVoucher = async (req, res) => {
  try {
    const voucherId = req.params.id;
    const result = await Voucher.deleteOne({ _id: voucherId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Không tìm thấy voucher này." });
    }
    res.json({ message: "Xóa mã giảm giá thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;

    // 1. Cascade delete vehicles of the customer
    await Vehicle.deleteMany({ userId: customerId });

    // 2. Cascade delete bookings of the customer
    await Booking.deleteMany({ userId: customerId });

    // 3. Delete user account
    const result = await User.deleteOne({ id: customerId, role: 'customer' });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản khách hàng." });
    }

    res.json({ message: "Xóa tài khoản khách hàng và toàn bộ dữ liệu liên quan thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
