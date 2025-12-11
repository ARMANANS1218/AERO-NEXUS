import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";

import { format } from "date-fns";
import { useGetConversationQuery, useSendMessageMutation } from "../../../../features/chat/chatApi";
import { IMG_PROFILE_URL } from "../../../../config/api";

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  // const [messages, setMessages] = useState([]);
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const messagesEndRef = useRef(null);

  const otherUserId ="6874a8cb31314c471dabe751";
  const { data: messagesData, isLoading: loadingMessages } = useGetConversationQuery(otherUserId, {
    skip: !otherUserId,
  });
  const messages = messagesData?.data?.messages || [];
  const conversationId = messagesData?.data?._id;
  // ✅ Send message
  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      const res = await sendMessage({ conversationId, message }).unwrap();
      setMessage(res.data.messages);
      setMessage("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send message");
    }
  };

  // ✅ Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Format timestamp
  const formatTime = useCallback((date) => format(new Date(date), "hh:mm a"), []);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg flex flex-col h-full">
      {/* ✅ Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-2 md:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-800">
        <Avatar 
          src={`${IMG_PROFILE_URL}/${messages?.profileImage || "default.png"}`}
          sx={{ 
            width: { xs: 40, sm: 48, md: 56 }, 
            height: { xs: 40, sm: 48, md: 56 },
            border: '2px solid',
            borderColor: 'primary.main'
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
            {messages?.name || "Customer"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
            {messages?.email} • {messages?.mobile}
          </p>
        </div>
      </div>

      {/* ✅ Messages Section */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-2 md:p-6 flex flex-col gap-2 sm:gap-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent bg-gray-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Typography variant="h3" className="text-blue-600 dark:text-blue-400">👋</Typography>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
              Say hello!
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start your conversation here
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCustomer = msg.senderRole === "customer";

            return (
              <div
                key={index}
                className={`flex gap-2 items-end ${
                  isCustomer ? 'flex-row' : 'flex-row-reverse'
                } animate-fadeIn`}
              >
                {/* Avatar */}
                <Avatar
                  src={
                    isCustomer
                      ? `${IMG_PROFILE_URL}/${messages?.profileImage || "default.png"}`
                      : `${IMG_PROFILE_URL}/agent-avatar.png`
                  }
                  sx={{ 
                    width: { xs: 28, sm: 32, md: 36 }, 
                    height: { xs: 28, sm: 32, md: 36 }
                  }}
                />

                {/* Message Bubble */}
                <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl max-w-[75%] sm:max-w-[70%] md:max-w-[65%] shadow-sm ${
                  isCustomer 
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm' 
                    : 'bg-blue-600 dark:bg-blue-500 text-white rounded-br-sm'
                }`}>
                  <p className="text-xs sm:text-sm md:text-base break-words leading-relaxed">{msg.message}</p>
                  <p className={`text-[9px] sm:text-[10px] text-right mt-1 ${
                    isCustomer ? 'text-gray-600 dark:text-gray-400' : 'text-blue-100'
                  }`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700" />

      {/* ✅ Input Section */}
      <div className="flex gap-2 sm:gap-3 p-3 sm:p-2 md:p-5 bg-white dark:bg-slate-800">
        <input
          type="text"
          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base border border-gray-300 dark:border-slate-600 rounded-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm md:text-base font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
