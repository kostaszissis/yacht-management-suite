import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import authService from './authService';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Task category definitions with items
const TASK_CATEGORIES: { [key: string]: {
  icon: string;
  nameEl: string;
  nameEn: string;
  color: string;
  sections: {
    id: string;
    titleEl: string;
    titleEn: string;
    icon: string;
    items: { key: string; el: string; en: string }[]
  }[]
}} = {
  engine: {
    icon: '⚙️',
    nameEl: 'ΜΗΧΑΝΗ',
    nameEn: 'ENGINE',
    color: '#3b82f6', // blue
    sections: [
      {
        id: 'oil_system',
        titleEl: 'Σύστημα Λαδιού',
        titleEn: 'Oil System',
        icon: '🛢️',
        items: [
          { key: 'oil_level', el: 'Έλεγχος στάθμης λαδιού', en: 'Oil level check' },
          { key: 'oil_change', el: 'Αλλαγή λαδιού', en: 'Oil change' },
          { key: 'oil_filter', el: 'Φίλτρο λαδιού', en: 'Oil filter' },
          { key: 'oil_leaks', el: 'Έλεγχος διαρροών λαδιού', en: 'Oil leak check' },
        ]
      },
      {
        id: 'fuel_system',
        titleEl: 'Σύστημα Καυσίμων',
        titleEn: 'Fuel System',
        icon: '⛽',
        items: [
          { key: 'fuel_filter', el: 'Φίλτρο καυσίμου', en: 'Fuel filter' },
          { key: 'fuel_lines', el: 'Σωληνώσεις καυσίμων', en: 'Fuel lines' },
          { key: 'fuel_pump', el: 'Αντλία καυσίμων', en: 'Fuel pump' },
          { key: 'water_separator', el: 'Διαχωριστής νερού', en: 'Water separator' },
        ]
      },
      {
        id: 'cooling_system',
        titleEl: 'Σύστημα Ψύξης',
        titleEn: 'Cooling System',
        icon: '❄️',
        items: [
          { key: 'coolant_level', el: 'Στάθμη ψυκτικού', en: 'Coolant level' },
          { key: 'coolant_condition', el: 'Κατάσταση ψυκτικού', en: 'Coolant condition' },
          { key: 'water_pump', el: 'Αντλία νερού', en: 'Water pump' },
          { key: 'thermostat', el: 'Θερμοστάτης', en: 'Thermostat' },
          { key: 'heat_exchanger', el: 'Εναλλάκτης θερμότητας', en: 'Heat exchanger' },
          { key: 'raw_water_impeller', el: 'Φτερωτή θαλασσινού νερού', en: 'Raw water impeller' },
        ]
      },
      {
        id: 'belt_system',
        titleEl: 'Ιμάντες & Τροχαλίες',
        titleEn: 'Belts & Pulleys',
        icon: '🔄',
        items: [
          { key: 'alternator_belt', el: 'Ιμάντας δυναμό', en: 'Alternator belt' },
          { key: 'water_pump_belt', el: 'Ιμάντας αντλίας νερού', en: 'Water pump belt' },
          { key: 'belt_tension', el: 'Τάνυση ιμάντων', en: 'Belt tension' },
          { key: 'pulleys_condition', el: 'Κατάσταση τροχαλιών', en: 'Pulleys condition' },
        ]
      },
      {
        id: 'electrical',
        titleEl: 'Ηλεκτρικά Μηχανής',
        titleEn: 'Engine Electrical',
        icon: '⚡',
        items: [
          { key: 'starter_motor', el: 'Μίζα', en: 'Starter motor' },
          { key: 'alternator', el: 'Δυναμό', en: 'Alternator' },
          { key: 'glow_plugs', el: 'Προθερμαντήρες', en: 'Glow plugs' },
          { key: 'wiring', el: 'Καλωδίωση', en: 'Wiring' },
        ]
      },
    ]
  },
  generator: {
    icon: '⚡',
    nameEl: 'ΓΕΝΝΗΤΡΙΑ',
    nameEn: 'GENERATOR',
    color: '#3b82f6', // blue
    sections: [
      {
        id: 'gen_oil',
        titleEl: 'Σύστημα Λαδιού',
        titleEn: 'Oil System',
        icon: '🛢️',
        items: [
          { key: 'gen_oil_level', el: 'Στάθμη λαδιού', en: 'Oil level' },
          { key: 'gen_oil_change', el: 'Αλλαγή λαδιού', en: 'Oil change' },
          { key: 'gen_oil_filter', el: 'Φίλτρο λαδιού', en: 'Oil filter' },
        ]
      },
      {
        id: 'gen_fuel',
        titleEl: 'Σύστημα Καυσίμων',
        titleEn: 'Fuel System',
        icon: '⛽',
        items: [
          { key: 'gen_fuel_filter', el: 'Φίλτρο καυσίμου', en: 'Fuel filter' },
          { key: 'gen_fuel_lines', el: 'Σωληνώσεις καυσίμων', en: 'Fuel lines' },
        ]
      },
      {
        id: 'gen_cooling',
        titleEl: 'Σύστημα Ψύξης',
        titleEn: 'Cooling System',
        icon: '❄️',
        items: [
          { key: 'gen_coolant', el: 'Ψυκτικό υγρό', en: 'Coolant' },
          { key: 'gen_impeller', el: 'Φτερωτή', en: 'Impeller' },
          { key: 'gen_heat_exchanger', el: 'Εναλλάκτης θερμότητας', en: 'Heat exchanger' },
        ]
      },
      {
        id: 'gen_electrical',
        titleEl: 'Ηλεκτρικά',
        titleEn: 'Electrical',
        icon: '🔌',
        items: [
          { key: 'gen_battery', el: 'Μπαταρία εκκίνησης', en: 'Start battery' },
          { key: 'gen_output', el: 'Έξοδος ρεύματος', en: 'Power output' },
          { key: 'gen_control_panel', el: 'Πίνακας ελέγχου', en: 'Control panel' },
          { key: 'gen_hours', el: 'Ώρες λειτουργίας', en: 'Operating hours' },
        ]
      },
    ]
  },
  shaft: {
    icon: '🔧',
    nameEl: 'ΑΞΟΝΑΣ',
    nameEn: 'SHAFT',
    color: '#3b82f6', // blue
    sections: [
      {
        id: 'shaft_main',
        titleEl: 'Άξονας & Προπέλα',
        titleEn: 'Shaft & Propeller',
        icon: '🔩',
        items: [
          { key: 'shaft_alignment', el: 'Ευθυγράμμιση άξονα', en: 'Shaft alignment' },
          { key: 'shaft_bearing', el: 'Ρουλεμάν άξονα', en: 'Shaft bearing' },
          { key: 'propeller_condition', el: 'Κατάσταση προπέλας', en: 'Propeller condition' },
          { key: 'propeller_zinc', el: 'Ψευδάργυρος προπέλας', en: 'Propeller zinc' },
          { key: 'shaft_zinc', el: 'Ψευδάργυρος άξονα', en: 'Shaft zinc' },
        ]
      },
      {
        id: 'shaft_seal',
        titleEl: 'Στεγανοποίηση',
        titleEn: 'Sealing',
        icon: '💧',
        items: [
          { key: 'shaft_seal', el: 'Τσιμούχα άξονα', en: 'Shaft seal' },
          { key: 'stuffing_box', el: 'Στυπιοθλίπτης', en: 'Stuffing box' },
          { key: 'drip_rate', el: 'Ρυθμός στάξης', en: 'Drip rate' },
        ]
      },
      {
        id: 'shaft_coupling',
        titleEl: 'Σύνδεση',
        titleEn: 'Coupling',
        icon: '🔗',
        items: [
          { key: 'coupling_condition', el: 'Κατάσταση σύμπλεξης', en: 'Coupling condition' },
          { key: 'coupling_bolts', el: 'Μπουλόνια σύμπλεξης', en: 'Coupling bolts' },
          { key: 'flexible_coupling', el: 'Ελαστική σύμπλεξη', en: 'Flexible coupling' },
        ]
      },
    ]
  },
  valves: {
    icon: '🚿',
    nameEl: 'ΒΑΝΕΣ ΘΑΛΑΣΣΗΣ',
    nameEn: 'SEA VALVES',
    color: '#3b82f6', // blue
    sections: [
      {
        id: 'engine_valves',
        titleEl: 'Βάνες Μηχανής',
        titleEn: 'Engine Valves',
        icon: '⚙️',
        items: [
          { key: 'engine_intake', el: 'Εισαγωγή ψύξης μηχανής', en: 'Engine cooling intake' },
          { key: 'engine_discharge', el: 'Εξαγωγή ψύξης μηχανής', en: 'Engine cooling discharge' },
        ]
      },
      {
        id: 'generator_valves',
        titleEl: 'Βάνες Γεννήτριας',
        titleEn: 'Generator Valves',
        icon: '⚡',
        items: [
          { key: 'gen_intake', el: 'Εισαγωγή ψύξης γεννήτριας', en: 'Generator cooling intake' },
          { key: 'gen_discharge', el: 'Εξαγωγή ψύξης γεννήτριας', en: 'Generator cooling discharge' },
        ]
      },
      {
        id: 'sanitary_valves',
        titleEl: 'Βάνες Υγιεινής',
        titleEn: 'Sanitary Valves',
        icon: '🚽',
        items: [
          { key: 'toilet_intake', el: 'Εισαγωγή WC', en: 'Toilet intake' },
          { key: 'toilet_discharge', el: 'Εξαγωγή WC', en: 'Toilet discharge' },
          { key: 'sink_discharge', el: 'Εξαγωγή νεροχύτη', en: 'Sink discharge' },
          { key: 'shower_discharge', el: 'Εξαγωγή ντους', en: 'Shower discharge' },
        ]
      },
      {
        id: 'ac_valves',
        titleEl: 'Βάνες Κλιματισμού',
        titleEn: 'A/C Valves',
        icon: '❄️',
        items: [
          { key: 'ac_intake', el: 'Εισαγωγή A/C', en: 'A/C intake' },
          { key: 'ac_discharge', el: 'Εξαγωγή A/C', en: 'A/C discharge' },
        ]
      },
      {
        id: 'other_valves',
        titleEl: 'Λοιπές Βάνες',
        titleEn: 'Other Valves',
        icon: '🔧',
        items: [
          { key: 'bilge_discharge', el: 'Εξαγωγή σεντινών', en: 'Bilge discharge' },
          { key: 'deck_wash', el: 'Πλύσιμο καταστρώματος', en: 'Deck wash' },
          { key: 'emergency_valve', el: 'Βάνα έκτακτης ανάγκης', en: 'Emergency valve' },
        ]
      },
    ]
  },
  electrical: {
    icon: '💡',
    nameEl: 'ΗΛΕΚΤΡΟΛΟΓΙΚΑ',
    nameEn: 'ELECTRICAL',
    color: '#3b82f6', // blue
    sections: [
      {
        id: 'batteries',
        titleEl: 'Μπαταρίες',
        titleEn: 'Batteries',
        icon: '🔋',
        items: [
          { key: 'house_batteries', el: 'Μπαταρίες οικίας', en: 'House batteries' },
          { key: 'engine_battery', el: 'Μπαταρία μηχανής', en: 'Engine battery' },
          { key: 'battery_charger', el: 'Φορτιστής μπαταριών', en: 'Battery charger' },
          { key: 'battery_switch', el: 'Διακόπτης μπαταριών', en: 'Battery switch' },
          { key: 'battery_cables', el: 'Καλώδια μπαταριών', en: 'Battery cables' },
        ]
      },
      {
        id: 'shore_power',
        titleEl: 'Ρεύμα Ξηράς',
        titleEn: 'Shore Power',
        icon: '🔌',
        items: [
          { key: 'shore_inlet', el: 'Πρίζα ξηράς', en: 'Shore inlet' },
          { key: 'shore_cable', el: 'Καλώδιο ξηράς', en: 'Shore cable' },
          { key: 'isolation_transformer', el: 'Μετασχηματιστής απομόνωσης', en: 'Isolation transformer' },
        ]
      },
      {
        id: 'inverter_system',
        titleEl: 'Inverter / Converter',
        titleEn: 'Inverter / Converter',
        icon: '⚡',
        items: [
          { key: 'inverter', el: 'Inverter', en: 'Inverter' },
          { key: 'converter', el: 'Μετατροπέας DC-DC', en: 'DC-DC Converter' },
        ]
      },
      {
        id: 'lighting',
        titleEl: 'Φωτισμός',
        titleEn: 'Lighting',
        icon: '💡',
        items: [
          { key: 'nav_lights', el: 'Φώτα ναυσιπλοΐας', en: 'Navigation lights' },
          { key: 'anchor_light', el: 'Φως αγκυροβολίας', en: 'Anchor light' },
          { key: 'cabin_lights', el: 'Φώτα καμπινών', en: 'Cabin lights' },
          { key: 'deck_lights', el: 'Φώτα καταστρώματος', en: 'Deck lights' },
          { key: 'underwater_lights', el: 'Υποβρύχια φώτα', en: 'Underwater lights' },
        ]
      },
      {
        id: 'windlass_system',
        titleEl: 'Εργάτης Άγκυρας',
        titleEn: 'Anchor Windlass',
        icon: '⚓',
        items: [
          { key: 'windlass_motor', el: 'Μοτέρ εργάτη', en: 'Windlass motor' },
          { key: 'windlass_brushes', el: 'Καρβουνάκια εργάτη', en: 'Windlass brushes' },
          { key: 'windlass_gearbox', el: 'Κιβώτιο ταχυτήτων', en: 'Windlass gearbox' },
          { key: 'windlass_solenoid', el: 'Σωληνοειδές ρελέ', en: 'Windlass solenoid' },
        ]
      },
      {
        id: 'panel',
        titleEl: 'Πίνακας Ηλεκτρικών',
        titleEn: 'Electrical Panel',
        icon: '🎛️',
        items: [
          { key: 'main_breaker', el: 'Κεντρικός διακόπτης', en: 'Main breaker' },
          { key: 'circuit_breakers', el: 'Ασφαλειοδιακόπτες', en: 'Circuit breakers' },
          { key: 'fuses', el: 'Ασφάλειες', en: 'Fuses' },
          { key: 'voltmeter', el: 'Βολτόμετρο', en: 'Voltmeter' },
          { key: 'ammeter', el: 'Αμπερόμετρο', en: 'Ammeter' },
        ]
      },
    ]
  },
  desalination: {
    icon: '💧',
    nameEl: 'ΑΦΑΛΑΤΩΣΗ',
    nameEn: 'DESALINATION',
    color: '#3b82f6', // blue
    sections: [
      {
        id: 'watermaker_main',
        titleEl: 'Water Maker - Κύριο Σύστημα',
        titleEn: 'Water Maker - Main System',
        icon: '💧',
        items: [
          { key: 'high_pressure_pump', el: 'Αντλία υψηλής πίεσης', en: 'High pressure pump' },
          { key: 'feed_pump', el: 'Αντλία τροφοδοσίας', en: 'Feed pump' },
          { key: 'boost_pump', el: 'Αντλία ενίσχυσης', en: 'Boost pump' },
          { key: 'membrane', el: 'Μεμβράνη αντίστροφης όσμωσης', en: 'Reverse osmosis membrane' },
          { key: 'pressure_gauge', el: 'Μανόμετρο πίεσης', en: 'Pressure gauge' },
          { key: 'flow_meter', el: 'Ροόμετρο', en: 'Flow meter' },
        ]
      },
      {
        id: 'watermaker_filters',
        titleEl: 'Φίλτρα',
        titleEn: 'Filters',
        icon: '🔧',
        items: [
          { key: 'prefilter_5micron', el: 'Προφίλτρο 5 micron', en: '5 micron prefilter' },
          { key: 'prefilter_20micron', el: 'Προφίλτρο 20 micron', en: '20 micron prefilter' },
          { key: 'carbon_filter', el: 'Φίλτρο ενεργού άνθρακα', en: 'Carbon filter' },
          { key: 'sediment_filter', el: 'Φίλτρο ιζημάτων', en: 'Sediment filter' },
        ]
      },
      {
        id: 'watermaker_valves',
        titleEl: 'Βάνες & Σωληνώσεις',
        titleEn: 'Valves & Plumbing',
        icon: '🚿',
        items: [
          { key: 'seawater_inlet', el: 'Είσοδος θαλασσινού νερού', en: 'Seawater inlet valve' },
          { key: 'brine_discharge', el: 'Έξοδος άλμης', en: 'Brine discharge valve' },
          { key: 'product_water_valve', el: 'Βάνα καθαρού νερού', en: 'Product water valve' },
          { key: 'flush_valve', el: 'Βάνα ξεπλύματος', en: 'Flush valve' },
          { key: 'bypass_valve', el: 'Βάνα παράκαμψης', en: 'Bypass valve' },
        ]
      },
      {
        id: 'watermaker_electrical',
        titleEl: 'Ηλεκτρικά & Έλεγχος',
        titleEn: 'Electrical & Control',
        icon: '⚡',
        items: [
          { key: 'control_panel', el: 'Πίνακας ελέγχου', en: 'Control panel' },
          { key: 'salinity_sensor', el: 'Αισθητήρας αλατότητας', en: 'Salinity sensor' },
          { key: 'pressure_switch', el: 'Πιεσοστάτης', en: 'Pressure switch' },
          { key: 'auto_flush', el: 'Αυτόματο ξέπλυμα', en: 'Auto flush system' },
          { key: 'motor_starter', el: 'Εκκινητής μοτέρ', en: 'Motor starter' },
        ]
      },
      {
        id: 'watermaker_maintenance',
        titleEl: 'Συντήρηση & Χημικά',
        titleEn: 'Maintenance & Chemicals',
        icon: '🧪',
        items: [
          { key: 'pickling_solution', el: 'Διάλυμα συντήρησης', en: 'Pickling solution' },
          { key: 'membrane_cleaner', el: 'Καθαριστικό μεμβράνης', en: 'Membrane cleaner' },
          { key: 'descaler', el: 'Αφαλατωτικό', en: 'Descaler' },
          { key: 'biocide', el: 'Βιοκτόνο', en: 'Biocide' },
          { key: 'storage_solution', el: 'Διάλυμα αποθήκευσης', en: 'Storage solution' },
        ]
      },
    ]
  },
  documents: {
    icon: '📄',
    nameEl: 'ΕΓΓΡΑΦΑ',
    nameEn: 'DOCUMENTS',
    color: '#3b82f6',
    sections: [
      {
        id: 'certificates',
        titleEl: 'Πιστοποιητικά',
        titleEn: 'Certificates',
        icon: '📜',
        items: [
          { key: 'seaworthiness_cert', el: 'Πιστοποιητικό Αξιοπλοΐας', en: 'Certificate of Seaworthiness' },
          { key: 'insurance', el: 'Ασφάλεια', en: 'Insurance' },
          { key: 'dekpa', el: 'ΔΕΚΠΑ', en: 'DEKPA' },
          { key: 'radio_license', el: 'Radio License', en: 'Radio License' },
        ]
      },
      {
        id: 'logs_manuals',
        titleEl: 'Ημερολόγια & Εγχειρίδια',
        titleEn: 'Logs & Manuals',
        icon: '📚',
        items: [
          { key: 'transit_log', el: 'Transit Log', en: 'Transit Log' },
          { key: 'engine_manual', el: 'Εγχειρίδιο Μηχανής', en: 'Engine Manual' },
          { key: 'generator_manual', el: 'Εγχειρίδιο Γεννήτριας', en: 'Generator Manual' },
          { key: 'electronics_manual', el: 'Εγχειρίδια Ηλεκτρονικών', en: 'Electronics Manuals' },
          { key: 'equipment_manual', el: 'Εγχειρίδια Εξοπλισμού', en: 'Equipment Manuals' },
        ]
      },
      {
        id: 'registration',
        titleEl: 'Νηολόγηση',
        titleEn: 'Registration',
        icon: '🏛️',
        items: [
          { key: 'registration_cert', el: 'Έγγραφο Εθνικότητας', en: 'Registration Certificate' },
          { key: 'ownership_docs', el: 'Έγγραφα Ιδιοκτησίας', en: 'Ownership Documents' },
          { key: 'crew_list', el: 'Κατάλογος Πληρώματος', en: 'Crew List' },
        ]
      },
    ]
  },
  hull: {
    icon: '🚢',
    nameEl: 'ΓΑΣΤΡΑ',
    nameEn: 'HULL',
    color: '#3b82f6',
    sections: [
      {
        id: 'hull_paint',
        titleEl: 'Βαφή Γάστρας',
        titleEn: 'Hull Paint',
        icon: '🎨',
        items: [
          { key: 'bottom_paint', el: 'Υφαλοχρώματα', en: 'Bottom paint' },
          { key: 'antifouling', el: 'Antifouling', en: 'Antifouling' },
          { key: 'waterline', el: 'Ίσαλος Γραμμή', en: 'Waterline' },
          { key: 'gel_coat', el: 'Gel Coat', en: 'Gel Coat' },
        ]
      },
      {
        id: 'hull_fittings',
        titleEl: 'Εξαρτήματα Γάστρας',
        titleEn: 'Hull Fittings',
        icon: '🔩',
        items: [
          { key: 'thru_hulls', el: 'Thru-hulls', en: 'Thru-hulls' },
          { key: 'anodes', el: 'Ανόδια', en: 'Anodes/Zincs' },
          { key: 'propeller', el: 'Προπέλα', en: 'Propeller' },
          { key: 'shaft', el: 'Άξονας', en: 'Shaft' },
          { key: 'rudder', el: 'Τιμόνι/Πηδάλιο', en: 'Rudder' },
          { key: 'keel', el: 'Καρίνα', en: 'Keel' },
        ]
      },
      {
        id: 'hull_inspection',
        titleEl: 'Επιθεώρηση Γάστρας',
        titleEn: 'Hull Inspection',
        icon: '🔍',
        items: [
          { key: 'osmosis_check', el: 'Έλεγχος Ώσμωσης', en: 'Osmosis check' },
          { key: 'hull_cleaning', el: 'Καθαρισμός Γάστρας', en: 'Hull cleaning' },
          { key: 'hull_polishing', el: 'Γυάλισμα Γάστρας', en: 'Hull polishing' },
          { key: 'striping', el: 'Ρίγες/Διακοσμητικά', en: 'Striping/Decals' },
        ]
      },
    ]
  },
  electronics: {
    icon: '📡',
    nameEl: 'ΗΛΕΚΤΡΟΝΙΚΑ',
    nameEn: 'ELECTRONICS',
    color: '#3b82f6',
    sections: [
      {
        id: 'navigation_electronics',
        titleEl: 'Ηλεκτρονικά Ναυσιπλοΐας',
        titleEn: 'Navigation Electronics',
        icon: '🧭',
        items: [
          { key: 'gps_plotter', el: 'GPS / Plotter', en: 'GPS / Plotter' },
          { key: 'autopilot', el: 'Αυτόματος Πιλότος', en: 'Autopilot' },
          { key: 'radar', el: 'Radar', en: 'Radar' },
          { key: 'ais', el: 'AIS', en: 'AIS' },
        ]
      },
      {
        id: 'instruments',
        titleEl: 'Όργανα',
        titleEn: 'Instruments',
        icon: '📊',
        items: [
          { key: 'wind_instruments', el: 'Ανεμόμετρο', en: 'Wind Instruments' },
          { key: 'depth_sounder', el: 'Βυθόμετρο', en: 'Depth Sounder' },
          { key: 'speed_log', el: 'Δρομόμετρο', en: 'Speed Log' },
          { key: 'compass', el: 'Πυξίδα', en: 'Compass' },
        ]
      },
      {
        id: 'communication',
        titleEl: 'Επικοινωνίες',
        titleEn: 'Communication',
        icon: '📻',
        items: [
          { key: 'vhf_radio', el: 'VHF Radio', en: 'VHF Radio' },
          { key: 'vhf_handheld', el: 'VHF Χειρός', en: 'Handheld VHF' },
          { key: 'satphone', el: 'Δορυφορικό Τηλέφωνο', en: 'Satellite Phone' },
          { key: 'wifi_router', el: 'WiFi Router', en: 'WiFi Router' },
        ]
      },
      {
        id: 'entertainment',
        titleEl: 'Ψυχαγωγία',
        titleEn: 'Entertainment',
        icon: '🎵',
        items: [
          { key: 'tv', el: 'Τηλεόραση', en: 'TV' },
          { key: 'stereo', el: 'Στερεοφωνικό', en: 'Stereo/Radio' },
          { key: 'speakers', el: 'Ηχεία', en: 'Speakers' },
        ]
      },
    ]
  }
};

