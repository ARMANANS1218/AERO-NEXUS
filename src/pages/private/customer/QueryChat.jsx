import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Phone, Video, MoreVertical, CheckCircle, 
  XCircle, Clock, User, RefreshCw, AlertCircle, /* Paperclip, */ Smile, Camera, 
  BookOpen, PanelRightClose, PanelRightOpen, Search, Copy, Plus, Edit, Trash2, Save, X, ArrowUpCircle 
} from 'lucide-react';
import { useGetQueryByPetitionIdQuery, useSendQueryMessageMutation, useResolveQueryMutation, useAcceptQueryMutation } from '../../../features/query/queryApi';
import { useGetEvaluationQuery } from '../../../features/qa/qaEvaluationApi';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { useCreateCallMutation } from '../../../features/room/roomApi';
import { useGetFaqsQuery, useCreateFaqMutation, useUpdateFaqMutation, useDeleteFaqMutation } from '../../../features/faq/faqApi';
import { useUploadScreenshotMutation } from '../../../features/screenshot/screenshotApi';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';
import FeedbackModal from '../../../components/FeedbackModal';
import RateQueryModal from '../../../components/qa/RateQueryModal';
import TransferDialog from '../../../components/TransferDialog';
import { getSocket } from '../../../hooks/socket';
import EscalationTimeline from '../../../components/Escalations/EscalationTimeline';
import ColorModeContext from '../../../context/ColorModeContext';
import CustomerDetailsPanel from '../../../components/customer/CustomerDetailsPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const IMG_BASE_URL = `${API_URL}/uploads/profile`;

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
        return parts
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
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

