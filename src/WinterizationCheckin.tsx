import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Brand colors (matching app theme)
const brand = {
  black: "#000000",
  blue: "#3B82F6",
  pink: "#d11b65",
  successBorder: "#22c55e",
  successBg: "#d1fae5",
  navy: "#0B1D51",
  gold: "#C6A664",
  white: "#FFFFFF",
};

// Translations
const I18N = {
  en: {
    title: "WINTERIZATION CHECK-IN",
    subtitle: "End of Season Inspection",
    selectVessel: "Select Vessel",
    progress: "Progress",
    completed: "completed",
    save: "Save Draft",
    generatePDF: "Generate PDF",
    back: "Back",
    addItem: "Add Item",
    removeItem: "Remove",
    comments: "Comments",
    commentsPlaceholder: "Add notes here...",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    saved: "Saved successfully!",
    // Section titles
    equipment: "Equipment Inventory",
    hull: "Hull Inspection",
    dinghy: "Dinghy & Outboard",
    safety: "Safety Equipment",
    cabin: "Cabin Inventory",
    optional: "Optional Equipment",
    kitchen: "Kitchen / Galley",
    navigation: "Navigation",
    generator: "Generator",
    deck: "Deck Equipment",
    frontDeck: "Front Deck / Lines",
    fenders: "Fenders",
    boathook: "Boat-hook",
  },
  el: {
    title: "CHECK-IN ΧΕΙΜΕΡΙΝΗΣ ΠΕΡΙΟΔΟΥ",
    subtitle: "Επιθεώρηση Τέλους Σεζόν",
    selectVessel: "Επιλέξτε Σκάφος",
    progress: "Πρόοδος",
    completed: "ολοκληρώθηκαν",
    save: "Αποθήκευση",
    generatePDF: "Δημιουργία PDF",
    back: "Πίσω",
    addItem: "Προσθήκη",
    removeItem: "Διαγραφή",
    comments: "Σχόλια",
    commentsPlaceholder: "Προσθέστε σημειώσεις...",
    expandAll: "Ανάπτυξη Όλων",
    collapseAll: "Σύμπτυξη Όλων",
    saved: "Αποθηκεύτηκε επιτυχώς!",
    // Section titles
    equipment: "Απογραφή Εξοπλισμού",
    hull: "Επιθεώρηση Γάστρας",
    dinghy: "Λέμβος & Εξωλέμβιος",
    safety: "Εξοπλισμός Ασφαλείας",
    cabin: "Απογραφή Καμπίνας",
    optional: "Προαιρετικός Εξοπλισμός",
    kitchen: "Κουζίνα",
    navigation: "Ναυσιπλοΐα",
    generator: "Γεννήτρια",
    deck: "Εξοπλισμός Καταστρώματος",
    frontDeck: "Πλώρη / Σχοινιά",
    fenders: "Μπαλόνια",
    boathook: "Γάντζος",
  }
};

