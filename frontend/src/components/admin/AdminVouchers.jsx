import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [editingId, setEditingId] = useState(null); // null means adding new
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('vnd'); // 'vnd' or 'percent'
  const [discountValue, setDiscountValue] = useState('');
  const [minSpent, setMinSpent] = useState('0');
  const [targetTiers, setTargetTiers] = useState(['Member', 'Silver', 'Gold', 'Platinum']);
  const [isActive, setIsActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');
  const [pointsRequired, setPointsRequired] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/api/admin/vouchers`);
      if (!res.ok) throw new Error('Không thể tải danh sách mã giảm giá');
      const data = await res.json();
      setVouchers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const convertToDbDate = (vnDateStr) => {
    if (!vnDateStr) return '';
    const parts = vnDateStr.trim().split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return vnDateStr;
  };

  const convertToVnDate = (dbDateStr) => {
    if (!dbDateStr) return '';
    const parts = dbDateStr.trim().split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    return dbDateStr;
  };

  const handleEdit = (v) => {
    setEditingId(v._id);
    setCode(v.code);
    if (v.discountVnd > 0) {
      setDiscountType('vnd');
      setDiscountValue(v.discountVnd);
    } else {
      setDiscountType('percent');
      setDiscountValue(v.discountPercent);
    }
    setMinSpent(v.minSpent || 0);
    setTargetTiers(v.targetTiers || ['Member', 'Silver', 'Gold', 'Platinum']);
    setIsActive(v.isActive);
    setExpiryDate(convertToVnDate(v.expiryDate || ''));
    setPointsRequired(v.pointsRequired || 0);

    // Scroll to form
    const formElement = document.getElementById('voucher-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setCode('');
    setDiscountValue('');
    setMinSpent('0');
    setTargetTiers(['Member', 'Silver', 'Gold', 'Platinum']);
    setIsActive(true);
    setExpiryDate('');
    setPointsRequired('0');
  };

  const handleTierToggle = (tier) => {
    if (targetTiers.includes(tier)) {
      setTargetTiers(targetTiers.filter(t => t !== tier));
    } else {
      setTargetTiers([...targetTiers, tier]);
    }
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value;
    
    // Check if the user is deleting (backspace/delete)
    const isDeleting = value.length < expiryDate.length;
    
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '');
    
    let formatted = '';
    if (cleanValue.length > 0) {
      formatted += cleanValue.substring(0, 2);
      if (cleanValue.length > 2) {
        formatted += '-' + cleanValue.substring(2, 4);
        if (cleanValue.length > 4) {
          formatted += '-' + cleanValue.substring(4, 8);
        }
      } else if (cleanValue.length === 2 && !isDeleting) {
        // Only append dash if we are typing forward (not deleting)
        formatted += '-';
      }
      
      if (cleanValue.length === 4 && !isDeleting) {
        // Only append dash if we are typing forward (not deleting)
        formatted += '-';
      }
    }
    
    setExpiryDate(formatted.slice(0, 10));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountValue || !expiryDate) {
      toast.warning('Vui lòng nhập đầy đủ Mã, Giá trị giảm và Ngày hết hạn.');
      return;
    }

    if (targetTiers.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một hạng hội viên áp dụng.');
      return;
    }

    setSubmitting(true);
    const payload = {
      code: code.toUpperCase().trim(),
      discountVnd: discountType === 'vnd' ? Number(discountValue) : 0,
      discountPercent: discountType === 'percent' ? Number(discountValue) : 0,
      minSpent: Number(minSpent) || 0,
      targetTiers,
      isActive,
      expiryDate: convertToDbDate(expiryDate),
      pointsRequired: Number(pointsRequired) || 0
    };

    try {
      let url = `${API_BASE_URL}/api/admin/vouchers`;
      let method = 'POST';

      if (editingId) {
        url = `${API_BASE_URL}/api/admin/vouchers/${editingId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại.');

      toast.success(editingId ? 'Cập nhật voucher thành công!' : 'Thêm voucher mới thành công!');
      handleCancel();
      fetchVouchers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/vouchers/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa voucher.');
      toast.success('Đã xóa voucher.');
      fetchVouchers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && vouchers.length === 0) return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải danh sách voucher...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
      {/* List Panel */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>DANH SÁCH MÃ GIẢM GIÁ (VOUCHERS)</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        
        {vouchers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Không có mã giảm giá nào trong hệ thống.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Giá Trị Giảm</th>
                  <th>Điểm Đổi</th>
                  <th>Hóa Đơn Tối Thiểu</th>
                  <th>Hạng Áp Dụng</th>
                  <th>Ngày Hết Hạn</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v._id}>
                    <td><code style={{ fontSize: '1.05rem', color: 'var(--primary)', fontWeight: 'bold' }}>{v.code}</code></td>
                    <td style={{ fontWeight: 700 }}>
                      {v.discountVnd > 0 ? (
                        <span style={{ color: '#10b981' }}>{formatVnd(v.discountVnd)}</span>
                      ) : (
                        <span style={{ color: '#3b82f6' }}>-{v.discountPercent}%</span>
                      )}
                    </td>
                    <td>
                      {v.pointsRequired > 0 ? (
                        <strong style={{ color: 'var(--primary)' }}>{v.pointsRequired} điểm</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Miễn phí</span>
                      )}
                    </td>
                    <td>{formatVnd(v.minSpent)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', maxWidth: '140px' }}>
                        {v.targetTiers.map(t => (
                          <span key={t} className={`tier-indicator tier-${t}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{convertToVnDate(v.expiryDate)}</td>
                    <td>
                      <span className={`status-badge status-${v.isActive ? 'Completed' : 'Cancelled'}`}>
                        {v.isActive ? 'Đang chạy' : 'Tắt'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(v)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(v._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Form Panel */}
      <div id="voucher-form" className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>
          {editingId ? 'CẬP NHẬT MÃ GIẢM GIÁ' : 'THÊM MÃ GIẢM GIÁ MỚI'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="v-code">Mã Giảm Giá * (Viết hoa liền không dấu)</label>
            <input 
              id="v-code"
              type="text" 
              className="form-input" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              placeholder="Ví dụ: AUTOWASH50, VIPMEMBER..." 
              required
            />
          </div>

          <div className="form-group">
            <label>Loại Giảm Giá *</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="discountType" 
                  value="vnd" 
                  checked={discountType === 'vnd'} 
                  onChange={() => setDiscountType('vnd')}
                />
                Giảm theo tiền mặt (VND)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="discountType" 
                  value="percent" 
                  checked={discountType === 'percent'} 
                  onChange={() => setDiscountType('percent')}
                />
                Giảm theo phần trăm (%)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="v-value">
              {discountType === 'vnd' ? 'Số tiền giảm (VND) *' : 'Phần trăm giảm (1% - 100%) *'}
            </label>
            <input 
              id="v-value"
              type="number" 
              className="form-input" 
              value={discountValue} 
              onChange={(e) => setDiscountValue(e.target.value)} 
              placeholder={discountType === 'vnd' ? 'Ví dụ: 50000' : 'Ví dụ: 15'} 
              min="1"
              max={discountType === 'percent' ? "100" : undefined}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="v-minspent">Hóa đơn tối thiểu để áp dụng (VND)</label>
            <input 
              id="v-minspent"
              type="number" 
              className="form-input" 
              value={minSpent} 
              onChange={(e) => setMinSpent(e.target.value)} 
              placeholder="Ví dụ: 100000 (0 nếu không yêu cầu)" 
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="v-points-required">Số điểm cần để đổi</label>
            <input 
              id="v-points-required"
              type="number" 
              className="form-input" 
              value={pointsRequired} 
              onChange={(e) => setPointsRequired(e.target.value)} 
              placeholder="Ví dụ: 100 (0 nếu phát miễn phí theo hạng)" 
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="v-expiry">Ngày Hết Hạn * (dd-MM-yyyy)</label>
            <input 
              id="v-expiry"
              type="text" 
              className="form-input" 
              value={expiryDate} 
              onChange={handleExpiryChange} 
              placeholder="dd-MM-yyyy"
              maxLength={10}
              pattern="\d{2}-\d{2}-\d{4}"
              title="Định dạng ngày phải là DD-MM-YYYY (Ví dụ: 31-12-2026)"
              required
            />
          </div>

          <div className="form-group">
            <label>Hạng Hội Viên Được Sử Dụng *</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {['Member', 'Silver', 'Gold', 'Platinum'].map(tier => {
                const selected = targetTiers.includes(tier);
                return (
                  <button
                    key={tier}
                    type="button"
                    className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleTierToggle(tier)}
                  >
                    {tier} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <strong>Kích hoạt hoạt động của mã này ngay</strong>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
