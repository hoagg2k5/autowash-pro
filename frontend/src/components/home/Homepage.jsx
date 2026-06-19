import React from 'react';
import { 
  Sparkles, 
  Car, 
  Star, 
  Zap, 
  Gem, 
  MapPin, 
  Calendar,
  Check,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

// Imported modular components
import HeroSection from './HeroSection.jsx';
import StatsSection from './StatsSection.jsx';
import ServicesSection from './ServicesSection.jsx';
import FaqSection from './FaqSection.jsx';

export default function Homepage({ onStartBooking, onStartAdmin }) {
  return (
    <div className="w-full bg-slate-50 min-h-screen font-body overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <HeroSection onStartBooking={onStartBooking} />

      {/* 2. STATS BAR */}
      <StatsSection />

      {/* 3. Quy Trình Chăm Sóc Xe Chuyên Sâu */}
      <ServicesSection />

      {/* 4. THE 5-STEP CUSTOMER JOURNEY */}
      <section className="bg-slate-100/50 py-24 px-6 border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-slate-900 mb-4">
              Quy Trình Đặt Lịch &amp; Thực Hiện Rửa Xe
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
              Trải nghiệm dịch vụ 5 bước hiện đại và nhanh chóng tại AutoWash Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { title: "Đăng Ký & Liên Kết", desc: "Đăng ký nhanh chóng bằng Số điện thoại + Biển số xe ô tô." },
              { title: "Đặt Lịch Trực Tuyến", desc: "Chọn ngày, khung giờ và gói rửa. Áp dụng voucher giảm giá tự động." },
              { title: "Nhận Diện Biển Số", desc: "Lái xe đến trung tâm, Camera LPR tự động quét biển số để check-in." },
              { title: "Chăm Sóc Xe", desc: "Xe được chăm sóc chuyên nghiệp theo đúng dịch vụ bởi kỹ thuật viên." },
              { title: "Hoàn Tất & Tích Điểm", desc: "Thanh toán tiện lợi, nhận điểm thưởng và thăng hạng thành viên." }
            ].map((step, idx) => (
              <Card key={idx} className="bg-white border border-slate-200/60 p-6 text-center hover:-translate-y-1 hover:shadow-lg rounded-2xl relative">
                <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold font-heading mx-auto mb-4 shadow-md shadow-sky-500/10">
                  {idx + 1}
                </div>
                <h4 className="font-bold font-heading text-sm text-slate-900 mb-2">{step.title}</h4>
                <p className="text-[11px] leading-relaxed text-slate-400">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LOYALTY TIER PROGRAM */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -z-0" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold font-heading text-center mb-4">Hạng Hội Viên &amp; Đặc Quyền Độc Quyền</h2>
            <p className="text-sky-200/80 text-center max-w-2xl mx-auto mb-12 text-sm leading-relaxed">
              Khách hàng thân thiết tích lũy chi tiêu nhiều hơn, nhận được ưu đãi lớn hơn và đặt lịch trước thuận tiện hơn.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Member */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="border-white/20 text-white bg-white/5 font-heading">MEMBER</Badge>
                  <h3 className="font-bold font-heading text-lg mt-4 mb-1">Thành Viên Mới</h3>
                  <p className="text-[10px] text-sky-200 mb-6">Chi tiêu tích lũy: 0 đ</p>
                  <ul className="space-y-3 text-xs text-sky-100">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-300" />
                      <span>Đặt trước: <strong>7 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-sky-300" />
                      <span>Hệ số tích điểm: <strong>x1.0</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-sky-300" />
                      <span>Chăm sóc cơ bản</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Silver */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="border-slate-300/40 text-slate-200 bg-slate-300/10 font-heading">SILVER</Badge>
                  <h3 className="font-bold font-heading text-lg mt-4 mb-1">Thành Viên Bạc</h3>
                  <p className="text-[10px] text-sky-200 mb-6">Tích lũy từ: 200.000 đ</p>
                  <ul className="space-y-3 text-xs text-sky-100">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-300" />
                      <span>Đặt trước: <strong>10 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-sky-300" />
                      <span>Tích điểm: <strong>x1.2</strong></span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-300">
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
                      <span><strong>Giảm 10%</strong> gói Deluxe</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Gold */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20 flex flex-col justify-between shadow-lg shadow-amber-500/5">
                <div>
                  <Badge variant="outline" className="border-amber-400/40 text-amber-300 bg-amber-400/10 font-heading">GOLD</Badge>
                  <h3 className="font-bold font-heading text-lg mt-4 mb-1 text-amber-300">Thành Viên Vàng</h3>
                  <p className="text-[10px] text-sky-200 mb-6">Tích lũy từ: 500.000 đ</p>
                  <ul className="space-y-3 text-xs text-sky-100">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-300" />
                      <span>Đặt trước: <strong>12 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-sky-300" />
                      <span>Tích điểm: <strong>x1.5</strong></span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-300">
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
                      <span><strong>Giảm 15%</strong> Deluxe/Premium</span>
                    </li>
                    <li className="flex items-center gap-2 text-sky-300">
                      <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                      <span>Hút bụi miễn phí</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Platinum */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-indigo-400/40 flex flex-col justify-between shadow-xl shadow-indigo-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/20 rounded-full blur-xl -z-0" />
                <div className="relative z-10">
                  <Badge variant="outline" className="border-indigo-300/50 text-indigo-200 bg-indigo-500/20 font-heading animate-pulse">PLATINUM</Badge>
                  <h3 className="font-bold font-heading text-lg mt-4 mb-1 text-indigo-200">Hạng Kim Cương</h3>
                  <p className="text-[10px] text-sky-200 mb-6">Tích lũy từ: 1.000.000 đ</p>
                  <ul className="space-y-3 text-xs text-sky-100">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-300" />
                      <span>Đặt trước: <strong>14 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-sky-300" />
                      <span>Tích điểm: <strong>x2.0</strong></span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-300">
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
                      <span><strong>Giảm 20%</strong> mọi hóa đơn</span>
                    </li>
                    <li className="flex items-center gap-2 text-indigo-300">
                      <Gem className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Làn ưu tiên VIP (Không chờ)</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5.5 BRANCHES NETWORK SECTION */}
      <section className="bg-slate-100/30 py-24 px-6 border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-slate-900 mb-4">
              Hệ Thống Chi Nhánh AutoWash Pro
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
              Hệ thống trạm rửa xe tự động thông minh của chúng tôi đã có mặt tại 2 thành phố lớn Hà Nội &amp; TP. Hồ Chí Minh với trang thiết bị LPR hiện đại.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* HN Branches */}
            <Card className="p-8 border-slate-200/60 bg-white">
              <h3 className="border-b-2 border-sky-500 pb-3 mb-6 flex items-center gap-2.5 text-sky-600 font-bold font-heading text-lg">
                <MapPin className="w-5 h-5" /> KHU VỰC HÀ NỘI
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                  <strong className="text-slate-800 text-sm font-heading block mb-1">AutoWash Pro - Cầu Giấy</strong>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> 12 Đường Cầu Giấy, Láng Thượng, Cầu Giấy, Hà Nội</p>
                  <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                    <span>🕒 08:00 - 18:00</span>
                    <span>📞 024.339.888</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                  <strong className="text-slate-800 text-sm font-heading block mb-1">AutoWash Pro - Tây Hồ</strong>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> 88 Đường Xuân Diệu, Quảng An, Tây Hồ, Hà Nội</p>
                  <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                    <span>🕒 08:00 - 18:00</span>
                    <span>📞 024.339.999</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* HCMC Branches */}
            <Card className="p-8 border-slate-200/60 bg-white">
              <h3 className="border-b-2 border-sky-500 pb-3 mb-6 flex items-center gap-2.5 text-sky-600 font-bold font-heading text-lg">
                <MapPin className="w-5 h-5" /> KHU VỰC TP. HỒ CHÍ MINH
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                  <strong className="text-slate-800 text-sm font-heading block mb-1">AutoWash Pro - Quận 1</strong>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> 45 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. HCM</p>
                  <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                    <span>🕒 08:00 - 18:00</span>
                    <span>📞 028.777.111</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                  <strong className="text-slate-800 text-sm font-heading block mb-1">AutoWash Pro - Quận 7</strong>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> 200 Nguyễn Văn Linh, Quận 7, TP. HCM</p>
                  <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                    <span>🕒 08:00 - 18:00</span>
                    <span>📞 028.777.222</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                  <strong className="text-slate-800 text-sm font-heading block mb-1">AutoWash Pro - Bình Thạnh</strong>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> 15 Điện Biên Phủ, Bình Thạnh, TP. HCM</p>
                  <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                    <span>🕒 08:00 - 18:00</span>
                    <span>📞 028.777.333</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE FAQ SECTION */}
      <FaqSection />

      {/* 7. CUSTOM CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <Card className="p-12 md:p-20 bg-gradient-to-r from-sky-50 to-indigo-50/50 border-slate-200/50 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 select-none rotate-12">🚗</div>
          <div className="absolute top-10 left-10 text-4xl opacity-5 select-none">🫧</div>
          
          <h3 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 mb-4 tracking-tight">
            Chăm sóc chiếc xe của bạn tốt nhất ngay hôm nay!
          </h3>
          <p className="text-slate-500 max-w-xl mx-auto mb-8 text-sm md:text-base leading-relaxed">
            Tham gia chương trình khách hàng thân thiết AutoWash Pro để nhận các gói quà tặng chăm sóc, giảm giá tức thì và ưu tiên đặt chỗ.
          </p>
          <Button 
            size="lg"
            className="shadow-xl shadow-sky-600/25 px-10 py-3"
            onClick={onStartBooking}
          >
            🚀 Đặt lịch hẹn trực tuyến <ArrowRight className="w-4 h-4 ml-2 animate-pulse" />
          </Button>
        </Card>
      </section>
    </div>
  );
}
