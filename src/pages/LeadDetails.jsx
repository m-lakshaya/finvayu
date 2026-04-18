import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Loader2,
  Plus,
  IndianRupee,
  Percent,
  FileCheck,
  PhoneCall,
  Calendar,
  CheckSquare,
  Trash2,
  User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const TASK_TYPES = ['Call', 'Email', 'Meeting', 'To-Do'];
const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Deferred'];
const TASK_PRIORITIES = ['Low', 'Normal', 'High'];

const statusColor = (s) => {
  if (s === 'Completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
  if (s === 'In Progress') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  if (s === 'Deferred') return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
};

const priorityColor = (p) => {
  if (p === 'High') return 'text-red-500';
  if (p === 'Normal') return 'text-blue-500';
  return 'text-slate-400';
};

const typeIcon = (t) => {
  if (t === 'Call') return PhoneCall;
  if (t === 'Email') return Mail;
  if (t === 'Meeting') return Calendar;
  return CheckSquare;
};

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, hasPermission } = useAuth();
  
  const isCustomerRecord = location.pathname.includes('customers');
  const recordType = isCustomerRecord ? 'Customer' : 'Lead';
  const table = isCustomerRecord ? 'customers' : 'leads';

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    subject: '', type: 'Call', status: 'Not Started', priority: 'Normal', due_date: '', notes: ''
  });
  const [savingTask, setSavingTask] = useState(false);
  const [executives, setExecutives] = useState([]);
  
  const canSetCommission = hasPermission('SET_COMMISSION');
  const canRaiseInvoice = hasPermission('RAISE_INVOICE');
  const canProcessPayment = hasPermission('PROCESS_PAYMENT');

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
        if (error) throw error;
        setRecord(data);
      } catch (error) {
        console.error('Error fetching record:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, table]);

  const fetchTasks = async () => {
    if (!id) return;
    setTasksLoading(true);
    try {
      const column = isCustomerRecord ? 'customer_id' : 'lead_id';
      const { data, error } = await supabase.from('tasks').select('*').eq(column, id).order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [id, isCustomerRecord]);

  useEffect(() => {
    const fetchExecutives = async () => {
      if (!profile?.org_id) return;
      const { data, error } = await supabase.from('profiles').select('id, full_name, name, first_name, last_name, email').eq('org_id', profile.org_id);
      if (!error) setExecutives(data || []);
    };
    fetchExecutives();
  }, [profile?.org_id]);

  const handleUpdateRecord = async (updates) => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
      if (error) throw error;
      setRecord(data);
    } catch (error) {
      console.error('Error updating record:', error.message);
      alert('Failed to update: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToCustomer = async () => {
    if (!window.confirm('Are you sure you want to convert this lead to a customer?')) return;
    setUpdating(true);
    try {
      const { data: customerData, error: insertError } = await supabase.from('customers').insert([{
        name: record.name, email: record.email, phone: record.phone, address: record.address, org_id: record.org_id, owner_id: record.owner_id, loan_type: record.loan_type, loan_amount: record.loan_amount, source: record.source, status: 'Active'
      }]).select().single();
      if (insertError) throw insertError;
      await supabase.from('leads').update({ status: 'Converted' }).eq('id', id);
      navigate(`/customers/${customerData.id}`);
    } catch (error) {
      console.error('Conversion error:', error.message);
      alert('Failed to convert: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRaiseInvoice = async () => {
    const commRate = record.commission_rate || 0;
    const commAmt = ((record.loan_amount || 0) * commRate) / 100;
    handleUpdateRecord({ invoice_status: 'raised', commission_amount: commAmt });
  };

  const handleSaveTask = async () => {
    if (!taskForm.subject.trim()) { alert('Subject is required.'); return; }
    setSavingTask(true);
    try {
      const column = isCustomerRecord ? 'customer_id' : 'lead_id';
      const payload = { ...taskForm, org_id: profile.org_id, owner_id: profile.id, [column]: id, due_date: taskForm.due_date || null };
      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) throw error;
      setTaskForm({ subject: '', type: 'Call', status: 'Not Started', priority: 'Normal', due_date: '', notes: '' });
      setShowTaskModal(false);
      fetchTasks();
    } catch (error) {
      alert('Failed to save task: ' + error.message);
    } finally {
      setSavingTask(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await supabase.from('tasks').update({ status: 'Completed', completed_at: new Date().toISOString() }).eq('id', taskId);
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary mb-4" size={40} />
    </div>
  );

  if (!record) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Shield size={40} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-bold">Record Not Found</h2>
      <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-primary text-white rounded-xl">Go Back</button>
    </div>
  );

  // Fallback to active profile if owner matches but isn't in executives list
  let ownerInfo = executives.find(e => e.id === record.owner_id);
  if (!ownerInfo && record.owner_id === profile?.id) ownerInfo = profile;
  
  const ownerName = ownerInfo ? (ownerInfo.first_name ? `${ownerInfo.first_name} ${ownerInfo.last_name || ''}` : ownerInfo.full_name || ownerInfo.name) : 'Unassigned';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      
      {/* Header section - Clean & Minimalist */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{record.name}</h1>
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${
              isCustomerRecord ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {isCustomerRecord ? 'Active Customer' : record.status}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{recordType} ID • {record.id}</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {!isCustomerRecord && record.status !== 'Converted' && (
            <button onClick={handleConvertToCustomer} disabled={updating} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
              {updating ? 'Processing...' : 'Convert to Customer'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Core Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Mail size={12}/> Email Address</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{record.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Phone size={12}/> Phone Number</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{record.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin size={12}/> Location</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{record.address || '—'}</p>
                </div>
              </div>

              <div className="space-y-6">
                
                {/* Prominent Record Owner Display */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={12}/> Record Owner</p>
                  <select 
                    value={record.owner_id || ''}
                    onChange={(e) => handleAssignExecutive(e.target.value)}
                    className="w-full bg-transparent text-sm font-black text-primary outline-none cursor-pointer appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {(executives.find(e => e.id === profile?.id) ? executives : [...executives, profile].filter(Boolean)).map(exec => (
                      <option key={exec.id} value={exec.id}>
                        {exec.first_name ? `${exec.first_name} ${exec.last_name || ''}` : exec.full_name || exec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FileText size={12}/> Loan Details</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">₹{record.loan_amount?.toLocaleString() || 0}</p>
                    <p className="text-xs font-bold text-slate-500">{record.loan_type || 'Unspecified Type'}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Activity Log</h3>
              <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                <Plus size={14} /> Add Task
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {tasks.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No scheduled activities</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const TypeIcon = typeIcon(task.type);
                  return (
                    <div key={task.id} className={`p-5 flex gap-4 ${task.status === 'Completed' ? 'opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} transition-colors group`}>
                      <div className={`mt-1 ${task.status === 'Completed' ? 'text-emerald-500' : 'text-primary'}`}><TypeIcon size={18} /></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>{task.subject}</p>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {task.status !== 'Completed' && <button onClick={() => handleCompleteTask(task.id)} className="text-slate-400 hover:text-emerald-500"><CheckCircle2 size={16}/></button>}
                            <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className={priorityColor(task.priority)}>{task.priority} Priority</span>
                          <span>•</span>
                          <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Status & Finances */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><IndianRupee size={120} /></div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 relative z-10">Financial Overview</h4>
            
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Status</p>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-widest ${
                    record.invoice_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    record.invoice_status === 'raised' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {record.invoice_status || 'Pending'}
                  </span>
                  
                  {canRaiseInvoice && record.invoice_status === 'pending' && (
                    <button onClick={handleRaiseInvoice} className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">Generate</button>
                  )}
                  {canProcessPayment && record.invoice_status === 'raised' && (
                    <button onClick={() => handleUpdateRecord({ invoice_status: 'paid' })} className="text-[10px] font-bold text-emerald-400 hover:text-white transition-colors uppercase tracking-widest">Mark Paid</button>
                  )}
                </div>
              </div>

              {canSetCommission ? (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commission Rate (%)</p>
                    <input 
                      type="number" 
                      value={record.commission_rate || ''}
                      onChange={(e) => handleUpdateRecord({ commission_rate: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-800 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm font-bold w-full focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commission Amount (₹)</p>
                    <input 
                      type="number" 
                      value={record.commission_amount || ''}
                      onChange={(e) => handleUpdateRecord({ commission_amount: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-800 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm font-bold w-full focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Rate</p>
                    <p className="font-bold text-white">{record.commission_rate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Earnings</p>
                    <p className="text-xl font-black text-emerald-400">₹{record.commission_amount?.toLocaleString() || 0}</p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black mb-6">Create Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Subject</label>
                <input type="text" value={taskForm.subject} onChange={e => setTaskForm({...taskForm, subject: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" placeholder="Follow up about documents..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Type</label>
                  <select value={taskForm.type} onChange={e => setTaskForm({...taskForm, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none">
                    {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none">
                    {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Due Date</label>
                <input type="datetime-local" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Notes</label>
                <textarea value={taskForm.notes} onChange={e => setTaskForm({...taskForm, notes: e.target.value})} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none resize-none"></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowTaskModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={handleSaveTask} disabled={savingTask} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">{savingTask ? 'Saving...' : 'Save Task'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadDetails;
