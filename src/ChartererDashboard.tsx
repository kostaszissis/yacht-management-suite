import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ChartererDashboard() {
  const [language, setLanguage] = useState('en');
  const [charterData, setCharterData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get charter data from navigation state
    const data = location.state?.charterData;
    
    if (!data) {
      // If no data, redirect to home
      navigate('/');
      return;
    }
    
    setCharterData(data);
  }, [location, navigate]);

  if (!charterData) {
    return null;
  }

  const buttons = [
    {
      id: 'technical',
      icon: '🎥',
      title: language === 'en' ? 'Technical Guides' : 'Τεχνικοί Οδηγοί',
      color: 'from-purple-500 to-purple-700',
      action: () => {
        console.log('Technical guides - Coming soon');
        alert(language === 'en' ? 'Coming soon!' : 'Έρχεται σύντομα!');
      }
    },
    {
      id: 'agreement',
      icon: '📄',
      title: language === 'en' ? 'Charter Agreement' : 'Ναυλοσύμφωνο',
      color: 'from-green-500 to-emerald-700',
      action: () => {
        navigate('/charter-agreement', { 
          state: { bookingCode: charterData.bookingCode } 
        });
      }
    },
    {
      id: 'prefill',
      icon: '📋',
      title: language === 'en' ? 'Pre-Fill Details' : 'Συμπλήρωση Στοιχείων',
      color: 'from-orange-500 to-red-600',
      action: () => {
        // Check if it's check-in day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const checkInDate = new Date(charterData.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        
        if (today.getTime() === checkInDate.getTime()) {
          navigate('/page1', { state: { bookingCode: charterData.bookingCode } });
        } else {
          alert(language === 'en'
            ? 'Pre-Fill Details is only available on your check-in day!'
            : 'Η συμπλήρωση στοιχείων είναι διαθέσιμη μόνο την ημέρα επιβίβασης!');
        }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
      
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
                  {language === 'en' ? 'Charterer Portal' : 'Πύλη Ναυλωτή'}
                </h1>
                <p className="text-sm text-gray-600">
                  {charterData.vesselName}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setLanguage(language === 'en' ? 'gr' : 'en')}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold text-blue-900 transition-colors"
            >
              {language === 'en' ? '🇬🇷 GR' : '🇬🇧 EN'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Hero Image Section */}
        <div className="mb-8 relative rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=500&fit=crop" 
            alt="Yacht"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h2 className="text-3xl font-bold mb-2">
              {language === 'en' ? 'Welcome Aboard!' : 'Καλώς Ήρθατε!'}
            </h2>
            <p className="text-lg opacity-90">
              {charterData.vesselName}
            </p>
          </div>
        </div>

        {/* Charter Info */}
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-600 mb-2">
              {language === 'en' ? 'Your Charter' : 'Ο Ναύλος Σας'}
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-2">
              {charterData.bookingCode}
            </div>
            <div className="text-sm text-gray-600">
              📅 Check-in: {charterData.checkInDate}
            </div>
            <div className="text-sm text-gray-600">
              📅 Check-out: {charterData.checkOutDate}
            </div>
            
            {/* Status Indicator */}
            <div className="mt-4">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const checkInDate = new Date(charterData.checkInDate);
                checkInDate.setHours(0, 0, 0, 0);
                
                const checkOutDate = new Date(charterData.checkOutDate);
                checkOutDate.setHours(0, 0, 0, 0);
                
                if (today < checkInDate) {
                  return (
                    <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                      ⏳ {language === 'en' ? 'Upcoming Charter' : 'Επερχόμενος Ναύλος'}
                    </div>
                  );
                } else if (today.getTime() === checkInDate.getTime()) {
                  return (
                    <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold">
                      🎯 {language === 'en' ? 'Check-in Today!' : 'Επιβίβαση Σήμερα!'}
                    </div>
                  );
                } else if (today > checkInDate && today < checkOutDate) {
                  return (
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                      ✅ {language === 'en' ? 'Charter Active' : 'Ναύλος Ενεργός'}
                    </div>
                  );
                } else if (today.getTime() === checkOutDate.getTime()) {
                  return (
                    <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold">
                      🎯 {language === 'en' ? 'Check-out Today!' : 'Αποβίβαση Σήμερα!'}
                    </div>
                  );
                } else {
                  return (
                    <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold">
                      🔒 {language === 'en' ? 'Charter Completed' : 'Ναύλος Ολοκληρώθηκε'}
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>

        {/* Available Actions */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            {language === 'en' ? 'Available Services' : 'Διαθέσιμες Υπηρεσίες'}
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {buttons.map((button) => (
              <button
                key={button.id}
                onClick={button.action}
                className={`bg-gradient-to-br ${button.color} text-white rounded-2xl p-6 shadow-xl transition-all duration-300 flex items-center justify-center space-x-4 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transform-gpu`}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <div className="text-5xl">{button.icon}</div>
                <div className="text-center font-bold text-xl leading-tight">
                  {button.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">💡</div>
          <p className="text-sm text-yellow-800 font-semibold">
            {language === 'en' 
              ? 'Pre-Fill Details is only available on your check-in day' 
              : 'Η συμπλήρωση στοιχείων είναι διαθέσιμη μόνο την ημέρα επιβίβασης'}
          </p>
        </div>

      </main>

    </div>
  );
}
