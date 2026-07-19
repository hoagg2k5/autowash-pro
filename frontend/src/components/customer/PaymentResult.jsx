import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function PaymentResult({ user }) {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const navigate = useNavigate();
  const verifiedRef = useRef(false);

  useEffect(() => {
    // Prevent double invocation in React StrictMode
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verifyPayment = async () => {
      try {
        const queryParamsString = searchParams.toString();
        const response = await fetch(`${API_BASE_URL}/api/bookings/vnpay-verify?${queryParamsString}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Xác nhận giao dịch thanh toán thất bại.');
        }

        setPaymentInfo(data.booking);
        toast.success('Thanh toán đơn hàng thành công!');
        
        // Auto-redirect to dashboard after 5 seconds
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 5000);

      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      background: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.05), transparent 40%)',
      padding: '2rem'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '3rem 2.5rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid var(--border-color)',
              borderTop: '4px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
              Đang Xác Minh Giao Dịch
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
              Hệ thống đang kết nối trực tiếp với cổng thanh toán VNPay để cập nhật trạng thái đơn đặt lịch. Vui lòng không đóng cửa sổ này...
            </p>
          </div>
        )}

        {!loading && error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px solid #fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>
              ❌
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#dc2626', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0 }}>
              Thanh Toán Không Thành Công
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
              {error}
            </p>
            <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => navigate('/customer/dashboard')}
                className="btn btn-primary"
                style={{ width: '100%', py: '0.75rem', fontWeight: 'bold' }}
              >
                Quay lại Trang Chủ
              </button>
            </div>
          </div>
        )}

        {!loading && !error && paymentInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#ecfdf5',
              border: '2px solid #d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: '#10b981',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#10b981', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: 0 }}>
              Thanh Toán Thành Công!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-0.5rem' }}>
              Mã giao dịch VNPay: <strong style={{ color: 'var(--text-main)' }}>{searchParams.get('vnp_TransactionNo')}</strong>
            </p>

            <div style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã lịch hẹn:</span>
                <strong style={{ color: 'var(--text-main)' }}>{paymentInfo.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gói dịch vụ:</span>
                <strong style={{ color: 'var(--text-main)' }}>{paymentInfo.servicePackage}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian hẹn:</span>
                <strong style={{ color: 'var(--text-main)' }}>{paymentInfo.bookingDate} ({paymentInfo.timeSlot})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chi nhánh:</span>
                <strong style={{ color: 'var(--text-main)' }}>{paymentInfo.branch}</strong>
              </div>
              <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Số tiền đã thanh toán:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{formatVnd(paymentInfo.totalPaid)}</strong>
              </div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px dashed rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#065f46',
              marginTop: '0.5rem',
              lineHeight: 1.4
            }}>
              🎉 Lịch hẹn của bạn đã được xác nhận tự động. Vui lòng đến đúng giờ để được phục vụ tốt nhất.
            </div>

            <button
              type="button"
              onClick={() => navigate('/customer/dashboard')}
              className="btn btn-primary"
              style={{ width: '100%', py: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              Về Trang Dashboard Ngay
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tự động chuyển hướng sau 5 giây...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
