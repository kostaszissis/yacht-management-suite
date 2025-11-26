// 🔐 OWNER CODES CONFIGURATION
// Εύκολη αλλαγή εδώ - Κάθε κωδικός ιδιοκτήτη με τα σκάφη του

// 🔥 FIX 5: Use numeric IDs matching API format
// A2025: Bob (8), Perla (7), Maria 1 (1), Maria 2 (2)
// B2025: Kalispera (5), Bar Bar (4)
// C2025: Infinity (6)
// D2025: Valesia (3)
export const OWNER_CODES: { [key: string]: number[] } = {
  "A2025": [8, 7, 1, 2],
  "B2025": [5, 4],
  "C2025": [6],
  "D2025": [3]
};

// Helper function to check if code is owner code
export const isOwnerCode = (code: string): boolean => {
  return Object.keys(OWNER_CODES).includes(code.toUpperCase());
};

// Get boats for owner code
export const getBoatsForOwner = (code: string): number[] => {
  return OWNER_CODES[code.toUpperCase()] || [];
};

// Get owner code for a specific boat
export const getOwnerCodeForBoat = (boatId: number): string | null => {
  for (const [ownerCode, boats] of Object.entries(OWNER_CODES)) {
    if (boats.includes(boatId)) {
      return ownerCode;
    }
  }
  return null;
};