import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import * as XLSX from 'xlsx';

// Vessels list (same as other pages)
const VESSELS = [
  { id: 1, name: 'Maria 1' },
  { id: 2, name: 'Maria 2' },
  { id: 3, name: 'Valesia' },
  { id: 4, name: 'Bar Bar' },
  { id: 5, name: 'Kalispera' },
  { id: 6, name: 'Infinity' },
  { id: 7, name: 'Perla' },
  { id: 8, name: 'Bob' }
];

// Section definitions with default items
const SECTIONS = {
  farmakeio: {
    id: 'farmakeio',
    icon: '💊',
    titleEl: 'ΦΑΡΜΑΚΕΙΟ',
    titleEn: 'FIRST AID KIT',
    defaultItems: [
      'Αντισηπτικό Χεριών',
      'Γάζες Αποστειρωμένες',
      'Επίδεσμοι Ελαστικοί',
      'Παυσίπονα (Depon)',
      'Αντιβιοτική Αλοιφή',
      'Betadine',
      'Αλκοόλ',
      'Αντιισταμινικά',
      'Θερμόμετρο',
      'Ψαλίδι Επιδέσμων'
    ]
  },
  pyrotechnika: {
    id: 'pyrotechnika',
    icon: '🔥',
    titleEl: 'ΦΩΤΟΒΟΛΙΔΕΣ / ΠΥΡΟΤΕΧΝΙΚΑ',
    titleEn: 'FLARES / PYROTECHNICS',
    defaultItems: [
      'Φωτοβολίδες Χειρός',
      'Φωτοβολίδες Παραβολικές',
      'Καπνογόνα',
      'Βαρελάκια',
      'Βεγγαλικά Καπνογόνα',
      'Καπνογόνα Θαλάσσης'
    ]
  },
  liferaft: {
    id: 'liferaft',
    icon: '🛟',
    titleEl: 'LIFE RAFT',
    titleEn: 'LIFE RAFT',
    defaultItems: [
      'Life Raft 6 ατόμων',
      'Life Raft 8 ατόμων',
      'Life Raft 10 ατόμων'
    ]
  },
  pyrosvestires: {
    id: 'pyrosvestires',
    icon: '🧯',
    titleEl: 'ΠΥΡΟΣΒΕΣΤΗΡΕΣ',
    titleEn: 'FIRE EXTINGUISHERS',
    defaultItems: [
      'Πυροσβεστήρας 2kg',
      'Πυροσβεστήρας 6kg',
      'Πυροσβεστήρας CO2',
      'Πυροσβεστήρας Κουζίνας'
    ]
  }
};

interface SafetyItem {
  id: string;
  name: string;
  qty: number;
  expiryDate: string;
  notes: string;
  checked: boolean;
  deliveryDate?: string;
  receiptDate?: string;
  isCustom?: boolean;
}

interface SectionState {
  expanded: boolean;
  items: SafetyItem[];
}

const STORAGE_KEY = 'winter_safety_equipment_v3';
const CUSTOM_SECTIONS_KEY = 'winter_safety_custom_sections';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface CustomSection {
  id: string;
  icon: string;
  titleEl: string;
  titleEn: string;
  defaultItems: string[];
}

