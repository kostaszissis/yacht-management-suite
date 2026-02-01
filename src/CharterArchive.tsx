import React, { useState, useEffect } from 'react';
import { getVessels } from './services/apiService';

interface CharterArchiveProps {
  onClose: () => void;
}

interface DocumentData {
  name: string;
  dataUrl: string;
  uploadDate: string;
}

interface ArchiveData {
  bookingConfirmation?: string;
  charterAgreement?: string;
  notes?: string;
  customFields?: { label: string; value: string }[];
  documents?: {
    skipperLicense?: DocumentData | null;
    crewList?: DocumentData | null;
    charterParty?: DocumentData | null;
    other?: DocumentData[];
  };
}

// Format date for display
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('el-GR');
  } catch {
    return dateStr;
  }
};

// Format money
const formatMoney = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '€0';
  return '€' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const CharterArchive: React.FC<CharterArchiveProps> = ({ onClose }) => {
  // Navigation state
  const [level, setLevel] = useState<'vessels' | 'charters' | 'detail'>('vessels');

  // Data state
  const [vessels, setVessels] = useState<any[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [selectedCharter, setSelectedCharter] = useState<any>(null);
  const [archiveData, setArchiveData] = useState<ArchiveData>({});
  const [loading, setLoading] = useState(true);

  // Custom fields state
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);

  // Load vessels on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getVessels();
        setVessels(data || []);
      } catch (error) {
        console.error('Error loading vessels:', error);
        setVessels([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Load archive data when charter is selected
  useEffect(() => {
    if (selectedCharter) {
      const charterCode = selectedCharter.code || selectedCharter.bookingNumber || selectedCharter.id;
      const saved = localStorage.getItem(`charter_archive_${charterCode}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setArchiveData(parsed);
        setCustomFields(parsed.customFields || []);
      } else {
        setArchiveData({});
        setCustomFields([]);
      }
    }
  }, [selectedCharter]);

  // Get charters for selected vessel
  const getVesselCharters = (): any[] => {
    if (!selectedVessel) return [];
    return (selectedVessel.charters || []).sort((a: any, b: any) => {
      return new Date(b.startDate || b.start_date || '').getTime() -
             new Date(a.startDate || a.start_date || '').getTime();
    });
  };

  // Count documents for a charter
  const getDocumentStatus = (charterCode: string): { complete: number; total: number } => {
    try {
      const saved = localStorage.getItem(`charter_archive_${charterCode}`);
      if (!saved) return { complete: 0, total: 3 };
      const data = JSON.parse(saved);
      const docs = data.documents || {};
      let count = 0;
      if (docs.skipperLicense?.dataUrl) count++;
      if (docs.crewList?.dataUrl) count++;
      if (docs.charterParty?.dataUrl) count++;
      return { complete: count, total: 3 };
    } catch {
      return { complete: 0, total: 3 };
    }
  };

  // Count document status for vessel
  const getVesselDocStats = (vessel: any): { full: number; partial: number; none: number } => {
    const charters = vessel.charters || [];
    let full = 0, partial = 0, none = 0;
    charters.forEach((c: any) => {
      const code = c.code || c.bookingNumber || c.id;
      const status = getDocumentStatus(code);
      if (status.complete === 3) full++;
      else if (status.complete > 0) partial++;
      else none++;
    });
    return { full, partial, none };
  };

  // Save archive data
  const saveArchiveData = () => {
    if (!selectedCharter) return;
    const charterCode = selectedCharter.code || selectedCharter.bookingNumber || selectedCharter.id;
    const dataToSave = {
      ...archiveData,
      customFields
    };
    localStorage.setItem(`charter_archive_${charterCode}`, JSON.stringify(dataToSave));
  };

  // Update archive field
  const updateArchiveField = (field: string, value: string) => {
    setArchiveData(prev => ({ ...prev, [field]: value }));
  };

  // Handle document upload
  const handleDocumentUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const today = new Date().toLocaleDateString('el-GR');

      const newDoc: DocumentData = {
        name: file.name,
        dataUrl: dataUrl,
        uploadDate: today
      };

      setArchiveData(prev => {
        const updated = { ...prev };
        if (!updated.documents) updated.documents = {};

        if (docType === 'other') {
          if (!updated.documents.other) updated.documents.other = [];
          updated.documents.other = [...updated.documents.other, newDoc];
        } else {
          (updated.documents as any)[docType] = newDoc;
        }

        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // View document
  const viewDocument = (docType: string, index?: number) => {
    let doc: DocumentData | undefined;
    if (docType === 'other' && index !== undefined) {
      doc = archiveData.documents?.other?.[index];
    } else {
      doc = (archiveData.documents as any)?.[docType];
    }
    if (doc?.dataUrl) {
      const newWindow = window.open();
      if (newWindow) {
        if (doc.dataUrl.startsWith('data:application/pdf') || doc.name.endsWith('.pdf')) {
          newWindow.document.write(`<iframe src="${doc.dataUrl}" width="100%" height="100%" style="border:none;"></iframe>`);
        } else {
          newWindow.document.write(`<img src="${doc.dataUrl}" style="max-width:100%;"/>`);
        }
      }
    }
  };

  // Delete document
  const deleteDocument = (docType: string, index?: number) => {
    setArchiveData(prev => {
      const updated = { ...prev };
      if (!updated.documents) return updated;

      if (docType === 'other' && index !== undefined) {
        if (updated.documents.other) {
          updated.documents.other = updated.documents.other.filter((_, i) => i !== index);
        }
      } else {
        (updated.documents as any)[docType] = null;
      }

      return updated;
    });
  };

  // Add custom field
  const addCustomField = () => {
    setCustomFields(prev => [...prev, { label: '', value: '' }]);
  };

  // Update custom field
  const updateCustomField = (index: number, field: 'label' | 'value', value: string) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Delete custom field
  const deleteCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    alert('PDF export - Coming soon!');
  };

  // Handle Word download
  const handleDownloadWord = () => {
    alert('Word export - Coming soon!');
  };

  // Save and go back
  const saveAndGoBack = () => {
    saveArchiveData();
    setLevel('charters');
  };

  // Navigation handlers
  const goBack = () => {
    if (level === 'detail') {
      saveArchiveData();
      setLevel('charters');
    } else if (level === 'charters') {
      setLevel('vessels');
    } else {
      onClose();
    }
  };

  const selectVessel = (vessel: any) => {
    setSelectedVessel(vessel);
    setLevel('charters');
  };

  const selectCharter = (charter: any) => {
    setSelectedCharter(charter);
    setLevel('detail');
  };

  // Get charter code
  const getCharterCode = (charter: any): string => {
    return charter?.code || charter?.bookingNumber || charter?.id || 'N/A';
  };

  // Render document upload slot
  const renderDocumentSlot = (
    docType: 'skipperLicense' | 'crewList' | 'charterParty',
    title: string,
    subtitle: string
  ) => {
    const doc = archiveData.documents?.[docType];
    const isUploaded = !!doc?.dataUrl;

    return (
      <div className="bg-[#f9fafb] border border-[#d1d5db] rounded-lg p-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isUploaded ? '✅' : '❌'}</span>
          <div>
            <p className="text-[#374151] font-semibold text-base">{title}</p>
            <p className="text-[#6b7280] text-xs">{subtitle}</p>
            {isUploaded && doc && (
              <p className="text-[#6b7280] text-xs mt-1">
                📄 {doc.name} • Ανέβηκε: {doc.uploadDate}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isUploaded ? (
            <label className="bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition flex items-center gap-1">
              📤 Ανέβασμα
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,.pdf"
                className="hidden"
                onChange={(e) => handleDocumentUpload(docType, e)}
              />
            </label>
          ) : (
            <>
              <button
                onClick={() => viewDocument(docType)}
                className="bg-[#059669] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
              >
                👁 Προβολή
              </button>
              <button
                onClick={() => deleteDocument(docType)}
                className="bg-[#dc2626] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
              >
                🗑 Διαγραφή
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[85vh] flex flex-col">

        {/* ==================== LEVEL 1: VESSEL SELECTION ==================== */}
        {level === 'vessels' && (
          <>
            {/* Header */}
            <div className="bg-[#1e40af] text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold">📁 ΑΡΧΕΙΟ ΝΑΥΛΩΝ</h1>
                  <p className="text-blue-200 text-sm">Επιλέξτε Σκάφος</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="bg-[#f3f4f6] p-6 flex-1 overflow-y-auto rounded-b-2xl">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e40af]"></div>
                </div>
              ) : vessels.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#6b7280] text-lg">Δεν βρέθηκαν σκάφη</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vessels.map((vessel, idx) => {
                    const stats = getVesselDocStats(vessel);
                    const charterCount = vessel.charters?.length || 0;
                    return (
                      <div
                        key={vessel.id || idx}
                        onClick={() => selectVessel(vessel)}
                        className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-[#1e40af]"
                      >
                        <h3 className="text-[#1e40af] text-lg font-bold">{vessel.name}</h3>
                        <p className="text-[#6b7280] text-sm">{vessel.type} {vessel.model ? `• ${vessel.model}` : ''}</p>
                        <p className="text-[#374151] text-sm font-semibold mt-2">{charterCount} ναύλα</p>
                        <div className="flex gap-2 mt-2">
                          {stats.full > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✅ {stats.full}</span>
                          )}
                          {stats.partial > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">⚠️ {stats.partial}</span>
                          )}
                          {stats.none > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">❌ {stats.none}</span>
                          )}
                        </div>
                        <div className="text-[#1e40af] text-right mt-2">→</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================== LEVEL 2: CHARTER LIST ==================== */}
        {level === 'charters' && selectedVessel && (
          <>
            {/* Header */}
            <div className="bg-[#1e40af] text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={goBack} className="p-1 hover:bg-white/20 rounded-lg transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold">📁 {selectedVessel.name} — Ναύλα</h1>
                  <p className="text-blue-200 text-sm">{selectedVessel.type} {selectedVessel.model ? `• ${selectedVessel.model}` : ''}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary Bar */}
            <div className="bg-white p-4 border-b border-[#e5e7eb] flex gap-6">
              {(() => {
                const stats = getVesselDocStats(selectedVessel);
                return (
                  <>
                    <span className="text-[#374151] text-sm font-semibold">🟢 Πλήρη: {stats.full}</span>
                    <span className="text-[#374151] text-sm font-semibold">🟠 Ελλιπή: {stats.partial}</span>
                    <span className="text-[#374151] text-sm font-semibold">🔴 Κενά: {stats.none}</span>
                  </>
                );
              })()}
            </div>

            {/* Charter List */}
            <div className="bg-[#f3f4f6] p-4 flex-1 overflow-y-auto rounded-b-2xl">
              {getVesselCharters().length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#6b7280] text-lg">Δεν βρέθηκαν ναύλα για αυτό το σκάφος</p>
                </div>
              ) : (
                getVesselCharters().map((charter: any, idx: number) => {
                  const code = getCharterCode(charter);
                  const docStatus = getDocumentStatus(code);
                  const borderColor = docStatus.complete === 3 ? 'border-green-500' :
                                     docStatus.complete > 0 ? 'border-orange-500' : 'border-red-500';

                  return (
                    <div
                      key={code || idx}
                      onClick={() => selectCharter(charter)}
                      className={`bg-white rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${borderColor} flex items-center justify-between`}
                    >
                      <div>
                        <p className="text-[#1e40af] font-bold text-base">{code}</p>
                        <p className="text-[#374151] text-sm">
                          {formatDate(charter.startDate || charter.start_date)} - {formatDate(charter.endDate || charter.end_date)}
                        </p>
                        <p className="text-[#6b7280] text-sm">
                          {charter.chartererFirstName || charter.clientName || charter.charterer || 'Άγνωστος'}
                          {charter.chartererLastName ? ` ${charter.chartererLastName}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#374151] font-bold">{formatMoney(charter.amount || charter.price || 0)}</p>
                        <div className="flex gap-1 justify-end mt-1">
                          <span className="text-xs">{docStatus.complete >= 1 ? '✅' : '❌'}</span>
                          <span className="text-xs">{docStatus.complete >= 2 ? '✅' : '❌'}</span>
                          <span className="text-xs">{docStatus.complete >= 3 ? '✅' : '❌'}</span>
                        </div>
                        <span className="text-[#1e40af] text-lg">→</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ==================== LEVEL 3: CHARTER DETAIL ==================== */}
        {level === 'detail' && selectedCharter && (
          <>
            {/* Header */}
            <div className="bg-[#1e40af] text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={goBack} className="p-1 hover:bg-white/20 rounded-lg transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold">{getCharterCode(selectedCharter)} • {selectedVessel?.name}</h1>
                  <p className="text-blue-200 text-sm">
                    {formatDate(selectedCharter.startDate || selectedCharter.start_date)} - {formatDate(selectedCharter.endDate || selectedCharter.end_date)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="bg-[#f3f4f6] p-6 flex-1 overflow-y-auto">

              {/* SECTION A: CHARTER DETAILS */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-4">📋 ΣΤΟΙΧΕΙΑ ΝΑΥΛΟΥ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'ΚΩΔΙΚΟΣ', value: getCharterCode(selectedCharter) },
                    { label: 'ΣΚΑΦΟΣ', value: selectedVessel?.name || '-' },
                    { label: 'ΗΜ. ΕΝΑΡΞΗΣ', value: formatDate(selectedCharter.startDate || selectedCharter.start_date) },
                    { label: 'ΗΜ. ΛΗΞΗΣ', value: formatDate(selectedCharter.endDate || selectedCharter.end_date) },
                    { label: 'ΛΙΜΑΝΙ ΑΝΑΧΩΡΗΣΗΣ', value: selectedCharter.departure || 'ALIMOS MARINA' },
                    { label: 'ΛΙΜΑΝΙ ΑΦΙΞΗΣ', value: selectedCharter.arrival || 'ALIMOS MARINA' },
                    { label: 'CHARTERER', value: `${selectedCharter.chartererFirstName || ''} ${selectedCharter.chartererLastName || selectedCharter.clientName || selectedCharter.charterer || ''}`.trim() || '-' },
                    { label: 'ΤΗΛΕΦΩΝΟ', value: selectedCharter.chartererPhone || selectedCharter.skipperPhone || '-' },
                    { label: 'EMAIL', value: selectedCharter.chartererEmail || selectedCharter.skipperEmail || '-' },
                    { label: 'ΔΙΕΥΘΥΝΣΗ', value: selectedCharter.chartererAddress || selectedCharter.skipperAddress || '-' },
                    { label: 'SKIPPER', value: `${selectedCharter.skipperFirstName || ''} ${selectedCharter.skipperLastName || ''}`.trim() || '-' },
                    { label: 'ΠΟΣΟ ΝΑΥΛΟΥ', value: formatMoney(selectedCharter.amount || selectedCharter.price || 0) },
                    { label: 'ΠΡΟΜΗΘΕΙΑ', value: formatMoney(selectedCharter.commission || 0) },
                    { label: 'ΦΠΑ ΠΡΟΜΗΘΕΙΑΣ', value: formatMoney(selectedCharter.vat_on_commission || selectedCharter.vatOnCommission || 0) },
                    { label: 'ΠΛΗΡΩΜΗ', value: selectedCharter.paymentStatus || selectedCharter.payment_status || '-' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-[#374151] text-base font-medium mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B: BOOKING CONFIRMATION */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-3">✉ BOOKING CONFIRMATION</h3>
                <textarea
                  value={archiveData.bookingConfirmation || ''}
                  onChange={(e) => updateArchiveField('bookingConfirmation', e.target.value)}
                  placeholder="Επικολλήστε εδώ το Booking Confirmation..."
                  className="w-full h-48 bg-[#f9fafb] text-[#374151] border border-[#d1d5db] rounded-lg p-4 text-sm resize-y focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-opacity-20"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={saveArchiveData}
                    className="bg-[#059669] text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                  >
                    💾 Αποθήκευση
                  </button>
                </div>
              </div>

              {/* SECTION C: CHARTER AGREEMENT */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-3">📜 ΝΑΥΛΟΣΥΜΦΩΝΟ</h3>
                <textarea
                  value={archiveData.charterAgreement || ''}
                  onChange={(e) => updateArchiveField('charterAgreement', e.target.value)}
                  placeholder="Επικολλήστε εδώ το Ναυλοσύμφωνο..."
                  className="w-full h-48 bg-[#f9fafb] text-[#374151] border border-[#d1d5db] rounded-lg p-4 text-sm resize-y focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-opacity-20"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={saveArchiveData}
                    className="bg-[#059669] text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                  >
                    💾 Αποθήκευση
                  </button>
                </div>
              </div>

              {/* SECTION D: DOCUMENTS */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-4">📎 ΕΓΓΡΑΦΑ</h3>

                {renderDocumentSlot('skipperLicense', 'Δίπλωμα Skipper', "Skipper's License")}
                {renderDocumentSlot('crewList', 'Crew List', 'Λίστα Πληρώματος - υπογεγραμμένο')}
                {renderDocumentSlot('charterParty', 'Charter Party', 'Υπογεγραμμένο από Λιμεναρχείο')}

                {/* Other Documents */}
                <div className="bg-[#f9fafb] border border-[#d1d5db] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <p className="text-[#374151] font-semibold text-base">Άλλα Έγγραφα</p>
                    </div>
                    <label className="bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition">
                      ➕ Προσθήκη
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,.pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          Array.from(e.target.files || []).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              const today = new Date().toLocaleDateString('el-GR');
                              const newDoc: DocumentData = { name: file.name, dataUrl, uploadDate: today };
                              setArchiveData(prev => {
                                const updated = { ...prev };
                                if (!updated.documents) updated.documents = {};
                                if (!updated.documents.other) updated.documents.other = [];
                                updated.documents.other = [...updated.documents.other, newDoc];
                                return updated;
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  </div>
                  {archiveData.documents?.other && archiveData.documents.other.length > 0 && (
                    <div className="space-y-2">
                      {archiveData.documents.other.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#e5e7eb]">
                          <div className="flex items-center gap-2">
                            <span>📎</span>
                            <span className="text-[#374151] text-sm">{doc.name}</span>
                            <span className="text-[#6b7280] text-xs">({doc.uploadDate})</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewDocument('other', idx)}
                              className="bg-[#059669] text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition"
                            >
                              👁
                            </button>
                            <button
                              onClick={() => deleteDocument('other', idx)}
                              className="bg-[#dc2626] text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION E: NOTES */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-3">📝 ΣΗΜΕΙΩΣΕΙΣ</h3>
                <textarea
                  value={archiveData.notes || ''}
                  onChange={(e) => updateArchiveField('notes', e.target.value)}
                  placeholder="Σημειώσεις για αυτό το ναύλο..."
                  className="w-full h-32 bg-[#f9fafb] text-[#374151] border border-[#d1d5db] rounded-lg p-4 text-sm resize-y focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-opacity-20"
                />
              </div>

              {/* SECTION F: CUSTOM FIELDS */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-3">➕ ΠΡΟΣΘΕΤΑ ΠΕΔΙΑ</h3>
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateCustomField(idx, 'label', e.target.value)}
                      placeholder="Ετικέτα"
                      className="bg-[#f9fafb] text-[#374151] border border-[#d1d5db] rounded-lg px-3 py-2 w-1/3 text-sm focus:border-[#1e40af] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                      placeholder="Τιμή"
                      className="bg-[#f9fafb] text-[#374151] border border-[#d1d5db] rounded-lg px-3 py-2 flex-1 text-sm focus:border-[#1e40af] focus:outline-none"
                    />
                    <button
                      onClick={() => deleteCustomField(idx)}
                      className="text-[#dc2626] hover:text-red-700 px-2"
                    >
                      🗑
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCustomField}
                  className="text-[#1e40af] text-sm font-semibold hover:underline mt-2"
                >
                  ➕ Προσθήκη Πεδίου
                </button>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-white border-t border-[#d1d5db] p-4 rounded-b-2xl flex gap-3 items-center">
              <button onClick={handlePrint} className="bg-[#374151] text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition text-sm">
                🖨 Εκτύπωση
              </button>
              <button onClick={handleDownloadPDF} className="bg-[#dc2626] text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
                📥 PDF
              </button>
              <button onClick={handleDownloadWord} className="bg-[#1e40af] text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                📥 Word
              </button>
              <div className="flex-1"></div>
              <button onClick={saveAndGoBack} className="bg-[#059669] text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm">
                💾 Αποθήκευση & Πίσω
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharterArchive;
