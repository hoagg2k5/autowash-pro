import { 
  createBooking, 
  confirmBooking, 
  checkInBooking,
  startWashBooking, 
  updateBookingNotes, 
  completeBooking, 
  cancelBooking,
  getSlotTimes
} from '../db-helper.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import LoyaltyRules from '../models/LoyaltyRules.js';
import Voucher from '../models/Voucher.js';
import Service from '../models/Service.js';
import bcrypt from 'bcryptjs';
import { sendEmail, getBookingConfirmationTemplate, getBookingStatusUpdateTemplate } from '../utils/email.js';

// Tự động xác nhận các đơn đặt lịch chờ duyệt quá 30 phút
async function autoConfirmOldBookings(io) {
  try {
    const now = Date.now();
    const pendingBookings = await Booking.find({ status: 'Pending' });
    let updated = false;
    const updatedBookings = [];

    for (const b of pendingBookings) {
      if (now - new Date(b.createdAt).getTime() > 30 * 60 * 1000) {
        b.status = 'Confirmed';
        await b.save();
        updated = true;
        updatedBookings.push(b);
      }
    }

    if (updated && io) {
      for (const booking of updatedBookings) {
        const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
        const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
        io.emit('booking_updated', {
          ...booking.toObject(),
          licensePlate
        });
      }
    }
  } catch (err) {
    console.error("Error in auto-confirm simulator:", err);
  }
}

// Tự động hủy các đơn đặt lịch quá 30 phút tính từ khi kết thúc khung giờ hẹn mà khách không tới (No-show)
async function autoCancelNoShowBookings(io) {
  try {
    const now = Date.now();
    const activeBookings = await Booking.find({ 
      status: { $in: ['Pending', 'Confirmed'] },
      bookingType: { $ne: 'Walk-in' } // Không tự động hủy đơn vãng lai
    });
    let updated = false;
    const updatedBookings = [];

    for (const b of activeBookings) {
      const { endTime } = getSlotTimes(b.bookingDate, b.timeSlot);
      // Quá giờ hẹn kết thúc + 30 phút
      if (now > endTime.getTime() + 30 * 60 * 1000) {
        // Tự động hủy do quá giờ hẹn không tới (No-show), truyền lý do và cờ wasNoShow = true
        const cancelled = await cancelBooking(b.id, 'Hệ thống tự động hủy do quá giờ hẹn không tới (No-show).', true);
        updated = true;
        updatedBookings.push(cancelled);
      }
    }

    if (updated && io) {
      for (const booking of updatedBookings) {
        const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
        const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
        io.emit('booking_updated', {
          ...booking.toObject(),
          licensePlate
        });
      }
    }
  } catch (err) {
    console.error("Error in auto-cancel no-show simulator:", err);
  }
}

// Kiểm tra quyền truy cập chi nhánh
const checkBranchAccess = async (req, bookingId) => {
  const { role, branch } = req.user;
  if (role === 'admin' && !branch) return true; // Super Admin có quyền tất cả chi nhánh
  if (role === 'customer') return true;

  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) return true;

  if (branch && booking.branch !== branch) {
    throw new Error(`Bạn không có quyền thao tác trên lịch đặt của chi nhánh khác (${booking.branch}).`);
  }
  return true;
};

