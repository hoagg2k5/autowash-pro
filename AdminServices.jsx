import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [editingId, setEditingId] = useState(null); // null means adding new
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [detailsText, setDetailsText] = useState(''); // Newline-separated details
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/services`);
      if (!res.ok) throw new Error('Không thể tải danh sách gói dịch vụ');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleEdit = (srv) => {
    setEditingId(srv.id);
    setName(srv.name);
    setPrice(srv.price);
    setDescription(srv.description || '');
    setDetailsText(srv.details ? srv.details.join('\n') : '');
    // Scroll to form
    const formElement = document.getElementById('service-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setDetailsText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      toast.warning('Vui lòng điền Tên gói và Giá dịch vụ.');
      return;
    }

    setSubmitting(true);
    const details = detailsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const payload = {
      name,
      price: Number(price),
      description,
      details
    };

    try {
      let url = `${API_BASE_URL}/api/admin/services`;
      let method = 'POST';

      if (editingId) {
        url = `${API_BASE_URL}/api/admin/services/${editingId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại.');

      toast.success(editingId ? 'Cập nhật gói rửa xe thành công!' : 'Thêm gói rửa xe mới thành công!');
      handleCancel();
      fetchServices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa gói dịch vụ này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa dịch vụ.');
      toast.success('Đã xóa gói dịch vụ.');
      fetchServices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && services.length === 0) return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải gói dịch vụ...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
      {/* List Panel */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>DANH SÁCH GÓI RỬA XE</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        
        {services.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Không có gói rửa xe nào trong hệ thống.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tên Gói</th>
                  <th>Giá Vé</th>
                  <th>Mô Tả</th>
                  <th>Chi Tiết</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {services.map(srv => (
                  <tr key={srv.id}>
                    <td><strong>{srv.name}</strong></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatVnd(srv.price)}</td>
                    <td className="text-sm" style={{ maxWidth: '180px' }}>{srv.description}</td>
                    <td className="text-xs">
                      <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                        {srv.details && srv.details.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(srv)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(srv.id)}
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
      <div id="service-form" className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>
          {editingId ? '📝 CẬP NHẬT GÓI RỬA XE' : '✨ THÊM GÓI RỬA XE MỚI'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="srv-name">Tên Gói Dịch Vụ *</label>
            <input 
              id="srv-name"
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ví dụ: Standard, Premium, Ultimate..." 
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="srv-price">Giá dịch vụ (VND) *</label>
            <input 
              id="srv-price"
              type="number" 
              className="form-input" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="Ví dụ: 150000" 
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="srv-desc">Mô tả ngắn</label>
            <input 
              id="srv-desc"
              type="text" 
              className="form-input" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Rửa cơ bản trong và ngoài, sấy khô..." 
            />
          </div>

          <div className="form-group">
            <label htmlFor="srv-details">Các công việc chi tiết (Mỗi dòng một gạch đầu dòng)</label>
            <textarea 
              id="srv-details"
              className="form-input" 
              rows="6"
              value={detailsText} 
              onChange={(e) => setDetailsText(e.target.value)} 
              placeholder="Rửa bọt tuyết chuyên sâu&#10;Hút bụi cabin&#10;Dưỡng bóng lốp"
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
