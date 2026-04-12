/**
 * Enterprise CSV Utility
 * Handles robust parsing (quoted commas) and generation for data export/import.
 */

/**
 * Parses a CSV string into an array of objects.
 * @param {string} text - The raw CSV content.
 * @param {Object} fieldMapping - Optional mapping of CSV headers to DB keys.
 * @returns {Array<Object>}
 */
export const parseCSV = (text, fieldMapping = {}) => {
  if (!text) return [];
  
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  // Robustly split components (handles quoted commas)
  const tokenize = (line) => {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            tokens.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    tokens.push(current.trim());
    return tokens;
  };

  const headers = tokenize(lines[0]).map(h => h.toLowerCase());
  
  return lines.slice(1).map(line => {
    const values = tokenize(line);
    const obj = {};
    
    headers.forEach((header, index) => {
      // Find mapping or use normalized header
      let targetKey = fieldMapping[header] || header.replace(/ /g, '_');
      
      // Basic data normalization
      let value = values[index]?.replace(/^"|"$/g, '').trim();
      
      // Auto-convert numbers if they look like numbers
      if (['loan_amount', 'amount', 'commission_rate'].includes(targetKey)) {
        value = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
      }
      
      obj[targetKey] = value;
    });
    
    return obj;
  });
};

/**
 * Generates and downloads a CSV file from an array of objects.
 * @param {Array<Object>} data - The data to export.
 * @param {Array<string>} headers - Human-readable column headers.
 * @param {Array<string>} keys - The object keys corresponding to headers.
 * @param {string} fileName - Destination filename.
 */
export const exportToCSV = (data, headers, keys, fileName) => {
  if (!data || data.length === 0) return;

  const csvContent = [
    headers.join(','),
    ...data.map(item => 
      keys.map(key => {
        const value = item[key] ?? '';
        // Quote strings that contain commas
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
