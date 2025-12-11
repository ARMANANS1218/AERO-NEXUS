import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';
import { toast } from 'react-toastify';

// Utility function to create a proper display name
const getDisplayName = (customerName, customerEmail) => {
  if (!customerName && !customerEmail) return 'Unknown';
  
  // If we have an email but no name, extract name from email
  if (!customerName && customerEmail) {
    const emailPrefix = customerEmail.split('@')[0];
    return formatEmailPrefix(emailPrefix);
  }
  
  // If customerName looks like an email prefix, format it
  if (customerName && !customerName.includes(' ') && !customerName.includes('@')) {
    return formatEmailPrefix(customerName);
  }
  
  // Return the customerName if it looks like a proper name
  return customerName || formatEmailPrefix((customerEmail || '').split('@')[0]);
};

// Convert email prefixes to readable names
const formatEmailPrefix = (prefix) => {
  if (!prefix) return 'Guest User';
  
  return prefix
    .replace(/[._-]/g, ' ') // Replace dots, underscores, hyphens with spaces
    .replace(/\d+/g, '') // Remove numbers
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || 'Guest User';
};

export default function EmailTickets() {
  const token = localStorage.getItem('token');
  // Status tabs: all | open | pending | closed (display open as IN PROCESS)
  const [statusTab, setStatusTab] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null); // ticketId expanded for thread
  const [replyText, setReplyText] = useState('');
  const [form, setForm] = useState({ subject: '', body: '', priority: 'medium' });
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [threadMessages, setThreadMessages] = useState({}); // {ticketId: messages[]}
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [sendingReply, setSendingReply] = useState(false);

  const orgId = useMemo(() => {
    try { return JSON.parse(atob(token.split('.')[1]))?.organizationId || null; } catch { return null; }
  }, [token]);

  const role = useMemo(() => {
    try { return JSON.parse(atob(token.split('.')[1]))?.role || 'Agent'; } catch { return 'Agent'; }
  }, [token]);

  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}`, 'x-organization-id': orgId } }), [token, orgId]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchDebounced.trim()) {
        params.search = searchDebounced.trim();
      } else if (statusTab !== 'all') {
        params.status = statusTab === 'in-process' ? 'open' : statusTab; // only filter when not searching
      }
      params.page = page;
      params.limit = limit;
      const res = await axios.get(`${API_URL}/api/v1/email-ticketing/tickets`, { ...auth, params });
      setTickets(res.data.tickets || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load tickets');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusTab, searchDebounced, page]);
  useEffect(() => { setPage(1); }, [statusTab, searchDebounced]);

  // Debounce search input
  useEffect(() => {
    const h = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(h);
  }, [search]);

  const createInternal = async () => {
    setCreating(true);
    try {
      const payload = { channel: 'internal', title: form.subject, description: form.body, priority: form.priority, organization: orgId };
      const res = await axios.post(`${API_URL}/api/v1/email-ticketing/tickets/create`, payload, auth);
      toast.success('Ticket created');
      setForm({ subject: '', body: '', priority: 'medium' });
      setTickets([res.data.ticket, ...tickets]);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create ticket');
    }
    setCreating(false);
  };

  const reply = async (ticket) => {
    if (!replyText.trim()) { toast.info('Type a reply first'); return; }
    setSendingReply(true);
    try {
      const senderType = role?.toLowerCase() === 'qa' ? 'qa' : role?.toLowerCase() === 'tl' ? 'tl' : 'agent';
      await axios.post(`${API_URL}/api/v1/email-ticketing/tickets/reply`, { ticketId: ticket.ticketId, message: replyText, senderType }, auth);
      toast.success('Reply sent');
      setReplyText('');
      await fetchThread(ticket.ticketId); // refresh thread
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send reply');
    }
    setSendingReply(false);
  };

  const fetchThread = useCallback(async (ticketId) => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/email-ticketing/tickets/${ticketId}`, auth);
      setThreadMessages(prev => ({ ...prev, [ticketId]: res.data.messages || [] }));
    } catch (e) {
      toast.error('Failed to load thread');
    }
  }, [auth]);

  const toggleExpand = (ticketId) => {
    setExpanded(expanded === ticketId ? null : ticketId);
    if (expanded !== ticketId) fetchThread(ticketId);
  };

  const timeAgo = (d) => {
    const now = new Date();
    const date = new Date(d);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff/60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
    const day = Math.floor(h/24); if (day < 7) return `${day}d ago`;
    return date.toLocaleString();
  };

  const priorityBadge = (p) => {
    const color = p === 'high' ? 'bg-red-600' : p === 'medium' ? 'bg-amber-500' : 'bg-green-600';
    return <span className={`inline-block px-2 py-0.5 rounded text-white text-[10px] font-semibold ${color}`}>{(p||'N/A').toUpperCase()}</span>;
  };

  const statusBadge = (s) => {
    const label = s === 'open' ? 'IN PROCESS' : (s||'').toUpperCase();
    const color = s === 'pending' ? 'bg-amber-500' : s === 'closed' ? 'bg-slate-600' : 'bg-indigo-600';
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px] font-semibold ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>{label}
    </span>;
  };

  return (
    <div className="p-2 md:p-6 text-gray-900 dark:text-gray-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ticket List</h1>
          <p className="text-xs opacity-70">Track, search and respond to tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={load} 
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            title="Refresh tickets"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={()=>setShowCreate(v=>!v)} className="px-3 py-2 rounded text-sm text-white bg-violet-600 hover:bg-violet-700 shadow-sm">
            {showCreate ? 'Close' : 'New Internal Ticket'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-1">
          {['all','open','pending','closed'].map(tab => (
            <button
              key={tab}
              onClick={()=>setStatusTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${statusTab===tab ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {tab === 'open' ? 'IN PROCESS' : tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticket / requester / assignee" className="border rounded-md pl-9 pr-8 py-2 text-sm dark:bg-gray-950 dark:border-gray-600 dark:text-white w-72" />
          {search && (
            <button onClick={()=>setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white" aria-label="Clear search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>
      </div>

      {/* Create internal ticket panel */}
      {showCreate && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-2 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} placeholder="Subject" className="border rounded px-3 py-2 dark:bg-gray-950 dark:border-gray-600 dark:text-white md:col-span-2" />
            <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})} className="border rounded px-3 py-2 dark:bg-gray-950 dark:border-gray-600 dark:text-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button disabled={creating || !form.subject.trim()} onClick={createInternal} className={`px-4 py-2 rounded text-white ${creating?'bg-gray-400':'bg-green-600 hover:bg-green-700'} md:justify-self-end`}>{creating?'Creating...':'Create Ticket'}</button>
          </div>
          <textarea value={form.body} onChange={e=>setForm({...form, body:e.target.value})} placeholder="Describe the issue" className="mt-3 w-full h-24 border rounded px-3 py-2 dark:bg-gray-950 dark:border-gray-600 dark:text-white" />
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-950 shadow-sm">
        <table className="min-w-full text-xs md:text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
              <th className="px-3 py-3 text-left">Ticket ID</th>
              <th className="px-3 py-3 text-left">Subject</th>
              <th className="px-3 py-3 text-left">Request By</th>
              <th className="px-3 py-3 text-left">Assignee</th>
              <th className="px-3 py-3 text-left">Priority</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Created</th>
              <th className="px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4" colSpan={8}>Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td className="px-3 py-4" colSpan={8}>No tickets</td></tr>
            ) : tickets.map(t => {
              const displayStatus = t.status === 'open' ? 'IN PROCESS' : t.status?.toUpperCase();
              const requester = t.channel === 'email' ? getDisplayName(t.customerName, t.customerEmail) : (t.createdBy?.name || t.createdBy?.email || 'Internal');
              const assignee = t.assignedTo?.name || t.assignedTo?.email || '-';
              return (
                <React.Fragment key={t.ticketId}>
                  <tr className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition ${expanded===t.ticketId ? 'bg-violet-50 dark:bg-gray-950' : ''}`} onClick={()=>toggleExpand(t.ticketId)}>
                    <td className="px-3 py-3 font-medium dark:text-white">{t.ticketId}</td>
                    <td className="px-3 py-3 dark:text-white truncate max-w-xs" title={t.subject}>
                      <div className="flex items-center justify-between">
                        <span>{t.subject || '(no subject)'}</span>
                        <button 
                          onClick={(e) => {e.stopPropagation(); fetchThread(t.ticketId); toast.info('Refreshing ticket...');}}
                          className="ml-2 p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                          title="Refresh ticket"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 dark:text-white" title={requester}>{requester}</td>
                    <td className="px-3 py-3 dark:text-white">{assignee}</td>
                    <td className="px-3 py-3 capitalize dark:text-white">{priorityBadge(t.priority)}</td>
                    <td className="px-3 py-3 dark:text-white">{statusBadge(t.status)}</td>
                    <td className="px-3 py-3 dark:text-white" title={new Date(t.createdAt).toLocaleString()}>{timeAgo(t.createdAt)}</td>
                    <td className="px-3 py-3">
                      <button onClick={(e)=>{e.stopPropagation(); toggleExpand(t.ticketId);}} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                        {expanded===t.ticketId? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === t.ticketId && (
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td colSpan={8} className="px-4 py-3 bg-white dark:bg-gray-950">
                        <div className="space-y-3">
                          <div className="text-sm font-semibold">Conversation</div>
                          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                            {(threadMessages[t.ticketId] || []).map(m => (
                              <div key={m._id} className="text-xs md:text-sm p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium capitalize">{m.senderType}</span>
                                  <span className="opacity-70">{new Date(m.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="whitespace-pre-wrap">{m.message}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 items-start">
                            <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write a reply" className="border rounded px-2 py-2 flex-1 h-20 text-sm dark:bg-gray-950 dark:border-gray-600 dark:text-white" />
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={()=>reply(t)} 
                                disabled={sendingReply}
                                className={`px-4 py-2 rounded text-white text-sm ${sendingReply ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                              >
                                {sendingReply ? 'Sending...' : 'Send Reply'}
                              </button>
                              <button onClick={()=>{setReplyText('');}} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-950 dark:text-white text-sm">Clear</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs opacity-70">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className={`px-3 py-1 rounded text-sm ${page<=1?'bg-gray-300 dark:bg-gray-950 cursor-not-allowed':'bg-gray-200 dark:bg-gray-950 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Prev</button>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className={`px-3 py-1 rounded text-sm ${page>=totalPages?'bg-gray-300 dark:bg-gray-950 cursor-not-allowed':'bg-gray-200 dark:bg-gray-950 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Next</button>
        </div>
      </div>
    </div>
  );
}
