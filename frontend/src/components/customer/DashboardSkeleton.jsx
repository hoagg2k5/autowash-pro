import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Skeleton */}
        <div className="h-16 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-800 rounded"></div>
              <div className="w-48 h-3 bg-slate-800/60 rounded"></div>
            </div>
          </div>
          <div className="w-40 h-10 bg-slate-800 rounded-xl"></div>
          <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
        </div>

        {/* Banner / Stat Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-3">
            <div className="w-24 h-4 bg-slate-800 rounded"></div>
            <div className="w-36 h-8 bg-slate-800 rounded"></div>
          </div>
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-3">
            <div className="w-24 h-4 bg-slate-800 rounded"></div>
            <div className="w-36 h-8 bg-slate-800 rounded"></div>
          </div>
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-3">
            <div className="w-24 h-4 bg-slate-800 rounded"></div>
            <div className="w-36 h-8 bg-slate-800 rounded"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="h-96 bg-slate-900/40 rounded-2xl border border-slate-800/50 p-6">
          <div className="w-48 h-6 bg-slate-800 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="w-full h-16 bg-slate-800/50 rounded-xl"></div>
            <div className="w-full h-16 bg-slate-800/50 rounded-xl"></div>
            <div className="w-full h-16 bg-slate-800/50 rounded-xl"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
