import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [actionFilter, setActionFilter] = useState('');
  const [adminNameSearch, setAdminNameSearch] = useState('');

  const limit = 15;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('autowash_token');
      let url = `${API_BASE_URL}/api/admin/audit-logs?page=${page}&limit=${limit}`;
      if (actionFilter) {
        url += `&action=${actionFilter}`;
      }
      if (adminNameSearch.trim()) {
        url += `&adminName=${encodeURIComponent(adminNameSearch.trim())}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Không thể tải nhật ký hoạt động.');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const formatDateTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action) => {
    let styleClass = 'status-Pending'; // amber
    if (action.startsWith('CREATE_') || action.startsWith('ADD_')) {
      styleClass = 'status-Completed'; // green
    } else if (action.startsWith('EDIT_') || action.startsWith('UPDATE_') || action.startsWith('TOGGLE_')) {
      styleClass = 'status-Confirmed'; // blue
    } else if (action.startsWith('DELETE_') || action.startsWith('REMOVE_')) {
      styleClass = 'status-Cancelled'; // red
    }
    
    // Label map for Vietnamese readable names
    const actionLabels = {
      ADJUST_POINTS: 'Sửa điểm',
      UPDATE_RULES: 'Sửa luật',
      CREATE_BRANCH: 'Tạo chi nhánh',
      EDIT_BRANCH: 'Sửa chi nhánh',
      DELETE_BRANCH: 'Xóa chi nhánh',
      CREATE_PROMOTION: 'Tạo KM',
      TOGGLE_PROMOTION: 'Bật/Tắt KM',
      CREATE_VOUCHER: 'Tạo Voucher',
      EDIT_VOUCHER: 'Sửa Voucher',
      DELETE_VOUCHER: 'Xóa Voucher',
      DELETE_CUSTOMER: 'Xóa hội viên'
    };

    return (
      <span className={`status-badge ${styleClass}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
        {actionLabels[action] || action}
      </span>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
        NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG
      </h3>

      {/* Filter bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm theo tên Admin..."
            value={adminNameSearch}
            onChange={(e) => setAdminNameSearch(e.target.value)}
          />
        </div>

        <div>
          <select 
            className="form-input"
            style={{ width: '220px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả hoạt động</option>
            <option value="ADJUST_POINTS">Sửa điểm tích lũy</option>
            <option value="UPDATE_RULES">Cập nhật luật nâng hạng</option>
            <option value="CREATE_BRANCH">Thêm chi nhánh</option>
            <option value="EDIT_BRANCH">Chỉnh sửa chi nhánh</option>
            <option value="DELETE_BRANCH">Xóa chi nhánh</option>
            <option value="CREATE_PROMOTION">Thêm khuyến mãi</option>
            <option value="TOGGLE_PROMOTION">Bật/Tắt khuyến mãi</option>
            <option value="CREATE_VOUCHER">Thêm voucher</option>
            <option value="EDIT_VOUCHER">Sửa voucher</option>
            <option value="DELETE_VOUCHER">Xóa voucher</option>
            <option value="DELETE_CUSTOMER">Xóa khách hàng</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}>
          Tìm kiếm
        </button>
      </form>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading && logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải lịch sử nhật ký...</div>
      ) : logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Không có hoạt động nào được ghi nhận.</p>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Thời Gian</th>
                  <th style={{ width: '160px' }}>Hoạt Động</th>
                  <th style={{ width: '180px' }}>Quản Trị Viên</th>
                  <th>Chi Tiết Thao Tác</th>
                  <th style={{ width: '130px' }}>Địa Chỉ IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td style={{ fontWeight: 600 }}>{log.adminName}</td>
                    <td className="text-sm" style={{ lineHeight: '1.4' }}>{log.details}</td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ipAddress || 'Internal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <span className="text-sm" style={{ fontWeight: 600 }}>Trang {page} / {totalPages} (Tổng {total} logs)</span>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
