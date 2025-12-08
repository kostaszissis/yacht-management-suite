import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import * as XLSX from 'xlsx';

// Vessels list
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

// Task sections with full names (grouped logically)
const SECTIONS = {
  engine: {
    id: 'engine',
    icon: '⚙️',
    titleEl: 'ΜΗΧΑΝΗ & ΚΙΝΗΤΗΡΑΣ',
    titleEn: 'ENGINE & MOTOR',
    items: ['ΜΗΧΑΝΗ', 'ΜΙΖΑ', 'ALTERNATOR']
  },
  generator: {
    id: 'generator',
    icon: '⚡',
    titleEl: 'ΓΕΝΝΗΤΡΙΑ',
    titleEn: 'GENERATOR',
    items: ['ΓΕΝΝΗΤΡΙΑ']
  },
  propulsion: {
    id: 'propulsion',
    icon: '🔧',
    titleEl: 'ΑΞΟΝΑΣ & ΠΡΟΩΣΗ',
    titleEn: 'SHAFT & PROPULSION',
    items: ['ΑΞΟΝΑΣ ΠΡΟΠΕΛΑ', 'BOW THRUSTER']
  },
  valves: {
    id: 'valves',
    icon: '🚿',
    titleEl: 'ΒΑΝΕΣ & ΑΝΤΛΙΕΣ',
    titleEn: 'VALVES & PUMPS',
    items: ['ΒΑΝΕΣ', 'ΑΝΤΛΙΕΣ ΦΙΛΤΡΑ', 'ΣΕΝΤΙΝΕΣ']
  },
  electrical: {
    id: 'electrical',
    icon: '🔋',
    titleEl: 'ΗΛΕΚΤΡΟΛΟΓΙΚΑ',
    titleEn: 'ELECTRICAL',
    items: ['ΜΠΑΤΑΡΙΕΣ', 'ΦΩΤΑ ΕΣΩΤ', 'ΦΩΤΑ ΕΞΩΤ', 'ΗΛΕΚΤΡΟΝΙΚΑ']
  },
  deck: {
    id: 'deck',
    icon: '⚓',
    titleEl: 'ΚΑΤΑΣΤΡΩΜΑ & ΕΡΓΑΤΕΣ',
    titleEn: 'DECK & WINDLASS',
    items: ['ΕΡΓΑΤΗΣ ΗΛΕΚΤΡΙΚΟΣ', 'ΕΡΓΑΤΗΣ ΜΗΧΑΝΙΚΟΣ', 'WINCHES', 'BOW ROLLER', 'ΚΟΛΟΝΑΚΙΑ', 'ΤΙΜΟΝΙΑ']
  },
  sails: {
    id: 'sails',
    icon: '⛵',
    titleEl: 'ΠΑΝΙΑ & ΕΞΑΡΤΙΑ',
    titleEn: 'SAILS & RIGGING',
    items: ['MAIN', 'GENOA', 'ΠΑΝΙΑ ΟΛΑ', 'ΞΑΡΤΙΑ']
  },
  covers: {
    id: 'covers',
    icon: '🎪',
    titleEl: 'ΚΑΛΥΜΜΑΤΑ',
    titleEn: 'COVERS',
    items: ['BIMINI', 'SPRAYHOOD', 'LAZY BAG']
  },
  sanitary: {
    id: 'sanitary',
    icon: '🚽',
    titleEl: 'ΥΓΙΕΙΝΗ',
    titleEn: 'SANITARY',
    items: ['WC', 'HOLD TANKS']
  },
  galley: {
    id: 'galley',
    icon: '🍳',
    titleEl: 'ΚΟΥΖΙΝΑ & ΨΥΓΕΙΑ',
    titleEn: 'GALLEY & REFRIGERATION',
    items: ['ΚΟΥΖΙΝΑ', 'ΨΥΓΕΙΑ', 'WATER MAKER', 'A/C', 'LAUNDRY']
  },
  tender: {
    id: 'tender',
    icon: '🛶',
    titleEl: 'TENDER & ΕΞΩΛΕΜΒΙΟΣ',
    titleEn: 'TENDER & OUTBOARD',
    items: ['TENDER', 'OUTBOARD']
  },
  safety: {
    id: 'safety',
    icon: '🆘',
    titleEl: 'ΑΣΦΑΛΕΙΑ',
    titleEn: 'SAFETY',
    items: ['LIFE RAFT', 'ΠΥΡΟΣΒΕΣΤΗΡΕΣ', 'EPIRB']
  },
  maintenance: {
    id: 'maintenance',
    icon: '🔩',
    titleEl: 'ΣΥΝΤΗΡΗΣΗ & ΦΙΝΙΡΙΣΜΑ',
    titleEn: 'MAINTENANCE & FINISHING',
    items: ['ΜΕΝΤΕΣΕΔΕΣ', 'HATCHES', 'ΒΕΡΝΙΚΙΑ', 'ΔΙΑΚΟΣΜ ΤΑΙΝΙΕΣ', 'GEL COAT', 'ΜΟΥΡΑΒΙΑ', 'INOX', 'TEAK WONDERS', 'LOCKERS']
  },
  cleaning: {
    id: 'cleaning',
    icon: '🧹',
    titleEl: 'ΚΑΘΑΡΙΣΜΟΣ & INVENTORY',
    titleEn: 'CLEANING & INVENTORY',
    items: ['CLEAN IN', 'CLEAN OUT', 'INVENTORY', 'FUEL']
  },
  hull: {
    id: 'hull',
    icon: '🚢',
    titleEl: 'ΓΑΣΤΡΑ',
    titleEn: 'HULL',
    items: ['ΥΦΑΛΟΧΡΩΜΑΤΑ', 'ANTIFOULING', 'THRU-HULLS', 'ΑΝΟΔΙΑ', 'ΠΡΟΠΕΛΑ', 'ΑΞΟΝΑΣ', 'ΤΙΜΟΝΙ', 'ΚΑΡΙΝΑ']
  },
  electronics: {
    id: 'electronics',
    icon: '📡',
    titleEl: 'ΗΛΕΚΤΡΟΝΙΚΑ ΝΑΥΣΙΠΛΟΪΑΣ',
    titleEn: 'NAVIGATION ELECTRONICS',
    items: ['GPS / PLOTTER', 'AUTOPILOT', 'RADAR', 'AIS', 'VHF RADIO', 'WIND INSTRUMENTS', 'DEPTH SOUNDER', 'COMPASS']
  },
  aircon: {
    id: 'aircon',
    icon: '❄️',
    titleEl: 'ΚΛΙΜΑΤΙΣΜΟΣ / A/C',
    titleEn: 'AIR CONDITIONING',
    items: ['ΚΕΝΤΡΙΚΗ ΜΟΝΑΔΑ A/C', 'ΦΙΛΤΡΑ A/C', 'ΑΝΤΛΙΑ ΘΑΛΑΣΣΙΝΟΥ ΝΕΡΟΥ', 'ΕΝΑΛΛΑΚΤΗΣ ΘΕΡΜΟΤΗΤΑΣ', 'ΘΕΡΜΟΣΤΑΤΗΣ', 'ΑΕΡΑΓΩΓΟΙ', 'ΨΥΚΤΙΚΟ ΥΓΡΟ', 'ΗΛΕΚΤΡΙΚΗ ΣΥΝΔΕΣΗ']
  }
};

