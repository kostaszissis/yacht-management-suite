import React from 'react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-900 text-white rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📖 Οδηγίες Χρήσης / User Guide
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* Installation Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
              ΕΓΚΑΤΑΣΤΑΣΗ ΕΦΑΡΜΟΓΗΣ / APP INSTALLATION
            </h2>
            <p className="text-gray-600 mb-4">
              Η εφαρμογή λειτουργεί ως PWA (Progressive Web App) και μπορεί να εγκατασταθεί σε οποιαδήποτε συσκευή.
            </p>

            {/* Mobile */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                📱 ΚΙΝΗΤΟ (MOBILE PHONE)
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-gray-800 mb-2">iPhone (iOS)</h4>
                  <p className="text-red-600 font-semibold text-sm mb-2">⚠️ ΜΟΝΟ Safari!</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Ανοίξτε το <strong>Safari</strong></li>
                    <li>Πηγαίνετε στο: yachtmanagementsuite.com</li>
                    <li>Πατήστε το κουμπί <strong>Κοινοποίηση</strong> (↑)</li>
                    <li>Επιλέξτε <strong>"Προσθήκη στην οθόνη Αφετηρίας"</strong></li>
                    <li>Πατήστε <strong>"Προσθήκη"</strong></li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-gray-800 mb-2">Android Phone</h4>
                  <p className="text-blue-600 font-semibold text-sm mb-2">Χρησιμοποιήστε Chrome</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Ανοίξτε το <strong>Chrome</strong></li>
                    <li>Πηγαίνετε στο: yachtmanagementsuite.com</li>
                    <li>Θα εμφανιστεί banner εγκατάστασης</li>
                    <li>Ή: Πατήστε ⋮ → <strong>"Εγκατάσταση εφαρμογής"</strong></li>
                    <li>Πατήστε <strong>"Εγκατάσταση"</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Tablet */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                📱 TABLET
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-gray-800 mb-2">iPad</h4>
                  <p className="text-red-600 font-semibold text-sm mb-2">⚠️ ΜΟΝΟ Safari!</p>
                  <p className="text-sm text-gray-600">Ίδια διαδικασία με iPhone</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-gray-800 mb-2">Android Tablet</h4>
                  <p className="text-blue-600 font-semibold text-sm mb-2">Χρησιμοποιήστε Chrome</p>
                  <p className="text-sm text-gray-600">Ίδια διαδικασία με Android Phone</p>
                </div>
              </div>
            </div>

            {/* Desktop */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                💻 ΥΠΟΛΟΓΙΣΤΗΣ / LAPTOP
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-gray-800 mb-2">Windows</h4>
                  <p className="text-blue-600 font-semibold text-sm mb-2">Chrome ή Edge</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Ανοίξτε Chrome/Edge</li>
                    <li>Πηγαίνετε στο: yachtmanagementsuite.com</li>
                    <li>Κλικ στο εικονίδιο εγκατάστασης (⊕) στη γραμμή διευθύνσεων</li>
                    <li>Πατήστε <strong>"Εγκατάσταση"</strong></li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-gray-800 mb-2">Mac</h4>
                  <p className="text-blue-600 font-semibold text-sm mb-2">Chrome ή Edge</p>
                  <p className="text-sm text-gray-600">Ίδια διαδικασία με Windows</p>
                </div>
              </div>
            </div>
          </section>

          {/* Owner Guide Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
              ΟΔΗΓΙΕΣ ΓΙΑ ΠΛΟΙΟΚΤΗΤΕΣ - ΑΠΟΔΟΧΗ ΝΑΥΛΟΥ
            </h2>

            {/* Step 1 */}
            <div className="mb-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-900 mb-2">ΒΗΜΑ 1: ΣΥΝΔΕΣΗ / LOGIN</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Ανοίξτε την εφαρμογή</li>
                <li>Εισάγετε τον <strong>κωδικό πλοιοκτήτη</strong> (π.χ. X2025, Y2025)</li>
                <li>Πατήστε <strong>"ΕΙΣΟΔΟΣ"</strong></li>
                <li>Θα δείτε <strong>ΜΟΝΟ τα δικά σας σκάφη</strong></li>
              </ol>
            </div>

            {/* Step 2 */}
            <div className="mb-4 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-2">ΒΗΜΑ 2: ΕΙΔΟΠΟΙΗΣΗ ΝΕΟΥ ΝΑΥΛΟΥ</h3>
              <p className="text-sm text-gray-700 mb-2">Όταν υπάρχει νέο αίτημα ναύλου:</p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Θα δείτε ειδοποίηση στο dashboard</li>
                <li>Κατάσταση: <span className="bg-yellow-200 px-2 py-0.5 rounded font-semibold">OPTION</span> 🟡</li>
                <li>Βλέπετε: Ημερομηνίες, Ποσό, Πελάτη</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="mb-4 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
              <h3 className="font-bold text-gray-800 mb-2">ΒΗΜΑ 3: ΕΛΕΓΧΟΣ ΣΤΟΙΧΕΙΩΝ</h3>
              <p className="text-sm text-gray-700 mb-2">Πριν αποδεχτείτε, ελέγξτε:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>📅 Ημερομηνίες</div>
                <div>💶 Ποσό Ναύλου</div>
                <div>💵 Προμήθεια</div>
                <div>👤 Στοιχεία Πελάτη</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="mb-4 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-bold text-green-800 mb-2">ΒΗΜΑ 4: ΑΠΟΔΟΧΗ Ή ΑΠΟΡΡΙΨΗ</h3>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">ΑΠΟΔΟΧΗ</span>
                  <span className="text-sm text-gray-600">→ Αποδέχεστε</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">ΑΠΟΡΡΙΨΗ</span>
                  <span className="text-sm text-gray-600">→ Απορρίπτετε</span>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="mb-4 bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h3 className="font-bold text-orange-800 mb-2">ΒΗΜΑ 5: ΜΕΤΑ ΤΗΝ ΑΠΟΔΟΧΗ</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Κατάσταση → <span className="bg-yellow-200 px-2 py-0.5 rounded font-semibold">OPTION ACCEPTED</span></li>
                <li>Ο διαχειριστής λαμβάνει ειδοποίηση</li>
                <li>Περιμένετε την τελική επιβεβαίωση</li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="mb-4 bg-green-100 p-4 rounded-lg border-l-4 border-green-600">
              <h3 className="font-bold text-green-900 mb-2">ΒΗΜΑ 6: ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>1. Διαχειριστής πατάει <strong>"ΚΛΕΙΣΙΜΟ OPTION"</strong> → RESERVATION 🟡</p>
                <p>2. Εσείς επιβεβαιώνετε ξανά</p>
                <p>3. Τελική κατάσταση → <span className="bg-green-500 text-white px-2 py-0.5 rounded font-semibold">CONFIRMED</span> 🟢</p>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
              ΣΗΜΑΝΤΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">✅ ΤΙ ΜΠΟΡΕΙΤΕ:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Βλέπετε ΜΟΝΟ τα δικά σας σκάφη</li>
                  <li>• Αποδέχεστε/απορρίπτετε options</li>
                  <li>• Βλέπετε ιστορικό κρατήσεων</li>
                  <li>• Λαμβάνετε email ειδοποιήσεις</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-800 mb-2">❌ ΤΙ ΔΕΝ ΜΠΟΡΕΙΤΕ:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Βλέπετε σκάφη άλλων</li>
                  <li>• Αλλάζετε στοιχεία κράτησης</li>
                  <li>• Ακυρώνετε confirmed κράτηση</li>
                  <li>• Δημιουργείτε νέες κρατήσεις</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ ΠΡΟΣΟΧΗ:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Μπορείτε να απορρίψετε <strong>ΜΟΝΟ στο στάδιο Option</strong></li>
                <li>• Μόλις γίνει Confirmed, η κράτηση είναι δεσμευτική</li>
                <li>• Για αλλαγές επικοινωνήστε με τον διαχειριστή</li>
              </ul>
            </div>
          </section>

          {/* Status Colors */}
          <section>
            <h2 className="text-2xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">
              ΕΠΕΞΗΓΗΣΗ ΧΡΩΜΑΤΩΝ / STATUS COLORS
            </h2>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-yellow-400 rounded-full"></span>
                <span className="font-semibold">OPTION</span>
                <span className="text-gray-600 text-sm">→ Νέο αίτημα, αναμένει αποδοχή</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-yellow-400 rounded-full"></span>
                <span className="font-semibold">OPTION ACCEPTED</span>
                <span className="text-gray-600 text-sm">→ Αποδεχτήκατε, αναμένει admin</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-yellow-400 rounded-full"></span>
                <span className="font-semibold">RESERVATION</span>
                <span className="text-gray-600 text-sm">→ Admin έκλεισε option</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                <span className="font-semibold">CONFIRMED</span>
                <span className="text-gray-600 text-sm">→ Τελικά επιβεβαιωμένο</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                <span className="font-semibold">CANCELLED</span>
                <span className="text-gray-600 text-sm">→ Ακυρωμένο</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                <span className="font-semibold">COMPLETED</span>
                <span className="text-gray-600 text-sm">→ Ολοκληρωμένο</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <p className="text-center text-sm text-gray-500">
            Yacht Management Suite v2.0 • © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
