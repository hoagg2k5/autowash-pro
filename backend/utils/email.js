import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const brevoApiKey = process.env.BREVO_API_KEY;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

let transporter = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false // Avoid connection timeouts or SSL issues on cloud hosting
    }
  });
}

/**
 * Gửi email chung
 */
export async function sendEmail({ to, subject, html }) {
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: 'AutoWash Pro', 
            email: emailUser || 'hoangmoba3988@gmail.com' 
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gửi qua Brevo thất bại.');
      }
      console.log(`[EMAIL SENT VIA BREVO] Message ID: ${data.messageId || 'N/A'} | Recipient: ${to}`);
      return { success: true, simulated: false };
    } catch (error) {
      console.error(`[BREVO ERROR] Failed to send email to ${to}:`, error);
      // Fallback to simulator logging on error
      console.log(`\n========================================\n[BREVO FALLBACK (Error)]\nTo: ${to}\nSubject: ${subject}\nError: ${error.message}\n========================================\n`);
      return { success: true, simulated: true, error: error.message };
    }
  }

  if (!transporter) {
    console.log(`\n========================================\n[SMTP EMAIL SIMULATOR (No Credentials)]\nTo: ${to}\nSubject: ${subject}\nHTML: Check below\n${html}\n========================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"AutoWash Pro" <${emailUser}>`,
      to,
      subject,
      html
    });
    console.log(`[EMAIL SENT] Message ID: ${info.messageId} | Recipient: ${to}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error);
    // Fallback to simulator logging on error
    console.log(`\n========================================\n[SMTP EMAIL SIMULATOR FALLBACK (Error)]\nTo: ${to}\nSubject: ${subject}\nError: ${error.message}\n========================================\n`);
    return { success: true, simulated: true, error: error.message };
  }
}

/**
 * Giao diện Email OTP đẹp mắt
 */
export function getOtpTemplate(otp, type) {
  const actionText = type === 'register' ? 'đăng ký tài khoản mới' : 'khôi phục mật khẩu';
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0284c7; font-family: 'Outfit', sans-serif; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">AutoWash Pro</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Hệ thống quản lý dịch vụ rửa xe thông minh</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px; color: #0f172a;">Xác thực mã OTP</h2>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #475569;">Xin chào Quý khách,</p>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px; color: #475569;">Quý khách đang thực hiện yêu cầu <strong>${actionText}</strong> trên AutoWash Pro. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 28px; font-weight: 800; color: #0284c7; letter-spacing: 6px; padding: 12px 24px; background-color: rgba(2, 132, 199, 0.05); border-radius: 8px; border: 2px dashed #0284c7; display: inline-block;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; color: #ef4444; line-height: 1.5; margin-top: 20px;">
          * Lưu ý: Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo mật tài khoản của bạn.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p>Bản quyền thuộc về © 2026 AutoWash Pro. Bảo lưu mọi quyền.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.</p>
      </div>
    </div>
  `;
}

/**
 * Giao diện Email Hóa đơn & Đặt lịch Rửa xe thành công
 */
export function getBookingConfirmationTemplate(booking, user, vehicle) {
  const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.price);
  const discountFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.discountApplied);
  const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPaid);
  
  const paymentMethodText = booking.paymentMethod === 'Online' ? 'Chuyển khoản Online' : 'Tiền mặt tại quầy';
  const paymentStatusText = booking.paymentStatus === 'Paid' ? 'Đã thanh toán (Thành công)' : 'Chưa thanh toán (Thanh toán sau)';
  const paymentStatusColor = booking.paymentStatus === 'Paid' ? '#16a34a' : '#d97706';

  const ticketQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.id)}`;

  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #0284c7; font-family: 'Outfit', sans-serif; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">AutoWash Pro</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Hóa Đơn Xác Nhận Đặt Lịch Hẹn</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px; color: #0284c7; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Đặt Lịch Thành Công!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Chào <strong>${user.fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Lịch hẹn rửa xe của Quý khách đã được tạo thành công trên hệ thống. Dưới đây là thông tin chi tiết:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 40%;">Mã lịch hẹn:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Khách hàng:</td>
            <td style="padding: 8px 0; color: #0f172a;">${user.fullName} (${user.phone})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Thông tin xe:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0284c7;">${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model} - ${vehicle.color})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Chi nhánh:</td>
            <td style="padding: 8px 0; color: #0f172a;">${booking.branch}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Vị trí rửa xe:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${booking.bay || 'Hệ thống tự động sắp xếp'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Thời gian:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${booking.bookingDate} vào lúc ${booking.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Gói rửa xe:</td>
            <td style="padding: 8px 0; color: #0f172a;">Gói ${booking.servicePackage}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #64748b;">Giá gói dịch vụ:</span>
            <span style="font-weight: 600; float: right;">${priceFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #ef4444;">
            <span style="color: #ef4444;">Ưu đãi giảm giá:</span>
            <span style="font-weight: 600; float: right;">-${discountFormatted}</span>
          </div>
          <div style="border-top: 1px solid #cbd5e1; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
            <span style="color: #0f172a;">Tổng thanh toán:</span>
            <span style="color: #0284c7; float: right;">${totalFormatted}</span>
          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 14px;">
          <p style="margin-bottom: 8px; color: #64748b; font-weight: 600;">Hình thức thanh toán: <span style="color: #0f172a; font-weight: normal;">${paymentMethodText}</span></p>
          <p style="margin-bottom: 20px; color: #64748b; font-weight: 600;">Trạng thái thanh toán: <span style="color: ${paymentStatusColor};">${paymentStatusText}</span></p>
        </div>

        <div style="text-align: center; border-top: 1.5px dashed #e2e8f0; padding-top: 20px;">
          <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 10px;">VÉ LỊCH HẸN QR CODE</p>
          <img src="${ticketQRUrl}" alt="Vé Đặt Lịch QR" style="border: 2px solid #e2e8f0; padding: 5px; border-radius: 8px; width: 160px; height: 160px;" />
          <p style="font-size: 12px; color: #64748b; margin-top: 10px;">Vui lòng xuất trình mã QR này khi mang xe đến chi nhánh để nhân viên thực hiện dịch vụ nhanh nhất.</p>
        </div>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p>Cảm ơn Quý khách đã tin tưởng lựa chọn dịch vụ của AutoWash Pro!</p>
        <p>Hotline hỗ trợ: 1900 8888 | Email: hotro@autowashpro.vn</p>
      </div>
    </div>
  `;
}

