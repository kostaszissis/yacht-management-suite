import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// API Base URL
const API_BASE = 'https://yachtmanagementsuite.com/api';

interface OwnerProfileData {
  ownerCode: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  taxId: string;
  address: string;
}

export default function OwnerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [ownerCode, setOwnerCode] = useState('');
  const [profile, setProfile] = useState<OwnerProfileData>({
    ownerCode: '',
    fullName: '',
    email: '',
    phone: '',
    company: '',
    taxId: '',
    address: ''
  });

  useEffect(() => {
    const code = location.state?.ownerCode;

    if (!code) {
      navigate('/');
      return;
    }

    setOwnerCode(code);
    setProfile(prev => ({ ...prev, ownerCode: code }));
    loadProfile(code);
  }, [location, navigate]);

  const loadProfile = async (code: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/owner-profile/${code}`);

      if (response.ok) {
        const data = await response.json();
        setProfile({
          ownerCode: code,
          fullName: data.fullName || data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          taxId: data.taxId || data.tax_id || '',
          address: data.address || ''
        });
        console.log('Profile loaded:', data);
      } else if (response.status === 404) {
        console.log('No profile found, starting fresh');
      } else {
        console.error('Error loading profile:', response.status);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile.email) {
      setMessage({ text: language === 'en' ? 'Email is required' : 'Το email eimai apoiteitai', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/owner-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerCode: profile.ownerCode,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          company: profile.company,
          taxId: profile.taxId,
          address: profile.address
        })
      });

      if (response.ok) {
        setMessage({
          text: language === 'en' ? 'Profile saved successfully!' : 'To profil apothikeuthike!',
          type: 'success'
        });
        console.log('Profile saved successfully');
      } else {
        const errorText = await response.text();
        console.error('Save error:', errorText);
        setMessage({
          text: language === 'en' ? 'Failed to save profile' : 'Apotihia apothikeysis',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({
        text: language === 'en' ? 'Network error - try again' : 'Sfalma diktiou',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof OwnerProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">

      {/* Header */}
      <header className="bg-slate-800 shadow-lg sticky top-0 z-50 border-b-2 border-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/owner-dashboard', { state: { ownerCode } })}
                className="text-3xl hover:scale-110 transition-transform"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {language === 'en' ? 'Profile Settings' : 'Rythmiseis Profil'}
                </h1>
                <p className="text-sm text-teal-300">
                  {language === 'en' ? 'Manage your account' : 'Diaheirisi logariamou'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-teal-500 text-white rounded-lg font-semibold">
                {ownerCode}
              </div>
              <button
                onClick={() => setLanguage(language === 'en' ? 'gr' : 'en')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
              >
                {language === 'en' ? 'GR' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Profile Icon */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-white">
            {language === 'en' ? 'Your Profile' : 'To Profil Sas'}
          </h2>
          <p className="text-teal-300 mt-2">
            {language === 'en'
              ? 'Set your email to receive charter notifications'
              : 'Orisete to email sas gia eidopoiiseis naulon'}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${
            message.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-teal-500/30">

          {/* Email - Required */}
          <div className="mb-6">
            <label className="block text-teal-300 font-semibold mb-2">
              {language === 'en' ? 'Email Address *' : 'Email *'}
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-slate-700 border-2 border-teal-500/50 rounded-lg text-white placeholder-gray-400 focus:border-teal-400 focus:outline-none transition-colors"
            />
            <p className="text-sm text-gray-400 mt-1">
              {language === 'en'
                ? 'Required for receiving charter notifications'
                : 'Apaiteitai gia tin lipsi eidopoiiseon'}
            </p>
          </div>

          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-teal-300 font-semibold mb-2">
              {language === 'en' ? 'Full Name' : 'Onoma'}
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder={language === 'en' ? 'John Doe' : 'Onoma Epitheto'}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="block text-teal-300 font-semibold mb-2">
              {language === 'en' ? 'Phone Number' : 'Tilefono'}
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+30 6971234567"
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Company */}
          <div className="mb-6">
            <label className="block text-teal-300 font-semibold mb-2">
              {language === 'en' ? 'Company Name (optional)' : 'Etaireia (proairetiko)'}
            </label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder={language === 'en' ? 'Company Ltd' : 'Etaireia EPE'}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Tax ID */}
          <div className="mb-6">
            <label className="block text-teal-300 font-semibold mb-2">
              {language === 'en' ? 'Tax ID (optional)' : 'AFM (proairetiko)'}
            </label>
            <input
              type="text"
              value={profile.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              placeholder="123456789"
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="block text-teal-300 font-semibold mb-2">
              {language === 'en' ? 'Address (optional)' : 'Dieuthinsi (proairetiko)'}
            </label>
            <textarea
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={language === 'en' ? 'Street, City, ZIP' : 'Odos, Poli, TK'}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              saving
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 hover:scale-[1.02]'
            } text-white shadow-lg`}
          >
            {saving
              ? (language === 'en' ? 'Saving...' : 'Apothikeyetai...')
              : (language === 'en' ? 'Save Profile' : 'Apothikeysi Profil')}
          </button>

        </div>

        {/* Info Box */}
        <div className="mt-6 bg-slate-800/50 border border-teal-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h4 className="text-white font-semibold">
                {language === 'en' ? 'Why set your email?' : 'Giati na orisete email?'}
              </h4>
              <p className="text-gray-400 text-sm mt-1">
                {language === 'en'
                  ? 'When your email is set, you will receive automatic notifications when new charter options are created, when reservations are confirmed, and other important updates about your vessels.'
                  : 'Otan orisete email, tha lamvanete eidopoiiseis gia nea naula, epivevaiosis kai alles enimeroseis.'}
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
