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

const PHONE_TO_TEST = '0976772828'; // Số điện thoại test

async function setupTestUserForWarning() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Đã kết nối với MongoDB.");

    const user = await User.findOne({ phone: PHONE_TO_TEST });
    if (!user) {
      console.log(`❌ Không tìm thấy người dùng có số điện thoại ${PHONE_TO_TEST}.`);
      return;
    }

    console.log("\n--- THÔNG TIN TRƯỚC KHI GIẢ LẬP ---");
    console.log(`Hạng hiện tại: ${user.loyaltyTier}`);
    console.log(`Email nhận tin: ${user.email || 'Chưa liên kết'}`);
    console.log(`Hạn duy trì hạng (tierExpiryDate): ${user.tierExpiryDate ? user.tierExpiryDate.toISOString() : 'Không có'}`);
    console.log(`Đã gửi cảnh báo? (tierExpiryWarningSent): ${user.tierExpiryWarningSent ? 'Đã gửi' : 'Chưa gửi'}`);

    // Thiết lập trạng thái giả lập: Platinum, còn 15 ngày hết hạn, chưa gửi cảnh báo, và gán email test nếu chưa có
    user.loyaltyTier = 'Platinum';
    user.totalSpent = 1200000; // Đặt chi tiêu xứng đáng Platinum để tránh bị hạ xuống Gold khi rà soát
    user.tierExpiryDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 ngày tiếp theo (nằm trong mốc <= 16 ngày)
    user.tierExpiryWarningSent = false; // Reset cờ để gửi được cảnh báo
    if (!user.email) {
      user.email = 'demo-khachhang@mailinator.com'; // Gán email demo để gửi thư
    }

    await user.save();

    console.log("\n--- THÔNG TIN SAU KHI GIẢ LẬP ---");
    console.log(`Hạng mới: ${user.loyaltyTier}`);
    console.log(`Email nhận tin mới: ${user.email}`);
    console.log(`Hạn duy trì hạng mới (tierExpiryDate): ${user.tierExpiryDate.toISOString()} (Còn khoảng 15 ngày)`);
    console.log(`Đã gửi cảnh báo mới? (tierExpiryWarningSent): ${user.tierExpiryWarningSent ? 'Đã gửi' : 'Chưa gửi'}`);
    console.log("\n👉 Giả lập hoàn tất! Bây giờ hãy lên Admin Dashboard click nút 'Rà Soát Hạng Tháng' để hệ thống quét gửi email cảnh báo.");

  } catch (error) {
    console.error("Lỗi:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB.");
  }
}

setupTestUserForWarning();
