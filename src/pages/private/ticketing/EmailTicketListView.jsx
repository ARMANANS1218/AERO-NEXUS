import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { ChevronDown, Search, PanelLeftClose, PanelLeft, Inbox, Users, List, RefreshCw, Trash2, UserCheck, UserPlus, FileText, Wrench, DollarSign, Lightbulb, Bug, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';
import { useListTicketsQuery, useDeleteTicketMutation, useAssignTicketMutation } from '../../../features/emailTicket/emailTicketApi';
import { getTicketSocket } from '../../../socket/ticketSocket';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { useGetAssignableAgentsQuery } from '../../../features/admin/adminApi';
import { IMG_PROFILE_URL } from '../../../config/api';

/**
 * EmailTicketListView: Center pane showing list of email tickets
 */
export default function EmailTicketListView({ view, teamInbox, priority }) {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const params = useParams();
  const outletContext = useOutletContext();
  const { sidebarCollapsed, setSidebarCollapsed } = outletContext || {};
  
  const [statusFilter, setStatusFilter] = useState('open');
  const [sortBy, setSortBy] = useState('newest-activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ show: false, ticketId: null, ticketSubject: '' });
  const [assignModal, setAssignModal] = useState({ show: false, ticketId: null, ticketSubject: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, agentId: null, agentName: '', ticketSubject: '' });
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const { data: profileData } = useGetProfileQuery();
  const currentUser = profileData?.data;
  
  const { data: usersData, isLoading: isLoadingUsers } = useGetAssignableAgentsQuery();
  // API returns Agent, TL, QA roles for assignment/escalation
  const agents = usersData?.data || [];
  
  // Debug log
  console.log('📊 Assignable Agents data:', { 
    total: agents.length, 
    roles: agents.map(a => ({ name: a.name, role: a.role, dept: a.department, tier: a.tier })),
    raw: usersData 
  });

  const selectedTicketId = params.ticketId || null;

  // Build query params based on view
  const queryParams = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 20,
    sortBy,
    search: searchQuery || undefined,
  };

  // View-based filtering
  if (view === 'my-inbox') {
    queryParams.view = 'myinbox';
    queryParams.assignedTo = currentUser?._id;
  } else if (view === 'unassigned') {
    queryParams.view = 'unassigned';
  } else if (view === 'all') {
    queryParams.view = 'all';
  } else if (view === 'team' || teamInbox) {
    // For team/category views, show all tickets filtered by category
    queryParams.view = 'all';
  } else if (view === 'priority' && priority) {
    // For priority views, show all tickets filtered by priority
    queryParams.view = 'all';
  }

  // Add filters
  if (teamInbox) {
    queryParams.teamInbox = teamInbox;
  }

  if (priority) {
    queryParams.priority = priority;
  }

  const { data, isLoading, refetch } = useListTicketsQuery(queryParams);
  const tickets = data?.tickets || [];
  const totalPages = data?.totalPages || 1;

  const [deleteTicket] = useDeleteTicketMutation();
  const [assignTicket] = useAssignTicketMutation();

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = getTicketSocket();
    
    const handleNewTicket = (ticket) => {
      console.log('[ticket] New ticket received:', ticket);
      toast.info(`New Ticket: ${ticket.ticketId}`);
      refetch();
    };

    const handleTicketUpdate = (data) => {
      console.log('[ticket] Ticket updated:', data);
      refetch();
    };

    const handleTicketAssigned = (data) => {
      console.log('[ticket] Ticket assigned:', data);
      toast.info(`Ticket ${data.ticketId} assigned`);
      refetch();
    };

    const handleTicketDeleted = (data) => {
      console.log('[ticket] Ticket deleted:', data);
      toast.success('Ticket deleted');
      refetch();
      // Navigate away if we're viewing the deleted ticket
      if (selectedTicketId === data.ticketId) {
        navigate('..');
      }
    };

    socket.on('new-ticket', handleNewTicket);
    socket.on('ticket-updated', handleTicketUpdate);
    socket.on('ticket-assigned', handleTicketAssigned);
    socket.on('ticket-deleted', handleTicketDeleted);

    return () => {
      socket.off('new-ticket', handleNewTicket);
      socket.off('ticket-updated', handleTicketUpdate);
      socket.off('ticket-assigned', handleTicketAssigned);
      socket.off('ticket-deleted', handleTicketDeleted);
    };
  }, [refetch, selectedTicketId, navigate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

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
    const nameMap = {
      'general': 'General',
      'technical-issue': 'Technical Issue',
      'billing': 'Billing',
      'feature-request': 'Feature Request',
      'bug-report': 'Bug Report'
    };
    return nameMap[teamInbox] || teamInbox.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'general': FileText,
      'technical-issue': Wrench,
      'billing': DollarSign,
      'feature-request': Lightbulb,
      'bug-report': Bug
    };
    return iconMap[category] || FileText;
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    if (priority === 'medium') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    if (priority === 'low') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  };

  const getStatusBadge = (status) => {
    if (status === 'open') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300';
  };

  const getViewTitle = () => {
    if (view === 'my-inbox') return 'My Inbox';
    if (view === 'unassigned') return 'Unassigned';
    if (view === 'all') return 'All';
    if (view === 'priority' && priority) {
      return `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`;
    }
    if (teamInbox) return formatTeamInbox(teamInbox);
    return 'Inbox';
  };

  const getViewIcon = () => {
    if (view === 'my-inbox') return Inbox;
    if (view === 'unassigned') return Users;
    if (view === 'all') return List;
    if (view === 'priority') return List;
    return Inbox;
  };

  const ViewIcon = getViewIcon();

  const handleDeleteTicket = (e, ticketId, ticketSubject) => {
    e.stopPropagation(); // Prevent navigating to ticket detail
    setDeleteModal({ show: true, ticketId, ticketSubject });
  };

  const confirmDelete = async () => {
    const { ticketId } = deleteModal;
    setDeleteModal({ show: false, ticketId: null, ticketSubject: '' });
    
    try {
      await deleteTicket(ticketId).unwrap();
      toast.success('Ticket deleted successfully', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      refetch();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      toast.error(error?.data?.message || 'Failed to delete ticket', {
        position: 'bottom-right',
        autoClose: 4000,
      });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, ticketId: null, ticketSubject: '' });
  };

  // Handle "Take Ticket" - Agent assigns ticket to themselves
  const handleTakeTicket = async (e, ticketId) => {
    e.stopPropagation();
    try {
      await assignTicket({ ticketId, assignedTo: currentUser?._id }).unwrap();
      toast.success('Ticket assigned to you', {
        position: 'bottom-right',
        autoClose: 2000,
      });
      refetch();
    } catch (error) {
      console.error('Failed to take ticket:', error);
      toast.error(error?.data?.message || 'Failed to take ticket', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  // Show assignment modal for assigning to others
  const handleShowAssignModal = (e, ticketId, ticketSubject) => {
    e.stopPropagation();
    setAssignModal({ show: true, ticketId, ticketSubject });
    setAgentSearchQuery('');
  };

  // Show confirmation before assigning
  const handleAssignToAgent = (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    const displayName = agent?.name + (agent?.alias ? ` (${agent.alias})` : '');
    const { ticketSubject } = assignModal;
    
    setConfirmModal({ 
      show: true, 
      agentId, 
      agentName: displayName,
      ticketSubject 
    });
  };

  // Confirm and assign ticket
  const confirmAssign = async () => {
    const { ticketId } = assignModal;
    const { agentId, agentName } = confirmModal;
    
    setConfirmModal({ show: false, agentId: null, agentName: '', ticketSubject: '' });
    setAssignModal({ show: false, ticketId: null, ticketSubject: '' });
    
    try {
      await assignTicket({ ticketId, assignedTo: agentId }).unwrap();
      toast.success(`Ticket assigned to ${agentName}`, {
        position: 'bottom-right',
        autoClose: 2000,
      });
      refetch();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error(error?.data?.message || 'Failed to assign ticket', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  const cancelAssign = () => {
    setAssignModal({ show: false, ticketId: null, ticketSubject: '' });
    setAgentSearchQuery('');
  };

  // Filter agents based on search query, role, and department
  const filteredAgents = agents.filter(agent => {
    const searchLower = agentSearchQuery.toLowerCase();
    const name = (agent.name || '').toLowerCase();
    const alias = (agent.alias || '').toLowerCase();
    const role = (agent.role || '').toLowerCase();
    const email = (agent.email || '').toLowerCase();
    
    // Apply text search filter
    const matchesSearch = !agentSearchQuery || 
      name.includes(searchLower) || 
      alias.includes(searchLower) ||
      role.includes(searchLower) || 
      email.includes(searchLower);
    
    // Apply role filter
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
    
    // Apply department filter
    const matchesDepartment = departmentFilter === 'all' || agent.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  return (
    <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full overflow-hidden">
      {/* Header with view title and toggle button */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 px-3 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setSidebarCollapsed?.(!sidebarCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
        {priority ? (
          <span className="text-gray-700 dark:text-gray-300">
            {priority === 'high' && <AlertCircle size={16} className="text-red-600 dark:text-red-400" />}
            {priority === 'medium' && <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />}
            {priority === 'low' && <Info size={16} className="text-green-600 dark:text-green-400" />}
          </span>
        ) : teamInbox ? (
          (() => {
            const IconComponent = getCategoryIcon(teamInbox);
            return <IconComponent size={16} className="text-gray-700 dark:text-gray-300" />;
          })()
        ) : (
          <ViewIcon size={16} className="text-gray-700 dark:text-gray-300" />
        )}
        <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{getViewTitle()}</h2>
        <div className="flex-1"></div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>
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
            <option value="newest-activity">Latest Activity</option>
            <option value="oldest-activity">Oldest Activity</option>
            
          </select>
        </div>
      </div>

      {/* Ticket count */}
      <div className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-900 flex-shrink-0">
        {tickets.length} {statusFilter === 'open' ? 'Open' : statusFilter === 'all' ? 'Total' : statusFilter}
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto tickets-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-gray-500 dark:text-gray-400">
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="text-5xl mb-3 opacity-50">📧</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No tickets found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting filters or search</p>
          </div>
        ) : (
          <div className="">
            {tickets.map(ticket => {
              const isSelected = selectedTicketId === ticket.ticketId;
              const isUnread = ticket.unreadCount > 0;
              return (
                <div
                  key={ticket._id}
                  className={`
                    w-full px-3 py-3 transition-all duration-300 border-b border-gray-100 dark:border-gray-900 cursor-pointer
                    ${isSelected
                      ? 'bg-blue-200/40 dark:bg-blue-950/30 border-l-2 border-l-blue-500 dark:border-l-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                      : isUnread
                        ? 'bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border-l-4 border-l-transparent'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900/50 border-l-4 border-l-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-3" onClick={() => navigate(`./${ticket.ticketId}`)}>
                    {/* Avatar/Status indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-green-500' : ticket.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: customer email/name + time + delete */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[13px] text-gray-900 dark:text-gray-100 truncate flex-1 ${isUnread ? 'font-bold' : 'font-medium'}`}>
                          {ticket.customerName || ticket.customerEmail || 'Unknown'}
                        </span>
                        <span className={`text-[11px] text-gray-500 dark:text-gray-400 ${isUnread ? 'font-semibold' : ''}`}>
                          {formatTime(ticket.lastActivityAt || ticket.createdAt)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteTicket(e, ticket.ticketId, ticket.subject)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors z-10"
                          title="Delete ticket"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Subject */}
                      <div className={`text-[13px] text-gray-700 dark:text-gray-300 truncate mb-1 ${isUnread ? 'font-bold' : ''}`}>
                        {ticket.subject || '(no subject)'}
                      </div>

                      {/* Bottom row: ticket ID + priority + tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                          {ticket.ticketId}
                        </span>
                        {ticket.priority && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${getPriorityColor(ticket.priority)} font-medium capitalize flex items-center gap-1`}>
                            {ticket.priority === 'high' && <AlertCircle size={10} />}
                            {ticket.priority === 'medium' && <AlertTriangle size={10} />}
                            {ticket.priority === 'low' && <Info size={10} />}
                            {ticket.priority}
                          </span>
                        )}
                        {ticket.tags && ticket.tags.length > 0 && (
                          <div className="flex gap-1">
                            {ticket.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {ticket.assignedTo ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignModal({ show: true, ticketId: ticket.ticketId, ticketSubject: ticket.subject });
                            }}
                            className="text-[11px] text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 hover:underline transition-colors"
                            title="Click to reassign"
                          >
                            <UserCheck size={10} />
                            {ticket.assignedTo.name}{ticket.assignedTo.alias ? ` (${ticket.assignedTo.alias})` : ''}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleTakeTicket(e, ticket.ticketId)}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors flex items-center gap-1"
                              title="Assign to yourself"
                            >
                              <UserCheck size={10} />
                              Take
                            </button>
                            <button
                              onClick={(e) => handleShowAssignModal(e, ticket.ticketId, ticket.subject)}
                              className="text-[10px] px-2 py-0.5 rounded bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors flex items-center gap-1"
                              title="Assign to someone else"
                            >
                              <UserPlus size={10} />
                              Assign
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-[12px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-[12px] text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-[12px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelDelete}>
          <div 
            className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Ticket
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Are you sure you want to delete this ticket?
            </p>
            {deleteModal.ticketSubject && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                "{deleteModal.ticketSubject}"
              </p>
            )}
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Ticket Modal - Enhanced Landscape Layout */}
      {assignModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cancelAssign}>
          <div 
            className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Assign Ticket to Agent
              </h3>
              {assignModal.ticketSubject && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  "{assignModal.ticketSubject}"
                </p>
              )}
            </div>

            {/* Filters Bar */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={agentSearchQuery}
                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                    placeholder="Search by name, email or alias..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    autoFocus
                  />
                </div>

                {/* Role Filter */}
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="Agent">Agent</option>
                    <option value="TL">Team Leader (TL)</option>
                    <option value="QA">Quality Assurance (QA)</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Technicals">Technicals</option>
                    <option value="Billings">Billings</option>
                    <option value="Supports">Supports</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredAgents.length} of {agents.length} agents
              </div>
            </div>

            {/* Agent Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading agents...</p>
                  </div>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">No agents found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {agentSearchQuery || roleFilter !== 'all' || departmentFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : `Total agents in system: ${agents.length}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAgents.map(agent => (
                    <button
                      key={agent._id}
                      onClick={() => handleAssignToAgent(agent._id)}
                      className="p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform border-2 border-gray-200 dark:border-gray-700 relative">
                          {agent.profileImage && (
                            <img 
                              src={agent.profileImage.startsWith('http') ? agent.profileImage : `${IMG_PROFILE_URL}/${agent.profileImage}`}
                              alt={agent.name}
                              className="w-full h-full object-cover absolute inset-0 z-10"
                              onError={(e) => {
                                e.target.remove();
                              }}
                            />
                          )}
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {(agent.name || agent.alias || 'A')[0].toUpperCase()}
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5 truncate">
                            {agent.name}
                          </div>
                          {agent.alias && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                              Alias: {agent.alias}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium">
                              {agent.role}
                            </span>
                            {agent.tier && (
                              <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                                {agent.tier}
                              </span>
                            )}
                          </div>
                          {agent.department && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              📁 {agent.department}
                            </div>
                          )}
                          {agent.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {agent.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
              <div className="flex justify-end">
                <button
                  onClick={cancelAssign}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Assignment Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setConfirmModal({ show: false, agentId: null, agentName: '', ticketSubject: '' })}>
          <div 
            className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <UserCheck size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Confirm Assignment
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Assign this ticket to
              </p>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-3">
                {confirmModal.agentName}
              </p>
              
              {confirmModal.ticketSubject && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 italic line-clamp-2">
                  "{confirmModal.ticketSubject}"
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmModal({ show: false, agentId: null, agentName: '', ticketSubject: '' })}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssign}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}