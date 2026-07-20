import React, { useState } from 'react';
import { toast } from '../shared/toast.js';

export default function AdminCustomers({ customers, onPointsAdjusted, API_BASE_URL }) {
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerTierFilter, setCustomerTierFilter] = useState('Tất cả');

  // Point adjustment modal local states
  const [selectedCustomerForPoints, setSelectedCustomerForPoints] = useState(null);
  const [pointsChange, setPointsChange] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Admin điều chỉnh điểm thủ công');
  const [adjustingPoints, setAdjustingPoints] = useState(false);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleOpenAdjustPointsModal = (customer) => {
    setSelectedCustomerForPoints(customer);
    setPointsChange(customer.pointsBalance);
    setAdjustReason('Admin điều chỉnh điểm thủ công');
  };

  const handleAdjustPointsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerForPoints) return;
    
    setAdjustingPoints(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers/${selectedCustomerForPoints.id}/adjust-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPoints: Number(pointsChange),
          reason: adjustReason
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Điều chỉnh điểm thất bại.');
      
      toast.success(data.message);
      setSelectedCustomerForPoints(null);
      if (onPointsAdjusted) onPointsAdjusted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdjustingPoints(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản khách hàng "${customer.fullName}" (${customer.phone}) không? Hành động này sẽ xóa toàn bộ thông tin xe và lịch đặt rửa xe liên quan!`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers/${customer.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Xóa tài khoản thất bại.');
      
      toast.success(data.message);
      if (onPointsAdjusted) onPointsAdjusted();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>DANH SÁCH KHÁCH HÀNG THÂN THIẾT</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '220px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            placeholder="Tìm tên, số điện thoại..."
            value={customerSearchText}
            onChange={(e) => setCustomerSearchText(e.target.value)}
          />
          <select
            className="form-input"
            style={{ width: '160px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={customerTierFilter}
            onChange={(e) => setCustomerTierFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả thứ hạng</option>
            <option value="Member">Member</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>
      </div>
      {customers.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có khách hàng đăng ký.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên khách hàng</th>
                <th>Hạng</th>
                <th>Số điện thoại</th>
                <th>Xe đã liên kết</th>
                <th>Tổng chi tiêu</th>
                <th>Điểm tích lũy</th>
                <th>Số lần đặt lịch (Thành công)</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers
                .filter(c => customerTierFilter === 'Tất cả' || c.loyaltyTier === customerTierFilter)
                .filter(c => {
                  if (!customerSearchText) return true;
                  const searchLower = customerSearchText.toLowerCase();
                  return (
                    (c.fullName && c.fullName.toLowerCase().includes(searchLower)) ||
                    (c.phone && c.phone.includes(searchLower))
                  );
                })
                .map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.fullName}</strong></td>
                    <td><span className={`tier-indicator tier-${c.loyaltyTier}`}>{c.loyaltyTier}</span></td>
                    <td>{c.phone}</td>
                    <td className="text-xs">
                      {c.vehicles && c.vehicles.map(v => (
                        <div key={v.id}>• <code>{v.licensePlate}</code> - {v.brand} {v.model}</div>
                      ))}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatVnd(c.totalSpent)}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{c.pointsBalance} đ</td>
                    <td>{c.bookingCount} ({c.completedCount} đã xong)</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenAdjustPointsModal(c)}
                        >
                          Sửa Điểm
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteCustomer(c)}
                        >
                          Xóa TK
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal điều chỉnh điểm */}
      {selectedCustomerForPoints && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            padding: '2rem',
            width: '450px',
            maxWidth: '95%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            position: 'relative'
          }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>
              🎯 Điều Chỉnh Điểm Thưởng
            </h3>
            <p className="text-sm" style={{ marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Khách hàng: <strong style={{ color: 'var(--text-main)' }}>{selectedCustomerForPoints.fullName}</strong> ({selectedCustomerForPoints.phone})<br/>
              Số dư hiện tại: <strong style={{ color: 'var(--primary)' }}>{selectedCustomerForPoints.pointsBalance}</strong> điểm
            </p>
            
            <form onSubmit={handleAdjustPointsSubmit}>
              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Số Điểm Mới *</label>
                <input 
                  type="number"
                  className="form-input"
                  value={pointsChange}
                  onChange={(e) => setPointsChange(parseInt(e.target.value) || 0)}
                  placeholder="Ví dụ: 1000"
                  required
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Nhập số điểm chính xác bạn muốn thiết lập cho khách hàng.</span>
              </div>
              
              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Lý Do Thay Đổi *</label>
                <input 
                  type="text"
                  className="form-input"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Lý do điều chỉnh..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedCustomerForPoints(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={adjustingPoints}>
                  {adjustingPoints ? 'Đang cập nhật...' : 'Cập Nhật Điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
