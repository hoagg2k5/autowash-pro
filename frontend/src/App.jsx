import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/shared/Header.jsx';
import Homepage from './components/home/Homepage.jsx';
import Login from './components/Login.jsx';
import CustomerDashboard from './components/CustomerDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import StaffDashboard from './components/staff/StaffDashboard.jsx';
import { io } from 'socket.io-client';
import { API_BASE_URL } from './config.js';
import { toast } from './components/shared/toast.js';
import AiChatBubble from './components/shared/AiChatBubble.jsx';
import PaymentResult from './components/customer/PaymentResult.jsx';
import CustomerProfile from './components/customer/CustomerProfile.jsx';

export default function App() {
  // Sync localStorage to sessionStorage on load so new tabs stay logged in
  try {
    if (!sessionStorage.getItem('autowash_token') && localStorage.getItem('autowash_token')) {
      sessionStorage.setItem('autowash_token', localStorage.getItem('autowash_token') || '');
      sessionStorage.setItem('autowash_user', localStorage.getItem('autowash_user') || '');
      sessionStorage.setItem('autowash_vehicles', localStorage.getItem('autowash_vehicles') || '[]');
      localStorage.setItem('autowash_active_user_id', JSON.parse(localStorage.getItem('autowash_user') || '{}').id || '');
    }
  } catch (e) {
    console.error('Failed to sync auth storage:', e);
  }

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('autowash_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const savedVehicles = sessionStorage.getItem('autowash_vehicles');
      return savedVehicles ? JSON.parse(savedVehicles) : [];
    } catch {
      return [];
    }
  });


  const [queueCount, setQueueCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);

  const navigate = useNavigate();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Modals and Voucher states
  const [showVouchersModal, setShowVouchersModal] = useState(false);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const fetchMyVouchers = async () => {
    if (!currentUser || currentUser.role !== 'customer') return;
    setLoadingVouchers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/my-vouchers`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyVouchers(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách voucher của tôi:", err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    if (showVouchersModal && currentUser && currentUser.role === 'customer') {
      fetchMyVouchers();
    }
  }, [showVouchersModal, currentUser]);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${currentUser.id}/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Đổi mật khẩu thất bại.');

      setPasswordSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowAccountModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLoginSuccess = (user, userVehicles = [], token = '') => {
    setCurrentUser(user);
    setVehicles(userVehicles);
    try {
      sessionStorage.setItem('autowash_user', JSON.stringify(user));
      sessionStorage.setItem('autowash_vehicles', JSON.stringify(userVehicles));
      localStorage.setItem('autowash_user', JSON.stringify(user));
      localStorage.setItem('autowash_vehicles', JSON.stringify(userVehicles));
      if (token) {
        sessionStorage.setItem('autowash_token', token);
        localStorage.setItem('autowash_token', token);
      }
      localStorage.setItem('autowash_active_user_id', user.id);
    } catch (e) {
      console.error(e);
    }
    
    if (user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user.role === 'staff') {
      navigate('/staff/dashboard', { replace: true });
    } else {
      navigate('/customer/dashboard', { replace: true });
    }
  };

  const handleLogout = async (shouldNotifyServer = true) => {
    if (shouldNotifyServer) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
      } catch (err) {
        console.error("Lỗi gọi API đăng xuất:", err);
      }
    }
    setCurrentUser(null);
    setVehicles([]);
    setQueueCount(0);
    setPendingCount(0);
    setFeedbackCount(0);
    try {
      sessionStorage.removeItem('autowash_user');
      sessionStorage.removeItem('autowash_vehicles');
      sessionStorage.removeItem('autowash_token');
      localStorage.removeItem('autowash_user');
      localStorage.removeItem('autowash_vehicles');
      localStorage.removeItem('autowash_token');
      localStorage.removeItem('autowash_active_user_id');
    } catch (e) {
      console.error(e);
    }
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const handleForcedLogoutEvent = (e) => {
      handleLogout(false);
      toast.error(e.detail || 'Tài khoản đã đăng nhập ở thiết bị khác.', 7000);
    };
    window.addEventListener('autowash_logout_forced', handleForcedLogoutEvent);
    return () => {
      window.removeEventListener('autowash_logout_forced', handleForcedLogoutEvent);
    };
  }, []);

  // Xác thực phiên làm việc mỗi khi khởi chạy ứng dụng (F5 / tải trang)
  useEffect(() => {
    const validateSession = async () => {
      const token = sessionStorage.getItem('autowash_token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`);
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          sessionStorage.setItem('autowash_user', JSON.stringify(data.user));
          localStorage.setItem('autowash_user', JSON.stringify(data.user));
          localStorage.setItem('autowash_active_user_id', data.user.id);
        } else {
          // Lỗi xác thực hoặc hết hạn sẽ được fetch interceptor xử lý, 
          // nếu không ta tự động dọn dẹp và logout tại đây
          handleLogout(false);
        }
      } catch (err) {
        console.error("Lỗi kết nối xác thực phiên:", err);
      }
    };

    validateSession();
  }, []);

  // Lắng nghe sự kiện đổi Tab và thay đổi localStorage để phát hiện đăng nhập chồng chéo lập tức (0ms)
  useEffect(() => {
    const checkTabSessionConflict = () => {
      const activeUserId = localStorage.getItem('autowash_active_user_id');
      const currentSavedUser = sessionStorage.getItem('autowash_user');
      if (currentSavedUser && activeUserId) {
        try {
          const userObj = JSON.parse(currentSavedUser);
          if (userObj && userObj.id && userObj.id !== activeUserId) {
            handleLogout(false);
            toast.error('Phiên làm việc đã hết hạn do có tài khoản khác đăng nhập trên trình duyệt này.', 7000);
          }
        } catch (e) {
          // Bỏ qua
        }
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'autowash_active_user_id' && e.newValue) {
        checkTabSessionConflict();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTabSessionConflict();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkTabSessionConflict);

    // Kiểm tra ngay lập tức khi component mount hoặc currentUser thay đổi
    checkTabSessionConflict();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkTabSessionConflict);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
    const socket = io(API_BASE_URL);
    
    socket.on('connect', () => {
      socket.emit('join_user_room', currentUser.id);
      if (currentUser.role === 'staff' || currentUser.role === 'admin') {
        socket.emit('join_staff_admin_room');
      }
    });
    
    socket.on('force_logout', (data) => {
      handleLogout(false);
      toast.error(data.message || 'Tài khoản đã đăng nhập ở thiết bị khác.', 7000);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  const handleStartBooking = () => {
    navigate('/login');
  };

  const handleStartAdmin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (currentUser.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onGoToHome={handleGoToHome}
        onOpenAccountModal={() => setShowAccountModal(true)}
        onOpenVouchersModal={() => setShowVouchersModal(true)}
        queueCount={queueCount}
        pendingCount={pendingCount}
        feedbackCount={feedbackCount}
      />

      {/* Main Body */}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={
            <Homepage 
              onStartBooking={handleStartBooking} 
              onStartAdmin={handleStartAdmin} 
            />
          } />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/login" element={
            currentUser ? (
              currentUser.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
              currentUser.role === 'staff' ? <Navigate to="/staff/dashboard" replace /> :
              <Navigate to="/customer/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} mode="login" />
            )
          } />
          <Route path="/register" element={
            currentUser ? (
              <Navigate to="/customer/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} mode="register" />
            )
          } />
          <Route path="/forgot-password" element={
            currentUser ? (
              <Navigate to="/customer/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} mode="forgot-password" />
            )
          } />
          <Route path="/customer/dashboard" element={
            currentUser && currentUser.role === 'customer' ? (
              <CustomerDashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                onUpdateUser={(updatedData) => {
                  const newUser = { ...currentUser, ...updatedData };
                  setCurrentUser(newUser);
                  sessionStorage.setItem('autowash_user', JSON.stringify(newUser));
                  localStorage.setItem('autowash_user', JSON.stringify(newUser));
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/customer/profile" element={
            currentUser && currentUser.role === 'customer' ? (
              <CustomerProfile 
                user={currentUser} 
                onLogout={handleLogout} 
                onUpdateUser={(updatedData) => {
                  const newUser = { ...currentUser, ...updatedData };
                  setCurrentUser(newUser);
                  sessionStorage.setItem('autowash_user', JSON.stringify(newUser));
                  localStorage.setItem('autowash_user', JSON.stringify(newUser));
                }} 
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/payment-result" element={<PaymentResult user={currentUser} />} />
          <Route path="/staff/dashboard/:view" element={
            currentUser && currentUser.role === 'staff' ? (
              <StaffDashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                setQueueCount={setQueueCount}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/staff/dashboard" element={<Navigate to="/staff/dashboard/console" replace />} />
          <Route path="/admin/dashboard/:tab" element={
            currentUser && currentUser.role === 'admin' ? (
              <AdminDashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                setPendingCount={setPendingCount}
                setFeedbackCount={setFeedbackCount}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/dashboard/analytics" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 AutoWash Pro. Hệ thống được thiết kế tối ưu hóa dịch vụ rửa xe ô tô thông minh và khách hàng thân thiết tại Việt Nam.</p>
      </footer>

      {/* Account Management Modal */}
      {showAccountModal && currentUser && (
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
          zIndex: 10000
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            padding: '2.5rem',
            width: '450px',
            maxWidth: '95%',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>
              QUẢN LÝ TÀI KHOẢN
            </h3>
            
            {/* Profile Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Họ và tên:</span>
                <strong style={{ color: 'var(--text-main)' }}>{currentUser.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số điện thoại:</span>
                <strong style={{ color: 'var(--text-main)' }}>{currentUser.phone}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email liên kết:</span>
                <strong style={{ color: 'var(--text-main)' }}>{currentUser.email || 'Chưa cập nhật'}</strong>
              </div>
            </div>

            {/* Change Password Inline Form */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                🔑 Thay Đổi Mật Khẩu
              </h4>
              
              {passwordError && <div className="alert alert-danger" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginBottom: '0.75rem', borderRadius: '6px' }}>{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginBottom: '0.75rem', borderRadius: '6px' }}>{passwordSuccess}</div>}

              <form onSubmit={handleChangePasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="modal-old-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block', fontWeight: 600 }}>Mật khẩu cũ *</label>
                  <input
                    type="password"
                    id="modal-old-password"
                    className="form-input"
                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem', borderRadius: '8px' }}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="modal-new-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block', fontWeight: 600 }}>Mật khẩu mới *</label>
                  <input
                    type="password"
                    id="modal-new-password"
                    className="form-input"
                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem', borderRadius: '8px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="modal-confirm-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block', fontWeight: 600 }}>Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    id="modal-confirm-password"
                    className="form-input"
                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem', borderRadius: '8px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                    onClick={() => {
                      setShowAccountModal(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    disabled={changingPassword}
                  >
                    Đóng
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', background: 'var(--primary)', color: '#fff', fontWeight: 'bold' }}
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Đang cập nhật...' : 'Cập Nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Của Tôi Modal */}
      {showVouchersModal && currentUser && currentUser.role === 'customer' && (
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
          zIndex: 10000
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            padding: '2.5rem',
            width: '450px',
            maxWidth: '95%',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>
              🎟️ VOUCHER CỦA TÔI
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0' }}>
                Danh sách các mã giảm giá của bạn:
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.4rem', marginTop: '0.25rem' }}>
                {loadingVouchers ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>Đang tải danh sách voucher...</p>
                ) : myVouchers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Hiện chưa có voucher nào
                  </div>
                ) : (
                  myVouchers.map(v => {
                    let valText = "";
                    if (v.discountVnd) valText = `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountVnd)}`;
                    else if (v.discountPercent) valText = `Giảm ${v.discountPercent}%`;

                    const isRedeemed = v.pointsRequired > 0;

                    return (
                      <div 
                        key={v._id} 
                        style={{
                          padding: '0.8rem 1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>{v.code}</code>
                            <span style={{ fontSize: '0.65rem', color: '#fff', background: '#3b82f6', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 'bold' }}>
                              Số lượng: {v.ownedCount || 1}
                            </span>
                          </div>
                          {isRedeemed ? (
                            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', background: 'rgba(2, 132, 199, 0.08)', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 600 }}>
                              Đổi bằng điểm
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 600 }}>
                              Tặng theo hạng
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Trị giá: <span style={{ color: '#10b981' }}>{valText}</span>
                        </div>
                        {v.minSpent > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Đơn tối thiểu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minSpent)}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          HSD: <strong style={{ color: 'var(--text-main)' }}>{v.expiryDate}</strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px' }}
                  onClick={() => setShowVouchersModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(!currentUser || currentUser.role === 'customer') && <AiChatBubble />}
    </div>
  );
}
