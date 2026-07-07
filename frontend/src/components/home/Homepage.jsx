import React, { useState, useEffect } from 'react';
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
import { API_BASE_URL } from '../../config.js';

// Imported modular components
import HeroSection from './HeroSection.jsx';
import StatsSection from './StatsSection.jsx';
import ServicesSection from './ServicesSection.jsx';
import FaqSection from './FaqSection.jsx';

export default function Homepage({ onStartBooking, onStartAdmin }) {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/branches?isActive=true`);
        if (response.ok) {
          const data = await response.json();
          setBranches(data);
        }
      } catch (err) {
        console.error("Error loading branches:", err);
      }
    };
    fetchBranches();
  }, []);

  const defaultHanoi = [
    { name: "AutoWash Pro - Cầu Giấy", address: "12 Đường Cầu Giấy, Láng Thượng, Cầu Giấy, Hà Nội", phone: "024.339.888" },
    { name: "AutoWash Pro - Tây Hồ", address: "22 Thụy Khuê, Tây Hồ, Hà Nội", phone: "098866445" }
  ];
  
  const defaultHcmc = [
    { name: "AutoWash Pro - Quận 1", address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM", phone: "02838383838" },
    { name: "AutoWash Pro - Quận 7", address: "456 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. HCM", phone: "02837373737" },
    { name: "AutoWash Pro - Bình Thạnh", address: "789 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP. HCM", phone: "02835353535" },
    { name: "AutoWash Pro - Quận 9", address: "22 Lê Văn Việt, Quận 9, TP. HCM", phone: "0988757035" }
  ];

  const hanoiBranches = branches.filter(b => 
    b.address.toLowerCase().includes('hà nội') || 
    b.name.toLowerCase().includes('hà nội') || 
    b.name.toLowerCase().includes('cầu giấy') || 
    b.name.toLowerCase().includes('tây hồ')
  );

  const hcmcBranches = branches.filter(b => 
    !b.address.toLowerCase().includes('hà nội') && 
    !b.name.toLowerCase().includes('hà nội') && 
    !b.name.toLowerCase().includes('cầu giấy') && 
    !b.name.toLowerCase().includes('tây hồ')
  );

  const displayHanoi = branches.length > 0 ? hanoiBranches : defaultHanoi;
  const displayHcmc = branches.length > 0 ? hcmcBranches : defaultHcmc;
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
        <div className="bg-gradient-to-br from-sky-100/60 via-blue-50 to-indigo-100/40 text-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_20px_50px_rgba(14,165,233,0.12)] border border-sky-200/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl -z-0" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-center mb-4 tracking-tight text-slate-900">
              Hạng Hội Viên &amp; Đặc Quyền Độc Quyền
            </h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto mb-16 text-sm md:text-base leading-relaxed">
              Khách hàng thân thiết tích lũy chi tiêu nhiều hơn, nhận được ưu đãi lớn hơn và đặt lịch trước thuận tiện hơn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Member */}
              <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 transition-all duration-300 hover:-translate-y-2 hover:border-slate-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(148,163,184,0.15)] flex flex-col justify-between h-[360px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/10 rounded-full blur-2xl -z-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-heading">MEMBER</span>
                    {/* EMV Chip */}
                    <div className="w-8 h-6 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 rounded p-1 opacity-70 flex flex-col justify-between">
                      <div className="h-0.5 bg-slate-200/30"></div>
                      <div className="h-0.5 bg-slate-200/30"></div>
                    </div>
                  </div>
                  <h3 className="font-bold font-heading text-lg text-slate-800 mb-1">Thành Viên Mới</h3>
                  <p className="text-[10px] text-slate-400 mb-8">Chi tiêu tích lũy: 0 đ</p>
                  <ul className="space-y-3.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Đặt trước: <strong className="text-slate-800">7 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-sky-600" />
                      <span>Hệ số tích điểm: <strong className="text-slate-800">x1.0</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-sky-600" />
                      <span>Chăm sóc cơ bản</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Silver */}
              <div className="group relative bg-white/75 backdrop-blur-xl rounded-2xl p-6 border border-sky-200/80 transition-all duration-300 hover:-translate-y-2 hover:border-sky-400/50 shadow-[0_8px_30px_rgba(14,165,233,0.04)] hover:shadow-[0_15px_30px_rgba(14,165,233,0.15)] flex flex-col justify-between h-[360px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/10 rounded-full blur-2xl -z-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 font-heading font-semibold">SILVER</span>
                    {/* EMV Chip */}
                    <div className="w-8 h-6 bg-gradient-to-br from-zinc-300 via-slate-300 to-zinc-400 rounded p-1 opacity-80 flex flex-col justify-between">
                      <div className="h-0.5 bg-slate-200/40"></div>
                      <div className="h-0.5 bg-slate-200/40"></div>
                    </div>
                  </div>
                  <h3 className="font-bold font-heading text-lg text-slate-800 mb-1">Thành Viên Bạc</h3>
                  <p className="text-[10px] text-slate-400 mb-8">Tích lũy từ: 200.000 đ</p>
                  <ul className="space-y-3.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Đặt trước: <strong className="text-slate-800">10 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-sky-600" />
                      <span>Tích điểm: <strong className="text-slate-800">x1.2</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5 text-amber-600 font-semibold">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                      <span>Giảm 10% gói Deluxe</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Gold */}
              <div className="group relative bg-gradient-to-br from-white/80 to-amber-50/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-200/80 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.06)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.18)] flex flex-col justify-between h-[360px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -z-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-heading">GOLD</span>
                    {/* EMV Chip */}
                    <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded p-1 opacity-90 flex flex-col justify-between">
                      <div className="h-0.5 bg-yellow-100/50"></div>
                      <div className="h-0.5 bg-yellow-100/50"></div>
                    </div>
                  </div>
                  <h3 className="font-bold font-heading text-lg bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-1">Thành Viên Vàng</h3>
                  <p className="text-[10px] text-slate-400 mb-8">Tích lũy từ: 500.000 đ</p>
                  <ul className="space-y-3.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Đặt trước: <strong className="text-slate-800">12 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-sky-600" />
                      <span>Tích điểm: <strong className="text-slate-800">x1.5</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5 text-amber-600 font-semibold">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                      <span>Giảm 15% Deluxe/Premium</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sky-600">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Hút bụi miễn phí</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Platinum */}
              <div className="group relative bg-gradient-to-br from-white/80 to-indigo-50/20 backdrop-blur-xl rounded-2xl p-6 border border-indigo-200/80 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-400 shadow-[0_8px_30px_rgba(79,70,229,0.06)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.20)] flex flex-col justify-between h-[360px] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 font-heading animate-pulse">PLATINUM</span>
                    {/* EMV Chip */}
                    <div className="w-8 h-6 bg-gradient-to-br from-purple-300 via-indigo-400 to-purple-600 rounded p-1 opacity-95 flex flex-col justify-between">
                      <div className="h-0.5 bg-purple-100/50"></div>
                      <div className="h-0.5 bg-purple-100/50"></div>
                    </div>
                  </div>
                  <h3 className="font-bold font-heading text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">Hạng Kim Cương</h3>
                  <p className="text-[10px] text-slate-400 mb-8">Tích lũy từ: 1.000.000 đ</p>
                  <ul className="space-y-3.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Đặt trước: <strong className="text-slate-800">14 ngày</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-sky-600" />
                      <span>Tích điểm: <strong className="text-slate-800">x2.0</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5 text-amber-600 font-semibold">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                      <span>Giảm 20% mọi hóa đơn</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-indigo-300">
                      <Gem className="w-4 h-4 text-indigo-400" />
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
                {displayHanoi.map((b, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                    <strong className="text-slate-800 text-sm font-heading block mb-1">{b.name}</strong>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {b.address}</p>
                    <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                      <span>🕒 08:00 - 18:00</span>
                      {b.phone && <span>📞 {b.phone}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* HCMC Branches */}
            <Card className="p-8 border-slate-200/60 bg-white">
              <h3 className="border-b-2 border-sky-500 pb-3 mb-6 flex items-center gap-2.5 text-sky-600 font-bold font-heading text-lg">
                <MapPin className="w-5 h-5" /> KHU VỰC TP. HỒ CHÍ MINH
              </h3>
              <div className="space-y-4">
                {displayHcmc.map((b, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border-l-4 border-sky-500">
                    <strong className="text-slate-800 text-sm font-heading block mb-1">{b.name}</strong>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {b.address}</p>
                    <p className="text-[10px] mt-2 text-sky-600 font-semibold flex items-center gap-3">
                      <span>🕒 08:00 - 18:00</span>
                      {b.phone && <span>📞 {b.phone}</span>}
                    </p>
                  </div>
                ))}
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
