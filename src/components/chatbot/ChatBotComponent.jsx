import React, { useState, useRef, useEffect, useContext } from 'react';
import ColorModeContext from '../../context/ColorModeContext';
import { 
  Send, 
  SmartToy, 
  Close, 
  SupportAgent, 
  AutoAwesome,
  Phone,
  Email
} from '@mui/icons-material';
import { findBestResponse, quickReplies } from '../../utils/chatbotData';
import { useNavigate } from 'react-router-dom';

const ChatBotComponent = ({ onClose, onConnectToAgent }) => {
  const colorMode = useContext(ColorModeContext);
  const mode = colorMode?.mode || 'light';
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm EREN, your ChatCRM virtual assistant. I'm here to help you with any questions about our services, features, pricing, and more!\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = findBestResponse(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse.response,
        sender: 'bot',
        timestamp: new Date(),
        needsAgent: botResponse.needsAgent,
        category: botResponse.category
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    // Auto-send after a short delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleConnectToAgent = () => {
    const agentMessage = {
      id: Date.now(),
      text: "Great! I'm connecting you to a live agent now. Please wait a moment...",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, agentMessage]);
    
    setTimeout(() => {
      if (onConnectToAgent) {
        onConnectToAgent();
      } else {
        // Navigate to chat page for agent support
        navigate('/customer/chat');
      }
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex flex-col h-full ${mode === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`${mode === 'dark' ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white p-2 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
            <SmartToy className="text-2xl" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">EREN</h3>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online - Ready to help
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 p-2 rounded-full transition-colors"
          aria-label="Close chatbot"
        >
          <Close />
        </button>
      </div>

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-2 space-y-4 ${mode === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {message.sender === 'bot' && (
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                  <AutoAwesome className="text-sm text-blue-500" />
                  <span>EREN</span>
                </div>
              )}
              <div
                className={`p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? mode === 'dark'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-blue-500 text-white rounded-br-none'
                    : mode === 'dark'
                    ? 'bg-slate-700 text-gray-100 rounded-bl-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-md'
                }`}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
              
              {/* Connect to Agent Button */}
              {message.needsAgent && (
                <button
                  onClick={handleConnectToAgent}
                  className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-lg ${
                    mode === 'dark'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors text-sm font-medium shadow-md`}
                >
                  <SupportAgent className="text-lg" />
                  Connect to Live Agent
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-2xl rounded-bl-none ${mode === 'dark' ? 'bg-slate-700' : 'bg-white shadow-md'}`}>
              <div className="flex gap-1">
                <span className={`w-2 h-2 ${mode === 'dark' ? 'bg-gray-400' : 'bg-gray-600'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                <span className={`w-2 h-2 ${mode === 'dark' ? 'bg-gray-400' : 'bg-gray-600'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                <span className={`w-2 h-2 ${mode === 'dark' ? 'bg-gray-400' : 'bg-gray-600'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length === 1 && !isTyping && (
        <div className={`px-4 py-3 border-t ${mode === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
          <p className={`text-xs font-medium mb-2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Quick questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.slice(0, 4).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  mode === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contact Options */}
      <div className={`px-4 py-2 border-t ${mode === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-center gap-2 text-xs">
          <a 
            href="tel:+15551234567" 
            className={`flex items-center gap-1 ${mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <Phone className="text-sm" />
            <span>Call Us</span>
          </a>
          <span className={mode === 'dark' ? 'text-gray-600' : 'text-gray-400'}>|</span>
          <a 
            href="mailto:support@chatcrm.com" 
            className={`flex items-center gap-1 ${mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <Email className="text-sm" />
            <span>Email</span>
          </a>
          <span className={mode === 'dark' ? 'text-gray-600' : 'text-gray-400'}>|</span>
          <button 
            onClick={handleConnectToAgent}
            className={`flex items-center gap-1 ${mode === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} font-medium`}
          >
            <SupportAgent className="text-sm" />
            <span>Live Chat</span>
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-2 border-t ${mode === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className={`flex-1 px-4 py-2 rounded-full border ${
              mode === 'dark'
                ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className={`px-4 py-2 rounded-full ${
              inputMessage.trim()
                ? mode === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
                : mode === 'dark'
                ? 'bg-slate-700'
                : 'bg-gray-300'
            } text-white transition-colors disabled:cursor-not-allowed flex items-center justify-center shadow-md`}
            aria-label="Send message"
          >
            <Send className="text-lg" />
          </button>
        </div>
        <p className={`text-xs mt-2 text-center ${mode === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          Powered by EREN - ChatCRM AI Assistant
        </p>
      </div>
    </div>
  );
};

export default ChatBotComponent;
