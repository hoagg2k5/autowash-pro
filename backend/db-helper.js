import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Booking from './models/Booking.js';
import LoyaltyRules from './models/LoyaltyRules.js';
import Promotion from './models/Promotion.js';
import PointHistory from './models/PointHistory.js';
import Service from './models/Service.js';
import Voucher from './models/Voucher.js';

// Dành cho khả năng tương thích ngược của controller
export async function getDb() {
  const users = await User.find({});
  const vehicles = await Vehicle.find({});
  const bookings = await Booking.find({});
  const rules = await LoyaltyRules.findOne({});
  const promotions = await Promotion.find({});
  const pointHistory = await PointHistory.find({});
  const services = await Service.find({});
  const vouchers = await Voucher.find({});

  return {
    users,
    vehicles,
    bookings,
    loyaltyRules: rules,
    promotions,
    pointHistory,
    services,
    vouchers
  };
}

export async function saveDb() {
  // Hàm giả lập không làm gì vì các thao tác trên MongoDB được lưu tự động qua .save() hoặc các phương thức Mongoose
  return true;
}

// Hàm tính toán hạng hội viên (Vẫn đồng bộ)
export function calculateTier(totalSpent, tierSettings) {
  let highestTier = "Member";
  const sortedTiers = Object.entries(tierSettings).sort((a, b) => a[1].spendThreshold - b[1].spendThreshold);
  for (const [tier, settings] of sortedTiers) {
    if (totalSpent >= settings.spendThreshold) {
      highestTier = tier;
    }
  }
  return highestTier;
}

// Hành động người dùng
export async function findUserByPhone(phone) {
  return await User.findOne({ phone });
}

export async function findVehiclesByUserId(userId) {
  return await Vehicle.find({ userId });
}

export async function addVehicle(userId, vehicleData) {
  const newVehicle = new Vehicle({
    id: 'v-' + Math.random().toString(36).substr(2, 9),
    userId,
    ...vehicleData,
    licensePlate: vehicleData.licensePlate.toUpperCase().trim()
  });
  await newVehicle.save();
  return newVehicle;
}

// Gói dịch vụ CRUD
export async function getServices() {
  return await Service.find({});
}

export async function addService(serviceData) {
  const newService = new Service({
    id: 's-' + Math.random().toString(36).substr(2, 9),
    name: serviceData.name,
    price: Number(serviceData.price),
    description: serviceData.description || '',
    details: serviceData.details || []
  });
  await newService.save();
  return newService;
}

export async function updateService(id, serviceData) {
  const service = await Service.findOne({ id });
  if (!service) throw new Error("Không tìm thấy gói dịch vụ.");

  service.name = serviceData.name;
  service.price = Number(serviceData.price);
  service.description = serviceData.description || '';
  service.details = serviceData.details || [];

  await service.save();
  return service;
}

export async function deleteService(id) {
  await Service.deleteOne({ id });
  return true;
}

// Đơn đặt lịch (Bookings)
export async function getBookingsByUserId(userId) {
  return await Booking.find({ userId });
}

export async function getAllBookings() {
  return await Booking.find({});
}

