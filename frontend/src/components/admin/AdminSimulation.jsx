import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function AdminSimulation() {
  const [simCount, setSimCount] = useState(2000);
  const [simResults, setSimResults] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSimulateData = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    setSimResults(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/simulate-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: simCount })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể giả lập dữ liệu.");

      setSimResults(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        📊 PHÒNG NGHIÊN CỨU DỮ LIỆU THÀNH VIÊN & MÔ PHỎNG TRANSACTIONS (RESEARCH PORTAL)
      </h3>
      <p className="text-sm" style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Để hỗ trợ cho việc nghiên cứu <strong>"Yếu tố ảnh hưởng đến sự phát triển bậc loyalty của khách hàng Việt"</strong>, Admin có thể tạo ra tập dữ liệu mô phỏng hành vi rửa xe dựa trên phân bố thực tế (gồm: SĐT, Biển số xe ô tô, loại xe SUV/Sedan, gói rửa, số lần rửa tích lũy, số điểm thưởng, có dùng phần thưởng hay không, doanh thu, thời điểm giao dịch).
      </p>

      <form onSubmit={handleSimulateData} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <label>Quy Mô Tập Dữ Liệu Cần Tạo (Số Dòng Log Giao Dịch)</label>
          <input
            type="number"
            className="form-input"
            min="100"
            max="10000"
            value={simCount}
            onChange={(e) => setSimCount(parseInt(e.target.value) || 2000)}
            placeholder="2000"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={simLoading} style={{ padding: '0.75rem 1.5rem' }}>
          {simLoading ? 'Đang Tạo...' : '⚡ Khởi Tạo Synthetic Dataset'}
        </button>
      </form>

      {simResults && (
        <div>
          <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span>✅ {simResults.message} Đã sẵn sàng xuất bản ra file.</span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a 
                href={`${API_BASE_URL}/api/admin/export-data?format=csv`} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-primary" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
              >
                📥 Tải Xuống CSV
              </a>
              <a 
                href={`${API_BASE_URL}/api/admin/export-data?format=json`} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', textDecoration: 'none', border: '1px solid var(--primary)' }}
              >
                📥 Tải Xuống JSON
              </a>
            </div>
          </div>

          <h4 style={{ margin: '1.5rem 0 0.75rem 0', color: 'var(--primary)' }}>Xem Trước 5 Bản Ghi Mô Phỏng Mẫu (Preview Logs)</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Thời gian giao dịch</th>
                  <th>Thông tin khách xe</th>
                  <th>Loại xe</th>
                  <th>Gói dịch vụ</th>
                  <th>Doanh thu thu về</th>
                  <th>Tích điểm (Hạng khi đó)</th>
                  <th>Dùng reward? (Đổi điểm)</th>
                </tr>
              </thead>
              <tbody>
                {simResults.sample.map((s, idx) => (
                  <tr key={idx}>
                    <td><code>{s.transactionId}</code></td>
                    <td>{new Date(s.dateTime).toLocaleString('vi-VN')}</td>
                    <td>
                      <strong>{s.licensePlate}</strong>
                      <div className="text-xs">{s.phone}</div>
                    </td>
                    <td>{s.carBrand} {s.carModel} ({s.carType})</td>
                    <td>{s.servicePackage}</td>
                    <td style={{ fontWeight: 700 }}>{formatVnd(s.amountPaid)}</td>
                    <td>
                      <span style={{ color: 'var(--status-completed)', fontWeight: 600 }}>+{s.pointsEarned}đ</span>
                      <div><span className={`tier-indicator tier-${s.loyaltyTier}`} style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>{s.loyaltyTier}</span></div>
                    </td>
                    <td>
                      {s.usedReward === 'Yes' ? (
                        <span style={{ color: 'var(--status-cancelled)' }}>Có (-{s.pointsRedeemed}đ)</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Không</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
