import React, { useState } from 'react';
import { toast } from '../shared/toast.js';

export default function AdminPromotions({ promotions, onCreatePromo, onTogglePromo }) {
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoTiers, setPromoTiers] = useState(['Silver']);
  const [promoSuccess, setPromoSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPromoSuccess('');
    
    if (!promoTitle || !promoDiscount || promoTiers.length === 0) {
      toast.warning("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    const newPromo = {
      title: promoTitle,
      description: promoDesc,
      discountPercentage: Number(promoDiscount),
      targetTiers: promoTiers
    };

    const successMsg = await onCreatePromo(newPromo);
    if (successMsg) {
      setPromoSuccess(successMsg);
      setPromoTitle('');
      setPromoDesc('');
      setPromoDiscount(10);
      setPromoTiers(['Silver']);
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
      {/* Active Campaigns */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>CHIẾN DỊCH KHUYẾN MÃI ĐANG CHẠY</h3>
        
        {promotions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Chưa có chiến dịch nào được tạo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {promotions.map(promo => (
              <div key={promo.id} style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <div className="flex-between">
                  <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{promo.title}</h4>
                  <span className={`status-badge status-${promo.isActive ? 'Completed' : 'Cancelled'}`}>
                    {promo.isActive ? 'Đang chạy' : 'Đã dừng'}
                  </span>
                </div>
                <p className="text-xs" style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>{promo.description}</p>
                
                <div style={{ margin: '0.75rem 0' }}>
                  <span className="text-xs" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Tập khách hàng áp dụng:</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {promo.targetTiers.map(t => (
                      <span key={t} className={`tier-indicator tier-${t}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>-{promo.discountPercentage}%</span>
                  </div>
                  <button className={`btn btn-sm ${promo.isActive ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onTogglePromo(promo.id)}>
                    {promo.isActive ? 'Tạm Dừng' : 'Kích Hoạt'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Promotion Designer */}
      <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>THIẾT KẾ KHUYẾN MÃI HẠNG (TIER) MỚI</h3>
        {promoSuccess && <div className="alert alert-success">{promoSuccess}</div>}

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

          <div className="form-group">
            <label>Hạng Hội Viên Áp Dụng * (Chọn một hoặc nhiều)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {['Member', 'Silver', 'Gold', 'Platinum'].map(tier => {
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Phát Hành Chiến Dịch
          </button>
        </form>
      </div>
    </div>
  );
}
