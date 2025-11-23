import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import technicalSupportService, { Chat, Message } from './services/technicalSupportService';
import authService from './authService';

export default function TechnicalManagerDashboard() {
  const navigate = useNavigate();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');

  // Load chats and request notification permission
  useEffect(() => {
    loadChats();

    // 🔔 Request notification permission on mount
    technicalSupportService.requestNotificationPermission();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadChats, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadChats = () => {
    const allChats = technicalSupportService.getChatsByCategory('TECHNICAL');
    setChats(allChats);

    // Update selected chat if it exists
    if (selectedChat) {
      const updated = allChats.find(c => c.id === selectedChat.id);
      if (updated) {
        setSelectedChat(updated);
        // Mark messages as read
        technicalSupportService.markMessagesAsRead(updated.id, 'TECHNICAL');
      }
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    technicalSupportService.markMessagesAsRead(chat.id, 'TECHNICAL');
    loadChats(); // Refresh to update unread counts
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);

    try {
      // Get the logged-in staff member's name
      const currentUser = authService.getCurrentUser();
      const senderName = currentUser?.name || 'Technical Manager';

      technicalSupportService.sendMessage(
        selectedChat.id,
        'TECHNICAL',
        senderName,
        newMessage.trim(),
        'TECHNICAL'
      );

      setNewMessage('');
      loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseChat = (chatId: string) => {
    if (window.confirm('Close this chat? Customer will still be able to send messages.')) {
      technicalSupportService.closeChat(chatId);
      loadChats();
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    }
  };

  const handleReopenChat = (chatId: string) => {
    technicalSupportService.reopenChat(chatId);
    loadChats();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
  };

  const filteredChats = chats.filter(chat => {
    if (filter === 'ALL') return true;
    return chat.status === filter;
  });

  const totalUnread = technicalSupportService.getTotalUnreadCount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🛠️ Technical Support Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  {totalUnread > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['ALL', 'OPEN', 'CLOSED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    filter === tab
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">

          {/* Chat List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg">Chats ({filteredChats.length})</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No {filter.toLowerCase()} chats</p>
                </div>
              ) : (
                filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                      selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {chat.customerName}
                        {chat.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          chat.status === 'OPEN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {chat.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-1">
                      {chat.vesselName} • {chat.bookingCode}
                    </div>

                    {chat.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {chat.lastMessage}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {formatTime(chat.lastMessageTime!)}
                        </span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedChat.customerName}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedChat.vesselName} • {selectedChat.bookingCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedChat.status === 'OPEN' ? (
                      <button
                        onClick={() => handleCloseChat(selectedChat.id)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Close Chat
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopenChat(selectedChat.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Reopen Chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedChat.messages.map(msg => {
                    const isTechnical = msg.sender === 'TECHNICAL';

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTechnical ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isTechnical
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {msg.senderName}
                            </span>
                            <span className={`text-xs ${isTechnical ? 'text-emerald-100' : 'text-gray-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString('el-GR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        disabled={sending || selectedChat.status === 'CLOSED'}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending || selectedChat.status === 'CLOSED'}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p>Select a chat to view messages</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
