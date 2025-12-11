import React from 'react';
import { Clock, ArrowRight, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useGetRecentEscalationsQuery } from '../../features/query/queryApi';

export default function RecentEscalations({ limit = 10, isDark = false }) {
  const { data, isLoading, isError } = useGetRecentEscalationsQuery({ limit });
  const items = data?.data || [];

  if (isLoading) {
    return (
      <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="animate-pulse h-6 w-40 mb-4 rounded bg-gray-300 dark:bg-slate-600"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded bg-gray-100 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={16}/> Failed to load recent escalations</div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Escalations</h3>
        <div className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Clock size={16}/> Updated live
        </div>
      </div>

      {items.length === 0 ? (
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No escalations yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((q) => (
            <div key={q.petitionId} className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{q.petitionId}</div>
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{q.subject}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${badgeColor(q.priority)}`}>{q.priority}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-600 text-gray-200' : 'bg-white text-gray-700 border border-gray-200'}`}>{q.category}</span>
                </div>
              </div>

              {/* Chain timeline */}
              <div className="flex items-center flex-wrap gap-2">
                {q.chain && q.chain.length > 0 ? (
                  q.chain.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <Chip user={step.from} isDark={isDark} />
                      <ArrowRight size={16} className={isDark ? 'text-gray-300' : 'text-gray-500'} />
                      <Chip user={step.to} isDark={isDark} />
                      {idx < q.chain.length - 1 && (
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>|</span>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>No chain</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ user, isDark }) {
  if (!user) return <span className="text-xs italic text-gray-400">Unknown</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-600 text-gray-100' : 'bg-white text-gray-800 border border-gray-200'}`}>
      <UserIcon size={14} className={isDark ? 'text-gray-300' : 'text-gray-500'} />
      <span>{user.name || shortId(user.id)}</span>
      {user.role && <span className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>({user.role})</span>}
    </span>
  );
}

function shortId(id) {
  if (!id) return 'N/A';
  const s = String(id);
  return s.slice(-6);
}

function badgeColor(priority) {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'High':
      return 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'Medium':
      return 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-slate-900/30 dark:text-gray-300 dark:border-slate-700';
  }
}
