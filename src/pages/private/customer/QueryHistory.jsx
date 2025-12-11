import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, 
  MessageSquare, Calendar, ArrowRight, RefreshCw, Star, Trash2 
} from 'lucide-react';
import { useGetCustomerQueriesQuery, useReopenQueryMutation, useDeleteQueryMutation } from '../../../features/query/queryApi';
import CreateQueryModal from '../../../components/customer/CreateQueryModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import FeedbackModal from '../../../components/FeedbackModal';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import useNotificationSound from '../../../hooks/useNotificationSound';

export default function QueryHistory() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackModalData, setFeedbackModalData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPetitionId, setPendingPetitionId] = useState(null);
  const { play } = useNotificationSound();

  const { data: queriesData, isLoading, refetch } = useGetCustomerQueriesQuery();
  const [reopenQuery, { isLoading: isReopening }] = useReopenQueryMutation();
  const [deleteQuery, { isLoading: isDeleting }] = useDeleteQueryMutation();

  const tabs = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'accepted', label: 'Active', icon: AlertCircle },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle },
    { id: 'expired', label: 'Expired', icon: XCircle },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Accepted': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'In Progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Expired': 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
      'Transferred': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[status] || colors['Pending'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Urgent': 'text-red-600 dark:text-red-400',
      'High': 'text-orange-600 dark:text-orange-400',
      'Medium': 'text-blue-600 dark:text-blue-400',
      'Low': 'text-gray-600 dark:text-gray-400',
    };
    return colors[priority] || colors['Medium'];
  };

  const handleReopenQuery = async (petitionId) => {
    try {
      await reopenQuery({ petitionId, message: 'I need further assistance with this issue.' }).unwrap();
      toast.success('Query reopened successfully!');
      play();
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to reopen query');
    }
  };

  const handleDeleteClick = (petitionId, e) => {
    e?.stopPropagation?.();
    setPendingPetitionId(petitionId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingPetitionId) return;
    try {
      await deleteQuery(pendingPetitionId).unwrap();
      toast.success('Query deleted');
      play();
      setConfirmOpen(false);
      setPendingPetitionId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete query');
    }
  };

  const filteredQueries = React.useMemo(() => {
    let queries = [];
    
    if (queriesData?.data) {
      switch (activeTab) {
        case 'pending':
          queries = queriesData.data.pending || [];
          break;
        case 'accepted':
          queries = queriesData.data.accepted || [];
          break;
        case 'resolved':
          queries = queriesData.data.resolved || [];
          break;
        case 'expired':
          queries = queriesData.data.expired || [];
          break;
        default:
          queries = queriesData.data.all || [];
      }
    }

    if (searchQuery) {
      queries = queries.filter(q => 
        q.petitionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return queries;
  }, [queriesData, activeTab, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Main Content Container - Aligned with Header */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-lg">
        <div className="max-w-full mx-auto  w-full h-full flex flex-col ">
          {/* Header - Same width as content below */}
          <div className="bg-white dark:bg-gray-950 shadow-md flex-shrink-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 lg:py-4 mb-2 lg:mb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">My Queries</h1>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Track and manage your support requests</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium shadow-lg shadow-blue-500/30 text-sm lg:text-base"
              >
                <Plus size={18} />
                New Query
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-2 flex-1 overflow-hidden">
          {/* Left Side - Query Content */}
          <div className="flex-1 lg:order-1 order-2 flex flex-col overflow-hidden">
            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-2.5 lg:p-3 mb-2 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by Petition ID, subject, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 lg:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  />
                </div>
                {/* <button className="flex items-center gap-2 px-3 py-1.5 lg:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Filter size={16} />
                  Filter
                </button> */}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md mb-2 overflow-x-auto flex-shrink-0">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const count = queriesData?.data?.counts?.[tab.id === 'all' ? 'total' : tab.id] || 0;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={15} className="lg:w-[16px] lg:h-[16px]" />
                      <span className="hidden sm:inline text-sm">{tab.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Query List - Scrollable without visible scrollbar */}
            <div className="flex-1 overflow-y-auto space-y-2.5 lg:space-y-3 pb-6 scrollbar-hide">
              {filteredQueries.length === 0 ? (
                <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-8 lg:p-12 text-center">
                  <MessageSquare size={40} className="lg:w-12 lg:h-12 mx-auto text-gray-400 mb-3 lg:mb-4" />
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No queries found
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-4 lg:mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search criteria' 
                      : 'Start by creating your first support query'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm lg:text-base"
                    >
                      <Plus size={18} />
                      Create Query
                    </button>
                  )}
                </div>
              ) : (
                filteredQueries.map(query => (
                  <div
                    key={query._id}
                    className="relative bg-white dark:bg-gray-950 rounded-lg shadow-md hover:shadow-lg transition-shadow p-3 lg:p-2 cursor-pointer"
                    onClick={() => navigate(`/customer/query/${query.petitionId}`)}
                  >
                    {/* Delete button - top right */}
                    <button
                      onClick={(e) => handleDeleteClick(query.petitionId, e)}
                      disabled={isDeleting}
                      className="absolute top-2 right-2 p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete query"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-3">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
                          <span className="font-mono text-sm lg:text-base font-bold text-blue-600 dark:text-blue-400">
                            {query.petitionId}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(query.status)}`}>
                            {query.status}
                          </span>
                          <span className={`text-xs lg:text-sm font-semibold ${getPriorityColor(query.priority)}`}>
                            {query.priority}
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                            {query.category}
                          </span>
                        </div>

                        {/* Subject */}
                        <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white mb-1.5 lg:mb-2">
                          {query.subject}
                        </h3>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="lg:w-3.5 lg:h-3.5" />
                            <span className="hidden sm:inline">{format(new Date(query.createdAt), 'MMM dd, yyyy')}</span>
                            <span className="sm:hidden">{format(new Date(query.createdAt), 'MMM dd')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={13} className="lg:w-3.5 lg:h-3.5" />
                            {format(new Date(query.createdAt), 'hh:mm a')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare size={13} className="lg:w-3.5 lg:h-3.5" />
                            {query.messages?.length || 0}
                          </div>
                          {query.assignedToName && (
                            <div className="hidden sm:flex items-center gap-1">
                              <span className="font-medium">Assigned to:</span>
                              {query.assignedToName}
                            </div>
                          )}
                        </div>

                        {/* Last Message Preview */}
                        {query.messages && query.messages.length > 0 && (
                          <div className="mt-1.5 lg:mt-2 p-2 bg-gray-50 dark:bg-gray-950 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                              <span className="font-medium">{query.messages[query.messages.length - 1].senderName}:</span>{' '}
                              {query.messages[query.messages.length - 1].message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row lg:flex-col gap-1.5 lg:gap-2 flex-shrink-0">
                        {query.status === 'Resolved' && !query.feedback && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedbackModalData({
                                petitionId: query.petitionId,
                                subject: query.subject
                              });
                            }}
                            className="flex items-center justify-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg transition-all text-xs font-medium shadow-lg shadow-yellow-500/30"
                          >
                            <Star size={13} className="lg:w-3.5 lg:h-3.5" />
                            <span className="hidden sm:inline">Rate Query</span>
                            <span className="sm:hidden">Rate</span>
                          </button>
                        )}
                        {(query.status === 'Expired' || query.status === 'Resolved') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReopenQuery(query.petitionId);
                            }}
                            disabled={isReopening}
                            className="flex items-center justify-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            <RefreshCw size={13} className="lg:w-3.5 lg:h-3.5" />
                            <span>Reopen</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/customer/query/${query.petitionId}`)}
                          className="flex items-center justify-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs font-medium"
                        >
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                          <ArrowRight size={13} className="lg:w-3.5 lg:h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Bottom spacer to ensure last item is fully visible */}
              <div className="h-8 lg:h-10"></div>
            </div>
          </div>

          {/* Right Side - Stats Cards Column */}
          <div className="lg:w-48 xl:w-56 lg:order-2 order-1 flex-shrink-0">
            {/* Mobile: Horizontal scrollable stats */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar mb-2">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-600 flex-shrink-0 min-w-[85px]">
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {queriesData?.data?.counts?.total || 0}
                </div>
                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Total</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-yellow-200 dark:border-yellow-700 flex-shrink-0 min-w-[85px]">
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mb-0.5">
                  {queriesData?.data?.counts?.pending || 0}
                </div>
                <div className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400">Pending</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-blue-200 dark:border-blue-700 flex-shrink-0 min-w-[85px]">
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-0.5">
                  {queriesData?.data?.counts?.accepted || 0}
                </div>
                <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Active</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-green-200 dark:border-green-700 flex-shrink-0 min-w-[85px]">
                <div className="text-xl font-bold text-green-700 dark:text-green-400 mb-0.5">
                  {queriesData?.data?.counts?.resolved || 0}
                </div>
                <div className="text-[10px] font-medium text-green-600 dark:text-green-400">Resolved</div>
              </div>
            </div>

            {/* Desktop: Vertical stacked stats */}
            <div className="hidden lg:flex lg:flex-col lg:h-full lg:overflow-y-auto space-y-2.5 custom-scrollbar">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 xl:p-2 shadow-md border border-gray-200 dark:border-gray-600 flex-shrink-0">
                <div className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {queriesData?.data?.counts?.total || 0}
                </div>
                <div className="text-[11px] xl:text-xs font-medium text-gray-600 dark:text-gray-400">Total Queries</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 dark:bg-opacity-30 rounded-lg p-3 xl:p-2 shadow-md border border-yellow-200 dark:border-yellow-700 flex-shrink-0">
                <div className="text-2xl xl:text-3xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                  {queriesData?.data?.counts?.pending || 0}
                </div>
                <div className="text-[11px] xl:text-xs font-medium text-yellow-600 dark:text-yellow-400">Pending</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 dark:bg-opacity-30 rounded-lg p-3 xl:p-2 shadow-md border border-blue-200 dark:border-blue-700 flex-shrink-0">
                <div className="text-2xl xl:text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                  {queriesData?.data?.counts?.accepted || 0}
                </div>
                <div className="text-[11px] xl:text-xs font-medium text-blue-600 dark:text-blue-400">Active</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 dark:bg-opacity-30 rounded-lg p-3 xl:p-2 shadow-md border border-green-200 dark:border-green-700 flex-shrink-0">
                <div className="text-2xl xl:text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                  {queriesData?.data?.counts?.resolved || 0}
                </div>
                <div className="text-[11px] xl:text-xs font-medium text-green-600 dark:text-green-400">Resolved</div>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>

      {/* Create Query Modal */}
      <CreateQueryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(query) => {
          refetch();
          navigate(`/customer/query/${query.petitionId}`);
        }}
      />

      {/* Feedback Modal */}
      {feedbackModalData && (
        <FeedbackModal
          isOpen={!!feedbackModalData}
          onClose={() => {
            setFeedbackModalData(null);
            refetch(); // Refresh queries after feedback
          }}
          petitionId={feedbackModalData.petitionId}
          querySubject={feedbackModalData.subject}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete query?"
        message="Delete this query permanently? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (isDeleting) return;
          setConfirmOpen(false);
          setPendingPetitionId(null);
        }}
      />
    </div>
  );
}
