import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Send, Paperclip, MoreVertical, User, Mail, Calendar,
  Tag, Users as UsersIcon, CheckCircle, Clock, XCircle, AlertCircle, PanelRightClose, PanelRight, Search, ArrowUpCircle, Eye, X, RefreshCw
} from 'lucide-react';
import { API_BASE_URL, IMG_PROFILE_URL } from '../../../config/api';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';
import { 
  useGetTicketQuery, 
  useReplyToTicketMutation,
  useUpdateTicketStatusMutation,
  useAssignTicketMutation,
  useUpdateTicketTagsMutation
} from '../../../features/emailTicket/emailTicketApi';
import { useGetAssignableAgentsQuery } from '../../../features/admin/adminApi';
import { getTicketSocket, joinTicketRoom, leaveTicketRoom, sendTicketTyping } from '../../../socket/ticketSocket';
import { format } from 'date-fns';

// Utility function to get a display name for customers
const getCustomerDisplayName = (ticket) => {
  const { customerName, customerEmail, guestName, guestEmail } = ticket;
  
  // Try customerName first
  if (customerName && customerName !== 'Guest User') {
    // Check if it's just the email prefix (no spaces, no @ symbol)
    if (!customerName.includes(' ') && !customerName.includes('@')) {
      // If it looks like an email prefix, try to make it more readable
      if (customerEmail) {
        const emailParts = customerEmail.split('@');
        const emailPrefix = emailParts[0];
        
        // If customerName is just the email prefix, try to format it better
        if (customerName === emailPrefix) {
          // Convert something like "armanansarig813" to "Armanan Sarig"
          const formatted = customerName
            .replace(/[0-9]/g, '') // Remove numbers
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals
            .split(/[._-]/) // Split on common separators
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ')
            .trim();
          
          if (formatted && formatted !== customerName) {
            return formatted;
          }
        }
      }
    }
    return customerName;
  }
  
  // Try guestName
  if (guestName && guestName !== 'Guest User') {
    return guestName;
  }
  
  // If we have email, try to extract a name from it
  const email = customerEmail || guestEmail;
  if (email) {
    const emailPrefix = email.split('@')[0];
    
    // Try to format the email prefix into a readable name
    const formatted = emailPrefix
      .replace(/[0-9]/g, '') // Remove numbers
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals  
      .split(/[._-]/) // Split on common separators
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
      .trim();
    
    if (formatted && formatted.length > 1) {
      return formatted;
    }
    
    // Fallback to just the email prefix with first letter capitalized
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
  
  return 'Customer';
};

/**
 * EmailTicketDetail: Right pane showing ticket conversation and reply editor
 */
export default function EmailTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  const [replyText, setReplyText] = useState('');
  const [htmlMessage, setHtmlMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [confirmEscalateModal, setConfirmEscalateModal] = useState({ show: false, agentId: null, agentName: '' });
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showTagsInput, setShowTagsInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const replyEditorRef = useRef(null);
  const panelRef = useRef(null);

  // Helper function to determine if file is previewable
  const isPreviewable = (filename, contentType) => {
    const ext = filename?.toLowerCase().split('.').pop();
    const mime = contentType?.toLowerCase();
    
    return (
      // Images
      mime?.startsWith('image/') ||
      // PDFs  
      ext === 'pdf' || mime === 'application/pdf' ||
      // Text files
      ext === 'txt' || mime === 'text/plain'
    );
  };

  // Handle file preview
  const handlePreview = (attachment) => {
    setPreviewFile(attachment);
  };

  // Handle attachment downloads via backend-signed URL (works for PDFs reliably)
  const handleDownload = (url, filename) => {
    try {
      if (!url) return;
      const safeName = String(filename || 'download').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
      if (url.includes('cloudinary.com')) {
        // Use backend to generate signed URL and redirect
        const endpoint = `${API_BASE_URL}/api/v1/email-ticketing/attachments/download?filename=${encodeURIComponent(safeName)}&url=${encodeURIComponent(url)}`;
        const link = document.createElement('a');
        link.href = endpoint;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      // Fallback: non-Cloudinary direct link
      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const { data, isLoading, refetch } = useGetTicketQuery(ticketId, {
    skip: !ticketId,
  });
  const { data: usersData } = useGetAssignableAgentsQuery();
  const [replyToTicket, { isLoading: isSending }] = useReplyToTicketMutation();
  const [updateStatus] = useUpdateTicketStatusMutation();
  const [assignTicket] = useAssignTicketMutation();
  const [updateTags] = useUpdateTicketTagsMutation();

  const ticket = data?.ticket;
  const messages = data?.messages || [];

  // Handle outside clicks to close panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rightPanelCollapsed && panelRef.current && !panelRef.current.contains(event.target)) {
        // Check if click is not on the toggle button
        const toggleButton = event.target.closest('button[aria-label="Toggle ticket details"]');
        if (!toggleButton) {
          setRightPanelCollapsed(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [rightPanelCollapsed]);
  
  // All employees from API are already filtered to Agent, TL, QA roles
  const agents = usersData?.data || [];

  // Filter agents for escalate modal
  const filteredAgents = agents.filter(agent => {
    const searchLower = agentSearchQuery.toLowerCase();
    const name = (agent.name || '').toLowerCase();
    const alias = (agent.alias || '').toLowerCase();
    const role = (agent.role || '').toLowerCase();
    const email = (agent.email || '').toLowerCase();
    
    const matchesSearch = !agentSearchQuery || 
      name.includes(searchLower) || 
      alias.includes(searchLower) ||
      role.includes(searchLower) || 
      email.includes(searchLower);
    
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || agent.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Socket connection for real-time updates
  useEffect(() => {
    if (!ticketId) return;

    const socket = getTicketSocket();
    joinTicketRoom(ticketId);

    const handleNewMessage = (data) => {
      console.log('[ticket] New message:', data);
      refetch();
      scrollToBottom();
    };

    const handleTicketUpdated = (data) => {
      console.log('[ticket] Ticket updated:', data);
      refetch();
    };

    const handleAgentTyping = (data) => {
      if (data.ticketId === ticketId && data.isTyping) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('new-ticket-message', handleNewMessage);
    socket.on('ticket-updated', handleTicketUpdated);
    socket.on('agent-typing', handleAgentTyping);

    return () => {
      socket.off('new-ticket-message', handleNewMessage);
      socket.off('ticket-updated', handleTicketUpdated);
      socket.off('agent-typing', handleAgentTyping);
      leaveTicketRoom(ticketId);
    };
  }, [ticketId, refetch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReplyChange = (e) => {
    setReplyText(e.target.value);
    
    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    sendTicketTyping(ticketId, true);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTicketTyping(ticketId, false);
    }, 1000);
  };

  const updateHtmlContent = () => {
    const editorEl = document.getElementById('reply-editor');
    if (editorEl) {
      setHtmlMessage(editorEl.innerHTML);
      setReplyText(editorEl.innerText);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTicketTyping(ticketId, true);
    typingTimeoutRef.current = setTimeout(() => {
      sendTicketTyping(ticketId, false);
    }, 1000);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateHtmlContent();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      // PDFs
      'application/pdf',
      // Word
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12', 'text/csv',
      // PowerPoint
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain', 'text/rtf', 'application/rtf',
      // Archives
      'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];
    
    const validFiles = files.filter(file => {
      const isUnder10MB = file.size <= 10 * 1024 * 1024;
      const isAllowedType = allowedTypes.includes(file.type);
      
      if (!isUnder10MB) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      
      if (!isAllowedType) {
        toast.error(`File type not allowed: ${file.name}`);
        return false;
      }
      
      return true;
    });
    
    if (selectedFiles.length + validFiles.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if ((!replyText.trim() && selectedFiles.length === 0) || isSending) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role?.toLowerCase() || 'agent';
      
      if (selectedFiles.length > 0) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('ticketId', ticketId);
        formData.append('message', replyText);
        formData.append('html', htmlMessage || replyText);
        formData.append('senderType', role);
        formData.append('sendEmail', ticket?.channel === 'email' || ticket?.channel === 'widget');
        
        selectedFiles.forEach(file => {
          formData.append('attachments', file);
        });
        
        const token = localStorage.getItem('token');
        const org = localStorage.getItem('organizationId');
        
        await axios.post(
          `${API_BASE_URL}/api/v1/email-ticketing/tickets/reply`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-organization-id': org
            }
          }
        );
      } else {
        // Regular text reply
        await replyToTicket({
          ticketId,
          message: replyText,
          html: htmlMessage || `<p>${replyText}</p>`,
          senderType: role,
          sendEmail: ticket?.channel === 'email' || ticket?.channel === 'widget',
        }).unwrap();
      }
      
      setReplyText('');
      setHtmlMessage('');
      setSelectedFiles([]);
      // Clear contenteditable
      const editorEl = document.getElementById('reply-editor');
      if (editorEl) editorEl.innerHTML = '';
      
      toast.success('Reply sent');
      scrollToBottom();
    } catch (error) {
      console.error('Send reply error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateStatus({ ticketId, status }).unwrap();
      toast.success(`Ticket ${status}`);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (agentId) => {
    try {
      await assignTicket({ ticketId, assignedTo: agentId }).unwrap();
      toast.success('Ticket assigned');
      setShowAssignMenu(false);
    } catch (error) {
      console.error('Assign error:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const handleEscalate = (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    const displayName = agent?.name + (agent?.alias ? ` (${agent.alias})` : '');
    
    setConfirmEscalateModal({ 
      show: true, 
      agentId, 
      agentName: displayName 
    });
  };

  const confirmEscalate = async () => {
    const { agentId, agentName } = confirmEscalateModal;
    
    setConfirmEscalateModal({ show: false, agentId: null, agentName: '' });
    setShowEscalateModal(false);
    setAgentSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('all');
    
    try {
      await assignTicket({ ticketId, assignedTo: agentId }).unwrap();
      toast.success(`Ticket escalated to ${agentName}`, {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Escalate error:', error);
      toast.error(error?.data?.message || 'Failed to escalate ticket', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const updatedTags = [...(ticket?.tags || []), newTag.trim()];
      await updateTags({ ticketId, tags: updatedTags }).unwrap();
      setNewTag('');
      setShowTagsInput(false);
      toast.success('Tag added');
    } catch (error) {
      console.error('Add tag error:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      const updatedTags = ticket.tags.filter(t => t !== tagToRemove);
      await updateTags({ ticketId, tags: updatedTags }).unwrap();
      toast.success('Tag removed');
    } catch (error) {
      console.error('Remove tag error:', error);
      toast.error('Failed to remove tag');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'open') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'open') return CheckCircle;
    if (status === 'pending') return Clock;
    return XCircle;
  };

  if (!ticketId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-50">📧</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Select a ticket to view</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-3 text-red-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Ticket not found</p>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(ticket.status);

  return (
    <div className="flex h-full relative overflow-hidden w-full">
      {/* Conversation Panel - Always takes full remaining width */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 h-full overflow-hidden min-w-0 w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-1 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('..')}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 lg:hidden"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {ticket.subject || '(no subject)'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {ticket.ticketId}
          </p>
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}
          >
            <StatusIcon size={12} />
            {ticket.status}
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleStatusChange('open')}
                className="w-full px-3 py-2 text-left text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <CheckCircle size={12} className="text-green-600" />
                Open
              </button>
              <button
                onClick={() => handleStatusChange('pending')}
                className="w-full px-3 py-2 text-left text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Clock size={12} className="text-yellow-600" />
                Pending
              </button>
              <button
                onClick={() => handleStatusChange('closed')}
                className="w-full px-3 py-2 text-left text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <XCircle size={12} className="text-red-500" />
                Closed
              </button>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button 
          onClick={() => refetch()}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          title="Refresh ticket"
        >
          <RefreshCw size={16} />
        </button>

        {/* More Actions Menu (3-dot) */}
        <div className="relative">
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {
                  setShowEscalateModal(true);
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                <ArrowUpCircle size={14} className="text-blue-600 dark:text-blue-400" />
                Escalate Ticket
              </button>
            </div>
          )}
        </div>

        {/* Right Panel Toggle - Moved here */}
        <button
          onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Toggle ticket details"
          title={rightPanelCollapsed ? 'Show details' : 'Hide details'}
        >
          {rightPanelCollapsed ? <PanelRight size={16} /> : <PanelRightClose size={16} />}
        </button>
      </div>

      {/* Ticket metadata - Single line layout */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs overflow-x-auto">
          {/* Email */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Mail size={12} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{ticket.customerEmail || 'No email'}</span>
          </div>
          
          {/* Name */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <User size={12} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{getCustomerDisplayName(ticket)}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar size={12} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {format(new Date(ticket.createdAt), 'MMM dd, hh:mm a')}
            </span>
          </div>

          {/* Assignment */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <UsersIcon size={12} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
              {ticket.assignedTo 
                ? ticket.assignedTo.name 
                  ? `${ticket.assignedTo.name}${ticket.assignedTo.alias ? ` (${ticket.assignedTo.alias})` : ''}`
                  : ticket.assignedTo.alias || ticket.assignedTo.email || 'Assigned'
                : 'Unassigned'
              }
            </span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Tag size={12} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {ticket.tags?.map((tag, i) => (
                <span
                  key={i}
                  onClick={() => handleRemoveTag(tag)}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 flex-shrink-0"
                >
                  {tag}
                  <XCircle size={8} />
                </span>
              ))}
              {showTagsInput ? (
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  onBlur={() => setShowTagsInput(false)}
                  placeholder="Add tag..."
                  className="px-1.5 py-0.5 text-[10px] border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[60px]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setShowTagsInput(true)}
                  className="px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                >
                  + Add tag
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent' }}>
        {messages.map((msg) => {
          const isAgent = msg.senderType === 'agent' || msg.senderType === 'qa' || msg.senderType === 'tl';
          return (
            <div
              key={msg._id}
              className="w-full min-w-0"
            >
              <div className={`${isAgent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-700'} border rounded-lg p-3 min-w-0 w-full`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {isAgent 
                      ? (msg.sender?.alias || msg.sender?.name || `${msg.senderType.charAt(0).toUpperCase() + msg.senderType.slice(1)}`)
                      : getCustomerDisplayName(ticket)
                    }
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(msg.createdAt), 'MMM dd, hh:mm a')}
                  </span>
                </div>
                <div 
                  className="text-sm text-gray-800 dark:text-gray-200 w-full"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    maxWidth: 'none'
                  }}
                  dangerouslySetInnerHTML={{ __html: msg.html || msg.message }}
                />
                
                {/* Message Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.attachments.map((attachment, idx) => {
                      const isImage = attachment.contentType?.startsWith('image/');
                      const canPreview = isPreviewable(attachment.filename, attachment.contentType);
                      return (
                        <div key={idx} className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                          {isImage ? (
                            <div className="bg-gray-50 dark:bg-gray-900">
                              <img 
                                src={attachment.url} 
                                alt={attachment.filename}
                                className="max-w-full max-h-64 object-contain mx-auto cursor-pointer"
                                onClick={() => handlePreview(attachment)}
                              />
                              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-300 dark:border-gray-700">
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{attachment.filename}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handlePreview(attachment)}
                                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                                  >
                                    <Eye size={12} />
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDownload(attachment.url, attachment.filename)}
                                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Paperclip size={14} className="text-gray-500 flex-shrink-0" />
                                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{attachment.filename}</span>
                                <span className="text-xs text-gray-500">({(attachment.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <div className="flex gap-1">
                                {canPreview && (
                                  <button
                                    onClick={() => handlePreview(attachment)}
                                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                                  >
                                    <Eye size={12} />
                                    Preview
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownload(attachment.url, attachment.filename)}
                                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex-shrink-0"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply editor - Widget style */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 flex-shrink-0">
        <div 
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-950"
          style={{ width: '100%' }}
        >
          {/* Toolbar */}
          <div 
            className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex gap-1 items-center">
              <button 
                type="button" 
                onClick={() => execCommand('bold')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('italic')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('underline')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Underline"
              >
                <u>U</u>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('strikeThrough')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Strikethrough"
              >
                <s>S</s>
              </button>
              
              <div className="w-px bg-gray-300 dark:bg-gray-600 h-5 mx-1" />
              
              <button 
                type="button" 
                onClick={() => execCommand('justifyLeft')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Align Left"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('justifyCenter')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Align Center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('justifyRight')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Align Right"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
                </svg>
              </button>
              
              <div className="w-px bg-gray-300 dark:bg-gray-600 h-5 mx-1" />
              
              <button 
                type="button" 
                onClick={() => execCommand('insertUnorderedList')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Bullet List"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('insertOrderedList')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Numbered List"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                </svg>
              </button>
              
              <div className="w-px bg-gray-300 dark:bg-gray-600 h-5 mx-1" />
              
              <button 
                type="button" 
                onClick={() => execCommand('indent')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Increase Indent"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('outdent')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Decrease Indent"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 21h18v-2H3v2zM3 8l4 4 4-4H3zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>
                </svg>
              </button>
              
              <div className="w-px bg-gray-300 dark:bg-gray-600 h-5 mx-1" />
              
              <button 
                type="button" 
                onClick={() => execCommand('insertHorizontalRule')} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Insert Line"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button 
                type="button" 
                onClick={() => document.getElementById('file-upload').click()} 
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Attach File"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleSendReply}
              disabled={!replyText.trim() && selectedFiles.length === 0 || isSending}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed border-none rounded-md cursor-pointer transition-colors flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send
                </>
              )}
            </button>
          </div>
          
          {/* Editor */}
          <div
            id="reply-editor"
            contentEditable
            onInput={updateHtmlContent}
            onBlur={updateHtmlContent}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            className="min-h-[100px] max-h-[200px] overflow-y-auto p-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 outline-none"
            data-placeholder="Type your reply..."
            style={{
              minHeight: '100px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          />
          
          {/* File Attachments */}
          {selectedFiles.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-6 h-6 object-cover rounded"
                    />
                  ) : (
                    <Paperclip size={12} className="text-gray-500" />
                  )}
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <style>{`
            [contentEditable]:empty:before {
              content: attr(data-placeholder);
              color: #9CA3AF;
              pointer-events: none;
            }
            #reply-editor {
              max-width: 100%;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            #reply-editor ul,
            #reply-editor ol {
              margin-left: 1.5rem;
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }
            #reply-editor ul {
              list-style-type: disc;
            }
            #reply-editor ol {
              list-style-type: decimal;
            }
            #reply-editor li {
              margin-bottom: 0.25rem;
            }
          `}</style>
        </div>
      </div>
      </div>

      {/* Backdrop */}
      {!rightPanelCollapsed && (
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 transition-opacity duration-300"
          onClick={() => setRightPanelCollapsed(true)}
        />
      )}

      {/* Right Details Panel - Overlay */}
      <div 
        ref={panelRef}
        className={`absolute right-0 top-0 h-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col overflow-hidden transition-all duration-300 shadow-2xl z-20 ${
          rightPanelCollapsed ? 'w-0 opacity-0 translate-x-full' : 'w-80 opacity-100 translate-x-0'
        }`}
      >
          {/* Header */}
          <div className="h-12 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between flex-shrink-0">
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Ticket Details</h3>
            <button
              onClick={() => setRightPanelCollapsed(true)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Close ticket details"
            >
              <PanelRightClose size={16} />
            </button>
          </div>

          {/* Details Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Customer Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <User size={14} />
                <span>Customer</span>
              </div>
              <div className="pl-6 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16">Name:</span>
                  <span className="text-[12px] text-gray-900 dark:text-gray-100 flex-1">
                    {getCustomerDisplayName(ticket)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={11} className="text-gray-400 mt-0.5" />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-14">Email:</span>
                  <span className="text-[12px] text-gray-900 dark:text-gray-100 flex-1 break-all">
                    {ticket.customerEmail || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Information */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <AlertCircle size={14} />
                <span>Ticket Info</span>
              </div>
              <div className="pl-6 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16">ID:</span>
                  <span className="text-[12px] font-mono text-gray-900 dark:text-gray-100">
                    {ticket.ticketId}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16">Status:</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${
                    ticket.status === 'open' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : ticket.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                {ticket.priority && (
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16">Priority:</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      ticket.priority === 'high'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16">Channel:</span>
                  <span className="text-[12px] text-gray-900 dark:text-gray-100">
                    {ticket.channel || 'email'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment */}
            {ticket.assignedTo && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <User size={14} />
                  <span>Assigned To</span>
                </div>
                <div className="pl-6">
                  <button
                    onClick={() => setShowAssignMenu(!showAssignMenu)}
                    className="text-[12px] text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors text-left"
                    title="Click to reassign"
                  >
                    {ticket.assignedTo 
                      ? ticket.assignedTo.name
                        ? `${ticket.assignedTo.name}${ticket.assignedTo.alias ? ` (${ticket.assignedTo.alias})` : ''}`
                        : ticket.assignedTo.alias || ticket.assignedTo.email || 'Assigned'
                      : 'Unassigned'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Team Inbox */}
            {ticket.teamInbox && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <UsersIcon size={14} />
                  <span>Team</span>
                </div>
                <div className="pl-6">
                  <span className="text-[12px] text-gray-900 dark:text-gray-100">
                    {ticket.teamInbox}
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Tag size={14} />
                  <span>Tags</span>
                </div>
                <div className="pl-6 flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Calendar size={14} />
                <span>Timeline</span>
              </div>
              <div className="pl-6 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-20">Created:</span>
                  <span className="text-[12px] text-gray-900 dark:text-gray-100">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {ticket.lastActivityAt && (
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 w-20">Last Activity:</span>
                    <span className="text-[12px] text-gray-900 dark:text-gray-100">
                      {new Date(ticket.lastActivityAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            {ticket.subject && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                <div className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </div>
                <p className="text-[12px] text-gray-900 dark:text-gray-100 break-words">
                  {ticket.subject}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Escalate Ticket Modal */}
        {showEscalateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEscalateModal(false)}>
            <div 
              className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Escalate Ticket
                </h3>
                {ticket?.subject && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    "{ticket.subject}"
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
                {filteredAgents.length === 0 ? (
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
                        onClick={() => handleEscalate(agent._id)}
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
                    onClick={() => {
                      setShowEscalateModal(false);
                      setAgentSearchQuery('');
                      setRoleFilter('all');
                      setDepartmentFilter('all');
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Escalation Modal */}
        {confirmEscalateModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setConfirmEscalateModal({ show: false, agentId: null, agentName: '' })}>
            <div 
              className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <ArrowUpCircle size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Confirm Escalation
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Escalate this ticket to
                </p>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  {confirmEscalateModal.agentName}
                </p>
                
                {ticket?.subject && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 italic line-clamp-2">
                    "{ticket.subject}"
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmEscalateModal({ show: false, agentId: null, agentName: '' })}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEscalate}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]" onClick={() => setPreviewFile(null)}>
            <div 
              className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {previewFile.filename}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewFile.url, previewFile.filename)}
                    className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {(() => {
                  const ext = previewFile.filename?.toLowerCase().split('.').pop();
                  const isImage = previewFile.contentType?.startsWith('image/');
                  const isPdf = ext === 'pdf' || previewFile.contentType === 'application/pdf';
                  const isText = ext === 'txt' || previewFile.contentType === 'text/plain';

                  if (isImage) {
                    return (
                      <div className="flex justify-center">
                        <img 
                          src={previewFile.url} 
                          alt={previewFile.filename}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    );
                  } else if (isPdf) {
                    return (
                      <div className="w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <iframe 
                          src={`${previewFile.url}#toolbar=1&navpanes=1&scrollbar=1`}
                          className="w-full h-full"
                          title={previewFile.filename}
                        />
                      </div>
                    );
                  } else if (isText) {
                    return (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                        <iframe 
                          src={previewFile.url}
                          className="w-full h-96 border-none"
                          title={previewFile.filename}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-12">
                        <Paperclip size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Preview not available for this file type
                        </p>
                        <button
                          onClick={() => handleDownload(previewFile.url, previewFile.filename)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          Download to Open
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