// Status types
type StatusType = 'OK' | '#' | '?' | '';

interface TaskItem {
  id: string;
  name: string;
  status: StatusType;
  notes: string;
  isCustom?: boolean;
}

interface SectionState {
  expanded: boolean;
  items: TaskItem[];
}

const STORAGE_KEY = 'winter_maintenance_inventory_v3';
const CUSTOM_SECTIONS_KEY = 'winter_maintenance_custom_sections';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface CustomSection {
  id: string;
  icon: string;
  titleEl: string;
  titleEn: string;
  items: string[];
}

const WinterMaintenanceInventory: React.FC = () => {
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
        items: section.items.map((name, idx) => ({
          id: `${section.id}_default_${idx}`,
          name,
          status: '' as StatusType,
          notes: '',
          isCustom: false
        }))
      };
    });
    return initial;
  };

  // Load on mount
  useEffect(() => {
    setSections(initializeDefaultSections());
    const lastVessel = localStorage.getItem('inventory_last_vessel');
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
    localStorage.setItem('inventory_last_vessel', String(selectedVessel));

    const newSections = initializeDefaultSections();
    const savedData = localStorage.getItem(`${STORAGE_KEY}_${vesselKey}`);

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        Object.keys(newSections).forEach(sectionId => {
          if (data.sections?.[sectionId]) {
            newSections[sectionId].expanded = data.sections[sectionId].expanded || false;
            newSections[sectionId].items = newSections[sectionId].items.map(defaultItem => {
              const savedItem = data.sections[sectionId].items?.find(
                (si: TaskItem) => si.name === defaultItem.name && !si.isCustom
              );
              return savedItem ? { ...defaultItem, ...savedItem } : defaultItem;
            });
            // Add custom items
            const customItems = data.sections[sectionId].items?.filter((i: TaskItem) => i.isCustom) || [];
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
        // Add custom sections to sections state
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

  // Get status style
  const getStatusStyle = (status: StatusType) => {
    switch (status) {
      case 'OK':
        return { bg: 'bg-green-500', text: 'text-white', label: 'OK', color: '#16a34a' };
      case '#':
        return { bg: 'bg-red-500', text: 'text-white', label: '#', color: '#dc2626' };
      case '?':
        return { bg: 'bg-blue-400', text: 'text-white', label: '?', color: '#60a5fa' };
      default:
        return { bg: 'bg-gray-200', text: 'text-gray-600', label: '-', color: '#9ca3af' };
    }
  };

  // Calculate progress
  const sectionValues = Object.values(sections);
  const totalItems = sectionValues.reduce((acc, s) => acc + s.items.length, 0);
  const completedItems = sectionValues.reduce((acc, s) => acc + s.items.filter(i => i.status === 'OK').length, 0);
  const pendingItems = sectionValues.reduce((acc, s) => acc + s.items.filter(i => i.status === '#').length, 0);
  const repairItems = sectionValues.reduce((acc, s) => acc + s.items.filter(i => i.status === '?').length, 0);
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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

  // Cycle status: empty → OK → # → ? → empty
  const cycleStatus = (sectionId: string, itemId: string) => {
    const statusOrder: StatusType[] = ['', 'OK', '#', '?'];
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item => {
          if (item.id === itemId) {
            const currentIndex = statusOrder.indexOf(item.status);
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
            return { ...item, status: nextStatus };
          }
          return item;
        })
      }
    }));
  };

  // Update item notes
  const updateNotes = (sectionId: string, itemId: string, notes: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item =>
          item.id === itemId ? { ...item, notes } : item
        )
      }
    }));
  };

  // Add item
  const addItem = (sectionId: string) => {
    if (!selectedVessel || !newItemName.trim()) return;
    const newItem: TaskItem = {
      id: uid(),
      name: newItemName.trim().toUpperCase(),
      status: '' as StatusType,
      notes: '',
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
      items: []
    };

    // Add to custom sections
    setCustomSections(prev => ({ ...prev, [sectionId]: newSection }));

    // Add to sections state
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        expanded: true,
        items: []
      }
    }));

    // Save custom sections to localStorage
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

    // Remove from sections state
    setSections(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });

    // Remove from custom sections if it's custom
    if (sectionId.startsWith('custom_')) {
      setCustomSections(prev => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });

      // Update localStorage
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
        data.push({
          'Κατηγορία': lang === 'el' ? sectionDef.titleEl : sectionDef.titleEn,
          'Εργασία': item.name,
          'Κατάσταση': item.status || '-',
          'Σημειώσεις': item.notes || '-'
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `Inventory_${vesselName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Get section progress
  const getSectionProgress = (sectionId: string) => {
    const section = sections[sectionId];
    if (!section) return { ok: 0, pending: 0, repair: 0, total: 0 };
    return {
      ok: section.items.filter(i => i.status === 'OK').length,
      pending: section.items.filter(i => i.status === '#').length,
      repair: section.items.filter(i => i.status === '?').length,
      total: section.items.length
    };
  };

  // Render section
  const renderSection = (sectionDef: typeof SECTIONS.engine) => {
    const section = sections[sectionDef.id];
    if (!section) return null;
    const progress = getSectionProgress(sectionDef.id);
    const isComplete = progress.ok === progress.total && progress.total > 0;

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
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">{progress.ok} OK</span>
              {progress.pending > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">{progress.pending} #</span>}
              {progress.repair > 0 && <span className="bg-blue-400 text-white text-xs px-2 py-1 rounded">{progress.repair} ?</span>}
              <span className="text-gray-700 text-xl ml-2">{section.expanded ? '▼' : '▶'}</span>
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
              const style = getStatusStyle(item.status);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg mb-2 transition-all duration-300 border hover:shadow-lg ${
                    item.status === 'OK' ? 'border-green-500 bg-green-50' :
                    item.status === '#' ? 'border-red-500 bg-red-50' :
                    item.status === '?' ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Button */}
                    <button
                      onClick={() => canEdit && cycleStatus(sectionDef.id, item.id)}
                      disabled={!canEdit}
                      className={`w-12 h-10 rounded-lg flex items-center justify-center transition-all font-bold text-sm ${
                        item.status === 'OK' ? 'bg-green-500 text-white' :
                        item.status === '#' ? 'bg-red-500 text-white' :
                        item.status === '?' ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-600 border border-gray-300'
                      } ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'hover:scale-110'}`}
                      title={lang === 'el' ? 'Κλικ για αλλαγή κατάστασης' : 'Click to change status'}
                    >
                      {style.label}
                    </button>

                    {/* Item Name */}
                    <span className={`font-bold text-base flex-1 min-w-[150px] ${
                      item.status === 'OK' ? 'text-green-700' :
                      item.status === '#' ? 'text-red-700' :
                      item.status === '?' ? 'text-blue-700' : 'text-gray-800'
                    }`}>
                      {item.name}
                    </span>

                    {/* Notes Input */}
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => canEdit && updateNotes(sectionDef.id, item.id, e.target.value)}
                      disabled={!canEdit}
                      placeholder={lang === 'el' ? 'Σημειώσεις...' : 'Notes...'}
                      className="flex-1 min-w-[180px] px-3 py-2 bg-white/90 border border-blue-300 rounded-lg text-sm text-gray-800 placeholder-gray-500"
                    />

                    {/* Delete item button */}
                    {canEdit && (
                      <button
                        onClick={() => removeItem(sectionDef.id, item.id)}
                        className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded text-sm"
                        title={lang === 'el' ? 'Διαγραφή' : 'Delete'}
                      >🗑️</button>
                    )}
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
                    placeholder={lang === 'el' ? 'Όνομα εργασίας...' : 'Task name...'}
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
                    {selectedVessel ? (lang === 'el' ? 'Προσθήκη Εργασίας' : 'Add Task') : (lang === 'el' ? 'Επιλέξτε σκάφος πρώτα' : 'Select vessel first')}
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
            📦 {lang === 'el' ? 'ΧΕΙΜΕΡΙΝΕΣ ΕΡΓΑΣΙΕΣ' : 'WINTER MAINTENANCE'}
          </h1>
          <p className="text-blue-700 text-center mt-1">
            {lang === 'el' ? 'Inventory & Συντήρηση' : 'Inventory & Maintenance'}
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
              ✅ {completedItems}/{totalItems} OK ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
            <div
              className="h-4 rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-green-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Status Summary */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-blue-400">
            <span className="text-sm font-bold text-green-600 flex items-center gap-2">
              ✅ OK: {completedItems}
            </span>
            <span className="text-sm font-bold text-red-600 flex items-center gap-2">
              # Εκκρεμεί: {pendingItems}
            </span>
            <span className="text-sm font-bold text-blue-600 flex items-center gap-2">
              ? Επισκευή: {repairItems}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-xl p-3 mb-4 border border-blue-300 shadow-md flex flex-wrap gap-4 justify-center" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <span className="flex items-center gap-2">
            <span className="w-8 h-6 rounded bg-green-500 flex items-center justify-center text-white font-bold text-xs">OK</span>
            <span className="text-green-700 font-bold text-sm">{lang === 'el' ? 'Έγινε' : 'Done'}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-6 rounded bg-red-500 flex items-center justify-center text-white font-bold text-xs">#</span>
            <span className="text-red-700 font-bold text-sm">{lang === 'el' ? 'Εκκρεμεί' : 'Pending'}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-6 rounded bg-blue-400 flex items-center justify-center text-white font-bold text-xs">?</span>
            <span className="text-blue-700 font-bold text-sm">{lang === 'el' ? 'Επισκευή' : 'Repair'}</span>
          </span>
          <span className="text-gray-600 text-xs ml-4">💡 {lang === 'el' ? 'Κλικ για αλλαγή' : 'Click to change'}</span>
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

        {/* Sections */}
        {Object.values(SECTIONS).map(sectionDef => renderSection(sectionDef))}

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
                  <option value="🔧">🔧</option>
                  <option value="⚙️">⚙️</option>
                  <option value="🔩">🔩</option>
                  <option value="⚡">⚡</option>
                  <option value="🚢">🚢</option>
                  <option value="⛵">⛵</option>
                  <option value="🎪">🎪</option>
                  <option value="🧹">🧹</option>
                  <option value="📡">📡</option>
                  <option value="🔋">🔋</option>
                  <option value="💡">💡</option>
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

export default WinterMaintenanceInventory;
