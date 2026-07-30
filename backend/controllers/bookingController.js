import {
  createBooking,
  confirmBooking,
  checkInBooking,
  startWashBooking,
  updateBookingNotes,
  completeBooking,
  checkoutBooking,
  cancelBooking,
  getSlotTimes,
  assignBayToBooking
} from '../db-helper.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import LoyaltyRules from '../models/LoyaltyRules.js';
import Voucher from '../models/Voucher.js';
import UserVoucher from '../models/UserVoucher.js';
import Service from '../models/Service.js';
import Bay from '../models/Bay.js';
import bcrypt from 'bcryptjs';

import { sendEmail, getBookingConfirmationTemplate, getBookingStatusUpdateTemplate } from '../utils/email.js';
import PointHistory from '../models/PointHistory.js';
import { logAdminAction } from '../utils/auditLogger.js';
import { formatVietnamLicensePlate } from '../utils/licensePlateHelper.js';
import { createPaymentUrl, verifyResponse, callRefundApi } from '../utils/vnpayHelper.js';



// Tự động xác nhận các đơn đặt lịch chờ duyệt quá 30 phút
async function autoConfirmOldBookings(io) {
  try {
    const now = Date.now();
    const cutoffTime = new Date(now - 30 * 60 * 1000);
    const oldBookings = await Booking.find({ status: 'Pending', createdAt: { $lt: cutoffTime } });

    if (oldBookings.length > 0) {
      const ids = oldBookings.map(b => b._id);
      await Booking.updateMany({ _id: { $in: ids } }, { $set: { status: 'Confirmed' } });

      if (io) {
        const vehicleIds = oldBookings.map(b => b.vehicleId);
        const vehicles = await Vehicle.find({ id: { $in: vehicleIds } });
        const vehicleMap = {};
        vehicles.forEach(v => {
          vehicleMap[v.id] = v;
        });

        oldBookings.forEach(b => {
          b.status = 'Confirmed';
          const vehicle = vehicleMap[b.vehicleId];
          const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
          const data = {
            ...b.toObject(),
            licensePlate
          };
          if (b.userId) {
            io.to(`user-${b.userId}`).emit('booking_updated', data);
          }
          io.to('staff-admin').emit('booking_updated', data);
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

    const bookingsToCancel = [];
    for (const b of activeBookings) {
      const { endTime } = getSlotTimes(b.bookingDate, b.timeSlot);
      if (now > endTime.getTime() + 30 * 60 * 1000) {
        bookingsToCancel.push(b);
      }
    }

    if (bookingsToCancel.length > 0) {
      const updatedBookings = [];
      for (const b of bookingsToCancel) {
        const cancelled = await cancelBooking(b.id, 'Hệ thống tự động hủy do quá giờ hẹn không tới (No-show).', true);
        if (b.paymentStatus === 'Paid' && b.paymentMethod === 'Online') {
          cancelled.paymentStatus = 'Refund Pending';
          await cancelled.save();
        }
        updatedBookings.push(cancelled);
      }

      if (io) {
        const vehicleIds = updatedBookings.map(b => b.vehicleId);
        const vehicles = await Vehicle.find({ id: { $in: vehicleIds } });
        const vehicleMap = {};
        vehicles.forEach(v => {
          vehicleMap[v.id] = v;
        });

        updatedBookings.forEach(b => {
          const vehicle = vehicleMap[b.vehicleId];
          const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
          const data = {
            ...b.toObject(),
            licensePlate
          };
          if (b.userId) {
            io.to(`user-${b.userId}`).emit('booking_updated', data);
          }
          io.to('staff-admin').emit('booking_updated', data);
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

// Gửi thông tin cập nhật đặt lịch riêng tư tới đúng khách hàng và nhóm staff/admin
const emitBookingUpdated = (req, booking, licensePlate) => {
  const io = req.app.get('io');
  if (!io) return;

  const data = booking.toObject ? booking.toObject() : booking;
  if (licensePlate) {
    data.licensePlate = licensePlate;
  }

  // Gửi tới khách hàng sở hữu đơn hàng
  if (booking.userId) {
    io.to(`user-${booking.userId}`).emit('booking_updated', data);
  }
  // Gửi tới tất cả staff/admin
  io.to('staff-admin').emit('booking_updated', data);
};

export const listBookings = async (req, res) => {
  try {
    const io = req.app.get('io');
    autoConfirmOldBookings(io).catch(err => console.error("Error in auto-confirm background job:", err));
    autoCancelNoShowBookings(io).catch(err => console.error("Error in auto-cancel background job:", err));

    const { role, branch, id: userId } = req.user;

    let query = {};
    if (role === 'customer') {
      // Khách hàng chỉ xem được lịch đặt của chính họ
      query.userId = userId;
    } else if (branch) {
      query.branch = branch;
    }

    const bookings = await Booking.find(query);

    // Extract all unique userIds and vehicleIds
    const userIds = [...new Set(bookings.map(b => b.userId))];
    const vehicleIds = [...new Set(bookings.map(b => b.vehicleId))];

    // Fetch corresponding users and vehicles in parallel
    const [users, vehicles] = await Promise.all([
      User.find({ id: { $in: userIds } }),
      Vehicle.find({ id: { $in: vehicleIds } })
    ]);

    // Build O(1) lookup maps
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });

    const vehicleMap = {};
    vehicles.forEach(v => {
      vehicleMap[v.id] = v;
    });

    const list = bookings.map(b => {
      const bObj = b.toObject ? b.toObject() : b;
      const user = userMap[b.userId];
      const vehicle = vehicleMap[b.vehicleId];
      return {
        ...bObj,
        customerName: user ? user.fullName : 'Ẩn danh',
        customerPhone: user ? user.phone : '',
        customerTier: user ? user.loyaltyTier : 'Member',
        licensePlate: vehicle ? vehicle.licensePlate : (bObj.licensePlate || 'N/A'),
        carDetails: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.color})` : (bObj.carDetails || 'Xe đã gỡ khỏi TK')
      };
    });

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

    emitBookingUpdated(req, newBooking, licensePlate);

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

    if (paymentMethod === 'Online') {
      const paymentUrl = createPaymentUrl(newBooking.id, newBooking.totalPaid, req);
      return res.status(201).json({ ...newBooking.toObject(), paymentUrl });
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

    emitBookingUpdated(req, booking, licensePlate);

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

    emitBookingUpdated(req, booking, licensePlate);

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

    emitBookingUpdated(req, booking, licensePlate);

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

    emitBookingUpdated(req, completed, licensePlate);

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

export const checkout = async (req, res) => {
  try {
    const bookingId = req.params.id;
    await checkBranchAccess(req, bookingId);
    const checkedOut = await checkoutBooking(bookingId);

    const vehicle = await Vehicle.findOne({ id: checkedOut.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';

    emitBookingUpdated(req, checkedOut, licensePlate);

    // Gửi email hoàn thành dịch vụ / thanh toán
    const user = await User.findOne({ id: checkedOut.userId });
    if (user && user.email && vehicle) {
      const emailHtml = getBookingStatusUpdateTemplate(checkedOut, user, vehicle, 'completed');
      sendEmail({
        to: user.email,
        subject: `[AutoWash Pro] Hóa đơn thanh toán và hoàn tất dịch vụ ${checkedOut.id}`,
        html: emailHtml
      }).catch(err => console.error("Error sending checkout email:", err));
    }

    res.json({ message: "Thanh toán và hoàn tất dịch vụ thành công.", booking: checkedOut });
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

    // Không cho phép hủy nếu đơn hàng đã check-in, đang rửa hoặc đã hoàn thành
    const cantCancelStatuses = ['Waiting', 'In Progress', 'Completed'];
    if (cantCancelStatuses.includes(booking.status)) {
      return res.status(400).json({ error: "Lịch đặt đã check-in hoặc đang/đã thực hiện dịch vụ. Không thể hủy và hoàn tiền." });
    }

    const isPaid = booking.paymentStatus === 'Paid';
    const isOnline = booking.paymentMethod === 'Online';

    await checkBranchAccess(req, bookingId);
    const defaultReason = req.user.role === 'customer' ? 'Khách hàng chủ động hủy lịch.' : 'Nhân viên hủy lịch.';
    const cancelled = await cancelBooking(bookingId, reason || defaultReason, false);

    if (isPaid && isOnline) {
      cancelled.paymentStatus = 'Refund Pending';
      await cancelled.save();
    }

    // Ghi Audit Log nếu đây là đơn đã thanh toán được Admin hủy
    if (isPaid && req.user.role === 'admin') {
      await logAdminAction(
        req,
        'CANCEL_PAID_BOOKING',
        `Hủy và yêu cầu hoàn tiền đơn hàng đã thanh toán trước ${bookingId}. Lý do: ${reason || 'Không có lý do cụ thể'}`
      );
    }

    const vehicle = await Vehicle.findOne({ id: cancelled.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';

    emitBookingUpdated(req, cancelled, licensePlate);

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
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    const dbBays = await Bay.find({ branch, status: 'Active' });
    const BAYS = dbBays.length > 0 ? dbBays.map(b => b.name) : ["Khoang 1", "Khoang 2", "Khoang 3"];
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
    const rawUpper = licensePlate.toUpperCase().trim();
    const formattedQuery = formatVietnamLicensePlate(licensePlate);
    const alphaNumQuery = rawUpper.replace(/[^A-Z0-9]/g, '');

    let vehicle = await Vehicle.findOne({
      $or: [
        { licensePlate: formattedQuery },
        { licensePlate: rawUpper },
        { licensePlate: new RegExp(alphaNumQuery.split('').join('[-.\\s]?'), 'i') }
      ]
    });
    if (!vehicle) {
      return res.status(404).json({ error: "Không tìm thấy xe với biển số này trên hệ thống." });
    }

    const user = await User.findOne({ id: vehicle.userId });
    const rules = await LoyaltyRules.findOne({});

    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const bookingQuery = {
      vehicleId: vehicle.id,
      bookingDate: todayStr,
      status: { $ne: 'Cancelled' }
    };
    if (req.user.branch) {
      bookingQuery.branch = req.user.branch;
    }

    const bookings = await Booking.find(bookingQuery);
    
    // Sắp xếp thứ tự ưu tiên hiển thị trên Camera LPR quét biển số:
    // 1. Confirmed / Pending (Cần check-in / chưa bắt đầu) -> Ưu tiên cao nhất
    // 2. Waiting / In Progress (Đang chờ hoặc đang rửa) -> Ưu tiên nhì
    // 3. Completed (Đã hoàn tất rửa xe) -> Ưu tiên thấp nhất
    // Cùng nhóm trạng thái thì ưu tiên khung giờ sớm hơn
    const getStatusPriority = (status) => {
      if (status === 'Confirmed' || status === 'Pending') return 1;
      if (status === 'Waiting' || status === 'In Progress' || status === 'In_Progress') return 2;
      if (status === 'Completed') return 3;
      return 4;
    };

    bookings.sort((a, b) => {
      const priA = getStatusPriority(a.status);
      const priB = getStatusPriority(b.status);
      if (priA !== priB) return priA - priB;

      const getStartHour = (slot) => {
        try {
          return parseInt(slot.split(":")[0], 10);
        } catch {
          return 0;
        }
      };
      const hourA = getStartHour(a.timeSlot);
      const hourB = getStartHour(b.timeSlot);

      // Nếu cả hai đều đã hoàn tất, hiển thị đơn mới nhất trước (giờ muộn nhất)
      if (priA === 3) {
        return hourB - hourA;
      }
      // Nếu là các đơn sắp diễn ra/đang đợi, hiển thị đơn sớm nhất trước để tiếp đón
      return hourA - hourB;
    });

    const booking = bookings[0] || null;

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
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (voucher.expiryDate < todayStr) {
      return res.status(400).json({ error: "Mã giảm giá đã hết hạn sử dụng." });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy thông tin người dùng." });
    }
    if (voucher.pointsRequired > 0 || voucher.code.toUpperCase().startsWith('RW-')) {
      const userVoucher = await UserVoucher.findOne({
        userId: user.id,
        voucherCode: voucher.code,
        isUsed: false
      });
      if (!userVoucher) {
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
    emitBookingUpdated(req, booking);

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
    const booking = await Booking.findOne({ id: normalizedId });

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
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

    const userVouchers = await UserVoucher.find({ userId: user.id, isUsed: false });
    const ownedVoucherCodes = userVouchers.map(uv => uv.voucherCode);

    const vouchers = await Voucher.find({
      isActive: true,
      expiryDate: { $gte: today },
      targetTiers: loyaltyTier,
      $or: [
        // 1. Voucher hệ thống: không bắt đầu bằng 'RW-' và pointsRequired là 0 hoặc không có
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

    // Bảo mật: Khách hàng chỉ được thanh toán đơn hàng của chính mình
    if (req.user.role === 'customer' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền thanh toán đơn hàng này." });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ error: "Không thể thanh toán cho đơn hàng đã bị hủy." });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ error: "Đơn hàng này đã được thanh toán trước đó." });
    }

    // Update payment and status
    booking.paymentStatus = 'Paid';
    booking.status = 'Confirmed'; // Automatically confirm booking upon payment
    await booking.save();

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    emitBookingUpdated(req, booking, vehicle ? vehicle.licensePlate : 'N/A');

    // Gửi email xác nhận thanh toán
    const user = await User.findOne({ id: booking.userId });
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
    const bookingId = req.body.bookingId || req.params.id;
    const bayId = req.body.bayId || req.body.bay;
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

    emitBookingUpdated(req, booking, licensePlate);

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

    const plateRegex = /^[0-9]{2}[A-Za-z][A-Za-z0-9]?[-.\s]?[0-9]{4,5}$/;
    if (!plateRegex.test(licensePlate.replace(/\./g, ''))) {
      return res.status(400).json({ error: "Biển số xe không hợp lệ. Ví dụ đúng: 51K-12345, 30A-123.45" });
    }

    const plateUpper = licensePlate.toUpperCase().trim();
    const branchName = branch || req.user.branch || "AutoWash Pro - Quận 1";

    // 1. Tìm hoặc tạo User dựa trên Số điện thoại
    let user = null;
    let userId = "customer-id";

    if (customerPhone && customerPhone.trim() !== "") {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      const cleanedPhone = customerPhone.replace(/[\s.-]/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam." });
      }

      const phone = cleanedPhone;
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
          isWalkInOnly: true,
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
    const dbBays = await Bay.find({ branch: branchName, status: 'Active' });
    const BAYS = dbBays.length > 0 ? dbBays.map(b => b.name) : ["Khoang 1", "Khoang 2", "Khoang 3"];

    // Lấy timeslot từ request hoặc tự động tính theo giờ hiện tại
    const getCurrentTimeSlot = () => {
      const hr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).getHours();
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
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

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
      licensePlate: plateUpper,
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

    emitBookingUpdated(req, newBooking, plateUpper);

    const bookingObj = {
      ...newBooking.toObject(),
      licensePlate: plateUpper,
      customerName: user.name,
      customerPhone: user.phone
    };

    res.status(201).json({ message: "Tạo lịch vãng lai thành công. Đơn hàng đã được đưa vào hàng đợi.", booking: bookingObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách voucher admin tạo có pointsRequired > 0 (dùng cho Cửa hàng đổi thưởng)
export const listRedeemableVouchers = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vouchers = await Voucher.find({
      isActive: true,
      pointsRequired: { $gt: 0 },
      expiryDate: { $gte: today }
    }).sort({ pointsRequired: 1 });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const redeemVoucher = async (req, res) => {
  try {
    const { voucherId } = req.body;
    const userId = req.user.id;

    if (!voucherId) {
      return res.status(400).json({ error: "Thiếu thông tin voucher cần đổi." });
    }

    // Tìm voucher gốc từ DB theo _id
    const sourceVoucher = await Voucher.findById(voucherId);
    if (!sourceVoucher || !sourceVoucher.isActive) {
      return res.status(400).json({ error: "Voucher không tồn tại hoặc đã ngưng hoạt động." });
    }
    if (sourceVoucher.pointsRequired <= 0) {
      return res.status(400).json({ error: "Voucher này không thể đổi bằng điểm." });
    }

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (sourceVoucher.expiryDate < today) {
      return res.status(400).json({ error: "Voucher đã hết hạn." });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }

    if (user.pointsBalance < sourceVoucher.pointsRequired) {
      return res.status(400).json({ error: `Số điểm tích lũy không đủ. Cần ${sourceVoucher.pointsRequired} điểm, bạn có ${user.pointsBalance} điểm.` });
    }

    // Trừ điểm tích lũy của người dùng
    user.pointsBalance -= sourceVoucher.pointsRequired;
    await user.save();

    // Sinh mã Voucher cá nhân ngẫu nhiên với tiền tố RW-
    const randomCode = 'RW-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // Hạn 30 ngày

    // Tạo bản ghi Voucher mới cho user này
    const newVoucher = new Voucher({
      code: randomCode,
      discountVnd: sourceVoucher.discountVnd,
      discountPercent: sourceVoucher.discountPercent,
      minSpent: sourceVoucher.minSpent,
      targetTiers: ['Member', 'Silver', 'Gold', 'Platinum'],
      isActive: true,
      pointsRequired: sourceVoucher.pointsRequired,
      expiryDate
    });
    await newVoucher.save();

    // Tạo bản ghi UserVoucher liên kết với user
    const newUserVoucher = new UserVoucher({
      id: 'uv-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      voucherCode: randomCode,
      redeemedAt: new Date(),
      isUsed: false,
      expiryDate
    });
    await newUserVoucher.save();

    // Lưu lịch sử điểm thưởng
    const label = sourceVoucher.discountVnd > 0
      ? `Giảm ${sourceVoucher.discountVnd.toLocaleString('vi-VN')}đ`
      : `Giảm ${sourceVoucher.discountPercent}%`;

    const historyRedeem = new PointHistory({
      id: 'ph-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      bookingId: null,
      type: 'Redeemed',
      points: sourceVoucher.pointsRequired,
      reason: `Đổi điểm lấy Voucher ${label}`
    });
    await historyRedeem.save();

    res.status(201).json({
      message: "Đổi voucher thành công!",
      voucher: { code: randomCode, ...newVoucher.toObject() },
      userVoucher: newUserVoucher,
      pointsBalance: user.pointsBalance
    });
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

    emitBookingUpdated(req, booking, licensePlate);

    res.json({ message: "Hoàn tác check-in thành công. Đơn hàng đã quay lại trạng thái 'Đã xác nhận'.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listMyVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userVouchers = await UserVoucher.find({ userId, isUsed: false });

    const codes = userVouchers.map(uv => uv.voucherCode);
    const vouchers = await Voucher.find({ code: { $in: codes }, isActive: true });

    const result = userVouchers.map(uv => {
      const v = vouchers.find(item => item.code === uv.voucherCode);
      return {
        id: uv.id,
        voucherCode: uv.voucherCode,
        redeemedAt: uv.redeemedAt,
        expiryDate: uv.expiryDate,
        discountVnd: v ? v.discountVnd : 0,
        discountPercent: v ? v.discountPercent : 0,
        minSpent: v ? v.minSpent : 0
      };
    }).filter(r => r.discountVnd > 0 || r.discountPercent > 0);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listMyUsedVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userVouchers = await UserVoucher.find({ userId, isUsed: true });

    const codes = userVouchers.map(uv => uv.voucherCode);
    const vouchers = await Voucher.find({ code: { $in: codes } });

    const result = userVouchers.map(uv => {
      const v = vouchers.find(item => item.code === uv.voucherCode);
      return {
        id: uv.id,
        voucherCode: uv.voucherCode,
        redeemedAt: uv.redeemedAt,
        usedAt: uv.usedAt,
        expiryDate: uv.expiryDate,
        discountVnd: v ? v.discountVnd : 0,
        discountPercent: v ? v.discountPercent : 0,
        minSpent: v ? v.minSpent : 0
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const assignStaff = async (req, res) => {
  try {
    const { staffId } = req.body; // id nhân viên hoặc null/empty để hủy gán
    const bookingId = req.params.id;

    await checkBranchAccess(req, bookingId);

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }

    if (staffId) {
      const staffUser = await User.findOne({ id: staffId, role: 'staff' });
      if (!staffUser) {
        return res.status(404).json({ error: "Không tìm thấy thông tin nhân viên hoặc người này không phải nhân sự rửa xe." });
      }
      booking.assignedStaffId = staffId;
    } else {
      booking.assignedStaffId = null;
    }

    await booking.save();

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';

    emitBookingUpdated(req, booking, licensePlate);

    res.json({ message: "Gán nhân viên phụ trách thành công.", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listStaffForAssignment = async (req, res) => {
  try {
    const { branch } = req.query;
    let query = { role: 'staff' };
    if (branch) {
      query.branch = branch;
    }
    const staffs = await User.find(query, { id: 1, fullName: 1, phone: 1, branch: 1 });
    res.json(staffs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// VNPAY INTEGRATION ENDPOINTS
// ==========================================

export const vnpayIpn = async (req, res) => {
  try {
    const queryParams = req.query;
    const secretKey = process.env.VNP_HASH_SECRET || 'UZDGBNCOWVHUXWDVJPRWUXZFTJYZXMXP';

    // 1. Verify response signature
    const isValidSignature = verifyResponse(queryParams, secretKey);
    if (!isValidSignature) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const bookingId = queryParams['vnp_TxnRef'];
    const vnpAmount = Number(queryParams['vnp_Amount']) / 100; // VNPay amount * 100
    const vnpResponseCode = queryParams['vnp_ResponseCode'];
    const vnpTransactionNo = queryParams['vnp_TransactionNo'];
    const vnpPayDate = queryParams['vnp_PayDate'];

    // 2. Check if booking exists
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // 3. Check if amount matches
    if (booking.totalPaid !== vnpAmount) {
      return res.status(200).json({ RspCode: '04', Message: 'Amount mismatch' });
    }

    // 4. Check if order status is pending
    if (booking.paymentStatus === 'Paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // 5. Update booking status
    if (vnpResponseCode === '00') {
      // Payment success
      booking.paymentStatus = 'Paid';
      booking.status = 'Confirmed';
      booking.vnpTransactionNo = vnpTransactionNo;
      booking.vnpPayDate = vnpPayDate;
      await booking.save();

      const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
      const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
      emitBookingUpdated(req, booking, licensePlate);

      // Send email confirmation
      const user = await User.findOne({ id: booking.userId });
      if (user && user.email && vehicle) {
        const emailHtml = getBookingConfirmationTemplate(booking, user, vehicle);
        sendEmail({
          to: user.email,
          subject: `[AutoWash Pro] Hóa đơn xác nhận thanh toán lịch hẹn ${booking.id}`,
          html: emailHtml
        }).catch(err => console.error("Error sending booking payment confirmation email from IPN:", err));
      }
    }

    return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
  } catch (error) {
    console.error("Error processing VNPay IPN:", error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error: ' + error.message });
  }
};

export const vnpayVerify = async (req, res) => {
  try {
    const queryParams = req.query;
    const secretKey = process.env.VNP_HASH_SECRET || 'UZDGBNCOWVHUXWDVJPRWUXZFTJYZXMXP';

    const isValidSignature = verifyResponse(queryParams, secretKey);
    if (!isValidSignature) {
      return res.status(400).json({ error: 'Chữ ký giao dịch không hợp lệ.' });
    }

    const bookingId = queryParams['vnp_TxnRef'];
    const vnpResponseCode = queryParams['vnp_ResponseCode'];
    const vnpTransactionNo = queryParams['vnp_TransactionNo'];
    const vnpPayDate = queryParams['vnp_PayDate'];

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: 'Không tìm thấy lịch đặt xe này.' });
    }

    if (vnpResponseCode === '00') {
      if (booking.paymentStatus !== 'Paid') {
        booking.paymentStatus = 'Paid';
        booking.status = 'Confirmed';
        booking.vnpTransactionNo = vnpTransactionNo;
        booking.vnpPayDate = vnpPayDate;
        await booking.save();

        const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
        const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
        emitBookingUpdated(req, booking, licensePlate);

        // Send email
        const user = await User.findOne({ id: booking.userId });
        if (user && user.email && vehicle) {
          const emailHtml = getBookingConfirmationTemplate(booking, user, vehicle);
          sendEmail({
            to: user.email,
            subject: `[AutoWash Pro] Hóa đơn xác nhận thanh toán lịch hẹn ${booking.id}`,
            html: emailHtml
          }).catch(err => console.error("Error sending booking email from Verify:", err));
        }
      }
      return res.json({ message: 'Thanh toán thành công qua VNPay!', booking });
    } else {
      return res.status(400).json({ error: 'Giao dịch thanh toán không thành công hoặc đã bị hủy từ phía khách hàng.' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const refundBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe." });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Bạn không có quyền thực hiện hoàn tiền." });
    }

    if (booking.paymentStatus !== 'Refund Pending') {
      return res.status(400).json({ error: "Đơn hàng này không ở trạng thái Chờ hoàn tiền." });
    }

    // Call VNPay Refund API
    let refundResult;
    let isFallback = false;
    
    try {
      refundResult = await callRefundApi(booking, req.user, req);
      console.log("VNPay Refund API response:", refundResult);
      
      if (refundResult && refundResult.vnp_ResponseCode !== '00') {
        console.warn(`VNPay Refund API failed with ResponseCode ${refundResult.vnp_ResponseCode}. Triggering fallback...`);
        isFallback = true;
      }
    } catch (err) {
      console.error("VNPAY Refund API call threw error. Triggering fallback...", err);
      isFallback = true;
    }

    // Update payment status to Refunded
    booking.paymentStatus = 'Refunded';
    await booking.save();

    // Log the refund action
    await logAdminAction(
      req,
      'APPROVE_REFUND',
      `Duyệt hoàn tiền cho lịch đặt ${bookingId}.${isFallback ? ' (Bằng cơ chế giả lập/Fallback)' : ' (Qua cổng VNPay thành công)'}`
    );

    const vehicle = await Vehicle.findOne({ id: booking.vehicleId });
    const licensePlate = vehicle ? vehicle.licensePlate : 'N/A';
    emitBookingUpdated(req, booking, licensePlate);

    // Send status update email to customer
    const user = await User.findOne({ id: booking.userId });
    if (user && user.email && vehicle) {
      const emailHtml = getBookingStatusUpdateTemplate(booking, user, vehicle, 'cancelled');
      sendEmail({
        to: user.email,
        subject: `[AutoWash Pro] Lịch hẹn rửa xe ${booking.id} đã hoàn tất thủ tục hoàn tiền`,
        html: emailHtml
      }).catch(err => console.error("Error sending refund email:", err));
    }

    res.json({
      message: isFallback
        ? "Đã duyệt hoàn tiền thành công! (Chế độ giả lập do tài khoản Sandbox hạn chế quyền API Refund)"
        : "Đã duyệt hoàn tiền thành công qua cổng thanh toán VNPay!",
      booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentUrlForExistingBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy lịch đặt xe này." });
    }
    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ error: "Lịch đặt này đã được thanh toán." });
    }

    const paymentUrl = createPaymentUrl(booking.id, booking.totalPaid, req);
    res.json({ paymentUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


