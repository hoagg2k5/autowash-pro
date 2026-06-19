import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Nạp các Models
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Booking from './models/Booking.js';
import LoyaltyRules from './models/LoyaltyRules.js';
import Promotion from './models/Promotion.js';
import PointHistory from './models/PointHistory.js';
import Service from './models/Service.js';
import Voucher from './models/Voucher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const DB_PATH = path.join(__dirname, 'db.json');
const MONGODB_URI = process.env.MONGODB_URI;

// Định nghĩa dữ liệu Seeding mặc định cực kỳ đầy đủ
const defaultLoyaltyRules = {
  vndPerPointRedeemed: 1250,
  pointsPerVndRate: 25000,
  tierSettings: {
    Member: { spendThreshold: 0, pointMultiplier: 1.0, bookingWindowDays: 7 },
    Silver: { spendThreshold: 200000, pointMultiplier: 1.2, bookingWindowDays: 10 },
    Gold: { spendThreshold: 500000, pointMultiplier: 1.5, bookingWindowDays: 12 },
    Platinum: { spendThreshold: 1000000, pointMultiplier: 2.0, bookingWindowDays: 14 }
  }
};

const defaultServices = [
  {
    id: "s-express",
    name: "Express",
    price: 100000,
    description: "Làm sạch bụi bẩn vỏ ngoài xe nhanh chóng, phù hợp cho khách hàng bận rộn.",
    details: [
      "Phun nước áp lực cao rã bùn đất",
      "Rửa bọt tuyết chuyên dụng",
      "Xịt rửa gầm xe cơ bản",
      "Lau khô bằng khăn Microfiber"
    ]
  },
  {
    id: "s-deluxe",
    name: "Deluxe",
    price: 200000,
    description: "Chăm sóc toàn diện từ ngoài vào trong, duy trì độ sáng bóng cho xế cưng.",
    details: [
      "Bao gồm tất cả dịch vụ gói Express",
      "Hút bụi thảm và vệ sinh nội thất",
      "Vệ sinh khe cửa, kính lái chuyên sâu",
      "Dưỡng bóng lốp bảo vệ cao su",
      "Khử mùi ozone khoang cabin VIP"
    ]
  },
  {
    id: "s-premium",
    name: "Premium Ultimate",
    price: 400000,
    description: "Gói dịch vụ cao cấp nhất, kết hợp bảo vệ nước sơn và làm sạch khoang máy.",
    details: [
      "Bao gồm tất cả dịch vụ gói Deluxe",
      "Tẩy ố lazang và làm sạch sâu phanh đĩa",
      "Xịt gầm áp lực cao loại bỏ muối mặn",
      "Phủ nano bảo vệ bề mặt sơn xe",
      "Dưỡng nhựa cao cấp khoang động cơ"
    ]
  }
];

const defaultUsers = [
  {
    id: "u-admin",
    phone: "0999999999",
    fullName: "Quản Trị Viên AutoWash",
    role: "admin",
    password: bcrypt.hashSync("admin123", 10),
    createdAt: new Date(),
    loyaltyTier: "Member",
    totalSpent: 0,
    pointsBalance: 0,
    email: "admin@autowashpro.vn"
  },
  {
    id: "u-staff",
    phone: "0888888888",
    fullName: "Nhân Viên Chi Nhánh 1",
    role: "staff",
    password: bcrypt.hashSync("staff123", 10),
    createdAt: new Date(),
    loyaltyTier: "Member",
    totalSpent: 0,
    pointsBalance: 0,
    branch: "AutoWash Pro - Quận 1",
    email: "staff1@autowashpro.vn"
  },
  {
    id: "u-customer",
    phone: "0123456789",
    fullName: "Khách Hàng Thành Viên",
    role: "customer",
    password: bcrypt.hashSync("123456", 10),
    createdAt: new Date(),
    loyaltyTier: "Member",
    totalSpent: 0,
    pointsBalance: 0,
    email: "customer@gmail.com"
  }
];

const defaultVehicles = [
  {
    id: "v-customer-car",
    userId: "u-customer",
    licensePlate: "30A-88888",
    brand: "Toyota",
    model: "Camry",
    color: "Trắng"
  }
];

