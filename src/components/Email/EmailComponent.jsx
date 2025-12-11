import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Mail as MailIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  X as XIcon,
  Loader as LoaderIcon,
  Search as SearchIcon,
  Trash2 as Trash2Icon,
  Bell as BellIcon,
  Menu as MenuIcon,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useSendEmailMutation, useDeleteEmailMutation, useMarkEmailAsReadMutation, useGetTicketEmailsQuery } from '../../features/email/emailApi';
import useEmailSocket from '../../hooks/useEmailSocket';

const EmailComponent = ({ ticketId = null, customerEmail = '', ticketSubject = '' }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [openCompose, setOpenCompose] = useState(false);
  const [emailTo, setEmailTo] = useState(customerEmail || '');
  const [subject, setSubject] = useState(ticketSubject ? `Re: ${ticketSubject}` : '');
  const [body, setBody] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localEmails, setLocalEmails] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Get current user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, []);

  // Dark mode detection
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // RTK Query hooks
  const [sendEmail, { isLoading: isSending }] = useSendEmailMutation();
  const { data: emailsData, isLoading: emailsLoading, refetch } = useGetTicketEmailsQuery(ticketId, { skip: !ticketId });
  const [markAsRead] = useMarkEmailAsReadMutation();
  const [deleteEmail] = useDeleteEmailMutation();

  // Socket.IO integration
  const { emails: socketEmails, newEmailNotification, isConnected, sendEmail: socketSendEmail } = useEmailSocket(currentUser?.id);

  // Combine emails
  const allEmails = ticketId ? (emailsData?.data || []) : [...localEmails, ...socketEmails];
  const emails = Array.from(new Map(allEmails.map(e => [e._id, e])).values());

  const filteredEmails = emails.filter(email =>
    email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.senderEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = emails.filter(e => e.type === 'incoming' && e.status !== 'read').length;

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSendEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTo)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }
    if (!body.trim()) {
      toast.error('Please enter an email body');
      return;
    }

    try {
      const payload = {
        to: emailTo,
        recipientEmail: emailTo,
        subject: subject.trim(),
        body: body.trim(),
        ...(ticketId && { ticketId })
      };
      await sendEmail(payload).unwrap();

      if (isConnected && currentUser?.email) {
        socketSendEmail({ from: currentUser.email, to: emailTo, subject: subject.trim(), body: body.trim(), ticketId });
      }

      toast.success('✅ Email sent successfully!');

      const newEmail = {
        _id: Date.now().toString(),
        senderEmail: currentUser?.email || 'you@company.com',
        recipientEmail: emailTo,
        subject,
        body,
        type: 'outgoing',
        status: 'sent',
        createdAt: new Date(),
      };
      setLocalEmails([newEmail, ...localEmails]);

      setOpenCompose(false);
      setBody('');
      setSubject(ticketSubject ? `Re: ${ticketSubject}` : '');
      setEmailTo(customerEmail || '');

      if (ticketId && refetch) refetch();
    } catch (error) {
      console.error('Email send error:', error);
      toast.error(error.data?.message || 'Failed to send email');
    }
  };

  const handleEmailClick = async (email) => {
    setSelectedEmail(email);
    if (email.type === 'incoming' && email.status !== 'read') {
      try {
        await markAsRead({ emailId: email._id }).unwrap();
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    }
  };

  const handleDeleteEmail = async (emailId) => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      try {
        await deleteEmail({ emailId }).unwrap();
        toast.success('✅ Email deleted successfully!');
        setLocalEmails(localEmails.filter(e => e._id !== emailId));
        setSelectedEmail(null);
        if (ticketId && refetch) refetch();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete email');
      }
    }
  };

  const bg = {
    primary: darkMode ? 'bg-slate-800' : 'bg-white',
    secondary: darkMode ? 'bg-slate-700' : 'bg-slate-50',
    tertiary: darkMode ? 'bg-slate-900/50' : 'bg-slate-100',
    hover: darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-100',
  };

  const text = {
    primary: darkMode ? 'text-white' : 'text-slate-900',
    secondary: darkMode ? 'text-slate-300' : 'text-slate-700',
    tertiary: darkMode ? 'text-slate-400' : 'text-slate-600',
  };

  const border = {
    primary: darkMode ? 'border-slate-700' : 'border-slate-200',
    secondary: darkMode ? 'border-slate-600' : 'border-slate-300',
  };

  const navigate = useNavigate();

  return (
    <div className={`w-full h-screen flex flex-col overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Notifications */}
      {newEmailNotification && (
        <div className={`mx-2 sm:mx-4 mt-2 p-3 sm:p-2 ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-100 border-green-300'} border rounded-lg flex items-center gap-2 sm:gap-3 animate-pulse text-xs sm:text-sm`}>
          <BellIcon size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
              New Email: {newEmailNotification.subject}
            </p>
            <p className={`text-xs truncate ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
              From: {newEmailNotification.from}
            </p>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className={`mx-2 sm:mx-4 mt-2 px-3 py-2 text-xs ${darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'} rounded-lg`}>
          ⚠️ Real-time notifications: connecting...
        </div>
      )}

      {/* Search Bar with Compose Button - Merged Headers */}
      <div className={`${bg.secondary} border-b ${border.primary} px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2`}>
        <SearchIcon size={16} className={`${text.tertiary} flex-shrink-0`} />
        <input
          type="text"
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-3 py-2 text-sm ${bg.primary} border ${border.primary} rounded-lg ${text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {unreadCount > 0 && (
          <span className={`px-2 py-1 text-xs font-semibold flex-shrink-0 ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'} rounded-full`}>
            {unreadCount}
          </span>
        )}
        <button
          onClick={() => setOpenCompose(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0"
        >
          <SendIcon size={14} />
          <span className="hidden sm:inline">Compose</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List - Full width on mobile, sidebar on desktop */}
        <div className={`w-full md:w-96 ${bg.primary} border-r ${border.primary} flex flex-col overflow-hidden ${selectedEmail && 'hidden md:flex'}`}>
          {/* Email List */}
          <div className="flex-1 overflow-y-auto space-y-2 p-2 sm:p-3">
            {emailsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <LoaderIcon size={24} className="text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" />
                  <p className={`text-xs sm:text-sm ${text.tertiary}`}>Loading emails...</p>
                </div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MailIcon size={32} className={`${text.tertiary} mx-auto mb-2`} />
                  <p className={`text-xs sm:text-sm font-medium ${text.secondary}`}>{searchTerm ? 'No emails found' : 'No emails yet'}</p>
                  <p className={`text-xs ${text.tertiary} mt-1`}>
                    {searchTerm ? 'Try a different search term' : 'Click "Compose" to send your first email'}
                  </p>
                </div>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email._id}
                  onClick={() => handleEmailClick(email)}
                  className={`p-2.5 sm:p-3 ${bg.secondary} border-l-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    email.type === 'incoming' ? 'border-l-blue-500' : 'border-l-green-500'
                  } ${email.status !== 'read' && email.type === 'incoming' ? (darkMode ? 'bg-slate-700/70' : 'bg-blue-50') : ''} ${selectedEmail?._id === email._id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      email.type === 'incoming'
                        ? darkMode
                          ? 'bg-cyan-900/30 text-cyan-400'
                          : 'bg-cyan-100 text-cyan-700'
                        : darkMode
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {email.type === 'incoming' ? '📨' : '📤'}
                    </span>
                    {email.status === 'read' && email.type === 'incoming' && (
                      <CheckCircleIcon size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs whitespace-nowrap flex-shrink-0 ${text.tertiary}`}>{formatDate(email.createdAt)}</span>
                  </div>
                  <h3 className={`font-semibold text-sm ${text.primary} truncate`}>{email.subject || '(No Subject)'}</h3>
                  <p className={`text-xs ${text.tertiary} truncate mt-0.5`}>
                    {email.type === 'incoming' ? email.senderEmail : email.recipientEmail}
                  </p>
                  <p className={`text-xs ${text.secondary} line-clamp-1 mt-1`}>{email.body?.substring(0, 80) || '(No Content)'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail - Full width on mobile when selected, right panel on desktop */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`${bg.secondary} border-b ${border.primary} px-3 sm:px-6 py-3 flex items-center justify-between flex-shrink-0`}>
              <h3 className={`text-sm sm:text-base font-bold ${text.primary} flex-1 pr-4 truncate`}>
                {selectedEmail.subject || '(No Subject)'}
              </h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className={`p-1.5 sm:p-2 flex-shrink-0 ${bg.hover} rounded-lg transition-colors`}
              >
                <XIcon size={18} className={text.secondary} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 pb-4 border-b ${border.primary}`}>
                <div>
                  <p className={`text-xs font-semibold ${text.tertiary} uppercase mb-1`}>From</p>
                  <p className={`text-xs sm:text-sm font-medium ${text.primary} break-all`}>{selectedEmail.senderEmail}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold ${text.tertiary} uppercase mb-1`}>To</p>
                  <p className={`text-xs sm:text-sm font-medium ${text.primary} break-all`}>{selectedEmail.recipientEmail}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className={`text-xs font-semibold ${text.tertiary} uppercase mb-1`}>Date</p>
                  <p className={`text-xs sm:text-sm font-medium ${text.primary}`}>{formatDate(selectedEmail.createdAt)}</p>
                </div>
              </div>

              <div className={`p-3 sm:p-2 ${bg.tertiary} border ${border.primary} rounded-lg`}>
                <p className={`text-xs sm:text-sm ${text.secondary} whitespace-pre-wrap leading-relaxed`}>
                  {selectedEmail.body || '(No Content)'}
                </p>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-2 p-3 sm:p-6 ${bg.secondary} border-t ${border.primary} flex-shrink-0`}>
              <button
                onClick={() => handleDeleteEmail(selectedEmail._id)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                  darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                } rounded-lg font-medium transition-colors`}
              >
                <Trash2Icon size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <div className="flex-1 hidden sm:block" />
              <button
                onClick={() => {
                  setEmailTo(selectedEmail.type === 'incoming' ? selectedEmail.senderEmail : selectedEmail.recipientEmail);
                  setSubject(`Re: ${selectedEmail.subject}`);
                  setBody(`\n\n------\nOriginal email:\n${selectedEmail.body}`);
                  setOpenCompose(true);
                  setSelectedEmail(null);
                }}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
              >
                <ReplyIcon size={16} />
                <span className="hidden sm:inline">Reply</span>
                <span className="sm:hidden">↩️</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <MailIcon size={48} className={`${text.tertiary} mx-auto mb-4 opacity-50`} />
              <p className={`text-sm font-medium ${text.secondary}`}>Select an email to view</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {openCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-2 bg-black/50 backdrop-blur-sm">
          <div className={`${bg.primary} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col`}>
            <div className={`flex items-center justify-between p-2 sm:p-6 bg-gradient-to-r ${
              darkMode ? 'from-slate-700 to-slate-800' : 'from-blue-50 to-blue-100'
            } border-b ${border.primary} sticky top-0`}>
              <h3 className={`text-base sm:text-lg font-bold ${text.primary}`}>Compose Email</h3>
              <button
                onClick={() => {
                  setOpenCompose(false);
                  setBody('');
                  setSubject(ticketSubject ? `Re: ${ticketSubject}` : '');
                }}
                className={`p-1.5 sm:p-2 ${bg.hover} rounded-lg transition-colors`}
              >
                <XIcon size={18} className={text.secondary} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-4">
              <div>
                <label className={`block text-xs sm:text-sm font-semibold ${text.primary} mb-2`}>From</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm ${bg.tertiary} border ${border.primary} rounded-lg ${text.primary} opacity-70 cursor-not-allowed`}
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold ${text.primary} mb-2`}>To</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="Enter recipient email..."
                  className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm ${bg.tertiary} border ${border.primary} rounded-lg ${text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p className={`text-xs ${text.tertiary} mt-1`}>💌 Send to Customer, Agent, or QA</p>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold ${text.primary} mb-2`}>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm ${bg.tertiary} border ${border.primary} rounded-lg ${text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold ${text.primary} mb-2`}>Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email message here..."
                  rows={8}
                  className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm ${bg.tertiary} border ${border.primary} rounded-lg ${text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                />
              </div>

              <div className={`text-xs p-2 sm:p-3 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'} rounded`}>
                {isConnected ? '✅ Real-time notifications enabled' : '⚠️ Real-time notifications disabled'}
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 sm:p-6 ${bg.secondary} border-t ${border.primary} sticky bottom-0`}>
              <button
                onClick={() => {
                  setOpenCompose(false);
                  setBody('');
                  setSubject(ticketSubject ? `Re: ${ticketSubject}` : '');
                  setEmailTo(customerEmail || '');
                }}
                className={`px-4 py-2 text-xs sm:text-sm ${text.secondary} ${bg.hover} rounded-lg font-medium transition-colors`}
              >
                Cancel
              </button>
              <div className="flex-1 hidden sm:block" />
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                {isSending ? (
                  <>
                    <LoaderIcon size={16} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <SendIcon size={16} />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email feature modal removed; feature enabled */}
    </div>
  );
};

export default EmailComponent;

  