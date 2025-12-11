import React, { useState, useMemo } from 'react';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import {
  Trash2,
  Phone,
  Video,
  Clock,
  User,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CallLogsDatewise({ 
  calls = [], 
  isLoading = false, 
  onDeleteCall = null,
  onClearDate = null,
  onClearAll = null,
  userRole = 'Customer'
}) {
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  // Group calls by date
  const groupedCalls = useMemo(() => {
    const groups = {};
    
    calls.forEach(call => {
      const callDate = new Date(call.createdAt);
      const dateKey = format(callDate, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: callDate,
          dateString: format(callDate, 'EEEE, MMMM d, yyyy'),
          shortDate: format(callDate, 'MMM d, yyyy'),
          calls: []
        };
      }
      
      groups[dateKey].calls.push(call);
    });
    
    // Sort by date descending (newest first)
    return Object.values(groups)
      .sort((a, b) => b.date - a.date)
      .map(group => ({
        ...group,
        calls: group.calls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }));
  }, [calls]);

  const toggleDateExpanded = (dateKey) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const handleDeleteCall = async (callId) => {
    if (!onDeleteCall) return;
    
    setDeletingId(callId);
    try {
      await onDeleteCall(callId);
      toast.success('Call log deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete call log');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearDate = async (dateKey, dateString) => {
    if (!onClearDate) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete all call logs for ${dateString}? This cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await onClearDate(dateKey);
      toast.success(`All call logs for ${dateString} have been deleted`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clear date');
    }
  };

  const handleClearAll = async () => {
    if (!onClearAll) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL call logs? This cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      await onClearAll();
      toast.success('All call logs have been deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clear all logs');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'ended':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'missed':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200';
      case 'ended':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200';
      case 'missed':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-950/40 text-gray-800 dark:text-gray-200';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTime = (dateString) => {
    return format(parseISO(dateString), 'hh:mm a');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading call logs...</p>
        </div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <Phone className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No call logs yet
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Your call history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Clear All Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Call History ({calls.length})
          </h3>
        </div>
        
        {['Agent', 'QA', 'TL'].includes(userRole) && onClearAll && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Grouped Call Logs */}
      <div className="space-y-4">
        {groupedCalls.map((group, groupIdx) => {
          const dateKey = format(group.date, 'yyyy-MM-dd');
          const isExpanded = expandedDates.has(dateKey);
          
          return (
            <div 
              key={groupIdx}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Date Header */}
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                <button
                  onClick={() => toggleDateExpanded(dateKey)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {group.dateString}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {group.calls.length} call{group.calls.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  {['Agent', 'QA', 'TL'].includes(userRole) && onClearDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearDate(dateKey, group.dateString);
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete all calls for this date"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleDateExpanded(dateKey)}
                    className="p-1"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Calls List */}
              {isExpanded && (
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {group.calls.map((call, callIdx) => {
                    const caller = call?.participants?.find(p => p.role === 'caller')?.userId;
                    const receiver = call?.participants?.find(p => p.role === 'receiver')?.userId;
                    
                    return (
                      <div 
                        key={callIdx}
                        className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
                          {/* Call Info - Left Column */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {call.status === 'accepted' || call.status === 'ended' ? (
                                  <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {caller?.name || 'Unknown Caller'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  → {receiver?.name || 'Unknown Receiver'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(call.createdAt)}</span>
                            </div>
                          </div>

                          {/* Status & Duration - Right Column */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(call.status)}`}>
                                {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                              </span>
                              
                              {call.duration && (
                                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/40 px-2 py-1 rounded">
                                  {formatDuration(call.duration)}
                                </span>
                              )}
                            </div>

                            {['Agent', 'QA', 'TL'].includes(userRole) && onDeleteCall && (
                              <button
                                onClick={() => handleDeleteCall(call._id)}
                                disabled={deletingId === call._id}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete this call log"
                              >
                                <Trash2 className={`w-4 h-4 ${deletingId === call._id ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
