import React, { useEffect, useState, useContext } from 'react';
import { API_URL } from '../../../config/api';
import axios from 'axios';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';

export default function AdminEmailConfig(){
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState([]);
  const [err, setErr] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [form, setForm] = useState({
    emailAddress: '',
    imap: { host: 'mail.bitmaxtest.com', port: 993, secure: true, username: '', password: '' },
    smtp: { host: 'mail.bitmaxtest.com', port: 465, secure: true, username: '', password: '', fromName: '' },
    isEnabled: true,
  });
  const [creating, setCreating] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const load = async ()=>{
    setLoading(true); setErr('');
    try {
      const res = await axios.get(`${API_URL}/api/v1/email-ticketing/admin/configs`, authHeaders);
      // Filter to current user's organization if backend attaches organizationId in token
      const orgId = JSON.parse(atob(token.split('.')[1]))?.organizationId;
      const orgConfigs = (res.data.configs||[]).filter(c=>c.organization===orgId);
      setConfigs(orgConfigs);
    } catch(e){ setErr(e.message); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const createConfig = async ()=>{
    setCreating(true); setErr('');
    try {
      const orgId = JSON.parse(atob(token.split('.')[1]))?.organizationId;
      const payload = { ...form, organization: orgId };
      await axios.post(`${API_URL}/api/v1/email-ticketing/admin/configs`, payload, authHeaders);
      setForm({
        emailAddress: '',
        imap: { host: 'mail.bitmaxtest.com', port: 993, secure: true, username: '', password: '' },
        smtp: { host: 'mail.bitmaxtest.com', port: 465, secure: true, username: '', password: '', fromName: '' },
        isEnabled: true,
      });
      load();
    } catch(e){ setErr(e.response?.data?.message || 'Failed'); }
    setCreating(false);
  };

  const testConfig = async (cfg)=>{
    try{
      const res = await axios.post(`${API_URL}/api/v1/email-ticketing/admin/configs/${cfg._id}/test`, {}, authHeaders);
      const { result } = res.data;
      // IMAP toast
      if(result.imap.ok){
        toast.success('IMAP: Connected');
      } else {
        toast.error(`IMAP: ${result.imap.error || 'Failed'}`);
      }
      // SMTP toast
      if(result.smtp.skipped){
        toast.info('SMTP: Skipped (missing creds)');
      } else if(result.smtp.ok){
        toast.success('SMTP: Connected');
      } else {
        toast.error(`SMTP: ${result.smtp.error || 'Failed'}`);
      }
    }catch(e){
      toast.error('Test failed: '+(e.response?.data?.message || e.message));
    }
  };

  const startEdit = (cfg)=>{
    setEditingId(cfg._id);
    setEditForm({
      imap:{ host: cfg.imap.host, port: cfg.imap.port, username: cfg.imap.username, password:'' },
      smtp:{ host: cfg.smtp.host, port: cfg.smtp.port, username: cfg.smtp.username || '', password:'', fromName: cfg.smtp.fromName || '' },
      isEnabled: cfg.isEnabled,
    });
  };

  const cancelEdit = ()=>{ setEditingId(null); setEditForm(null); };

  const saveEdit = async ()=>{
    if(!editingId || !editForm) return;
    try{
      const payload = {
        imap: { host: editForm.imap.host, port: Number(editForm.imap.port)||993, username: editForm.imap.username },
        smtp: { host: editForm.smtp.host, port: Number(editForm.smtp.port)||465, username: editForm.smtp.username || undefined, fromName: editForm.smtp.fromName },
        isEnabled: !!editForm.isEnabled,
      };
      if(editForm.imap.password) payload.imap.password = editForm.imap.password;
      if(editForm.smtp.password) payload.smtp.password = editForm.smtp.password;
      await axios.put(`${API_URL}/api/v1/email-ticketing/admin/configs/${editingId}`, payload, authHeaders);
      cancelEdit();
      load();
    }catch(e){ setErr(e.response?.data?.message || 'Update failed'); }
  };

  const toggleEnabled = async (cfg)=>{
    try {
      await axios.put(`${API_URL}/api/v1/email-ticketing/admin/configs/${cfg._id}`, { isEnabled: !cfg.isEnabled }, authHeaders);
      toast.success(!cfg.isEnabled ? 'Config enabled' : 'Config disabled');
      load();
    } catch(e){
      setErr('Update failed');
      toast.error(e.response?.data?.message || 'Failed to update');
    }
  };

  const deleteConfig = async (cfg)=>{
    if(!window.confirm('Delete config?')) return;
    try {
      await axios.delete(`${API_URL}/api/v1/email-ticketing/admin/configs/${cfg._id}`, authHeaders);
      load();
    } catch(e){ setErr('Delete failed'); }
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'}`}>
      <h1 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Organization Email Config</h1>
      {err && <div className="text-red-600 dark:text-red-400 text-sm">{err}</div>}
      {loading ? <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</div> : (
        configs.length === 0 ? <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No config yet.</div> : (
          <table className="min-w-full text-sm rounded border border-gray-200 dark:border-gray-700">
            <thead><tr className={`text-left ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-900'}`}><th className="px-2 py-2">Email</th><th className="px-2 py-2">IMAP</th><th className="px-2 py-2">SMTP</th><th className="px-2 py-2">Enabled</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Actions</th></tr></thead>
            <tbody className={isDark ? 'bg-gray-900' : 'bg-white'}>
              {configs.map(c=> (
                <tr key={c._id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`px-2 py-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{c.emailAddress}</td>
                  <td className={`px-2 py-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.imap.host}:{c.imap.port}</td>
                  <td className={`px-2 py-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.smtp.host}:{c.smtp.port}</td>
                  <td className="px-2 py-2"><button onClick={()=>toggleEnabled(c)} className={`px-2 py-1 rounded text-xs font-medium transition ${c.isEnabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}>{c.isEnabled?'Enabled':'Disabled'}</button></td>
                  <td className="px-2 py-2"><span className={`px-2 py-1 rounded text-xs text-white font-semibold ${c.status==='connected'?'bg-green-600':c.status==='error'?'bg-red-600':'bg-gray-500'}`}>{c.status}</span></td>
                  <td className="px-2 py-2 space-x-2">
                    <button onClick={()=>testConfig(c)} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs">Test</button>
                    <button onClick={()=>startEdit(c)} className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs">Edit</button>
                    <button onClick={()=>deleteConfig(c)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {editingId && editForm && (
        <div className={`mt-4 p-2 rounded border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Edit Config</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={editForm.imap.host} onChange={e=>setEditForm({...editForm, imap:{...editForm.imap, host:e.target.value}})} placeholder="IMAP Host" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input value={editForm.imap.port} onChange={e=>setEditForm({...editForm, imap:{...editForm.imap, port:e.target.value}})} placeholder="IMAP Port" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input value={editForm.imap.username} onChange={e=>setEditForm({...editForm, imap:{...editForm.imap, username:e.target.value}})} placeholder="IMAP Username" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input type="password" value={editForm.imap.password} onChange={e=>setEditForm({...editForm, imap:{...editForm.imap, password:e.target.value}})} placeholder="IMAP Password (leave blank to keep)" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>

            <input value={editForm.smtp.host} onChange={e=>setEditForm({...editForm, smtp:{...editForm.smtp, host:e.target.value}})} placeholder="SMTP Host" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input value={editForm.smtp.port} onChange={e=>setEditForm({...editForm, smtp:{...editForm.smtp, port:e.target.value}})} placeholder="SMTP Port" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input value={editForm.smtp.username} onChange={e=>setEditForm({...editForm, smtp:{...editForm.smtp, username:e.target.value}})} placeholder="SMTP Username" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input type="password" value={editForm.smtp.password} onChange={e=>setEditForm({...editForm, smtp:{...editForm.smtp, password:e.target.value}})} placeholder="SMTP Password (leave blank to keep)" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
            <input value={editForm.smtp.fromName} onChange={e=>setEditForm({...editForm, smtp:{...editForm.smtp, fromName:e.target.value}})} placeholder="From Name" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}/>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><input type="checkbox" checked={editForm.isEnabled} onChange={e=>setEditForm({...editForm, isEnabled:e.target.checked})}/> Enabled</label>
            <button onClick={saveEdit} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm">Save</button>
            <button onClick={cancelEdit} className={`px-4 py-2 rounded text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Cancel</button>
          </div>
        </div>
      )}

      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
        <h2 className={`font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Create Config</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={form.emailAddress} onChange={e=>setForm({...form, emailAddress:e.target.value})} placeholder="Email Address" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.imap.host} onChange={e=>setForm({...form, imap:{...form.imap, host:e.target.value}})} placeholder="IMAP Host" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.imap.port} onChange={e=>setForm({...form, imap:{...form.imap, port:e.target.value}})} placeholder="IMAP Port" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.imap.username} onChange={e=>setForm({...form, imap:{...form.imap, username:e.target.value}})} placeholder="IMAP Username" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input type="password" value={form.imap.password} onChange={e=>setForm({...form, imap:{...form.imap, password:e.target.value}})} placeholder="IMAP Password" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.smtp.host} onChange={e=>setForm({...form, smtp:{...form.smtp, host:e.target.value}})} placeholder="SMTP Host" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.smtp.port} onChange={e=>setForm({...form, smtp:{...form.smtp, port:e.target.value}})} placeholder="SMTP Port" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.smtp.username} onChange={e=>setForm({...form, smtp:{...form.smtp, username:e.target.value}})} placeholder="SMTP Username" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input type="password" value={form.smtp.password} onChange={e=>setForm({...form, smtp:{...form.smtp, password:e.target.value}})} placeholder="SMTP Password" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
          <input value={form.smtp.fromName} onChange={e=>setForm({...form, smtp:{...form.smtp, fromName:e.target.value}})} placeholder="From Name" className={`border rounded px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}/>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form, isEnabled:e.target.checked})}/> Enabled</label>
          <button disabled={creating} onClick={createConfig} className={`px-5 py-2 rounded text-sm text-white transition ${creating?'bg-gray-400 cursor-not-allowed':'bg-violet-600 hover:bg-violet-700'}`}>{creating?'Creating...':'Create'}</button>
        </div>
      </div>

    </div>
  );
}