const defaultVouchers = [
  {
    code: "WELCOME",
    discountVnd: 25000,
    minSpent: 100000,
    targetTiers: ["Member", "Silver", "Gold", "Platinum"],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: "PLATINUMVIP",
    discountPercent: 15,
    minSpent: 200000,
    targetTiers: ["Platinum"],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

const defaultPromotions = [
  {
    id: "promo-1",
    title: "Khuyến Mãi Ra Mắt",
    description: "Giảm giá 5% cho tất cả khách hàng mới trải nghiệm dịch vụ.",
    discountPercentage: 5,
    targetTiers: ["Member"],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  }
];

async function migrate() {
  if (!MONGODB_URI) {
    console.error("LỖI: MONGODB_URI không được định nghĩa trong tệp .env");
    process.exit(1);
  }

  console.log("Đang thiết lập kết nối tới MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("Kết nối thành công!");

  let db = null;

  if (fs.existsSync(DB_PATH)) {
    console.log("📂 Phát hiện tệp db.json. Đang nhập dữ liệu từ db.json...");
    try {
      const rawData = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(rawData);
    } catch (err) {
      console.error("LỖI: Không thể đọc hoặc phân tích cú pháp db.json, chuyển sang chế độ Seeding mặc định.");
    }
  }

  if (!db) {
    console.log("⚠️ Không tìm thấy tệp db.json hợp lệ. Đang kích hoạt tự động Seeding dữ liệu mẫu mặc định...");
    db = {
      users: defaultUsers,
      vehicles: defaultVehicles,
      bookings: [],
      loyaltyRules: defaultLoyaltyRules,
      promotions: defaultPromotions,
      pointHistory: [],
      services: defaultServices,
      vouchers: defaultVouchers
    };
  }

  // 1. Di cư Người dùng (Users)
  if (db.users && db.users.length > 0) {
    console.log(`Đang nạp ${db.users.length} tài khoản người dùng...`);
    await User.deleteMany({});
    await User.insertMany(db.users);
    console.log("Di cư Người dùng hoàn tất!");
  }

  // 2. Di cư Xe liên kết (Vehicles)
  if (db.vehicles && db.vehicles.length > 0) {
    console.log(`Đang nạp ${db.vehicles.length} xe liên kết...`);
    await Vehicle.deleteMany({});
    await Vehicle.insertMany(db.vehicles);
    console.log("Di cư Xe hoàn tất!");
  }

  // 3. Di cư Đơn đặt lịch (Bookings)
  console.log("Đang thiết lập bảng Đơn đặt lịch...");
  await Booking.deleteMany({});
  if (db.bookings && db.bookings.length > 0) {
    console.log(`Đang nạp ${db.bookings.length} đơn đặt lịch...`);
    const bookingsToInsert = db.bookings.map(b => ({
      ...b,
      branch: b.branch || "AutoWash Pro - Quận 1"
    }));
    await Booking.insertMany(bookingsToInsert);
  }
  console.log("Đơn đặt lịch hoàn tất!");

  // 4. Di cư Quy tắc phân hạng (Loyalty Rules)
  if (db.loyaltyRules) {
    console.log("Đang nạp cấu hình quy tắc phân hạng...");
    await LoyaltyRules.deleteMany({});
    await LoyaltyRules.create(db.loyaltyRules);
    console.log("Di cư Quy tắc phân hạng hoàn tất!");
  }

  // 5. Di cư Khuyến mãi (Promotions)
  if (db.promotions && db.promotions.length > 0) {
    console.log(`Đang nạp ${db.promotions.length} chiến dịch khuyến mãi...`);
    await Promotion.deleteMany({});
    await Promotion.insertMany(db.promotions);
    console.log("Di cư Khuyến mãi hoàn tất!");
  }

  // 6. Di cư Lịch sử điểm (Point History)
  console.log("Đang thiết lập bảng Lịch sử điểm...");
  await PointHistory.deleteMany({});
  if (db.pointHistory && db.pointHistory.length > 0) {
    console.log(`Đang nạp ${db.pointHistory.length} dòng lịch sử điểm...`);
    await PointHistory.insertMany(db.pointHistory);
  }
  console.log("Lịch sử điểm hoàn tất!");

  // 7. Di cư Gói rửa xe (Services)
  if (db.services && db.services.length > 0) {
    console.log(`Đang nạp ${db.services.length} gói dịch vụ...`);
    await Service.deleteMany({});
    await Service.insertMany(db.services);
    console.log("Di cư Gói dịch vụ hoàn tất!");
  }

  // 8. Di cư Mã giảm giá (Vouchers)
  if (db.vouchers && db.vouchers.length > 0) {
    console.log(`Đang nạp ${db.vouchers.length} mã giảm giá...`);
    await Voucher.deleteMany({});
    await Voucher.insertMany(db.vouchers);
    console.log("Di cư Mã giảm giá hoàn tất!");
  }

  console.log("\n=======================================================");
  console.log("🎉 KHỞI TẠO VÀ DI CƯ TOÀN BỘ DỮ LIỆU THÀNH CÔNG!");
  console.log("=======================================================\n");
  
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Lỗi nghiêm trọng xảy ra trong quá trình di cư:", err);
  process.exit(1);
});