const WinterSafetyEquipment: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'el' | 'en'>('el');
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);
  const [sections, setSections] = useState<{ [key: string]: SectionState }>({});
  const [customSections, setCustomSections] = useState<{ [key: string]: CustomSection }>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('📋');

  // Check if user is owner (view-only access)
  const isOwnerUser = authService.isOwner();
  const canEdit = !isOwnerUser;

  // Get vessel key for storage
  const getVesselKey = (vesselId: number | null): string => {
    if (!vesselId) return '';
    const vessel = VESSELS.find(v => v.id === vesselId);
    return vessel ? vessel.name.replace(/\s+/g, '_').toLowerCase() : '';
  };

  // Initialize default sections
  const initializeDefaultSections = (): { [key: string]: SectionState } => {
    const initial: { [key: string]: SectionState } = {};
    Object.values(SECTIONS).forEach(section => {
      initial[section.id] = {
        expanded: false,
        items: section.defaultItems.map((name, idx) => ({
          id: `${section.id}_default_${idx}`,
          name,
          qty: 1,
          expiryDate: '',
          notes: '',
          checked: false,
          isCustom: false
        }))
      };
    });
    return initial;
  };

  // Load on mount
  useEffect(() => {
    setSections(initializeDefaultSections());
    const lastVessel = localStorage.getItem('safety_last_vessel');
    if (lastVessel) {
      setSelectedVessel(Number(lastVessel));
    }
  }, []);

  // Load vessel-specific data when vessel changes
  useEffect(() => {
    if (!selectedVessel) {
      setSections(initializeDefaultSections());
      setCustomSections({});
      setGeneralNotes('');
      return;
    }

    const vesselKey = getVesselKey(selectedVessel);
    localStorage.setItem('safety_last_vessel', String(selectedVessel));

    const newSections = initializeDefaultSections();
    const savedData = localStorage.getItem(`${STORAGE_KEY}_${vesselKey}`);

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        Object.keys(newSections).forEach(sectionId => {
          if (data.sections?.[sectionId]) {
            // Merge saved items with defaults
            newSections[sectionId].expanded = data.sections[sectionId].expanded || false;
            newSections[sectionId].items = newSections[sectionId].items.map(defaultItem => {
              const savedItem = data.sections[sectionId].items?.find(
                (si: SafetyItem) => si.name === defaultItem.name && !si.isCustom
              );
              return savedItem ? { ...defaultItem, ...savedItem } : defaultItem;
            });
            // Add custom items
            const customItems = data.sections[sectionId].items?.filter((i: SafetyItem) => i.isCustom) || [];
            newSections[sectionId].items.push(...customItems);
          }
        });
        setGeneralNotes(data.generalNotes || '');
      } catch (e) {
        console.error('Error loading vessel data:', e);
      }
    } else {
      setGeneralNotes('');
    }

    // Load custom sections
    const customSectionsData = localStorage.getItem(`${CUSTOM_SECTIONS_KEY}_${vesselKey}`);
    if (customSectionsData) {
      try {
        const customData = JSON.parse(customSectionsData);
        setCustomSections(customData);
        Object.keys(customData).forEach(sectionId => {
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.sections?.[sectionId]) {
              newSections[sectionId] = {
                expanded: data.sections[sectionId].expanded || false,
                items: data.sections[sectionId].items || []
              };
            } else {
              newSections[sectionId] = { expanded: false, items: [] };
            }
          } else {
            newSections[sectionId] = { expanded: false, items: [] };
          }
        });
      } catch (e) {
        console.error('Error loading custom sections:', e);
      }
    } else {
      setCustomSections({});
    }

    setSections(newSections);
  }, [selectedVessel]);

  // Check expiry status
  const getExpiryStatus = (expiryDate: string): 'expired' | 'warning' | 'ok' | 'none' => {
    if (!expiryDate) return 'none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays < 90) return 'warning';
    return 'ok';
  };

  // Get days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate progress
  const sectionValues = Object.values(sections) as SectionState[];
  const totalItems = sectionValues.reduce((acc, s) => acc + s.items.length, 0);
  const completedItems = sectionValues.reduce((acc, s) => acc + s.items.filter((i: SafetyItem) => i.checked).length, 0);
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Count expiry issues
  const expiredCount = sectionValues.reduce((acc, s) =>
    acc + s.items.filter((i: SafetyItem) => getExpiryStatus(i.expiryDate) === 'expired').length, 0);
  const warningCount = sectionValues.reduce((acc, s) =>
    acc + s.items.filter((i: SafetyItem) => getExpiryStatus(i.expiryDate) === 'warning').length, 0);

  // Toggle section
  const toggleSection = (sectionId: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], expanded: !prev[sectionId]?.expanded }
    }));
  };

  // Expand/Collapse all
  const expandAll = () => {
    setSections(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], expanded: true };
      });
      return updated;
    });
  };

  const collapseAll = () => {
    setSections(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], expanded: false };
      });
      return updated;
    });
  };

  // Toggle item checked
  const toggleItem = (sectionId: string, itemId: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      }
    }));
  };

  // Update item field
  const updateItem = (sectionId: string, itemId: string, field: keyof SafetyItem, value: any) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  // Add item
  const addItem = (sectionId: string) => {
    if (!selectedVessel || !newItemName.trim()) return;
    const newItem: SafetyItem = {
      id: uid(),
      name: newItemName.trim(),
      qty: 1,
      expiryDate: '',
      notes: '',
      checked: false,
      isCustom: true
    };
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: [...prev[sectionId].items, newItem]
      }
    }));
    setNewItemName('');
    setShowAddItem(null);
  };

  // Remove item
  const removeItem = (sectionId: string, itemId: string) => {
    if (!window.confirm(lang === 'el' ? 'Διαγραφή αντικειμένου;' : 'Delete item?')) return;
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.filter(item => item.id !== itemId)
      }
    }));
  };

  // Add custom section
  const addSection = () => {
    if (!selectedVessel || !newSectionName.trim()) return;
    const sectionId = `custom_${uid()}`;
    const newSection: CustomSection = {
      id: sectionId,
      icon: newSectionIcon,
      titleEl: newSectionName.trim().toUpperCase(),
      titleEn: newSectionName.trim().toUpperCase(),
      defaultItems: []
    };

    setCustomSections(prev => ({ ...prev, [sectionId]: newSection }));
    setSections(prev => ({
      ...prev,
      [sectionId]: { expanded: true, items: [] }
    }));

    const vesselKey = getVesselKey(selectedVessel);
    const existingCustom = localStorage.getItem(`${CUSTOM_SECTIONS_KEY}_${vesselKey}`);
    const customData = existingCustom ? JSON.parse(existingCustom) : {};
    customData[sectionId] = newSection;
    localStorage.setItem(`${CUSTOM_SECTIONS_KEY}_${vesselKey}`, JSON.stringify(customData));

    setNewSectionName('');
    setNewSectionIcon('📋');
    setShowAddSection(false);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    if (!window.confirm(lang === 'el' ? 'Διαγραφή κατηγορίας και όλων των στοιχείων;' : 'Delete category and all items?')) return;

    setSections(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });

    if (sectionId.startsWith('custom_')) {
      setCustomSections(prev => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });

      if (selectedVessel) {
        const vesselKey = getVesselKey(selectedVessel);
        const existingCustom = localStorage.getItem(`${CUSTOM_SECTIONS_KEY}_${vesselKey}`);
        if (existingCustom) {
          const customData = JSON.parse(existingCustom);
          delete customData[sectionId];
          localStorage.setItem(`${CUSTOM_SECTIONS_KEY}_${vesselKey}`, JSON.stringify(customData));
        }
      }
    }
  };

  // Set delivery/receipt date
  const setDeliveryDate = (sectionId: string, itemId: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateItem(sectionId, itemId, 'deliveryDate', today);
  };

  const setReceiptDate = (sectionId: string, itemId: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateItem(sectionId, itemId, 'receiptDate', today);
  };

  // Save
  const handleSave = () => {
    if (!selectedVessel) {
      alert(lang === 'el' ? 'Επιλέξτε σκάφος πρώτα!' : 'Select a vessel first!');
      return;
    }
    const vesselKey = getVesselKey(selectedVessel);
    const data = { sections, generalNotes, lastSaved: new Date().toISOString() };
    localStorage.setItem(`${STORAGE_KEY}_${vesselKey}`, JSON.stringify(data));
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!selectedVessel) {
      alert(lang === 'el' ? 'Επιλέξτε σκάφος πρώτα!' : 'Select a vessel first!');
      return;
    }
    const vesselName = VESSELS.find(v => v.id === selectedVessel)?.name || 'Unknown';
    const data: any[] = [];

    Object.values(SECTIONS).forEach(sectionDef => {
      const section = sections[sectionDef.id];
      if (!section) return;
      section.items.forEach(item => {
        const status = getExpiryStatus(item.expiryDate);
        data.push({
          'Κατηγορία': lang === 'el' ? sectionDef.titleEl : sectionDef.titleEn,
          'Είδος': item.name,
          'OK': item.checked ? '✓' : '',
          'Ποσότητα': item.qty,
          'Ημ. Λήξης': item.expiryDate || '-',
          'Κατάσταση': status === 'expired' ? 'ΛΗΓΜΕΝΟ!' : status === 'warning' ? 'ΠΡΟΣΟΧΗ' : status === 'ok' ? 'OK' : '-',
          'Παράδοση': item.deliveryDate || '-',
          'Παραλαβή': item.receiptDate || '-',
          'Σημειώσεις': item.notes || '-'
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Safety Equipment');
    XLSX.writeFile(wb, `Safety_${vesselName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Format date
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('el-GR');
  };

  // Get section progress
  const getSectionProgress = (sectionId: string) => {
    const section = sections[sectionId];
    if (!section) return { completed: 0, total: 0, expired: 0, warning: 0 };
    return {
      completed: section.items.filter(i => i.checked).length,
      total: section.items.length,
      expired: section.items.filter(i => getExpiryStatus(i.expiryDate) === 'expired').length,
      warning: section.items.filter(i => getExpiryStatus(i.expiryDate) === 'warning').length
    };
  };

  // Render section
  const renderSection = (sectionDef: typeof SECTIONS.farmakeio) => {
    const section = sections[sectionDef.id];
    if (!section) return null;
    const progress = getSectionProgress(sectionDef.id);
    const isComplete = progress.completed === progress.total && progress.total > 0;

    return (
      <div key={sectionDef.id} className="rounded-xl mb-3 border border-blue-300 overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.005] transition-all duration-300" style={{ backgroundColor: 'rgba(144, 202, 249, 0.5)' }}>
        {/* Section Header */}
        <div className="flex items-center" style={{ backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 181, 246, 0.5)' }}>
          <button
            onClick={() => toggleSection(sectionDef.id)}
            className="flex-1 p-4 flex items-center justify-between transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{sectionDef.icon}</span>
              <span className="font-bold text-lg text-gray-800">
                {lang === 'el' ? sectionDef.titleEl : sectionDef.titleEn}
              </span>
              {isComplete && <span className="text-green-600 text-xl">✓</span>}
              {progress.expired > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {progress.expired} {lang === 'el' ? 'ληγμένα' : 'expired'}
                </span>
              )}
              {progress.warning > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {progress.warning} {lang === 'el' ? 'προσοχή' : 'warning'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium px-3 py-1 rounded-full text-white ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}>
                {progress.completed}/{progress.total}
              </span>
              <span className="text-gray-700 text-xl">{section.expanded ? '▼' : '▶'}</span>
            </div>
          </button>
          {/* Delete Section Button */}
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); removeSection(sectionDef.id); }}
              className="px-3 py-2 mr-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
              title={lang === 'el' ? 'Διαγραφή κατηγορίας' : 'Delete category'}
            >
              🗑️
            </button>
          )}
        </div>

        {/* Section Content */}
        {section.expanded && (
          <div className="p-4 pt-2 border-t border-blue-300" style={{ backgroundColor: 'rgba(179, 229, 252, 0.4)' }}>
            {section.items.map(item => {
              const status = getExpiryStatus(item.expiryDate);
              const days = getDaysUntilExpiry(item.expiryDate);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg mb-2 transition-all duration-300 border hover:shadow-lg ${
                    status === 'expired' ? 'border-red-500 bg-red-50' :
                    status === 'warning' ? 'border-blue-500 bg-blue-50' :
                    item.checked ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-white/70'
                  }`}
                >
                  {/* Row 1: Checkbox + Name + Qty */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <button
                      onClick={() => canEdit && toggleItem(sectionDef.id, item.id)}
                      disabled={!canEdit}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 hover:border-green-400'
                      } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {item.checked ? '✓' : ''}
                    </button>

                    <span className={`font-medium flex-1 min-w-[120px] ${
                      status === 'expired' ? 'text-red-700' :
                      status === 'warning' ? 'text-blue-700' :
                      item.checked ? 'text-green-700' : 'text-gray-800'
                    }`}>
                      {item.name}
                      {status === 'expired' && <span className="ml-2 text-red-500 animate-pulse">⚠️ ΛΗΞΗ!</span>}
                    </span>

                    {/* Qty */}
                    <div className="flex items-center gap-1 bg-blue-100 rounded-lg px-2 py-1 border border-blue-300">
                      <span className="text-xs text-gray-600">Ποσ:</span>
                      <button
                        onClick={() => canEdit && updateItem(sectionDef.id, item.id, 'qty', Math.max(0, item.qty - 1))}
                        disabled={!canEdit}
                        className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-sm"
                      >-</button>
                      <span className="w-8 text-center text-gray-800 font-medium">{item.qty}</span>
                      <button
                        onClick={() => canEdit && updateItem(sectionDef.id, item.id, 'qty', item.qty + 1)}
                        disabled={!canEdit}
                        className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-sm"
                      >+</button>
                    </div>

                    {/* Delete item button */}
                    {canEdit && (
                      <button
                        onClick={() => removeItem(sectionDef.id, item.id)}
                        className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded text-sm"
                        title={lang === 'el' ? 'Διαγραφή' : 'Delete'}
                      >🗑️</button>
                    )}
                  </div>

                  {/* Row 2: Expiry date + Delivery/Receipt buttons */}
                  <div className="flex items-center gap-2 flex-wrap ml-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Λήξη:</span>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => canEdit && updateItem(sectionDef.id, item.id, 'expiryDate', e.target.value)}
                        disabled={!canEdit}
                        className={`px-2 py-1 rounded border text-sm ${
                          status === 'expired' ? 'border-red-500 bg-red-100' :
                          status === 'warning' ? 'border-blue-500 bg-blue-100' :
                          'border-blue-300 bg-white'
                        }`}
                      />
                      {status !== 'none' && (
                        <span className={`text-xs ${status === 'expired' ? 'text-red-600' : status === 'warning' ? 'text-blue-600' : 'text-green-600'}`}>
                          {status === 'expired' ? `${Math.abs(days)} μέρες πριν` : `${days} μέρες`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => canEdit && setDeliveryDate(sectionDef.id, item.id)}
                        disabled={!canEdit}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold"
                      >🔴 Παράδοση</button>
                      {item.deliveryDate && <span className="text-xs text-red-600">{formatDate(item.deliveryDate)}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => canEdit && setReceiptDate(sectionDef.id, item.id)}
                        disabled={!canEdit}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold"
                      >🟢 Παραλαβή</button>
                      {item.receiptDate && <span className="text-xs text-green-600">{formatDate(item.receiptDate)}</span>}
                    </div>
                  </div>

                  {/* Row 3: Notes */}
                  <div className="mt-2 ml-10">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => canEdit && updateItem(sectionDef.id, item.id, 'notes', e.target.value)}
                      disabled={!canEdit}
                      placeholder={lang === 'el' ? 'Σημειώσεις...' : 'Notes...'}
                      className="w-full px-2 py-1 bg-white/90 border border-blue-300 rounded text-sm text-gray-800 placeholder-gray-500"
                    />
                  </div>
                </div>
              );
            })}

            {/* Add Item Button */}
            {canEdit && (
              showAddItem === sectionDef.id ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={lang === 'el' ? 'Όνομα είδους...' : 'Item name...'}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg"
                    autoFocus
                  />
                  <button
                    onClick={() => addItem(sectionDef.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold"
                  >Προσθήκη</button>
                  <button
                    onClick={() => { setShowAddItem(null); setNewItemName(''); }}
                    className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
                  >Ακύρωση</button>
                </div>
              ) : (
                <button
                  onClick={() => selectedVessel && setShowAddItem(sectionDef.id)}
                  className={`w-full mt-2 p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    selectedVessel ? 'border-blue-500 text-blue-700 hover:bg-blue-100' : 'border-gray-400 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl">➕</span>
                  <span className="font-medium">
                    {selectedVessel ? (lang === 'el' ? 'Προσθήκη Είδους' : 'Add Item') : (lang === 'el' ? 'Επιλέξτε σκάφος πρώτα' : 'Select vessel first')}
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-800" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
      {/* Header */}
      <div className="p-4 rounded-b-xl shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            >
              ← {lang === 'el' ? 'Πίσω' : 'Back'}
            </button>
            <button
              onClick={() => setLang(lang === 'el' ? 'en' : 'el')}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-105"
            >
              {lang === 'el' ? '🇬🇧 EN' : '🇬🇷 EL'}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-blue-800 text-center drop-shadow-md">
            🩹 {lang === 'el' ? 'ΕΞΟΠΛΙΣΜΟΣ ΑΣΦΑΛΕΙΑΣ' : 'SAFETY EQUIPMENT'}
          </h1>
          <p className="text-blue-700 text-center mt-1">
            {lang === 'el' ? 'Έλεγχος & Ημερομηνίες Λήξης' : 'Inspection & Expiry Dates'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* View-Only Banner for Owners */}
        {isOwnerUser && (
          <div className="mb-4 p-4 bg-blue-100 rounded-xl text-center border border-blue-300">
            <div className="flex items-center justify-center gap-3 text-blue-800">
              <span className="text-2xl">👁️</span>
              <div>
                <span className="font-bold text-lg">{lang === 'el' ? 'Προβολή μόνο' : 'View only'}</span>
                <p className="text-xs text-blue-600 mt-1">
                  {lang === 'el' ? 'Ως ιδιοκτήτης, μπορείτε να δείτε αλλά όχι να επεξεργαστείτε' : 'As owner, you can view but not edit'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vessel Selection */}
        <div className="rounded-xl p-4 mb-4 border border-blue-300 shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            {lang === 'el' ? 'Επιλέξτε Σκάφος' : 'Select Vessel'}
          </label>
          <select
            value={selectedVessel || ''}
            onChange={(e) => setSelectedVessel(Number(e.target.value) || null)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{lang === 'el' ? '-- Επιλέξτε --' : '-- Select --'}</option>
            {VESSELS.map(vessel => (
              <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
            ))}
          </select>
          {selectedVessel && (
            <p className="mt-2 text-xs text-blue-800 flex items-center gap-1">
              💾 {lang === 'el'
                ? `Τα δεδομένα αποθηκεύονται ξεχωριστά για το ${VESSELS.find(v => v.id === selectedVessel)?.name}`
                : `Data is saved separately for ${VESSELS.find(v => v.id === selectedVessel)?.name}`
              }
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="rounded-xl p-4 mb-4 border border-blue-300 shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-800">{lang === 'el' ? 'Πρόοδος' : 'Progress'}</span>
            <span className="text-lg font-bold text-green-700">
              ✅ {completedItems}/{totalItems} {lang === 'el' ? 'ολοκληρώθηκαν' : 'completed'} ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
            <div
              className="h-4 rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-green-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Expiry Summary */}
          {(expiredCount > 0 || warningCount > 0) && (
            <div className="flex items-center justify-between pt-2 border-t border-blue-400">
              {expiredCount > 0 && (
                <span className="text-sm font-bold text-red-600 flex items-center gap-2 animate-pulse">
                  🔴 {expiredCount} {lang === 'el' ? 'Ληγμένα!' : 'Expired!'}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-sm font-bold text-blue-600 flex items-center gap-2">
                  ⚠️ {warningCount} {lang === 'el' ? 'Προσοχή (<3 μήνες)' : 'Warning (<3 months)'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="rounded-xl p-3 mb-4 border border-blue-300 shadow-md flex flex-wrap gap-4 justify-center" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></span>
            <span className="text-green-700 font-bold text-sm">✅ OK ({'>'}3 μήνες)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-600"></span>
            <span className="text-blue-700 font-bold text-sm">⚠️ Προσοχή ({'<'}3 μήνες)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></span>
            <span className="text-red-700 font-bold text-sm">🔴 ΛΗΞΗ!</span>
          </span>
        </div>

        {/* Expand/Collapse Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={expandAll}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md transition-all hover:scale-105"
          >
            📂 {lang === 'el' ? 'Ανάπτυξη Όλων' : 'Expand All'}
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md transition-all hover:scale-105"
          >
            📁 {lang === 'el' ? 'Σύμπτυξη Όλων' : 'Collapse All'}
          </button>
        </div>

        {/* 2-Column Sections Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: ΦΑΡΜΑΚΕΙΟ & LIFE RAFT */}
          <div>
            {renderSection(SECTIONS.farmakeio)}
            {renderSection(SECTIONS.liferaft)}
          </div>
          {/* Right Column: ΠΥΡΟΤΕΧΝΙΚΑ & ΠΥΡΟΣΒΕΣΤΗΡΕΣ */}
          <div>
            {renderSection(SECTIONS.pyrotechnika)}
            {renderSection(SECTIONS.pyrosvestires)}
          </div>
        </div>

        {/* Custom Sections */}
        {Object.values(customSections).map((customSection: CustomSection) => renderSection(customSection))}

        {/* Add Section Button */}
        {canEdit && (
          showAddSection ? (
            <div className="rounded-xl p-4 mb-4 border-2 border-dashed border-blue-400" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
              <h3 className="font-bold text-gray-800 mb-3">{lang === 'el' ? 'Νέα Κατηγορία' : 'New Category'}</h3>
              <div className="flex gap-2 mb-3">
                <select
                  value={newSectionIcon}
                  onChange={(e) => setNewSectionIcon(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-lg bg-white text-2xl"
                >
                  <option value="📋">📋</option>
                  <option value="💊">💊</option>
                  <option value="🔥">🔥</option>
                  <option value="🛟">🛟</option>
                  <option value="🧯">🧯</option>
                  <option value="🩹">🩹</option>
                  <option value="⚠️">⚠️</option>
                  <option value="🆘">🆘</option>
                </select>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder={lang === 'el' ? 'Όνομα κατηγορίας...' : 'Category name...'}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addSection}
                  disabled={!selectedVessel || !newSectionName.trim()}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-bold"
                >
                  {lang === 'el' ? 'Προσθήκη' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowAddSection(false); setNewSectionName(''); setNewSectionIcon('📋'); }}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
                >
                  {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => selectedVessel && setShowAddSection(true)}
              className={`w-full mb-4 p-4 border-2 border-dashed rounded-xl transition-colors flex items-center justify-center gap-2 ${
                selectedVessel ? 'border-blue-500 text-blue-700 hover:bg-blue-100' : 'border-gray-400 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">➕</span>
              <span className="font-bold text-lg">
                {selectedVessel
                  ? (lang === 'el' ? 'Προσθήκη Κατηγορίας' : 'Add Category')
                  : (lang === 'el' ? 'Επιλέξτε σκάφος πρώτα' : 'Select vessel first')
                }
              </span>
            </button>
          )
        )}

        {/* General Notes */}
        <div className="rounded-xl p-4 mb-4 mt-4 border border-blue-300 shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            📝 {lang === 'el' ? 'Γενικές Σημειώσεις' : 'General Notes'}
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => canEdit && setGeneralNotes(e.target.value)}
            disabled={!canEdit}
            placeholder={lang === 'el' ? 'Προσθέστε σημειώσεις...' : 'Add notes...'}
            className={`w-full bg-white/90 border border-blue-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {canEdit && (
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-lg"
            >
              💾 {lang === 'el' ? 'Αποθήκευση' : 'Save'}
            </button>
          )}
          <button
            onClick={exportToExcel}
            className={`${canEdit ? 'flex-1' : 'w-full'} px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-lg`}
          >
            📊 {lang === 'el' ? 'Εξαγωγή Excel' : 'Export Excel'}
          </button>
        </div>

        {/* Save Message Toast */}
        {showSaveMessage && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold animate-pulse">
            ✅ {lang === 'el' ? 'Αποθηκεύτηκε επιτυχώς!' : 'Saved successfully!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default WinterSafetyEquipment;
