/**
 * Converts full-width alphanumeric characters to half-width.
 */
const toHalfWidth = (str: string): string => {
    return str.replace(/[\uff01-\uff5e]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    );
};

/**
 * Converts Hiragana to Katakana.
 */
const hiraToKata = (str: string): string => {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const charCode = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(charCode);
  });
};

/**
 * Normalizes a string for searching.
 * 1. Converts full-width characters to half-width.
 * 2. Converts to lowercase.
 * 3. Converts Hiragana to Katakana.
 * 4. Removes all whitespace and common punctuation.
 */
export const normalizeForSearch = (str: string): string => {
  if (!str) return '';
  const halfWidth = toHalfWidth(str);
  const katakana = hiraToKata(halfWidth);
  // Remove spaces and some punctuation that might differ between user input and data
  return katakana.toLowerCase().replace(/[\s'’"”.,!&ー]+/g, '');
};
