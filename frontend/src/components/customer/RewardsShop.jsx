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
  // Danh sách voucher admin tạo có pointsRequired > 0 (để đổi bằng điểm)
  const [redeemableVouchers, setRedeemableVouchers] = useState([]);
  const [loadingRedeemable, setLoadingRedeemable] = useState(false);

  const fetchMyVouchers = async () => {
    setLoadingMyVouchers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/my`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}` }
      });
      if (response.ok) setMyVouchers(await response.json());
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
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}` }
      });
      if (response.ok) setUsedVouchers(await response.json());
    } catch (err) {
      console.error("Error fetching used vouchers:", err);
    } finally {
      setLoadingUsedVouchers(false);
    }
  };

  const fetchRedeemableVouchers = async () => {
    setLoadingRedeemable(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/redeemable`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}` }
      });
      if (response.ok) setRedeemableVouchers(await response.json());
    } catch (err) {
      console.error("Error fetching redeemable vouchers:", err);
    } finally {
      setLoadingRedeemable(false);
    }
  };

  useEffect(() => {
    fetchMyVouchers();
    fetchUsedVouchers();
    fetchRedeemableVouchers();
  }, []);

  const handleRedeem = async (voucherId, pointsRequired, label) => {
    if ((dbUser.pointsBalance || 0) < pointsRequired) {
      toast.error(`Không đủ điểm! Bạn có ${dbUser.pointsBalance || 0} điểm, cần ${pointsRequired} điểm.`);
      return;
    }
    const confirm = window.confirm(`Bạn có chắc muốn dùng ${pointsRequired} điểm để đổi: ${label}?`);
    if (!confirm) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ voucherId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đổi quà thất bại.");
      toast.success(`Đổi quà thành công! Đã nhận mã ${data.voucher.code}`);
      fetchMyVouchers();
      fetchUsedVouchers();
      if (onRedeemSuccess) onRedeemSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Tự động tạo icon và text hiển thị từ dữ liệu voucher
  const getVoucherDisplay = (v) => {
    const discountText = v.discountVnd > 0
      ? `Giảm ${formatVnd(v.discountVnd)}`
      : `Giảm ${v.discountPercent}%`;
    const detail = v.minSpent > 0
      ? `Tối thiểu ${formatVnd(v.minSpent)}`
      : 'Áp dụng mọi hóa đơn';
    const icon = v.discountPercent > 0
      ? (v.discountPercent >= 20 ? '🔥' : '🎟️')
      : (v.discountVnd >= 50000 ? '👑' : v.discountVnd >= 30000 ? '🎁' : '🎫');
    return { discountText, detail, icon };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Kho Voucher của bạn */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>KHO VOUCHER CỦA BẠN</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Danh sách các Voucher bạn đang sở hữu và chưa sử dụng. Các voucher này sẽ hiển thị ở màn hình đặt lịch.
          </p>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: activeTab === 'available' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'available' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'available' ? 'bold' : 'normal',
              padding: '0.75rem 0.5rem', cursor: 'pointer', fontSize: '0.9rem',
              transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            Chưa sử dụng ({myVouchers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('used')}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: activeTab === 'used' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'used' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'used' ? 'bold' : 'normal',
              padding: '0.75rem 0.5rem', cursor: 'pointer', fontSize: '0.9rem',
              transition: 'all 0.2s ease', outline: 'none'
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
              Kho voucher trống. Hãy rửa xe tích điểm hoặc đổi quà từ điểm số dư của bạn nhé!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {myVouchers.map(uv => {
                let valText = "";
                if (uv.discountVnd) valText = `-${formatVnd(uv.discountVnd)}`;
                else if (uv.discountPercent) valText = `-${uv.discountPercent}%`;
                return (
                  <div key={uv.id} style={{
                    background: 'linear-gradient(135deg, #ffffff 70%, rgba(2, 132, 199, 0.05))',
                    border: '1.5px dashed var(--border-color)', borderLeft: '5px solid var(--primary)',
                    borderRadius: '12px', padding: '1rem', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                  }}>
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
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '2.5px dashed var(--border-color)', borderRadius: '12px' }}>
              Chưa có voucher nào đã được sử dụng.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {usedVouchers.map(uv => {
                let valText = "";
                if (uv.discountVnd) valText = `-${formatVnd(uv.discountVnd)}`;
                else if (uv.discountPercent) valText = `-${uv.discountPercent}%`;
                return (
                  <div key={uv.id} style={{
                    background: 'linear-gradient(135deg, #f8fafc 70%, rgba(100, 116, 139, 0.05))',
                    border: '1.5px dashed var(--border-color)', borderLeft: '5px solid #64748b',
                    borderRadius: '12px', padding: '1rem', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)', opacity: 0.75
                  }}>
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

      {/* Cửa hàng đổi thưởng - hiển thị voucher thật từ admin */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>CỬA HÀNG ĐỔI THƯỞNG</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Sử dụng điểm tích lũy được từ những lần rửa xe trước để đổi lấy Voucher ưu đãi đặc quyền.
          </p>
          <p className="text-xs" style={{ color: 'var(--primary)', marginTop: '0.2rem', fontWeight: 600 }}>
            Điểm hiện có: <strong>{dbUser?.pointsBalance || 0} điểm</strong>
          </p>
        </div>

        {loadingRedeemable ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải danh sách phần thưởng...</div>
        ) : redeemableVouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '2.5px dashed var(--border-color)', borderRadius: '12px' }}>
            Hiện chưa có phần thưởng nào. Admin sẽ sớm cập nhật thêm!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {redeemableVouchers.map(v => {
              const { discountText, detail, icon } = getVoucherDisplay(v);
              const canRedeem = (dbUser?.pointsBalance || 0) >= v.pointsRequired;
              return (
                <div
                  key={v._id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1.5px solid ${canRedeem ? 'var(--border-color)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: '16px', padding: '1.25rem',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', alignItems: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    gap: '0.75rem',
                    opacity: canRedeem ? 1 : 0.7
                  }}
                >
                  <div style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{icon}</div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {v.code ? `Voucher ${discountText}` : discountText}
                    </h4>
                    <span className="badge-info" style={{ display: 'inline-block', margin: '0.35rem 0', fontWeight: 'bold' }}>
                      {discountText}
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>{detail}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      HSD: {v.expiryDate}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`btn ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={loading || !canRedeem}
                    onClick={() => handleRedeem(v._id, v.pointsRequired, discountText)}
                    style={{
                      width: '100%', padding: '0.5rem', fontSize: '0.8rem',
                      fontWeight: 700, marginTop: '0.5rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                    }}
                  >
                    {v.pointsRequired} điểm
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
