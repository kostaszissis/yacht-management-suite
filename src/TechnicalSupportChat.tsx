import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import technicalSupportService, { Message } from './services/technicalSupportService';

export default function TechnicalSupportChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { bookingCode, vesselName, customerName } = location.state || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [finalCustomerName, setFinalCustomerName] = useState('');

  // Initialize or load chat
  useEffect(() => {
    // 🔧 Allow chat even without booking code (use "GUEST" as fallback)
    const finalBookingCode = bookingCode || 'GUEST-' + Date.now();
    const finalVesselName = vesselName || 'General Inquiry';
    const finalName = customerName || 'Guest Customer';
    setFinalCustomerName(finalName);

    // Get or create chat
    let chat = technicalSupportService.getChatByBookingCode(finalBookingCode);
    if (!chat) {
      chat = technicalSupportService.createChat(finalBookingCode, finalVesselName, finalName);
    }

    setChatId(chat.id);
    setMessages(chat.messages);

    // Mark messages as read
    technicalSupportService.markMessagesAsRead(chat.id, 'CUSTOMER');

    // Subscribe to updates
    const unsubscribe = technicalSupportService.subscribeToChat(chat.id, (updatedMessages) => {
      setMessages(updatedMessages);
      // Mark new messages as read
      technicalSupportService.markMessagesAsRead(chat.id, 'CUSTOMER');
      // Scroll to bottom
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [bookingCode, vesselName, customerName, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || sending) return;

    setSending(true);

    try {
      const message = technicalSupportService.sendMessage(
        chatId,
        'CUSTOMER',
        finalCustomerName,
        newMessage.trim()
      );

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex flex-col">

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              ←
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">💬 Technical Support Chat</h1>
              <p className="text-sm text-gray-600">
                {vesselName && `${vesselName} - `}
                {bookingCode}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Welcome Message */}
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <div className="text-4xl mb-2">👋</div>
            <p className="text-sm text-gray-600">
              Welcome to Technical Support! Our team will respond as soon as possible.
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isCustomer = msg.sender === 'CUSTOMER';

            return (
              <div
                key={msg.id}
                className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    isCustomer
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {msg.senderName}
                    </span>
                    <span className={`text-xs ${isCustomer ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
