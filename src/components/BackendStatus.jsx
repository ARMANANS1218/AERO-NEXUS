import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * Optional component to show backend health status
 * Can be added to login page or app layout
 */
export default function BackendStatus() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'waking' | 'offline'
  const [message, setMessage] = useState('Checking backend...');

  useEffect(() => {
    const checkBackend = async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/api/v1/user/health`, {
          signal: controller.signal,
          method: 'GET',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setStatus('online');
          setMessage('Backend is online');
        } else {
          setStatus('waking');
          setMessage('Backend is waking up...');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          setStatus('waking');
          setMessage('Backend is waking up (30-60s)...');
        } else {
          setStatus('offline');
          setMessage('Backend unavailable');
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  if (status === 'online') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
        <span className="text-green-700 dark:text-green-300">{message}</span>
      </div>
    );
  }

  if (status === 'waking') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
        <Clock size={16} className="text-yellow-600 dark:text-yellow-400 animate-pulse" />
        <span className="text-yellow-700 dark:text-yellow-300">{message}</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
        <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
        <span className="text-red-700 dark:text-red-300">{message}</span>
      </div>
    );
  }

  return null;
}
