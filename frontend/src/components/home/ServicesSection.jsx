import React from 'react';
import { ShowerHead, Sparkles, Gem, Check } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function ServicesSection() {
  return (
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
  );
}
