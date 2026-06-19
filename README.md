# AutoWash Pro - Hệ Thống Quản Lý Dịch Vụ Rửa Xe Tự Động Thông Minh & Khách Hàng Thân Thiết

AutoWash Pro là ứng dụng quản lý dịch vụ chăm sóc xe ô tô thông minh, tích hợp công nghệ mô phỏng nhận diện biển số (LPR), xếp lịch biểu thông minh và hệ thống chăm sóc khách hàng thân thiết (Loyalty Program) tự động. Dự án được phát triển theo mô hình full-stack hiện đại nhằm giải quyết bài toán tối ưu hóa quy trình dịch vụ tại trạm rửa xe và giữ chân khách hàng.

---

## 🌟 Tính Năng Nổi Bật (Ăn Điểm Giáo Viên)

1. **Hệ Thống Phân Hạng Hội Viên (Loyalty Tiers) Tự Động**:
   - Hệ thống tự động phân loại khách hàng dựa trên tổng chi tiêu thành các hạng: **Member**, **Silver**, **Gold**, và **Platinum**.
   - Tự động áp dụng chiết khấu hóa đơn (10% - 20%) và nhân hệ số điểm thưởng tích lũy (x1.0 - x2.0) tương ứng với từng thứ hạng khi đặt lịch.
   - Hỗ trợ cơ chế tự động hạ hạng hoặc điều chỉnh thứ hạng thủ công từ Admin.

2. **Đặt Lịch Hẹn Động & Phân Phối Khoang Rửa (Dynamic Booking & Slot Allocation)**:
   - Giới hạn số ngày đặt trước (Booking Window Days) theo thứ hạng hội viên để ưu tiên cho khách hàng thân thiết (Ví dụ: Member được đặt trước 7 ngày, Platinum lên tới 14 ngày).
   - Thuật toán tự động phát hiện và phân phối xe vào các khoang rửa trống tại chi nhánh được chọn, đảm bảo không bị chồng chéo khung giờ.

3. **Tích Lũy & Quy Đổi Điểm Thưởng (Wash Points)**:
   - Cho phép khách hàng tùy chọn tiêu điểm tích lũy để quy đổi thành số tiền giảm giá trực tiếp trên hóa đơn theo tỷ lệ quy định linh hoạt.

4. **Tích Hợp WebSockets Cập Nhật Trạng Thái Thời Gian Thực (Real-time Updates)**:
   - Sử dụng **Socket.io** kết nối hai chiều giữa các phân hệ Khách Hàng, Nhân Viên và Admin.
   - Khi nhân viên cập nhật trạng thái rửa xe (Đang rửa, Hoàn thành), ứng dụng khách hàng lập tức hiển thị thông báo toast và thay đổi trạng thái thời gian thực mà không cần tải lại trang.

5. **Mô Phỏng Nhận Diện Biển Số LPR (License Plate Recognition Simulation)**:
   - Cung cấp bảng điều khiển giả lập camera quét biển số tự động tại cổng trạm để thực hiện check-in và tự động đưa xe vào khoang rửa tương ứng.

6. **Hóa Đơn Email & Vé QR Code Tự Động**:
   - Tự động tạo và gửi email xác nhận lịch rửa xe chuyên nghiệp bằng HTML, tích hợp sinh mã QR Code để quét check-in nhanh khi đến trạm.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Node.js** & **Express.js**: Xây dựng Restful API và quản lý logic nghiệp vụ.
- **MongoDB Atlas** (Mongoose ODM): Cơ sở dữ liệu đám mây lưu trữ thông tin có cấu trúc.
- **Socket.io**: Xử lý luồng dữ liệu thời gian thực.
- **Nodemailer**: Gửi email hóa đơn và mã xác thực OTP.
- **Bcryptjs & JWT**: Bảo mật xác thực tài khoản và phân quyền người dùng (Admin, Staff, Customer).

