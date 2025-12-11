import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { getSocket, connectSocket } from '../../hooks/socket';
import { useGetProfileQuery } from '../../features/auth/authApi';
import { toast } from 'react-toastify';

/**
 * Global incoming-call listener for Customers.
 * Shows a small popup on any page when an Agent/QA initiates a call.
 */
export default function IncomingCallListener() {
  const navigate = useNavigate();
  const socket = getSocket();
  const { data: profileRes } = useGetProfileQuery();
  const user = profileRes?.data;
  const ringToneRef = useRef(null);

  const [incoming, setIncoming] = useState(null); // { roomId, callType, from }

  useEffect(() => {
    // Only for customers
    if (!socket || user?.role !== 'Customer') return;

    const handleIncoming = ({ roomId, from, callType }) => {
      // Prevent duplicates
      if (!roomId) return;
      setIncoming((prev) => {
        if (prev?.roomId === roomId) return prev;
        return { roomId, from, callType: callType || 'video' };
      });
      // Ring tone will play via useEffect when popup becomes visible
    };

    const handleEnded = () => {
      setIncoming(null);
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
      }
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:ended', handleEnded);
    };
  }, [socket, user?.role]);

  // Stop ring tone on unmount
  useEffect(() => {
    return () => {
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
      }
    };
  }, []);

  // Play ring tone only when popup is visible (incoming call)
  useEffect(() => {
    if (incoming && ringToneRef.current) {
      ringToneRef.current.loop = true;
      ringToneRef.current.play().catch(() => {});
    } else if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }
  }, [incoming]);

  if (!incoming) return null;

  const accept = () => {
    // Stop ring tone
    if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }
    let s = getSocket();
    if (!s) {
      s = connectSocket();
    }
    try {
      s?.emit('call:accept', { roomId: incoming.roomId });
    } catch {}
    const params = new URLSearchParams({
      roomId: incoming.roomId,
      type: incoming.callType || 'video',
      userName: incoming.from || 'Agent', // Use actual caller name instead of hardcoded 'Agent'
      initiator: 'false',
    });
    navigate(`/video-call?${params.toString()}`);
    setIncoming(null);
  };

  const reject = () => {
    // Stop ring tone
    if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }
    const s = getSocket() || connectSocket();
    try { s?.emit('call:reject', { roomId: incoming.roomId }); } catch {}
    setIncoming(null);
  };

  const isVideo = (incoming.callType || 'video') === 'video';

  // Centered modal overlay
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2">
      {/* Ring Tone Audio */}
      <audio ref={ringToneRef} src="/ringing.mp3" preload="auto" />
      
      <div className="w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="p-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4">
            {isVideo ? <Video size={36} /> : <Mic size={36} />}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Incoming {isVideo ? 'Video' : 'Audio'} Call
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {incoming.from || 'Support Agent'} is calling you...
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={reject}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              <PhoneOff size={18} /> Decline
            </button>
            <button
              onClick={accept}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700"
            >
              <Phone size={18} /> Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