/**
 * Giao diện Email thông báo thay đổi trạng thái Lịch đặt (Hủy lịch / Hoàn thành)
 */
export function getBookingStatusUpdateTemplate(booking, user, vehicle, type) {
  const pointsEarnedText = type === 'completed' ? `Quý khách đã được tích lũy thêm <strong>+${booking.pointsEarned} điểm thưởng</strong> vào tài khoản thành viên.` : '';
  const bannerColor = type === 'completed' ? '#16a34a' : '#dc2626';
  const statusLabelText = type === 'completed' ? 'ĐÃ HOÀN THÀNH DỊCH VỤ' : 'ĐÃ HỦY LỊCH HẸN';
  
  const bodyText = type === 'completed' 
    ? `Dịch vụ chăm sóc xe ô tô của Quý khách đã hoàn tất thành công tại chi nhánh của chúng tôi. Cảm ơn Quý khách đã chọn AutoWash Pro.`
    : `Lịch hẹn rửa xe của Quý khách đã được hủy bỏ thành công trong hệ thống của chúng tôi. Nếu có sai sót hay cần đặt lại lịch mới, Quý khách vui lòng truy cập ứng dụng.`;

  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #0284c7; font-family: 'Outfit', sans-serif; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">AutoWash Pro</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Thông Báo Cập Nhật Lịch Hẹn</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: ${bannerColor}; color: white; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 20px;">
          ${statusLabelText}
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Chào Quý khách <strong>${user.fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">${bodyText}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 14px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 12px; color: #64748b; font-weight: 600; width: 40%;">Mã lịch hẹn:</td>
            <td style="padding: 12px; font-weight: bold; color: #0f172a;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #64748b; font-weight: 600;">Xe làm dịch vụ:</td>
            <td style="padding: 12px; font-weight: bold; color: #0284c7;">${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model})</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #64748b; font-weight: 600;">Gói rửa xe:</td>
            <td style="padding: 12px; color: #0f172a;">Gói ${booking.servicePackage}</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #64748b; font-weight: 600;">Chi nhánh:</td>
            <td style="padding: 12px; color: #0f172a;">${booking.branch}</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #64748b; font-weight: 600;">Ngày & Giờ hẹn:</td>
            <td style="padding: 12px; color: #0f172a;">${booking.bookingDate} (${booking.timeSlot})</td>
          </tr>
        </table>

        ${pointsEarnedText ? `
          <div style="background-color: rgba(22, 163, 74, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(22, 163, 74, 0.15); margin-bottom: 15px; font-size: 14px; text-align: center; color: #15803d;">
            🎉 ${pointsEarnedText}
          </div>
        ` : ''}

        <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Nếu có bất kỳ thắc mắc nào, Quý khách vui lòng liên hệ bộ phận hỗ trợ khách hàng của chúng tôi.</p>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p>AutoWash Pro - Chuyên nghiệp, Tận tâm, Sạch bóng!</p>
        <p>Hotline hỗ trợ: 1900 8888 | Email: hotro@autowashpro.vn</p>
      </div>
    </div>
  `;
}

export function getTierExpiryWarningTemplate(user, remainingDays) {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0284c7; font-family: 'Outfit', sans-serif; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">AutoWash Pro</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Hệ thống quản lý dịch vụ rửa xe thông minh</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px; color: #d97706;">⚠️ Cảnh báo sắp hết hạn hạng thành viên</h2>
        <p style="font-size: 15px; line-height: 24px; color: #334155; margin-bottom: 20px;">
          Xin chào <strong>${user.fullName}</strong>,<br/><br/>
          Hệ thống ghi nhận bạn đã lâu chưa sử dụng dịch vụ tại AutoWash Pro. Hiện tại, hạng thành viên <strong>${user.loyaltyTier}</strong> của bạn sắp hết hạn duy trì.
        </p>
        
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #78350f; line-height: 22px;">
            <li>Hạng hiện tại: <strong>${user.loyaltyTier}</strong></li>
            <li>Hạn duy trì hạng: <strong>${new Date(user.tierExpiryDate).toLocaleDateString('vi-VN')}</strong></li>
            <li>Thời gian còn lại: <strong>${remainingDays} ngày</strong></li>
          </ul>
        </div>
        
        <p style="font-size: 14px; line-height: 22px; color: #475569; margin-bottom: 25px;">
          Hãy đặt lịch hẹn rửa xe tiếp theo ngay hôm nay để được tích điểm, giữ vững thứ hạng thành viên và tiếp tục hưởng trọn vẹn các đặc quyền ưu đãi dành riêng cho bạn!
        </p>
        
        <div style="text-align: center;">
          <a href="#" style="background-color: #0284c7; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2);">Đặt Lịch Ngay</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
        <p>Cảm ơn bạn đã lựa chọn AutoWash Pro!</p>
        <p>© 2026 AutoWash Pro. All rights reserved.</p>
      </div>
    </div>
  `;
}