export default function QueryChat() {
  const { petitionId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const messageInputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showEscDropdown, setShowEscDropdown] = useState(false);
  const escBtnRef = useRef(null);
  const [snapshotRequest, setSnapshotRequest] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFaqPanel, setShowFaqPanel] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [activeSection, setActiveSection] = useState('common'); // 'common' or 'faqs'
  const [commonSearch, setCommonSearch] = useState('');
  const [newCommonReply, setNewCommonReply] = useState('');
  const [isAddingCommon, setIsAddingCommon] = useState(false);
  const [editingCommonId, setEditingCommonId] = useState(null);
  const faqPanelRef = useRef(null);
  
  // Customer Details Panel state
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [customerPanelData, setCustomerPanelData] = useState(null);
  
  const mainSocket = getSocket();
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  const { data: profileData } = useGetProfileQuery();
  const { data: queryData, isLoading, refetch } = useGetQueryByPetitionIdQuery(petitionId);
  const [sendQueryMessage, { isLoading: isSending }] = useSendQueryMessageMutation();
  const [resolveQuery, { isLoading: isResolving }] = useResolveQueryMutation();
  const [acceptQuery, { isLoading: isAccepting }] = useAcceptQueryMutation();
  const [createCall] = useCreateCallMutation();
  const [uploadScreenshot] = useUploadScreenshotMutation();

  const currentUser = profileData?.data;
  const query = queryData?.data;
  const isCustomer = currentUser?.role === 'Customer';
  const isAgent = ['Agent', 'QA', 'Admin', 'TL'].includes(currentUser?.role);
  
  // FAQ API hooks (must be after isAgent is defined)
  const { data: faqsData } = useGetFaqsQuery(undefined, { skip: !isAgent });
  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();
  
  const faqs = faqsData?.data?.filter(f => f.type === 'faq') || [];
  const commonReplies = faqsData?.data?.filter(f => f.type === 'common') || [];
  const isQATeam = ['QA','TL'].includes(currentUser?.role);
  // Only QA can set weightage (TL can only view)
  const isQA = currentUser?.role === 'QA';
  const isTL = currentUser?.role === 'TL';
  const canViewEvaluation = isQA || isTL; // used for fetching existing evaluation
  // ⚠️ FAQ MANAGEMENT MOVED TO ADMIN ONLY
  // TL, QA, and Agent can only VIEW and USE FAQs/Common Replies (Copy/Insert)
  // Only Admin can Add/Edit/Delete FAQs from Admin Panel > FAQ Management
  const canEditFaqs = false; // Changed from: isQA || isTL - Now only Admin can manage FAQs
  const canSetWeightage = isQA; // Only QA can submit weightage
  
  // Extract assignedTo ID (handle both object and string)
  const assignedToId = typeof query?.assignedTo === 'object' 
    ? query?.assignedTo?._id 
    : query?.assignedTo;
  
  const canResolve = isAgent && query?.status !== 'Resolved' && assignedToId === currentUser?._id;
  const isAssignedAgent = isAgent && assignedToId === currentUser?._id;
  // QA/TL can rate regardless of assignment once query exists
  // QA/TL can view evaluation; only QA can create
  const { data: evalData } = useGetEvaluationQuery(petitionId, { skip: !petitionId || !canViewEvaluation });
  const alreadyRated = !!evalData?.data;
  const evaluationSummary = evalData?.data ? {
    score: evalData.data.totalWeightedScore,
    result: evalData.data.result,
    category: evalData.data.performanceCategory || evalData.data.result // Fallback to result if category not available
  } : null;
  
  // Check if user is authorized to send messages
  // For agents: must be assigned OR waiting for assignment (can't message if not assigned or if escalated away)
  // For customers: can always message
  const isQueryAccepted = assignedToId ? true : false; // Query is accepted by someone
  
  // Check if current user was the one who escalated (transferred) the query
  const wasEscalatedByCurrentUser = isAgent && query?.transferHistory?.some(transfer => 
    transfer.from === currentUser?._id && transfer.status !== 'Accepted'
  );
  
  // Agent can message only if: currently assigned AND not the one who escalated it away
  const canSendMessage = isCustomer || (isAgent && assignedToId === currentUser?._id && !wasEscalatedByCurrentUser);
  const isWaitingForAssignment = isAgent && !assignedToId;
  const isNotAuthorized = isAgent && (!isQueryAccepted || wasEscalatedByCurrentUser);
  const canViewChat = isCustomer || (isAgent && (isQueryAccepted && assignedToId === currentUser?._id && !wasEscalatedByCurrentUser));

  // Show toast when user tries to access unauthorized chat
  useEffect(() => {
    if (isNotAuthorized && !isWaitingForAssignment && petitionId) {
      toast.error('You are not authorized to message in this chat', { autoClose: 4000 });
    }
  }, [isNotAuthorized, isWaitingForAssignment, petitionId]);

  // Professional emojis for business communication
  const professionalEmojis = [
    '👍', '👌', '✅', '❌', '📞', '💼', '📋', '📊', '⏰', '�',
    '📌', '🔍', '💡', '⚡', '💻', '📧', '📎', '📂', '⚠️',
    '🔄', '⏳', '📝', '🤝', '👋', '💪', '🎉', '🏆', '⭐', '✨'
  ];

  // Check if user can make calls (must be assigned to query)
  const canMakeCalls = isAgent && assignedToId === currentUser?._id && query?.status !== 'Resolved' && query?.status !== 'Expired';

  // Check if there's a pending transfer request for this user
  const hasPendingTransfer = isAgent && query?.status === 'Transferred' && query?.transferHistory?.some(transfer => 
    transfer.status === 'Requested' && transfer.toAgent === currentUser?._id
  );

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUser?._id || !petitionId) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(`${SOCKET_URL}/query`, {
      auth: { token: localStorage.getItem('token') }
    });

    // Join query room
    socketRef.current.emit('join-query', {
      petitionId,
      userId: currentUser._id
    });

    // Listen for new messages
    socketRef.current.on('new-query-message', (data) => {
      if (data.petitionId === petitionId) {
        console.log('📨 New message received via socket:', data.message);
        // Immediately add message to local state for instant display
        setLocalMessages((prev) => {
          // Check if message already exists (avoid duplicates) - ENHANCED
          const exists = prev.some(msg => {
            // Primary check: by unique _id
            if (msg._id && data.message._id && msg._id === data.message._id) return true;
            // Secondary check: matching message text/sender for optimistic messages
            if (msg.isOptimistic && 
                msg.message === data.message.message && 
                (String(msg.sender) === String(data.message.sender) || 
                 String(msg.sender) === String(data.message.sender?._id))) {
              return true;
            }
            return false;
          });
          
          if (exists) {
            // Replace optimistic message with real one from server
            return prev.map(msg => 
              (msg.isOptimistic && 
               msg.message === data.message.message && 
               (String(msg.sender) === String(data.message.sender) || 
                String(msg.sender) === String(data.message.sender?._id)))
                ? data.message 
                : msg
            );
          }
          
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    });

    // Listen for typing
    socketRef.current.on('user-typing', (data) => {
      if (data.petitionId === petitionId && data.userId !== currentUser._id) {
        setTypingUser(data.isTyping ? data.userName : null);
      }
    });

    // Listen for camera snapshot requests (customer side)
    socketRef.current.on('request-camera-snapshot', (data) => {
      if (data.petitionId === petitionId && isCustomer) {
        setSnapshotRequest({ requester: data.requester, at: new Date() });
      }
    });

    // Listen for query status changes
    socketRef.current.on('query-accepted', (data) => {
      if (data.petitionId === petitionId) {
        toast.info(`Query accepted by ${data.assignedTo.name}`);
        refetch();
      }
    });

    socketRef.current.on('query-transferred', (data) => {
      if (data.petitionId === petitionId) {
        toast.info(`Query transferred to ${data.to.name}`);
        refetch();
      }
    });

    socketRef.current.on('query-resolved', (data) => {
      if (data.petitionId === petitionId) {
        toast.success('Query has been resolved!');
        refetch();
        
        // Show feedback modal for customers after 1 second
        if (isCustomer && !query?.feedback) {
          setTimeout(() => {
            setShowFeedbackModal(true);
          }, 1000);
        }
      }
    });

    socketRef.current.on('request-feedback', (data) => {
      if (data.petitionId === petitionId && isCustomer) {
        // Auto-trigger feedback modal
        setShowFeedbackModal(true);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-query', {
          petitionId,
          userId: currentUser._id
        });
        socketRef.current.disconnect();
      }
    };
  }, [petitionId, currentUser, refetch, isCustomer]);

  // Combine API messages with local real-time messages
  useEffect(() => {
    if (query?.messages) {
      console.log(`🔄 API refetch received ${query.messages.length} messages:`, 
        query.messages.map(m => ({ _id: m._id, text: m.message?.substring(0, 30), time: formatMessageTime(m.timestamp) }))
      );
      
      setLocalMessages((prev) => {
        // Keep optimistic messages, merge with server messages
        const serverMessages = query.messages;
        const optimisticMessages = prev.filter(msg => msg.isOptimistic);
        
        // ENHANCED DEDUPLICATION: Remove duplicates by _id
        const seenIds = new Set();
        const deduplicatedServerMessages = serverMessages.filter(msg => {
          if (!msg._id) return true; // Keep messages without ID
          if (seenIds.has(msg._id)) {
            console.warn('⚠️ Duplicate in API response - removed:', msg._id);
            return false; // Skip duplicates
          }
          seenIds.add(msg._id);
          return true;
        });
        
        console.log(`✅ After API dedup: ${deduplicatedServerMessages.length} unique server messages`);
        
        // If we have optimistic messages, merge them with deduplicated server messages
        if (optimisticMessages.length > 0) {
          const allMessages = [...deduplicatedServerMessages];
          optimisticMessages.forEach(optMsg => {
            const exists = deduplicatedServerMessages.some(serverMsg => 
              serverMsg._id === optMsg._id ||
              (serverMsg.message === optMsg.message && 
               (String(serverMsg.sender) === String(optMsg.sender) || 
                String(serverMsg.sender?._id) === String(optMsg.sender)))
            );
            if (!exists) {
              allMessages.push(optMsg);
            }
          });
          console.log(`🔀 Merged: ${deduplicatedServerMessages.length} server + ${optimisticMessages.filter(m => !deduplicatedServerMessages.find(s => s._id === m._id)).length} optimistic = ${allMessages.length} total`);
          return allMessages;
        }
        
        // No optimistic messages, just use deduplicated server messages
        console.log(`📦 Using only server messages: ${deduplicatedServerMessages.length} total`);
        return deduplicatedServerMessages;
      });
    }
  }, [query?.messages]);

  // Listen for incoming calls (customer side) - handled by global IncomingCallListener
  // This is kept for completeness but the global listener takes priority
  useEffect(() => {
    if (!mainSocket || !isCustomer) return;
    
    const onIncomingCall = ({ roomId, from, callType }) => {
      console.log('📞 Incoming call detected:', { roomId, from, callType });
    };
    
    mainSocket.on('call:incoming', onIncomingCall);
    
    return () => {
      mainSocket.off('call:incoming', onIncomingCall);
    };
  }, [mainSocket, isCustomer]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // Typing indicator
  useEffect(() => {
    if (!socketRef.current || !currentUser) return;

    const typingTimeout = setTimeout(() => {
      if (isTyping) {
        socketRef.current.emit('typing', {
          petitionId,
          userId: currentUser._id,
          userName: currentUser.name,
          isTyping: false
        });
        setIsTyping(false);
      }
    }, 1000);

    return () => clearTimeout(typingTimeout);
  }, [message, petitionId, currentUser, isTyping]);

  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleTyping = (e) => {
    let newMessage = e.target.value;

    // Auto line break after 60 characters per line
    const lines = newMessage.split('\n');
    const processedLines = lines.map(line => {
      if (line.length > 160) {
        // Break long lines into chunks of 60 characters
        const chunks = [];
        for (let i = 0; i < line.length; i += 120) {
          chunks.push(line.slice(i, i + 120));
        }
        return chunks.join('\n');
      }
      return line;
    });

    newMessage = processedLines.join('\n');

    setMessage(newMessage);

    if (!isTyping && socketRef.current && currentUser) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        petitionId,
        userId: currentUser._id,
        userName: currentUser.name,
        isTyping: true
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) return;

    const messageText = message.trim();
    setMessage('');
    // Keep cursor focus in the composer after sending
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }

    // Optimistic update - immediately show message in UI
    // IMPORTANT: Use same field names as server response (message, not text)
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // Temporary ID
      message: messageText, // Use 'message' to match server field name
      sender: currentUser._id, // Send just the ID, server returns populated object
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date().toISOString(),
      isOptimistic: true // Flag to identify optimistic messages
    };

    setLocalMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      // Send via API (backend will emit socket event after saving)
      const response = await sendQueryMessage({ petitionId, message: messageText }).unwrap();
      console.log('✅ Message sent, response:', response);
      
      // The socket event 'new-query-message' will handle replacing optimistic message
      // Backend emits socket event which will be received by all users including sender
    } catch (error) {
      console.error('❌ Send message error:', error);
      toast.error(error?.data?.message || 'Failed to send message');
      // Remove optimistic message on error
      setLocalMessages((prev) => prev.filter(msg => msg._id !== optimisticMessage._id));
      setMessage(messageText); // Restore message on error
      // Return focus to the composer even on error
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }
  };

  const handleResolveQuery = async () => {
    if (!canResolve) return;

    try {
      await resolveQuery(petitionId).unwrap();
      
      if (socketRef.current && currentUser) {
        socketRef.current.emit('resolve-query', {
          petitionId,
          agentId: currentUser._id
        });
      }
      
      toast.success('Query resolved successfully!');
      refetch();
      
      // Show feedback modal immediately for customer to provide feedback
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1000);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to resolve query');
    }
  };

  // Call handlers
  const handleVideoCall = async () => {
    // Get customer ID from query (it's stored as 'customer', not 'customerId')
    const customerId = typeof query?.customer === 'object' ? query?.customer?._id : query?.customer;
    
    if (!canMakeCalls || !customerId) {
      toast.error('Unable to initiate call - you must be assigned to this query');
      return;
    }

    try {
      const res = await createCall({ receiverId: customerId }).unwrap();
      const roomId = res?.data?.roomId;
      
      // Navigate to full-page video call
      const params = new URLSearchParams({
        roomId,
        type: 'video',
        petitionId,
        userName: query.customerName || 'Customer',
        initiator: 'true'  // Mark as call initiator
      });
      
      navigate(`/video-call?${params.toString()}`);
      
      // Emit call init event
      mainSocket.emit('call:init', { 
        roomId, 
        from: currentUser._id, 
        receiverId: customerId, 
        callType: 'video',
        petitionId 
      });
    } catch (err) {
      console.error('Video call error:', err);
      toast.error(err?.data?.message || 'Failed to start video call');
    }
  };

  // Camera snapshot flow
  const requestCustomerSnapshot = () => {
    if (!socketRef.current || !isAssignedAgent) return;
    socketRef.current.emit('request-camera-snapshot', { petitionId });
    toast.info('Snapshot request sent to customer');
  };

  const captureFromCamera = async () => {
    if (!isCustomer) return;
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await new Promise((resolve) => { video.onloadedmetadata = resolve; video.play().then(resolve).catch(resolve); });

      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      // Stop stream tracks
      stream.getTracks().forEach(t => t.stop());

      await new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          try {
            if (!blob) throw new Error('Failed to capture image');
            const formData = new FormData();
            const filename = `snapshot-${petitionId}-${Date.now()}.png`;
            formData.append('screenshot', blob, filename);
            // Backend requires roomId; use petitionId as synthetic room
            formData.append('roomId', petitionId);
            formData.append('petitionId', petitionId);

            const participants = [
              { userId: currentUser._id, name: currentUser.name, role: currentUser.role },
              snapshotRequest?.requester ? { userId: snapshotRequest.requester.id, name: snapshotRequest.requester.name, role: snapshotRequest.requester.role } : {}
            ].filter(Boolean);
            formData.append('participants', JSON.stringify(participants));
            const metadata = { source: 'camera-snapshot', requesterName: snapshotRequest?.requester?.name };
            formData.append('metadata', JSON.stringify(metadata));

            const uploadRes = await uploadScreenshot(formData).unwrap();
            const imageUrl = uploadRes?.data?.imageUrl;

            if (imageUrl) {
              // Send as a chat message so both sides see it
              await sendQueryMessage({ petitionId, message: `📸 Screenshot: ${imageUrl}` }).unwrap();
              toast.success('Snapshot shared in chat');
            } else {
              toast.warn('Snapshot uploaded but URL missing');
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        }, 'image/png');
      });
    } catch (err) {
      console.error('Camera capture error:', err);
      toast.error('Camera permission denied or capture failed');
    } finally {
      setIsCapturing(false);
      setSnapshotRequest(null);
    }
  };

  const handleAudioCall = async () => {
    // Get customer ID from query (it's stored as 'customer', not 'customerId')
    const customerId = typeof query?.customer === 'object' ? query?.customer?._id : query?.customer;
    
    if (!canMakeCalls || !customerId) {
      toast.error('Unable to initiate call - you must be assigned to this query');
      return;
    }

    try {
      const res = await createCall({ receiverId: customerId }).unwrap();
      const roomId = res?.data?.roomId;
      
      // Navigate to full-page audio call (same as video call but with type=audio)
      const params = new URLSearchParams({
        roomId,
        type: 'audio',
        petitionId,
        userName: getDisplayName(query.customerName, query.customerEmail) || 'Customer',
        initiator: 'true'  // Mark as call initiator
      });
      
      navigate(`/video-call?${params.toString()}`);
      
      // Emit call init event
      mainSocket.emit('call:init', { 
        roomId, 
        from: currentUser._id, 
        receiverId: customerId, 
        callType: 'audio',
        petitionId 
      });
    } catch (err) {
      console.error('Audio call error:', err);
      toast.error(err?.data?.message || 'Failed to start audio call');
    }
  };

  const handleAcceptQuery = async () => {
    if (!hasPendingTransfer) return;

    try {
      await acceptQuery(petitionId).unwrap();
      toast.success('Query accepted successfully! Opening query...');
      
      // Wait a moment for backend to update, then navigate to the query
      setTimeout(() => {
        // Navigate to the accepted query based on user role
        // QA/TL and Agent go to /qa/query or /agent/query, Customer goes to /customer/query
        const queryRoute = ['QA', 'TL'].includes(currentUser?.role)
          ? `/qa/query/${petitionId}`
          : `/agent/query/${petitionId}`;
        navigate(queryRoute);
      }, 800);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to accept query');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500',
      'Accepted': 'bg-blue-500',
      'In Progress': 'bg-purple-500',
      'Resolved': 'bg-green-500',
      'Expired': 'bg-gray-500',
      'Transferred': 'bg-orange-500',
    };
    return colors[status] || colors['Pending'];
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'hh:mm a');
    } else {
      return format(date, 'MMM dd, hh:mm a');
    }
  };

  // New helpers for consistent absolute IST + relative time display (detail view parity with list cards)
  const getAbsRel = (rawTs) => {
    if (!rawTs) return { abs: '—', rel: '' };
    const d = new Date(rawTs);
    if (isNaN(d.getTime())) return { abs: '—', rel: '' };
    let abs;
    try {
      const fmt = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const parts = fmt.formatToParts(d);
      const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
      abs = `${map.day} ${map.month}, ${map.hour}:${map.minute} ${map.dayPeriod?.toLowerCase?.() || ''}`.trim();
    } catch {
      abs = format(d, 'dd MMM, hh:mm a');
    }
    const rel = formatDistanceToNow(d, { addSuffix: true });
    return { abs: abs + ' IST', rel };
  };

  // Hide internal transfer system messages from customers
  // IMPORTANT: Keep hooks before any early returns to preserve hook call order across renders
  const displayMessages = React.useMemo(() => {
    if (!Array.isArray(localMessages)) return [];
    
    // FINAL DEDUPLICATION - Remove any duplicates by _id before filtering  
    const seenIds = new Set();
    const deduplicated = localMessages.filter(msg => {
      if (!msg._id) return true; // Keep messages without ID
      if (seenIds.has(msg._id)) {
        console.warn('⚠️ Duplicate message detected and removed:', msg._id, msg.message);
        return false; // Skip duplicates
      }
      seenIds.add(msg._id);
      return true;
    });
    
    // DEBUG: Log final message count
    console.log(`📊 displayMessages prepared: ${deduplicated.length} unique messages from ${localMessages.length} total`);
    deduplicated.forEach((msg, idx) => {
      console.log(`  [${idx}] ${msg._id} - "${msg.message?.substring(0, 30)}" - ${formatMessageTime(msg.timestamp)}`);
    });
    
    if (!isCustomer) return deduplicated;

    // For customers (and widget users) hide internal workflow chatter and strip escalation reasons
    return deduplicated
      .filter((m) => {
        if (m?.senderRole !== 'System') return true;
        const text = String(m?.message || '').trim();
        // Exclude purely internal status system messages
        if (/^transfer requested/i.test(text)) return false;
        if (/^waiting for query assignment/i.test(text)) return false;
        if (/^query transferred/i.test(text)) return false;
        return true;
      })
      .map((m) => {
        if (m?.senderRole !== 'System') return m;
        let text = String(m?.message || '').trim();
        // Strip reason portion if present for escalation/transfer related system message
        if (/(escalat|transfer)/i.test(text) && /reason:/i.test(text)) {
          // Remove 'Reason: ...' segment (everything after Reason:)
          text = text.replace(/reason:.*$/i, '').replace(/[\s\-–]+$/,'').trim();
          // If becomes empty, drop message entirely by returning a sentinel
          if (!text) return { ...m, __hidden: true };
          return { ...m, message: text };
        }
        return m;
      })
      .filter(m => !m.__hidden);
  }, [localMessages, isCustomer]);

  // FAQ and Common Replies Functions
  useEffect(() => {
    // Close FAQ panel on click outside
    const handleClickOutside = (event) => {
      if (faqPanelRef.current && !faqPanelRef.current.contains(event.target) && showFaqPanel) {
        setShowFaqPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFaqPanel]);

  useEffect(() => {
    // Prevent body and html overflow when FAQ panel animates in/out
    if (showFaqPanel) {
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = 'hidden'; // Keep hidden even when closed to prevent scrollbar during transition
      document.documentElement.style.overflowX = 'hidden';
    }
    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, [showFaqPanel]);

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }
    try {
      await createFaq({
        type: 'faq',
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim()
      }).unwrap();
      setNewFaq({ question: '', answer: '' });
      setIsAddingFaq(false);
      toast.success('FAQ added successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to add FAQ');
    }
  };

  const handleUpdateFaq = async (id, question, answer) => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer cannot be empty');
      return;
    }
    try {
      await updateFaq({ id, question: question.trim(), answer: answer.trim() }).unwrap();
      setEditingFaqId(null);
      toast.success('FAQ updated successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteFaq(id).unwrap();
      toast.success('FAQ deleted successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete FAQ');
    }
  };

  const handleCopyAnswer = (answer) => {
    navigator.clipboard.writeText(answer);
    toast.success('Copied to clipboard!');
  };

  const handleInsertAnswer = (text) => {
    setMessage(message + (message ? '\n' : '') + text);
    toast.success('Inserted into chat');
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Common Replies Functions
  const handleAddCommonReply = async () => {
    if (!newCommonReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    try {
      await createFaq({
        type: 'common',
        text: newCommonReply.trim()
      }).unwrap();
      setNewCommonReply('');
      setIsAddingCommon(false);
      toast.success('Common reply added');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to add common reply');
    }
  };

  const handleUpdateCommonReply = async (id, text) => {
    if (!text.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    try {
      await updateFaq({ id, text: text.trim() }).unwrap();
      setEditingCommonId(null);
      toast.success('Reply updated');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update common reply');
    }
  };

  const handleDeleteCommonReply = async (id) => {
    if (!window.confirm('Delete this common reply?')) return;
    try {
      await deleteFaq(id).unwrap();
      toast.success('Reply deleted');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete common reply');
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question?.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const filteredCommonReplies = commonReplies.filter(reply =>
    reply.text?.toLowerCase().includes(commonSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Query Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The query you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/customer/queries')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Back to Queries
          </button>
        </div>
      </div>
    );
  }

  

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-950 overflow-hidden">
      {/* Main Chat Container - Shrinks when customer panel is open */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${showCustomerPanel ? 'mr-0' : ''} overflow-x-hidden overflow-y-auto relative`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isCustomer) {
                    navigate('/customer/queries');
                  } else {
                    // Navigate based on user role
                    const role = currentUser?.role?.toLowerCase();
                    navigate(`/${role}/queries`);
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
              </button>

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {isCustomer 
                      ? query.assignedToName?.[0] || 'A'
                      : getDisplayName(query.customerName, query.customerEmail)?.[0] || 'C'
                    }
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${
                    query.status === 'In Progress' || query.status === 'Accepted' 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  } border-2 border-white dark:border-gray-800 rounded-full`}></div>
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {isCustomer 
                        ? query.assignedToName || 'Waiting for Agent'
                        : getDisplayName(query.customerName, query.customerEmail)
                      }
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusColor(query.status)}`}>
                      {query.status}
                    </span>
                    {evaluationSummary && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ml-1 ${
                          evaluationSummary.category === 'Excellent' ? 'bg-green-600' :
                          evaluationSummary.category === 'Good' ? 'bg-blue-600' :
                          evaluationSummary.category === 'Average' ? 'bg-yellow-600' :
                          evaluationSummary.category === 'Poor' ? 'bg-orange-600' :
                          evaluationSummary.category === 'Very Poor' ? 'bg-red-600' :
                          'bg-gray-600'
                        }`}
                        title={`Performance: ${evaluationSummary.category} - ${evaluationSummary.score}%`}
                      >
                        {evaluationSummary.category} {evaluationSummary.score}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono font-semibold">{query.petitionId}</span>
                    <span>•</span>
                    <span>{query.category}</span>
                    {query.assignedToRole && (
                      <>
                        <span>•</span>
                        <span>{query.assignedToRole}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Show buttons only when panel is closed */}
              {!showCustomerPanel && (
                <>
                  {/* Accept Query Button - Most Prominent for Pending Transfers */}
                  {hasPendingTransfer && (
                    <button
                      onClick={handleAcceptQuery}
                      disabled={isAccepting}
                      className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-sm transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <CheckCircle size={18} />
                      <span className="hidden sm:inline">
                        {isAccepting ? 'Accepting...' : 'Accept Query'}
                      </span>
                      <span className="sm:hidden">Accept</span>
                    </button>
                  )}
                  {/* Resolve Button */}
                  {canResolve && !hasPendingTransfer && (
                    <button
                      onClick={handleResolveQuery}
                      disabled={isResolving}
                      className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-sm transition-all font-medium shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <CheckCircle size={18} />
                      <span className="hidden sm:inline">
                        {isResolving ? 'Resolving...' : 'Resolve Query'}
                      </span>
                      <span className="sm:hidden">Resolve</span>
                    </button>
                  )}
                  
                  {/* Escalation dropdown toggle */}
                  {isAgent && (
                    <button
                      ref={escBtnRef}
                      onClick={() => setShowEscDropdown(v => !v)}
                      className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-sm transition-all font-medium shadow-md bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white text-sm"
                      title="Toggle escalation history"
                    >
                      <Clock size={18} />
                      <span className="hidden sm:inline">Escalation</span>
                      <span className="sm:hidden">Esc</span>
                    </button>
                  )}
                  
                  {/* Camera snapshot */}
                  {canMakeCalls && isAssignedAgent && (
                    <button 
                      onClick={requestCustomerSnapshot}
                      className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-sm transition-all font-medium shadow-md bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white hidden md:flex text-sm"
                      title="Request Camera Snapshot"
                    >
                      <Camera size={18} />
                      <span className="text-sm font-medium">Snapshot</span>
                    </button>
                  )}
                  
                  {/* Weightage button (Only QA can set/edit weightage) */}
                  {isQA && (
                    <button
                      onClick={() => setShowRateModal(true)}
                      disabled={alreadyRated && !canSetWeightage}
                      className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-sm transition-all font-medium shadow-md bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white text-sm"
                    >
                      <AlertCircle size={18} />
                      {alreadyRated ? 'View/Edit Weightage' : 'Set Weightage'}
                    </button>
                  )}
                  
                  {/* FAQ Panel Toggle Button */}
                  {isAgent && (
                    <button 
                      onClick={() => setShowFaqPanel(!showFaqPanel)}
                      className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-sm transition-all font-medium shadow-md bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white text-sm"
                      title="FAQs & Quick Replies"
                    >
                      <BookOpen size={18} />
                      <span className="text-sm font-medium">FAQs</span>
                    </button>
                  )}
                </>
              )}
              
              {/* Customer Details Panel Toggle Button - Always visible */}
              {isAgent && (
                <button 
                  onClick={() => setShowCustomerPanel(!showCustomerPanel)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Customer Details"
                >
                  {showCustomerPanel ? (
                    <PanelRightClose size={20} className="text-gray-700 dark:text-gray-300" />
                  ) : (
                    <PanelRightOpen size={20} className="text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              )}
              
              {/* 3-dot menu - Only show when panel is open */}
              {showCustomerPanel && isAgent && (
              <div className="relative">
                <button 
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical size={20} className="text-gray-700 dark:text-gray-300" />
                </button>

                {/* Actions Dropdown - Show actions when panel is open */}
                {showActions && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      {/* Petition ID */}
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {query.petitionId}
                        </p>
                      </div>
                      
                      {hasPendingTransfer && (
                        <button
                          onClick={() => {
                            setShowActions(false);
                            handleAcceptQuery();
                          }}
                          disabled={isAccepting}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-white disabled:opacity-50"
                        >
                          <CheckCircle size={18} />
                          {isAccepting ? 'Accepting...' : 'Accept Query'}
                        </button>
                      )}
                      {canResolve && !hasPendingTransfer && (
                        <button
                          onClick={() => {
                            setShowActions(false);
                            handleResolveQuery();
                          }}
                          disabled={isResolving}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-green-600 dark:text-green-400 disabled:opacity-50"
                        >
                          <CheckCircle size={18} />
                          Resolve Query
                        </button>
                      )}
                      {/* Escalate Query */}
                       {isAgent && query.status !== 'Resolved' && query.status !== 'Expired' && (
                        <button
                          onClick={() => {
                            setShowActions(false);
                            setShowTransferDialog(true);
                          }}
                          className="w-full px-4 py-2  text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-white"
                        >
                          <RefreshCw size={18} />
                          Escalate Query
                        </button>
                      )}

                      {/* Escalation */}
                      <button
                        onClick={() => {
                          setShowActions(false);
                          setShowEscDropdown(true);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-white"
                      >
                        <Clock size={18} />
                        Escalation
                      </button>
                      
                      {/* Snapshot */}
                      {canMakeCalls && isAssignedAgent && (
                        <button
                          onClick={() => {
                            setShowActions(false);
                            requestCustomerSnapshot();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-white"
                        >
                          <Camera size={18} />
                          Snapshot
                        </button>
                      )}
                      
                      {/* Set Weightage */}
                      {isQA && (
                        <button
                          onClick={() => {
                            setShowActions(false);
                            setShowRateModal(true);
                          }}
                          disabled={alreadyRated && !canSetWeightage}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-white disabled:opacity-50"
                        >
                          <AlertCircle size={18} />
                          {alreadyRated ? 'View/Edit Weightage' : 'Set Weightage'}
                        </button>
                      )}
                      
                      {/* FAQs */}
                      <button
                        onClick={() => {
                          setShowActions(false);
                          setShowFaqPanel(!showFaqPanel);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-white"
                      >
                        <BookOpen size={18} />
                        FAQs
                      </button>
                      {/* Audio and Video call buttons commented out per requirement */}
                      {/* 
                      {canMakeCalls && (
                        <>
                          <button
                            onClick={() => {
                              setShowActions(false);
                              handleAudioCall();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300 md:hidden"
                          >
                            <Phone size={18} />
                            Audio Call
                          </button>
                          <button
                            onClick={() => {
                              setShowActions(false);
                              handleVideoCall();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300 md:hidden"
                          >
                            <Video size={18} />
                            Video Call
                          </button>
                        </>
                      )}
                      */}

                     
                      {/* Query Details - COMMENTED OUT */}
                      {/* <button
                        onClick={() => {
                          setShowActions(false);
                          navigate(`/customer/query/${petitionId}/details`);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <AlertCircle size={18} />
                        Query Details
                      </button> */}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="mt-3 px-16">
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Subject: {query.subject}
              </p>
              {evaluationSummary && (
                <div className="mt-1 text-xs font-medium">
                  <span className="text-gray-700 dark:text-gray-300">QA Eval:</span>{' '}
                  <span className={
                    evaluationSummary.category === 'Excellent' ? 'text-green-600 dark:text-green-400' :
                    evaluationSummary.category === 'Good' ? 'text-blue-600 dark:text-blue-400' :
                    evaluationSummary.category === 'Average' ? 'text-yellow-600 dark:text-yellow-400' :
                    evaluationSummary.category === 'Poor' ? 'text-orange-600 dark:text-orange-400' :
                    'text-red-600 dark:text-red-400'
                  }>
                    {evaluationSummary.score}% ({evaluationSummary.category})
                  </span>
                </div>
              )}
              {(() => {
                const { abs, rel } = getAbsRel(query.createdAt || query.created_at);
                return (
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Created:</span>
                    <span>{abs}</span>
                    {rel && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-950 text-[10px] text-gray-600 dark:text-gray-300" title={abs}>{rel}</span>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* Full-width Escalation Panel (collapsible) */}
            {isAgent && showEscDropdown && (
              <div className="mt-3 w-full">
                <div className={`w-full rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} shadow-inner`}> 
                  <div className="p-2">
                    <EscalationTimeline petitionId={petitionId} isDark={isDark} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      {!canViewChat && isAgent ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Not Authorized
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {isWaitingForAssignment 
                  ? 'You are not yet assigned to this query. Please wait for assignment.'
                  : 'You are not authorized to message in this chat'
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
  {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-950 rounded-full flex items-center justify-center mb-4">
              <User size={40} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start the conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Send a message to begin chatting
            </p>
          </div>
        ) : (
          <>
            {displayMessages.map((msg, index) => {
              // Determine if this is the current user's message (sender)
              // msg.sender might be populated object {_id, name...} or just an ID string
              const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
              const isOwnMessage = String(senderId) === String(currentUser?._id);
              const isSystemMessage = msg.senderRole === 'System';
              
              // Debug logging - show first and last message
              if (index === 0 || index === displayMessages.length - 1) {
                console.log(`� Message ${index}: "${msg.message?.substring(0, 40)}" | ID: ${msg._id} | Time: ${formatMessageTime(msg.timestamp)}`);
              }
              
              const showDateHeader = index === 0 || 
                format(new Date(displayMessages[index - 1].timestamp), 'yyyy-MM-dd') !== 
                format(new Date(msg.timestamp), 'yyyy-MM-dd');

              return (
                <React.Fragment key={msg._id || index}>
                  {/* Date Header */}
                  {showDateHeader && (
                    <div className="flex items-center justify-center my-4 px-2 sm:px-4">
                      <div className="bg-gray-200 dark:bg-gray-950 px-3 py-1 sm:px-4 rounded-full">
                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          {format(new Date(msg.timestamp), 'MMMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* System Message */}
                  {isSystemMessage ? (
                    <div className="flex justify-center px-2 sm:px-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2 max-w-[85%] sm:max-w-md min-w-0">
                        {(() => {
                          // For internal roles (Agent/QA/TL/Admin), append escalation reason to transfer system messages
                          let systemText = String(msg.message || '');
                          if (!isCustomer && /(your\s+query\s+has\s+been\s+transferred|query\s+transferred|transferred\s+by)/i.test(systemText)) {
                            const latest = Array.isArray(query?.transferHistory) && query.transferHistory.length
                              ? query.transferHistory[query.transferHistory.length - 1]
                              : null;
                            const reason = latest?.reason?.trim();
                            if (reason) {
                              systemText = `${systemText}\nReason: ${reason}`;
                            }
                          }
                          return (
                            <p className="text-sm sm:text-base text-yellow-800 dark:text-yellow-300 text-center break-words break-all sm:break-words whitespace-pre-wrap overflow-wrap-anywhere word-break-break-word">
                              {systemText}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* Regular Message - Sent (right) vs Received (left) */
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-2 sm:px-4`}>
                      <div className={`flex gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] min-w-0 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar - Only show for received messages (left side) */}
                        {!isOwnMessage && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {msg.senderName?.[0] || '?'}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div>
                          {/* Sender name - Only show for received messages */}
                          {!isOwnMessage && (
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 px-1">
                              {msg.senderName} {msg.senderRole !== 'Customer' && `(${msg.senderRole})`}
                            </div>
                          )}
                          {/* Message content */}
                          <div className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 min-w-0 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'  // Sent messages (right)
                              : 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'  // Received messages (left)
                          }`}>
                            {(() => {
                              const text = String(msg.message || '');
                              // Simple detect: messages that include an image URL (png/jpg/jpeg/gif) or start with camera prefix
                              const urlMatch = text.match(/https?:[^\s]+\.(?:png|jpg|jpeg|gif|webp)/i);
                              if (urlMatch) {
                                const imgUrl = urlMatch[0];
                                return (
                                  <div className="space-y-2">
                                    <p className="text-xs opacity-80">{text.replace(imgUrl, '').trim() || (isOwnMessage ? 'You shared a snapshot' : `${msg.senderName} shared a snapshot`)}</p>
                                    <img src={imgUrl} alt="snapshot" className="rounded-lg max-h-64 object-contain border border-gray-200 dark:border-gray-700" />
                                  </div>
                                );
                              }
                              return (
                                <p className="text-sm sm:text-base break-words break-all sm:break-words whitespace-pre-wrap leading-relaxed overflow-wrap-anywhere word-break-break-word">{text}</p>
                              );
                            })()}
                            {msg.timestamp && (
                              (() => {
                                const { abs, rel } = getAbsRel(msg.timestamp);
                                return (
                                  <div key={`time-${msg._id}`} className={`text-xs mt-1 ${
                                    isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span>{abs}</span>
                                      {rel && (
                                        <span className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px]" title={abs}>{rel}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Typing Indicator */}
            {typingUser && (
              <div className="flex justify-start px-2 sm:px-4">
                <div className="flex gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] min-w-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                    {typingUser[0]}
                  </div>
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-0">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      )}
      {/* End Messages Container Conditional */}

      {/* Input Area */}
      {query.status !== 'Resolved' && query.status !== 'Expired' ? (
        <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          {/* Snapshot Request Modal (Customer) */}
          {snapshotRequest && isCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2">
              <div className={`w-full max-w-sm rounded-xl shadow-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className="p-2">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Camera access requested</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {snapshotRequest?.requester?.name || 'Agent'} is requesting a photo from your camera to verify and assist you better. Do you allow?
                  </p>
                </div>
                <div className="flex gap-3 justify-end p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSnapshotRequest(null)}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-950 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    disabled={isCapturing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={captureFromCamera}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    disabled={isCapturing}
                  >
                    {isCapturing ? 'Capturing…' : 'Allow & Capture'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!canSendMessage && isAgent ? (
            <div className="flex items-center justify-center gap-3 py-4 px-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 font-semibold">
                {isWaitingForAssignment 
                  ? 'Waiting for query assignment. Please wait...'
                  : wasEscalatedByCurrentUser
                  ? 'You cannot message after escalating this query'
                  : 'You are not authorized to send messages in this query.'
                }
              </p>
              {isWaitingForAssignment && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-start gap-2">
              {/* <button
                type="button"
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
              >
                <Paperclip size={20} className="text-gray-600 dark:text-gray-400" />
              </button> */}
              
              <div className="flex-1 relative">
                <textarea
                  ref={messageInputRef}
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  autoFocus
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white resize-none overflow-hidden"
                  style={{ 
                    minHeight: '48px', 
                    maxHeight: '120px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block relative"
              >
                <Smile size={20} className="text-gray-600 dark:text-gray-400" />
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker-container absolute bottom-16 right-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 max-w-sm z-50">
                  <div className="grid grid-cols-6 gap-3 max-h-64 overflow-hidden">
                    {professionalEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setMessage(prev => prev + emoji);
                        }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xl hover:scale-110 transform"
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!message.trim() || isSending}
                className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-950 rounded-lg shadow-sm">
              {query.status === 'Resolved' ? (
                <>
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    This query has been resolved
                  </span>
                </>
              ) : (
                <>
                  <Clock size={20} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    This query has expired
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {/* Feedback Modal */}
      {isCustomer && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            refetch(); // Refresh query data after feedback
          }}
          petitionId={petitionId}
          querySubject={query?.subject || ''}
        />
      )}

      {/* Transfer Dialog */}
      {isAgent && (
        <TransferDialog
          isOpen={showTransferDialog}
          onClose={() => {
            setShowTransferDialog(false);
            refetch(); // Refresh query data after transfer
          }}
          petitionId={petitionId}
          querySubject={query?.subject || ''}
          currentAssignee={query?.assignedTo}
        />
      )}

      {/* Rate Query Modal */}
  {showRateModal && isQATeam && (
        <RateQueryModal
          petitionId={petitionId}
          readOnly={!canSetWeightage}
          existingData={evalData?.data}
          onClose={(saved) => {
            setShowRateModal(false);
            if (saved) {
              // Refetch evaluation state after saving
              // Reuse refetch of query to update UI; evaluation query has its own cache
              refetch();
            }
          }}
        />
      )}

      {/* FAQs Sidebar Panel */}
      {isAgent && (
        <div
          ref={faqPanelRef}
          className={`fixed top-0 right-0 h-screen bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
            showFaqPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: '630px', maxWidth: '95vw' }}
        >
          {/* FAQ Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <BookOpen size={24} className="text-white" />
              <h3 className="text-lg font-bold text-white">FAQs</h3>
            </div>
            <button
              onClick={() => setShowFaqPanel(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveSection('common')}
              className={`flex-1 px-4 py-2 font-medium transition-colors ${
                activeSection === 'common'
                  ? 'bg-blue-600 dark:bg-slate-900 text-white border-b-2 border-blue-700 dark:border-teal-600'
                  : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Common Replies
            </button>
            <button
              onClick={() => setActiveSection('faqs')}
              className={`flex-1 px-4 py-2 font-medium transition-colors ${
                activeSection === 'faqs'
                  ? 'bg-blue-600 dark:bg-slate-900 text-white border-b-2 border-blue-700 dark:border-teal-600'
                  : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              FAQs
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={activeSection === 'common' ? 'Search replies...' : 'Search FAQs...'}
                value={activeSection === 'common' ? commonSearch : faqSearch}
                onChange={(e) => activeSection === 'common' ? setCommonSearch(e.target.value) : setFaqSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>

          {/* ⚠️ ADMIN ONLY: Add New Button - Moved to Admin Panel > FAQ Management */}
          {/* TL, QA, Agent can only VIEW and USE FAQs (Copy/Insert buttons below) */}
          {/* {canEditFaqs && ((activeSection === 'faqs' && !isAddingFaq) || (activeSection === 'common' && !isAddingCommon)) && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => activeSection === 'common' ? setIsAddingCommon(true) : setIsAddingFaq(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={18} />
                {activeSection === 'common' ? 'Add Common Reply' : 'Add New FAQ'}
              </button>
            </div>
          )} */}

          {/* ⚠️ ADMIN ONLY: Add Common Reply Form - Moved to Admin Panel */}
          {/* {isAddingCommon && canEditFaqs && activeSection === 'common' && (
            <div className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-1.5 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>New Common Reply</h4>
              <textarea
                placeholder="Enter reply text..."
                value={newCommonReply}
                onChange={(e) => setNewCommonReply(e.target.value)}
                rows={3}
                className={`w-full mb-2 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCommonReply}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save size={12} />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAddingCommon(false);
                    setNewCommonReply('');
                  }}
                  className={`flex-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )} */}

          {/* ⚠️ ADMIN ONLY: Add FAQ Form - Moved to Admin Panel */}
          {/* {isAddingFaq && canEditFaqs && activeSection === 'faqs' && (
            <div className={`px-4 py-1 border-b border-gray-200 dark:border-gray-700 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-1.5 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>New FAQ</h4>
              <input
                type="text"
                placeholder="Question..."
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className={`w-full mb-2 px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <textarea
                placeholder="Answer..."
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={3}
                className={`w-full mb-2 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddFaq}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAddingFaq(false);
                    setNewFaq({ question: '', answer: '' });
                  }}
                  className={`flex-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )} */}

          {/* Content List - Common Replies or FAQs */}
          <div className="flex-1 overflow-y-auto">
            {activeSection === 'common' ? (
              // Common Replies Section
              filteredCommonReplies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <BookOpen size={48} className="text-gray-400 mb-3" />
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {commonSearch ? 'No common replies found' : canEditFaqs ? 'No common replies yet. Add your first one!' : 'No common replies available'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredCommonReplies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`p-3 rounded-lg border ${
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } hover:shadow-md transition-shadow`}
                    >
                      {editingCommonId === reply._id ? (
                        <div>
                          <textarea
                            defaultValue={reply.text}
                            id={`cr-${reply._id}`}
                            rows={3}
                            className={`w-full mb-2 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                              isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const text = document.getElementById(`cr-${reply._id}`).value;
                                handleUpdateCommonReply(reply._id, text);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <Save size={14} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommonId(null)}
                              className={`flex-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                                isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm whitespace-pre-wrap flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {reply.text}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleCopyAnswer(reply.text)}
                                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Copy"
                              >
                                <Copy size={14} className="text-gray-700 dark:text-gray-300" />
                              </button>
                              <button
                                onClick={() => handleInsertAnswer(reply.text)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                title="Insert"
                              >
                                <ArrowUpCircle size={14} />
                              </button>
                            </div>
                            {/* ⚠️ ADMIN ONLY: Edit/Delete buttons - Hidden for TL/QA/Agent */}
                            {/* {canEditFaqs && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingCommonId(reply._id)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCommonReply(reply._id)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            )} */}
                          </div>
                          {/* <span className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                            By {reply.createdByName}
                          </span> */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              // FAQs Section
              filteredFaqs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <BookOpen size={48} className="text-gray-400 mb-2" />
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {faqSearch ? 'No FAQs found' : canEditFaqs ? 'No FAQs yet. Add your first FAQ!' : 'No FAQs available'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq._id}
                      className={`p-3 rounded-lg border ${
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } hover:shadow-md transition-shadow`}
                    >
                      {editingFaqId === faq._id ? (
                        <div>
                          <input
                            type="text"
                            defaultValue={faq.question}
                            id={`q-${faq._id}`}
                            className={`w-full mb-2 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <textarea
                            defaultValue={faq.answer}
                            id={`a-${faq._id}`}
                            rows={3}
                            className={`w-full mb-2 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                              isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const q = document.getElementById(`q-${faq._id}`).value;
                                const a = document.getElementById(`a-${faq._id}`).value;
                                handleUpdateFaq(faq._id, q, a);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <Save size={12} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFaqId(null)}
                              className={`flex-1 px-3 py-1 text-sm border rounded-lg transition-colors ${
                                isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-2">
                            <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                              Q: {faq.question}
                            </h4>
                            {/* ⚠️ ADMIN ONLY: Edit/Delete buttons - Hidden for TL/QA/Agent */}
                            {/* {canEditFaqs && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingFaqId(faq._id)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(faq._id)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            )} */}
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm flex-1 whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              A: {faq.answer}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleCopyAnswer(faq.answer)}
                                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Copy"
                              >
                                <Copy size={14} className="text-gray-700 dark:text-gray-300" />
                              </button>
                              <button
                                onClick={() => handleInsertAnswer(faq.answer)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                title="Insert"
                              >
                                <ArrowUpCircle size={14} />
                              </button>
                            </div>
                          </div>
                          {/* <span className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                            By {faq.createdByName}
                          </span> */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      </div>
      {/* End of Main Chat Container */}

      {/* Customer Details Panel - Sliding from right */}
      {showCustomerPanel && (
        <div className={`w-[650px] flex-shrink-0 transition-all duration-300 ease-in-out transform ${
          showCustomerPanel ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <CustomerDetailsPanel
            isOpen={showCustomerPanel}
            onClose={() => setShowCustomerPanel(false)}
            customerId={customerPanelData?.customerId}
            queryCustomerInfo={{
              name: query?.customerName,
              email: query?.customerEmail,
              mobile: query?.customer?.mobile
            }}
            onSave={(savedCustomer) => {
              toast.success('Customer details saved');
              refetch(); // Refresh query data
            }}
          />
        </div>
      )}

    </div>
  );
}
