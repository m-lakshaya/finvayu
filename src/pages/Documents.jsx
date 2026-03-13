import React from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileUp,
  FolderOpen
} from 'lucide-react';

const Documents = () => {
  const docs = [
    { name: 'Aditya_PAN_Card.pdf', size: '1.2 MB', category: 'ID Proof', lead: 'Aditya Birla', date: 'Mar 12, 2024', status: 'Verified' },
    { name: 'Home_Loan_Agreement_V2.pdf', size: '2.5 MB', category: 'Agreement', lead: 'Karan Sharma', date: 'Mar 11, 2024', status: 'Pending' },
    { name: 'Salary_Slip_Feb_2024.pdf', size: '850 KB', category: 'Income Proof', lead: 'Rohan Mehra', date: 'Mar 10, 2024', status: 'Rejected' },
    { name: 'Bank_Statement_HDFC.xlsx', size: '4.8 MB', category: 'Finance', lead: 'Aditya Birla', date: 'Mar 09, 2024', status: 'Verified' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Central Documents</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Access, verify, and manage all files uploaded for various loan cases.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <FileUp size={18} />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Categories View */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'ID Proofs', count: 124, icon: FileText, color: 'text-blue-500' },
          { label: 'Address Proofs', count: 86, icon: FolderOpen, color: 'text-emerald-500' },
          { label: 'Income Proofs', count: 212, icon: FileText, color: 'text-orange-500' },
          { label: 'Agreements', count: 45, icon: FolderOpen, color: 'text-primary' },
          { label: 'Certificates', count: 32, icon: FileText, color: 'text-indigo-500' },
          { label: 'Misc', count: 18, icon: FolderOpen, color: 'text-slate-500' },
        ].map((cat, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all cursor-pointer group">
            <div className={`${cat.color} mb-3 group-hover:scale-110 transition-transform`}>
              <cat.icon size={24} />
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{cat.label}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.count} Files</p>
          </div>
        ))}
      </div>

      {/* Docs Area */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search files by name or lead..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Lead Associate</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {docs.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">{doc.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-tighter italic">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300">{doc.lead}</td>
                  <td className="px-6 py-5 font-medium text-slate-500 text-xs">{doc.date}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 capitalize font-black text-[10px] tracking-tighter">
                      {doc.status === 'Verified' ? <CheckCircle2 size={14} className="text-emerald-500" /> : 
                       doc.status === 'Pending' ? <Clock size={14} className="text-orange-500" /> : 
                       <AlertCircle size={14} className="text-rose-500" />}
                      <span className={doc.status === 'Verified' ? 'text-emerald-500' : doc.status === 'Pending' ? 'text-orange-500' : 'text-rose-500 text-sm'}>
                        {doc.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Eye size={16} /></button>
                      <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"><Download size={16} /></button>
                      <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;
