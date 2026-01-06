import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAcceptQueryMutation } from '../features/query/queryApi';
import { useGetProfileQuery } from '../features/auth/authApi';
import { toast } from 'react-toastify';
import { getQuerySocket } from '../socket/querySocket';

export default function QueryNotificationPopup() {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const navigate = useNavigate();
  
  const { data: profileData } = useGetProfileQuery();
  const [acceptQuery] = useAcceptQueryMutation();
  
  const currentUser = profileData?.data;
  const userRole = currentUser?.role?.toLowerCase();

  // Initialize query socket listeners for notifications (reuse shared socket)
  useEffect(() => {
    if (!currentUser?._id) return;
    const socket = getQuerySocket();
    socketRef.current = socket;
    console.log('🔔 QueryNotificationPopup attached listeners for:', currentUser.name, 'Role:', userRole);

    // Listen for new queries (broadcast to all agents/QA)
    const onNewPending = (data) => {
      console.log('📩 New pending query received:', data);
      
  // Only show to Agent, QA, and TL roles
  if (['agent', 'qa', 'tl'].includes(userRole)) {
        const notification = {
          id: Date.now(),
          type: 'new',
          petitionId: data.petitionId,
          customerName: data.customerName,
          subject: data.subject,
          category: data.category,
          priority: data.priority,
          timestamp: new Date()
        };
        
        console.log('➕ Adding notification:', notification);
        setNotifications(prev => [...prev, notification]);
        
        // Play notification sound
        if (notificationSoundRef.current) {
          notificationSoundRef.current.play().catch((err) => {
            console.warn('Failed to play notification sound:', err);
          });
        }
        
        // Show toast notification
        toast.info(`New query from ${data.customerName}`, {
          position: 'top-right',
          autoClose: 5000
        });
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
          removeNotification(notification.id);
        }, 30000);
      }
    };

    socket.on('new-pending-query', onNewPending);

    // Note: transfer-request popups are handled in GlobalTransferListener to avoid duplicate prompts.

    // Listen for query accepted events to remove new-pending notifications
    const onAccepted = (data) => {
      console.log('✅ Query accepted:', data.petitionId);
      // Remove notification if this query was in the list
      setNotifications(prev => prev.filter(n => n.petitionId !== data.petitionId));
    };
    socket.on('query-accepted', onAccepted);

    return () => {
      if (!socketRef.current) return;
      console.log('🔌 Detaching QueryNotificationPopup listeners');
      try {
        socketRef.current.off('new-pending-query', onNewPending);
        socketRef.current.off('query-accepted', onAccepted);
      } catch {}
    };
  }, [currentUser, userRole]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAccept = async (petitionId, notificationId) => {
    try {
      // Accept the query and wait for backend to update
      const result = await acceptQuery(petitionId).unwrap();
      console.log('✅ Query accepted successfully:', result);
      
      toast.success('Query accepted successfully! Refreshing page...');
      removeNotification(notificationId);
      
      // Emit socket event to notify others in real-time (if socket available)
      try {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('accept-query', { petitionId, agentId: currentUser._id });
        }
      } catch (err) {
        console.warn('Failed to emit accept-query via socket', err);
      }
      
      // Wait a moment to ensure all socket events are processed and database is updated
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate to the appropriate query page without full reload (smoother UX)
      try {
        const role = (currentUser?.role || '').toLowerCase();
        const rolePath = role;
        navigate(`/${rolePath}/query/${petitionId}`);
      } catch {
        // Fallback to reload if navigation context isn't available
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Failed to accept query:', error);
      toast.error(error?.data?.message || 'Failed to accept query');
    }
  };

  const handleIgnore = (notificationId) => {
    removeNotification(notificationId);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20',
      'Medium': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20',
      'High': 'border-orange-500 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20',
      'Urgent': 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20',
    };
    return colors[priority] || colors['Medium'];
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 w-[430px]">
      {/* Notification Sound */}
      <audio ref={notificationSoundRef} src="/118029-TX/notification-tone.mp3" preload="auto" />
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getPriorityColor(notification.priority)} border-l-4 rounded-lg shadow-2xl animate-slide-in-right overflow-hidden`}
        >
          <div className="bg-white dark:bg-gray-950 px-3 py-2">
            {/* Two-line compact layout */}
            <div className="flex items-center justify-between gap-3">
              {/* Line 1: Icon + Title + Customer Info + Petition ID */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Bell className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={16} />
                <span className="font-semibold text-gray-900 dark:text-white text-xs whitespace-nowrap">
                  {notification.type === 'transfer' ? 'Transfer Request' : 'New Query'}
                </span>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {notification.customerName?.[0] || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {notification.customerName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {notification.petitionId}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleIgnore(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Line 2: Subject + Category + Priority + Actions */}
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                  {notification.subject}
                </span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-950 rounded text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {notification.category}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                  notification.priority === 'Urgent' ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:bg-opacity-30' :
                  notification.priority === 'High' ? 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:bg-opacity-30' :
                  notification.priority === 'Medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30' :
                  'text-green-600 bg-green-100 dark:bg-green-900 dark:bg-opacity-30'
                }`}>
                  {notification.priority}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    if (notification.type === 'transfer') {
                      handleAccept(notification.petitionId, notification.id);
                    } else {
                      handleAccept(notification.petitionId, notification.id);
                    }
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded transition-all text-xs font-medium shadow-md"
                >
                  <CheckCircle size={12} />
                  Accept
                </button>
                <button
                  onClick={() => handleIgnore(notification.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-950 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-all text-xs font-medium"
                >
                  <XCircle size={12} />
                  Ignore
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}