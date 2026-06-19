import React from 'react';
import { Sparkles, Car } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export default function HeroSection({ onStartBooking }) {
  return (
    <section className="relative overflow-hidden py-24 px-6 lg:py-36 bg-white border-b border-slate-100">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/20 to-slate-50 -z-10" />
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
      
      <div className="max-w-4xl mx-auto text-center z-10 relative">
        <div className="inline-flex items-center gap-2 bg-sky-50/80 border border-sky-100/80 px-4 py-1.5 rounded-full mb-8 shadow-sm backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-sky-500 animate-spin-slow" />
          <span className="text-xs font-bold text-sky-700 tracking-wider uppercase tracking-widest font-heading">
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

      <div className="absolute top-1/4 left-1/12 text-3xl opacity-10 select-none animate-bounce-slow">💧</div>
      <div className="absolute bottom-1/4 right-1/12 text-4xl opacity-15 select-none animate-pulse">🫧</div>
      <div className="absolute top-1/2 right-1/15 text-2xl opacity-15 select-none">✨</div>
    </section>
  );
}
