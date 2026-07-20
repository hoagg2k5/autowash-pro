import React, { useState } from 'react';

export default function AdminRules({ rules, onUpdateRules }) {
  const [silverSpend, setSilverSpend] = useState(rules?.tierSettings.Silver.spendThreshold || 200000);
  const [goldSpend, setGoldSpend] = useState(rules?.tierSettings.Gold.spendThreshold || 500000);
  const [platinumSpend, setPlatinumSpend] = useState(rules?.tierSettings.Platinum.spendThreshold || 1000000);
  const [pointsPerVnd, setPointsPerVnd] = useState(rules?.pointsPerVndRate || 25000);
  const [vndPerPoint, setVndPerPoint] = useState(rules?.vndPerPointRedeemed || 1250);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateRules({
      tierSettings: {
        Member: { ...rules.tierSettings.Member, spendThreshold: 0 },
        Silver: { ...rules.tierSettings.Silver, spendThreshold: Number(silverSpend) },
        Gold: { ...rules.tierSettings.Gold, spendThreshold: Number(goldSpend) },
        Platinum: { ...rules.tierSettings.Platinum, spendThreshold: Number(platinumSpend) }
      },
      pointsPerVndRate: Number(pointsPerVnd),
      vndPerPointRedeemed: Number(vndPerPoint)
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        ⚙️ CẤU HÌNH ĐIỂM & ĐẶC QUYỀN HẠNG HỘI VIÊN
      </h3>

      <form onSubmit={handleSubmit}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.05rem' }}>1. Ngưỡng Phân Hạng Chi Tiêu (VND)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="form-group">
            <label>Hạng MEMBER (Mặc định)</label>
            <input type="text" className="form-input" value="0 đ" disabled />
          </div>
          <div className="form-group">
            <label>Hạng SILVER (Ngưỡng VND) *</label>
            <input 
              type="number" 
              className="form-input" 
              value={silverSpend} 
              onChange={(e) => setSilverSpend(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Hạng GOLD (Ngưỡng VND) *</label>
            <input 
              type="number" 
              className="form-input" 
              value={goldSpend} 
              onChange={(e) => setGoldSpend(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Hạng PLATINUM (Ngưỡng VND) *</label>
            <input 
              type="number" 
              className="form-input" 
              value={platinumSpend} 
              onChange={(e) => setPlatinumSpend(e.target.value)} 
              required 
            />
          </div>
        </div>

        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.05rem' }}>2. Cấu Hình Tỷ Lệ Tích Điểm & Đổi Điểm Giảm Giá</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="form-group">
            <label>Tỷ lệ tích điểm: Cần chi tiêu bao nhiêu VND để nhận 1 điểm gốc?</label>
            <input 
              type="number" 
              className="form-input" 
              value={pointsPerVnd} 
              onChange={(e) => setPointsPerVnd(e.target.value)} 
              required 
            />
            <span className="text-xs">Hiện tại: {formatVnd(pointsPerVnd)} = 1 điểm tích lũy gốc</span>
          </div>
          <div className="form-group">
            <label>Tỷ lệ đổi điểm: 1 điểm tích lũy quy đổi được bao nhiêu VND giảm giá?</label>
            <input 
              type="number" 
              className="form-input" 
              value={vndPerPoint} 
              onChange={(e) => setVndPerPoint(e.target.value)} 
              required 
            />
            <span className="text-xs">Hiện tại: 1 điểm = {formatVnd(vndPerPoint)} giảm giá (20 điểm = {formatVnd(vndPerPoint * 20)})</span>
          </div>
        </div>

        <h4 style={{ color: 'var(--primary)', marginBottom: '1.25rem', fontSize: '1.05rem' }}>3. Chi Tiết Hệ Số Nhân & Khung Đặt Lịch Hiện Tại</h4>
        {rules && (
          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Chi tiêu tối thiểu</th>
                  <th>Khung đặt hẹn trước</th>
                  <th>Hệ số tích điểm</th>
                  <th>Đặc quyền chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rules.tierSettings).map(([tier, tRules]) => (
                  <tr key={tier}>
                    <td><span className={`tier-indicator tier-${tier}`}>{tier}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatVnd(tRules.spendThreshold)}</td>
                    <td><strong>{tRules.bookingWindowDays} ngày</strong></td>
                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>x{tRules.pointMultiplier}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{tRules.perks.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Lưu Cấu Hình Cập Nhật
        </button>
      </form>
    </div>
  );
}
