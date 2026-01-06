import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Zap,
  UserCheck,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import { useGetAllQueriesQuery, useAcceptQueryMutation } from '../../../features/query/queryApi';
import { useDeleteQueryMutation } from '../../../features/query/queryApi';
import ConfirmDialog from '../../../components/ConfirmDialog';
import useNotificationSound from '../../../hooks/useNotificationSound';
import { getQuerySocket } from '../../../socket/querySocket';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';

// Utility function to get proper display name from customer information
const getDisplayName = (customerName, customerEmail) => {
  // If no customerName, extract from email
  if (!customerName && customerEmail) {
    return customerEmail.split('@')[0];
  }

  // If customerName exists but looks like email prefix, try to make it more readable
  if (customerName) {
    // Check if it's just an email prefix (no spaces, all lowercase, might have numbers)
    if (!/\s/.test(customerName) && customerName === customerName.toLowerCase()) {
      // Try to convert email-like usernames to more readable format
      // e.g., "john.doe123" -> "John Doe"
      const cleaned = customerName.replace(/[0-9]/g, ''); // Remove numbers
      const parts = cleaned.split(/[._-]/); // Split by common separators

      if (parts.length > 1) {
        // Capitalize each part: ["john", "doe"] -> "John Doe"
        return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      } else if (cleaned.length > 2) {
        // Single word, just capitalize: "john" -> "John"
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    // If it already looks like a proper name (has spaces, mixed case), return as is
    return customerName;
  }

  return 'Guest User';
};

export default function QueryManagement() {
  const navigate = useNavigate();
  const { play } = useNotificationSound();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: profileData } = useGetProfileQuery();
  // Don't filter on backend - get all queries and filter on frontend
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    data: queriesData,
    isLoading,
    refetch,
  } = useGetAllQueriesQuery({
    category: filterCategory === 'all' ? undefined : filterCategory,
    page,
    limit: pageSize,
    sort: 'createdAt:desc',
  });

  const [acceptQuery, { isLoading: isAccepting }] = useAcceptQueryMutation();
  const [deleteQuery, { isLoading: isDeleting }] = useDeleteQueryMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPetitionId, setPendingPetitionId] = useState(null);
  const [confirmMode, setConfirmMode] = useState(null); // 'transfer' | 'delete' | null
  const [transferInfo, setTransferInfo] = useState(null); // holds payload from socket
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentUser = profileData?.data;
  // Handle the API response structure - backend returns { data: { all: [], pending: [], ... } }
  const allQueries = Array.isArray(queriesData?.data?.all) ? queriesData.data.all : [];
  const pagination = queriesData?.pagination || null;

  // Debug logging
  console.log('QueryManagement Debug:', {
    queriesData,
    allQueries,
    allQueriesLength: allQueries.length,
    currentUser: currentUser?._id,
    isLoading,
  });

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Listen for real-time query events (new pending queries, transfers, etc.)
  useEffect(() => {
    const socket = getQuerySocket();
    const onNewPending = (data) => {
      const ts = data?.timestamp ? new Date(data.timestamp) : new Date();
      const timeStr = isNaN(ts) ? '' : ` • ${format(ts, 'MMM dd, hh:mm a')}`;
      toast.info(`New Query: ${data.petitionId} • ${data.subject}${timeStr}`);
      play();
      refetch();
    };

    const onFeedbackReceived = (data) => {
      toast.success(`Feedback received for ${data.petitionId}: ⭐ ${data.rating}/5`);
      refetch(); // Refresh query list to show feedback
    };

    socket.on('new-pending-query', onNewPending);
    socket.on('feedback-received', onFeedbackReceived);

    return () => {
      socket.off('new-pending-query', onNewPending);
      socket.off('feedback-received', onFeedbackReceived);
    };
  }, [play, refetch, currentUser?._id]);

  // Filter queries - with safety checks
  const filteredQueries = Array.isArray(allQueries)
    ? allQueries.filter((query) => {
        // Filter by active tab
        let matchesTab = true;
        if (activeTab === 'Pending') {
          matchesTab = query.status === 'Pending';
        } else if (activeTab === 'my') {
          // Handle both populated object and string ID
          const assignedToId =
            typeof query.assignedTo === 'object' ? query.assignedTo?._id : query.assignedTo;
          matchesTab =
            assignedToId === currentUser?._id &&
            (query.status === 'Accepted' || query.status === 'In Progress');

          // Debug logging
          if (query.status === 'Accepted' || query.status === 'In Progress') {
            console.log('My Queries Filter:', {
              petitionId: query.petitionId,
              assignedToId,
              currentUserId: currentUser?._id,
              matches: assignedToId === currentUser?._id,
              status: query.status,
            });
          }
        } else if (activeTab === 'Resolved') {
          matchesTab = query.status === 'Resolved';
        } else if (activeTab === 'Transferred') {
          // Show transferred queries where current user is the target (to accept)
          // Check if latest transfer was TO this user
          const latestTransfer = query.transferHistory?.[query.transferHistory.length - 1];
          matchesTab =
            query.status === 'Transferred' &&
            latestTransfer?.toAgent?.toString() === currentUser?._id;
        }
        // activeTab === 'all' shows everything

        const matchesSearch =
          query.petitionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          query.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          query.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getDisplayName(query.customerName, query.customerEmail)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesPriority = filterPriority === 'all' || query.priority === filterPriority;

        return matchesTab && matchesSearch && matchesPriority;
      })
    : [];

  // Stats calculation - prefer backend counts when available
  const backendCounts = queriesData?.data?.counts;
  const stats = {
    pending:
      typeof backendCounts?.pending === 'number'
        ? backendCounts.pending
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => q.status === 'Pending').length
        : 0,
    myQueries: Array.isArray(allQueries)
      ? allQueries.filter((q) => {
          // Handle both populated object and string ID
          const assignedToId = typeof q.assignedTo === 'object' ? q.assignedTo?._id : q.assignedTo;
          return (
            assignedToId === currentUser?._id &&
            (q.status === 'Accepted' || q.status === 'In Progress')
          );
        }).length
      : 0,
    resolved:
      typeof backendCounts?.resolved === 'number'
        ? backendCounts.resolved
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => q.status === 'Resolved').length
        : 0,
    transferred:
      typeof backendCounts?.transferred === 'number'
        ? backendCounts.transferred
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => {
            const latestTransfer = q.transferHistory?.[q.transferHistory.length - 1];
            return (
              q.status === 'Transferred' && latestTransfer?.toAgent?.toString() === currentUser?._id
            );
          }).length
        : 0,
    total:
      typeof backendCounts?.total === 'number'
        ? backendCounts.total
        : Array.isArray(allQueries)
        ? allQueries.length
        : 0,
  };

  // Debug logging for stats
  console.log('QueryManagement Stats:', {
    stats,
    currentUserId: currentUser?._id,
    totalQueries: allQueries.length,
    acceptedInProgress: allQueries.filter(
      (q) => q.status === 'Accepted' || q.status === 'In Progress'
    ).length,
  });

  const handleAcceptQuery = async (petitionId, e) => {
    e.stopPropagation();

    try {
      await acceptQuery(petitionId).unwrap();
      toast.success('Query accepted successfully!');
      play();
      refetch();

      // Navigate to chat based on user role
      const userRole = currentUser?.role?.toLowerCase();
      const rolePath = userRole;
      setTimeout(() => {
        navigate(`/${rolePath}/query/${petitionId}`);
      }, 500);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to accept query');
    }
  };

  const handleDeleteQuery = async (petitionId, e) => {
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

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-500',
      Accepted: 'bg-blue-500',
      'In Progress': 'bg-purple-500',
      Resolved: 'bg-green-500',
      Expired: 'bg-gray-500',
      Transferred: 'bg-orange-500',
    };
    return colors[status] || colors['Pending'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'text-green-600 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border-green-200 dark:border-green-800',
      Medium:
        'text-yellow-600 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border-yellow-200 dark:border-yellow-800',
      High: 'text-orange-600 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 border-orange-200 dark:border-orange-800',
      Urgent:
        'text-red-600 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border-red-200 dark:border-red-800',
    };
    return colors[priority] || colors['Medium'];
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Accounts: Mail,
      Technicals: Zap,
      Billings: TrendingUp,
      Supports: UserCheck,
    };
    return icons[category] || AlertCircle;
  };

  const tabs = [
    { id: 'all', label: 'All Queries', count: stats.total },
    { id: 'Pending', label: 'Pending', count: stats.pending },
    { id: 'my', label: 'My Queries', count: stats.myQueries },
    { id: 'Resolved', label: 'Resolved', count: stats.resolved },
    { id: 'Transferred', label: 'Transferred', count: stats.transferred },
  ];

  const categories = ['all', 'Accounts', 'Technicals', 'Billings', 'Supports'];
  const priorities = ['all', 'Low', 'Medium', 'High', 'Urgent'];

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Horizontal line below navbar - spans full width */}
      <div className="w-full border-b border-gray-200 dark:border-gray-700"></div>

      {/* Main Layout: Left Content + Right Sidebar */}
      <div className="flex">
        {/* Left Column - Main Content */}
        <div className="flex-1 lg:flex-[3]">
          {/* Header */}
          <div className="bg-white dark:bg-gray-950 sticky top-0 z-10">
            <div className="px-4 sm:px-6 py-1.5 sm:py-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1 sm:mb-1">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Query Management
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0 sm:mt-0">
                    Manage customer queries and support tickets
                  </p>
                </div>

                {/* Action Buttons - Refresh and Bell */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      await refetch();
                      setTimeout(() => setIsRefreshing(false), 500);
                    }}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>

                  <button className="relative p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Bell size={18} className="text-gray-700 dark:text-gray-300" />
                    {stats.pending > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {stats.pending > 9 ? '9+' : stats.pending}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile: compact horizontal stats */}
              <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar mb-1.5">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-yellow-200 dark:border-yellow-700 flex-shrink-0 min-w-[85px]">
                  <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-0.5">
                    {stats.pending}
                  </div>
                  <div className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                    Pending
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-blue-200 dark:border-blue-700 flex-shrink-0 min-w-[85px]">
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                    {stats.myQueries}
                  </div>
                  <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400">My</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-green-200 dark:border-green-700 flex-shrink-0 min-w-[85px]">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300 mb-0.5">
                    {stats.resolved}
                  </div>
                  <div className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    Resolved
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 dark:bg-opacity-30 rounded-lg p-2 shadow-sm border border-orange-200 dark:border-orange-700 flex-shrink-0 min-w-[85px]">
                  <div className="text-xl font-bold text-orange-700 dark:text-orange-300 mb-0.5">
                    {stats.transferred}
                  </div>
                  <div className="text-[10px] font-medium text-orange-600 dark:text-orange-300">
                    Transferred
                  </div>
                </div>
              </div>

              {/* Desktop: Remove horizontal grid stats - will show in sidebar */}

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by Petition ID, Subject, or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 sm:py-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1.5 px-1.5 py-0 rounded-full text-xs font-semibold ${
                        activeTab === tab.id
                          ? 'bg-white bg-opacity-20'
                          : 'bg-gray-200 dark:bg-gray-950 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal line below tabs - full width connecting both sidebars */}
            <div className="border-b border-gray-200 dark:border-gray-700 mt-1"></div>
          </div>

          {/* Query List */}
          <div className="px-4 sm:px-6 py-2 sm:py-2">
            {filteredQueries.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <AlertCircle size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No queries found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'All queries are handled!'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-1.5">
                  {filteredQueries.map((query) => {
                    const CategoryIcon = getCategoryIcon(query.category);
                    const isMyQuery = query.assignedTo === currentUser?._id;
                    const canAccept = query.status === 'Pending';
                    const hasPendingTransfer =
                      query.status === 'Transferred' &&
                      query.transferHistory?.some((transfer) => {
                        const toId =
                          typeof transfer.toAgent === 'object'
                            ? transfer.toAgent?._id
                            : transfer.toAgent;
                        const me = currentUser?._id;
                        console.log('🔍 Transfer check:', {
                          toId: toId?.toString(),
                          me: me?.toString(),
                          status: transfer.status,
                          match:
                            toId?.toString() === me?.toString() && transfer.status === 'Requested',
                        });
                        return (
                          transfer.status === 'Requested' && toId?.toString() === me?.toString()
                        );
                      });
                    const userRole = currentUser?.role?.toLowerCase();

                    // Determine base path for query detail navigation
                    const rolePath = userRole;
                    return (
                      <div
                        key={query._id}
                        onClick={() => navigate(`/${rolePath}/query/${query.petitionId}`)}
                        className="relative bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                      >
                        <div className="p-2">
                          {/* Header Row */}
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {query.customer?.profileImage ? (
                                <img
                                  src={query.customer?.profileImage}
                                  alt={query.customer.name}
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                  {getDisplayName(query.customerName, query.customerEmail)[0]}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {getDisplayName(query.customerName, query.customerEmail)}
                                  </h3>
                                  {isMyQuery && (
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                      Assigned to me
                                    </span>
                                  )}
                                  {/* Show transfer source if applicable */}
                                  {isMyQuery &&
                                    query.transferHistory?.length > 0 &&
                                    (() => {
                                      const last =
                                        query.transferHistory[query.transferHistory.length - 1];
                                      if (!last) return null;
                                      return (
                                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full">
                                          Transferred by {last.fromAgentName || 'other'}
                                        </span>
                                      );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                    {query.petitionId}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-2">
                                    {(() => {
                                      const raw = query.createdAt || query.created_at;
                                      const d = raw ? new Date(raw) : null;
                                      if (!d || isNaN(d.getTime())) return '—';
                                      let abs;
                                      try {
                                        const fmt = new Intl.DateTimeFormat('en-IN', {
                                          timeZone: 'Asia/Kolkata',
                                          day: '2-digit',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true,
                                        });
                                        const parts = fmt.formatToParts(d);
                                        const map = Object.fromEntries(
                                          parts.map((p) => [p.type, p.value])
                                        );
                                        abs = `${map.day} ${map.month}, ${map.hour}:${map.minute} ${
                                          map.dayPeriod?.toLowerCase?.() || ''
                                        }`.trim();
                                      } catch {
                                        abs = format(d, 'dd MMM, hh:mm a');
                                      }
                                      const rel = formatDistanceToNow(d, { addSuffix: true });
                                      return (
                                        <>
                                          <span>{abs}</span>
                                          <span
                                            className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-950 text-xs text-gray-600 dark:text-gray-300"
                                            title={abs}
                                          >
                                            {rel}
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Delete button - Only shown for Admin role */}
                              {currentUser?.role === 'Admin' && (
                                <button
                                  onClick={(e) => {
                                    setConfirmMode('delete');
                                    handleDeleteQuery(query.petitionId, e);
                                  }}
                                  disabled={isDeleting}
                                  className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title="Delete query"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}

                              {/* Evaluation Score Badge */}
                              {query?.evaluation && (
                                <span
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    query.evaluation.totalWeightedScore >= 80
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                      : query.evaluation.totalWeightedScore >= 60
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : query.evaluation.totalWeightedScore >= 40
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                  }`}
                                >
                                  <span>{query.evaluation.performanceCategory}</span>
                                  <span className="font-bold">
                                    {query.evaluation.totalWeightedScore}%
                                  </span>
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusColor(
                                  query.status
                                )}`}
                              >
                                {query.status}
                              </span>

                              {/* Customer Feedback Badge */}
                              {query.feedback && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white flex items-center gap-1"
                                  title={`Customer Rating: ${query.feedback.rating}/5${
                                    query.feedback.comment ? ` - ${query.feedback.comment}` : ''
                                  }`}
                                >
                                  <span>⭐</span> {query.feedback.rating}/5
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Subject */}
                          {/* REMOVED: Subject and detailed info now only visible in detail view */}

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${getPriorityColor(
                                query.priority
                              )}`}
                            >
                              <AlertCircle size={12} />
                              {query.priority}
                            </span>

                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                              <CategoryIcon size={12} />
                              {query.category}
                            </span>

                            {query.messages?.length > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 dark:bg-opacity-20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
                                <Mail size={12} />
                                {query.messages.length}{' '}
                                {query.messages.length === 1 ? 'message' : 'messages'}
                              </span>
                            )}

                            {/* Escalation Chain Chips */}
                            {Array.isArray(query.transferHistory) &&
                              query.transferHistory.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {query.transferHistory.slice(-3).map((t, idx) => {
                                    const fromName = t.fromAgentName || 'Unknown';
                                    const toName = t.toAgentName || 'Unknown';
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-1 bg-gray-100 dark:bg-gray-950 px-2 py-1 rounded-full text-xs text-gray-700 dark:text-gray-300"
                                      >
                                        <span className="font-medium">{shortName(fromName)}</span>
                                        <ArrowRight size={12} className="text-gray-500" />
                                        <span className="font-medium">{shortName(toName)}</span>
                                        {t.status === 'Requested' && (
                                          <span className="ml-1 px-1 rounded bg-amber-200 dark:bg-amber-600 text-amber-800 dark:text-amber-100">
                                            Req
                                          </span>
                                        )}
                                        {t.status === 'Accepted' && (
                                          <span className="ml-1 px-1 rounded bg-green-200 dark:bg-green-600 text-green-800 dark:text-green-100">
                                            Ok
                                          </span>
                                        )}
                                        {t.status === 'Rejected' && (
                                          <span className="ml-1 px-1 rounded bg-red-200 dark:bg-red-600 text-red-800 dark:text-red-100">
                                            Rej
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {query.transferHistory.length > 3 && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                                      +{query.transferHistory.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Last Message Preview - REMOVED */}
                          {/* Message preview removed for cleaner interface */}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              {query.assignedToName && (
                                <div className="flex items-center gap-1">
                                  <UserCheck size={16} />
                                  <span>{query.assignedToName}</span>
                                </div>
                              )}

                              {/* Customer Feedback Display - Prominent in Actions Row */}
                              {query.feedback && (
                                <div className="flex items-center gap-2 ml-auto px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                  <div className="flex items-center gap-1">
                                    <span className="text-base">⭐</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                      {query.feedback.rating}/5
                                    </span>
                                  </div>
                                  {query.feedback.comment && (
                                    <div
                                      className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate"
                                      title={query.feedback.comment}
                                    >
                                      💬 "{query.feedback.comment}"
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {canAccept && (
                                <button
                                  onClick={(e) => handleAcceptQuery(query.petitionId, e)}
                                  disabled={isAccepting}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-medium disabled:opacity-50 shadow-lg shadow-green-500/30"
                                >
                                  <CheckCircle size={16} />
                                  Accept Query
                                </button>
                              )}

                              {hasPendingTransfer && (
                                <button
                                  onClick={(e) => handleAcceptQuery(query.petitionId, e)}
                                  disabled={isAccepting}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium disabled:opacity-50 shadow-lg shadow-blue-500/30"
                                >
                                  <CheckCircle size={16} />
                                  Accept Transfer
                                </button>
                              )}

                              <button
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium group-hover:border-blue-500 dark:group-hover:border-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/${rolePath}/query/${query.petitionId}`);
                                }}
                              >
                                View Details
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        setPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                    >
                      {[10, 20, 30, 50, 100].map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                    {pagination && (
                      <span>
                        Page {pagination.page} of {pagination.pages} • Total {pagination.total}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!pagination || pagination.page <= 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={!pagination || pagination.page >= pagination.pages}
                      onClick={() =>
                        setPage((prev) =>
                          pagination ? Math.min(prev + 1, pagination.pages) : prev + 1
                        )
                      }
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Stats Sidebar (Desktop Only) */}
        <div className="hidden lg:block lg:w-[180px] lg:flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
          <div className="sticky top-0 p-4 space-y-3">
            {/* Stats in Vertical Column */}
            <div className="space-y-4">
              {/* Pending */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 dark:bg-opacity-20 rounded-lg px-4 py-6 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Pending
                  </p>
                  <div className="w-10 h-10 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-yellow-700 dark:text-yellow-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-200">
                  {stats.pending}
                </p>
              </div>

              {/* My Queries */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 dark:bg-opacity-20 rounded-lg px-4 py-6 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">My Queries</p>
                  <div className="w-10 h-10 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-700 dark:text-blue-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-200">
                  {stats.myQueries}
                </p>
              </div>

              {/* Resolved */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 dark:bg-opacity-20 rounded-lg px-4 py-6 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Resolved</p>
                  <div className="w-10 h-10 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-700 dark:text-green-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-green-900 dark:text-green-200">
                  {stats.resolved}
                </p>
              </div>

              {/* Transferred */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 dark:bg-opacity-20 rounded-lg px-4 py-6 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Transferred
                  </p>
                  <div className="w-10 h-10 bg-orange-200 dark:bg-orange-700 rounded-full flex items-center justify-center">
                    <RefreshCw size={20} className="text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-orange-900 dark:text-orange-200">
                  {stats.transferred}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirm Delete Dialog */}
      {/* Transfer/Deletion Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmMode === 'transfer' ? 'Transfer request' : 'Delete query?'}
        message={
          confirmMode === 'transfer'
            ? `You have a transfer request for petition ${pendingPetitionId}${
                transferInfo?.from?.name ? ` from ${transferInfo.from.name}` : ''
              }${
                transferInfo?.reason
                  ? `.
Reason: ${transferInfo.reason}`
                  : '.'
              } Accept to take ownership or ignore to decline.`
            : 'Delete this query permanently? This action cannot be undone.'
        }
        confirmText={confirmMode === 'transfer' ? 'Accept' : 'Delete'}
        cancelText={confirmMode === 'transfer' ? 'Ignore' : 'Cancel'}
        loading={confirmMode === 'transfer' ? isAccepting : isDeleting}
        onConfirm={
          confirmMode === 'transfer'
            ? async () => {
                // Accept transfer
                try {
                  await acceptQuery(pendingPetitionId).unwrap();
                  toast.success('Transfer accepted');
                  play();
                  setConfirmOpen(false);
                  const userRole = currentUser?.role?.toLowerCase();
                  const navId = pendingPetitionId;
                  setPendingPetitionId(null);
                  setTransferInfo(null);
                  setConfirmMode(null);
                  refetch();
                  setTimeout(() => navigate(`/${userRole}/query/${navId}`), 300);
                } catch (err) {
                  toast.error(err?.data?.message || 'Failed to accept transfer');
                }
              }
            : confirmDelete
        }
        onCancel={() => {
          if (
            (confirmMode === 'transfer' && isAccepting) ||
            (confirmMode === 'delete' && isDeleting)
          )
            return;
          setConfirmOpen(false);
          setPendingPetitionId(null);
          setTransferInfo(null);
          setConfirmMode(null);
        }}
      />
    </div>
  );
}

// Helper to shorten names for chips
function shortName(name) {
  if (!name) return 'N/A';
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0]} ${parts[1][0]}.`;
}
