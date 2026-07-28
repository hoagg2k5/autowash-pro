import React, { useState } from 'react';

const STATUSES = [
  {
    key: 'Pending',
    label: 'pending',
    labelVi: 'Chờ xác nhận',
    icon: '🕐',
    iconSymbol: '○',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
    description: 'Booking vừa được tạo — chờ admin/staff xác nhận',
    trigger: [
      '→ Hệ thống tự động khi customer POST /api/bookings',
    ],
    nextStates: [
      '→ confirmed (staff xác nhận)',
      '→ cancelled (khách hủy hoặc hết slot)',
    ],
    timeConditions: [
      '→ Tự động chuyển confirmed sau 30 phút nếu staff không làm gì',
    ],
    dbApi: [
      '• status: "pending"',
    ],
  },
  {
    key: 'Confirmed',
    label: 'confirmed',
    labelVi: 'Đã xác nhận',
    icon: '✅',
    iconSymbol: '✓',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.08)',
    border: 'rgba(2, 132, 199, 0.3)',
    description: 'Lịch đã được xác nhận — khách chuẩn bị đến',
    trigger: [
      '→ Staff bấm confirm, hoặc cron job auto-confirm sau 30 phút',
    ],
    nextStates: [
      '→ waiting (check-in xe khi khách đến)',
      '→ cancelled (hủy trước giờ)',
    ],
    timeConditions: [
      '→ Khách có thể hủy tối đa 30 phút trước giờ hẹn',
    ],
    dbApi: [
      '+ POST /api/bookings/:id/confirm → "Confirmed"',
    ],
  },
  {
    key: 'Waiting',
    label: 'waiting',
    labelVi: 'Chờ rửa',
    icon: '⏳',
    iconSymbol: '🕒',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.3)',
    description: 'Xe đã check-in thành công — xếp trong hàng đợi chờ rửa',
    trigger: [
      '→ Staff bấm Check-in, hoặc LPR quét biển số Confirmed tại cổng',
    ],
    nextStates: [
      '→ in_progress (staff bấm "Bắt đầu rửa")',
      '→ cancelled (hủy lịch)',
    ],
    timeConditions: [
      '→ Đứng trong hàng đợi phân phối theo thời gian check-in',
    ],
    dbApi: [
      '+ POST /api/bookings/:id/checkin → "Waiting"',
    ],
  },
  {
    key: 'In Progress',
    label: 'in_progress',
    labelVi: 'Đang rửa',
    icon: '🚿',
    iconSymbol: '▶',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.3)',
    description: 'Xe đang được rửa — nhân viên đã check-in khách',
    trigger: [
      '→ Staff bấm "Bắt đầu rửa" trên staff dashboard',
    ],
    nextStates: [
      '→ completed (rửa xong, nhân viên xác nhận)',
    ],
    timeConditions: [
      '→ Tracking thời gian theo durationMinutes của dịch vụ',
    ],
    dbApi: [
      '+ PATCH /api/bookings/:id/start → "in_progress"',
    ],
  },
  {
    key: 'Completed',
    label: 'completed',
    labelVi: 'Hoàn thành',
    icon: '✨',
    iconSymbol: '⊞',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
    description: 'Rửa xe hoàn thành — điểm được cộng tự động',
    trigger: [
      '→ Staff bấm "Hoàn thành" sau khi khách thanh toán tiền mặt',
    ],
    nextStates: [
      '→ (Trạng thái cuối — không thể đổi)',
    ],
    timeConditions: [
      '→ Ngay khi completed: earnPoints() + updateUserStats() chạy trong DB transaction',
    ],
    dbApi: [
      '+ Trigger: earnPoints, updateUserStats, check tier review',
    ],
  },
  {
    key: 'Cancelled',
    label: 'cancelled',
    labelVi: 'Đã hủy',
    icon: '✕',
    iconSymbol: '✕',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
    description: 'Lịch bị hủy — hoàn điểm tùy theo thời gian hủy',
    trigger: [
      '→ Khách tự hủy (pending/confirmed) HOẶC Admin hủy',
    ],
    nextStates: [
      '→ (Trạng thái cuối)',
    ],
    timeConditions: [
      '→ Hủy trước 2h: hoàn 100% điểm | Hủy trước 30 phút: hoàn 50% | Sau đó: không hoàn',
    ],
    dbApi: [
      '+ cancelReason lưu lý do | refund points nếu đã dùng',
    ],
  },
];

