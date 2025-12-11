import React, { useState } from 'react';
import { X, Send, Mail, User, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * TicketRaiseWidget: Embedded widget component for customers to raise tickets
 * Only for registered users (requires authentication)
 */
export default function TicketRaiseWidget({ apiKey, user, onTicketCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Support');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to raise a ticket');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        channel: 'internal',
        title: subject,
        description: message,
        customerEmail: user.email,
        customerName: user.name || user.user_name,
        teamInbox: category,
        createdBy: user._id,
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await axios.post(
        `${API_URL}/api/v1/email-ticketing/tickets/create`,
        payload,
        { headers }
      );

      toast.success(`Ticket created: ${res.data.ticket.ticketId}`);
      
      // Reset form
      setSubject('');
      setMessage('');
      setCategory('Support');
      setIsOpen(false);

      if (onTicketCreated) {
        onTicketCreated(res.data.ticket);
      }
    } catch (error) {
      console.error('Ticket creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null; // Don't show widget if user is not logged in
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 z-50 group"
          title="Raise a Ticket"
        >
          <Mail size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Ticket form modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] bg-white dark:bg-gray-950 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Mail size={20} />
              <h3 className="font-semibold text-sm">Raise a Support Ticket</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <User size={12} />
              <span>{user.name || user.user_name} ({user.email})</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Support">Support</option>
                  <option value="Sales">Sales</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Billing">Billing</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
