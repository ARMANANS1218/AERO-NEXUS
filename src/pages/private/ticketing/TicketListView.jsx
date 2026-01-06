import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronDown,
  Search,
  PanelLeftClose,
  PanelLeft,
  Inbox,
  Users,
  List,
  FileText,
  Wrench,
  DollarSign,
  Lightbulb,
  Bug,
  Mail,
  RefreshCw,
} from 'lucide-react';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import { getTicketSocket } from '../../../socket/ticketSocket';
import { useGetByPetitionQuery } from '../../../features/qa/qaEvaluationApi';
import { useGetByPetitionQuery } from '../../../features/qa/qaEvaluationApi';

function ChatWeightageBadge({ petitionId }) {
  const { data, isFetching, isError } = useGetByPetitionQuery(petitionId, { skip: !petitionId });
  const score = data?.data?.totalWeightedScore;
  const category = data?.data?.performanceCategory;

  if (isFetching || isError || score === undefined || score === null) return null;

  const normalized = String(category || '').toLowerCase();
  const color = normalized === 'excellent'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
    : normalized === 'good'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
    : normalized === 'average'
    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100'
    : normalized === 'poor' || normalized === 'very poor'
    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
    : normalized === 'fail' || normalized === 'failed'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-100';

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${color}`} title={`Weightage: ${score}% (${category || 'Uncategorized'})`}>
      {score}%
    </span>
  );
}

/**
 * TicketListView: Center pane showing list of tickets
 * - Status filters (Open, Newest activity)
 * - Search bar
 * - Scrollable list
 */
export default function TicketListView({ view, teamInbox, priority }) {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const outletContext = useOutletContext();
  const { sidebarCollapsed, setSidebarCollapsed, activeView } = outletContext || {};

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [sortBy, setSortBy] = useState('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const selectedTicketId = params.ticketId || null;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const org = localStorage.getItem('organizationId');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-organization-id': org,
      },
    };
  };

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params = {
        page,
        limit: 20,
        sortBy,
        search: searchQuery || undefined,
      };

      if (statusFilter !== 'all') params.status = statusFilter;

      // View-based filtering
      if (view === 'my-inbox') {
        params.view = 'myinbox';
        params.assignedTo = user._id;
      } else if (view === 'unassigned') {
        params.view = 'unassigned';
      } else if (view === 'all') {
        params.view = 'all';
      } else if (view === 'team' || teamInbox) {
        // For team/category views, show all tickets filtered by category
        params.view = 'all';
      } else if (view === 'priority' && priority) {
        // For priority views, show all tickets filtered by priority
        params.view = 'all';
      }

      // Add filters
      if (teamInbox) {
        params.teamInbox = teamInbox;
      }

      if (priority) {
        params.priority = priority;
      }

      const res = await axios.get(`${API_BASE_URL}/api/v1/email-ticketing/tickets`, {
        ...getAuthHeaders(),
        params,
      });
      setTickets(res.data.tickets || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [view, teamInbox, priority, statusFilter, sortBy, searchQuery, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = getTicketSocket();

    // Listen for new tickets
    socket.on('new-ticket', (ticket) => {
      console.log('[TicketListView] New ticket received:', ticket);
      toast.info(`New ticket: ${ticket.subject}`, { autoClose: 3000 });
      loadTickets(); // Refresh ticket list
    });

    // Listen for new messages on tickets
    socket.on('new-ticket-message', ({ ticketId, message }) => {
      console.log('[TicketListView] New message on ticket:', ticketId);
      loadTickets(); // Refresh to update lastActivityAt
    });

    // Listen for ticket updates
    socket.on('ticket-updated', (ticket) => {
      console.log('[TicketListView] Ticket updated:', ticket);
      loadTickets();
    });

    return () => {
      socket.off('new-ticket');
      socket.off('new-ticket-message');
      socket.off('ticket-updated');
    };
  }, [loadTickets]);

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const formatTeamInbox = (teamInbox) => {
    if (!teamInbox) return 'General';
    const map = {
      general: 'General',
      'technical-issue': 'Technical Issue',
      billing: 'Billing',
      'feature-request': 'Feature Request',
      'bug-report': 'Bug Report',
    };
    return map[teamInbox] || teamInbox;
  };

  const getCategoryIcon = (teamInbox) => {
    const icons = {
      general: FileText,
      'technical-issue': Wrench,
      billing: DollarSign,
      'feature-request': Lightbulb,
      'bug-report': Bug,
    };
    return icons[teamInbox] || Mail;
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'text-red-600 dark:text-red-400';
    if (priority === 'medium') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getStatusBadge = (status) => {
    if (status === 'open')
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (status === 'pending')
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300';
  };

  const getViewTitle = () => {
    if (view === 'my-inbox') return 'My Inbox';
    if (view === 'unassigned') return 'Unassigned';
    if (view === 'all') return 'All';
    if (view === 'priority') {
      if (priority === 'high') return 'High Priority';
      if (priority === 'medium') return 'Medium Priority';
      if (priority === 'low') return 'Low Priority';
    }
    if (teamInbox) return formatTeamInbox(teamInbox);
    return 'Inbox';
  };

  const getViewIcon = () => {
    if (view === 'my-inbox') return Inbox;
    if (view === 'unassigned') return Users;
    if (view === 'all') return List;
    return Inbox;
  };

  const ViewIcon = getViewIcon();

  return (
    <div className="w-80 sm:w-96 lg:w-[420px] xl:w-[480px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full overflow-hidden">
      {/* Header with view title and toggle button */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 px-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed?.(!sidebarCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <ViewIcon size={16} className="text-gray-700 dark:text-gray-300" />
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
            {getViewTitle()}
          </h2>
        </div>
        <button
          onClick={async () => {
            setIsRefreshing(true);
            await loadTickets();
            setTimeout(() => setIsRefreshing(false), 500);
          }}
          disabled={isRefreshing}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh tickets"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> 
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="activity">Newest activity</option>
            <option value="created">Newest</option>
          </select>
        </div>
      </div>

      {/* Ticket count */}
      <div className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-900 flex-shrink-0">
        {tickets.length}{' '}
        {statusFilter === 'open' ? 'Open' : statusFilter === 'all' ? 'Total' : statusFilter}
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto tickets-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="text-5xl mb-3 opacity-50">💬</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              No conversations found
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting filters</p>
          </div>
        ) : (
          <div className="">
            {tickets.map((ticket) => {
              const isSelected = selectedTicketId === ticket.ticketId;
              const hasUnread =
                ticket.hasUnreadMessages ||
                (ticket.lastActivityAt &&
                  new Date(ticket.lastActivityAt) > new Date(ticket.lastViewedAt || 0));
              return (
                <button
                  key={ticket._id}
                  onClick={() => navigate(`./${ticket.ticketId}`)}
                  className={`
                    w-full text-left px-3 py-3 transition-all border-b border-gray-100 dark:border-gray-900 relative
                    ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500'
                        : hasUnread
                        ? 'bg-yellow-50/50 dark:bg-yellow-950/10 hover:bg-yellow-100/50 dark:hover:bg-yellow-950/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                    }
                  `}
                >
                  {hasUnread && !isSelected && (
                    <div className="absolute top-3 left-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                        hasUnread && !isSelected ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      {(ticket.customerName || ticket.customerEmail || 'U')[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name, weightage, time */}
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[13px] ${
                            hasUnread && !isSelected ? 'font-bold' : 'font-semibold'
                          } text-gray-900 dark:text-gray-100 truncate flex-1`}
                        >
                          {ticket.customerName || ticket.customerEmail || 'Unknown'}
                          {hasUnread && !isSelected && (
                            <span className="ml-1.5 text-blue-600 dark:text-blue-400">•</span>
                          )}
                        </span>
                        <ChatWeightageBadge petitionId={ticket.ticketId} />
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatTime(ticket.lastActivityAt || ticket.createdAt)}
                        </span>
                      </div>

                      {/* Inbox label */}
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {(() => {
                            const IconComponent = getCategoryIcon(ticket.teamInbox);
                            return <IconComponent size={12} />;
                          })()}
                          <span>{formatTeamInbox(ticket.teamInbox)}</span>
                        </span>
                      </div>

                      {/* Subject/preview */}
                      <p className="text-[13px] text-gray-700 dark:text-gray-300 line-clamp-2">
                        {ticket.subject || '(no subject)'}
                      </p>

                      {/* Tags */}
                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ticket.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
