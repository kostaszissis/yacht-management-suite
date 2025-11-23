// technicalSupportService.ts - Complete Technical Support Service
// Handles multi-category chat system (TECHNICAL, FINANCIAL, BOOKING)
// with real-time updates, notifications, and localStorage persistence

export interface Message {
  id: string;
  chatId: string;
  sender: 'CUSTOMER' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
}

export interface Chat {
  id: string;
  bookingCode: string;
  vesselName: string;
  customerName: string;
  messages: Message[];
  createdAt: string;
  lastMessageAt: string;
  status: 'ACTIVE' | 'CLOSED';
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
}

type ChatSubscriber = (messages: Message[]) => void;

class TechnicalSupportService {
  private readonly STORAGE_KEY = 'technical_support_chats';
  private subscribers: Map<string, Set<ChatSubscriber>> = new Map();
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    // Initialize notification permission
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }

    // Start polling for changes from other tabs/windows
    this.startPolling();
  }

  // ==========================================
  // NOTIFICATION HANDLING
  // ==========================================

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    return false;
  }

  private playNotificationSound() {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create oscillator (beep sound)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound - pleasant notification tone
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      // Fade in/out for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      // Play
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // ==========================================
  // STORAGE OPERATIONS
  // ==========================================

  private getChats(): Chat[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const chats = JSON.parse(data);
      
      // Calculate unread count and last message for each chat
      return chats.map((chat: Chat) => {
        const unreadCount = chat.messages.filter(m => m.sender !== 'CUSTOMER' && !m.read).length;
        const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
        
        return {
          ...chat,
          unreadCount,
          lastMessage: lastMsg?.message || '',
          lastMessageTime: lastMsg?.timestamp || chat.lastMessageAt
        };
      });
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  }

  private saveChats(chats: Chat[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats));
      
      // Notify all subscribers about the change
      this.notifySubscribers();
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }

  // ==========================================
  // POLLING FOR REAL-TIME UPDATES
  // ==========================================

  private startPolling(): void {
    // Poll every 2 seconds for changes
    setInterval(() => {
      this.notifySubscribers();
    }, 2000);
  }

  private notifySubscribers(): void {
    const chats = this.getChats();
    
    this.subscribers.forEach((subscribers, chatId) => {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        subscribers.forEach(callback => {
          try {
            callback(chat.messages);
          } catch (error) {
            console.error('Error notifying subscriber:', error);
          }
        });
      }
    });
  }

  // ==========================================
  // CHAT OPERATIONS
  // ==========================================

  getAllChats(): Chat[] {
    return this.getChats();
  }

  getChatsByCategory(category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ALL'): Chat[] {
    const chats = this.getChats();
    if (category === 'ALL') {
      return chats;
    }
    return chats.filter(chat => chat.category === category);
  }

  getChatById(chatId: string): Chat | null {
    const chats = this.getChats();
    return chats.find(c => c.id === chatId) || null;
  }

  getChatByBookingCode(bookingCode: string): Chat | null {
    const chats = this.getChats();
    return chats.find(c => c.bookingCode === bookingCode) || null;
  }

  createChat(
    bookingCode: string, 
    vesselName: string, 
    customerName: string, 
    category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING'
  ): Chat {
    const chats = this.getChats();

    // Check if chat already exists for this booking + category
    const existingChat = chats.find(c => c.bookingCode === bookingCode && c.category === category);
    if (existingChat) {
      return existingChat;
    }

    const newChat: Chat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bookingCode,
      vesselName,
      customerName,
      messages: [],
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      status: 'ACTIVE',
      category,
      unreadCount: 0,
      lastMessage: '',
      lastMessageTime: new Date().toISOString()
    };

    chats.push(newChat);
    this.saveChats(chats);

    return newChat;
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  sendMessage(
    chatId: string,
    sender: 'CUSTOMER' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN',
    senderName: string,
    message: string,
    category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING'
  ): Message {
    // 🔍 DEBUG LOG - COMPREHENSIVE
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 INSIDE sendMessage (Service):');
    console.log('   Received chatId:', chatId);
    console.log('   Received sender:', sender);
    console.log('   Received senderName:', senderName);
    console.log('   Received message:', message);
    console.log('   Received category:', category);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) {
      console.error('❌ Chat not found:', chatId);
      throw new Error('Chat not found');
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      sender,
      senderName,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      category
    };

    console.log('🔍 Created message object:', JSON.stringify(newMessage, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    chats[chatIndex].messages.push(newMessage);
    chats[chatIndex].lastMessageAt = newMessage.timestamp;
    chats[chatIndex].lastMessage = message;
    chats[chatIndex].lastMessageTime = newMessage.timestamp;

    // Calculate unread count
    chats[chatIndex].unreadCount = chats[chatIndex].messages.filter(
      m => m.sender !== 'CUSTOMER' && !m.read
    ).length;

    this.saveChats(chats);

    // 🔊 ALWAYS play sound when a message is sent (both directions)
    this.playNotificationSound();

    // Show visual notification if message is from staff to customer
    if (sender !== 'CUSTOMER') {
      const categoryName = category === 'TECHNICAL' ? 'Technical' :
                          category === 'FINANCIAL' ? 'Financial' : 'Booking';

      // Only show visual notification (don't play sound again, already played above)
      if (this.notificationPermission === 'granted') {
        try {
          const icon = category === 'TECHNICAL' ? '🔧' : category === 'FINANCIAL' ? '💰' : '📅';

          new Notification(`${categoryName} Support`, {
            body: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">${icon}</text></svg>`,
            badge: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">${icon}</text></svg>`,
            tag: 'technical-support',
            requireInteraction: false
          });
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      }
    }

    return newMessage;
  }

  markMessagesAsRead(chatId: string, reader: 'CUSTOMER' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN'): void {
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) return;

    let changed = false;

    chats[chatIndex].messages = chats[chatIndex].messages.map(msg => {
      // Mark messages as read based on who is reading
      if (reader === 'CUSTOMER' && msg.sender !== 'CUSTOMER' && !msg.read) {
        changed = true;
        return { ...msg, read: true };
      }
      if (reader !== 'CUSTOMER' && msg.sender === 'CUSTOMER' && !msg.read) {
        changed = true;
        return { ...msg, read: true };
      }
      return msg;
    });

    // Recalculate unread count
    chats[chatIndex].unreadCount = chats[chatIndex].messages.filter(
      m => m.sender !== 'CUSTOMER' && !m.read
    ).length;

    if (changed) {
      this.saveChats(chats);
    }
  }

  // ==========================================
  // CHAT STATUS OPERATIONS
  // ==========================================

  closeChat(chatId: string): void {
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) return;

    chats[chatIndex].status = 'CLOSED';
    this.saveChats(chats);
  }

  reopenChat(chatId: string): void {
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) return;

    chats[chatIndex].status = 'ACTIVE';
    this.saveChats(chats);
  }

  // ==========================================
  // SUBSCRIPTION SYSTEM
  // ==========================================

  subscribeToChat(chatId: string, callback: ChatSubscriber): () => void {
    if (!this.subscribers.has(chatId)) {
      this.subscribers.set(chatId, new Set());
    }

    this.subscribers.get(chatId)!.add(callback);

    // Immediately call with current messages
    const chat = this.getChatById(chatId);
    if (chat) {
      callback(chat.messages);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(chatId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(chatId);
        }
      }
    };
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  getTotalUnreadCount(): number {
    const chats = this.getChats();
    return chats.reduce((total, chat) => {
      const unread = chat.messages.filter(m => m.sender === 'CUSTOMER' && !m.read).length;
      return total + unread;
    }, 0);
  }

  getUnreadCountByCategory(category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING'): number {
    const chats = this.getChatsByCategory(category);
    return chats.reduce((total, chat) => {
      const unread = chat.messages.filter(m => m.sender === 'CUSTOMER' && !m.read).length;
      return total + unread;
    }, 0);
  }

  // ==========================================
  // DEBUG & ADMIN FUNCTIONS
  // ==========================================

  clearAllChats(): void {
    if (window.confirm('⚠️ Are you sure you want to delete ALL chats? This cannot be undone!')) {
      localStorage.removeItem(this.STORAGE_KEY);
      this.subscribers.clear();
      console.log('✅ All chats cleared');
    }
  }

  exportChats(): string {
    const chats = this.getChats();
    return JSON.stringify(chats, null, 2);
  }

  importChats(jsonData: string): void {
    try {
      const chats = JSON.parse(jsonData);
      this.saveChats(chats);
      console.log('✅ Chats imported successfully');
    } catch (error) {
      console.error('❌ Error importing chats:', error);
      throw new Error('Invalid JSON data');
    }
  }
}

// Create and export singleton instance
const technicalSupportService = new TechnicalSupportService();
export default technicalSupportService;