// Item labels (English / Greek)
const ITEM_LABELS: { [key: string]: { en: string; el: string } } = {
  // PAGE 2 - Equipment
  engine: { en: "Engine", el: "Κινητήρας" },
  anchor_windlass: { en: "Anchor Windlass", el: "Εργάτης Άγκυρας" },
  mainsail: { en: "Mainsail", el: "Κύριο Πανί" },
  genoa: { en: "Genoa", el: "Τζένοα" },
  autopilot: { en: "Autopilot", el: "Αυτόματος Πιλότος" },
  gps_plotter: { en: "GPS / Plotter", el: "GPS / Plotter" },
  electricity: { en: "Electricity", el: "Ηλεκτρικά" },
  fridge: { en: "Fridge", el: "Ψυγείο" },
  gas_oven: { en: "Gas Oven", el: "Φούρνος Γκαζιού" },
  electric_toilet_pump: { en: "Electric Toilet Pump", el: "Αντλία Τουαλέτας" },
  fresh_water_pump: { en: "Fresh Water Pump", el: "Αντλία Γλυκού Νερού" },
  bilge_pump: { en: "Bilge Pump", el: "Αντλία Σεντινών" },
  radio_mp3: { en: "Radio / MP3 Player", el: "Ραδιόφωνο / MP3" },
  cleanliness: { en: "Cleanliness", el: "Καθαριότητα" },
  fuel_water: { en: "Fuel / Water Levels", el: "Καύσιμα / Νερό" },
  fuel_filling: { en: "Fuel Filling", el: "Ανεφοδιασμός Καυσίμων" },
  bimini_sprayhood: { en: "Bimini / Sprayhood", el: "Bimini / Sprayhood" },
  bow_thruster: { en: "Bow Thruster", el: "Προωστήρας Πλώρης" },
  generator: { en: "Generator", el: "Γεννήτρια" },
  electric_winch: { en: "Electric Winch", el: "Ηλεκτρικό Βίντζι" },
  winch: { en: "Winch", el: "Βίντζι" },
  hydraulic_gangway: { en: "Hydraulic Gangway", el: "Υδραυλική Πασαρέλα" },
  ac: { en: "A/C", el: "Κλιματισμός" },
  water_maker: { en: "Water Maker", el: "Αφαλάτωση" },
  // PAGE 2 - Hull
  fore: { en: "Fore (Bow)", el: "Πλώρη" },
  aft: { en: "Aft (Stern)", el: "Πρύμνη" },
  port: { en: "Port Side", el: "Αριστερά" },
  starboard: { en: "Starboard Side", el: "Δεξιά" },
  // PAGE 2 - Dinghy
  dinghy: { en: "Dinghy", el: "Λέμβος" },
  outboard: { en: "Outboard Engine", el: "Εξωλέμβιος" },
  fuel_jerrycan: { en: "Fuel Jerrycan", el: "Κανίστρα Καυσίμου" },
  oars: { en: "Oars", el: "Κουπιά" },
  sea_tap: { en: "Sea Tap / Valve", el: "Βάνα Θάλασσας" },
  // PAGE 3 - Safety
  lifejackets: { en: "Lifejackets", el: "Σωσίβια" },
  flares: { en: "Flares", el: "Φωτοβολίδες" },
  first_aid: { en: "First Aid Kit", el: "Φαρμακείο" },
  fire_extinguisher: { en: "Fire Extinguisher", el: "Πυροσβεστήρας" },
  liferaft: { en: "Liferaft", el: "Σωστική Σχεδία" },
  fog_horn: { en: "Fog Horn", el: "Κόρνα Ομίχλης" },
  toolkit: { en: "Toolkit", el: "Εργαλεία" },
  // PAGE 3 - Cabin
  bed_linen: { en: "Bed Linen (all cabins)", el: "Κλινοσκεπάσματα" },
  pillows_cases: { en: "Pillows & Cases", el: "Μαξιλάρια & Θήκες" },
  blankets: { en: "Blankets", el: "Κουβέρτες" },
  bath_towels: { en: "Bath Towels", el: "Πετσέτες Μπάνιου" },
  tea_towels: { en: "Tea Towels", el: "Πετσέτες Κουζίνας" },
  wc_mats: { en: "WC Mats", el: "Χαλάκια WC" },
  hatch_large: { en: "Hatch Large", el: "Hatch Μεγάλα" },
  hatch_toilet: { en: "Hatch Toilet", el: "Hatch Τουαλέτας" },
  hatch_cabin: { en: "Hatch Cabin", el: "Hatch Καμπίνας" },
  toilet_clogging: { en: "Toilet Condition", el: "Κατάσταση Τουαλέτας" },
  // PAGE 3 - Optional
  spinnaker: { en: "Spinnaker", el: "Μπαλόνι (Spinnaker)" },
  snorkeling_gear: { en: "Snorkeling Gear", el: "Εξοπλισμός Snorkeling" },
  fishing_equipment: { en: "Fishing Equipment", el: "Εξοπλισμός Ψαρέματος" },
  bbq_grill: { en: "BBQ Grill", el: "Ψησταριά BBQ" },
  stand_up_paddle: { en: "Stand-up Paddle (SUP)", el: "SUP Board" },
  kayak: { en: "Kayak", el: "Καγιάκ" },
  control_gangway: { en: "Gangway Remote", el: "Χειριστήριο Πασαρέλας" },
  control_tv: { en: "TV Remote", el: "Χειριστήριο TV" },
  wifi_router: { en: "Wi-Fi Router", el: "Wi-Fi Router" },
  card_sd_gps: { en: "SD Card (GPS)", el: "Κάρτα SD GPS" },
  feet_for_saloon: { en: "Saloon Table Feet", el: "Πόδια Σαλονιού" },
  mattress: { en: "Mattress", el: "Στρώμα" },
  espresso_machine: { en: "Espresso Machine", el: "Μηχανή Espresso" },
  ice_maker: { en: "Ice Maker", el: "Παγομηχανή" },
  sea_scooter: { en: "Sea Scooter", el: "Θαλάσσιο Σκούτερ" },
  // PAGE 4 - Kitchen
  electric_fridge: { en: "Electric Fridge", el: "Ηλεκτρικό Ψυγείο" },
  gas_stove_4_heads: { en: "Gas Stove (4 heads)", el: "Εστία Γκαζιού (4 μάτια)" },
  dinner_plates: { en: "Dinner Plates", el: "Πιάτα Φαγητού" },
  soup_plates: { en: "Soup Plates", el: "Πιάτα Σούπας" },
  glasses_water: { en: "Water Glasses", el: "Ποτήρια Νερού" },
  glasses_wine: { en: "Wine Glasses", el: "Ποτήρια Κρασιού" },
  knives: { en: "Knives", el: "Μαχαίρια" },
  forks: { en: "Forks", el: "Πιρούνια" },
  spoons: { en: "Spoons", el: "Κουτάλια" },
  // PAGE 4 - Navigation
  vhf_dsc: { en: "VHF / DSC Radio", el: "VHF / DSC" },
  binoculars: { en: "Binoculars", el: "Κιάλια" },
  charts: { en: "Charts", el: "Ναυτικοί Χάρτες" },
  // PAGE 4 - Deck
  spare_anchor: { en: "Spare Anchor", el: "Εφεδρική Άγκυρα" },
  deck_brush: { en: "Deck Brush", el: "Βούρτσα Καταστρώματος" },
  gangway: { en: "Gangway", el: "Πασαρέλα" },
  // PAGE 4 - Front Deck
  lines_20m: { en: "Lines 20m", el: "Σχοινιά 20m" },
  lines_50m: { en: "Lines 50m", el: "Σχοινιά 50m" },
  // PAGE 4 - Dinghy (additional)
  inflatable_dinghy: { en: "Inflatable Dinghy", el: "Φουσκωτή Βάρκα" },
  air_pump: { en: "Air Pump", el: "Αντλία Αέρα" },
  // PAGE 4 - Fenders
  bow_fenders: { en: "Bow Fenders", el: "Μπαλόνια Πλώρης" },
  stern_fenders: { en: "Stern Fenders", el: "Μπαλόνια Πρύμνης" },
  // PAGE 4 - Boathook
  telescopic_boathook: { en: "Telescopic Boat-hook", el: "Τηλεσκοπικός Γάντζος" },
};

