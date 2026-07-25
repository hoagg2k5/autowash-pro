import React, { useState, useEffect } from 'react';
import { ShowerHead, Sparkles, Gem, Check } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { API_BASE_URL } from '../../config.js';

export default function ServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mẫu mặc định làm phương án dự phòng (fallback) nếu lỗi kết nối hoặc DB trống
  const defaultServices = [
    {
      id: "s-express",
      name: "Rửa Xe Express",
      price: 100000,
      description: "Làm sạch bụi bẩn vỏ ngoài xe nhanh chóng, phù hợp cho khách hàng bận rộn.",
      details: [
        "Phun nước áp lực cao rã bùn đất",
        "Rửa bọt tuyết chuyên dụng",
        "Xịt rửa gầm xe cơ bản",
        "Lau khô bằng khăn Microfiber"
      ]
    },
    {
      id: "s-deluxe",
      name: "Rửa Xe Deluxe",
      price: 200000,
      description: "Chăm sóc toàn diện từ ngoài vào trong, duy trì độ sáng bóng cho xế cưng.",
      details: [
        "Bao gồm tất cả dịch vụ gói Express",
        "Hút bụi thảm và vệ sinh nội thất",
        "Vệ sinh khe cửa, kính lái chuyên sâu",
        "Dưỡng bóng lốp bảo vệ cao su",
        "Khử mùi ozone khoang cabin VIP"
      ],
      isPopular: true
    },
    {
      id: "s-premium",
      name: "Premium Ultimate",
      price: 400000,
      description: "Gói dịch vụ cao cấp nhất, kết hợp bảo vệ nước sơn và làm sạch khoang máy.",
      details: [
        "Bao gồm tất cả dịch vụ gói Deluxe",
        "Tẩy ố lazang và làm sạch sâu phanh đĩa",
        "Xịt gầm áp lực cao loại bỏ muối mặn",
        "Phủ nano bảo vệ bề mặt sơn xe",
        "Dưỡng nhựa cao cấp khoang động cơ"
      ]
    }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/services`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setServices(data);
          } else {
            setServices(defaultServices);
          }
        } else {
          setServices(defaultServices);
        }
      } catch (err) {
        console.error("Lỗi khi tải dịch vụ từ DB:", err);
        setServices(defaultServices);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getServiceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('premium') || n.includes('ultimate') || n.includes('kim cương') || n.includes('vip')) {
      return <Gem className="w-5 h-5" />;
    }
    if (n.includes('deluxe') || n.includes('vàng') || n.includes('phổ biến')) {
      return <Sparkles className="w-5 h-5" />;
    }
    return <ShowerHead className="w-5 h-5" />;
  };

  const displayServices = services.length > 0 ? services : defaultServices;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {displayServices.map((service, idx) => {
          // Gói thứ 2 hoặc gói có thuộc tính isPopular hoặc có tên chứa Deluxe sẽ được làm nổi bật (Deluxe)
          const isFeatured = service.isPopular || service.name.toLowerCase().includes('deluxe') || (displayServices.length === 3 && idx === 1);
          
          return (
            <Card 
              key={service.id || service._id || idx} 
              className={`flex flex-col h-full bg-white relative overflow-hidden transition-all duration-300 ${
                isFeatured 
                  ? 'border-2 border-sky-500 shadow-xl shadow-sky-600/5 md:scale-105 z-10' 
                  : 'border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isFeatured && (
                <div className="absolute top-0 right-0 left-0 bg-sky-500 text-white text-center py-1 text-[10px] font-bold uppercase tracking-wider font-heading">
                  ĐƯỢC LỰA CHỌN NHIỀU NHẤT
                </div>
              )}
              
              <CardHeader className={isFeatured ? "pt-8" : "relative"}>
                <div className="flex justify-between items-start">
                  <Badge 
                    variant={isFeatured ? "primary" : "secondary"} 
                    className={isFeatured ? "bg-sky-500 text-white font-heading" : "bg-sky-50 text-sky-700 font-heading"}
                  >
                    {isFeatured ? "PHỔ BIẾN" : idx === 0 ? "TIÊU CHUẨN" : "VIP SPECIAL"}
                  </Badge>
                  <div className={`p-2.5 rounded-lg ${isFeatured ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-600'}`}>
                    {getServiceIcon(service.name)}
                  </div>
                </div>
                <CardTitle className={`mt-4 text-xl ${isFeatured ? 'text-sky-600 font-extrabold' : ''}`}>{service.name}</CardTitle>
                <CardDescription className="min-h-[40px] mt-1.5">
                  {service.description || "Dịch vụ chăm sóc xe chất lượng cao tại trung tâm AutoWash Pro."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <ul className="space-y-3 text-sm text-slate-600">
                  {service.details && service.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2.5">
                      <Check className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className={`border-t p-6 flex justify-between items-center mt-auto ${isFeatured ? 'border-sky-50 bg-sky-50/30' : 'border-slate-50 bg-slate-50/50'}`}>
                <span className={`text-xs font-semibold uppercase font-heading ${isFeatured ? 'text-sky-700' : 'text-slate-400'}`}>GIÁ VÉ GỐC</span>
                <span className="text-2xl font-black text-sky-600 font-heading">{formatVnd(service.price)}</span>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
