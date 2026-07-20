import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_INSTRUCTION = `Bạn là trợ lý ảo AI thông minh của AutoWash Pro - Hệ thống rửa xe ô tô thông minh và chăm sóc khách hàng thân thiết tại Việt Nam. Hãy trả lời người dùng một cách thân thiện, nhiệt tình, lịch sự và ngắn gọn bằng tiếng Việt.
Thông tin về AutoWash Pro:
1. Các gói dịch vụ:
   - Gói Express: 100.000 đ. Rửa vỏ ngoài xe cơ bản, xịt gầm nhanh.
   - Gói Deluxe: 200.000 đ. Rửa kỹ ngoại thất + hút bụi nội thất + xịt bóng lốp.
   - Gói Premium Ultimate: 400.000 đ. Rửa sâu + tẩy ố lazang + xịt gầm áp lực cao + sáp dưỡng sơn bảo vệ.
2. Các chi nhánh:
   - AutoWash Pro - Quận 1 (Trung tâm)
   - AutoWash Pro - Quận 7
   - AutoWash Pro - Bình Thạnh
   - AutoWash Pro - Cầu Giấy
   - AutoWash Pro - Tây Hồ
   Giờ làm việc: 08:00 - 18:00 hàng ngày (kể cả cuối tuần).
3. Quy tắc tích điểm & Phân hạng thành viên:
   - Hạng Member (Mặc định): Đặt lịch trước tối đa 7 ngày, hệ số tích điểm x1.0 (Rửa xe cứ 25.000đ nhận 1 điểm).
   - Hạng Silver (Tổng chi tiêu >= 200.000đ): Đặt lịch trước tối đa 10 ngày, hệ số x1.2. Đặc quyền: Giảm giá tự động 10% khi đặt gói Deluxe.
   - Hạng Gold (Tổng chi tiêu >= 500.000đ): Đặt lịch trước tối đa 14 ngày, hệ số x1.5. Đặc quyền: Giảm giá tự động 15% khi đặt gói Deluxe hoặc Premium Ultimate.
   - Hạng Platinum (Tổng chi tiêu >= 1.000.000đ): Đặt lịch trước tối đa 30 ngày, hệ số x2.0. Đặc quyền: Giảm giá tự động 20% cho tất cả các gói dịch vụ.
4. Cơ chế đổi điểm và voucher:
   - Đổi điểm trực tiếp khi đặt lịch: 1 điểm tích lũy = 1.250 VND.
   - Đổi điểm lấy voucher trong Cửa hàng đổi thưởng (như Voucher giảm giá 50k, 100k, giảm 15%...) trước khi đặt lịch, sau đó áp dụng mã voucher độc lập ở bước xác nhận thanh toán.
5. Đặt lịch và điều phối khoang rửa:
   - Khách hàng đặt lịch online chỉ cần chọn chi nhánh, ngày giờ, gói rửa xe và xe ô tô của mình (không cần chọn khoang rửa). Hệ thống tự động khóa các slot giờ đã qua để tránh đặt trùng.
   - Khi xe tới chi nhánh, camera thông minh (LPR) sẽ quét biển số xe để nhân viên check-in và xếp xe vào khoang rửa trống phù hợp (Khoang 1, Khoang 2, Khoang 3).
   - Khách đặt lịch trước luôn được ưu tiên (High Priority) hơn khách vãng lai (Walk-in).
6. Quy trình đăng ký tài khoản thành viên mới:
   - Bước 1: Khách hàng click vào nút "Đăng Nhập / Đăng Ký" trên trang chủ.
   - Bước 2: Click vào đường dẫn "Đăng ký thành viên" ở phía dưới form đăng nhập.
   - Bước 3: Điền các thông tin cá nhân bắt buộc (Họ tên, SĐT, Email, Mật khẩu) và thông tin xe (Biển số xe, Hiệu xe, Mẫu xe, Màu xe).
   - Bước 4: Nhấp vào nút "Gửi OTP" để hệ thống gửi mã xác thực 6 số qua email cá nhân của khách. Nhập mã OTP nhận được và click "Xác nhận đăng ký" để hoàn tất. Hệ thống sẽ tự động đăng nhập đưa người dùng vào Dashboard.
7. Quy định hủy lịch và phạt trừ điểm:
   - Hủy trước giờ hẹn > 2 tiếng: Không bị phạt.
   - Hủy sát giờ hẹn < 2 tiếng: Phạt trừ 10 điểm tích lũy.
   - Đặt lịch nhưng quá giờ hẹn không tới (No-show): Phạt trừ 15 điểm tích lũy.
   - Nếu đơn hàng Completed & Paid bị hủy: Hoàn lại tiền chi tiêu (totalSpent), hoàn lại điểm đổi (pointsRedeemed), thu hồi điểm đã thưởng (pointsEarned). Tự động tính toán lại hạng hội viên nếu tổng chi tiêu sụt giảm.
8. Các phương thức thanh toán:
   - Thanh toán tiền mặt (Cash) tại quầy sau khi hoàn tất.
   - Thanh toán chuyển khoản Online qua cổng động VietQR hoặc MoMo, có thời gian đếm ngược 300 giây (5 phút) để quét mã.
9. Phân quyền người dùng:
   - Nhân viên (Staff): Quét biển số xe (LPR), check-in, gán khoang rửa xe trên Timeline sơ đồ, bắt đầu rửa xe, hoàn thành rửa xe, quản lý hàng đợi.
   - Quản trị viên (Admin): Theo dõi analytics doanh thu, biểu đồ SVG, quản lý CRUD (Khách hàng, Nhân viên, Chi nhánh, Gói rửa, Voucher), cấu hình quy tắc tích điểm và chạy rà soát hạng hội viên tháng. Các hoạt động của Admin được ghi vết trong Audit Logs.
10. Tự động rà soát và hết hạn hạng hội viên:
    - Cấp bậc hội viên Silver, Gold, Platinum sau khi thăng hạng sẽ có giá trị trong vòng 30 ngày. Hàng tháng Admin có thể bấm nút "Rà Soát Hạng Tháng" để hệ thống cập nhật lại hạng dựa trên thực chi.

Vui lòng trả lời người dùng thân thiện, ngắn gọn và tập trung vào các dịch vụ của AutoWash Pro. Không bịa đặt thông tin không có trong danh sách trên.`;