export default function StatusLifecycleViewer() {
  const [activeStatus, setActiveStatus] = useState('Pending');
  const current = STATUSES.find(s => s.key === activeStatus);

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'var(--primary)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1rem'
          }}>🔄</div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Vòng đời trạng thái Booking</h3>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Mỗi booking đi qua các trạng thái này — nhấn để xem chi tiết
        </p>
      </div>

      {/* Status Tabs Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '0',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        {STATUSES.map((s, idx) => {
          const isActive = activeStatus === s.key;
          const isPast = STATUSES.findIndex(x => x.key === activeStatus) > idx;
          return (
            <button
              key={s.key}
              onClick={() => setActiveStatus(s.key)}
              style={{
                padding: '1rem 0.75rem',
                border: 'none',
                borderRight: idx < 5 ? '1px solid var(--border-color)' : 'none',
                background: isActive
                  ? 'var(--primary)'
                  : isPast
                  ? '#f0f9ff'
                  : '#ffffff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: isActive ? 'rgba(255,255,255,0.2)' : isPast ? s.color : '#f1f5f9',
                border: `2px solid ${isActive ? 'rgba(255,255,255,0.4)' : isPast ? s.color : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.5rem',
                fontSize: '1rem',
                color: isActive ? '#fff' : isPast ? '#fff' : s.color,
                fontWeight: 700,
              }}>
                {isPast && !isActive ? '✓' : s.icon}
              </div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                letterSpacing: '0.02em',
                fontFamily: 'monospace',
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                marginTop: '2px',
              }}>
                {s.labelVi}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      {current && (
        <div style={{
          background: current.bg,
          border: `1px solid ${current.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
        }}>
          {/* Status Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '12px',
              background: current.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}>
              {current.icon}
            </div>
            <div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: current.color,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                STATUS: {current.key.replace(' ', '_').toUpperCase()}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {current.description}
              </div>
            </div>
          </div>

          {/* 4-grid info cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}>
            {/* Ai kích hoạt */}
            <InfoCard
              icon="▣"
              iconColor="#3b82f6"
              title="AI KÍCH HOẠT"
              items={current.trigger}
              itemColor="var(--text-main)"
            />

            {/* Thời gian & điều kiện */}
            <InfoCard
              icon="⏱"
              iconColor="#f59e0b"
              title="THỜI GIAN & ĐIỀU KIỆN"
              items={current.timeConditions}
              itemColor={current.key === 'Pending' ? '#ef4444' : 'var(--text-main)'}
            />

            {/* Trạng thái tiếp theo */}
            <InfoCard
              icon="↪"
              iconColor="#8b5cf6"
              title="TRẠNG THÁI TIẾP THEO"
              items={current.nextStates}
              itemColor="var(--text-main)"
            />

            {/* Database / API */}
            <InfoCard
              icon="▤"
              iconColor="#10b981"
              title="DATABASE / API"
              items={current.dbApi}
              itemColor={current.color}
              isCode
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, iconColor, title, items, itemColor, isCode = false }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      borderRadius: '10px',
      padding: '1rem 1.1rem',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <span style={{ color: iconColor, fontSize: '0.85rem', fontWeight: 700 }}>{icon}</span>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            fontSize: '0.82rem',
            color: itemColor,
            fontFamily: isCode ? 'monospace' : 'inherit',
            fontWeight: isCode ? 600 : 400,
            lineHeight: 1.5,
          }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
