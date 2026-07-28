import React, { useState, useEffect } from 'react';
import { toast } from '../shared/toast.js';

export default function AdminStaffs({ user, API_BASE_URL }) {
  const [staffs, setStaffs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ 
    fullName: '', 
    phone: '', 
    password: '', 
    role: 'staff', 
    branch: '' 
  });

  const fetchStaffs = async () => {
    if (user?.branch) return;
    setStaffLoading(true);
    try {
      const token = sessionStorage.getItem('autowash_token') || localStorage.getItem('autowash_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/staffs`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStaffs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/branches`);
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
        if (data.length > 0 && !staffForm.branch) {
          setStaffForm(prev => ({ ...prev, branch: data[0].name }));
        }
      }
    } catch (err) {
      console.error("Error loading branches:", err);
    }
  };

  useEffect(() => {
    fetchStaffs();
    fetchBranches();
  }, []);

  const handleCreateOrUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      const url = editingStaff 
        ? `${API_BASE_URL}/api/admin/staffs/${editingStaff.id}`
        : `${API_BASE_URL}/api/admin/staffs`;
      const method = editingStaff ? 'PUT' : 'POST';

      const token = sessionStorage.getItem('autowash_token') || localStorage.getItem('autowash_token');
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(staffForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thao tác thất bại.");

      toast.success(editingStaff ? "Đã cập nhật tài khoản nhân sự." : "Đã tạo tài khoản nhân sự mới.");
      setShowStaffModal(false);
      fetchStaffs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Xác nhận xóa tài khoản nhân sự này?")) return;
    try {
      const token = sessionStorage.getItem('autowash_token') || localStorage.getItem('autowash_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/staffs/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Xóa thất bại.");

      toast.success(data.message);
      fetchStaffs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (user?.branch) return null; // Only Super Admin can manage staff

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>QUẢN LÝ NHÂN SỰ & CHI NHÁNH</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingStaff(null);
            setStaffForm({ fullName: '', phone: '', password: '', role: 'staff', branch: branches[0]?.name || '' });
            setShowStaffModal(true);
          }}
        >
          Thêm Nhân Viên Mới
        </button>
      </div>

      {staffLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải danh sách nhân sự...</div>
      ) : staffs.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có nhân sự nào được đăng ký.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Số Điện Thoại</th>
                <th>Vai Trò</th>
                <th>Chi Nhánh</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {staffs.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.fullName}</strong></td>
                  <td>{s.phone}</td>
                  <td>
                    <span className={`status-badge ${s.role === 'admin' ? 'status-Confirmed' : 'status-Pending'}`} style={{ textTransform: 'capitalize' }}>
                      {s.role === 'admin' ? 'Quản lý chi nhánh' : 'Nhân viên'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.branch}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setEditingStaff(s);
                          setStaffForm({ fullName: s.fullName, phone: s.phone, password: '', role: s.role, branch: s.branch });
                          setShowStaffModal(true);
                        }}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteStaff(s.id)}
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

      {/* Modal Quản Lý Nhân Viên */}
      {showStaffModal && (
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
            width: '480px',
            maxWidth: '95%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            position: 'relative'
          }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>
              {editingStaff ? 'Cập nhật tài khoản nhân sự' : 'Thêm tài khoản nhân sự mới'}
            </h3>
            
            <form onSubmit={handleCreateOrUpdateStaff}>
              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Họ và Tên *</label>
                <input 
                  type="text"
                  className="form-input"
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Số Điện Thoại *</label>
                <input 
                  type="text"
                  className="form-input"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Mật Khẩu {editingStaff ? '(Để trống nếu không muốn đổi)' : '*'}</label>
                <input 
                  type="password"
                  className="form-input"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  required={!editingStaff}
                />
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Vai Trò *</label>
                <select 
                  className="form-input"
                  value={staffForm.role}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  required
                >
                  <option value="staff">Nhân viên rửa xe (Staff)</option>
                  <option value="admin">Quản lý chi nhánh (Branch Admin)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-main)' }}>Chi Nhánh Gán *</label>
                <select 
                  className="form-input"
                  value={staffForm.branch}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, branch: e.target.value }))}
                  required
                >
                  {branches.map(br => (
                    <option key={br._id} value={br.name}>{br.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStaffModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? 'Lưu cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
