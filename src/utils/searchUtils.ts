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

// Flexible text match (for names)
export const textMatches = (source: string, search: string): boolean => {
  if (!search || !source) return !search;
  return normalizeText(source).includes(normalizeText(search));
};

// Flexible code match
export const codeMatches = (source: string, search: string): boolean => {
  if (!search || !source) return !search;
  const s = normalizeCode(source);
  const q = normalizeCode(search);
  return s === q;
};
