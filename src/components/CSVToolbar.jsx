import React, { useRef } from 'react';
import { Plus, Download, Loader2 } from 'lucide-react';
import { parseCSV, exportToCSV } from '../utils/csvUtils';

/**
 * CSVToolbar Component
 * Provides Import/Export buttons with standardized logic.
 */
const CSVToolbar = ({ 
  entityType, 
  dataToExport, 
  exportHeaders, 
  exportKeys, 
  onImportSuccess,
  fieldMapping = {} 
}) => {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const parsedData = parseCSV(text, fieldMapping);
        
        if (onImportSuccess) {
          await onImportSuccess(parsedData);
        }
        
        alert(`Successfully processed ${parsedData.length} records.`);
      } catch (error) {
        console.error('CSV Import error:', error);
        alert('Failed to process CSV: ' + error.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleExport = () => {
    exportToCSV(dataToExport, exportHeaders, exportKeys, `${entityType}_export`);
  };

  return (
    <div className="flex items-center gap-3">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      
      <button 
        onClick={handleImportClick}
        disabled={isImporting}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer border-dashed disabled:opacity-50"
      >
        {isImporting ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : (
          <Plus size={16} className="text-primary" />
        )}
        Import CSV
      </button>

      <button 
        onClick={handleExport}
        disabled={!dataToExport || dataToExport.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all border-dashed disabled:opacity-50"
      >
        <Download size={16} />
        Export CSV
      </button>
    </div>
  );
};

export default CSVToolbar;
