import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';

// Khắc phục kết nối MongoDB
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Bỏ qua lỗi DNS
}

dotenv.config();

const PHONE_TO_TEST = '0976772828'; // Thay đổi số điện thoại cần test tại đây

async function setupTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Đã kết nối với MongoDB.");

    const user = await User.findOne({ phone: PHONE_TO_TEST });
    if (!user) {
      console.log(`❌ Không tìm thấy người dùng có số điện thoại ${PHONE_TO_TEST}. Vui lòng tạo tài khoản trước.`);
      return;
    }

    console.log("\n--- THÔNG TIN TRƯỚC KHI GIẢ LẬP ---");
    console.log(`Hạng hiện tại: ${user.loyaltyTier}`);
    console.log(`Tổng chi tiêu (totalSpent): ${user.totalSpent}đ`);
    console.log(`Hạn duy trì hạng (tierExpiryDate): ${user.tierExpiryDate ? user.tierExpiryDate.toISOString() : 'Không có'}`);

    // Thiết lập trạng thái giả lập: Hạng Platinum và đã quá hạn 1 ngày
    user.loyaltyTier = 'Platinum';
    user.totalSpent = 1200000; // Đặt chi tiêu tương xứng Platinum
    user.tierExpiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Đã hết hạn từ hôm qua

    await user.save();

    console.log("\n--- THÔNG TIN SAU KHI GIẢ LẬP ---");
    console.log(`Hạng mới: ${user.loyaltyTier}`);
    console.log(`Tổng chi tiêu (totalSpent): ${user.totalSpent}đ`);
    console.log(`Hạn duy trì hạng mới (tierExpiryDate): ${user.tierExpiryDate.toISOString()}`);
    console.log("\n👉 Trạng thái giả lập thành công! Bây giờ hãy lên Admin Dashboard click nút 'Rà Soát Hạng Tháng' để test hạ hạng.");

  } catch (error) {
    console.error("Lỗi:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB.");
  }
}

setupTestUser();
