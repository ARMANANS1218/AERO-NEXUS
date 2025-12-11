import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, Send, Paperclip, MoreVertical, Tag, Users as UsersIcon, ChevronRight, ChevronLeft, Mail, Phone, ExternalLink, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';

/**
 * ConversationDetail: Right pane showing conversation thread
 */
export default function ConversationDetail() {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [htmlMessage, setHtmlMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [replyMode, setReplyMode] = useState('reply'); // 'reply' or 'private-note'
  const [toEmail, setToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [fullscreenComposer, setFullscreenComposer] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [prevConversationsExpanded, setPrevConversationsExpanded] = useState(false);

  // Handle attachment downloads
  const handleDownload = (url, filename) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const org = localStorage.getItem('organizationId');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-organization-id': org,
      },
    };
  };

  const loadConversation = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/email-ticketing/tickets/${ticketId}`, getAuthHeaders());
      setTicket(res.data.ticket);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Prefill TO field once ticket is loaded
  useEffect(() => {
    if (ticket?.customerEmail) setToEmail(ticket.customerEmail);
  }, [ticket?.customerEmail]);

  useEffect(() => {
    loadConversation();
  }, [ticketId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && selectedFiles.length === 0) return;
    try {
      setSending(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role?.toLowerCase() || 'agent';
      
      const formData = new FormData();
      formData.append('ticketId', ticket.ticketId);
      formData.append('message', replyText);
      formData.append('html', htmlMessage || replyText);
      formData.append('senderType', role);
      
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });
      
      await axios.post(
        `${API_BASE_URL}/api/v1/email-ticketing/tickets/reply`,
        formData,
        {
          ...getAuthHeaders(),
          headers: {
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setReplyText('');
      setHtmlMessage('');
      setSelectedFiles([]);
      loadConversation();
      toast.success('Reply sent');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateHtmlContent();
  };

  const updateHtmlContent = () => {
    const editorEl = document.getElementById('reply-editor');
    if (editorEl) {
      setHtmlMessage(editorEl.innerHTML);
      setReplyText(editorEl.innerText);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isUnder10MB = file.size <= 10 * 1024 * 1024;
      return (isImage || isPdf) && isUnder10MB;
    });
    
    if (selectedFiles.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!ticketId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Select a conversation from the left panel.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Loading conversation...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Conversation not found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-white dark:bg-gray-950 h-full">
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{ticket.subject || '(no subject)'}</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {ticket.customerName || ticket.customerEmail} • {ticket.teamInbox || 'Support'}
            </p>
          </div>
          <button 
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title={rightPanelCollapsed ? 'Show details' : 'Hide details'}
          >
            {rightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Messages - Scrollable area (reduced padding to pull composer up) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 min-h-0">
        {messages.map((msg, idx) => {
          const isCustomer = msg.senderType === 'customer';
          return (
            <div key={msg._id} className="flex gap-2.5">
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 ${isCustomer ? 'bg-gradient-to-br from-purple-400 to-pink-500' : 'bg-gradient-to-br from-gray-500 to-gray-700'}`}>
                {isCustomer ? (ticket.customerName || ticket.customerEmail || 'C')[0].toUpperCase() : (msg.senderType || 'A')[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                    {isCustomer 
                      ? (msg.senderName || ticket.customerName || ticket.customerEmail)
                      : msg.sender?.name 
                        ? `${msg.sender.name} (${msg.senderType.charAt(0).toUpperCase() + msg.senderType.slice(1)})`
                        : msg.senderName || `Agent (${msg.senderType})`
                    }
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{formatTime(msg.createdAt)}</span>
                </div>
                <div 
                  className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: msg.html || msg.message || '(empty message)' }}
                />
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att, i) => (
                      <div
                        key={i}
                        onClick={() => handleDownload(att.url, att.filename)}
                        className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm cursor-pointer"
                      >
                        {att.contentType?.startsWith('image/') ? (
                          <img src={att.url} alt={att.filename} className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <Paperclip size={16} className="text-gray-500" />
                        )}
                        <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{att.filename}</span>
                        <span className="text-xs text-gray-500">{(att.size / 1024).toFixed(1)} KB</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Click to download</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

        {/* Reply Composer Section (responsive height; buttons remain visible) */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0 max-h-[40vh] md:max-h-[45vh] lg:max-h-[50vh] xl:max-h-[55vh] 2xl:max-h-[60vh] flex flex-col mb-16">
          <form onSubmit={handleSendReply} className="flex flex-col h-full">
            {/* Header: Reply/Private note tabs + Fullscreen toggle */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyMode('reply')}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    replyMode === 'reply' 
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => setReplyMode('private-note')}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    replyMode === 'private-note' 
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Private note
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenComposer((v) => !v)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                title={fullscreenComposer ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreenComposer ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            {/* Email Fields (TO/CC/BCC) - Only visible in reply mode */}
            {replyMode === 'reply' && (
              <div className="px-3 py-2 space-y-2 bg-white dark:bg-gray-950 flex-shrink-0">
                {/* TO field */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">TO:</label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                {/* CC field */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">CC:</label>
                  <input
                    type="text"
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    placeholder="Email addresses separated by comma"
                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBcc(!showBcc)}
                    className="px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    BCC
                  </button>
                </div>
                
                {/* BCC field - conditionally visible */}
                {showBcc && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">BCC:</label>
                    <input
                      type="text"
                      value={bccEmails}
                      onChange={(e) => setBccEmails(e.target.value)}
                      placeholder="Email addresses separated by comma"
                      className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Rich Text Toolbar */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => execCommand('bold')}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => execCommand('italic')}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => execCommand('underline')}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                title="Underline"
              >
                <u>U</u>
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
              <button
                type="button"
                onClick={() => execCommand('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => execCommand('insertOrderedList')}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                title="Numbered List"
              >
                1. List
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('file-upload').click()}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                title="Attach file (images & PDFs, max 10MB each, max 5 files)"
              >
                <Paperclip size={16} />
              </button>
            </div>

            {/* File Previews */}
            {selectedFiles.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs"
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <Paperclip size={14} className="text-gray-500" />
                    )}
                    <span className="max-w-[150px] truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Rich Text Editor */}
            <div className="px-3 py-2 pb-3 flex-1 min-h-0">
              <div className="relative">
                <div
                  id="reply-editor"
                  contentEditable
                  onInput={updateHtmlContent}
                  onBlur={updateHtmlContent}
                  className="w-full min-h-[100px] max-h-[200px] overflow-y-auto px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-placeholder={replyMode === 'reply' ? 'Write your reply...' : 'Add a private note...'}
                  style={{
                    minHeight: '100px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                />
                <style>{`
                  [contentEditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9CA3AF;
                    pointer-events: none;
                  }
                `}</style>
                {/* Send button */}
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || (!replyText.trim() && selectedFiles.length === 0)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded shadow"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fullscreen Composer Overlay */}
        {fullscreenComposer && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-950 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReplyMode('reply')}
                    className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${replyMode === 'reply' ? 'bg-gray-100 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-800'}`}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyMode('private-note')}
                    className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${replyMode === 'private-note' ? 'bg-gray-100 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-800'}`}
                  >
                    Private note
                  </button>
                </div>
                <button
                  onClick={() => setFullscreenComposer(false)}
                  className="p-1.5 rounded-md hover:bg-gray-800 text-gray-300"
                  title="Exit full screen"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                {/* Reuse the same form content */}
                <form onSubmit={handleSendReply} className="space-y-3">
                  <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
                    {replyMode === 'reply' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-gray-300 w-12">TO:</span>
                          <input
                            type="text"
                            value={toEmail}
                            onChange={(e) => setToEmail(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-md border border-gray-700 bg-transparent text-[13px] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-gray-300 w-12">CC:</span>
                          <input
                            type="text"
                            value={ccEmails}
                            onChange={(e) => setCcEmails(e.target.value)}
                            placeholder="Email addresses separated by comma"
                            className="flex-1 px-3 py-2 rounded-md border border-gray-700 bg-transparent text-[13px] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBcc((v) => !v)}
                            className="px-2 py-1 text-[12px] rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            BCC
                          </button>
                        </div>
                        {showBcc && (
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-gray-300 w-12">BCC:</span>
                            <input
                              type="text"
                              value={bccEmails}
                              onChange={(e) => setBccEmails(e.target.value)}
                              placeholder="Email addresses separated by comma"
                              className="flex-1 px-3 py-2 rounded-md border border-gray-700 bg-transparent text-[13px] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={replyMode === 'reply' ? 'Shift + Enter to add a new line. Ctrl + K to open command bar.' : 'Add a private note...'}
                      rows={10}
                      className="w-full min-h-[160px] max-h-[40vh] px-3 py-2 rounded-md border border-gray-700 bg-transparent text-[13px] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 resize-none overflow-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2 sticky bottom-0 bg-white dark:bg-gray-950 pt-2">
                    <button type="button" className="p-1.5 rounded-md hover:bg-gray-800 text-gray-300" title="Attach file">
                      <Paperclip size={16} />
                    </button>
                    <div className="flex-1" />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-100 border border-gray-700 rounded-md text-[13px] font-medium transition-colors"
                    >
                      <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar - Customer details */}
      {!rightPanelCollapsed && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full">
          {/* Customer info header */}
          <div className="h-12 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-end flex-shrink-0">
            <button 
              onClick={() => setRightPanelCollapsed(true)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              title="Hide details"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
          {/* Customer profile */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-800 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">
              {(ticket.customerName || ticket.customerEmail || 'C')[0].toUpperCase()}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {ticket.customerName || 'Unknown'} 
              <button className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <ExternalLink size={12} className="text-gray-500 dark:text-gray-400" />
              </button>
            </h3>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 mb-1">
              <Mail size={12} />
              <span>{ticket.customerEmail}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-500">
              <Phone size={12} />
              <span>Not available</span>
            </div>
          </div>

          {/* Actions section */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActionsExpanded(!actionsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span>Actions</span>
              <ChevronDown size={16} className={`transition-transform ${actionsExpanded ? '' : '-rotate-90'}`} />
            </button>
            {actionsExpanded && (
              <div className="px-4 pb-3 space-y-2">
                <select className="w-full px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400">
                  <option>Select agent</option>
                </select>
                <select className="w-full px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400">
                  <option>Select team</option>
                </select>
                <select className="w-full px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400">
                  <option>Select priority</option>
                </select>
                <input
                  type="text"
                  placeholder="Select tags"
                  className="w-full px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            )}
          </div>

          {/* Information section */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setInfoExpanded(!infoExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span>Information</span>
              <ChevronDown size={16} className={`transition-transform ${infoExpanded ? '' : '-rotate-90'}`} />
            </button>
          </div>

          {/* Previous conversations section */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setPrevConversationsExpanded(!prevConversationsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span>Previous conversations</span>
              <ChevronDown size={16} className={`transition-transform ${prevConversationsExpanded ? '' : '-rotate-90'}`} />
            </button>
            {prevConversationsExpanded && (
              <div className="px-4 pb-3 text-center text-[13px] text-gray-500 dark:text-gray-400">
                No previous conversations
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
