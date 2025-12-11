import React, { useContext, useState } from 'react';
import {
  useGetOrgLocationSummaryQuery,
  useGetOrgLocationRequestsByOrgQuery,
  useGetOrgAllowedLocationsByOrgQuery,
  useReviewOrgLocationRequestMutation,
  useStopAccessByOrgRequestMutation,
  useStartAccessByOrgRequestMutation,
  useDeleteOrgLocationRequestMutation,
  useRevokeOrgAllowedLocationMutation,
  useDeleteOrgAllowedLocationMutation,
} from '../../features/admin/adminApi';
import ColorModeContext from '../../context/ColorModeContext';
import { Link } from 'react-router-dom';

const OrgLocationSummary = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const { data, isLoading, error, refetch } = useGetOrgLocationSummaryQuery();

  const rows = data?.data || [];
  const [expanded, setExpanded] = useState({});

  const OrgAccordion = ({ org, onRefreshSummary }) => {
    const isOpen = !!expanded[org.id];
    const { data: reqsData, refetch: refetchReqs } = useGetOrgLocationRequestsByOrgQuery(org.id, { skip: !isOpen });
    const { data: allowData, refetch: refetchAllow } = useGetOrgAllowedLocationsByOrgQuery(org.id, { skip: !isOpen });

    const [reviewReq] = useReviewOrgLocationRequestMutation();
    const [stopAccess] = useStopAccessByOrgRequestMutation();
    const [startAccess] = useStartAccessByOrgRequestMutation();
    const [deleteReq] = useDeleteOrgLocationRequestMutation();
    const [revokeAllowed] = useRevokeOrgAllowedLocationMutation();
    const [deleteAllowed] = useDeleteOrgAllowedLocationMutation();

    const requests = reqsData?.data?.items || [];
    const allowed = allowData?.data || [];

    const doAction = async (fn) => {
      await fn;
      await Promise.all([refetchReqs(), refetchAllow()]);
      if (typeof onRefreshSummary === 'function') onRefreshSummary();
    };

    if (!isOpen) return null;

    return (
      <div className={`px-3 py-3 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
          <div className={`px-3 py-2 ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'} flex items-center justify-between`}>
            <div>
              <h4 className={`text-sm font-semibold`}>Locations (Requests & Allowed)</h4>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>All location requests with their status. Approved requests act as active login zones.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className={`p-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No requests yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${isDark ? 'text-gray-400' : 'text-gray-600'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-2 px-2">Address</th>
                    <th className="text-left py-2 px-2">Radius</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Emergency</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className={`py-2 px-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{r.address || '—'}</td>
                      <td className={`py-2 px-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{(r.requestedRadius ?? r.radius ?? 'NA')} m</td>
                      <td className={`py-2 px-2 capitalize ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{r.requestType || 'permanent'}</td>
                      <td className={`py-2 px-2 ${r.emergency ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.emergency ? 'Yes' : 'No'}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${r.status === 'pending' ? (isDark ? 'bg-amber-900 text-amber-200' : 'bg-amber-100 text-amber-700') : r.status === 'approved' ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700') : r.status === 'stopped' ? (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>{r.status}</span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex flex-wrap gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => doAction(reviewReq({ id: r._id, action: 'approve' }))} className={`px-2 py-1 rounded text-xs text-white ${isDark ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}>Approve</button>
                              <button onClick={() => doAction(reviewReq({ id: r._id, action: 'reject' }))} className={`px-2 py-1 rounded text-xs text-white ${isDark ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'}`}>Reject</button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <button onClick={() => doAction(stopAccess(r._id))} className={`px-2 py-1 rounded text-xs text-white ${isDark ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-yellow-600 hover:bg-yellow-700'}`}>Suspend</button>
                          )}
                          {r.status === 'stopped' && (
                            <button onClick={() => doAction(startAccess(r._id))} className={`px-2 py-1 rounded text-xs text-white ${isDark ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}>Reactivate</button>
                          )}
                          <button onClick={() => doAction(deleteReq(r._id))} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-5 ">
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-5 shadow-sm`}> 
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Organization Location Status</h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Summary of geo-fenced login access across all organizations.</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => refetch()} className={`px-3 py-1.5 text-xs rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>Refresh</button>
        </div>
      </div>

      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} overflow-hidden`}> 
        {isLoading ? (
          <p className={`p-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading summaries...</p>
        ) : error ? (
          <p className={`p-2 text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>Failed to load summaries</p>
        ) : rows.length === 0 ? (
          <p className={`p-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No organizations found</p>
        ) : (
          <div className="overflow-x-auto  px-2 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isDark ? 'text-gray-300' : 'text-gray-600'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-5 px-2">Organization</th>
                  <th className="text-left py-5 px-2">Enforce</th>
                  <th className="text-left py-5 px-2">Active Allowed</th>
                  <th className="text-left py-5 px-2">Pending</th>
                  <th className="text-left py-5 px-2">Approved</th>
                  <th className="text-left py-5 px-2">Stopped</th>
                  <th className="text-left py-5 px-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <React.Fragment key={r.id}>
                  <tr
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                  >
                    <td className={`py-2 px-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{r.name}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${r.enforce ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}>{r.enforce ? 'Yes' : 'No'}</span>
                    </td>
                    <td className={`py-2 px-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{r.activeAllowedCount}</td>
                    <td className={`py-2 px-2 ${r.pendingCount ? 'text-amber-600' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{r.pendingCount}</td>
                    <td className={`py-2 px-2 ${r.approvedCount ? 'text-green-600' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{r.approvedCount}</td>
                    <td className={`py-2 px-2 ${r.stoppedCount ? 'text-red-600' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{r.stoppedCount}</td>
                    <td className={`py-2 px-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{r.rolesEnforced?.length ? r.rolesEnforced.join(', ') : '—'}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Link to={`/superadmin/organizations/${r.id}`} onClick={(e)=>e.stopPropagation()} className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-violet-700 hover:bg-violet-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>Open</Link>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={8}>
                      <OrgAccordion org={r} onRefreshSummary={refetch} />
                    </td>
                  </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgLocationSummary;
