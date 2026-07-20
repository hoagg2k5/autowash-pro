import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null); // null means adding new
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/branches`);
      if (!res.ok) throw new Error('Không thể tải danh sách chi nhánh.');
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleEdit = (branch) => {
    setEditingId(branch._id);
    setName(branch.name);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setIsActive(branch.isActive);

    const formElement = document.getElementById('branch-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setPhone('');
    setIsActive(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên chi nhánh.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      isActive
    };

    try {
      const token = sessionStorage.getItem('autowash_token');
      let url = `${API_BASE_URL}/api/branches`;
      let method = 'POST';

      if (editingId) {
        url = `${API_BASE_URL}/api/branches/${editingId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại.');

      toast.success(editingId ? 'Cập nhật chi nhánh thành công!' : 'Thêm chi nhánh mới thành công!');
      handleCancel();
      fetchBranches();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chi nhánh này? Mọi liên kết bay/nhân viên/đơn hàng với tên chi nhánh này có thể bị ảnh hưởng.')) return;
    try {
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/branches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa chi nhánh.');
      toast.success('Đã xóa chi nhánh thành công.');
      fetchBranches();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (active) => {
    return active 
      ? <span className="status-badge status-Confirmed">Hoạt động</span> 
      : <span className="status-badge status-Cancelled">Tắt</span>;
  };

  if (loading && branches.length === 0) return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải danh sách chi nhánh...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
      {/* List Panel */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>DANH SÁCH CHI NHÁNH</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        
        {branches.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Không có chi nhánh nào trong hệ thống.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tên Chi Nhánh</th>
                  <th>Địa Chỉ</th>
                  <th>Số Điện Thoại</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(branch => (
                  <tr key={branch._id}>
                    <td><strong>{branch.name}</strong></td>
                    <td className="text-sm">{branch.address || 'Chưa có'}</td>
                    <td className="text-sm">{branch.phone || 'Chưa có'}</td>
                    <td>{getStatusBadge(branch.isActive)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(branch)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(branch._id)}
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
      <div id="branch-form" className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>
          {editingId ? '📝 CẬP NHẬT CHI NHÁNH' : '🏢 THÊM CHI NHÁNH MỚI'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="branch-name">Tên Chi Nhánh *</label>
            <input 
              id="branch-name"
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ví dụ: AutoWash Pro - Quận 2" 
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch-address">Địa Chỉ</label>
            <input 
              id="branch-address"
              type="text" 
              className="form-input" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Ví dụ: 123 Đường Nguyễn Huệ, Quận 1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch-phone">Số Điện Thoại</label>
            <input 
              id="branch-phone"
              type="text" 
              className="form-input" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Ví dụ: 028.1234.5678"
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch-active">Trạng Thái Hoạt Động *</label>
            <select 
              id="branch-active"
              className="form-input" 
              value={isActive ? 'true' : 'false'} 
              onChange={(e) => setIsActive(e.target.value === 'true')}
              required
            >
              <option value="true">Hoạt động (Active)</option>
              <option value="false">Tắt (Inactive)</option>
            </select>
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