// Section definitions with their items
const SECTIONS = [
  {
    id: "equipment",
    titleKey: "equipment",
    icon: "🔧",
    items: ["engine", "anchor_windlass", "mainsail", "genoa", "autopilot", "gps_plotter", "electricity", "fridge", "gas_oven", "electric_toilet_pump", "fresh_water_pump", "bilge_pump", "radio_mp3", "cleanliness", "fuel_water", "fuel_filling", "bimini_sprayhood", "bow_thruster", "generator", "electric_winch", "winch", "hydraulic_gangway", "ac", "water_maker"]
  },
  {
    id: "hull",
    titleKey: "hull",
    icon: "🚤",
    items: ["fore", "aft", "port", "starboard"]
  },
  {
    id: "dinghy",
    titleKey: "dinghy",
    icon: "🛶",
    items: ["dinghy", "inflatable_dinghy", "outboard", "fuel_jerrycan", "oars", "air_pump", "sea_tap"]
  },
  {
    id: "safety",
    titleKey: "safety",
    icon: "🆘",
    items: ["lifejackets", "flares", "first_aid", "fire_extinguisher", "liferaft", "fog_horn", "toolkit"]
  },
  {
    id: "cabin",
    titleKey: "cabin",
    icon: "🛏️",
    items: ["bed_linen", "pillows_cases", "blankets", "bath_towels", "tea_towels", "wc_mats", "hatch_large", "hatch_toilet", "hatch_cabin", "toilet_clogging"]
  },
  {
    id: "kitchen",
    titleKey: "kitchen",
    icon: "🍳",
    items: ["electric_fridge", "gas_stove_4_heads", "dinner_plates", "soup_plates", "glasses_water", "glasses_wine", "knives", "forks", "spoons"]
  },
  {
    id: "navigation",
    titleKey: "navigation",
    icon: "🧭",
    items: ["gps_plotter", "vhf_dsc", "binoculars", "charts"]
  },
  {
    id: "deck",
    titleKey: "deck",
    icon: "⚓",
    items: ["spare_anchor", "deck_brush", "gangway"]
  },
  {
    id: "frontDeck",
    titleKey: "frontDeck",
    icon: "🪢",
    items: ["lines_20m", "lines_50m"]
  },
  {
    id: "fenders",
    titleKey: "fenders",
    icon: "🔵",
    items: ["bow_fenders", "stern_fenders"]
  },
  {
    id: "boathook",
    titleKey: "boathook",
    icon: "🪝",
    items: ["telescopic_boathook"]
  },
  {
    id: "optional",
    titleKey: "optional",
    icon: "✨",
    items: ["spinnaker", "snorkeling_gear", "fishing_equipment", "bbq_grill", "stand_up_paddle", "kayak", "control_gangway", "control_tv", "wifi_router", "card_sd_gps", "feet_for_saloon", "mattress", "espresso_machine", "ice_maker", "sea_scooter"]
  }
];

