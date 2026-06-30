import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config.js';

export default function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Xin chào! Tôi là **Trợ lý ảo AI** của **AutoWash Pro** 🧼🚗. Tôi có thể giải đáp nhanh thông tin dịch vụ, tích điểm, ưu đãi hội viên và đặt lịch. Bạn cần tôi hỗ trợ gì?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Drag to scroll suggestion panel
  const suggestionScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragged(false);
    setStartX(e.pageX - suggestionScrollRef.current.offsetLeft);
    setScrollLeft(suggestionScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - suggestionScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Tốc độ kéo
    if (Math.abs(x - startX) > 5) {
      setDragged(true);
    }
    suggestionScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Auto scroll to bottom when messages list changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const renderMessageText = (text) => {
    if (!text) return '';
    // Tách các từ nằm giữa dấu ** để bôi đậm
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ color: 'inherit', fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputText('');
    }

    const userMsgId = 'msg-' + Date.now();
    const newMessages = [...messages, { id: userMsgId, role: 'user', text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại gửi lên backend để AI giữ ngữ cảnh (tối đa 5 lượt tin nhắn gần nhất)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: chatHistory
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối chatbot.');
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'reply-' + Date.now(),
          role: 'assistant',
          text: data.response
        }
      ]);
    } catch (err) {
      console.error('Chat AI Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          text: '❌ Rất tiếc, đã có sự cố kết nối tới máy chủ AI. Xin bạn vui lòng thử lại sau.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Các câu hỏi gợi ý nhanh để người dùng/giáo viên test nhanh 1-click
  const QUICK_SUGGESTIONS = [
    { label: '💰 Báo giá dịch vụ', text: 'Giá các gói dịch vụ rửa xe như thế nào?' },
    { label: '📍 Địa chỉ chi nhánh', text: 'AutoWash Pro có các chi nhánh nào?' },
    { label: '🥈 Luật tích điểm & Hạng', text: 'Cách tích điểm và ưu đãi các hạng hội viên?' },
    { label: '🎟️ Hướng dẫn đổi voucher', text: 'Làm sao để đổi điểm lấy voucher giảm giá?' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999, fontFamily: 'var(--font-main, system-ui)' }}>
      
      {/* 1. Bong bóng chat nổi (Floating Trigger Button) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            border: 'none',
            color: '#ffffff',
            fontSize: '1.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px var(--primary-glow, rgba(2, 132, 199, 0.4))',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 10px 28px var(--primary-glow, rgba(2, 132, 199, 0.6))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px var(--primary-glow, rgba(2, 132, 199, 0.4))';
          }}
        >
          💬
        </button>
      )}

      {/* 2. Cửa sổ chat (Chat Window Popup) */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            width: '360px',
            height: '520px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.5px' }}>Trợ Lý AI - AutoWash</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.9 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  Đang trực tuyến
                </div>
              </div>
            </div>
            
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                opacity: 0.8,
                transition: 'opacity 0.2s',
                padding: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              ×
            </button>
          </div>

          {/* Vùng tin nhắn hiển thị */}
          <div
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: '#f8fafc'
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  {!isUser && (
                    <div style={{ fontSize: '1.1rem', marginTop: '2px' }}>🤖</div>
                  )}
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '0.65rem 0.9rem',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '2px 16px 16px 16px',
                      background: isUser ? 'var(--primary)' : '#ffffff',
                      color: isUser ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      boxShadow: isUser ? '0 2px 8px var(--primary-glow)' : '0 2px 6px rgba(0,0,0,0.03)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              );
            })}
            
            {/* Loader hiệu ứng đang gõ */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.1rem' }}>🤖</div>
                <div
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '2px 16px 16px 16px',
                    background: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}
                >
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Panel */}
          <div
            ref={suggestionScrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#f1f5f9',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.4rem',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none', // ẩn scrollbar ở firefox
              msOverflowStyle: 'none', // ẩn scrollbar ở IE
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <style>{`
              .quick-chip::-webkit-scrollbar {
                display: none; /* ẩn scrollbar ở chrome */
              }
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
              }
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            {QUICK_SUGGESTIONS.map((s, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  if (dragged) return;
                  handleSendMessage(s.text);
                }}
                disabled={isLoading}
                style={{
                  flex: '0 0 auto',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--secondary-glow, rgba(2, 132, 199, 0.04))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = '#ffffff';
                  }
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Form nhập dữ liệu & Send */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-color)',
              background: '#ffffff',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: '1px solid var(--border-color)',
                borderRadius: '24px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                border: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                borderRadius: '24px',
                cursor: 'pointer',
                boxShadow: inputText.trim() && !isLoading ? '0 2px 6px var(--primary-glow)' : 'none',
                opacity: (isLoading || !inputText.trim()) ? 0.5 : 1,
                transition: 'opacity 0.2s',
                outline: 'none'
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
