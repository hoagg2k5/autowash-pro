import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function AdminBays() {
  const [bays, setBays] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null); // null means adding new
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [listBranchFilter, setListBranchFilter] = useState('Tất cả');

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/branches`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        if (data.length > 0) {
          setBranch(data[0].name);
        }
      }
    } catch (err) {
      console.error("Error loading branches:", err);
    }
  };

  const fetchBays = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/bays`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Không thể tải danh sách khoang rửa xe');
      const data = await res.json();
      setBays(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBays();
    fetchBranches();
  }, []);

  const handleEdit = (bay) => {
    setEditingId(bay._id);
    setName(bay.name);
    setBranch(bay.branch);
    setStatus(bay.status);
    setDescription(bay.description || '');

    const formElement = document.getElementById('bay-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setBranch(branches[0]?.name || '');
    setStatus('Active');
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !branch) {
      toast.warning('Vui lòng nhập tên khoang và chọn chi nhánh.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      branch,
      status,
      description
    };

    try {
      const token = sessionStorage.getItem('autowash_token');
      let url = `${API_BASE_URL}/api/bays`;
      let method = 'POST';

      if (editingId) {
        url = `${API_BASE_URL}/api/bays/${editingId}`;
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

      toast.success(editingId ? 'Cập nhật khoang rửa thành công!' : 'Thêm khoang rửa mới thành công!');
      handleCancel();
      fetchBays();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoang rửa xe này?')) return;
    try {
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/bays/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa khoang rửa.');
      toast.success('Đã xóa khoang rửa.');
      fetchBays();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Active': return <span className="status-badge status-Confirmed">Hoạt động</span>;
      case 'Maintenance': return <span className="status-badge status-Pending">Bảo trì 🛠️</span>;
      case 'Inactive': return <span className="status-badge status-Cancelled">Tắt</span>;
      default: return <span className="status-badge status-Pending">{s}</span>;
    }
  };

  if (loading && bays.length === 0) return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải danh sách khoang...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
      {/* List Panel */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>DANH SÁCH KHOANG RỬA XE</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lọc chi nhánh:</span>
            <select
              className="form-input"
              style={{ width: '220px', padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: '#ffffff', margin: 0 }}
              value={listBranchFilter}
              onChange={(e) => setListBranchFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả chi nhánh</option>
              {branches.map(br => (
                <option key={br._id} value={br.name}>{br.name}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        
        {bays.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Không có khoang rửa nào trong hệ thống.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tên Khoang</th>
                  <th>Chi Nhánh</th>
                  <th>Trạng Thái</th>
                  <th>Mô Tả</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {bays
                  .filter(bay => listBranchFilter === 'Tất cả' || bay.branch === listBranchFilter)
                  .map(bay => (
                  <tr key={bay._id}>
                    <td style={{ whiteSpace: 'nowrap' }}><strong>{bay.name}</strong></td>
                    <td className="text-sm"><strong>{bay.branch}</strong></td>
                    <td>{getStatusBadge(bay.status)}</td>
                    <td className="text-sm">{bay.description || 'Chưa có'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(bay)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(bay._id)}
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
      <div id="bay-form" className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>
          {editingId ? '📝 CẬP NHẬT KHOANG RỬA' : '🚿 THÊM KHOANG RỬA MỚI'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="bay-name">Tên Khoang Rửa *</label>
            <input 
              id="bay-name"
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ví dụ: Khoang 1, Khoang 2, Khoang 4..." 
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bay-branch">Chi Nhánh *</label>
            <select 
              id="bay-branch"
              className="form-input" 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              {branches.map(br => (
                <option key={br._id} value={br.name}>{br.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bay-status">Trạng Thái Hoạt Động *</label>
            <select 
              id="bay-status"
              className="form-input" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="Active">Hoạt động (Active)</option>
              <option value="Maintenance">Bảo trì (Maintenance)</option>
              <option value="Inactive">Tắt (Inactive)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bay-desc">Mô tả chi tiết</label>
            <textarea 
              id="bay-desc"
              className="form-input" 
              rows="3"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Khoang dành riêng cho rửa gầm xe và vệ sinh nội thất..." 
            />
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
