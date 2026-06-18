import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

async function migrate() {
  if (!MONGODB_URI) {
    console.error("LỖI: MONGODB_URI không được định nghĩa trong tệp .env");
    process.exit(1);
  }

  if (!fs.existsSync(DB_PATH)) {
    console.error("LỖI: Không tìm thấy tệp db.json tại đường dẫn:", DB_PATH);
    process.exit(1);
  }

  console.log("Đang thiết lập kết nối tới MongoDB Atlas...");
  // Hỗ trợ kết nối MongoDB Atlas
  await mongoose.connect(MONGODB_URI);
  console.log("Kết nối thành công!");

  const rawData = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(rawData);

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
  if (db.bookings && db.bookings.length > 0) {
    console.log(`Đang nạp ${db.bookings.length} đơn đặt lịch...`);
    await Booking.deleteMany({});
    const bookingsToInsert = db.bookings.map(b => ({
      ...b,
      branch: b.branch || "AutoWash Pro - Quận 1"
    }));
    await Booking.insertMany(bookingsToInsert);
    console.log("Di cư Đơn đặt lịch hoàn tất!");
  }

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
  if (db.pointHistory && db.pointHistory.length > 0) {
    console.log(`Đang nạp ${db.pointHistory.length} dòng lịch sử điểm...`);
    await PointHistory.deleteMany({});
    await PointHistory.insertMany(db.pointHistory);
    console.log("Di cư Lịch sử điểm hoàn tất!");
  }

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
  console.log("🎉 DI CƯ TOÀN BỘ DỮ LIỆU SANG MONGODB ATLAS THÀNH CÔNG!");
  console.log("=======================================================\n");
  
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Lỗi nghiêm trọng xảy ra trong quá trình di cư:", err);
  process.exit(1);
});
