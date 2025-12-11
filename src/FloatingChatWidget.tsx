import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  getChatMessages,
  getChatUnreadCount,
  createChat,
  sendChatMessage,
  markChatMessagesRead,
  ChatMessage
} from './services/apiService';
import { DataContext } from './App';

// Converted Message type for internal use (matching old interface)
interface Message {
  id: string;
  chatId: string;
  sender: 'CUSTOMER' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
}

// Convert API message to internal format
const convertApiMessage = (msg: ChatMessage): Message => ({
  id: String(msg.id || msg.chat_id + '-' + msg.timestamp),
  chatId: msg.chat_id,
  sender: msg.sender_role,
  senderName: msg.sender_name,
  message: msg.message,
  timestamp: msg.timestamp || new Date().toISOString(),
  read: msg.read_status === 1,
  category: msg.category
});

export default function FloatingChatWidget() {
  // Get context data (API is source of truth)
  const contextData = useContext(DataContext);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | null>(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Get booking info from context (API is source of truth)
  useEffect(() => {
    let code = '';
    let vessel = '';
    let name = 'Guest Customer';
    let visitor = true;

    // Try to get booking info from context
    const currentBookingCode = contextData?.bookingNumber || localStorage.getItem('currentBooking');
    if (currentBookingCode) {
      // Find booking in globalBookings from context
      const globalBookings = contextData?.globalBookings || [];
      const booking = globalBookings.find((b: any) =>
        b.bookingNumber === currentBookingCode || b.code === currentBookingCode
      ) || contextData?.data;

      if (booking) {
        code = currentBookingCode;
        vessel = booking.vesselName || booking.selectedVessel || '';
        name = `${booking.skipperFirstName || ''} ${booking.skipperLastName || ''}`.trim() || 'Guest Customer';
        visitor = false;
      }
    }

    // If no booking, create/get guest code
    if (!code) {
      const guestCode = localStorage.getItem('guestBookingCode');
      if (guestCode) {
        code = guestCode;
      } else {
        code = 'VISITOR-' + Date.now();
        localStorage.setItem('guestBookingCode', code);
      }
      vessel = 'General Inquiry';
      visitor = true;
    }

    setBookingCode(code);
    setVesselName(vessel);
    setCustomerName(name);
    setIsVisitor(visitor);
  }, [contextData?.bookingNumber, contextData?.globalBookings, contextData?.data]);

  // Global unread counter - polling every 30 seconds
  useEffect(() => {
    if (!bookingCode) return;

    const updateUnreadCount = async () => {
      try {
        const result = await getChatUnreadCount({ booking_code: bookingCode });
        if (result.success) {
          setUnreadCount(result.unread_count);
        }
      } catch (e) {
        console.error('Error fetching unread count:', e);
      }
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [bookingCode]);

  // Auto-select BOOKING category for visitors (no charter code)
  useEffect(() => {
    if (isOpen && isVisitor && !selectedCategory) {
      // Visitors auto-route to BOOKING manager
      setSelectedCategory('BOOKING');
    }
  }, [isOpen, isVisitor, selectedCategory]);

  // Initialize chat when category is selected
  useEffect(() => {
    if (!selectedCategory || !bookingCode) return;

    const initChat = async () => {
      setLoading(true);
      try {
        // Create or get existing chat
        const result = await createChat({
          booking_code: bookingCode,
          vessel_name: vesselName,
          customer_name: customerName,
          category: selectedCategory,
          is_visitor: isVisitor ? 1 : 0
        });

        if (result.success && result.chat) {
          setChatId(result.chat.chat_id);

          // Load messages
          const msgResult = await getChatMessages(result.chat.chat_id);
          if (msgResult.success) {
            setMessages(msgResult.messages.map(convertApiMessage));
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [selectedCategory, bookingCode, vesselName, customerName, isVisitor]);

  // Poll for new messages when chat is open (every 30 seconds)
  useEffect(() => {
    if (!isOpen || !chatId) return;

    const pollMessages = async () => {
      try {
        const result = await getChatMessages(chatId);
        if (result.success) {
          setMessages(result.messages.map(convertApiMessage));
        }
      } catch (e) {
        console.error('Error polling messages:', e);
      }
    };

    pollingRef.current = setInterval(pollMessages, 30000); // 30 seconds

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, chatId]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && chatId && selectedCategory) {
      markChatMessagesRead(chatId, 'CUSTOMER');

      // Update unread count
      setTimeout(async () => {
        const result = await getChatUnreadCount({ booking_code: bookingCode });
        if (result.success) {
          setUnreadCount(result.unread_count);
        }
      }, 500);
    }
  }, [isOpen, chatId, selectedCategory, bookingCode]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || sending || !selectedCategory) return;

    setSending(true);

    try {
      const result = await sendChatMessage({
        chat_id: chatId,
        booking_code: bookingCode,
        vessel_name: vesselName,
        customer_name: customerName,
        sender_id: bookingCode,
        sender_name: customerName,
        sender_role: 'CUSTOMER',
        recipient_role: selectedCategory, // Route to selected category manager
        category: selectedCategory,
        message: newMessage.trim(),
        is_visitor: isVisitor ? 1 : 0
      });

      if (result.success && result.message) {
        setMessages((prev: Message[]) => [...prev, convertApiMessage(result.message)]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Αποτυχία αποστολής. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSending(false);
    }
  };

  const handleBackToCategories = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset chat state
    setSelectedCategory(null);
    setMessages([]);
    setChatId(null);
    setNewMessage('');
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

      {/* Category Selector - Only for users WITH booking (non-visitors) */}
      {isOpen && !selectedCategory && !isVisitor && (
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
      {isOpen && (selectedCategory || isVisitor) && (
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
              isVisitor ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
              selectedCategory === 'TECHNICAL' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              selectedCategory === 'FINANCIAL' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Back button - only for non-visitors */}
              {!isVisitor && (
                <button
                  onClick={handleBackToCategories}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  title="Αλλαγή Κατηγορίας"
                  type="button"
                >
                  ←
                </button>
              )}
              <span className="text-2xl">
                {isVisitor && '📅'}
                {!isVisitor && selectedCategory === 'TECHNICAL' && '🔧'}
                {!isVisitor && selectedCategory === 'FINANCIAL' && '💰'}
                {!isVisitor && selectedCategory === 'BOOKING' && '📅'}
              </span>
              <div>
                <h3 className="font-bold text-lg">
                  {isVisitor && 'Επικοινωνία'}
                  {!isVisitor && selectedCategory === 'TECHNICAL' && 'Technical Support'}
                  {!isVisitor && selectedCategory === 'FINANCIAL' && 'Financial Support'}
                  {!isVisitor && selectedCategory === 'BOOKING' && 'Booking Support'}
                </h3>
                <p className={`text-sm ${
                  isVisitor ? 'text-purple-100' :
                  selectedCategory === 'TECHNICAL' ? 'text-blue-100' :
                  selectedCategory === 'FINANCIAL' ? 'text-green-100' :
                  'text-purple-100'
                }`}>
                  {isVisitor && 'Γενική ερώτηση'}
                  {!isVisitor && selectedCategory === 'TECHNICAL' && 'Τεχνικά θέματα'}
                  {!isVisitor && selectedCategory === 'FINANCIAL' && 'Οικονομικά'}
                  {!isVisitor && selectedCategory === 'BOOKING' && 'Κρατήσεις'}
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
            {loading && (
              <div className="text-center p-4">
                <div className="animate-spin text-4xl mb-2">⏳</div>
                <p className="text-sm text-gray-600">Φόρτωση...</p>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-sm text-gray-600">
                  {isVisitor
                    ? 'Καλώς ήρθατε! Πώς μπορούμε να σας βοηθήσουμε;'
                    : 'Καλώς ήρθες! Πώς μπορώ να σε βοηθήσω;'
                  }
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
                disabled={sending || loading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || loading}
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
