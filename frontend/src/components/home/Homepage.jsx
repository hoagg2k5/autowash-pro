import React, { useState } from 'react';
import { 
  Sparkles, 
  Car, 
  ShieldCheck, 
  Clock, 
  Star, 
  Zap, 
  Gem, 
  MapPin, 
  Phone, 
  ShowerHead, 
  Lock, 
  Calendar,
  ChevronDown, 
  Check,
  Award,
  Activity,
  Shield,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function Homepage({ onStartBooking, onStartAdmin }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
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
    <div className="w-full bg-slate-50 min-h-screen font-body overflow-x-hidden">
      
      {/* 1. HERO SECTION WITH PREMIUM DESIGN */}
      <section className="relative overflow-hidden py-24 px-6 lg:py-36 bg-white border-b border-slate-100">
        {/* Modern clean gradient background mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/20 to-slate-50 -z-10" />
        
        {/* Animated Background blur ornaments */}
        <div className="absolute -top-12 -left-12 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
        
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          
          <div className="inline-flex items-center gap-2 bg-sky-50/80 border border-sky-100/80 px-4 py-1.5 rounded-full mb-8 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-sky-500 animate-spin-slow" />
            <span className="text-xs font-bold text-sky-700 tracking-wider uppercase font-heading">
              CÔNG NGHỆ RỬA XE KHÔNG CHẠM &amp; CHĂM SÓC CHUYÊN SÂU
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold font-heading tracking-tighter text-slate-900 leading-[1.15] mb-6">
            Smart Automated<br />
            <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Car Wash
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body">
            AutoWash Pro tích hợp công nghệ nhận diện biển số tự động (LPR), lên lịch hẹn ưu tiên thông minh theo thứ hạng thành viên và tích lũy điểm đổi quà tự động. Mang lại trải nghiệm chăm sóc xe hoàn mỹ cho bạn.
          </p>

          <div className="flex justify-center items-center">
            <Button 
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-sky-600/20 font-bold text-base px-10 py-4 h-13 rounded-xl bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 hover:shadow-sky-600/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              onClick={onStartBooking}
            >
              <Car className="w-5 h-5 mr-2.5 animate-bounce-slow" /> Đặt Lịch Rửa Xe Ngay
            </Button>
          </div>
        </div>

        {/* Floating background details representing bubbles */}
        <div className="absolute top-1/4 left-1/12 text-3xl opacity-10 select-none animate-bounce-slow">💧</div>
        <div className="absolute bottom-1/4 right-1/12 text-4xl opacity-15 select-none animate-pulse">🫧</div>
        <div className="absolute top-1/2 right-1/15 text-2xl opacity-15 select-none">✨</div>
      </section>

      {/* 2. STATS BAR (SHADCN CARD) */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8 text-center bg-white shadow-xl shadow-slate-100 border-slate-100 rounded-2xl">
          <div className="flex flex-col items-center p-4">
            <div className="p-3 bg-sky-50 rounded-xl mb-3 text-sky-600">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">25.000+</span>
            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-heading">Xe được chăm sóc</span>
          </div>

          <div className="flex flex-col items-center p-4 border-t sm:border-t-0 sm:border-l border-slate-100">
            <div className="p-3 bg-amber-50 rounded-xl mb-3 text-amber-600">
              <Star className="w-6 h-6 fill-amber-500/20" />
            </div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">4.9 / 5.0</span>
            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-heading">Đánh giá hài lòng</span>
          </div>

          <div className="flex flex-col items-center p-4 border-t lg:border-t-0 lg:border-l border-slate-100">
            <div className="p-3 bg-indigo-50 rounded-xl mb-3 text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">15 Phút</span>
            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-heading">Thời gian rửa vỏ nhanh</span>
          </div>

          <div className="flex flex-col items-center p-4 border-t sm:border-t-0 sm:border-l border-slate-100">
            <div className="p-3 bg-emerald-50 rounded-xl mb-3 text-emerald-600">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">100%</span>
            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-heading">An toàn cho nước sơn</span>
          </div>
        </Card>
      </section>

      {/* 3. SHOWCASE DETAILED SERVICES */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-slate-900 mb-4">
            Quy Trình Chăm Sóc Xe Chuyên Sâu
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Chúng tôi sử dụng 100% dung dịch tẩy rửa sinh học an toàn cho bề mặt sơn, kết hợp vòi phun áp lực cao góc rộng và quy trình làm sạch nội thất khép kín.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Express */}
          <Card className="flex flex-col h-full bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
            <CardHeader className="relative">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-sky-50 text-sky-700 font-heading">TIÊU CHUẨN</Badge>
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
                  <ShowerHead className="w-5 h-5" />
                </div>
              </div>
              <CardTitle className="mt-4 text-xl">Rửa Xe Express</CardTitle>
              <CardDescription className="min-h-[40px] mt-1.5">
                Làm sạch bụi bẩn vỏ ngoài xe nhanh chóng, phù hợp cho khách hàng bận rộn.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Phun nước áp lực cao rã bùn đất</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Rửa bọt tuyết chuyên dụng</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Xịt rửa gầm xe cơ bản</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Lau khô bằng khăn Microfiber</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="border-t border-slate-50 bg-slate-50/50 p-6 flex justify-between items-center mt-auto">
              <span className="text-xs font-semibold text-slate-400 uppercase font-heading">GIÁ VÉ GỐC</span>
              <span className="text-2xl font-black text-sky-600 font-heading">100.000 đ</span>
            </CardFooter>
          </Card>

          {/* Card 2: Deluxe */}
          <Card className="flex flex-col h-full bg-white border-2 border-sky-500 shadow-xl shadow-sky-600/5 relative overflow-hidden scale-105 z-10">
            <div className="absolute top-0 right-0 left-0 bg-sky-500 text-white text-center py-1 text-[10px] font-bold uppercase tracking-wider font-heading">
              ĐƯỢC LỰA CHỌN NHIỀU NHẤT
            </div>
            <CardHeader className="pt-8">
              <div className="flex justify-between items-start">
                <Badge variant="primary" className="bg-sky-500 text-white font-heading">PHỔ BIẾN</Badge>
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <CardTitle className="mt-4 text-xl text-sky-600">Rửa Xe Deluxe</CardTitle>
              <CardDescription className="min-h-[40px] mt-1.5">
                Chăm sóc toàn diện từ ngoài vào trong, duy trì độ sáng bóng cho xế cưng.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5 text-slate-500">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Bao gồm tất cả dịch vụ gói Express</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Hút bụi thảm và vệ sinh nội thất</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Vệ sinh khe cửa, kính lái chuyên sâu</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Dưỡng bóng lốp bảo vệ cao su</span>
                </li>
                <li className="flex items-start gap-2.5 text-indigo-600">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Khử mùi ozone khoang cabin VIP</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="border-t border-sky-50 bg-sky-50/30 p-6 flex justify-between items-center mt-auto">
              <span className="text-xs font-semibold text-sky-700 uppercase font-heading">GIÁ VÉ GỐC</span>
              <span className="text-2xl font-black text-sky-600 font-heading">200.000 đ</span>
            </CardFooter>
          </Card>

          {/* Card 3: Premium */}
          <Card className="flex flex-col h-full bg-white border border-slate-100 shadow-sm relative overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-heading">VIP SPECIAL</Badge>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Gem className="w-5 h-5" />
                </div>
              </div>
              <CardTitle className="mt-4 text-xl">Premium Ultimate</CardTitle>
              <CardDescription className="min-h-[40px] mt-1.5">
                Gói dịch vụ cao cấp nhất, kết hợp bảo vệ nước sơn và làm sạch khoang máy.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5 text-slate-400">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Bao gồm tất cả dịch vụ gói Deluxe</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Tẩy ố lazang và làm sạch sâu phanh đĩa</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Xịt gầm áp lực cao loại bỏ muối mặn</span>
                </li>
                <li className="flex items-start gap-2.5 text-indigo-600">
                  <Gem className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Phủ nano bảo vệ bề mặt sơn xe</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Dưỡng nhựa cao cấp khoang động cơ</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="border-t border-slate-50 bg-slate-50/50 p-6 flex justify-between items-center mt-auto">
              <span className="text-xs font-semibold text-slate-400 uppercase font-heading">GIÁ VÉ GỐC</span>
              <span className="text-2xl font-black text-sky-600 font-heading">400.000 đ</span>
            </CardFooter>
          </Card>
        </div>
      </section>

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
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-sky-50 rounded-xl mb-4 text-sky-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold font-heading tracking-tight text-slate-900 mb-4">
            Giải Đáp Thắc Mắc Thường Gặp
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
            Thông tin chi tiết hỗ trợ bạn hiểu rõ hơn về quy trình vận hành và ưu đãi thành viên.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all duration-200 border border-slate-200 bg-white rounded-xl overflow-hidden ${isOpen ? 'ring-2 ring-sky-500/20 border-sky-500 shadow-sm' : 'hover:border-slate-300'}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="flex justify-between items-center p-5 select-none">
                  <span className={`font-bold text-sm md:text-base font-heading ${isOpen ? 'text-sky-600' : 'text-slate-800'}`}>
                    {item.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} />
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 text-slate-500 text-xs md:text-sm leading-relaxed font-body">
                    {item.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* 7. CUSTOM CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <Card className="p-12 md:p-20 bg-gradient-to-r from-sky-50 to-indigo-50/50 border-slate-200/50 rounded-3xl relative overflow-hidden shadow-lg">
          {/* Bubble decorations */}
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
