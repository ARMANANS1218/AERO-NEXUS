import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  RefreshCw,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  Layers,
} from "lucide-react";
import { useTransferRequestMutation } from "../features/query/queryApi";
import { useGetEscalationHierarchyQuery } from "../features/admin/adminApi";
import { toast } from "react-toastify";
import { IMG_PROFILE_URL } from "../config/api";

export default function TransferDialog({
  isOpen,
  onClose,
  petitionId,
  querySubject,
  currentAssignee,
}) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [reason, setReason] = useState("");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Fetch tier-wise escalation hierarchy
  const {
    data: hierarchyData,
    isLoading: isHierarchyLoading,
    refetch,
  } = useGetEscalationHierarchyQuery();

  const [transferRequest, { isLoading: isRequesting }] =
    useTransferRequestMutation();
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

  // Filter agents by search query and dropdowns
  const filteredAgents = availableAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = selectedTier === "all" || agent.tier === selectedTier;
    const matchesDept =
      selectedDepartment === "all" || agent.department === selectedDepartment;

    // Exclude current assignee (handle both object and string ID)
    const currentAssigneeId =
      typeof currentAssignee === "object"
        ? currentAssignee?._id
        : currentAssignee;
    const isNotCurrentAssignee = agent._id !== currentAssigneeId;

    return matchesSearch && matchesTier && matchesDept && isNotCurrentAssignee;
  });

  useEffect(() => {
    if (isOpen) {
      refetch();
      setSelectedAgent(null);
      setReason("");
      setSelectedTier("all");
      setSelectedDepartment("all");
      setSearchQuery("");
      setShowConfirmation(false);
    }
  }, [isOpen, refetch]);

  if (!isOpen) return null;

  const handleTransfer = async () => {
    if (!selectedAgent) {
      toast.error("Select an escalation target");
      return;
    }

    if (!reason.trim()) {
      toast.error("Provide a reason for escalation");
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
      toast.error(error?.data?.message || "Failed to request escalation");
    }
  };

  const handleClose = () => {
    setSelectedAgent(null);
    setReason("");
    setSelectedTier("all");
    setSelectedDepartment("all");
    setSearchQuery("");
    setShowConfirmation(false);
    onClose();
  };

  const getStatusColor = (workStatus) => {
    return workStatus === "active" ? "bg-green-500" : "bg-gray-400";
  };

  const getStatusText = (workStatus) => {
    return workStatus === "active" ? "Available" : "Busy";
  };

  // Avatar source logic for profile images
  const getAvatarSrc = (agent) => {
    if (!agent?.profileImage) return "";
    // Backend may now store full Cloudinary URL; if so, use directly
    if (agent.profileImage?.startsWith("http")) return agent.profileImage;
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
                  <AlertCircle
                    size={30}
                    className="text-orange-600 dark:text-orange-400"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Confirm Transfer
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review details before sending escalation.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Query ID
                  </p>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-300 break-all">
                    {petitionId}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium mt-1 line-clamp-2">
                    {querySubject}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Escalate To
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedAgent?.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {selectedAgent?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {selectedAgent?.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {selectedAgent?.department && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                            {selectedAgent.department}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          {selectedAgent?.role}
                        </span>
                        {selectedAgent?.tier && (
                          <span className="text-[10px] px-2 py-0.5 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full">
                            {selectedAgent.tier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reason
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 p-3 rounded-md leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {reason}
                  </p>
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
                  Current Assignee:{" "}
                  {currentAssignee
                    ? typeof currentAssignee === "object"
                      ? currentAssignee.name
                      : currentAssignee
                    : "—"}
                </p>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Tier Filter */}
                <div>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                  >
                    <option value="all">All Tiers</option>
                    <option value="Tier-1">Tier 1</option>
                    <option value="Tier-2">Tier 2</option>
                    <option value="Tier-3">Tier 3</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                  >
                    <option value="all">All Departments</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Technicals">Technicals</option>
                    <option value="Billings">Billings</option>
                    <option value="Supports">Supports</option>
                  </select>
                </div>
              </div>

              {/* Agents Grid */}
              {isHierarchyLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Loading agents...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-[50vh] overflow-y-auto p-1">
                  {filteredAgents.length > 0 ? (
                    filteredAgents.map((agent) => (
                      <button
                        key={agent._id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`relative flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left group ${
                          selectedAgent?._id === agent._id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 shadow-md transform scale-[1.02]"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-950 hover:shadow-sm"
                        }`}
                      >
                        {/* Selected Indicator */}
                        {selectedAgent?._id === agent._id && (
                          <div className="absolute top-2 right-2 text-blue-600 dark:text-blue-400">
                            <CheckCircle size={18} />
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-3 w-full">
                          <div className="relative flex-shrink-0">
                            {getAvatarSrc(agent) ? (
                              <img
                                src={getAvatarSrc(agent)}
                                alt={agent.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {agent.name[0]}
                              </div>
                            )}
                            <div
                              className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                                agent.workStatus
                              )} border-2 border-white dark:border-gray-800 rounded-full`}
                            ></div>
                          </div>
                          <div className="min-w-0 flex-1 pr-6">
                            <p
                              className="font-semibold text-gray-900 dark:text-white text-sm truncate"
                              title={agent.name}
                            >
                              {agent.name}
                            </p>
                            <p
                              className="text-xs text-gray-500 dark:text-gray-400 truncate"
                              title={agent.email}
                            >
                              {agent.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 w-full">
                          {agent.department && (
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full font-medium border border-gray-200 dark:border-gray-700">
                              {agent.department}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full font-medium border border-purple-100 dark:border-purple-800">
                            {agent.role}
                          </span>
                          {agent.tier && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full font-medium border border-blue-100 dark:border-blue-800">
                              {agent.tier}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <User size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No agents found</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </div>
                  )}
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
                      toast.error("Select an escalation target");
                      return;
                    }
                    if (!reason.trim()) {
                      toast.error("Provide a reason for escalation");
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
