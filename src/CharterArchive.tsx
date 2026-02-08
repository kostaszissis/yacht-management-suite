import React, { useState, useEffect } from 'react';
import { getVessels, getBookingsByVessel } from './services/apiService';

interface CharterArchiveProps {
  onClose: () => void;
}

interface DocumentData {
  name: string;
  dataUrl: string;
  uploadDate: string;
}

interface ArchiveData {
  notes?: string;
  customFields?: { label: string; value: string }[];
  documents?: {
    bookingConfirmation?: DocumentData[];
    charterAgreement?: DocumentData[];
    skipperLicense?: DocumentData[];
    crewList?: DocumentData[];
    other?: DocumentData[];
  };
}

// Helper to normalize document data (backward compatible - convert single object to array)
const normalizeDocuments = (docs: any): any => {
  if (!docs) return {};
  const normalized: any = { ...docs };
  const docTypes = ['bookingConfirmation', 'charterAgreement', 'skipperLicense', 'crewList'];
  docTypes.forEach(type => {
    if (normalized[type]) {
      // If it's a single object (not array), convert to array
      if (!Array.isArray(normalized[type])) {
        normalized[type] = normalized[type].dataUrl ? [normalized[type]] : [];
      }
    } else {
      normalized[type] = [];
    }
  });
  if (!normalized.other) normalized.other = [];
  return normalized;
};

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

// API helper functions
const API_BASE = '/api/charter-archive.php';

const loadAllArchives = async (): Promise<{[key: string]: any}> => {
  try {
    const response = await fetch(API_BASE);
    const result = await response.json();
    return result.success ? (result.data || {}) : {};
  } catch (e) {
    console.error('Error loading archives:', e);
    return {};
  }
};

