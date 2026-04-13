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

  const downloadSample = (e) => {
    e.preventDefault();
    const sampleRows = [
      { name: 'John Doe', email: 'john@example.com', phone: '9876543210', loan_type: 'Home Loan', loan_amount: 5000000 },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '9123456789', loan_type: 'Business Loan', loan_amount: 2500000 }
    ];
    exportToCSV(sampleRows, exportHeaders, exportKeys, `${entityType}_sample_template`);
  };

  return (
    <div className="flex flex-col gap-1">
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
      <button 
        onClick={downloadSample}
        className="text-[10px] font-bold text-primary hover:underline text-left pl-1"
      >
        Download Sample Template
      </button>
    </div>
  );
};

export default CSVToolbar;