// Vessel list
const VESSELS = [
  { id: 1, name: "Maria 1" },
  { id: 2, name: "Maria 2" },
  { id: 3, name: "Valesia" },
  { id: 4, name: "Bar Bar" },
  { id: 5, name: "Kalispera" },
  { id: 6, name: "Infinity" },
  { id: 7, name: "Perla" },
  { id: 8, name: "Bob" },
];

interface ChecklistItem {
  id: string;
  key: string;
  checked: boolean;
  qty: number;
  replaceQty: number;
  comments: string;
  isCustom?: boolean;
}

interface SectionState {
  expanded: boolean;
  items: ChecklistItem[];
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function WinterizationCheckin() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"en" | "el">("en");
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);
  const [sections, setSections] = useState<{ [key: string]: SectionState }>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // Check if user is owner (view-only access)
  const isOwnerUser = authService.isOwner();
  const canEdit = !isOwnerUser;

  const t = I18N[lang];

  // Get vessel name by ID
  const getVesselName = (vesselId: number | null): string => {
    if (!vesselId) return '';
    const vessel = VESSELS.find(v => v.id === vesselId);
    return vessel ? vessel.name.replace(/\s+/g, '_').toLowerCase() : '';
  };

  // Initialize default sections (without vessel-specific data)
  const initializeDefaultSections = (): { [key: string]: SectionState } => {
    const initialSections: { [key: string]: SectionState } = {};
    SECTIONS.forEach(section => {
      initialSections[section.id] = {
        expanded: false,
        items: section.items.map(itemKey => ({
          id: `default_${section.id}_${itemKey}`,
          key: itemKey,
          checked: false,
          qty: 1,
          replaceQty: 0,
          comments: "",
          isCustom: false
        }))
      };
    });
    return initialSections;
  };

  // Initialize sections on mount (default items only)
  useEffect(() => {
    setSections(initializeDefaultSections());

    // Load last selected vessel
    const lastVessel = localStorage.getItem('winterization_last_vessel');
    if (lastVessel) {
      setSelectedVessel(Number(lastVessel));
    }
  }, []);

  // Load vessel-specific data when vessel changes
  useEffect(() => {
    if (!selectedVessel) {
      // Reset to defaults if no vessel selected
      setSections(initializeDefaultSections());
      setGeneralNotes('');
      return;
    }

    const vesselKey = getVesselName(selectedVessel);

    // Save last selected vessel
    localStorage.setItem('winterization_last_vessel', String(selectedVessel));

    // Start with fresh default sections
    const newSections = initializeDefaultSections();

    // Load vessel-specific item data (checked status, qty, comments, replaceQty)
    const savedData = localStorage.getItem(`winterization_${vesselKey}_data`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);

        // Apply saved data to default items
        Object.keys(newSections).forEach(sectionId => {
          if (data.sections?.[sectionId]?.items) {
            newSections[sectionId].items = newSections[sectionId].items.map(defaultItem => {
              const savedItem = data.sections[sectionId].items.find(
                (si: ChecklistItem) => si.key === defaultItem.key && !si.isCustom
              );
              if (savedItem) {
                return {
                  ...defaultItem,
                  checked: savedItem.checked || false,
                  qty: savedItem.qty ?? 1,
                  replaceQty: savedItem.replaceQty ?? 0,
                  comments: savedItem.comments || ''
                };
              }
              return defaultItem;
            });

            // Restore expanded state
            if (data.sections[sectionId].expanded !== undefined) {
              newSections[sectionId].expanded = data.sections[sectionId].expanded;
            }
          }
        });

        // Load general notes
        if (data.generalNotes) {
          setGeneralNotes(data.generalNotes);
        } else {
          setGeneralNotes('');
        }
      } catch (e) {
        console.error('Error loading vessel data:', e);
      }
    } else {
      setGeneralNotes('');
    }

    // Load vessel-specific custom items
    const savedCustomItems = localStorage.getItem(`winterization_${vesselKey}_custom_items`);
    if (savedCustomItems) {
      try {
        const customData = JSON.parse(savedCustomItems);

        // Add custom items to appropriate sections
        Object.keys(customData).forEach(sectionId => {
          if (newSections[sectionId] && Array.isArray(customData[sectionId])) {
            customData[sectionId].forEach((customItem: ChecklistItem) => {
              newSections[sectionId].items.push({
                ...customItem,
                isCustom: true
              });
            });
          }
        });
      } catch (e) {
        console.error('Error loading custom items:', e);
      }
    }

    setSections(newSections);
  }, [selectedVessel]);

  // Calculate progress
  const sectionValues = Object.values(sections) as SectionState[];
  const totalItems = sectionValues.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = sectionValues.reduce((acc, section) =>
    acc + section.items.filter(item => item.checked).length, 0);
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate items needing replacement
  const itemsNeedingReplacement = sectionValues.reduce((acc, section) =>
    acc + section.items.filter(item => item.replaceQty > 0).length, 0);
  const totalReplacementQty = sectionValues.reduce((acc, section) =>
    acc + section.items.reduce((sum, item) => sum + item.replaceQty, 0), 0);

  // Toggle section expansion
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

  // Update item comments
  const updateComments = (sectionId: string, itemId: string, comments: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item =>
          item.id === itemId ? { ...item, comments } : item
        )
      }
    }));
  };

  // Update quantity
  const updateQty = (sectionId: string, itemId: string, delta: number) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item =>
          item.id === itemId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
      }
    }));
  };

  // Update replace quantity
  const updateReplaceQty = (sectionId: string, itemId: string, delta: number) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.map(item =>
          item.id === itemId ? { ...item, replaceQty: Math.max(0, item.replaceQty + delta) } : item
        )
      }
    }));
  };

  // Add custom item (per-vessel only)
  const addItem = (sectionId: string) => {
    if (!selectedVessel) {
      alert(lang === 'el' ? 'Πρέπει να επιλέξετε σκάφος πρώτα!' : 'Please select a vessel first!');
      return;
    }

    const vesselName = VESSELS.find(v => v.id === selectedVessel)?.name || '';
    const itemName = prompt(
      lang === 'el'
        ? `Όνομα νέου αντικειμένου:\n(Προστίθεται μόνο στο ${vesselName})`
        : `New item name:\n(Adding to ${vesselName} only)`
    );
    if (!itemName?.trim()) return;

    const newItem: ChecklistItem = {
      id: uid(),
      key: itemName.trim(),
      checked: false,
      qty: 1,
      replaceQty: 0,
      comments: "",
      isCustom: true
    };

    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: [...prev[sectionId].items, newItem]
      }
    }));

    // Save custom item to vessel-specific storage immediately
    const vesselKey = getVesselName(selectedVessel);
    const storageKey = `winterization_${vesselKey}_custom_items`;
    let customItems: { [key: string]: ChecklistItem[] } = {};

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        customItems = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading custom items:', e);
      }
    }

    if (!customItems[sectionId]) {
      customItems[sectionId] = [];
    }
    customItems[sectionId].push(newItem);

    localStorage.setItem(storageKey, JSON.stringify(customItems));
  };

  // Remove custom item (per-vessel only)
  const removeItem = (sectionId: string, itemId: string) => {
    if (!selectedVessel) return;
    if (!window.confirm(lang === 'el' ? 'Διαγραφή αντικειμένου;' : 'Remove item?')) return;

    // Find the item to get its key for storage removal
    const itemToRemove = sections[sectionId]?.items.find((item: ChecklistItem) => item.id === itemId);

    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.filter(item => item.id !== itemId)
      }
    }));

    // Remove from vessel-specific custom items storage
    if (itemToRemove?.isCustom) {
      const vesselKey = getVesselName(selectedVessel);
      const storageKey = `winterization_${vesselKey}_custom_items`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        try {
          const customItems = JSON.parse(saved);
          if (customItems[sectionId]) {
            customItems[sectionId] = customItems[sectionId].filter(
              (item: ChecklistItem) => item.id !== itemId
            );
            localStorage.setItem(storageKey, JSON.stringify(customItems));
          }
        } catch (e) {
          console.error('Error updating custom items:', e);
        }
      }
    }
  };

  // Save data (vessel-specific)
  const handleSave = () => {
    if (!selectedVessel) {
      alert(lang === 'el' ? 'Πρέπει να επιλέξετε σκάφος πρώτα!' : 'Please select a vessel first!');
      return;
    }

    const vesselKey = getVesselName(selectedVessel);

    // Prepare sections data (only default items with their checked/qty/comments)
    const sectionsToSave: { [key: string]: { expanded: boolean; items: ChecklistItem[] } } = {};
    Object.keys(sections).forEach(sectionId => {
      sectionsToSave[sectionId] = {
        expanded: sections[sectionId].expanded,
        items: sections[sectionId].items.filter((item: ChecklistItem) => !item.isCustom)
      };
    });

    // Save vessel-specific data (default item states + general notes)
    const data = {
      sections: sectionsToSave,
      generalNotes,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`winterization_${vesselKey}_data`, JSON.stringify(data));

    // Update custom items storage (in case any were modified)
    const customItems: { [key: string]: ChecklistItem[] } = {};
    Object.keys(sections).forEach(sectionId => {
      const sectionCustomItems = sections[sectionId].items.filter((item: ChecklistItem) => item.isCustom);
      if (sectionCustomItems.length > 0) {
        customItems[sectionId] = sectionCustomItems;
      }
    });
    localStorage.setItem(`winterization_${vesselKey}_custom_items`, JSON.stringify(customItems));

    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  // Get label for item
  const getLabel = (key: string) => {
    return ITEM_LABELS[key]?.[lang] || key;
  };

  // Get section completed count
  const getSectionProgress = (sectionId: string) => {
    const section = sections[sectionId];
    if (!section) return { completed: 0, total: 0 };
    const completed = section.items.filter((item: ChecklistItem) => item.checked).length;
    return { completed, total: section.items.length };
  };

  // Export to Word document
  const handleExportWord = async () => {
    if (!selectedVessel) {
      alert(lang === 'el' ? 'Πρέπει να επιλέξετε σκάφος πρώτα!' : 'Please select a vessel first!');
      return;
    }

    const vesselName = VESSELS.find(v => v.id === selectedVessel)?.name || 'Unknown';
    const currentDate = new Date().toLocaleDateString('el-GR');

    // Build document sections
    const docChildren: (Paragraph | Table)[] = [];

    // Title
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '❄️ WINTERIZATION CHECK-IN',
            bold: true,
            size: 48,
            color: '0891B2', // teal
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Vessel and Date
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Σκάφος: ', bold: true, size: 28 }),
          new TextRun({ text: vesselName, size: 28 }),
          new TextRun({ text: '    |    ', size: 28 }),
          new TextRun({ text: 'Ημερομηνία: ', bold: true, size: 28 }),
          new TextRun({ text: currentDate, size: 28 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Progress Summary
    const sectionVals = Object.values(sections) as SectionState[];
    const totalItems = sectionVals.reduce((acc, s) => acc + s.items.length, 0);
    const completedItems = sectionVals.reduce(
      (acc, s) => acc + s.items.filter((i: ChecklistItem) => i.checked).length, 0
    );
    const replacementItems = sectionVals.reduce(
      (acc, s) => acc + s.items.filter((i: ChecklistItem) => i.replaceQty > 0).length, 0
    );

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `✅ Ολοκληρώθηκαν: ${completedItems}/${totalItems}`, bold: true, size: 24 }),
          new TextRun({ text: '    |    ', size: 24 }),
          new TextRun({ text: `🔴 Αντικαταστάσεις: ${replacementItems}`, bold: true, size: 24, color: 'DC2626' }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Sections
    SECTIONS.forEach(sectionDef => {
      const sectionState = sections[sectionDef.id];
      if (!sectionState) return;

      const sectionTitle = I18N[lang][sectionDef.titleKey as keyof typeof I18N['en']] || sectionDef.titleKey;

      // Section Header
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${sectionDef.icon} ${sectionTitle}`,
              bold: true,
              size: 28,
              color: '0D9488', // teal
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      // Items Table
      const tableRows: TableRow[] = [];

      // Header row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'OK', bold: true, size: 20 })] })],
              width: { size: 8, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: lang === 'el' ? 'Αντικείμενο' : 'Item', bold: true, size: 20 })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: lang === 'el' ? 'Ποσότ.' : 'Qty', bold: true, size: 20 })] })],
              width: { size: 10, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: lang === 'el' ? 'Αντ/ση' : 'Replace', bold: true, size: 20 })] })],
              width: { size: 12, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: lang === 'el' ? 'Σχόλια' : 'Comments', bold: true, size: 20 })] })],
              width: { size: 40, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );

      // Item rows
      sectionState.items.forEach((item: ChecklistItem) => {
        const itemLabel = item.isCustom ? item.key : getLabel(item.key);
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: item.checked ? '✓' : '✗',
                    size: 20,
                    color: item.checked ? '16A34A' : 'DC2626',
                  })],
                  alignment: AlignmentType.CENTER,
                })],
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: itemLabel,
                    size: 20,
                    color: item.replaceQty > 0 ? 'DC2626' : '000000',
                  })],
                })],
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: String(item.qty), size: 20 })],
                  alignment: AlignmentType.CENTER,
                })],
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: item.replaceQty > 0 ? String(item.replaceQty) : '-',
                    size: 20,
                    color: item.replaceQty > 0 ? 'DC2626' : '9CA3AF',
                    bold: item.replaceQty > 0,
                  })],
                  alignment: AlignmentType.CENTER,
                })],
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: item.comments || '-', size: 18, italics: !item.comments })],
                })],
              }),
            ],
          })
        );
      });

      docChildren.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    });

    // General Notes
    if (generalNotes) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: lang === 'el' ? '📝 Γενικές Σημειώσεις:' : '📝 General Notes:',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        })
      );
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: generalNotes, size: 22 })],
          spacing: { after: 200 },
        })
      );
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    // Generate and save
    try {
      const blob = await Packer.toBlob(doc);
      const fileName = `Winterization_${vesselName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert(lang === 'el' ? 'Σφάλμα κατά τη δημιουργία του εγγράφου' : 'Error generating document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              ← {t.back}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "el" : "en")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold"
            >
              {lang === "en" ? "🇬🇷 EL" : "🇬🇧 EN"}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-teal-400 text-center">❄️ {t.title}</h1>
          <p className="text-gray-400 text-center mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* View-Only Banner for Owners */}
        {isOwnerUser && (
          <div className="mb-4 p-4 bg-blue-900 rounded-xl text-center border border-blue-600">
            <div className="flex items-center justify-center gap-3 text-blue-200">
              <span className="text-2xl">👁️</span>
              <div>
                <span className="font-bold text-lg">
                  {lang === 'el' ? 'Προβολή μόνο' : 'View only'}
                </span>
                <p className="text-xs text-blue-300 mt-1">
                  {lang === 'el'
                    ? 'Ως ιδιοκτήτης, μπορείτε να δείτε αλλά όχι να επεξεργαστείτε'
                    : 'As owner, you can view but not edit'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vessel Selection */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">{t.selectVessel}</label>
          <select
            value={selectedVessel || ""}
            onChange={(e) => setSelectedVessel(Number(e.target.value) || null)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{lang === 'el' ? '-- Επιλέξτε --' : '-- Select --'}</option>
            {VESSELS.map(vessel => (
              <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
            ))}
          </select>
          {selectedVessel && (
            <p className="mt-2 text-xs text-blue-400 flex items-center gap-1">
              💾 {lang === 'el'
                ? `Τα δεδομένα αποθηκεύονται ξεχωριστά για το ${VESSELS.find(v => v.id === selectedVessel)?.name}`
                : `Data is saved separately for ${VESSELS.find(v => v.id === selectedVessel)?.name}`
              }
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">{t.progress}</span>
            <span className="text-lg font-bold text-teal-400">
              ✅ {completedItems}/{totalItems} {t.completed} ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-3">
            <div
              className="bg-gradient-to-r from-teal-500 to-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Replacement Summary */}
          {itemsNeedingReplacement > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-sm font-medium text-red-400 flex items-center gap-2">
                🔴 {lang === 'el' ? 'Αντικαταστάσεις:' : 'Replacements:'}
              </span>
              <span className="text-lg font-bold text-red-400">
                {itemsNeedingReplacement} {lang === 'el' ? 'είδη' : 'items'} ({totalReplacementQty} {lang === 'el' ? 'τεμάχια' : 'pcs'})
              </span>
            </div>
          )}
        </div>

        {/* Expand/Collapse Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={expandAll}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
          >
            📂 {t.expandAll}
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
          >
            📁 {t.collapseAll}
          </button>
        </div>

        {/* Sections */}
        {SECTIONS.map(section => {
          const sectionState = sections[section.id];
          if (!sectionState) return null;

          const progress = getSectionProgress(section.id);
          const isComplete = progress.completed === progress.total && progress.total > 0;

          return (
            <div key={section.id} className="bg-gray-800 rounded-xl mb-3 border border-gray-700 overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  isComplete ? 'bg-green-900/30' : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  <span className="font-bold text-lg">{t[section.titleKey as keyof typeof t]}</span>
                  {isComplete && <span className="text-green-400 text-xl">✓</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    isComplete ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {progress.completed}/{progress.total}
                  </span>
                  <span className="text-gray-400 text-xl">
                    {sectionState.expanded ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {/* Section Content */}
              {sectionState.expanded && (
                <div className="p-4 pt-0 border-t border-gray-700">
                  {sectionState.items.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg mb-2 transition-colors border ${
                        item.replaceQty > 0
                          ? 'bg-red-900/30 border-red-500'
                          : item.checked
                            ? 'bg-green-900/20 border-green-700'
                            : 'bg-gray-700/50 border-gray-600'
                      }`}
                    >
                      {/* LINE 1: Checkbox + Name + Qty + Comments */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* OK Checkbox */}
                        <button
                          onClick={() => canEdit && toggleItem(section.id, item.id)}
                          disabled={!canEdit}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            item.checked
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-500 hover:border-green-400'
                          } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title={canEdit ? "OK" : (lang === 'el' ? 'Μόνο προβολή' : 'View only')}
                        >
                          {item.checked ? '✓' : ''}
                        </button>

                        {/* Item Name */}
                        <span className={`font-medium min-w-[120px] flex-shrink-0 ${
                          item.replaceQty > 0 ? 'text-red-300' : item.checked ? 'text-green-300' : 'text-white'
                        }`}>
                          {item.isCustom ? item.key : getLabel(item.key)}
                        </span>

                        {/* Quantity Controls */}
                        <div className={`flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1 flex-shrink-0 ${!canEdit ? 'opacity-60' : ''}`}>
                          <span className="text-xs text-gray-400 mr-1">🔢</span>
                          <button
                            onClick={() => canEdit && updateQty(section.id, item.id, -1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white font-medium">{item.qty}</span>
                          <button
                            onClick={() => canEdit && updateQty(section.id, item.id, 1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            +
                          </button>
                        </div>

                        {/* Comments Input */}
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => canEdit && updateComments(section.id, item.id, e.target.value)}
                          disabled={!canEdit}
                          placeholder={t.commentsPlaceholder}
                          className={`flex-1 min-w-[150px] bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />

                        {/* Lock icon for default items / Delete button for custom items */}
                        {item.isCustom && canEdit ? (
                          <button
                            onClick={() => removeItem(section.id, item.id)}
                            className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded text-sm flex-shrink-0"
                            title={lang === 'el' ? 'Διαγραφή' : 'Delete'}
                          >
                            🗑️
                          </button>
                        ) : (
                          <span
                            className="px-2 py-1 text-gray-500 text-sm flex-shrink-0"
                            title={lang === 'el' ? 'Προκαθορισμένο (δεν διαγράφεται)' : 'Default item (cannot delete)'}
                          >
                            🔒
                          </span>
                        )}
                      </div>

                      {/* LINE 2: Replace Button + Replace Qty */}
                      <div className={`flex items-center gap-2 mt-2 ml-10 ${!canEdit ? 'opacity-60' : ''}`}>
                        <button
                          onClick={() => canEdit && (item.replaceQty === 0 ? updateReplaceQty(section.id, item.id, 1) : updateReplaceQty(section.id, item.id, -item.replaceQty))}
                          disabled={!canEdit}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                            item.replaceQty > 0
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white border border-gray-600 hover:border-red-600'
                          } ${!canEdit ? 'cursor-not-allowed' : ''}`}
                        >
                          🔴 {lang === 'el' ? 'Αντικατάσταση' : 'Replace'}
                        </button>

                        {/* Replace Quantity Controls */}
                        <div className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                          item.replaceQty > 0 ? 'bg-red-900/50' : 'bg-gray-800'
                        }`}>
                          <button
                            onClick={() => canEdit && updateReplaceQty(section.id, item.id, -1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            -
                          </button>
                          <span className={`w-8 text-center font-medium ${
                            item.replaceQty > 0 ? 'text-red-300' : 'text-gray-400'
                          }`}>
                            {item.replaceQty}
                          </span>
                          <button
                            onClick={() => canEdit && updateReplaceQty(section.id, item.id, 1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            +
                          </button>
                        </div>

                        {item.replaceQty > 0 && (
                          <span className="text-red-400 text-xs font-medium animate-pulse">
                            ⚠️ {lang === 'el' ? 'Χρειάζεται αντικατάσταση!' : 'Needs replacement!'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Item Button - Hidden for owners */}
                  {canEdit && (
                    <button
                      onClick={() => addItem(section.id)}
                      className={`w-full mt-2 p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedVessel
                          ? 'border-blue-500 text-blue-400 hover:text-blue-300 hover:border-blue-400 hover:bg-blue-900/20'
                          : 'border-gray-600 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xl">➕</span>
                      <span className="font-medium">
                        {selectedVessel
                          ? `${t.addItem} (${VESSELS.find(v => v.id === selectedVessel)?.name})`
                          : lang === 'el' ? 'Επιλέξτε σκάφος πρώτα' : 'Select vessel first'
                        }
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* General Notes */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📝 {lang === 'el' ? 'Γενικές Σημειώσεις' : 'General Notes'}
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => canEdit && setGeneralNotes(e.target.value)}
            disabled={!canEdit}
            placeholder={t.commentsPlaceholder}
            className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {/* Save Button - Hidden for owners */}
          {canEdit && (
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-4 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg font-bold transition-colors"
            >
              💾 {t.save}
            </button>
          )}
          {/* Word Export Button */}
          <button
            onClick={handleExportWord}
            className={`${canEdit ? 'flex-1' : 'w-full'} px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-bold transition-colors`}
          >
            📄 {lang === 'el' ? 'Εξαγωγή Word' : 'Export Word'}
          </button>
        </div>

        {/* Save Message Toast */}
        {showSaveMessage && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold animate-pulse">
            ✅ {t.saved}
          </div>
        )}
      </div>
    </div>
  );
}