// Xử lý phản hồi cục bộ trong trường hợp Offline / Không có API Key
function getLocalFallbackResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes("đăng ký") || msg.includes("đăng kí") || msg.includes("tài khoản") || msg.includes("tạo nick") || msg.includes("signup") || msg.includes("register")) {
    return "Để **đăng ký tài khoản thành viên mới** tại AutoWash Pro, bạn vui lòng làm theo các bước sau:\n" +
           "1. Bấm vào nút **Đăng Nhập / Đăng Ký** ở góc phải thanh menu trang chủ.\n" +
           "2. Click chọn đường dẫn **Đăng ký thành viên** ở phía dưới biểu mẫu.\n" +
           "3. Điền thông tin cá nhân: *Họ tên, Số điện thoại, Email và Mật khẩu đăng nhập*.\n" +
           "4. Nhập thông tin xe ô tô của bạn: *Biển số xe, Hiệu xe, Mẫu xe, Màu xe* (giúp hệ thống nhận dạng biển số LPR tự động check-in).\n" +
           "5. Nhập Email của bạn rồi bấm **Gửi OTP**, kiểm tra hòm thư email để nhận mã OTP và nhập vào ô xác thực.\n" +
           "6. Bấm **Xác nhận đăng ký** để hoàn thành. Bạn sẽ tự động được đăng nhập và đưa vào màn hình Dashboard cá nhân.";
  }

  if (msg.includes("đăng nhập") || msg.includes("login") || msg.includes("vào tài khoản") || msg.includes("pass") || msg.includes("mật khẩu")) {
    return "Để **đăng nhập** vào hệ thống AutoWash Pro:\n" +
           "1. Bấm vào nút **Đăng Nhập / Đăng Ký** ở góc trên bên phải trang chủ.\n" +
           "2. Nhập *Số điện thoại* (hoặc Email) đã dùng để đăng ký và *Mật khẩu*.\n" +
           "3. Bấm **Đăng nhập**.\n" +
           "• Nếu quên mật khẩu, bạn click vào **Quên mật khẩu?** để nhận mã OTP xác thực đổi mật khẩu mới qua Email.";
  }

  if (msg.includes("hủy") || msg.includes("huỷ") || msg.includes("cancel") || msg.includes("phạt") || msg.includes("hoàn điểm") || msg.includes("no-show")) {
    return "Chính sách **Hủy lịch & Phạt trừ điểm** tại AutoWash Pro quy định như sau:\n" +
           "• **Hủy lịch sớm (trước giờ hẹn > 2 tiếng)**: Hoàn toàn miễn phí, không bị phạt.\n" +
           "• **Hủy lịch sát giờ (dưới 2 tiếng)**: Phạt trừ **10 điểm** tích lũy.\n" +
           "• **Quá giờ hẹn không đến (No-show)**: Phạt trừ **15 điểm** tích lũy.\n" +
           "• **Hoàn trả khi hủy đơn đã hoàn tất**: Nếu đơn hàng đã hoàn tất & thanh toán bị hủy, hệ thống sẽ tự động hoàn lại tiền chi tiêu, hoàn lại số điểm đã đổi và thu hồi số điểm đã thưởng. Hạng hội viên sẽ được tính toán lại tự động theo tổng chi tiêu thực tế mới.";
  }

  if (msg.includes("thanh toán") || msg.includes("momo") || msg.includes("vietqr") || msg.includes("qr") || msg.includes("chuyển khoản") || msg.includes("tiền mặt") || msg.includes("cash") || msg.includes("online")) {
    return "AutoWash Pro hỗ trợ hai phương thức thanh toán linh hoạt:\n" +
           "1. 💵 **Thanh toán tiền mặt (Cash)**: Khách hàng thanh toán trực tiếp tại quầy sau khi rửa xe xong.\n" +
           "2. 📱 **Thanh toán chuyển khoản Online**: Hệ thống tự động tạo mã QR VietQR hoặc MoMo động kèm số tiền cần trả. Khách hàng có **300 giây (5 phút)** đếm ngược để quét mã thanh toán trực tuyến. Lịch hẹn sẽ được xác nhận tự động ngay khi thanh toán thành công.";
  }

  if (msg.includes("nhân viên") || msg.includes("staff") || msg.includes("admin") || msg.includes("quản trị") || msg.includes("audit") || msg.includes("quyền")) {
    return "Hệ thống phân quyền cho hai nhóm quản trị như sau:\n" +
           "• 👷 **Nhân viên (Staff)**: Sử dụng console để quét biển số (LPR), kiểm tra xe đến, check-in, gán khoang rửa xe (bên trong sơ đồ Timeline), bắt đầu rửa xe, hoàn thành rửa xe và quản lý hàng đợi xếp xe.\n" +
           "• 👑 **Quản trị viên (Admin)**: Xem biểu đồ doanh thu chi tiết, quản lý danh sách khách hàng/nhân viên, thêm/sửa/xóa gói dịch vụ và voucher, cấu hình luật tích điểm và thực hiện rà soát hạng hội viên định kỳ. Mọi hành động của Admin đều được lưu vết trong **Nhật ký hệ thống (Audit Logs)** để tăng tính minh bạch.";
  }

  if (msg.includes("rà soát") || msg.includes("hết hạn") || msg.includes("thời hạn") || msg.includes("tự động")) {
    return "Hạng hội viên (Silver, Gold, Platinum) của AutoWash Pro có cơ chế quản lý tự động:\n" +
           "• Hạng hội viên mới có hiệu lực trong vòng **30 ngày** kể từ thời điểm thăng hạng.\n" +
           "• Cuối mỗi tháng, Admin có thể chạy tính năng **Rà soát hạng tháng**. Hệ thống sẽ tự động quét toàn bộ khách hàng và cập nhật lại hạng hội viên tương ứng với tổng chi tiêu thực tế tích lũy của khách.";
  }

  if (msg.includes("giá") || msg.includes("gói") || msg.includes("dịch vụ") || msg.includes("bao nhiêu tiền") || msg.includes("express") || msg.includes("deluxe") || msg.includes("premium")) {
    return "AutoWash Pro hiện cung cấp 3 gói dịch vụ rửa xe chuyên nghiệp:\n" +
           "1. 🧼 **Gói Express (100.000 đ)**: Rửa sạch vỏ ngoài cơ bản và xịt gầm nhanh.\n" +
           "2. ✨ **Gói Deluxe (200.000 đ)**: Rửa kỹ ngoại thất, hút bụi nội thất và xịt dưỡng bóng lốp xe.\n" +
           "3. 💎 **Gói Premium Ultimate (400.000 đ)**: Rửa sâu, tẩy ố lazang, xịt gầm áp lực cao và phủ sáp dưỡng sơn bảo vệ chuyên sâu.\n" +
           "Bạn có muốn tôi tư vấn kỹ hơn về gói rửa xe nào không?";
  }
  
  if (msg.includes("địa chỉ") || msg.includes("chi nhánh") || msg.includes("ở đâu") || msg.includes("cửa hàng")) {
    return "Hệ thống AutoWash Pro hiện có 5 chi nhánh hoạt động từ 08:00 đến 18:00 hàng ngày:\n" +
           "📍 **Chi nhánh Quận 1** (Trung tâm)\n" +
           "📍 **Chi nhánh Quận 7**\n" +
           "📍 **Chi nhánh Bình Thạnh**\n" +
           "📍 **Chi nhánh Cầu Giấy**\n" +
           "📍 **Chi nhánh Tây Hồ**\n" +
           "Quý khách có thể lựa chọn chi nhánh gần nhất khi thực hiện đặt lịch trên website.";
  }
  
  if (msg.includes("tích điểm") || msg.includes("điểm") || msg.includes("nâng hạng") || msg.includes("phân hạng") || msg.includes("hội viên") || msg.includes("member") || msg.includes("silver") || msg.includes("gold") || msg.includes("platinum")) {
    return "Chính sách Hội viên & Tích điểm thưởng của AutoWash Pro gồm:\n" +
           "• **Member (Mặc định)**: Đặt trước tối đa 7 ngày, tích lũy x1.0 (rửa xe cứ 25.000đ được 1 điểm).\n" +
           "• 🥈 **Silver (Từ 200k chi tiêu)**: Đặt trước tối đa 10 ngày, tích lũy x1.2. *Đặc quyền: Giảm 10% gói Deluxe.*\n" +
           "• 🥇 **Gold (Từ 500k chi tiêu)**: Đặt trước tối đa 14 ngày, tích lũy x1.5. *Đặc quyền: Giảm 15% gói Deluxe/Premium Ultimate.*\n" +
           "• 👑 **Platinum (Từ 1tr chi tiêu)**: Đặt trước tối đa 30 ngày, tích lũy x2.0. *Đặc quyền: Giảm 20% cho tất cả gói dịch vụ.*\n" +
           "Khi đặt lịch rửa xe, bạn có thể quy đổi điểm (1 điểm = 1.250đ) hoặc dùng điểm đổi voucher giảm giá.";
  }
  
  if (msg.includes("voucher") || msg.includes("mã giảm giá") || msg.includes("khuyến mãi") || msg.includes("đổi thưởng") || msg.includes("quà")) {
    return "Bạn có hai cách để nhận ưu đãi giảm giá tại AutoWash Pro:\n" +
           "1. **Chiết khấu tự động**: Hệ thống tự động giảm giá hóa đơn tùy theo hạng hội viên của bạn (Silver - 10%, Gold - 15%, Platinum - 20%).\n" +
           "2. **Đổi Voucher**: Bạn vào tab 'Đổi Quà' trong Dashboard để đổi điểm tích lũy lấy các mã Voucher giảm giá độc lập (Voucher 50k, 100k...). Khi đặt lịch ở Bước 3, bạn chọn voucher đã đổi để áp dụng trực tiếp.";
  }
  
  if (msg.includes("đặt lịch") || msg.includes("hẹn") || msg.includes("khoang") || msg.includes("bay") || msg.includes("xếp xe") || msg.includes("chờ")) {
    return "Quy trình đặt lịch và xếp khoang rửa rất thuận tiện cho khách hàng:\n" +
           "1. Bạn thực hiện đặt lịch online bằng cách chọn xe, gói dịch vụ, chi nhánh và khung giờ mong muốn. Bạn **không cần tự chọn khoang rửa** lúc đặt.\n" +
           "2. Khi mang xe đến cửa hàng, camera thông minh (LPR) sẽ quét biển số xe để check-in và nhân viên sẽ xếp xe vào khoang trống (Khoang 1, 2 hoặc 3) thực tế.\n" +
           "Khách đặt trước luôn được ưu tiên cao hơn khách vãng lai (Walk-in) để tránh phải chờ đợi.";
  }

  if (msg.includes("chào") || msg.includes("hello") || msg.includes("hi") || msg.includes("xin chào") || msg.includes("được không") || msg.includes("ai")) {
    return "Xin chào! Tôi là Trợ lý ảo AI của hệ thống rửa xe thông minh AutoWash Pro. 🧼🚗\n" +
           "Tôi có thể hỗ trợ tư vấn các gói rửa xe, chi nhánh hoạt động, chính sách đổi điểm thưởng và luật đặt lịch hẹn. Bạn muốn hỏi gì thêm?";
  }

  return "Cảm ơn bạn đã liên hệ AutoWash Pro! Trợ lý ảo chưa hiểu rõ ý bạn. Bạn vui lòng thử hỏi về: các gói dịch vụ rửa xe, địa chỉ các chi nhánh, chính sách tích điểm hội viên hoặc quy trình đặt lịch rửa xe để tôi hỗ trợ nhanh nhất nhé!";
}

