import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const roleArg = process.argv[2]?.toLowerCase();

async function query() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Đã kết nối với MongoDB Atlas.");

    let filter = {};
    if (roleArg === 'admin') {
      filter = { role: 'admin' };
      console.log("🔍 Đang truy vấn tài khoản: [ADMIN]...\n");
    } else if (roleArg === 'staff') {
      filter = { role: 'staff' };
      console.log("🔍 Đang truy vấn tài khoản: [STAFF]...\n");
    } else if (roleArg === 'customer' || roleArg === 'user') {
      filter = { role: 'customer' };
      console.log("🔍 Đang truy vấn tài khoản: [CUSTOMER]...\n");
    } else {
      console.log("🔍 Không có tham số vai trò cụ thể. Hiển thị tất cả tài khoản...\n");
    }

    const users = await User.find(filter, {
      fullName: 1,
      phone: 1,
      email: 1,
      role: 1,
      loyaltyTier: 1,
      pointsBalance: 1,
      branch: 1
    });

    if (users.length === 0) {
      console.log("❌ Không tìm thấy tài khoản nào khớp.");
    } else {
      users.forEach((u, i) => {
        const roleStr = (u.role || 'customer').toUpperCase();
        console.log(`${i + 1}. [${roleStr}] - ${u.fullName}`);
        console.log(`   📞 Số ĐT: ${u.phone}`);
        if (u.email) console.log(`   📧 Email : ${u.email}`);
        if (u.branch) console.log(`   🏢 Chi nhánh: ${u.branch}`);
        if (u.role === 'customer') {
          console.log(`   🎖️ Hạng   : ${u.loyaltyTier || 'Member'} | Điểm tích lũy: ${u.pointsBalance || 0}`);
        }
        console.log("----------------------------------------");
      });
      console.log(`\n🎉 Tìm thấy tổng cộng: ${users.length} tài khoản.`);
    }

  } catch (err) {
    console.error("Lỗi khi truy vấn dữ liệu:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Đã ngắt kết nối MongoDB.");
  }
}

query();
