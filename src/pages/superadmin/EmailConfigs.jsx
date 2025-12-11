import { useEffect, useMemo, useState, useContext } from 'react';
import ColorModeContext from '../../context/ColorModeContext';

const apiBase = import.meta.env.VITE_API_BASE || '';
const basePath = '/api/v1/email-ticketing';

async function apiGet(path){
  const res = await fetch(apiBase + basePath + path, { credentials: 'include' });
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}
async function apiSend(path, method, body){
  const res = await fetch(apiBase + basePath + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

export default function EmailConfigs(){
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [envInfo, setEnvInfo] = useState(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    organization: '',
    emailAddress: 'support@bitmaxtest.com',
    imap: { host: 'mail.bitmaxtest.com', port: 993, secure: true, username: 'support@bitmaxtest.com', password: '' },
    smtp: { host: 'mail.bitmaxtest.com', port: 465, secure: true, username: 'support@bitmaxtest.com', password: '', fromName: 'Support' },
    isEnabled: true,
  });

  const load = async ()=>{
    setLoading(true); setErr('');
    try{
      const data = await apiGet('/admin/configs');
      setItems(data.configs || []);
      setEnvInfo(data.env || null);
    }catch(e){ setErr(e.message); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const onCreate = async ()=>{
    setErr('');
    try{
      await apiSend('/admin/configs', 'POST', form);
      await load();
      alert('Config created and listener started (if enabled).');
    }catch(e){ setErr(e.message); }
  };
  const onUpdate = async (id, patch)=>{
    setErr('');
    try{
      await apiSend(`/admin/configs/${id}`, 'PUT', patch);
      await load();
    }catch(e){ setErr(e.message); }
  };
  const onReload = async ()=>{
    setErr('');
    try{
      await apiSend('/admin/reload', 'POST', {});
      await load();
      alert('Reload triggered.');
    }catch(e){ setErr(e.message); }
  };

  const table = useMemo(()=> (
    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <th className="px-3 py-2 text-left">Org</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">IMAP</th>
            <th className="px-3 py-2 text-left">SMTP</th>
            <th className="px-3 py-2 text-left">Enabled</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950">
          {items.map(it => (
            <tr key={it._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
              <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{it.organization}</td>
              <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{it.emailAddress}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{it.imap.host}:{it.imap.port}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{it.smtp.host}:{it.smtp.port}</td>
              <td className="px-3 py-2">
                <span className={"px-2 py-1 rounded text-xs font-medium " + (it.isEnabled ? 'bg-green-600 text-white' : 'bg-gray-500 text-white')}>{it.isEnabled ? 'Enabled' : 'Disabled'}</span>
              </td>
              <td className="px-3 py-2">
                <span className={"px-2 py-1 rounded text-xs font-semibold text-white " + (it.status==='connected' ? 'bg-green-600' : it.status==='error' ? 'bg-red-600' : 'bg-gray-500')}>{it.status}</span>
              </td>
              <td className="px-3 py-2 text-right">
                <button className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition" onClick={()=>onUpdate(it._id, { isEnabled: !it.isEnabled })}>
                  {it.isEnabled ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [items]);

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Email Ticketing — Org Mail Configs</h1>
        <div className="space-x-2">
          <button className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm transition" onClick={onReload}>Reload IMAP Listeners</button>
          <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition" onClick={load}>Refresh</button>
        </div>
      </div>
      {envInfo && (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
          <div className="font-medium mb-1">ENV Listener</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{envInfo.emailAddress} — {envInfo.imap?.host}:{envInfo.imap?.port} — <span className="font-semibold">{envInfo.status}</span></div>
        </div>
      )}
      {err && <div className="text-red-600 dark:text-red-400 text-sm">{err}</div>}
      {loading ? <div className="animate-pulse text-sm text-gray-800 dark:text-gray-200">Loading…</div> : table}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Create Config</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="Organization ObjectId" value={form.organization} onChange={e=>setForm({...form, organization: e.target.value})} />
          <span className="sr-only">Organization ObjectId</span>
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="Email Address" value={form.emailAddress} onChange={e=>setForm({...form, emailAddress: e.target.value})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="IMAP Username" value={form.imap.username} onChange={e=>setForm({...form, imap:{...form.imap, username:e.target.value}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="IMAP Password" type="password" value={form.imap.password} onChange={e=>setForm({...form, imap:{...form.imap, password:e.target.value}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="IMAP Host" value={form.imap.host} onChange={e=>setForm({...form, imap:{...form.imap, host:e.target.value}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="IMAP Port" value={form.imap.port} onChange={e=>setForm({...form, imap:{...form.imap, port:Number(e.target.value)}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="SMTP Username (optional)" value={form.smtp.username || ''} onChange={e=>setForm({...form, smtp:{...form.smtp, username:e.target.value}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="SMTP Password (optional)" type="password" value={form.smtp.password || ''} onChange={e=>setForm({...form, smtp:{...form.smtp, password:e.target.value}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="SMTP Host" value={form.smtp.host} onChange={e=>setForm({...form, smtp:{...form.smtp, host:e.target.value}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="SMTP Port" value={form.smtp.port} onChange={e=>setForm({...form, smtp:{...form.smtp, port:Number(e.target.value)}})} />
          <input className="border p-2 rounded bg-white dark:bg-gray-950 dark:border-gray-600 dark:text-gray-200" placeholder="From Name" value={form.smtp.fromName || ''} onChange={e=>setForm({...form, smtp:{...form.smtp, fromName:e.target.value}})} />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form, isEnabled: e.target.checked})} /> Enabled</label>
        </div>
        <div className="mt-4">
          <button className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition" onClick={onCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