export const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Tin nhắn không được để trống." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Nếu không có API Key, kích hoạt chế độ Fallback Offline ngay lập tức
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      console.log("[AI Chatbot] Kích hoạt chế độ Offline Fallback (Thiếu API Key)");
      const textResponse = getLocalFallbackResponse(message);
      return res.json({ response: textResponse, isFallback: true });
    }

    // Định dạng lịch sử trò chuyện theo chuẩn Gemini API (v1beta)
    // history: [{ role: "user"|"model", parts: [{ text: "..." }] }]
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        if (item.role && item.parts && Array.isArray(item.parts)) {
          contents.push({
            role: item.role === 'assistant' ? 'model' : item.role,
            parts: item.parts.map(p => ({ text: p.text || "" }))
          });
        }
      });
    }

    // Thêm tin nhắn hiện tại
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[AI Chatbot] Lỗi phản hồi từ Gemini API:", errorData);
      throw new Error("Lỗi API Gemini");
    }

    const data = await response.json();
    
    // Parse kết quả từ cấu trúc trả về của Gemini
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.json({ response: reply, isFallback: false });
    } else {
      throw new Error("Không thể phân tích phản hồi từ Gemini");
    }

  } catch (error) {
    console.error("[AI Chatbot] Có lỗi xảy ra:", error.message);
    // Tự động khôi phục bằng chế độ Fallback nếu có lỗi kết nối mạng hoặc lỗi API khác
    const textResponse = getLocalFallbackResponse(req.body.message);
    res.json({ response: textResponse, isFallback: true });
  }
};
