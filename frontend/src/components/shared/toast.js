// Custom Toast Notification System for AutoWash Pro
// Pure DOM-based for compatibility and zero dependencies in React 19

export const toast = {
  show: (message, type = 'info', duration = 4000) => {
    // 1. Ensure the toast container exists in the document body
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      // Basic container layout styles
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '99999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '0.75rem';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    // 2. Inject slide-in animation styles if not already present
    if (!document.getElementById('toast-animation-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'toast-animation-styles';
      styleEl.textContent = `
        @keyframes toast-slide-in {
          0% { opacity: 0; transform: translateY(24px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-active {
          animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // 3. Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = 'toast-active';
    toastEl.style.pointerEvents = 'auto';
    toastEl.style.display = 'flex';
    toastEl.style.alignItems = 'center';
    toastEl.style.gap = '0.85rem';
    toastEl.style.width = '350px';
    toastEl.style.maxWidth = '90vw';
    toastEl.style.padding = '1rem 1.25rem';
    toastEl.style.borderRadius = '12px';
    toastEl.style.color = '#ffffff';
    toastEl.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 5px 15px -5px rgba(0, 0, 0, 0.05)';
    toastEl.style.backdropFilter = 'blur(16px)';
    toastEl.style.webkitBackdropFilter = 'blur(16px)';
    toastEl.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    toastEl.style.fontFamily = 'var(--font-main, "Outfit", "Inter", sans-serif)';
    toastEl.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    // Set gradients and icons based on type
    let bgGradient = '';
    let icon = '';
    let titleText = '';

    switch (type) {
      case 'success':
        bgGradient = 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))';
        icon = '✨';
        titleText = 'Thành công';
        break;
      case 'error':
        bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))';
        icon = '❌';
        titleText = 'Lỗi hệ thống';
        break;
      case 'warning':
        bgGradient = 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))';
        icon = '⚠️';
        titleText = 'Cảnh báo';
        break;
      case 'info':
      default:
        bgGradient = 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(3, 105, 161, 0.95))';
        icon = '🔔';
        titleText = 'Thông báo';
        break;
    }

    toastEl.style.background = bgGradient;

    toastEl.innerHTML = `
      <span style="font-size: 1.5rem; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">${icon}</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.15rem; letter-spacing: 0.05em; text-transform: uppercase;">
          ${titleText}
        </div>
        <div style="font-size: 0.8rem; line-height: 1.4; font-weight: 500; opacity: 0.95;">${message}</div>
      </div>
      <button style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 1.25rem; font-weight: 600; padding: 0 0 0 0.5rem; line-height: 1; align-self: center; display: flex; align-items: center;" onclick="this.parentElement.style.opacity='0'; this.parentElement.style.transform='translateY(12px) scale(0.95)'; setTimeout(() => { this.parentElement.remove(); }, 350)">×</button>
    `;

    container.appendChild(toastEl);

    // 4. Auto-remove after duration
    const timer = setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => {
        toastEl.remove();
      }, 350);
    }, duration);

    // Let manual click cancel the auto-remove timer
    toastEl.querySelector('button').addEventListener('click', () => {
      clearTimeout(timer);
    });
  },
  success: (msg, duration) => toast.show(msg, 'success', duration),
  error: (msg, duration) => toast.show(msg, 'error', duration),
  warning: (msg, duration) => toast.show(msg, 'warning', duration),
  info: (msg, duration) => toast.show(msg, 'info', duration)
};
