import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Booking from './models/Booking.js';
import LoyaltyRules from './models/LoyaltyRules.js';
import Promotion from './models/Promotion.js';
import PointHistory from './models/PointHistory.js';
import Service from './models/Service.js';
import Voucher from './models/Voucher.js';
import UserVoucher from './models/UserVoucher.js';
import Bay from './models/Bay.js';
import { sendEmail, getTierExpiryWarningTemplate } from './utils/email.js';

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

export function calculateTier(totalSpent, tierSettings) {
  let highestTier = "Member";
  
  const plainSettings = tierSettings && typeof tierSettings.toObject === 'function' 
    ? tierSettings.toObject() 
    : tierSettings;

  const sortedTiers = Object.entries(plainSettings || {})
    .filter(([tier, settings]) => settings && typeof settings.spendThreshold === 'number')
    .sort((a, b) => a[1].spendThreshold - b[1].spendThreshold);

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
    image: serviceData.image || '',
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
  service.image = serviceData.image || '';
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
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const today = new Date(todayStr + 'T00:00:00+07:00');
  const bookingDate = new Date(bookingData.bookingDate + 'T00:00:00+07:00');
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);

  if (bookingDate < today || bookingDate > maxDate) {
    throw new Error(`Hạng ${userTier} chỉ được đặt lịch trước tối đa ${maxDays} ngày.`);
  }

  // Kiểm tra khung giờ đặt lịch đã qua chưa (nếu đặt cho ngày hôm nay)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

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

  // Kiểm tra sức chứa (Tối đa 3 đơn cho 3 khoang) tại chi nhánh trùng giờ
  const targetBranch = bookingData.branch || "AutoWash Pro - Quận 1";
  const activeBookings = await Booking.find({
    branch: targetBranch,
    bookingDate: bookingData.bookingDate,
    timeSlot: bookingData.timeSlot,
    status: { $nin: ['Cancelled', 'Completed'] }
  });

  const dbBays = await Bay.find({ branch: targetBranch, status: 'Active' });
  const BAYS = dbBays.length > 0 ? dbBays.map(b => b.name) : ["Khoang 1", "Khoang 2", "Khoang 3"];
  let assignedBay = "";

  if (bookingData.bay && BAYS.includes(bookingData.bay)) {
    const isOccupied = activeBookings.some(b => b.bay === bookingData.bay);
    if (isOccupied) {
      throw new Error(`Khoang rửa này (${bookingData.bay}) đã có xe khác sử dụng trong khung giờ này.`);
    }
    assignedBay = bookingData.bay;
  } else {
    // Không tự động xếp vào khoang rửa trống, không giới hạn số lượng đơn đặt lịch của khách hàng
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

  // Loại bỏ đổi điểm trực tiếp trên form đặt lịch (bắt buộc phải đổi lấy Voucher trước ở shop)
  let pointsRedeemed = 0;
  let redemptionDiscount = 0;

  // Áp dụng mã Voucher thủ công
  let voucherDiscount = 0;
  const newBookingId = 'b-' + Math.random().toString(36).substr(2, 9);
  
  if (bookingData.promoCode) {
    const voucher = await Voucher.findOne({
      code: bookingData.promoCode.toUpperCase()
    });
    if (
      voucher &&
      voucher.isActive &&
      voucher.expiryDate >= new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) &&
      voucher.targetTiers.includes(userTier) &&
      (price - actualDiscount) >= voucher.minSpent
    ) {
      if (voucher.pointsRequired > 0 || voucher.code.toUpperCase().startsWith('RW-')) {
        const userVoucher = await UserVoucher.findOne({
          userId: user.id,
          voucherCode: voucher.code,
          isUsed: false
        });
        if (!userVoucher) {
          throw new Error("Bạn chưa sở hữu mã giảm giá này. Vui lòng đổi bằng điểm tích lũy trước.");
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

  const carDetailsStr = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.color})` : '';

  const newBooking = new Booking({
    id: newBookingId,
    userId,
    vehicleId: bookingData.vehicleId,
    licensePlate: vehicle ? vehicle.licensePlate : (bookingData.licensePlate || ''),
    carDetails: carDetailsStr,
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

  // Đánh dấu Voucher của người dùng là đã sử dụng
  if (bookingData.promoCode) {
    const codeUpper = bookingData.promoCode.toUpperCase().trim();
    await UserVoucher.updateOne(
      { userId, voucherCode: codeUpper, isUsed: false },
      { $set: { isUsed: true, usedAt: new Date() } }
    );
  }

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
  booking.bay = '';

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
  booking.washStartTime = new Date();
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

  // Chỉ cho phép hoàn tất khi đơn đang trong trạng thái rửa xe
  if (booking.status !== 'In Progress' && booking.status !== 'In_Progress') {
    throw new Error("Chỉ có thể hoàn tất đơn đang trong quá trình rửa xe (In Progress).");
  }

  booking.status = 'Completed';
  await booking.save();

  // Nếu khách đã thanh toán trước (online), thì lúc hoàn tất sẽ tích điểm
  if (booking.paymentStatus === 'Paid') {
    await processPointsForBooking(booking);
  }

  return booking;
}

export async function checkoutBooking(bookingId) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");

  if (booking.status === 'Cancelled') {
    throw new Error("Không thể thanh toán cho lịch đặt đã bị hủy.");
  }

  if (booking.status !== 'Completed') {
    throw new Error("Lịch đặt chưa được hoàn tất rửa xe. Vui lòng hoàn tất dịch vụ trước khi thanh toán.");
  }

  // Nếu đã thanh toán và đã hoàn thành, chỉ cần trả về booking
  if (booking.paymentStatus === 'Paid' && booking.status === 'Completed') {
    return booking;
  }

  const wasPaid = booking.paymentStatus === 'Paid';

  booking.paymentStatus = 'Paid';
  if (booking.status !== 'Completed') {
    booking.status = 'Completed';
  }

  await booking.save();

  // Tích lũy điểm nếu trước đó chưa thanh toán (vì nếu thanh toán rồi thì completeBooking đã tích điểm)
  if (!wasPaid) {
    await processPointsForBooking(booking);
  }

  return booking;
}

async function processPointsForBooking(booking) {
  booking.completedAt = new Date();
  await booking.save();

  const user = await User.findOne({ id: booking.userId });
  if (user && user.id !== 'customer-id') {
    user.totalSpent += booking.totalPaid;

    if (!user.isWalkInOnly) {
      user.pointsBalance = (user.pointsBalance - booking.pointsRedeemed) + booking.pointsEarned;

      // Ghi nhận nhật ký điểm
      if (booking.pointsEarned > 0) {
        const historyEarn = new PointHistory({
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          bookingId: booking.id,
          type: 'Earned',
          points: booking.pointsEarned,
          reason: `Rửa xe gói ${booking.servicePackage} (Thanh toán hoàn tất)`
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
          reason: 'Đổi điểm giảm giá hóa đơn (Thanh toán hoàn tất)'
        });
        await historyRedeem.save();
      }

      // Tự động thăng hạng (Self-healing Tier) và gia hạn chu kỳ hoạt động 90 ngày (3 tháng)
      const oldTier = user.loyaltyTier;
      const rules = await LoyaltyRules.findOne({});
      if (rules) {
        const newTier = calculateTier(user.totalSpent, rules.tierSettings);
        if (newTier !== oldTier) {
          user.loyaltyTier = newTier;
        }
        user.tierExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        user.tierExpiryWarningSent = false; // Reset cờ cảnh báo hết hạn
      }
    }
    await user.save();
  }
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

  const pad = (n) => String(n).padStart(2, '0');
  const startTime = new Date(`${year}-${pad(month + 1)}-${pad(day)}T${pad(startH)}:${pad(startM)}:00+07:00`);
  const endTime = new Date(`${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(endM)}:00+07:00`);

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

  // Hoàn trả Voucher đã sử dụng (nếu có) để khách hàng có thể dùng lại
  if (booking.promoCode) {
    const codeUpper = booking.promoCode.toUpperCase().trim();
    await UserVoucher.updateOne(
      { userId: booking.userId, voucherCode: codeUpper },
      { $set: { isUsed: false, usedAt: null } }
    );
  }

  // Áp dụng phạt trừ điểm cho khách hàng đối với Pending hoặc Confirmed
  if (oldStatus === 'Pending' || oldStatus === 'Confirmed') {
    const user = await User.findOne({ id: booking.userId });
    if (user && user.id !== 'customer-id' && !user.isWalkInOnly) {
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

  // Nếu đơn hàng đã hoàn tất VÀ ĐÃ THANH TOÁN (đã checkout) mà bị hủy, cần hoàn trả và thu hồi điểm tương ứng
  // Lưu ý: Sau refactor, điểm chỉ được tích khi checkout (paymentStatus = 'Paid'), nên chỉ cần hoàn khi đã Paid
  if (oldStatus === 'Completed' && booking.paymentStatus === 'Paid') {
    const user = await User.findOne({ id: booking.userId });
    if (user && user.id !== 'customer-id') {
      // 1. Khấu trừ tổng chi tiêu
      user.totalSpent = Math.max(0, user.totalSpent - booking.totalPaid);
      
      // 2. Hoàn lại điểm đã đổi và Thu hồi điểm tích lũy được thưởng
      if (!user.isWalkInOnly) {
        user.pointsBalance = Math.max(0, user.pointsBalance + booking.pointsRedeemed - booking.pointsEarned);

        // Ghi nhận vào lịch sử giao dịch điểm
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

        // Đánh giá lại hạng hội viên khi tổng chi tiêu sụt giảm
        const oldTier = user.loyaltyTier;
        const rules = await LoyaltyRules.findOne({});
        if (rules) {
          const newTier = calculateTier(user.totalSpent, rules.tierSettings);
          if (newTier !== oldTier) {
            user.loyaltyTier = newTier;
            user.tierExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            user.tierExpiryWarningSent = false;
          }
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
  const users = await User.find({ role: 'customer', id: { $ne: 'customer-id' }, isWalkInOnly: { $ne: true } });
  const rules = await LoyaltyRules.findOne({});
  if (!rules) return 0;

  let updatedCount = 0;
  const tierProgression = ['Member', 'Silver', 'Gold', 'Platinum'];
  const now = new Date();

  for (const user of users) {
    const isExpired = user.loyaltyTier !== 'Member' && user.tierExpiryDate && now > new Date(user.tierExpiryDate);

    if (isExpired) {
      const currentIndex = tierProgression.indexOf(user.loyaltyTier);
      const newTier = currentIndex <= 0 ? 'Member' : tierProgression[currentIndex - 1];

      user.loyaltyTier = newTier;
      user.totalSpent = rules.tierSettings[newTier]?.spendThreshold || 0;
      // Hạ hạng do quá hạn hoạt động: gia hạn 60 ngày (2 tháng) tiếp theo
      user.tierExpiryDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      user.tierExpiryWarningSent = false; // Reset cờ để gửi cảnh báo ở chu kỳ hạng mới

      await user.save();
      updatedCount++;
    } else {
      const calculated = calculateTier(user.totalSpent, rules.tierSettings);
      if (user.loyaltyTier !== calculated) {
        user.loyaltyTier = calculated;
        // Thăng hạng / đổi hạng thông thường: gia hạn 90 ngày (3 tháng)
        user.tierExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        user.tierExpiryWarningSent = false; // Reset cờ cảnh báo
        await user.save();
        updatedCount++;
      } else {
        // Gửi cảnh báo nếu sắp hết hạn (còn <= 16 ngày, chưa gửi cảnh báo, có email và không phải hạng Member)
        if (user.loyaltyTier !== 'Member' && user.tierExpiryDate && !user.tierExpiryWarningSent && user.email) {
          const remainingDays = Math.ceil((new Date(user.tierExpiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
          if (remainingDays <= 16 && remainingDays > 0) {
            const emailHtml = getTierExpiryWarningTemplate(user, remainingDays);
            await sendEmail({
              to: user.email,
              subject: `[AutoWash Pro] Cảnh báo: Hạng thành viên ${user.loyaltyTier} sắp hết hạn`,
              html: emailHtml
            });
            user.tierExpiryWarningSent = true;
            await user.save();
          }
        }
      }
    }
  }

  return updatedCount;
}

// Sắp xếp khoang rửa xe (Staff/Admin gán khoang)
export async function assignBayToBooking(bookingId, bay) {
  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Không tìm thấy lịch đặt");

  if (bay) {
    // Kiểm tra xem khoang rửa này đã có xe khác sử dụng cùng chi nhánh, ngày, giờ chưa
    const occupied = await Booking.findOne({
      id: { $ne: bookingId },
      branch: booking.branch,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      bay: bay,
      status: { $ne: 'Cancelled' }
    });
    if (occupied) {
      throw new Error(`Khoang ${bay} đã có xe khác sử dụng trong khung giờ này.`);
    }
  }

  booking.bay = bay || "";
  await booking.save();
  return booking;
}
