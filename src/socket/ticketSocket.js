import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let ticketSocket = null;

export function getTicketSocket() {
  if (ticketSocket && ticketSocket.connected) return ticketSocket;
  
  const token = localStorage.getItem('token');
  ticketSocket = io(`${API_URL}/ticket`, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  ticketSocket.on('connect', () => {
    console.log('[ticket] Socket connected:', ticketSocket.id);
  });

  ticketSocket.on('disconnect', () => {
    console.log('[ticket] Socket disconnected');
  });

  ticketSocket.on('connect_error', (err) => {
    console.error('[ticket] Connection error:', err.message);
  });

  return ticketSocket;
}

export function closeTicketSocket() {
  if (ticketSocket) {
    try {
      ticketSocket.disconnect();
    } catch (error) {
      console.error('Error closing ticket socket:', error);
    }
    ticketSocket = null;
  }
}

// Join ticket room for real-time updates
export function joinTicketRoom(ticketId) {
  const socket = getTicketSocket();
  socket.emit('join-ticket', { ticketId });
  console.log(`[ticket] Joined ticket room: ${ticketId}`);
}

// Leave ticket room
export function leaveTicketRoom(ticketId) {
  const socket = getTicketSocket();
  socket.emit('leave-ticket', { ticketId });
  console.log(`[ticket] Left ticket room: ${ticketId}`);
}

// Send typing indicator
export function sendTicketTyping(ticketId, isTyping) {
  const socket = getTicketSocket();
  socket.emit('ticket-typing', { ticketId, isTyping });
}
