import React, { useState, useEffect, useRef } from 'react';
import technicalSupportService, { Message } from './services/technicalSupportService';

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global unread counter - always running even when chat is closed
  useEffect(() => {
    const updateUnreadCount = () => {
      let bookingCode = '';
      try {
        const currentBookingCode = localStorage.getItem('currentBooking');
        if (currentBookingCode) {
          const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
          if (bookings[currentBookingCode]?.bookingData) {
            bookingCode = currentBookingCode;
          }
        }
      } catch (e) {
        // Ignore error
      }

      if (!bookingCode) {
        const guestBookingCode = localStorage.getItem('guestBookingCode');
        if (guestBookingCode) {
          bookingCode = guestBookingCode;
        } else {
          bookingCode = 'GUEST-' + Date.now();
          localStorage.setItem('guestBookingCode', bookingCode);
        }
      }

      const allChats = technicalSupportService.getAllChats();
      const userChats = allChats.filter(c => c.bookingCode === bookingCode);

      let totalUnread = 0;
      userChats.forEach(chat => {
        const unread = chat.messages.filter(msg => msg.sender !== 'CUSTOMER' && !msg.read).length;
        totalUnread += unread;
      });

      setUnreadCount(totalUnread);
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 2000);
    return () => clearInterval(interval);
  }, []);

  // Smart deep linking - auto-open chat with unread messages
  useEffect(() => {
    if (!isOpen || selectedCategory) return;

    let bookingCode = '';
    try {
      const currentBookingCode = localStorage.getItem('currentBooking');
      if (currentBookingCode) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        if (bookings[currentBookingCode]?.bookingData) {
          bookingCode = currentBookingCode;
        }
      }
    } catch (e) {
      // Ignore error
    }

    if (!bookingCode) {
      const guestBookingCode = localStorage.getItem('guestBookingCode');
      if (guestBookingCode) {
        bookingCode = guestBookingCode;
      } else {
        bookingCode = 'GUEST-' + Date.now();
        localStorage.setItem('guestBookingCode', bookingCode);
      }
    }

    const allChats = technicalSupportService.getAllChats();
    const userChats = allChats.filter(c => c.bookingCode === bookingCode);

    const categoriesWithUnread: Array<'TECHNICAL' | 'FINANCIAL' | 'BOOKING'> = [];

    userChats.forEach(chat => {
      const hasUnread = chat.messages.some(msg => msg.sender !== 'CUSTOMER' && !msg.read);
      if (hasUnread && !categoriesWithUnread.includes(chat.category)) {
        categoriesWithUnread.push(chat.category);
      }
    });

    if (categoriesWithUnread.length === 1) {
      setSelectedCategory(categoriesWithUnread[0]);
    }
  }, [isOpen, selectedCategory]);

  // Initialize chat - only when category is selected
  useEffect(() => {
    if (!selectedCategory) return;

    let bookingCode = '';
    let vesselName = '';
    let finalCustomerName = 'Guest Customer';

    try {
      const currentBookingCode = localStorage.getItem('currentBooking');
      if (currentBookingCode) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        const booking = bookings[currentBookingCode];
        if (booking?.bookingData) {
          bookingCode = currentBookingCode;
          vesselName = booking.bookingData.vesselName || booking.bookingData.selectedVessel;
          finalCustomerName = `${booking.bookingData.skipperFirstName || ''} ${booking.bookingData.skipperLastName || ''}`.trim() || 'Guest Customer';
        }
      }
    } catch (e) {
      console.error('Error loading booking from localStorage:', e);
    }

    if (!bookingCode) {
      const guestBookingCode = localStorage.getItem('guestBookingCode');
      if (guestBookingCode) {
        bookingCode = guestBookingCode;
      } else {
        bookingCode = 'GUEST-' + Date.now();
        localStorage.setItem('guestBookingCode', bookingCode);
      }
      vesselName = 'General Inquiry';
    }

    setCustomerName(finalCustomerName);

    const allChats = technicalSupportService.getAllChats();
    let chat = allChats.find(c => c.bookingCode === bookingCode && c.category === selectedCategory);

    if (!chat) {
      chat = technicalSupportService.createChat(bookingCode, vesselName, finalCustomerName, selectedCategory);
    }

    setChatId(chat.id);
    setMessages(chat.messages);

    const unsubscribe = technicalSupportService.subscribeToChat(chat.id, (updatedMessages) => {
      setMessages(updatedMessages);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  // Mark messages as read when chat is opened and category is selected
  useEffect(() => {
    if (isOpen && chatId && selectedCategory) {
      technicalSupportService.markMessagesAsRead(chatId, 'CUSTOMER');

      const chat = technicalSupportService.getChatById(chatId);
      if (chat) {
        setMessages(chat.messages);
      }

      setTimeout(() => {
        let bookingCode = '';
        try {
          const currentBookingCode = localStorage.getItem('currentBooking');
          if (currentBookingCode) {
            const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
            if (bookings[currentBookingCode]?.bookingData) {
              bookingCode = currentBookingCode;
            }
          }
        } catch (e) {
          // Ignore
        }

        if (!bookingCode) {
          const guestBookingCode = localStorage.getItem('guestBookingCode');
          if (guestBookingCode) {
            bookingCode = guestBookingCode;
          }
        }

        const allChats = technicalSupportService.getAllChats();
        const userChats = allChats.filter(c => c.bookingCode === bookingCode);

        let totalUnread = 0;
        userChats.forEach(chat => {
          const unread = chat.messages.filter(msg => msg.sender !== 'CUSTOMER' && !msg.read).length;
          totalUnread += unread;
        });

        setUnreadCount(totalUnread);
      }, 100);
    }
  }, [isOpen, chatId, selectedCategory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || sending || !selectedCategory) return;

    setSending(true);

    try {
      const message = technicalSupportService.sendMessage(
        chatId,
        'CUSTOMER',
        customerName,
        newMessage.trim(),
        selectedCategory
      );

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // 🔥 FIX: Handle back button to return to category selector
  const handleBackToCategories = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('✅ Back button clicked - returning to category selector');
    
    // Reset all chat-related state
    setSelectedCategory(null);
    setMessages([]);
    setChatId(null);
    setNewMessage('');
    
    // Keep widget open, just show category selector
    // DON'T call setIsOpen(false)
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:from-emerald-600 hover:to-teal-700 transition-all hover:scale-110 flex items-center justify-center"
        style={{ transition: 'all 0.3s ease', zIndex: 9999 }}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
      </button>

      {/* Category Selector */}
      {isOpen && !selectedCategory && (
        <div
          className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl p-6"
          style={{
            animation: 'slideUp 0.3s ease-out',
            maxWidth: 'calc(100vw - 3rem)',
            zIndex: 9998
          }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Επιλέξτε Κατηγορία</h3>
          <p className="text-sm text-gray-600 mb-4">Με ποιον θέλετε να μιλήσετε;</p>

          <div className="space-y-3">
            <button
              onClick={() => setSelectedCategory('TECHNICAL')}
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl flex items-center gap-3 transition-all"
            >
              <span className="text-2xl">🔧</span>
              <div className="text-left">
                <div className="font-bold">Technical Manager</div>
                <div className="text-xs text-blue-100">Τεχνικά θέματα σκάφους</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedCategory('FINANCIAL')}
              className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl flex items-center gap-3 transition-all"
            >
              <span className="text-2xl">💰</span>
              <div className="text-left">
                <div className="font-bold">Financial Manager</div>
                <div className="text-xs text-green-100">Οικονομικά & Πληρωμές</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedCategory('BOOKING')}
              className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl flex items-center gap-3 transition-all"
            >
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <div className="font-bold">Booking Manager</div>
                <div className="text-xs text-purple-100">Κρατήσεις & Ημερομηνίες</div>
              </div>
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Ακύρωση
          </button>
        </div>
      )}

      {/* Chat Modal */}
      {isOpen && selectedCategory && (
        <div
          className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            animation: 'slideUp 0.3s ease-out',
            maxWidth: 'calc(100vw - 3rem)',
            maxHeight: 'calc(100vh - 8rem)',
            zIndex: 9998
          }}
        >
          {/* Chat Header */}
          <div
            className={`text-white p-4 flex items-center justify-between ${
              selectedCategory === 'TECHNICAL' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              selectedCategory === 'FINANCIAL' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* 🔥 FIXED BACK BUTTON */}
              <button
                onClick={handleBackToCategories}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                title="Αλλαγή Κατηγορίας"
                type="button"
              >
                ←
              </button>
              <span className="text-2xl">
                {selectedCategory === 'TECHNICAL' && '🔧'}
                {selectedCategory === 'FINANCIAL' && '💰'}
                {selectedCategory === 'BOOKING' && '📅'}
              </span>
              <div>
                <h3 className="font-bold text-lg">
                  {selectedCategory === 'TECHNICAL' && 'Technical Support'}
                  {selectedCategory === 'FINANCIAL' && 'Financial Support'}
                  {selectedCategory === 'BOOKING' && 'Booking Support'}
                </h3>
                <p className={`text-sm ${
                  selectedCategory === 'TECHNICAL' ? 'text-blue-100' :
                  selectedCategory === 'FINANCIAL' ? 'text-green-100' :
                  'text-purple-100'
                }`}>
                  {selectedCategory === 'TECHNICAL' && 'Τεχνικά θέματα'}
                  {selectedCategory === 'FINANCIAL' && 'Οικονομικά'}
                  {selectedCategory === 'BOOKING' && 'Κρατήσεις'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedCategory(null);
                setMessages([]);
                setChatId(null);
              }}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              type="button"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-slate-50 to-blue-50">
            {messages.length === 0 && (
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-sm text-gray-600">
                  Καλώς ήρθες! Πώς μπορώ να σε βοηθήσω;
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isCustomer = msg.sender === 'CUSTOMER';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isCustomer
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`font-semibold text-xs ${isCustomer ? 'text-white' : 'text-gray-900'}`}>
                        {msg.senderName}
                      </span>
                      <span className={`text-xs ${isCustomer ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm whitespace-pre-wrap break-words ${isCustomer ? 'text-white' : 'text-gray-800'}`}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Γράψε το μήνυμά σου..."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-sm bg-white"
                style={{
                  color: '#1f2937',
                  backgroundColor: '#ffffff'
                }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {sending ? '...' : '📤'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input::placeholder {
          color: #9ca3af !important;
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
