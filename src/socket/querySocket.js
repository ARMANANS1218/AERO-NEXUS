import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let querySocket = null;

export function getQuerySocket() {
  if (querySocket && querySocket.connected) {
    console.log('🔍 DEBUG: Reusing existing query socket', querySocket.id);
    return querySocket;
  }
  const token = localStorage.getItem('token');
  console.log('🔍 DEBUG: Creating new query socket with token:', token ? 'Present' : 'Missing');
  
  querySocket = io(`${API_URL}/query`, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
  });

  querySocket.on('connect', () => {
    console.log('✅ [query] connected:', querySocket.id);
  });
  querySocket.on('disconnect', () => {
    console.log('❌ [query] disconnected');
  });
  querySocket.on('connect_error', (err) => {
    console.error('❌ [query] connect_error:', err.message, err);
  });
  
  // Add listener for new-pending-query to verify event reception
  querySocket.on('new-pending-query', (data) => {
    console.log('📨 [DEBUG] Received new-pending-query event:', data);
  });
  
  return querySocket;
}

export function closeQuerySocket() {
  if (querySocket) {
    try { querySocket.disconnect(); } catch {}
    querySocket = null;
  }
}