// Vessel list (same as WinterizationCheckin)
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
const CUSTOM_SECTIONS_KEY = 'task_category_custom_sections';

interface CustomSection {
  id: string;
  titleEl: string;
  titleEn: string;
  icon: string;
  items: { key: string; el: string; en: string }[];
}

export default function TaskCategoryCheckin() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [lang, setLang] = useState<"en" | "el">("el");
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);
  const [sections, setSections] = useState<{ [key: string]: SectionState }>({});
  const [customSections, setCustomSections] = useState<{ [key: string]: CustomSection }>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('📋');

  // Check if user is owner (view-only access)
  const isOwnerUser = authService.isOwner();
  const canEdit = !isOwnerUser;

  // Get current category config
  const categoryConfig = category ? TASK_CATEGORIES[category] : null;

  // Get vessel name by ID
  const getVesselName = (vesselId: number | null): string => {
    if (!vesselId) return '';
    const vessel = VESSELS.find(v => v.id === vesselId);
    return vessel ? vessel.name.replace(/\s+/g, '_').toLowerCase() : '';
  };

  // Initialize default sections for current category
  const initializeDefaultSections = (): { [key: string]: SectionState } => {
    if (!categoryConfig) return {};

    const initialSections: { [key: string]: SectionState } = {};
    categoryConfig.sections.forEach(section => {
      initialSections[section.id] = {
        expanded: false,
        items: section.items.map(item => ({
          id: `default_${section.id}_${item.key}`,
          key: item.key,
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

  // Initialize sections on mount or category change
  useEffect(() => {
    setSections(initializeDefaultSections());

    // Load last selected vessel
    const lastVessel = localStorage.getItem(`task_${category}_last_vessel`);
    if (lastVessel) {
      setSelectedVessel(Number(lastVessel));
    }
  }, [category]);

  // Load vessel-specific data when vessel changes
  useEffect(() => {
    if (!selectedVessel || !category) {
      setSections(initializeDefaultSections());
      setCustomSections({});
      setGeneralNotes('');
      return;
    }

    const vesselKey = getVesselName(selectedVessel);
    const storageKey = `task_${category}_${vesselKey}`;

    // Save last selected vessel
    localStorage.setItem(`task_${category}_last_vessel`, String(selectedVessel));

    // Start with fresh default sections
    const newSections = initializeDefaultSections();

    // Load vessel-specific data
    const savedData = localStorage.getItem(`${storageKey}_data`);
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

            if (data.sections[sectionId].expanded !== undefined) {
              newSections[sectionId].expanded = data.sections[sectionId].expanded;
            }
          }
        });

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

    // Load custom items
    const savedCustomItems = localStorage.getItem(`${storageKey}_custom_items`);
    if (savedCustomItems) {
      try {
        const customData = JSON.parse(savedCustomItems);
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

    // Load custom sections
    const customSectionsData = localStorage.getItem(`${CUSTOM_SECTIONS_KEY}_${category}_${vesselKey}`);
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
  }, [selectedVessel, category]);

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

  // Add custom item
  const addItem = (sectionId: string) => {
    if (!selectedVessel || !category) {
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

    // Save custom item immediately
    const vesselKey = getVesselName(selectedVessel);
    const storageKey = `task_${category}_${vesselKey}_custom_items`;
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

  // Remove custom item
  const removeItem = (sectionId: string, itemId: string) => {
    if (!selectedVessel || !category) return;
    if (!window.confirm(lang === 'el' ? 'Διαγραφή αντικειμένου;' : 'Remove item?')) return;

    const itemToRemove = sections[sectionId]?.items.find((item: ChecklistItem) => item.id === itemId);

    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        items: prev[sectionId].items.filter(item => item.id !== itemId)
      }
    }));

    if (itemToRemove?.isCustom) {
      const vesselKey = getVesselName(selectedVessel);
      const storageKey = `task_${category}_${vesselKey}_custom_items`;
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

  // Add custom section
  const addSection = () => {
    if (!selectedVessel || !category || !newSectionName.trim()) return;
    const sectionId = `custom_${uid()}`;
    const newSection: CustomSection = {
      id: sectionId,
      titleEl: newSectionName.trim().toUpperCase(),
      titleEn: newSectionName.trim().toUpperCase(),
      icon: newSectionIcon,
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
    const vesselKey = getVesselName(selectedVessel);
    const existingCustom = localStorage.getItem(`${CUSTOM_SECTIONS_KEY}_${category}_${vesselKey}`);
    const customData = existingCustom ? JSON.parse(existingCustom) : {};
    customData[sectionId] = newSection;
    localStorage.setItem(`${CUSTOM_SECTIONS_KEY}_${category}_${vesselKey}`, JSON.stringify(customData));

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
      if (selectedVessel && category) {
        const vesselKey = getVesselName(selectedVessel);
        const existingCustom = localStorage.getItem(`${CUSTOM_SECTIONS_KEY}_${category}_${vesselKey}`);
        if (existingCustom) {
          const customData = JSON.parse(existingCustom);
          delete customData[sectionId];
          localStorage.setItem(`${CUSTOM_SECTIONS_KEY}_${category}_${vesselKey}`, JSON.stringify(customData));
        }
      }
    }
  };

  // Save data
  const handleSave = () => {
    if (!selectedVessel || !category) {
      alert(lang === 'el' ? 'Πρέπει να επιλέξετε σκάφος πρώτα!' : 'Please select a vessel first!');
      return;
    }

    const vesselKey = getVesselName(selectedVessel);
    const storageKey = `task_${category}_${vesselKey}`;

    const sectionsToSave: { [key: string]: { expanded: boolean; items: ChecklistItem[] } } = {};
    Object.keys(sections).forEach(sectionId => {
      sectionsToSave[sectionId] = {
        expanded: sections[sectionId].expanded,
        items: sections[sectionId].items.filter((item: ChecklistItem) => !item.isCustom)
      };
    });

    const data = {
      sections: sectionsToSave,
      generalNotes,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`${storageKey}_data`, JSON.stringify(data));

    const customItems: { [key: string]: ChecklistItem[] } = {};
    Object.keys(sections).forEach(sectionId => {
      const sectionCustomItems = sections[sectionId].items.filter((item: ChecklistItem) => item.isCustom);
      if (sectionCustomItems.length > 0) {
        customItems[sectionId] = sectionCustomItems;
      }
    });
    localStorage.setItem(`${storageKey}_custom_items`, JSON.stringify(customItems));

    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  // Get label for item
  const getLabel = (sectionId: string, key: string): string => {
    if (!categoryConfig) return key;
    const section = categoryConfig.sections.find(s => s.id === sectionId);
    if (!section) return key;
    const item = section.items.find(i => i.key === key);
    return item ? (lang === 'el' ? item.el : item.en) : key;
  };

  // Get section title
  const getSectionTitle = (sectionId: string): string => {
    if (!categoryConfig) return sectionId;
    const section = categoryConfig.sections.find(s => s.id === sectionId);
    return section ? (lang === 'el' ? section.titleEl : section.titleEn) : sectionId;
  };

  // Get section icon
  const getSectionIcon = (sectionId: string): string => {
    if (!categoryConfig) return '📋';
    const section = categoryConfig.sections.find(s => s.id === sectionId);
    return section?.icon || '📋';
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
    if (!selectedVessel || !categoryConfig) {
      alert(lang === 'el' ? 'Πρέπει να επιλέξετε σκάφος πρώτα!' : 'Please select a vessel first!');
      return;
    }

    const vesselName = VESSELS.find(v => v.id === selectedVessel)?.name || 'Unknown';
    const categoryName = lang === 'el' ? categoryConfig.nameEl : categoryConfig.nameEn;
    const currentDate = new Date().toLocaleDateString('el-GR');

    const docChildren: (Paragraph | Table)[] = [];

    // Title
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${categoryConfig.icon} ${categoryName}`,
            bold: true,
            size: 48,
            color: categoryConfig.color.replace('#', ''),
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
          new TextRun({ text: lang === 'el' ? 'Σκάφος: ' : 'Vessel: ', bold: true, size: 28 }),
          new TextRun({ text: vesselName, size: 28 }),
          new TextRun({ text: '    |    ', size: 28 }),
          new TextRun({ text: lang === 'el' ? 'Ημερομηνία: ' : 'Date: ', bold: true, size: 28 }),
          new TextRun({ text: currentDate, size: 28 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Progress Summary
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${lang === 'el' ? 'Ολοκληρώθηκαν' : 'Completed'}: ${completedItems}/${totalItems}`, bold: true, size: 24 }),
          new TextRun({ text: '    |    ', size: 24 }),
          new TextRun({ text: `${lang === 'el' ? 'Αντικαταστάσεις' : 'Replacements'}: ${itemsNeedingReplacement}`, bold: true, size: 24, color: 'DC2626' }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Sections
    categoryConfig.sections.forEach(sectionDef => {
      const sectionState = sections[sectionDef.id];
      if (!sectionState) return;

      const sectionTitle = lang === 'el' ? sectionDef.titleEl : sectionDef.titleEn;

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${sectionDef.icon} ${sectionTitle}`,
              bold: true,
              size: 28,
              color: categoryConfig.color.replace('#', ''),
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      const tableRows: TableRow[] = [];

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

      sectionState.items.forEach((item: ChecklistItem) => {
        const itemLabel = item.isCustom ? item.key : getLabel(sectionDef.id, item.key);
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
              text: lang === 'el' ? 'Γενικές Σημειώσεις:' : 'General Notes:',
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

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const fileName = `${categoryName}_${vesselName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert(lang === 'el' ? 'Σφάλμα κατά τη δημιουργία του εγγράφου' : 'Error generating document');
    }
  };

  if (!categoryConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {lang === 'el' ? 'Κατηγορία δεν βρέθηκε' : 'Category not found'}
          </h1>
          <p className="text-gray-600 mb-4">{category}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold"
          >
            ← {lang === 'el' ? 'Επιστροφή' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
      {/* Header */}
      <div className="p-4 rounded-b-xl shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            >
              ← {lang === 'el' ? 'Πίσω' : 'Back'}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "el" : "en")}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-105"
            >
              {lang === "en" ? "🇬🇷 EL" : "🇬🇧 EN"}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-blue-800 text-center drop-shadow-md">
            {categoryConfig.icon} {lang === 'el' ? categoryConfig.nameEl : categoryConfig.nameEn}
          </h1>
          <p className="text-blue-700 text-center mt-1">
            {lang === 'el' ? 'Έλεγχος & Συντήρηση' : 'Inspection & Maintenance'}
          </p>
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
        <div className="rounded-xl p-4 mb-4 border border-blue-300 shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            {lang === 'el' ? 'Επιλέξτε Σκάφος' : 'Select Vessel'}
          </label>
          <select
            value={selectedVessel || ""}
            onChange={(e) => setSelectedVessel(Number(e.target.value) || null)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:border-transparent"
            style={{ focusRing: categoryConfig.color }}
          >
            <option value="">{lang === 'el' ? '-- Επιλέξτε --' : '-- Select --'}</option>
            {VESSELS.map(vessel => (
              <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
            ))}
          </select>
          {selectedVessel && (
            <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
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
            <span className="text-sm font-medium text-gray-800">
              {lang === 'el' ? 'Πρόοδος' : 'Progress'}
            </span>
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

          {/* Replacement Summary */}
          {itemsNeedingReplacement > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-blue-400">
              <span className="text-sm font-medium text-red-600 flex items-center gap-2">
                🔴 {lang === 'el' ? 'Αντικαταστάσεις:' : 'Replacements:'}
              </span>
              <span className="text-lg font-bold text-red-600">
                {itemsNeedingReplacement} {lang === 'el' ? 'είδη' : 'items'} ({totalReplacementQty} {lang === 'el' ? 'τεμάχια' : 'pcs'})
              </span>
            </div>
          )}
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
        {categoryConfig.sections.map(sectionDef => {
          const sectionState = sections[sectionDef.id];
          if (!sectionState) return null;

          const progress = getSectionProgress(sectionDef.id);
          const isComplete = progress.completed === progress.total && progress.total > 0;

          return (
            <div key={sectionDef.id} className="rounded-xl mb-3 border border-blue-300 overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300" style={{ backgroundColor: 'rgba(144, 202, 249, 0.5)' }}>
              {/* Section Header */}
              <div className="flex items-center" style={{ backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 181, 246, 0.5)' }}>
                <button
                  onClick={() => toggleSection(sectionDef.id)}
                  className={`flex-1 p-4 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${
                    isComplete ? 'bg-green-500/30' : 'hover:bg-blue-400/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sectionDef.icon}</span>
                    <span className="font-bold text-lg text-gray-800">
                      {lang === 'el' ? sectionDef.titleEl : sectionDef.titleEn}
                    </span>
                    {isComplete && <span className="text-green-600 text-xl">✓</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full text-white ${
                      isComplete ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {progress.completed}/{progress.total}
                    </span>
                    <span className="text-gray-700 text-xl">
                      {sectionState.expanded ? '▼' : '▶'}
                    </span>
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
              {sectionState.expanded && (
                <div className="p-4 pt-0 border-t border-blue-300" style={{ backgroundColor: 'rgba(179, 229, 252, 0.4)' }}>
                  {sectionState.items.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg mb-2 transition-all duration-300 border hover:shadow-lg hover:scale-[1.01] ${
                        item.replaceQty > 0
                          ? 'border-red-500'
                          : item.checked
                            ? 'border-green-500'
                            : 'border-blue-300'
                      }`}
                      style={{
                        backgroundColor: item.replaceQty > 0
                          ? 'rgba(254, 202, 202, 0.5)'
                          : item.checked
                            ? 'rgba(187, 247, 208, 0.5)'
                            : 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      {/* LINE 1: Checkbox + Name + Qty + Comments */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* OK Checkbox */}
                        <button
                          onClick={() => canEdit && toggleItem(sectionDef.id, item.id)}
                          disabled={!canEdit}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            item.checked
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-400 hover:border-green-400'
                          } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title={canEdit ? "OK" : (lang === 'el' ? 'Μόνο προβολή' : 'View only')}
                        >
                          {item.checked ? '✓' : ''}
                        </button>

                        {/* Item Name */}
                        <span className={`font-medium min-w-[120px] flex-shrink-0 ${
                          item.replaceQty > 0 ? 'text-red-700' : item.checked ? 'text-green-700' : 'text-gray-800'
                        }`}>
                          {item.isCustom ? item.key : getLabel(sectionDef.id, item.key)}
                        </span>

                        {/* Quantity Controls */}
                        <div className={`flex items-center gap-1 bg-blue-100 rounded-lg px-2 py-1 flex-shrink-0 border border-blue-300 ${!canEdit ? 'opacity-60' : ''}`}>
                          <span className="text-xs text-gray-600 mr-1">🔢</span>
                          <button
                            onClick={() => canEdit && updateQty(sectionDef.id, item.id, -1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-gray-800 font-medium">{item.qty}</span>
                          <button
                            onClick={() => canEdit && updateQty(sectionDef.id, item.id, 1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            +
                          </button>
                        </div>

                        {/* Comments Input */}
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => canEdit && updateComments(sectionDef.id, item.id, e.target.value)}
                          disabled={!canEdit}
                          placeholder={lang === 'el' ? 'Σχόλια...' : 'Comments...'}
                          className={`flex-1 min-w-[150px] bg-white/90 border border-blue-300 rounded px-2 py-1 text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />

                        {/* Delete button for all items */}
                        {canEdit && (
                          <button
                            onClick={() => removeItem(sectionDef.id, item.id)}
                            className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded text-sm flex-shrink-0"
                            title={lang === 'el' ? 'Διαγραφή' : 'Delete'}
                          >
                            🗑️
                          </button>
                        )}
                      </div>

                      {/* LINE 2: Replace Button + Replace Qty */}
                      <div className={`flex items-center gap-2 mt-2 ml-10 ${!canEdit ? 'opacity-60' : ''}`}>
                        <button
                          onClick={() => canEdit && (item.replaceQty === 0 ? updateReplaceQty(sectionDef.id, item.id, 1) : updateReplaceQty(sectionDef.id, item.id, -item.replaceQty))}
                          disabled={!canEdit}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                            item.replaceQty > 0
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-white hover:bg-red-600 text-gray-700 hover:text-white border border-gray-300 hover:border-red-600'
                          } ${!canEdit ? 'cursor-not-allowed' : ''}`}
                        >
                          🔴 {lang === 'el' ? 'Αντικατάσταση' : 'Replace'}
                        </button>

                        {/* Replace Quantity Controls */}
                        <div className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all border ${
                          item.replaceQty > 0 ? 'bg-red-100 border-red-400' : 'bg-blue-100 border-blue-300'
                        }`}>
                          <button
                            onClick={() => canEdit && updateReplaceQty(sectionDef.id, item.id, -1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            -
                          </button>
                          <span className={`w-8 text-center font-medium ${
                            item.replaceQty > 0 ? 'text-red-700' : 'text-gray-600'
                          }`}>
                            {item.replaceQty}
                          </span>
                          <button
                            onClick={() => canEdit && updateReplaceQty(sectionDef.id, item.id, 1)}
                            disabled={!canEdit}
                            className={`w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-sm ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          >
                            +
                          </button>
                        </div>

                        {item.replaceQty > 0 && (
                          <span className="text-red-600 text-xs font-medium animate-pulse">
                            ⚠️ {lang === 'el' ? 'Χρειάζεται αντικατάσταση!' : 'Needs replacement!'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Item Button */}
                  {canEdit && (
                    <button
                      onClick={() => addItem(sectionDef.id)}
                      className={`w-full mt-2 p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedVessel
                          ? 'border-blue-500 text-blue-700 hover:text-blue-800 hover:border-blue-600 hover:bg-blue-200/50'
                          : 'border-gray-400 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xl">➕</span>
                      <span className="font-medium">
                        {selectedVessel
                          ? `${lang === 'el' ? 'Προσθήκη' : 'Add Item'} (${VESSELS.find(v => v.id === selectedVessel)?.name})`
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

        {/* Custom Sections */}
        {Object.values(customSections).map((customSection: CustomSection) => {
          const sectionState = sections[customSection.id];
          if (!sectionState) return null;

          const progress = getSectionProgress(customSection.id);
          const isComplete = progress.completed === progress.total && progress.total > 0;

          return (
            <div key={customSection.id} className="rounded-xl mb-3 border border-blue-300 overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300" style={{ backgroundColor: 'rgba(144, 202, 249, 0.5)' }}>
              {/* Section Header */}
              <div className="flex items-center" style={{ backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 181, 246, 0.5)' }}>
                <button
                  onClick={() => toggleSection(customSection.id)}
                  className={`flex-1 p-4 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${
                    isComplete ? 'bg-green-500/30' : 'hover:bg-blue-400/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{customSection.icon}</span>
                    <span className="font-bold text-lg text-gray-800">
                      {lang === 'el' ? customSection.titleEl : customSection.titleEn}
                    </span>
                    {isComplete && <span className="text-green-600 text-xl">✓</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full text-white ${
                      isComplete ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {progress.completed}/{progress.total}
                    </span>
                    <span className="text-gray-700 text-xl">
                      {sectionState.expanded ? '▼' : '▶'}
                    </span>
                  </div>
                </button>
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSection(customSection.id); }}
                    className="px-3 py-2 mr-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
                    title={lang === 'el' ? 'Διαγραφή κατηγορίας' : 'Delete category'}
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Section Content */}
              {sectionState.expanded && (
                <div className="p-4 pt-2 border-t border-blue-300" style={{ backgroundColor: 'rgba(179, 229, 252, 0.4)' }}>
                  {sectionState.items.map((item: ChecklistItem) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg mb-2 transition-all duration-300 border hover:shadow-lg hover:scale-[1.01] ${
                        item.replaceQty > 0 ? 'border-red-500' : item.checked ? 'border-green-500' : 'border-blue-300'
                      }`}
                      style={{
                        backgroundColor: item.replaceQty > 0 ? 'rgba(254, 202, 202, 0.5)' : item.checked ? 'rgba(187, 247, 208, 0.5)' : 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => canEdit && toggleItem(customSection.id, item.id)}
                          disabled={!canEdit}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500 hover:border-green-400'
                          } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {item.checked ? '✓' : ''}
                        </button>
                        <span className={`font-medium min-w-[120px] flex-shrink-0 ${
                          item.replaceQty > 0 ? 'text-red-700' : item.checked ? 'text-green-700' : 'text-gray-800'
                        }`}>
                          {item.key}
                        </span>
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => canEdit && updateComments(customSection.id, item.id, e.target.value)}
                          disabled={!canEdit}
                          placeholder={lang === 'el' ? 'Σχόλια...' : 'Comments...'}
                          className={`flex-1 min-w-[150px] bg-white/90 border border-blue-300 rounded px-2 py-1 text-sm text-gray-800 placeholder-gray-500 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {canEdit && (
                          <button
                            onClick={() => removeItem(customSection.id, item.id)}
                            className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded text-sm flex-shrink-0"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {canEdit && (
                    <button
                      onClick={() => addItem(customSection.id)}
                      className={`w-full mt-2 p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedVessel ? 'border-blue-500 text-blue-700 hover:bg-blue-100' : 'border-gray-400 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xl">➕</span>
                      <span className="font-medium">{lang === 'el' ? 'Προσθήκη' : 'Add Item'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

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
                  <option value="❄️">❄️</option>
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
        <div className="rounded-xl p-4 mb-4 border border-blue-300 shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            📝 {lang === 'el' ? 'Γενικές Σημειώσεις' : 'General Notes'}
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => canEdit && setGeneralNotes(e.target.value)}
            disabled={!canEdit}
            placeholder={lang === 'el' ? 'Προσθέστε σημειώσεις...' : 'Add notes...'}
            className={`w-full bg-white/90 border border-blue-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
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
            onClick={handleExportWord}
            className={`${canEdit ? 'flex-1' : 'w-full'} px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-lg`}
          >
            📄 {lang === 'el' ? 'Εξαγωγή Word' : 'Export Word'}
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
}
