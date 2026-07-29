import React from 'react';

export default function BookingStep1({
  vehicles,
  selectedVehicle,
  setSelectedVehicle,
  packages,
  selectedPackage,
  setSelectedPackage,
  onOpenAddVehicle,
  nextStep,
  formatVnd,
  vehicleSelectRef
}) {
  return (
    <div>
      {/* Vehicle Selection */}
      <div className="form-group">
        <label>Chọn Xe Ô Tô Cần Rửa *</label>
        {vehicles.length === 0 ? (
          <div 
            ref={vehicleSelectRef}
            tabIndex={-1}
            style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center', outline: 'none' }}
          >
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Bạn chưa liên kết xe ô tô nào vào tài khoản.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenAddVehicle}>
              + Thêm xe ô tô mới
            </button>
          </div>
        ) : (
          <select
            ref={vehicleSelectRef}
            className="form-input"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            required
          >
            <option value="" disabled>-- Chọn xe --</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.licensePlate} - {v.brand} {v.model} ({v.color})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Package Selector */}
      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Chọn Gói Rửa Xe Chuyên Dụng *</label>
        <div className="packages-grid" style={{ marginTop: '0.85rem' }}>
          {packages.map((pkg, idx) => {
            const isSelected = selectedPackage === pkg.name;
            
            let badgeText = '';
            let badgeStyle = {};
            let cardStyle = {};
            let durationText = '';
            
            if (pkg.name === 'Express') {
              badgeText = 'Siêu Tốc';
              badgeStyle = { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
              durationText = '15-20 phút';
              if (isSelected) {
                cardStyle = { 
                  borderColor: '#10b981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
                  background: 'var(--secondary-glow)'
                };
              }
            } else if (pkg.name === 'Deluxe') {
              badgeText = 'Phổ Biến';
              badgeStyle = { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
              durationText = '30-40 phút';
              if (isSelected) {
                cardStyle = {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)',
                  background: 'var(--secondary-glow)'
                };
              }
            } else if (pkg.name === 'Premium Ultimate' || pkg.name?.includes('Ultimate')) {
              badgeText = 'Luxury';
              badgeStyle = { background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))', color: '#f59e0b', fontWeight: 800 };
              durationText = '45-60 phút';
              if (isSelected) {
                cardStyle = {
                  borderColor: '#f59e0b',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
                  background: 'var(--secondary-glow)'
                };
              }
            } else {
              badgeText = 'Khuyên Dùng';
              badgeStyle = { background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' };
              durationText = '30 phút';
              if (isSelected) {
                cardStyle = {
                  borderColor: '#6366f1',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
                  background: 'var(--secondary-glow)'
                };
              }
            }

            const showBanner = true;
            let bannerSrc = '';
            let hueRotate = 'none';

            // Nếu trong database gói rửa có cấu hình ảnh đại diện (custom image) thì sử dụng ảnh đó
            if (pkg.image) {
              bannerSrc = pkg.image;
            } else {
              // Ngược lại, tự động gán ảnh dựa trên thứ tự để không bị trùng
              if (idx === 0) {
                bannerSrc = '/express-pkg.jpg';
              } else if (idx === 1) {
                bannerSrc = '/deluxe-pkg.jpg';
              } else if (idx === 2) {
                bannerSrc = '/premium-pkg.jpg';
              } else {
                bannerSrc = '/premium-pkg.jpg';
                // Tự động xoay tông màu theo chỉ số để tạo sắc màu sơn xe độc nhất
                hueRotate = `hue-rotate(${(idx - 2) * 80}deg)`;
              }
            }

            return (
              <div
                key={pkg.id || pkg.name}
                className={`package-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPackage(pkg.name)}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '220px',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'scale(1.02)' : 'none',
                  borderWidth: '2px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Image Banner */}
                {showBanner && (
                  <div style={{ 
                    position: 'relative', 
                    height: '110px', 
                    width: 'calc(100% + 3rem)', 
                    margin: '-1.5rem -1.5rem 0.75rem -1.5rem', 
                    overflow: 'hidden' 
                  }}>
                    <img 
                      src={bannerSrc} 
                      alt={`Gói ${pkg.name}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: hueRotate
                      }} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 65%)'
                    }}></div>
                  </div>
                )}

                {/* Header Row: Badge & Duration */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  position: showBanner ? 'absolute' : 'relative',
                  top: showBanner ? '12px' : 'auto',
                  left: showBanner ? '16px' : 'auto',
                  right: showBanner ? '16px' : 'auto',
                  zIndex: 10
                }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: showBanner ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                    ...badgeStyle,
                    ...(showBanner ? { background: '#ffffff', color: '#1e293b' } : {})
                  }}>
                    {badgeText}
                  </span>
                  
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: showBanner ? '#ffffff' : 'var(--text-muted)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.2rem',
                    textShadow: showBanner ? '0 1px 3px rgba(0,0,0,0.8)' : 'none'
                  }}>
                    {durationText}
                  </span>
                </div>

                {/* Package Name & Description */}
                <div style={{ marginTop: showBanner ? '0.25rem' : '0.75rem', flexGrow: 1 }}>
                  <h4 style={{ 
                    color: 'var(--text-main)', 
                    fontSize: '1.2rem', 
                    fontWeight: 800,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    Gói {pkg.name}
                  </h4>
                  <p className="text-xs" style={{ 
                    margin: '0.5rem 0 0 0', 
                    color: 'var(--text-muted)',
                    lineHeight: '1.4'
                  }}>
                    {pkg.description}
                  </p>
                </div>

                {/* Price Row */}
                <div style={{ 
                  marginTop: '1.25rem', 
                  borderTop: '1px solid var(--border-color)', 
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Giá trọn gói</span>
                    <span style={{ 
                      fontSize: '1.35rem', 
                      fontWeight: 900, 
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      lineHeight: '1'
                    }}>
                      {formatVnd(pkg.price)}
                    </span>
                  </div>
                  
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                    {isSelected ? 'Đang chọn ✓' : 'Chọn gói ➔'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPackage && (() => {
        const currentPkg = packages.find(p => p.name === selectedPackage);
        if (!currentPkg) return null;
        
        const fallbackDetails = {
          'Express': [
            'Rửa vỏ xe siêu tốc bằng bọt tuyết chuyên dụng',
            'Xịt rửa gầm nhanh loại bỏ bùn đất',
            'Lau khô vỏ xe bằng khăn Microfiber chống xước',
            'Thổi bụi các kẽ cửa'
          ],
          'Deluxe': [
            'Rửa vỏ xe tiêu chuẩn 2 bước (Two-bucket method)',
            'Vệ sinh gầm xe chuyên dụng bằng vòi áp lực cao',
            'Hút bụi toàn bộ thảm sàn và ghế ngồi',
            'Lau chùi bụi mặt taplo, tapi cửa',
            'Lau sạch toàn bộ kính xe trong và ngoài',
            'Xịt nước hoa khử mùi cabin nhẹ nhàng'
          ],
          'Premium Ultimate': [
            'Rửa vỏ xe cao cấp kết hợp tẩy nhựa đường, chất bẩn cứng đầu',
            'Vệ sinh gầm xe chuyên sâu kết hợp hóa chất chống bám bụi',
            'Vệ sinh lồng dè, mâm lốp và dưỡng bóng lốp xe bảo vệ cao su',
            'Hút bụi chi tiết và lau sấy khử khuẩn toàn bộ nội thất cabin',
            'Dưỡng nhựa nhám và da nội thất bằng dung dịch chuyên dụng',
            'Vệ sinh khoang máy cơ bản bằng hơi nước/khí nén',
            'Xịt khử trùng Ozone diệt khuẩn và khử mùi toàn diện nội thất'
          ]
        };

        const displayDetails = (currentPkg.details && currentPkg.details.length > 0)
          ? currentPkg.details
          : (fallbackDetails[currentPkg.name] || []);

        return (
          <div 
            className="glass-panel" 
            style={{ 
              marginTop: '1.5rem', 
              padding: '1.25rem', 
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              animation: 'fade-in 0.3s ease'
            }}
          >
            <h5 style={{ 
              margin: '0 0 0.75rem 0', 
              color: 'var(--primary)', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              fontSize: '0.95rem'
            }}>
              Chi tiết dịch vụ gói {currentPkg.name}:
            </h5>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '0.5rem', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-main)'
            }}>
              {displayDetails.map((detail, idx) => (
                <li key={idx} style={{ listStyleType: 'none', display: 'flex', alignItems: 'start', gap: '0.4rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Tiếp Theo ➔
        </button>
      </div>
    </div>
  );
}
