import React from 'react';
import { ArrowRight, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useGetEscalationChainQuery } from '../../features/query/queryApi';

export default function EscalationTimeline({ petitionId, isDark = false }) {
  const { data, isLoading, isError } = useGetEscalationChainQuery(petitionId, { skip: !petitionId });
  const chain = data?.data?.chain || [];

  if (isLoading) {
    return (
      <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="animate-pulse h-4 w-40 mb-3 rounded bg-gray-300 dark:bg-slate-600"></div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 rounded bg-gray-100 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 text-red-500 text-sm"><AlertTriangle size={16}/> Failed to load escalation chain</div>
      </div>
    );
  }

  return (
    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Escalation Timeline</h4>
        <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Clock size={14}/> {chain.length} step{chain.length !== 1 ? 's' : ''}
        </div>
      </div>
      {chain.length === 0 ? (
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No escalations yet.</p>
      ) : (
        <div className="space-y-2">
          {chain.map((step, idx) => (
            <div key={idx} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-600 text-gray-100' : 'bg-white border border-gray-200 text-gray-700'}`}>#{step.step}</span>
                <UserChip user={step.from} isDark={isDark} />
                <ArrowRight size={14} className={isDark ? 'text-gray-300' : 'text-gray-500'} />
                <UserChip user={step.to} isDark={isDark} />
                {step.reason && (
                  <span className={`ml-2 text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Reason: {step.reason}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={step.status} />
                {step.requestedAt && <TimeTag label="Req" ts={step.requestedAt} />}
                {step.acceptedAt && <TimeTag label="Acc" ts={step.acceptedAt} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserChip({ user, isDark }) {
  if (!user) return <span className="text-xs italic text-gray-400">Unknown</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-600 text-gray-100' : 'bg-white text-gray-800 border border-gray-200'}`}>
      <span>{user.name || shortId(user.id)}</span>
      {user.role && <span className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>({user.role})</span>}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'Accepted') {
    return <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"><CheckCircle2 size={12}/> Accepted</span>;
  }
  if (status === 'Rejected') {
    return <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"><XCircle size={12}/> Rejected</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"><Clock size={12}/> Requested</span>;
}

function TimeTag({ label, ts }) {
  const d = new Date(ts);
  const abs = isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 dark:bg-slate-900/30 dark:text-gray-300 dark:border-slate-700" title={abs}>
      {label}: {abs}
    </span>
  );
}

function shortId(id) {
  if (!id) return 'N/A';
  const s = String(id);
  return s.slice(-6);
}