const loadArchive = async (bookingNumber: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}?booking_number=${encodeURIComponent(bookingNumber)}`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (e) {
    console.error('Error loading archive:', e);
    return null;
  }
};

const saveArchiveToAPI = async (bookingNumber: string, archiveData: any): Promise<boolean> => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_number: bookingNumber, archive_data: archiveData })
    });
    const result = await response.json();
    return result.success;
  } catch (e) {
    console.error('Error saving archive:', e);
    return false;
  }
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

  // Charters per vessel (loaded separately from API)
  const [vesselCharters, setVesselCharters] = useState<{[vesselId: string]: any[]}>({});

  // All archives data (loaded from API)
  const [allArchives, setAllArchives] = useState<{[key: string]: any}>({});

  // Year filter state (default to current year)
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  // Load vessels and archives on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getVessels();
        setVessels(data || []);

        // Load charters for each vessel
        const chartersMap: {[key: string]: any[]} = {};
        for (const vessel of (data || [])) {
          try {
            const charters = await getBookingsByVessel(vessel.id);
            chartersMap[vessel.id] = charters || [];
          } catch (e) {
            chartersMap[vessel.id] = [];
          }
        }
        setVesselCharters(chartersMap);

        // Load all archives from API
        const archives = await loadAllArchives();
        setAllArchives(archives);
      } catch (error) {
        console.error('Error loading vessels:', error);
        setVessels([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Load archive data when charter is selected (from API)
  useEffect(() => {
    const loadCharterArchive = async () => {
      if (selectedCharter) {
        const charterCode = selectedCharter.code || selectedCharter.bookingNumber || selectedCharter.id;
        const data = await loadArchive(charterCode);
        if (data) {
          // Normalize documents to arrays (backward compatible)
          const normalizedData = {
            ...data,
            documents: normalizeDocuments(data.documents)
          };
          setArchiveData(normalizedData);
          setCustomFields(data.customFields || []);
        } else {
          setArchiveData({ documents: normalizeDocuments({}) });
          setCustomFields([]);
        }
      }
    };
    loadCharterArchive();
  }, [selectedCharter]);

  // Filter charters by selected year
  const filterChartersByYear = (charters: any[]): any[] => {
    if (selectedYear === 'all') return charters;
    return charters.filter((c: any) => {
      const dateStr = c.startDate || c.start_date;
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear();
      return year === parseInt(selectedYear);
    });
  };

  // Get charter count for a vessel (filtered by year)
  const getCharterCountForYear = (vesselId: string): number => {
    const charters = vesselCharters[vesselId] || [];
    return filterChartersByYear(charters).length;
  };

  // Get charters for selected vessel (filtered by year)
  const getVesselCharters = (): any[] => {
    if (!selectedVessel) return [];
    const charters = vesselCharters[selectedVessel.id] || [];
    const filtered = filterChartersByYear(charters);
    return filtered.sort((a: any, b: any) => {
      return new Date(b.startDate || b.start_date || '').getTime() -
             new Date(a.startDate || a.start_date || '').getTime();
    });
  };

  // Count documents for a charter (4 main documents) - uses allArchives from API
  const getDocumentStatus = (charterCode: string): { complete: number; total: number } => {
    try {
      const data = allArchives[charterCode];
      if (!data) return { complete: 0, total: 4 };
      const docs = normalizeDocuments(data.documents);
      let count = 0;
      // Check if each array has at least 1 document
      if (docs.bookingConfirmation?.length > 0) count++;
      if (docs.charterAgreement?.length > 0) count++;
      if (docs.skipperLicense?.length > 0) count++;
      if (docs.crewList?.length > 0) count++;
      return { complete: count, total: 4 };
    } catch {
      return { complete: 0, total: 4 };
    }
  };

  // Count document status for vessel (4 main documents for "full", filtered by year)
  const getVesselDocStats = (vessel: any): { full: number; partial: number; none: number } => {
    const allCharters = vesselCharters[vessel.id] || [];
    const charters = filterChartersByYear(allCharters);
    let full = 0, partial = 0, none = 0;
    charters.forEach((c: any) => {
      const code = c.code || c.bookingNumber || c.id;
      const status = getDocumentStatus(code);
      if (status.complete === 4) full++;
      else if (status.complete > 0) partial++;
      else none++;
    });
    return { full, partial, none };
  };

  // Save archive data to API
  const saveArchiveData = async () => {
    if (!selectedCharter) return;
    const charterCode = selectedCharter.code || selectedCharter.bookingNumber || selectedCharter.id;
    const dataToSave = {
      ...archiveData,
      customFields
    };
    const success = await saveArchiveToAPI(charterCode, dataToSave);
    if (success) {
      // Update local allArchives state
      setAllArchives(prev => ({ ...prev, [charterCode]: dataToSave }));
      alert('Αποθηκεύτηκε!');
    } else {
      alert('Σφάλμα αποθήκευσης!');
    }
  };

  // Update archive field
  const updateArchiveField = (field: string, value: string) => {
    setArchiveData(prev => ({ ...prev, [field]: value }));
  };

  // Handle document upload (appends to array for all document types)
  const handleDocumentUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value immediately to prevent double upload
    const inputElement = e.target;
    inputElement.value = '';

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
        if (!updated.documents) updated.documents = normalizeDocuments({});

        // All document types are now arrays - append to array
        const currentDocs = (updated.documents as any)[docType] || [];

        // Check for duplicate (same name and dataUrl) to prevent double upload from StrictMode
        const isDuplicate = currentDocs.some((f: DocumentData) => f.name === newDoc.name && f.dataUrl === newDoc.dataUrl);
        if (isDuplicate) return prev;

        (updated.documents as any)[docType] = [...currentDocs, newDoc];

        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // View document (all types are now arrays)
  const viewDocument = (docType: string, index: number) => {
    const docs = (archiveData.documents as any)?.[docType] || [];
    const doc = docs[index];
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

  // Delete document (all types are now arrays)
  const deleteDocument = (docType: string, index: number) => {
    setArchiveData(prev => {
      const updated = { ...prev };
      if (!updated.documents) return updated;

      const docs = (updated.documents as any)[docType] || [];
      (updated.documents as any)[docType] = docs.filter((_: any, i: number) => i !== index);

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

  // Render document upload slot (now supports multiple files)
  const renderDocumentSlot = (
    docType: 'bookingConfirmation' | 'charterAgreement' | 'skipperLicense' | 'crewList',
    title: string,
    subtitle: string
  ) => {
    const docs = archiveData.documents?.[docType] || [];
    const hasDocuments = docs.length > 0;

    return (
      <div className="bg-[#f9fafb] border border-[#d1d5db] rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{hasDocuments ? '✅' : '❌'}</span>
            <div>
              <p className="text-[#374151] font-semibold text-base">{title}</p>
              <p className="text-[#6b7280] text-xs">{subtitle}</p>
            </div>
          </div>
          <label className="bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition flex items-center gap-1">
            📤 Ανέβασμα
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,.pdf"
              className="hidden"
              onChange={(e) => handleDocumentUpload(docType, e)}
            />
          </label>
        </div>
        {hasDocuments && (
          <div className="space-y-2">
            {docs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <span>📎</span>
                  <span className="text-[#374151] text-sm">{doc.name}</span>
                  <span className="text-[#6b7280] text-xs">({doc.uploadDate})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => viewDocument(docType, idx)}
                    className="bg-[#059669] text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => deleteDocument(docType, idx)}
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

            {/* Year Filter */}
            <div className="bg-white p-4 flex items-center gap-4 border-b border-[#e5e7eb]">
              <label className="text-[#374151] text-sm font-semibold">Σεζόν:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-[#f9fafb] text-[#374151] border border-[#d1d5db] rounded-lg px-4 py-2 text-sm font-semibold focus:border-[#1e40af] focus:outline-none"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="all">Όλα</option>
              </select>
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
                    const charterCount = getCharterCountForYear(vessel.id);
                    return (
                      <div
                        key={vessel.id || idx}
                        onClick={() => selectVessel(vessel)}
                        className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-[#1e40af]"
                      >
                        <h3 className="text-[#1e40af] text-lg font-bold">{vessel.name}</h3>
                        <p className="text-[#6b7280] text-sm">{vessel.type} {vessel.model ? `• ${vessel.model}` : ''}</p>
                        <p className="text-[#374151] text-sm font-semibold mt-2">{charterCount} ναύλα ({selectedYear === 'all' ? 'Όλα' : selectedYear})</p>
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
                  <h1 className="text-2xl font-bold">📁 {selectedVessel.name} — Ναύλα {selectedYear === 'all' ? '(Όλα)' : selectedYear}</h1>
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
                          <span className="text-xs">{docStatus.complete >= 4 ? '✅' : '❌'}</span>
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

              {/* SECTION B: DOCUMENTS (5 file upload slots) */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-4">
                <h3 className="text-[#1e40af] text-lg font-bold mb-4">📎 ΕΓΓΡΑΦΑ</h3>

                {renderDocumentSlot('bookingConfirmation', 'Booking Confirmation', 'PDF επιβεβαίωσης κράτησης')}
                {renderDocumentSlot('charterAgreement', 'Ναυλοσύμφωνο / Charter Party', 'Υπογεγραμμένο ναυλοσύμφωνο')}
                {renderDocumentSlot('skipperLicense', 'Δίπλωμα Skipper', "Skipper's License")}
                {renderDocumentSlot('crewList', 'Crew List', 'Λίστα Πληρώματος - υπογεγραμμένο')}

                {/* Other Documents (multiple files) */}
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
                          const files = Array.from(e.target.files || []);
                          // Reset input value immediately to prevent double upload
                          e.target.value = '';
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              const today = new Date().toLocaleDateString('el-GR');
                              const newDoc: DocumentData = { name: file.name, dataUrl, uploadDate: today };
                              setArchiveData(prev => {
                                const updated = { ...prev };
                                if (!updated.documents) updated.documents = {};
                                if (!updated.documents.other) updated.documents.other = [];
                                // Check for duplicate (React StrictMode fix)
                                const isDuplicate = updated.documents.other.some((f: DocumentData) => f.name === newDoc.name && f.dataUrl === newDoc.dataUrl);
                                if (isDuplicate) return prev;
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
