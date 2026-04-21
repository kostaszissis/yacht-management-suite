import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  createdAt: string;
}

// EMPLOYEE_CODES removed - now using authService

export default function CompanyNews() {
  const [language, setLanguage] = useState('en');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  
  const [newNewsItem, setNewNewsItem] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const navigate = useNavigate();

  // Load news from localStorage
  useEffect(() => {
    const savedNews = localStorage.getItem('app_company_news');
    if (savedNews) {
      setNews(JSON.parse(savedNews));
    }
  }, []);

  // Save news to localStorage
  const saveNews = (newsItems: NewsItem[]) => {
    localStorage.setItem('app_company_news', JSON.stringify(newsItems));
    setNews(newsItems);
  };

  // Admin login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user = authService.login(adminPassword);

    if (user) {
      setCurrentEmployee(user.permissions);
      setIsAdmin(user.role === 'ADMIN');
      setShowLoginModal(false);
      setAdminPassword('');
    } else {
      alert(language === 'en' ? 'Wrong code!' : 'Λάθος κωδικός!');
      setAdminPassword('');
    }
  };

  // Add news
  const handleAddNews = () => {
    if (!newNewsItem.title || !newNewsItem.description) {
      alert(language === 'en' ? 'Please fill all fields!' : 'Παρακαλώ συμπληρώστε όλα τα πεδία!');
      return;
    }

    const newsItem: NewsItem = {
      id: Date.now().toString(),
      title: newNewsItem.title,
      description: newNewsItem.description,
      date: newNewsItem.date,
      createdAt: new Date().toISOString()
    };

    const updatedNews = [newsItem, ...news];
    saveNews(updatedNews);
    
    setNewNewsItem({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    
    setShowAddModal(false);
  };

  // Delete news
  const handleDeleteNews = (id: string) => {
    if (window.confirm(language === 'en' ? 'Delete this news item?' : 'Διαγραφή αυτού του νέου;')) {
      const updatedNews = news.filter(item => item.id !== id);
      saveNews(updatedNews);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200">
      
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="text-3xl hover:scale-110 transition-transform"
              >
                🏠
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'en' ? 'Company Newsletter' : 'Newsletter Εταιρίας'}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Latest News & Updates' : 'Τελευταία Νέα & Ενημερώσεις'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && currentEmployee && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  ➕ {language === 'en' ? 'Add News' : 'Προσθήκη Νέου'}
                </button>
              )}
              
              {!isAdmin && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  🔐 {language === 'en' ? 'Admin Login' : 'Σύνδεση Διαχειριστή'}
                </button>
              )}
              
              <button
                onClick={() => setLanguage(language === 'en' ? 'gr' : 'en')}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold text-blue-900 transition-colors"
              >
                {language === 'en' ? '🇬🇷 GR' : '🇬🇧 EN'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Stay Updated!' : 'Μείνετε Ενημερωμένοι!'}
          </h2>
          <p className="text-lg text-gray-600">
            {language === 'en' 
              ? 'Latest news, announcements, and special offers' 
              : 'Τελευταία νέα, ανακοινώσεις και ειδικές προσφορές'}
          </p>
        </div>

        {/* News List */}
        {news.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              {language === 'en' ? 'No News Yet' : 'Δεν Υπάρχουν Νέα Ακόμα'}
            </h3>
            <p className="text-gray-500">
              {language === 'en' 
                ? 'Check back soon for updates!' 
                : 'Ελέγξτε ξανά σύντομα για ενημερώσεις!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] p-6 transform-gpu"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📌</span>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>📅 {item.date}</span>
                      <span>🕒 {new Date(item.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {isAdmin && currentEmployee?.canEdit && (
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                    >
                      🗑️ {language === 'en' ? 'Delete' : 'Διαγραφή'}
                    </button>
                  )}
                </div>
                
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Admin Access' : 'Πρόσβαση Διαχειριστή'}
              </h3>
            </div>
            
            <form onSubmit={handleAdminLogin}>
              <div className="relative w-full mb-4">
                <input
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Admin Code' : 'Κωδικός Διαχειριστή'}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-xl text-gray-600 hover:text-indigo-600"
                >
                  {showAdminPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700 transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'Ακύρωση'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all"
                >
                  {language === 'en' ? 'Login' : 'Είσοδος'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add News Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Add News' : 'Προσθήκη Νέου'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'en' ? 'Title' : 'Τίτλος'}
                </label>
                <input
                  type="text"
                  value={newNewsItem.title}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, title: e.target.value })}
                  placeholder={language === 'en' ? 'e.g., New Vessel Added!' : 'π.χ., Νέο Σκάφος Προστέθηκε!'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'en' ? 'Date' : 'Ημερομηνία'}
                </label>
                <input
                  type="date"
                  value={newNewsItem.date}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'en' ? 'Description' : 'Περιγραφή'}
                </label>
                <textarea
                  value={newNewsItem.description}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, description: e.target.value })}
                  placeholder={language === 'en' 
                    ? 'Enter news description...' 
                    : 'Εισάγετε περιγραφή νέου...'}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-lg resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewNewsItem({
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Ακύρωση'}
              </button>
              <button
                onClick={handleAddNews}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all"
              >
                {language === 'en' ? 'Add News' : 'Προσθήκη'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
