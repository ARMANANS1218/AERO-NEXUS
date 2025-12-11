import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, User, CheckCircle, Clock, AlertCircle, Search, ChevronDown, Layers } from 'lucide-react';
import { useTransferRequestMutation } from '../features/query/queryApi';
import { useGetEscalationHierarchyQuery } from '../features/admin/adminApi';
import { toast } from 'react-toastify';
import { IMG_PROFILE_URL } from '../config/api';

export default function TransferDialog({ isOpen, onClose, petitionId, querySubject, currentAssignee }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [reason, setReason] = useState('');
  const [departmentFilters, setDepartmentFilters] = useState({ 'Tier-1': 'all', 'Tier-2': 'all', 'Tier-3': 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [expanded, setExpanded] = useState({ 'Tier-1': true, 'Tier-2': true, 'Tier-3': true });
  // Fetch tier-wise escalation hierarchy
  const { data: hierarchyData, isLoading: isHierarchyLoading, refetch } = useGetEscalationHierarchyQuery();
  
  const [transferRequest, { isLoading: isRequesting }] = useTransferRequestMutation();
  const hierarchy = hierarchyData?.data || {};
  const availableAgents = useMemo(() => {
    const list = [];
    Object.keys(hierarchy).forEach((tier) => {
      const depts = hierarchy[tier] || {};
      Object.keys(depts).forEach((dept) => {
        (depts[dept] || []).forEach((user) => {
          list.push({ ...user, tier, department: dept });
        });
      });
    });
    return list;
  }, [hierarchy]);

  // Filter agents by search query
  const filteredAgents = availableAgents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Exclude current assignee (handle both object and string ID)
    const currentAssigneeId = typeof currentAssignee === 'object' ? currentAssignee?._id : currentAssignee;
    const isNotCurrentAssignee = agent._id !== currentAssigneeId;
    
    return matchesSearch && isNotCurrentAssignee;
  });

  useEffect(() => {
    if (isOpen) {
      refetch();
      setSelectedAgent(null);
      setReason('');
      setDepartmentFilters({ 'Tier-1': 'all', 'Tier-2': 'all', 'Tier-3': 'all' });
      setSearchQuery('');
      setShowConfirmation(false);
    }
  }, [isOpen, refetch]);

  if (!isOpen) return null;

  const handleTransfer = async () => {
    if (!selectedAgent) {
      toast.error('Select an escalation target');
      return;
    }

    if (!reason.trim()) {
      toast.error('Provide a reason for escalation');
      return;
    }

    try {
      // Submit transfer request (recipient will receive popup to accept)
      await transferRequest({
        petitionId,
        toAgentId: selectedAgent._id,
        reason: reason.trim(),
      }).unwrap();

      toast.success(`Escalation request sent to ${selectedAgent.name}`);
      handleClose();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to request escalation');
    }
  };

  const handleClose = () => {
    setSelectedAgent(null);
    setReason('');
    setDepartmentFilters({ 'Tier-1': 'all', 'Tier-2': 'all', 'Tier-3': 'all' });
    setSearchQuery('');
    setShowConfirmation(false);
    onClose();
  };

  const getStatusColor = (workStatus) => {
    return workStatus === 'active' 
      ? 'bg-green-500' 
      : 'bg-gray-400';
  };

  const getStatusText = (workStatus) => {
    return workStatus === 'active' ? 'Available' : 'Busy';
  };

  // Avatar source logic for profile images
  const getAvatarSrc = (agent) => {
    if (!agent?.profileImage) return '';
    // Backend may now store full Cloudinary URL; if so, use directly
    if (agent.profileImage?.startsWith('http')) return agent.profileImage;
    return `${IMG_PROFILE_URL}/${agent.profileImage}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2">
      <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
        {/* Confirmation State */}
        {showConfirmation ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900 dark:bg-opacity-30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={30} className="text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Confirm Transfer</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Review details before sending escalation.</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Query ID</p>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-300 break-all">{petitionId}</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium mt-1 line-clamp-2">{querySubject}</p>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Escalate To</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedAgent?.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{selectedAgent?.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{selectedAgent?.email}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {selectedAgent?.department && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">{selectedAgent.department}</span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">{selectedAgent?.role}</span>
                        {selectedAgent?.tier && (
                          <span className="text-[10px] px-2 py-0.5 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full">{selectedAgent.tier}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 p-3 rounded-md leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">{reason}</p>
                </div>
              </div>
            </div>
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="sm:flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={isRequesting}
                className="sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Transferring...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative p-2 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="absolute top-2 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <RefreshCw size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Escalate Query
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tier-wise escalation: select a user to escalate this query
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-2 sm:p-6 overflow-y-auto flex-1">
              {/* Query Info */}
              <div className="mb-6 p-2 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    {petitionId}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {querySubject}
                </p>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                  Current Assignee: {currentAssignee 
                    ? (typeof currentAssignee === 'object' ? currentAssignee.name : currentAssignee)
                    : '—'}
                </p>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search agents by name, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Tier Columns - Horizontal Layout */}
              {isHierarchyLoading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading escalation targets...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {['Tier-1','Tier-2','Tier-3'].map((tier) => {
                    const tierData = hierarchy[tier] || {};
                    const tierUsers = Object.values(tierData).flat();
                    
                    return (
                      <div key={tier} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                        {/* Tier Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <Layers size={18} />
                            {tier}
                          </h3>
                          <p className="text-xs text-blue-100 mt-1">
                            {tierUsers.length} {tierUsers.length === 1 ? 'user' : 'users'}
                          </p>
                        </div>

                        {/* Department Filter for this Tier */}
                        <div className="p-2 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-600">
                          <select
                            value={departmentFilters[tier]}
                            onChange={(e) => setDepartmentFilters(prev => ({ ...prev, [tier]: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Departments</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Technicals">Technicals</option>
                            <option value="Billings">Billings</option>
                            <option value="Supports">Supports</option>
                          </select>
                        </div>

                        {/* Users List */}
                        <div className="p-2 max-h-96 overflow-y-auto space-y-2">
                          {Object.keys(tierData).map((dept) => {
                            const deptUsers = tierData[dept] || [];
                            
                            // Apply department filter (tier-specific)
                            if (departmentFilters[tier] !== 'all' && dept !== departmentFilters[tier]) return null;
                            
                            // Apply search and current assignee filter
                            const filteredDeptUsers = deptUsers.filter((u) => {
                              const q = searchQuery.toLowerCase();
                              const currentAssigneeId = typeof currentAssignee === 'object' ? currentAssignee?._id : currentAssignee;
                              return (
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                (u.department || '').toLowerCase().includes(q)
                              ) && u._id !== currentAssigneeId;
                            });

                            if (filteredDeptUsers.length === 0) return null;

                            return (
                              <div key={dept} className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 px-1">
                                  {dept} ({filteredDeptUsers.length})
                                </p>
                                <div className="space-y-1.5">
                                  {filteredDeptUsers.map((agent) => (
                                    <button
                                      key={agent._id}
                                      onClick={() => setSelectedAgent(agent)}
                                      className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                                        selectedAgent?._id === agent._id
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 shadow-md'
                                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-950'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className="relative flex-shrink-0">
                                          {getAvatarSrc(agent) ? (
                                            <img
                                              src={getAvatarSrc(agent)}
                                              alt={agent.name}
                                              className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-800"
                                            />
                                          ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                              {agent.name[0]}
                                            </div>
                                          )}
                                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(agent.workStatus)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{agent.name}</p>
                                            {selectedAgent?._id === agent._id && (
                                              <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
                                            )}
                                          </div>
                                          <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate mb-1">{agent.email}</p>
                                          <div className="flex flex-wrap items-center gap-1">
                                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                              {agent.role}
                                            </span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                              agent.workStatus === 'active'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                                : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300'
                                            }`}>
                                              {getStatusText(agent.workStatus)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* No users message */}
                          {Object.keys(tierData).every((dept) => {
                            if (departmentFilters[tier] !== 'all' && dept !== departmentFilters[tier]) return true;
                            const deptUsers = tierData[dept] || [];
                            const currentAssigneeId = typeof currentAssignee === 'object' ? currentAssignee?._id : currentAssignee;
                            return deptUsers.filter((u) => {
                              const q = searchQuery.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                (u.department || '').toLowerCase().includes(q)
                              ) && u._id !== currentAssigneeId;
                            }).length === 0;
                          }) && (
                            <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                              <User size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-xs">No users available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Escalation
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this query is being escalated (context, customer need, required expertise)..."
                  rows={4}
                  maxLength={300}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Visible to recipient and logged in escalation history
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reason.length}/300
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="sm:flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedAgent) {
                      toast.error('Select an escalation target');
                      return;
                    }
                    if (!reason.trim()) {
                      toast.error('Provide a reason for escalation');
                      return;
                    }
                    setShowConfirmation(true);
                  }}
                  disabled={!selectedAgent || !reason.trim()}
                  className="sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Continue Escalation
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
