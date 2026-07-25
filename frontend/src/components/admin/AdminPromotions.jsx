import React, { useState, useEffect } from 'react';
import { toast } from '../shared/toast.js';

export default function AdminPromotions({ promotions, onCreatePromo, onTogglePromo, onEditPromo, onDeletePromo, rules }) {
  const [editingId, setEditingId] = useState(null); // null means adding new
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoTiers, setPromoTiers] = useState(['Silver']);
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách các hạng từ rules cấu hình trong DB để tránh hardcode
  const availableTiers = rules?.tierSettings 
    ? Object.keys(rules.tierSettings) 
    : ['Member', 'Silver', 'Gold', 'Platinum'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!promoTitle || !promoDiscount || promoTiers.length === 0 || !promoStartDate || !promoEndDate) {
      toast.warning("Vui lòng điền đầy đủ các trường bắt buộc bao gồm Ngày bắt đầu và Ngày kết thúc.");
      return;
    }

    if (promoEndDate < promoStartDate) {
      toast.warning("Ngày kết thúc không được nhỏ hơn ngày bắt đầu.");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: promoTitle,
      description: promoDesc,
      discountPercentage: Number(promoDiscount),
      targetTiers: promoTiers,
      startDate: promoStartDate,
      endDate: promoEndDate
    };

    try {
      if (editingId) {
        const successMsg = await onEditPromo(editingId, payload);
        if (successMsg) {
          toast.success("Cập nhật chiến dịch khuyến mãi thành công!");
          handleCancel();
        }
      } else {
        const successMsg = await onCreatePromo(payload);
        if (successMsg) {
          toast.success("Tạo chiến dịch khuyến mãi mới thành công!");
          handleCancel();
        }
      }
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingId(promo.id);
    setPromoTitle(promo.title);
    setPromoDesc(promo.description || '');
    setPromoDiscount(promo.discountPercentage);
    setPromoTiers(promo.targetTiers || ['Silver']);
    setPromoStartDate(promo.startDate || '');
    setPromoEndDate(promo.endDate || '');
    
    // Scroll to form
    const formElement = document.getElementById('promo-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setPromoTitle('');
    setPromoDesc('');
    setPromoDiscount(10);
    setPromoTiers(['Silver']);
    setPromoStartDate('');
    setPromoEndDate('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chiến dịch khuyến mãi này? Hành động này không thể hoàn tác.")) return;
    try {
      await onDeletePromo(id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTierToggleInForm = (tier) => {
    if (promoTiers.includes(tier)) {
      if (promoTiers.length > 1) {
        setPromoTiers(promoTiers.filter(t => t !== tier));
      }
    } else {
      setPromoTiers([...promoTiers, tier]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
      {/* Active Campaigns */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>CHIẾN DỊCH KHUYẾN MÃI ĐANG CHẠY</h3>
        
        {promotions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Chưa có chiến dịch nào được tạo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {promotions.map(promo => (
              <div 
                key={promo.id} 
                style={{ 
                  padding: '1.25rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div className="flex-between">
                  <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>{promo.title}</h4>
                  <span className={`status-badge status-${promo.isActive ? 'Completed' : 'Cancelled'}`}>
                    {promo.isActive ? 'Đang chạy' : 'Đã dừng'}
                  </span>
                </div>
                <p className="text-xs" style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.4' }}>{promo.description}</p>
                
                <div style={{ margin: '0.25rem 0' }}>
                  <span className="text-xs" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Tập khách hàng áp dụng:</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {promo.targetTiers.map(t => (
                      <span key={t} className={`tier-indicator tier-${t}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                  <span>Hiệu lực từ: <strong>{formatDate(promo.startDate)}</strong></span>
                  <span>Đến ngày: <strong>{formatDate(promo.endDate)}</strong></span>
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)' }}>-{promo.discountPercentage}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className={`btn btn-sm ${promo.isActive ? 'btn-danger' : 'btn-primary'}`} 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                      onClick={() => onTogglePromo(promo.id)}
                    >
                      {promo.isActive ? 'Tạm Dừng' : 'Kích Hoạt'}
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                      onClick={() => handleEdit(promo)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', color: '#fff' }} 
                      onClick={() => handleDelete(promo.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Promotion Designer */}
      <div id="promo-form" className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>
          {editingId ? '📝 CẬP NHẬT KHUYẾN MÃI TIER' : '✨ THÊM KHUYẾN MÃI TIER MỚI'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tiêu Đề Chiến Dịch *</label>
            <input
              type="text"
              className="form-input"
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              placeholder="Ví dụ: Tri ân khách hàng Platinum"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả chiến dịch</label>
            <textarea
              className="form-input"
              style={{ height: '70px', resize: 'none' }}
              value={promoDesc}
              onChange={(e) => setPromoDesc(e.target.value)}
              placeholder="Ví dụ: Giảm 20% cho gói rửa sâu..."
            />
          </div>

          <div className="form-group">
            <label>Phần trăm giảm giá (%) *</label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="100"
              value={promoDiscount}
              onChange={(e) => setPromoDiscount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-group">
            <div>
              <label>Ngày Bắt Đầu *</label>
              <input
                type="date"
                className="form-input"
                value={promoStartDate}
                onChange={(e) => setPromoStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Ngày Kết Thúc *</label>
              <input
                type="date"
                className="form-input"
                value={promoEndDate}
                onChange={(e) => setPromoEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Hạng Hội Viên Áp Dụng * (Chọn một hoặc nhiều)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {availableTiers.map(tier => {
                const selected = promoTiers.includes(tier);
                return (
                  <button
                    key={tier}
                    type="button"
                    className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => handleTierToggleInForm(tier)}
                  >
                    {tier} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : editingId ? 'Lưu Thay Đổi' : 'Phát Hành Chiến Dịch'}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancel}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
