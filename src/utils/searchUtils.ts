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
  if (!search || !source) return !search;
  return normalizeText(source).includes(normalizeText(search));
};

// Flexible code match - extracts code from charter party formats and compares exactly
// Preserves leading zeros: "05" ≠ "5", "001" ≠ "1"
export const codeMatches = (source: string, search: string): boolean => {
  if (!search || !source) return !search;
  const s = extractCode(source);
  const q = extractCode(search);
  return s === q;
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
