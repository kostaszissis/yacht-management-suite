// 🔐 OWNER CODES CONFIGURATION
// Εύκολη αλλαγή εδώ - Κάθε κωδικός ιδιοκτήτη με τα σκάφη του

export const OWNER_CODES: { [key: string]: string[] } = {
  "A2025": ["BOB", "PERLA", "MARIA1", "MARIA2"],
  "B2025": ["KALISPERA","BAR-BAR"],
  "C2025": ["INFINITY"],
  "D2025": ["VALESIA"]
};

// Helper function to check if code is owner code
export const isOwnerCode = (code: string): boolean => {
  return Object.keys(OWNER_CODES).includes(code.toUpperCase());
};

// Get boats for owner code
export const getBoatsForOwner = (code: string): string[] => {
  return OWNER_CODES[code.toUpperCase()] || [];
};

// Get owner code for a specific boat
export const getOwnerCodeForBoat = (boatId: string): string | null => {
  for (const [ownerCode, boats] of Object.entries(OWNER_CODES)) {
    if (boats.includes(boatId)) {
      return ownerCode;
    }
  }
  return null;
};