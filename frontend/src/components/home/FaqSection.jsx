import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

const FAQ_DATA = [
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

export default function FaqSection() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
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
        {FAQ_DATA.map((item, index) => {
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
  );
}
