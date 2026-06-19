import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to automatically attach JWT token & handle forced logouts
const originalFetch = window.fetch;
window.fetch = async function (resource, options = {}) {
  const token = sessionStorage.getItem('autowash_token');
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  const response = await originalFetch(resource, options);

  if (response.status === 401) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data && data.error === "Tài khoản đã đăng nhập ở thiết bị khác.") {
        sessionStorage.removeItem('autowash_token');
        window.dispatchEvent(new CustomEvent('autowash_logout_forced', { detail: data.error }));
      }
    } catch (e) {
      // Ignore JSON parsing errors for non-JSON 401s
    }
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
