import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let emailSocket = null;

export const useEmailSocket = (userId) => {
  const [emails, setEmails] = useState([]);
  const [newEmailNotification, setNewEmailNotification] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Initialize email socket connection
    const token = localStorage.getItem('token');
    emailSocket = io(`${SOCKET_URL}/email`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    emailSocket.on('connect', () => {
      console.log('✅ Email socket connected');
      setIsConnected(true);
      emailSocket.emit('join-email-room', userId);
    });

    emailSocket.on('new-email', (data) => {
      console.log('📧 New email received:', data);
      setEmails(prev => [data, ...prev]);
      setNewEmailNotification(data);
      
      // Clear notification after 5 seconds
      setTimeout(() => setNewEmailNotification(null), 5000);
    });

    emailSocket.on('incoming-email', (data) => {
      console.log('📨 Incoming email:', data);
      setEmails(prev => [data, ...prev]);
      setNewEmailNotification(data);
    });

    emailSocket.on('email-sent', (data) => {
      console.log('✅ Email sent:', data);
      setEmails(prev => [data, ...prev]);
    });

    emailSocket.on('email-error', (error) => {
      console.error('📧 Email error:', error);
    });

    emailSocket.on('disconnect', () => {
      console.log('❌ Email socket disconnected');
      setIsConnected(false);
    });

    return () => {
      if (emailSocket) {
        emailSocket.disconnect();
      }
    };
  }, [userId]);

  const sendEmail = useCallback(({ from, to, subject, body, ticketId }) => {
    if (!emailSocket || !emailSocket.connected) {
      console.error('Email socket not connected');
      return;
    }
    emailSocket.emit('send-email', {
      from,
      to,
      subject,
      body,
      ticketId,
    });
  }, []);

  const receiveEmail = useCallback(({ from, to, subject, body, ticketId }) => {
    if (!emailSocket || !emailSocket.connected) {
      console.error('Email socket not connected');
      return;
    }
    emailSocket.emit('receive-email', {
      from,
      to,
      subject,
      body,
      ticketId,
    });
  }, []);

  const markAsRead = useCallback((emailId) => {
    if (!emailSocket || !emailSocket.connected) {
      return;
    }
    emailSocket.emit('mark-email-read', emailId);
  }, []);

  const deleteEmail = useCallback((emailId) => {
    if (!emailSocket || !emailSocket.connected) {
      return;
    }
    emailSocket.emit('delete-email', emailId);
  }, []);

  return {
    emails,
    newEmailNotification,
    isConnected,
    sendEmail,
    receiveEmail,
    markAsRead,
    deleteEmail,
    socket: emailSocket,
  };
};

export default useEmailSocket;
