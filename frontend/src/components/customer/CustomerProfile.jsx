import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Bell, 
  CreditCard, 
  MapPin, 
  KeyRound, 
  Settings, 
  ShieldAlert, 
  ListOrdered, 
  Ticket, 
  Coins, 
  Pencil, 
  Camera,
  ArrowLeft
} from 'lucide-react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';
import RewardsShop from './RewardsShop.jsx';
import VehicleManager from './VehicleManager.jsx';
import PointsHistoryTab from './PointsHistoryTab.jsx';
import BookingHistoryTab from './BookingHistoryTab.jsx';
import { io } from 'socket.io-client';
export default function CustomerProfile({ user, onLogout, onUpdateUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'vouchers') return 'khovoucher';
    if (tab === 'xecuatoi' || tab === 'vehicles') return 'xecuatoi';
    if (tab === 'orders') return 'donmua';
    if (tab === 'password') return 'doimatkhau';
    if (tab === 'rewards') return 'diemthuong';
    if (tab === 'profile') return 'hoso';
    return 'hoso';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'vouchers') setActiveTab('khovoucher');
    else if (tab === 'xecuatoi' || tab === 'vehicles') setActiveTab('xecuatoi');
    else if (tab === 'orders') setActiveTab('donmua');
    else if (tab === 'password') setActiveTab('doimatkhau');
    else if (tab === 'rewards') setActiveTab('diemthuong');
    else if (tab === 'profile') setActiveTab('hoso');
    else setActiveTab('hoso');
  }, [location.search]);
  
  const [dbUser, setDbUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentlyUpdatedBookingId, setRecentlyUpdatedBookingId] = useState(null);
  const [isAccountExpanded, setIsAccountExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Profile Form States
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dateOfBirth: '',
    avatar: ''
  });

  const [loading, setLoading] = useState(false);

  // Change Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${user.id}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setDbUser(data.user);
          setVehicles(data.vehicles || []);
          setPointsHistory(data.pointsHistory || []);
          setBookings(data.bookings || []);
          setProfile({
            fullName: data.user.fullName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            gender: data.user.gender || 'Nam',
            dateOfBirth: data.user.dateOfBirth || '',
            avatar: data.user.avatar || ''
          });
          if (onUpdateUser) {
            onUpdateUser(data.user);
          }
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  // Fetch full user data on mount
  useEffect(() => {
    fetchUserData();
  }, [user.id]);

  // Socket listener for real-time booking updates
  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      socket.emit('join_user_room', user.id);
    });

    socket.on('booking_updated', (data) => {
      if (data.userId === user.id) {
        fetchUserData();

        let statusText = '';
        if (data.status === 'Confirmed') statusText = 'đã được xác nhận';
        else if (data.status === 'In Progress' || data.status === 'In_Progress') statusText = 'đang được rửa (vào khoang)';
        else if (data.status === 'Completed') statusText = 'đã hoàn thành rửa xe. Quý khách nhận được điểm tích lũy!';
        else if (data.status === 'Cancelled') statusText = 'đã được hủy thành công';

        if (statusText) {
          const toastType = data.status === 'Completed' ? 'success' : data.status === 'Cancelled' ? 'warning' : 'info';
          toast.show(`Lịch đặt xe ${data.licensePlate || ''} ${statusText}.`, toastType);
        }

        if (data.id) {
          setRecentlyUpdatedBookingId(data.id);
          setTimeout(() => {
            setRecentlyUpdatedBookingId(null);
          }, 3000);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id]);



  const handleCancelBooking = async (bookingId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể hủy lịch.");
      }
      fetchUserData();
      toast.success("Hủy lịch đặt thành công!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveAvatarDirectly = async (base64Avatar) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          avatar: base64Avatar
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật ảnh đại diện.");
      }

      toast.success("Cập nhật ảnh đại diện thành công!");
      setProfile(prev => ({ ...prev, avatar: base64Avatar }));

      if (onUpdateUser && data.user) {
        onUpdateUser(data.user);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Dung lượng file tối đa 1 MB!");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error("Định dạng file phải là JPEG hoặc PNG!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      saveAvatarDirectly(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          avatar: profile.avatar
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật hồ sơ.");
      }

      toast.success(data.message || "Cập nhật hồ sơ thành công!");
      setIsEditingName(false);
      setIsEditingPhone(false);

      if (onUpdateUser && data.user) {
        onUpdateUser(data.user);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${user.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể đổi mật khẩu.");
      }

      setPasswordSuccess("Đổi mật khẩu thành công!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success("Thay đổi mật khẩu thành công!");
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-10 dark:bg-slate-900">
      <div className="max-w-[1360px] mx-auto px-4 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Layout */}
        <aside className="w-full md:w-[280px] shrink-0 flex flex-col gap-5">
          {/* Back Button */}
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-[#ee4d2d] dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-left cursor-pointer transition-colors w-fit shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Quay lại</span>
          </button>

          {/* User Profile Title Card */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-200 dark:border-slate-800">
            <div 
              className="w-12 h-12 rounded-full border border-slate-200 bg-white overflow-hidden flex items-center justify-center cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400 fill-slate-200" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <strong className="text-sm text-slate-800 dark:text-slate-200 truncate">{profile.fullName || user.fullName}</strong>
              <button 
                onClick={() => navigate('/customer/profile?tab=profile')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mt-0.5 border-none bg-transparent cursor-pointer p-0"
              >
                <Pencil className="w-3 h-3 text-slate-400" /> Sửa Hồ Sơ
              </button>
            </div>
          </div>

          {/* Menu Items List */}
          <nav className="flex flex-col gap-1">
            
            {/* Account Tab Wrapper */}
            <div className="flex flex-col">
              <button
                onClick={() => setIsAccountExpanded(!isAccountExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border-none bg-transparent text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-sm transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-sky-600" />
                  <span>Tài Khoản Của Tôi</span>
                </div>
                <span 
                  className="text-xs text-slate-400 font-bold transition-transform duration-200" 
                  style={{ transform: isAccountExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
                >
                  ▶
                </span>
              </button>
              
              {isAccountExpanded && (
                <div className="pl-9 flex flex-col gap-0.5 mt-0.5">
                  <button
                    onClick={() => navigate('/customer/profile?tab=profile')}
                    className={`text-xs py-1.5 text-left border-none bg-transparent cursor-pointer transition-all ${
                      activeTab === 'hoso' ? 'text-[#ee4d2d] font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-[#ee4d2d]'
                    }`}
                  >
                    Hồ Sơ
                  </button>
                  <button
                    onClick={() => navigate('/customer/profile?tab=password')}
                    className={`text-xs py-1.5 text-left border-none bg-transparent cursor-pointer transition-all ${
                      activeTab === 'doimatkhau' ? 'text-[#ee4d2d] font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-[#ee4d2d]'
                    }`}
                  >
                    Đổi Mật Khẩu
                  </button>

                  <button
                    onClick={() => navigate('/customer/profile?tab=vehicles')}
                    className={`text-xs py-1.5 text-left border-none bg-transparent cursor-pointer transition-all ${
                      activeTab === 'xecuatoi' ? 'text-[#ee4d2d] font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-[#ee4d2d]'
                    }`}
                  >
                    Xe Của Tôi
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/customer/profile?tab=orders')}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-semibold border-none bg-transparent text-left cursor-pointer mt-1 transition-all ${
                activeTab === 'donmua' ? 'text-[#ee4d2d]' : 'text-slate-600 dark:text-slate-400 hover:text-[#ee4d2d]'
              }`}
            >
              <ListOrdered className="w-5 h-5 text-indigo-500" />
              <span>Đơn Đặt</span>
            </button>

            <button
              onClick={() => navigate('/customer/profile?tab=vouchers')}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-semibold border-none bg-transparent text-left cursor-pointer transition-all ${
                activeTab === 'khovoucher' ? 'text-[#ee4d2d]' : 'text-slate-600 dark:text-slate-400 hover:text-[#ee4d2d]'
              }`}
            >
              <Ticket className="w-5 h-5 text-amber-500" />
              <span>Kho Voucher</span>
            </button>

            <button
              onClick={() => navigate('/customer/profile?tab=rewards')}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-semibold border-none bg-transparent text-left cursor-pointer transition-all ${
                activeTab === 'diemthuong' ? 'text-[#ee4d2d]' : 'text-slate-600 dark:text-slate-400 hover:text-[#ee4d2d]'
              }`}
            >
              <Coins className="w-5 h-5 text-yellow-500" />
              <span>Điểm Thưởng</span>
            </button>
          </nav>
        </aside>

        {/* Right Main Content panel */}
        <main className="flex-1 bg-white dark:bg-slate-800 p-8 rounded-sm shadow-sm border border-slate-100 dark:border-slate-700 min-h-[550px]">
          
          {/* Tab 1: Profile Editor (Hồ sơ) */}
          {activeTab === 'hoso' && (
            <div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Hồ Sơ Của Tôi</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                {/* Form fields section */}
                <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col gap-6">
                  
                  {/* Tên */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <label htmlFor="fullName-input" className="w-32 text-sm text-slate-500 dark:text-slate-400 sm:text-right shrink-0">Tên</label>
                    {isEditingName ? (
                      <div className="flex-1 max-w-[550px] flex items-center gap-3">
                        <input 
                          type="text" 
                          id="fullName-input"
                          value={profile.fullName} 
                          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                          className="flex-1 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-red-500"
                          required
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditingName(false);
                            if (dbUser) setProfile(prev => ({ ...prev, fullName: dbUser.fullName || '' }));
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 max-w-[550px] flex items-center gap-3 py-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
                        <span>{profile.fullName || 'Chưa thiết lập'}</span>
                        <button 
                          type="button" 
                          onClick={() => setIsEditingName(true)}
                          className="text-xs text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Thay đổi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span className="w-32 text-sm text-slate-500 dark:text-slate-400 sm:text-right shrink-0">Email</span>
                    <div className="flex-1 max-w-[550px] py-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
                      <span>{profile.email}</span>
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span className="w-32 text-sm text-slate-500 dark:text-slate-400 sm:text-right shrink-0">Số điện thoại</span>
                    {isEditingPhone ? (
                      <div className="flex-1 max-w-[550px] flex items-center gap-3">
                        <input 
                          type="text" 
                          value={profile.phone} 
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="flex-1 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-red-500"
                          placeholder="Nhập số điện thoại"
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditingPhone(false);
                            if (dbUser) setProfile(prev => ({ ...prev, phone: dbUser.phone || '' }));
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 max-w-[550px] flex items-center gap-3 py-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
                        <span>{profile.phone || 'Chưa thiết lập'}</span>
                        <button 
                          type="button" 
                          onClick={() => setIsEditingPhone(true)}
                          className="text-xs text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Thay đổi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex sm:items-center gap-6 mt-4">
                    <span className="w-32 hidden sm:inline shrink-0"></span>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-[#ee4d2d] text-white hover:bg-[#d03d1e] px-7 py-2.5 rounded-sm font-medium text-sm transition-colors border-none cursor-pointer shadow-sm disabled:bg-slate-400"
                    >
                      {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>

                </form>

                {/* Avatar upload section */}
                <div className="w-full lg:w-[280px] shrink-0 lg:border-l border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 gap-4">
                  
                  {/* Circular Preview */}
                  <div 
                    className="w-36 h-36 rounded-full border-2 border-slate-100 shadow-inner bg-slate-50 overflow-hidden flex items-center justify-center relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-slate-300 fill-slate-100" />
                    )}
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Choose Image file input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                    accept=".jpg,.jpeg,.png"
                  />

                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-slate-300 dark:border-slate-600 rounded-sm text-xs font-semibold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all cursor-pointer"
                  >
                    Chọn Ảnh
                  </button>

                  <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                    Dụng lượng file tối đa 1 MB <br />
                    Định dạng: .JPEG, .PNG
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Change Password (Đổi mật khẩu) */}
          {activeTab === 'doimatkhau' && (
            <div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Thay Đổi Mật Khẩu</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
              </div>

              {passwordError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-5">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 p-3 rounded text-sm mb-5">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="max-w-[550px] flex flex-col gap-5 mt-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <label htmlFor="old-pass" className="w-44 text-sm text-slate-500 dark:text-slate-400 sm:text-right shrink-0">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    id="old-pass"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-red-500"
                    placeholder="Nhập mật khẩu cũ"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <label htmlFor="new-pass" className="w-44 text-sm text-slate-500 dark:text-slate-400 sm:text-right shrink-0">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    id="new-pass"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-red-500"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <label htmlFor="confirm-pass" className="w-44 text-sm text-slate-500 dark:text-slate-400 sm:text-right shrink-0">Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    id="confirm-pass"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-red-500"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div className="flex sm:items-center gap-6 mt-4">
                  <span className="w-44 hidden sm:inline shrink-0"></span>
                  <button 
                    type="submit"
                    className="bg-[#ee4d2d] text-white hover:bg-[#d03d1e] px-7 py-2.5 rounded-sm font-medium text-sm transition-colors border-none cursor-pointer shadow-sm"
                  >
                    Xác nhận
                  </button>
                </div>

              </form>
            </div>
          )}



          {activeTab === 'khovoucher' && dbUser && (
            <div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Kho Voucher & Đổi Thưởng</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Xem các mã ưu đãi của bạn và quy đổi voucher bằng điểm tích lũy</p>
              </div>
              <RewardsShop dbUser={dbUser} onRedeemSuccess={fetchUserData} />
            </div>
          )}

          {activeTab === 'xecuatoi' && dbUser && (
            <div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Xe Của Tôi</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Danh sách xe của bạn được kết nối với hệ thống đặt lịch</p>
              </div>
              <VehicleManager 
                userId={dbUser.id} 
                vehicles={vehicles} 
                onVehicleAdded={fetchUserData} 
              />
            </div>
          )}

          {activeTab === 'diemthuong' && dbUser && (
            <div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Điểm Thưởng Của Tôi</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Theo dõi điểm tích lũy và lịch sử biến động điểm cộng/trừ</p>
              </div>

              {/* Total points summary */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem' }}></div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block' }}>Số dư điểm hiện tại</span>
                  <strong style={{ fontSize: '1.75rem', color: 'var(--primary)', fontWeight: 900 }}>{dbUser.pointsBalance} <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>điểm</span></strong>
                </div>
              </div>

              {/* Points history table */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  LỊCH SỬ BIẾN ĐỘNG ĐIỂM
                </h3>
                <PointsHistoryTab pointsHistory={pointsHistory} />
              </div>
            </div>
          )}

          {activeTab === 'donmua' && dbUser && (
            <div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lịch Đặt Của Tôi</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Theo dõi danh sách các lịch đặt rửa xe của bạn tại AutoWash</p>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <BookingHistoryTab
                  bookings={bookings}
                  pointsHistory={pointsHistory}
                  onCancelBooking={handleCancelBooking}
                  recentlyUpdatedBookingId={recentlyUpdatedBookingId}
                  onRefresh={fetchUserData}
                />
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
