import React, { useRef } from 'react';
import { Upload, Download, FileText, Loader2 } from 'lucide-react';
import { parseCSV, exportToCSV } from '../utils/csvUtils';

/**
 * CSVToolbar — Import / Export / Sample Template
 * Props:
 *   entityType      – 'leads' | 'customers' | 'tasks'
 *   exportHeaders   – human-readable column names
 *   exportKeys      – matching object keys
 *   sampleRows      – example rows for the template download
 *   onExportAll     – async fn() → returns row array  (fetches fresh from DB)
 *   onImportSuccess – async fn(parsedRows)
 *   onImportError   – fn(message)
 *   fieldMapping    – optional { 'csv header': 'db_key' }
 */
const CSVToolbar = ({
  entityType = 'records',
  exportHeaders = [],
  exportKeys = [],
  sampleRows = [],
  onExportAll,
  onImportSuccess,
  onImportError,
  fieldMapping = {},
}) => {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = parseCSV(ev.target.result, fieldMapping);
        if (!parsed.length) throw new Error('No valid rows found in the CSV.');
        await onImportSuccess?.(parsed);
      } catch (err) {
        onImportError?.(err.message || 'Import failed');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    if (!onExportAll) return;
    setIsExporting(true);
    try {
      const rows = await onExportAll();
      if (!rows?.length) {
        onImportError?.('No records found to export.');
        return;
      }
      exportToCSV(rows, exportHeaders, exportKeys, `${entityType}_export`);
    } catch (err) {
      onImportError?.('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSample = () => {
    const rows = sampleRows.length
      ? sampleRows
      : [Object.fromEntries(exportKeys.map((k, i) => [k, exportHeaders[i] || k]))];
    exportToCSV(rows, exportHeaders, exportKeys, `${entityType}_sample_template`);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all disabled:opacity-50"
        >
          {isImporting
            ? <Loader2 size={14} className="animate-spin text-primary" />
            : <Upload size={14} />}
          Import CSV
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all disabled:opacity-50"
        >
          {isExporting
            ? <Loader2 size={14} className="animate-spin text-primary" />
            : <Download size={14} />}
          Export All
        </button>
      </div>

      <button
        onClick={handleSample}
        className="text-[10px] font-bold text-primary hover:underline text-left pl-1 flex items-center gap-1"
      >
        <FileText size={10} /> Download sample template
      </button>
    </div>
  );
};

export default CSVToolbar;
