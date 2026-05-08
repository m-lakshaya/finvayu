import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

/**
 * CustomFieldsSection
 * Renders dynamic custom fields defined by the admin.
 *
 * Props:
 *   fields       – array of custom_field_definitions
 *   values       – current custom_fields JSONB object from the record
 *   onChange     – fn(key, value) called on every change
 *   disabled     – read-only mode (converted/closed leads)
 *   editMode     – if false, renders read-only display values
 */
const CustomFieldsSection = ({ fields = [], values = {}, onChange, disabled = false, editMode = true }) => {
  if (!fields.length) return null;

  const renderField = (f) => {
    const val = values?.[f.field_key] ?? '';

    if (!editMode || disabled) {
      // Read-only display
      let display = val;
      if (f.field_type === 'checkbox') display = val ? 'Yes' : 'No';
      if (f.field_type === 'date' && val) display = new Date(val).toLocaleDateString('en-IN');
      if (!display && display !== 0) display = '—';
      return (
        <div key={f.id}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{String(display)}</p>
        </div>
      );
    }

    const base = "w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium";

    let input;
    switch (f.field_type) {
      case 'textarea':
        input = (
          <textarea
            rows={3}
            value={val}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base + ' resize-none'}
            placeholder={f.label}
          />
        );
        break;
      case 'select':
        input = (
          <select
            value={val}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base}
          >
            <option value="">— Select —</option>
            {(f.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
        break;
      case 'checkbox':
        input = (
          <label className="flex items-center gap-3 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={!!val}
              onChange={e => onChange(f.field_key, e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.label}</span>
          </label>
        );
        return <div key={f.id}>{input}</div>;
      case 'number':
        input = (
          <input
            type="number"
            value={val}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base}
            placeholder={f.label}
          />
        );
        break;
      case 'date':
        input = (
          <input
            type="date"
            value={val ? String(val).slice(0, 10) : ''}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base}
          />
        );
        break;
      case 'phone':
        input = (
          <input
            type="tel"
            value={val}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base}
            placeholder={f.label}
          />
        );
        break;
      case 'email':
        input = (
          <input
            type="email"
            value={val}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base}
            placeholder={f.label}
          />
        );
        break;
      default: // text
        input = (
          <input
            type="text"
            value={val}
            onChange={e => onChange(f.field_key, e.target.value)}
            className={base}
            placeholder={f.label}
          />
        );
    }

    return (
      <div key={f.id}>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
          {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {input}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <SlidersHorizontal size={14} className="text-primary" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Fields</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>
    </div>
  );
};

export default CustomFieldsSection;
