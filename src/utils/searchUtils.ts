// Normalize any text for flexible comparison
export const normalizeText = (input: string): string => {
  if (!input) return '';
  return input.toUpperCase().trim().replace(/\s+/g, ' ');
};

// Normalize code (remove all spaces and special chars)
export const normalizeCode = (input: string): string => {
  if (!input) return '';
  return input
    .toUpperCase()
    .replace(/CHARTER\s*PARTY\s*(NO\.?|NUMBER)?\s*/gi, '')
    .replace(/[^A-Z0-9]/g, '');
};

// Extract code/number from charter party format, PRESERVING leading zeros
// "charter party no 05" → "05", "CHARTER PARTY 21" → "21"
export const extractCode = (input: string): string => {
  if (!input) return '';
  // Remove "CHARTER", "PARTY", "NO", "NO.", "NUMBER" words (case-insensitive)
  // but keep the exact code/number with leading zeros intact
  return input
    .replace(/\bCHARTER\b/gi, '')
    .replace(/\bPARTY\b/gi, '')
    .replace(/\bNO\.?\b/gi, '')
    .replace(/\bNUMBER\b/gi, '')
    .replace(/[^\w-]/g, ' ')  // Replace special chars with space (keep alphanumeric and dash)
    .trim()
    .replace(/\s+/g, ' ')     // Normalize multiple spaces
    .toUpperCase();
};

// Flexible text match (for names)
export const textMatches = (source: string, search: string): boolean => {
  if (!search || !source) return false;
  return normalizeText(source).includes(normalizeText(search));
};

// Flexible code match - supports partial matching and case-insensitive comparison
// Searches for charter party codes with flexible matching:
// - "party 2" matches "CHARTER PARTY NO 2"
// - "charter party no 4" matches "CHARTER PARTY NO 4"
// - "35" matches "charter party no 35"
// - Handles leading zeros: "05" matches "05" and "5" matches "05"
// - IMPORTANT: "21" should NOT match "2" or "1"
export const codeMatches = (source: string, search: string): boolean => {
  if (!search || !source) return false;

  const sourceUpper = source.toUpperCase().trim();
  const searchUpper = search.toUpperCase().trim();

  // 1. Exact match (case-insensitive)
  if (sourceUpper === searchUpper) {
    return true;
  }

  // 2. Extract numeric codes and compare EXACTLY
  const sourceCode = extractCode(source);
  const searchCode = extractCode(search);

  // Exact code match after extraction (e.g., "21" === "21")
  if (sourceCode && searchCode && sourceCode === searchCode) {
    return true;
  }

  // 3. Handle leading zeros: "5" should match "05", "005", etc.
  if (sourceCode && searchCode) {
    const sourceNum = sourceCode.replace(/^0+/, '') || '0';
    const searchNum = searchCode.replace(/^0+/, '') || '0';
    if (sourceNum === searchNum) {
      return true;
    }
  }

  // 4. Check if search is contained in source WITH word boundaries
  // "21" should match "CHARTER PARTY NO 21" but NOT "CHARTER PARTY NO 210"
  // "2" should match "CHARTER PARTY NO 2" but NOT "CHARTER PARTY NO 21"
  if (searchCode && sourceUpper.includes(searchCode)) {
    // Check word boundary - the number should be at end or followed by non-digit
    const regex = new RegExp(`\\b${searchCode}\\b`, 'i');
    if (regex.test(sourceUpper)) {
      return true;
    }
  }

  // 5. Check if source code is contained in search WITH word boundaries
  if (sourceCode && searchUpper.includes(sourceCode)) {
    const regex = new RegExp(`\\b${sourceCode}\\b`, 'i');
    if (regex.test(searchUpper)) {
      return true;
    }
  }

  return false;
};

// Parse date from various formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
// Returns normalized YYYY-MM-DD string or null if not a valid date
export const parseSearchDate = (input: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();

  // Try DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(d.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Try YYYY-MM-DD or YYYY/MM/DD format
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(d.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
};

// Check if a date string matches a search date
export const dateMatches = (dateStr: string | undefined, searchDate: string): boolean => {
  if (!dateStr || !searchDate) return false;
  // Normalize the stored date to YYYY-MM-DD for comparison
  const stored = parseSearchDate(dateStr) || dateStr.split('T')[0];
  return stored === searchDate;
};
