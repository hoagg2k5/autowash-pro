import React from 'react';
import { Award, Star, Clock, Shield } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

export default function StatsSection() {
  return (
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
  );
}