export const listBookings = async (req, res) => {
  try {
    const io = req.app.get('io');
    await autoConfirmOldBookings(io);
    await autoCancelNoShowBookings(io);

    const { role, branch, id: userId } = req.user;

    let query = {};
    if (role === 'customer') {
      // Khách hàng chỉ xem được lịch đặt của chính họ
      query.userId = userId;
    } else if (branch) {
      query.branch = branch;
    }

    const bookings = await Booking.find(query);

    const list = [];
    for (const b of bookings) {
      const user = await User.findOne({ id: b.userId });
      const vehicle = await Vehicle.findOne({ id: b.vehicleId });
      
      list.push({
        ...b.toObject(),
        customerName: user ? user.fullName : 'Ẩn danh',
        customerPhone: user ? user.phone : '',
        customerTier: user ? user.loyaltyTier : 'Member',
        licensePlate: vehicle ? vehicle.licensePlate : 'N/A',
        carDetails: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.color})` : 'N/A'
      });
    }

    // Sắp xếp theo ngày đặt lịch và khung giờ (khung giờ lấy giờ bắt đầu đầu tiên)
    list.sort((a, b) => new Date(b.bookingDate + "T" + b.timeSlot.split(" ")[0]) - new Date(a.bookingDate + "T" + a.timeSlot.split(" ")[0]));
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const book = async (req, res) => {
  try {
    const { userId, vehicleId, bookingDate, timeSlot, servicePackage, branch, bay, redeemPoints, promoCode, paymentMethod } = req.body;
    
    if (!userId || !vehicleId || !bookingDate || !timeSlot || !servicePackage) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin đặt lịch." });
    }

    // Bảo mật: Khách hàng chỉ được phép đặt lịch cho chính tài khoản của họ
    if (req.user.role === 'customer' && req.user.id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền tạo lịch đặt cho tài khoản của khách hàng khác." });
    }

    const newBooking = await createBooking(userId, { 
      vehicleId, 
      bookingDate, 
      timeSlot, 
      servicePackage, 
      branch,
      bay,
      redeemPoints: Number(redeemPoints) || 0,
      promoCode,
      paymentMethod
    });

    const vehicle = await Vehicle.findOne({ id: newBooking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...newBooking.toObject(),
        licensePlate
      });
    }

    // Gửi email xác nhận đặt lịch
    const user = await User.findOne({ id: userId });
    if (user && user.email) {
      const emailHtml = getBookingConfirmationTemplate(newBooking, user, vehicle);
      sendEmail({
        to: user.email,
        subject: `[AutoWash Pro] Hóa đơn xác nhận lịch hẹn ${newBooking.id}`,
        html: emailHtml
      }).catch(err => console.error("Error sending booking email:", err));
    }

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const confirm = async (req, res) => {
  try {
    await checkBranchAccess(req, req.params.id);
    const booking = await confirmBooking(req.params.id);

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...booking.toObject(),
        licensePlate
      });
    }

    res.json({ message: "Xác nhận lịch đặt xe thành công.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkin = async (req, res) => {
  try {
    await checkBranchAccess(req, req.params.id);
    const booking = await checkInBooking(req.params.id);

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...booking.toObject(),
        licensePlate
      });
    }

    res.json({ message: "Check-in xe thành công. Đơn hàng đã được đưa vào hàng đợi.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const start = async (req, res) => {
  try {
    await checkBranchAccess(req, req.params.id);
    const booking = await startWashBooking(req.params.id);

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...booking.toObject(),
        licensePlate
      });
    }

    res.json({ message: "Đã bắt đầu quy trình rửa xe.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateNotes = async (req, res) => {
  try {
    await checkBranchAccess(req, req.params.id);
    const booking = await updateBookingNotes(req.params.id, req.body.notes);
    res.json({ message: "Đã lưu ghi chú nhân viên.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const complete = async (req, res) => {
  try {
    const bookingId = req.params.id;
    await checkBranchAccess(req, bookingId);
    const completed = await completeBooking(bookingId);

    const vehicle = await Vehicle.findOne({ id: completed.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...completed.toObject(),
        licensePlate
      });
    }

    // Gửi email hoàn thành dịch vụ
    const user = await User.findOne({ id: completed.userId });
    if (user && user.email && vehicle) {
      const emailHtml = getBookingStatusUpdateTemplate(completed, user, vehicle, 'completed');
      sendEmail({
        to: user.email,
        subject: `[AutoWash Pro] Dịch vụ rửa xe ${completed.id} đã hoàn thành`,
        html: emailHtml
      }).catch(err => console.error("Error sending completion email:", err));
    }

    res.json({ message: "Hoàn tất dịch vụ và tích lũy điểm thành công.", booking: completed });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cancel = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }

    // Bảo mật: Khách hàng chỉ được phép hủy lịch đặt của chính họ
    if (req.user.role === 'customer' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền hủy lịch đặt của người khác." });
    }

    await checkBranchAccess(req, bookingId);
    const defaultReason = req.user.role === 'customer' ? 'Khách hàng chủ động hủy lịch.' : 'Nhân viên hủy lịch.';
    const cancelled = await cancelBooking(bookingId, reason || defaultReason, false);

    const vehicle = await Vehicle.findOne({ id: cancelled.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...cancelled.toObject(),
        licensePlate
      });
    }

    // Gửi email hủy dịch vụ
    const user = await User.findOne({ id: cancelled.userId });
    if (user && user.email && vehicle) {
      const emailHtml = getBookingStatusUpdateTemplate(cancelled, user, vehicle, 'cancelled');
      sendEmail({
        to: user.email,
        subject: `[AutoWash Pro] Lịch hẹn rửa xe ${cancelled.id} đã bị hủy`,
        html: emailHtml
      }).catch(err => console.error("Error sending cancellation email:", err));
    }

    res.json({ message: "Đã hủy lịch đặt rửa xe.", booking: cancelled });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getOccupancy = async (req, res) => {
  try {
    const { branch, date, timeSlot } = req.query;
    if (!branch || !date || !timeSlot) {
      return res.status(400).json({ error: "Thiếu thông tin chi nhánh, ngày hoặc khung giờ." });
    }
    const activeBookings = await Booking.find({
      branch,
      bookingDate: date,
      timeSlot,
      status: { $ne: 'Cancelled' }
    });
    
    const BAYS = ["Khoang 1", "Khoang 2", "Khoang 3"];
    const bays = [];
    
    for (const bayName of BAYS) {
      const booking = activeBookings.find(b => b.bay === bayName);
      let customerName = 'Ẩn danh';
      let licensePlate = 'N/A';
      
      if (booking) {
        const u = await User.findOne({ id: booking.userId });
        if (u) customerName = u.fullName;
        
        const v = await Vehicle.findOne({ id: booking.vehicleId });
        if (v) licensePlate = v.licensePlate;
      }
      
      bays.push({
        name: bayName,
        occupied: !!booking,
        booking: booking ? {
          id: booking.id,
          customerName,
          licensePlate
        } : null
      });
    }
    
    res.json(bays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getByPlate = async (req, res) => {
  try {
    const { licensePlate } = req.query;
    if (!licensePlate) {
      return res.status(400).json({ error: "Biển số xe là bắt buộc." });
    }
    const plateUpper = licensePlate.toUpperCase().trim();
    
    const vehicle = await Vehicle.findOne({ licensePlate: plateUpper });
    if (!vehicle) {
      return res.status(404).json({ error: "Không tìm thấy xe với biển số này trên hệ thống." });
    }
    
    const user = await User.findOne({ id: vehicle.userId });
    const rules = await LoyaltyRules.findOne({});
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const bookingQuery = {
      vehicleId: vehicle.id,
      bookingDate: todayStr,
      status: { $ne: 'Cancelled' }
    };
    if (req.user.branch) {
      bookingQuery.branch = req.user.branch;
    }
    
    const booking = await Booking.findOne(bookingQuery);
    
    res.json({
      booking: booking ? {
        ...booking.toObject(),
        customerName: user ? user.fullName : 'Ẩn danh',
        customerPhone: user ? user.phone : '',
        customerTier: user ? user.loyaltyTier : 'Member',
        licensePlate: vehicle.licensePlate,
        carDetails: `${vehicle.brand} ${vehicle.model} (${vehicle.color})`
      } : null,
      vehicle,
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        loyaltyTier: user.loyaltyTier,
        pointsBalance: user.pointsBalance,
        perks: rules?.tierSettings[user.loyaltyTier]?.perks || []
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validateVoucherEndpoint = async (req, res) => {
  try {
    const { code, userId, price } = req.query;
    if (!code || !userId || !price) {
      return res.status(400).json({ error: "Thiếu mã voucher, userId hoặc số tiền hóa đơn." });
    }
    
    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (!voucher) {
      return res.status(404).json({ error: "Mã giảm giá không tồn tại." });
    }
    if (!voucher.isActive) {
      return res.status(400).json({ error: "Mã giảm giá đã bị vô hiệu hóa." });
    }
    if (new Date(voucher.expiryDate) < new Date()) {
      return res.status(400).json({ error: "Mã giảm giá đã hết hạn sử dụng." });
    }
    
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy thông tin người dùng." });
    }
    if (voucher.pointsRequired > 0) {
      if (!user.ownedVouchers || !user.ownedVouchers.some(id => id.toString() === voucher._id.toString())) {
        return res.status(400).json({ error: "Bạn chưa sở hữu mã giảm giá này. Vui lòng đổi bằng điểm tích lũy trước." });
      }
    }
    if (!voucher.targetTiers.includes(user.loyaltyTier)) {
      return res.status(400).json({ error: `Mã này chỉ áp dụng cho các hạng thành viên: ${voucher.targetTiers.join(', ')}.` });
    }
    
    const parsedPrice = Number(price);
    if (parsedPrice < voucher.minSpent) {
      return res.status(400).json({ error: `Giá trị hóa đơn tối thiểu để áp dụng mã này là ${voucher.minSpent.toLocaleString('vi-VN')} đ.` });
    }
    
    // Tính số tiền giảm giá
    let discount = 0;
    if (voucher.discountVnd) {
      discount = voucher.discountVnd;
    } else if (voucher.discountPercent) {
      discount = Math.floor(parsedPrice * (voucher.discountPercent / 100));
    }
    
    res.json({ valid: true, discount, voucher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Số sao đánh giá phải từ 1 đến 5 sao." });
    }

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền đánh giá lịch hẹn này." });
    }

    booking.rating = Number(rating);
    booking.comment = comment || '';
    booking.feedbackCreatedAt = new Date();

    await booking.save();
    
    // Gửi Socket
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', booking.toObject());
    }

    res.json({ message: "Cảm ơn bạn đã gửi đánh giá phản hồi!", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookingDetail = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // Tìm kiếm không phân biệt hoa thường
    const normalizedId = bookingId.toLowerCase().trim();
    const bookings = await Booking.find({});
    const booking = bookings.find(b => b.id.toLowerCase() === normalizedId);

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe với mã này." });
    }

    // Bảo mật phân quyền chi nhánh
    const { role, branch } = req.user;
    if (role === 'staff' && branch && booking.branch !== branch) {
      return res.status(403).json({ error: `Bạn không có quyền xem thông tin đơn thuộc chi nhánh khác (${booking.branch}).` });
    }
    if (role === 'admin' && branch && booking.branch !== branch) {
      return res.status(403).json({ error: `Bạn không có quyền xem thông tin đơn thuộc chi nhánh khác (${booking.branch}).` });
    }
    if (role === 'customer' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập thông tin đơn hàng này." });
    }

    const user = await User.findOne({ id: booking.userId });
    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });

    res.json({
      ...booking.toObject(),
      customerName: user ? user.fullName : 'Ẩn danh',
      customerPhone: user ? user.phone : '',
      customerTier: user ? user.loyaltyTier : 'Member',
      licensePlate: vehicle ? vehicle.licensePlate : 'N/A',
      carDetails: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.color})` : 'N/A'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listActiveVouchers = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }
    const loyaltyTier = user.loyaltyTier || 'Member';
    const today = new Date().toLocaleDateString('sv-SE');
    const ownedIds = user.ownedVouchers || [];
    
    const vouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $gte: today },
      targetTiers: loyaltyTier,
      $or: [
        { pointsRequired: { $exists: false } },
        { pointsRequired: 0 },
        { _id: { $in: ownedIds } }
      ]
    });
    
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const payBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }

    // Update payment and status
    booking.paymentStatus = 'Paid';
    booking.status = 'Confirmed'; // Automatically confirm booking upon payment
    await booking.save();

    // Notify updates via Socket.io
    const io = req.app.get('io');
    if (io) {
      const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
      io.emit('booking_updated', {
        ...booking.toObject(),
        licensePlate: vehicle ? vehicle.licensePlate : 'N/A'
      });
    }

    // Gửi email xác nhận thanh toán
    const user = await User.findOne({ id: booking.userId });
    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    if (user && user.email && vehicle) {
      const emailHtml = getBookingConfirmationTemplate(booking, user, vehicle);
      sendEmail({
        to: user.email,
        subject: `[AutoWash Pro] Hóa đơn xác nhận thanh toán lịch hẹn ${booking.id}`,
        html: emailHtml
      }).catch(err => console.error("Error sending booking payment confirmation email:", err));
    }

    res.json({ message: "Thanh toán thành công! Trạng thái lịch hẹn đã chuyển thành 'Đã xác nhận'.", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignBay = async (req, res) => {
  try {
    const { bookingId, bayId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "Thiếu thông tin bookingId." });
    }
    
    await checkBranchAccess(req, bookingId);
    
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }
    
    booking.bay = bayId || '';
    booking.assignedBay = bayId || null;
    await booking.save();
    
    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...booking.toObject(),
        licensePlate
      });
    }
    
    res.json({ message: "Gán khoang rửa xe thành công.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createWalkInBooking = async (req, res) => {
  try {
    const { licensePlate, customerName, customerPhone, servicePackage, branch, timeSlot: bodyTimeSlot } = req.body;

    if (!licensePlate || !servicePackage) {
      return res.status(400).json({ error: "Biển số xe và gói dịch vụ là bắt buộc." });
    }

    const plateUpper = licensePlate.toUpperCase().trim();
    const branchName = branch || req.user.branch || "AutoWash Pro - Quận 1";

    // 1. Tìm hoặc tạo User dựa trên Số điện thoại
    let user = null;
    let userId = "customer-id";

    if (customerPhone && customerPhone.trim() !== "") {
      const phone = customerPhone.trim();
      user = await User.findOne({ phone });
      if (!user) {
        // Tạo mật khẩu ngẫu nhiên đã được mã hóa để thỏa mãn điều kiện required trong User schema
        const randomPassword = Math.random().toString(36).substr(2, 9);
        const hashedPassword = bcrypt.hashSync('walkin_' + randomPassword, 10);

        user = new User({
          id: 'u-' + Math.random().toString(36).substr(2, 9),
          fullName: customerName || "Khách vãng lai",
          phone: phone,
          password: hashedPassword,
          role: 'customer',
          loyaltyTier: 'Member',
          pointsBalance: 0,
          totalSpent: 0,
          createdAt: new Date()
        });
        await user.save();
      }
      userId = user.id;
    } else {
      user = await User.findOne({ id: "customer-id" });
      userId = "customer-id";
    }

    // 2. Tìm hoặc tạo xe dựa trên biển số xe cho user này
    let vehicle = await Vehicle.findOne({ licensePlate: plateUpper });
    if (!vehicle) {
      vehicle = new Vehicle({
        id: 'v-' + Math.random().toString(36).substr(2, 9),
        userId: userId,
        licensePlate: plateUpper,
        brand: "Khách vãng lai",
        model: "Vãng lai",
        color: "Khác"
      });
      await vehicle.save();
    } else {
      if (vehicle.userId === "customer-id" && userId !== "customer-id") {
        vehicle.userId = userId;
        await vehicle.save();
      }
    }

    // 3. Tạo Booking với status 'Waiting' và bay = "" (đưa thẳng vào hàng đợi)
    const BAYS = ["Khoang 1", "Khoang 2", "Khoang 3"];
    
    // Lấy timeslot từ request hoặc tự động tính theo giờ hiện tại
    const getCurrentTimeSlot = () => {
      const hr = new Date().getHours();
      if (hr < 9) return "08:00 - 09:00";
      if (hr < 10) return "09:00 - 10:00";
      if (hr < 11) return "10:00 - 11:00";
      if (hr < 12) return "11:00 - 12:00";
      if (hr < 14) return "13:00 - 14:00";
      if (hr < 15) return "14:00 - 15:00";
      if (hr < 16) return "15:00 - 16:00";
      if (hr < 17) return "16:00 - 17:00";
      return "17:00 - 18:00";
    };
    const timeSlot = bodyTimeSlot || getCurrentTimeSlot();
    const todayStr = new Date().toLocaleDateString('sv-SE');

    const activeBookings = await Booking.find({
      branch: branchName,
      bookingDate: todayStr,
      timeSlot: timeSlot,
      status: { $ne: 'Cancelled' }
    });

    if (activeBookings.length >= BAYS.length) {
      return res.status(400).json({ error: "Khung giờ đã chọn tại chi nhánh đã đầy hết tất cả các khoang rửa." });
    }

    // Kiểm tra xe đã có lịch đặt trùng ngày và khung giờ chưa
    const existingVehicleBooking = await Booking.findOne({
      vehicleId: vehicle.id,
      bookingDate: todayStr,
      timeSlot: timeSlot,
      status: { $ne: 'Cancelled' }
    });
    if (existingVehicleBooking) {
      return res.status(400).json({ error: "Xe này đã được xếp lịch trong khung giờ đã chọn." });
    }

    // Tìm gói dịch vụ để lấy giá
    const service = await Service.findOne({
      $or: [{ name: servicePackage }, { id: servicePackage }]
    });
    if (!service) {
      return res.status(400).json({ error: "Không tìm thấy gói rửa xe được yêu cầu." });
    }

    const price = service.price;
    const rules = await LoyaltyRules.findOne({});
    const tierSetting = rules ? rules.tierSettings[user ? user.loyaltyTier : 'Member'] : { pointMultiplier: 1.0 };
    const pointsPerVndRate = rules ? rules.pointsPerVndRate : 25000;
    const basePointsEarned = Math.floor(price / pointsPerVndRate);
    const pointsEarned = Math.floor(basePointsEarned * (tierSetting?.pointMultiplier || 1.0));

    const newBooking = new Booking({
      id: 'b-' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      vehicleId: vehicle.id,
      bookingDate: todayStr,
      timeSlot: timeSlot,
      servicePackage: service.name,
      branch: branchName,
      bay: "", // Đưa thẳng vào hàng đợi
      bookingType: 'Walk-in',
      status: 'Waiting',
      checkInTime: new Date(),
      price: price,
      discountApplied: 0,
      pointsEarned: pointsEarned,
      pointsRedeemed: 0,
      totalPaid: price,
      paymentMethod: 'Cash',
      paymentStatus: 'Unpaid',
      notes: 'Khách vãng lai trực tiếp tại quầy.',
      createdAt: new Date()
    });

    await newBooking.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...newBooking.toObject(),
        licensePlate: plateUpper
      });
    }

    res.status(201).json({ message: "Tạo lịch vãng lai thành công. Đơn hàng đã được đưa vào hàng đợi.", booking: newBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const undoCheckin = async (req, res) => {
  try {
    await checkBranchAccess(req, req.params.id);
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }
    if (booking.status !== 'Waiting') {
      return res.status(400).json({ error: "Chỉ có thể hoàn tác check-in cho đơn hàng đang chờ rửa." });
    }
    
    booking.status = 'Confirmed';
    booking.checkInTime = null; // Xóa giờ check-in
    booking.bay = ""; // Xóa khoang
    await booking.save();

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_updated', {
        ...booking.toObject(),
        licensePlate
      });
    }

    res.json({ message: "Hoàn tác check-in thành công. Đơn hàng đã quay lại trạng thái 'Đã xác nhận'.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


