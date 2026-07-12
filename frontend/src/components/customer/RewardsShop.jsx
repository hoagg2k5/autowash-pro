import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function RewardsShop({ dbUser, onRedeemSuccess }) {
  const [loading, setLoading] = useState(false);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingMyVouchers, setLoadingMyVouchers] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [usedVouchers, setUsedVouchers] = useState([]);
  const [loadingUsedVouchers, setLoadingUsedVouchers] = useState(false);

  const REWARD_TEMPLATES = [
    { id: 'rw-10k', label: 'Voucher Giảm 10k', points: 10, discountText: 'Giảm 10.000đ', icon: '🎫', detail: 'Áp dụng cho mọi hóa đơn' },
    { id: 'rw-10pct', label: 'Voucher Giảm 10%', points: 20, discountText: 'Giảm 10%', icon: '🎟️', detail: 'Tối thiểu 50.000đ' },
    { id: 'rw-30k', label: 'Voucher Giảm 30k', points: 25, discountText: 'Giảm 30.000đ', icon: '🎁', detail: 'Tối thiểu 100.000đ' },
    { id: 'rw-20pct', label: 'Voucher Giảm 20%', points: 35, discountText: 'Giảm 20%', icon: '🔥', detail: 'Tối thiểu 100.000đ' },
    { id: 'rw-50k', label: 'Voucher Giảm 50k', points: 40, discountText: 'Giảm 50.000đ', icon: '👑', detail: 'Tối thiểu 150.000đ' }
  ];

  const fetchMyVouchers = async () => {
    setLoadingMyVouchers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/my`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyVouchers(data);
      }
    } catch (err) {
      console.error("Error fetching my vouchers:", err);
    } finally {
      setLoadingMyVouchers(false);
    }
  };

  const fetchUsedVouchers = async () => {
    setLoadingUsedVouchers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/my-used`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsedVouchers(data);
      }
    } catch (err) {
      console.error("Error fetching used vouchers:", err);
    } finally {
      setLoadingUsedVouchers(false);
    }
  };

  useEffect(() => {
    fetchMyVouchers();
    fetchUsedVouchers();
  }, []);

  const handleRedeem = async (templateId, pointsRequired, label) => {
    if (dbUser.pointsBalance < pointsRequired) {
      toast.error("Điểm tích lũy không đủ!");
      return;
    }

    const confirm = window.confirm(`Bạn có chắc chắn muốn dùng ${pointsRequired} điểm tích lũy để đổi ${label}?`);
    if (!confirm) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ templateId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đổi quà thất bại.");
      }

      toast.success(`Đổi quà thành công! Đã nhận mã ${data.voucher.code}`);
      fetchMyVouchers();
      fetchUsedVouchers();
      if (onRedeemSuccess) {
        onRedeemSuccess();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Owned Vouchers list */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>🎟️ KHO VOUCHER CỦA BẠN</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Danh sách các Voucher bạn đang sở hữu và chưa sử dụng. Các voucher này sẽ hiển thị ở màn hình đặt lịch.
          </p>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'available' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'available' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'available' ? 'bold' : 'normal',
              padding: '0.75rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            Chưa sử dụng ({myVouchers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('used')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'used' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'used' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'used' ? 'bold' : 'normal',
              padding: '0.75rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            Đã sử dụng ({usedVouchers.length})
          </button>
        </div>

        {activeTab === 'available' ? (
          loadingMyVouchers ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang tải kho quà tặng...</p>
          ) : myVouchers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2.5rem', 
              color: 'var(--text-muted)', 
              fontSize: '0.85rem',
              border: '2.5px dashed var(--border-color)',
              borderRadius: '12px'
            }}>
              🌈 Kho voucher trống. Hãy rửa xe tích điểm hoặc đổi quà từ điểm số dư của bạn nhé!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {myVouchers.map(uv => {
                let valText = "";
                if (uv.discountVnd) valText = `-${formatVnd(uv.discountVnd)}`;
                else if (uv.discountPercent) valText = `-${uv.discountPercent}%`;

                return (
                  <div 
                    key={uv.id}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 70%, rgba(2, 132, 199, 0.05))',
                      border: '1.5px dashed var(--border-color)',
                      borderLeft: '5px solid var(--primary)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{uv.voucherCode}</code>
                        <span className="badge-info" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>{valText}</span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Hạn dùng: {uv.expiryDate} {uv.minSpent > 0 && `| HĐ tối thiểu: ${formatVnd(uv.minSpent)}`}
                      </div>
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>🎁</span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          loadingUsedVouchers ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang tải lịch sử voucher...</p>
          ) : usedVouchers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2.5rem', 
              color: 'var(--text-muted)', 
              fontSize: '0.85rem',
              border: '2.5px dashed var(--border-color)',
              borderRadius: '12px'
            }}>
              Chưa có voucher nào đã được sử dụng.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {usedVouchers.map(uv => {
                let valText = "";
                if (uv.discountVnd) valText = `-${formatVnd(uv.discountVnd)}`;
                else if (uv.discountPercent) valText = `-${uv.discountPercent}%`;

                return (
                  <div 
                    key={uv.id}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 70%, rgba(100, 116, 139, 0.05))',
                      border: '1.5px dashed var(--border-color)',
                      borderLeft: '5px solid #64748b',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      opacity: 0.75
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <code style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'bold', textDecoration: 'line-through' }}>{uv.voucherCode}</code>
                        <span className="badge-info" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: '#cbd5e1', color: '#475569' }}>{valText}</span>
                        <span style={{ fontSize: '0.7rem', color: '#e11d48', fontWeight: 'bold', background: '#ffe4e6', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Đã dùng</span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Dùng lúc: {uv.usedAt ? new Date(uv.usedAt).toLocaleDateString('vi-VN') : 'N/A'} {uv.minSpent > 0 && `| HĐ tối thiểu: ${formatVnd(uv.minSpent)}`}
                      </div>
                    </div>
                    <span style={{ fontSize: '1.5rem', filter: 'grayscale(1)' }}>🎟️</span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Rewards shop panel */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>🎁 CỬA HÀNG ĐỔI THƯỞNG</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Sử dụng điểm tích lũy tích lũy được từ những lần rửa xe trước để đổi lấy Voucher ưu đãi đặc quyền.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {REWARD_TEMPLATES.map(item => {
            const canRedeem = dbUser.pointsBalance >= item.points;
            return (
              <div 
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  gap: '0.75rem'
                }}
              >
                <div style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{item.icon}</div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.label}</h4>
                  <span className="badge-info" style={{ display: 'inline-block', margin: '0.35rem 0', fontWeight: 'bold' }}>{item.discountText}</span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>{item.detail}</p>
                </div>

                <button
                  type="button"
                  className={`btn ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={loading || !canRedeem}
                  onClick={() => handleRedeem(item.id, item.points, item.label)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {item.points} điểm
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
