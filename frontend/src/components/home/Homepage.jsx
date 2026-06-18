import React, { useState } from 'react';

export default function Homepage({ onStartBooking, onStartAdmin }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  const faqData = [
    {
      q: "Làm thế nào để được nâng hạng Hội viên (Silver/Gold/Platinum)?",
      a: "Hệ thống tự động nâng hạng dựa trên tổng số tiền bạn đã thanh toán tại AutoWash Pro: Silver từ 200.000đ, Gold từ 500.000đ và Platinum từ 1.000.000đ. Hệ thống tự động kiểm tra và nâng hạng tức thì ngay khi hóa đơn rửa xe của bạn được hoàn tất."
    },
    {
      q: "Điểm thưởng tích lũy (Wash Points) được tính và quy đổi như thế nào?",
      a: "Với mỗi 25.000đ chi tiêu, bạn tích lũy 1 điểm gốc. Điểm này được nhân thêm theo hệ số hạng của bạn (Member x1.0, Silver x1.2, Gold x1.5, Platinum x2.0). Khi tích lũy đủ điểm, bạn có thể đổi 20 điểm để được giảm giá 25.000đ trực tiếp khi đặt lịch hẹn rửa lần kế tiếp."
    },
    {
      q: "Đặc quyền đặt lịch trước ưu tiên hoạt động ra sao?",
      a: "Khách hàng hạng cao hơn sẽ có khung ngày đặt trước rộng hơn (Member: 7 ngày, Silver: 10 ngày, Gold: 12 ngày, Platinum: 14 ngày). Điều này giúp bạn dễ dàng giữ chỗ vào các khung giờ vàng cuối tuần hoặc ngày lễ mà các thành viên mới chưa có quyền đặt chỗ."
    },
    {
      q: "Tôi có thể liên kết nhiều xe ô tô trên cùng một tài khoản không?",
      a: "Hoàn toàn được! Bạn có thể thêm không giới hạn xe ô tô của mình hoặc người thân (gồm Biển số xe, Hãng xe, Dòng xe và Màu sắc) trong trang cá nhân và dễ dàng tùy chọn chiếc xe muốn rửa khi tiến hành đặt lịch hẹn."
    }
  ];

  return (
    <div className="container" style={{ padding: 0, maxWidth: '100%' }}>
      
      {/* 1. HERO SECTION WITH RICH DETAIL */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden', padding: '6rem 2rem 5rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', zIndex: 2, position: 'relative' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--secondary-glow)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.4rem 1rem', borderRadius: '30px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1rem' }}>✨</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
              CÔNG NGHỆ RỬA XE KHÔNG CHẠM & CHĂM SÓC CHUYÊN SÂU
            </span>
          </div>

          <h1 className="hero-title" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: '1.1' }}>
            Giải Pháp Rửa Xe Ô Tô<br />
            <span style={{ color: 'var(--primary)' }}>Thông Minh Thế Hệ Mới</span>
          </h1>
          
          <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '750px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>
            AutoWash Pro tích hợp công nghệ nhận diện biển số tự động (LPR), lên lịch hẹn ưu tiên thông minh theo thứ hạng thành viên và tích lũy điểm đổi quà tự động. Mang lại trải nghiệm chăm sóc xe hoàn mỹ cho bạn.
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={onStartBooking}>
              <span>🚗</span> Đặt Lịch Rửa Xe Ngay
            </button>
            <button className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={onStartAdmin}>
              🔐 Bảng Quản Trị Admin
            </button>
          </div>
        </div>

        {/* Decorative elements representing water droplets / shine */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', fontSize: '3rem', opacity: 0.15 }}>💧</div>
        <div style={{ position: 'absolute', top: '70%', right: '15%', fontSize: '4.5rem', opacity: 0.12 }}>🫧</div>
        <div style={{ position: 'absolute', top: '40%', right: '8%', fontSize: '2.5rem', opacity: 0.15 }}>✨</div>
        <div style={{ position: 'absolute', bottom: '10%', left: '8%', fontSize: '3.5rem', opacity: 0.1 }}>🚿</div>
      </section>

      {/* 2. LIVE ACTIVITY STATS COUNTER */}
      <section className="container" style={{ padding: '0 2rem' }}>
        <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', padding: '2rem', textAlign: 'center', marginTop: '-2rem', background: '#ffffff', borderRadius: '16px' }}>
          <div>
            <span style={{ fontSize: '2rem', display: 'block' }}>🏆</span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--primary)', fontWeight: 800 }}>25.000+</strong>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Xe ô tô được chăm sóc</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '2rem', display: 'block' }}>⭐</span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--primary)', fontWeight: 800 }}>4.9 / 5.0</strong>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Đánh giá hài lòng thực tế</p>
          </div>
          <div>
            <span style={{ fontSize: '2rem', display: 'block' }}>⚡</span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--primary)', fontWeight: 800 }}>15 Phút</strong>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Thời gian rửa vỏ trung bình</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '2rem', display: 'block' }}>🛡️</span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--primary)', fontWeight: 800 }}>100%</strong>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>An toàn sơn xe & Không trầy xước</p>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE DETAILED WASH SERVICES */}
      <section className="container" style={{ padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Quy Trình Chăm Sóc Xe Chuyên Sâu</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto' }}>
            Chúng tôi sử dụng 100% dung dịch tẩy rửa sinh học an toàn cho bề mặt sơn, kết hợp vòi phun áp lực cao góc rộng và quy trình làm sạch nội thất khép kín.
          </p>
        </div>

        <div className="packages-grid" style={{ pointerEvents: 'none' }}>
          <div className="package-card" style={{ border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: 700 }}>TIÊU CHUẨN</span>
              <span style={{ fontSize: '1.5rem' }}>💧</span>
            </div>
            <h3 style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Rửa Xe Express</h3>
            <p className="text-xs" style={{ margin: '0.75rem 0 1.25rem 0', color: 'var(--text-muted)', minHeight: '40px' }}>
              Làm sạch bụi bẩn vỏ ngoài xe nhanh chóng, phù hợp cho khách hàng bận rộn.
            </p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <li>Phun nước áp lực cao rã bùn đất</li>
              <li>Rửa bọt tuyết chuyên dụng</li>
              <li>Xịt rửa gầm xe cơ bản</li>
              <li>Lau khô bằng khăn Microfiber</li>
            </ul>
            <div className="package-price">100.000 đ</div>
          </div>

          <div className="package-card" style={{ border: '2.5px solid var(--primary)', boxShadow: '0 8px 25px rgba(2, 132, 199, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#0284c7', color: '#ffffff', borderRadius: '4px', fontWeight: 700 }}>PHỔ BIẾN NHẤT</span>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
            </div>
            <h3 style={{ marginTop: '1rem', fontSize: '1.25rem', color: 'var(--primary)' }}>Rửa Xe Deluxe</h3>
            <p className="text-xs" style={{ margin: '0.75rem 0 1.25rem 0', color: 'var(--text-muted)', minHeight: '40px' }}>
              Chăm sóc toàn diện từ ngoài vào trong, duy trì độ sáng bóng cho xế cưng.
            </p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <li><strong>Tất cả dịch vụ gói Express</strong></li>
              <li>Hút bụi thảm và vệ sinh nội thất cơ bản</li>
              <li>Vệ sinh khe cửa, kính lái chuyên sâu</li>
              <li>Dưỡng bóng lốp bảo vệ cao su</li>
              <li>Khử mùi ozone khoang cabin</li>
            </ul>
            <div className="package-price">200.000 đ</div>
          </div>

          <div className="package-card" style={{ border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f3e8ff', color: '#6b21a8', borderRadius: '4px', fontWeight: 700 }}>VIP SPECIAL</span>
              <span style={{ fontSize: '1.5rem' }}>💎</span>
            </div>
            <h3 style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Premium Ultimate</h3>
            <p className="text-xs" style={{ margin: '0.75rem 0 1.25rem 0', color: 'var(--text-muted)', minHeight: '40px' }}>
              Gói dịch vụ cao cấp nhất, kết hợp bảo vệ nước sơn và làm sạch khoang máy.
            </p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <li><strong>Tất cả dịch vụ gói Deluxe</strong></li>
              <li>Tẩy ố lazang và làm sạch sâu phanh đĩa</li>
              <li>Xịt gầm áp lực cao loại bỏ muối mặn</li>
              <li>Phủ nano bảo vệ bề mặt sơn chống nước mưa</li>
              <li>Dưỡng chi tiết nhựa khoang động cơ</li>
            </ul>
            <div className="package-price">400.000 đ</div>
          </div>
        </div>
      </section>

      {/* 4. THE 5-STEP CUSTOMER JOURNEY */}
      <section className="container" style={{ padding: '2rem 2rem 5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Quy Trình Đặt Lịch & Thực Hiện Rửa Xe</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '550px', margin: '0 auto' }}>
            Trải nghiệm dịch vụ 5 bước hiện đại và nhanh chóng tại AutoWash Pro.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto 1rem auto' }}>1</div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Đăng Ký & Liên Kết</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Đăng ký tài khoản nhanh chóng bằng Số điện thoại + Biển số xe ô tô.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto 1rem auto' }}>2</div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Đặt Lịch Trực Tuyến</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Chọn ngày, khung giờ rảnh và gói rửa. Áp dụng mã giảm giá tự động.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto 1rem auto' }}>3</div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Nhận Diện Biển Số</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Lái xe đến trung tâm, Camera LPR tự động quét biển số xe để check-in.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto 1rem auto' }}>4</div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Chăm Sóc Xe</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Xe được chăm sóc theo đúng gói dịch vụ đã chọn bởi kỹ thuật viên lành nghề.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto 1rem auto' }}>5</div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Hoàn Tất & Tích Điểm</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Thanh toán tiền mặt, nhận điểm thưởng tích lũy và nâng hạng thành viên.
            </p>
          </div>

        </div>
      </section>

      {/* 5. LOYALTY TIER PROGRAM */}
      <section className="container" style={{ padding: '3rem 2rem' }}>
        <div className="homepage-tiers-section">
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem' }}>Hạng Hội Viên & Đặc Quyền Độc Quyền</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Khách hàng thân thiết tích lũy chi tiêu nhiều hơn, nhận được ưu đãi lớn hơn và đặt lịch trước thuận tiện hơn.
          </p>

          <div className="tier-card-row">
            <div className="tier-detail-card" style={{ borderTop: '4px solid var(--tier-member)' }}>
              <span className="tier-indicator tier-Member">MEMBER</span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem' }}>Thành Viên Mới</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Ngưỡng chi tiêu: 0 đ</p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <li>Khung ngày đặt trước: <strong>7 ngày</strong></li>
                <li>Hệ số tích điểm: <strong>x1.0 điểm gốc</strong></li>
                <li>Dịch vụ chăm sóc cơ bản</li>
              </ul>
            </div>

            <div className="tier-detail-card" style={{ borderTop: '4px solid var(--tier-silver)' }}>
              <span className="tier-indicator tier-Silver">SILVER</span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem' }}>Thành Viên Bạc</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Tích lũy đạt từ: 200,000 đ</p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <li>Khung ngày đặt trước: <strong>10 ngày</strong></li>
                <li>Hệ số tích điểm: <strong>x1.2 điểm</strong></li>
                <li><strong>Giảm ngay 10%</strong> gói Deluxe</li>
                <li>Ưu tiên đặt giờ cao điểm</li>
              </ul>
            </div>

            <div className="tier-detail-card" style={{ borderTop: '4px solid var(--tier-gold)' }}>
              <span className="tier-indicator tier-Gold">GOLD</span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem' }}>Thành Viên Vàng</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Tích lũy đạt từ: 500,000 đ</p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <li>Khung ngày đặt trước: <strong>12 ngày</strong></li>
                <li>Hệ số tích điểm: <strong>x1.5 điểm</strong></li>
                <li><strong>Giảm ngay 15%</strong> Deluxe / Premium</li>
                <li>Tặng <strong>Hút bụi cabin miễn phí</strong></li>
              </ul>
            </div>

            <div className="tier-detail-card" style={{ borderTop: '4px solid var(--tier-platinum)', boxShadow: '0 8px 30px rgba(124, 58, 237, 0.12)' }}>
              <span className="tier-indicator tier-Platinum">PLATINUM</span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--tier-platinum)' }}>Thành Viên Kim Cương</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Tích lũy đạt từ: 1,000,000 đ</p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <li>Khung ngày đặt trước: <strong>14 ngày</strong></li>
                <li>Hệ số tích điểm: <strong>x2.0 điểm</strong></li>
                <li><strong>Giảm ngay 20%</strong> mọi hóa đơn</li>
                <li>Miễn phí <strong>Detailing bóng lốp + gầm</strong></li>
                <li><strong>Làn ưu tiên</strong> không cần xếp hàng</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5 BRANCHES NETWORK SECTION */}
      <section className="container" style={{ padding: '3rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '1rem' }}>Hệ Thống Chi Nhánh AutoWash Pro</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Hệ thống trạm rửa xe tự động thông minh của chúng tôi đã có mặt tại 2 thành phố lớn Hà Nội & TP. Hồ Chí Minh với trang thiết bị LPR hiện đại.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* HN Branches */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '1.3rem' }}>
              📍 KHU VỰC HÀ NỘI
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>AutoWash Pro - Cầu Giấy</strong>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>📍 Địa chỉ: 12 Đường Cầu Giấy, Láng Thượng, Cầu Giấy, Hà Nội</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>🕒 Hoạt động: 08:00 - 18:00 | 📞 Hotline: 024.339.888</p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>AutoWash Pro - Tây Hồ</strong>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>📍 Địa chỉ: 88 Đường Xuân Diệu, Quảng An, Tây Hồ, Hà Nội</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>🕒 Hoạt động: 08:00 - 18:00 | 📞 Hotline: 024.339.999</p>
              </div>
            </div>
          </div>

          {/* HCMC Branches */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '1.3rem' }}>
              📍 KHU VỰC TP. HỒ CHÍ MINH
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>AutoWash Pro - Quận 1</strong>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>📍 Địa chỉ: 45 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. HCM</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>🕒 Hoạt động: 08:00 - 18:00 | 📞 Hotline: 028.777.111</p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>AutoWash Pro - Quận 7</strong>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>📍 Địa chỉ: 200 Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, TP. HCM</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>🕒 Hoạt động: 08:00 - 18:00 | 📞 Hotline: 028.777.222</p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>AutoWash Pro - Bình Thạnh</strong>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>📍 Địa chỉ: 15 Điện Biên Phủ, Phường 15, Bình Thạnh, TP. HCM</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>🕒 Hoạt động: 08:00 - 18:00 | 📞 Hotline: 028.777.333</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE FAQ SECTION */}
      <section className="container" style={{ padding: '3rem 2rem 5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Giải Đáp Thắc Mắc Thường Gặp</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
            Thông tin chi tiết hỗ trợ bạn hiểu rõ hơn về quy trình vận hành và ưu đãi thành viên.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqData.map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="glass-panel" 
                style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s ease', background: isOpen ? 'rgba(2, 132, 199, 0.02)' : '#ffffff', borderColor: isOpen ? 'var(--primary)' : 'var(--border-color)' }}
                onClick={() => toggleFaq(index)}
              >
                <div className="flex-between" style={{ fontWeight: 700, fontSize: '1rem', color: isOpen ? 'var(--primary)' : 'var(--text-main)' }}>
                  <span>{item.q}</span>
                  <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
                </div>
                {isOpen && (
                  <p className="text-sm" style={{ marginTop: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CUSTOM CALL TO ACTION */}
      <section className="container" style={{ textAlign: 'center', padding: '0 2rem 5rem 2rem' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', background: 'linear-gradient(135deg, #ffffff, rgba(14, 165, 233, 0.03))', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 800 }}>Chăm sóc chiếc xe của bạn tốt nhất ngay hôm nay!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '1.05rem' }}>
            Tham gia chương trình khách hàng thân thiết AutoWash Pro để nhận các gói quà tặng chăm sóc, giảm giá tức thì và ưu tiên đặt chỗ.
          </p>
          <button className="btn btn-primary" style={{ padding: '0.85rem 3rem', fontSize: '1.1rem', boxShadow: '0 6px 20px var(--primary-glow)' }} onClick={onStartBooking}>
            🚀 Đặt lịch hẹn trực tuyến
          </button>
          
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '6rem', opacity: 0.05 }}>🚗</div>
        </div>
      </section>
    </div>
  );
}