export async function createBooking(userId, bookingData) {
  const user = await User.findOne({ id: userId });
  if (!user) throw new Error("Không tìm thấy người dùng");

  // Kiểm tra sự tồn tại và quyền sở hữu xe
  const vehicle = await Vehicle.findOne({ id: bookingData.vehicleId });
  if (!vehicle) {
    throw new Error("Không tìm thấy thông tin xe được chọn.");
  }
  if (vehicle.userId !== userId) {
    throw new Error("Xe được chọn không thuộc quyền sở hữu của bạn.");
  }

  // Kiểm tra xe này đã được đặt lịch trùng ngày và khung giờ chưa
  const existingVehicleBooking = await Booking.findOne({
    vehicleId: bookingData.vehicleId,
    bookingDate: bookingData.bookingDate,
    timeSlot: bookingData.timeSlot,
    status: { $ne: 'Cancelled' }
  });
  if (existingVehicleBooking) {
    throw new Error("Xe này đã được đặt lịch vào ngày và khung giờ đã chọn.");
  }

  const rules = await LoyaltyRules.findOne({});
  if (!rules) throw new Error("Không tìm thấy cấu hình quy tắc phân hạng");

  const userTier = user.loyaltyTier || 'Member';
  const tierSetting = rules.tierSettings[userTier];

  // Kiểm tra thời gian đặt trước tối đa của hạng
  const maxDays = tierSetting.bookingWindowDays;
  const bookingDate = new Date(bookingData.bookingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);

  if (bookingDate < today || bookingDate > maxDate) {
    throw new Error(`Hạng ${userTier} chỉ được đặt lịch trước tối đa ${maxDays} ngày.`);
  }

  // Kiểm tra khung giờ đặt lịch đã qua chưa (nếu đặt cho ngày hôm nay)
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${nowYear}-${nowMonth}-${nowDay}`;

  if (bookingData.bookingDate === todayStr) {
    try {
      const startHourStr = bookingData.timeSlot.split("-")[0].trim();
      const [slotHour, slotMinute] = startHourStr.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMin)) {
        throw new Error("Khung giờ đặt lịch này đã trôi qua. Vui lòng chọn khung giờ khác.");
      }
    } catch (err) {
      if (err.message.includes("đã trôi qua")) {
        throw err;
      }
      console.error("Lỗi khi kiểm tra khung giờ đã qua ở backend:", err);
    }
  }

  // Kiểm tra khoang rửa trùng giờ tại chi nhánh
  const targetBranch = bookingData.branch || "AutoWash Pro - Quận 1";
  const activeBookings = await Booking.find({
    branch: targetBranch,
    bookingDate: bookingData.bookingDate,
    timeSlot: bookingData.timeSlot,
    status: { $ne: 'Cancelled' }
  });

  const BAYS = ["Khoang 1", "Khoang 2", "Khoang 3"];
  let assignedBay = "";

  if (bookingData.bay && BAYS.includes(bookingData.bay)) {
    const isOccupied = activeBookings.some(b => b.bay === bookingData.bay);
    if (isOccupied) {
      throw new Error(`Khoang rửa này (${bookingData.bay}) đã có người đặt trước. Vui lòng chọn khoang khác hoặc giờ khác.`);
    }
    assignedBay = bookingData.bay;
  } else {
    // Không tự động xếp vào khoang rửa trống, chỉ kiểm tra giới hạn số lượng đơn tối đa trong khung giờ (3 đơn/khung giờ)
    if (activeBookings.length >= BAYS.length) {
      throw new Error("Khung giờ này tại chi nhánh đã đầy hết tất cả các khoang rửa. Vui lòng chọn khung giờ khác.");
    }
    assignedBay = "";
  }

  // Lấy giá gói dịch vụ từ database
  const service = await Service.findOne({
    $or: [{ name: bookingData.servicePackage }, { id: bookingData.servicePackage }]
  });
  if (!service) throw new Error("Không tìm thấy gói rửa xe được yêu cầu.");
  
  const price = service.price;

  // Áp dụng chiết khấu tự động theo hạng
  let discountApplied = 0;
  if (userTier === 'Silver' && service.name === 'Deluxe') {
    discountApplied = price * 0.10;
  } else if (userTier === 'Gold' && (service.name === 'Deluxe' || service.name === 'Premium Ultimate')) {
    discountApplied = price * 0.15;
  } else if (userTier === 'Platinum') {
    discountApplied = price * 0.20;
  }

  // Áp dụng khuyến mãi nếu có
  const activePromos = await Promotion.find({
    isActive: true,
    targetTiers: userTier
  });

  let bestPromoDiscount = 0;
  activePromos.forEach(promo => {
    const promoDiscount = price * (promo.discountPercentage / 100);
    if (promoDiscount > bestPromoDiscount) {
      bestPromoDiscount = promoDiscount;
    }
  });

  const actualDiscount = Math.max(discountApplied, bestPromoDiscount);
  let totalPaid = price - actualDiscount;

  // Đổi điểm tích lũy
  let pointsRedeemed = 0;
  let redemptionDiscount = 0;
  if (bookingData.redeemPoints && bookingData.redeemPoints > 0) {
    const pointsToRedeem = Math.min(bookingData.redeemPoints, user.pointsBalance);
    redemptionDiscount = pointsToRedeem * rules.vndPerPointRedeemed;
    pointsRedeemed = pointsToRedeem;
    totalPaid = Math.max(0, totalPaid - redemptionDiscount);
  }

  // Áp dụng mã Voucher thủ công
  let voucherDiscount = 0;
  if (bookingData.promoCode) {
    const voucher = await Voucher.findOne({
      code: bookingData.promoCode.toUpperCase()
    });
    if (
      voucher &&
      voucher.isActive &&
      new Date(voucher.expiryDate) >= new Date() &&
      voucher.targetTiers.includes(userTier) &&
      (price - actualDiscount) >= voucher.minSpent
    ) {
      if (voucher.pointsRequired > 0) {
        if (!user.ownedVouchers || !user.ownedVouchers.some(id => id.toString() === voucher._id.toString())) {
          throw new Error("Bạn chưa sở hữu mã giảm giá này. Vui lòng đổi bằng điểm tích lũy trước.");
        }
        // Tiêu thụ voucher bằng cách xóa một thực thể khỏi danh sách sở hữu của người dùng
        const index = user.ownedVouchers.findIndex(id => id.toString() === voucher._id.toString());
        if (index !== -1) {
          user.ownedVouchers.splice(index, 1);
          user.markModified('ownedVouchers');
          await user.save();
        }
      }

      if (voucher.discountVnd) {
        voucherDiscount = voucher.discountVnd;
      } else if (voucher.discountPercent) {
        voucherDiscount = Math.floor((price - actualDiscount) * (voucher.discountPercent / 100));
      }
      totalPaid = Math.max(0, totalPaid - voucherDiscount);
    }
  }

  // Tính số điểm tích lũy được từ hóa đơn thực tế
  const basePointsEarned = Math.floor(totalPaid / rules.pointsPerVndRate);
  const pointsEarned = Math.floor(basePointsEarned * tierSetting.pointMultiplier);

  const newBooking = new Booking({
    id: 'b-' + Math.random().toString(36).substr(2, 9),
    userId,
    vehicleId: bookingData.vehicleId,
    bookingDate: bookingData.bookingDate,
    timeSlot: bookingData.timeSlot,
    servicePackage: service.name,
    branch: targetBranch,
    bay: assignedBay,
    status: 'Pending',
    price,
    discountApplied: actualDiscount + redemptionDiscount + voucherDiscount,
    pointsEarned,
    pointsRedeemed,
    totalPaid,
    promoCode: bookingData.promoCode || '',
    voucherDiscount,
    paymentMethod: bookingData.paymentMethod || 'Cash',
    paymentStatus: bookingData.paymentStatus || 'Unpaid',
    notes: '',
    createdAt: new Date()
  });

  await newBooking.save();
  return newBooking;
}

// Các phương thức chuyển trạng thái đơn hàng
export async function confirmBooking(bookingId) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");
  booking.status = 'Confirmed';
  await booking.save();
  return booking;
}

export async function checkInBooking(bookingId) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");
  booking.status = 'Waiting';
  booking.checkInTime = new Date();

  await booking.save();
  return booking;
}

export async function startWashBooking(bookingId) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");
  
  if (!booking.bay) {
    throw new Error("Xe chưa được xếp vào khoang rửa. Vui lòng xếp xe vào khoang rửa trước khi bắt đầu.");
  }
  
  booking.status = 'In Progress';
  await booking.save();
  return booking;
}

export async function updateBookingNotes(bookingId, notes) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");
  booking.notes = notes;
  await booking.save();
  return booking;
}

export async function completeBooking(bookingId) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");
  if (booking.status === 'Completed') return booking;

  booking.status = 'Completed';
  await booking.save();

  // Áp dụng tích điểm cho tài khoản khách hàng
  const user = await User.findOne({ id: booking.userId });
  if (user) {
    user.totalSpent += booking.totalPaid;
    user.pointsBalance = (user.pointsBalance - booking.pointsRedeemed) + booking.pointsEarned;

    // Ghi nhận nhật ký điểm
    if (booking.pointsEarned > 0) {
      const historyEarn = new PointHistory({
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        bookingId: booking.id,
        type: 'Earned',
        points: booking.pointsEarned,
        reason: `Rửa xe gói ${booking.servicePackage}`
      });
      await historyEarn.save();
    }
    if (booking.pointsRedeemed > 0) {
      const historyRedeem = new PointHistory({
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        bookingId: booking.id,
        type: 'Redeemed',
        points: booking.pointsRedeemed,
        reason: 'Đổi điểm giảm giá hóa đơn'
      });
      await historyRedeem.save();
    }

    // Tự động thăng hạng (Self-healing Tier)
    const oldTier = user.loyaltyTier;
    const rules = await LoyaltyRules.findOne({});
    if (rules) {
      const newTier = calculateTier(user.totalSpent, rules.tierSettings);
      if (newTier !== oldTier) {
        user.loyaltyTier = newTier;
        user.tierExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }
    await user.save();
  }

  return booking;
}

export function getSlotTimes(bookingDate, timeSlot) {
  const parts = bookingDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const slotParts = timeSlot.split("-");
  const startStr = slotParts[0].trim();
  const endStr = (slotParts[1] || slotParts[0]).trim();

  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  const startTime = new Date(year, month, day, startH, startM, 0, 0);
  const endTime = new Date(year, month, day, endH, endM, 0, 0);

  return { startTime, endTime };
}

export async function cancelBooking(bookingId, reason, wasNoShow) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");
  
  const oldStatus = booking.status;
  if (oldStatus === 'Cancelled') return booking;

  booking.status = 'Cancelled';
  booking.cancelReason = reason || '';
  await booking.save();

  // Áp dụng phạt trừ điểm cho khách hàng đối với Pending hoặc Confirmed
  if (oldStatus === 'Pending' || oldStatus === 'Confirmed') {
    const user = await User.findOne({ id: booking.userId });
    if (user) {
      let penaltyPoints = 0;
      let penaltyReason = '';

      if (wasNoShow) {
        penaltyPoints = 15;
        penaltyReason = `Phạt quá giờ hẹn không tới - No-show (-15 điểm)`;
      } else {
        const { startTime } = getSlotTimes(booking.bookingDate, booking.timeSlot);
        const timeDifference = startTime.getTime() - Date.now();
        const twoHoursMs = 2 * 60 * 60 * 1000;

        if (timeDifference < twoHoursMs) {
          penaltyPoints = 10;
          penaltyReason = `Phạt hủy lịch sát giờ hẹn dưới 2 tiếng (-10 điểm)`;
        }
      }

      if (penaltyPoints > 0) {
        const originalPoints = user.pointsBalance;
        user.pointsBalance = Math.max(0, user.pointsBalance - penaltyPoints);
        const pointsDeducted = originalPoints - user.pointsBalance;

        if (pointsDeducted > 0) {
          const historyPenalty = new PointHistory({
            id: 'ph-' + Math.random().toString(36).substr(2, 9),
            userId: user.id,
            bookingId: booking.id,
            type: 'Redeemed',
            points: pointsDeducted,
            reason: penaltyReason.replace('-15', `-${pointsDeducted}`).replace('-10', `-${pointsDeducted}`)
          });
          await historyPenalty.save();
        }
        await user.save();
      }
    }
  }

  // Nếu đơn hàng đã hoàn tất (Completed) mà bị hủy, cần hoàn trả và thu hồi điểm tương ứng
  if (oldStatus === 'Completed') {
    const user = await User.findOne({ id: booking.userId });
    if (user) {
      // 1. Khấu trừ tổng chi tiêu
      user.totalSpent = Math.max(0, user.totalSpent - booking.totalPaid);
      
      // 2. Hoàn lại điểm đã đổi và Thu hồi điểm tích lũy được thưởng
      user.pointsBalance = Math.max(0, user.pointsBalance + booking.pointsRedeemed - booking.pointsEarned);

      // 3. Ghi nhận vào lịch sử giao dịch điểm
      if (booking.pointsRedeemed > 0) {
        const historyRefund = new PointHistory({
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          bookingId: booking.id,
          type: 'Earned',
          points: booking.pointsRedeemed,
          reason: `Hoàn điểm đổi từ lịch hẹn bị hủy (${booking.id})`
        });
        await historyRefund.save();
      }
      if (booking.pointsEarned > 0) {
        const historyRevoke = new PointHistory({
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          bookingId: booking.id,
          type: 'Redeemed',
          points: booking.pointsEarned,
          reason: `Thu hồi điểm tích lũy của lịch hẹn bị hủy (${booking.id})`
        });
        await historyRevoke.save();
      }

      // 4. Đánh giá lại hạng hội viên khi tổng chi tiêu sụt giảm
      const oldTier = user.loyaltyTier;
      const rules = await LoyaltyRules.findOne({});
      if (rules) {
        const newTier = calculateTier(user.totalSpent, rules.tierSettings);
        if (newTier !== oldTier) {
          user.loyaltyTier = newTier;
          user.tierExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
      }
      
      await user.save();
    }
  }

  return booking;
}

// Điều chỉnh điểm thưởng (Admin)
export async function manualAdjustPoints(userId, newPoints, reason) {
  const user = await User.findOne({ id: userId });
  if (!user) throw new Error("Không tìm thấy người dùng");

  const originalBalance = user.pointsBalance;
  user.pointsBalance = Math.max(0, Number(newPoints));
  const adjustment = user.pointsBalance - originalBalance;

  if (adjustment !== 0) {
    const historyAdjust = new PointHistory({
      id: 'ph-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      bookingId: null,
      type: adjustment >= 0 ? 'Earned' : 'Redeemed',
      points: Math.abs(adjustment),
      reason: reason || "Admin điều chỉnh điểm thủ công"
    });
    await historyAdjust.save();
  }

  await user.save();
  return user;
}

// Rà soát định kỳ (Review)
export async function runMonthlyReview() {
  const users = await User.find({ role: 'customer' });
  const rules = await LoyaltyRules.findOne({});
  if (!rules) return 0;

  let updatedCount = 0;

  for (const user of users) {
    const calculated = calculateTier(user.totalSpent, rules.tierSettings);
    if (user.loyaltyTier !== calculated) {
      user.loyaltyTier = calculated;
      user.tierExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();
      updatedCount++;
    }
  }

  return updatedCount;
}
