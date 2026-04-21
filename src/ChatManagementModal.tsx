import React, { useState, useEffect, useRef } from 'react';
import technicalSupportService, { Chat, Message } from './services/technicalSupportService';
import authService from './authService';

export default function ChatManagementModal({ onClose }: { onClose: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING'>('ALL');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 3000);
    return () => clearInterval(interval);
  }, [filterCategory]);

  // Request notification permission
  useEffect(() => {
    technicalSupportService.requestNotificationPermission();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const loadChats = () => {
    const allChats = technicalSupportService.getChatsByCategory(filterCategory);
    setChats(allChats.sort((a, b) => new Date(b.lastMessageTime || b.createdAt).getTime() - new Date(a.lastMessageTime || a.createdAt).getTime()));

    // Update selected chat if it exists
    if (selectedChat) {
      const updated = technicalSupportService.getChatById(selectedChat.id);
      if (updated) {
        setSelectedChat(updated);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = () => {
    if (!selectedChat || !replyMessage.trim()) return;

    // Get the current user's name from authService
    const currentUser = authService.getCurrentUser();
    const senderName = currentUser?.name || 'Administrator';

    // 🔍 DEBUG: Log sender info
    console.log('🔍 Admin sending message:', { currentUser, senderName });

    technicalSupportService.sendMessage(
      selectedChat.id,
      'ADMIN',
      senderName,  // ✅ Use actual user name instead of hardcoded 'Administrator'
      replyMessage.trim(),
      selectedChat.category
    );

    setReplyMessage('');
    loadChats();

    const updatedChat = technicalSupportService.getChatById(selectedChat.id);
    if (updatedChat) setSelectedChat(updatedChat);

    setTimeout(scrollToBottom, 100);
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    technicalSupportService.markMessagesAsRead(chat.id, 'ADMIN' as any);
    loadChats();
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'TECHNICAL': return '🔧';
      case 'FINANCIAL': return '💰';
      case 'BOOKING': return '📅';
      default: return '💬';
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'TECHNICAL': return 'from-blue-500 to-cyan-500';
      case 'FINANCIAL': return 'from-green-500 to-emerald-500';
      case 'BOOKING': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryName = (category: string) => {
    switch(category) {
      case 'TECHNICAL': return 'Technical';
      case 'FINANCIAL': return 'Financial';
      case 'BOOKING': return 'Booking';
      default: return 'Unknown';
    }
  };

  const technicalCount = technicalSupportService.getChatsByCategory('TECHNICAL').length;
  const financialCount = technicalSupportService.getChatsByCategory('FINANCIAL').length;
  const bookingCount = technicalSupportService.getChatsByCategory('BOOKING').length;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Chat Management</h2>
            <p className="text-sm text-blue-100">Διαχείριση όλων των συνομιλιών</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="p-4 bg-gray-50 border-b flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${filterCategory === 'ALL' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            📋 Όλα ({technicalCount + financialCount + bookingCount})
          </button>
          <button
            onClick={() => setFilterCategory('TECHNICAL')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${filterCategory === 'TECHNICAL' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            🔧 Technical ({technicalCount})
          </button>
          <button
            onClick={() => setFilterCategory('FINANCIAL')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${filterCategory === 'FINANCIAL' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            💰 Financial ({financialCount})
          </button>
          <button
            onClick={() => setFilterCategory('BOOKING')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${filterCategory === 'BOOKING' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            📅 Booking ({bookingCount})
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chats List */}
          <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>Δεν υπάρχουν συνομιλίες</p>
              </div>
            ) : (
              chats.map(chat => {
                const unreadCount = chat.messages.filter(m => m.sender === 'CUSTOMER' && !m.read).length;
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-4 text-left border-b hover:bg-white transition-all ${selectedChat?.id === chat.id ? 'bg-white border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getCategoryIcon(chat.category)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 truncate">{chat.customerName}</div>
                          <div className="text-xs text-gray-500 truncate">{chat.vesselName}</div>
                          {chat.lastMessage && (
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {chat.lastMessage.substring(0, 50)}{chat.lastMessage.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Chat View */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className={`bg-gradient-to-r ${getCategoryColor(selectedChat.category)} text-white p-4`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(selectedChat.category)}</span>
                    <div>
                      <div className="font-bold">{selectedChat.customerName}</div>
                      <div className="text-sm text-white/80">{selectedChat.vesselName} • {getCategoryName(selectedChat.category)}</div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-slate-50 to-blue-50">
                  {selectedChat.messages.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <div className="text-4xl mb-2">💬</div>
                      <p>Δεν υπάρχουν μηνύματα ακόμα</p>
                    </div>
                  ) : (
                    selectedChat.messages.map(msg => {
                      const isCustomer = msg.sender === 'CUSTOMER';
                      return (
                        <div key={msg.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isCustomer ? 'bg-white shadow-md text-gray-800' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`}>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-xs">{msg.senderName}</span>
                              <span className={`text-xs ${isCustomer ? 'text-gray-500' : 'text-blue-100'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="p-4 bg-white border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder="Γράψε την απάντησή σου..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      style={{
                        color: '#1f2937',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Αποστολή 📤
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p>Επιλέξτε μια συνομιλία για να την δείτε</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder styling */}
      <style>{`
        input::placeholder {
          color: #9ca3af !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