### Frontend
- **React 19** (Vite build tool): Thư viện xây dựng giao diện người dùng SPA nhanh chóng.
- **Tailwind CSS**: Thiết kế giao diện responsive và tùy biến giao diện premium.
- **Lucide React**: Bộ icon vector chất lượng cao đồng bộ.
- **Socket.io-client**: Kết nối thời gian thực với máy chủ.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
├── backend/
│   ├── controllers/      # Bộ điều khiển xử lý logic nghiệp vụ (Auth, Booking, Customer...)
│   ├── middleware/       # Middleware xác thực token, kiểm tra quyền hạn
│   ├── models/           # Định nghĩa các Schema Mongoose (User, Vehicle, Booking...)
│   ├── routes/           # Định nghĩa các Endpoint API tương ứng
│   ├── utils/            # Công cụ bổ trợ (Gửi Email, Tạo mã OTP...)
│   ├── db-helper.js      # Lớp dịch vụ tương tác cơ sở dữ liệu MongoDB
│   └── server.js         # Entrypoint chạy server Node.js & Socket.io
│
├── frontend/
│   ├── public/           # Các tài nguyên tĩnh (favicon, hình ảnh...)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/    # Phân hệ quản trị admin (Analytics, Vouchers, Simulation...)
│   │   │   ├── customer/ # Phân hệ khách hàng (Đặt lịch, quản lý xe...)
│   │   │   ├── staff/    # Phân hệ nhân viên trạm rửa xe
│   │   │   ├── shared/   # Các component và tiện ích dùng chung (Toast, Header...)
│   │   │   └── ui/       # UI Components nguyên bản theo chuẩn Shadcn (Button, Card, Badge...)
│   │   ├── lib/          # Thư viện tiện ích (utils.js cho Tailwind merge)
│   │   ├── App.jsx       # Quản lý Routing và State chính toàn ứng dụng
│   │   ├── index.css     # Design System cốt lõi của ứng dụng
│   │   └── main.jsx      # Điểm khởi đầu của ứng dụng React
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn Bị File Cấu Hình Môi Trường (.env)

Tạo tệp `.env` tại thư mục `/backend` với các nội dung sau:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/autowash
JWT_SECRET=secret-key-autowash

# (Tùy chọn) Cấu hình Gmail gửi email thực tế, nếu không cấu hình OTP/Hóa đơn sẽ ghi log ra Terminal
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 2. Cài Đặt & Chạy Backend

Di chuyển vào thư mục backend và chạy các lệnh:
```bash
cd backend
npm install
npm start
```
*Server mặc định chạy tại: `http://localhost:5000`*

### 3. Cài Đặt & Chạy Frontend

Mở một terminal mới, di chuyển vào thư mục frontend và chạy các lệnh:
```bash
cd frontend
npm install
npm run dev
```
*Ứng dụng React chạy tại: `http://localhost:5173`*

---

## 📈 Cơ Sở Dữ Liệu & Thực Thể (Database Schema)

Dự án thiết kế mô hình dữ liệu quan hệ trên MongoDB gồm các bảng:
- **User**: Lưu trữ thông tin tài khoản người dùng, phân quyền (role), tổng chi tiêu (totalSpent), số dư điểm thưởng (pointsBalance), và hạng hội viên (loyaltyTier).
- **Vehicle**: Xe ô tô liên kết của người dùng (Biển số xe làm khóa chính định danh, thương hiệu, dòng xe, màu sắc).
- **Booking**: Lưu thông tin lịch đặt rửa xe, giá vé gốc, số tiền thực trả, số điểm tích lũy, số điểm đã tiêu, trạng thái rửa xe (Pending, Confirmed, In Progress, Completed, Cancelled).
- **LoyaltyRules**: Cấu hình toàn cục hệ thống điểm (Số tiền quy đổi, hệ số thăng hạng của Silver/Gold/Platinum).
- **Voucher**: Mã giảm giá khuyến mãi phân phối theo từng thứ hạng hội viên.
- **PointHistory**: Lưu lịch sử tích điểm và tiêu điểm chi tiết của khách hàng phục vụ kiểm toán dữ liệu.
