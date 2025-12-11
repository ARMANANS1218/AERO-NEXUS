import React, { useState } from "react";
import {
  Paper,
  Grid,
  Stack,
  Avatar,
  Typography,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  TextField,
  IconButton
} from "@mui/material";
import { Forum, Email, Call, Send } from "@mui/icons-material";
import { useGetConversationQuery, useSendMessageMutation } from "../../../../features/chat/chatApi";
// import { getSockets } from "../../sockets/messageSocket";
import { getSocket } from "../../../../hooks/socket";
import { toast } from "react-toastify";
// import VideoCallModal from "../../../../components/common/VideoCallModal";
import MessageList from "./messages/MessageList";
import CallList from "../CallList";
import ChatWindow from "./ChatWindow";

export default function ChatBot({ currentUserId }) {
  const [value, setValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState("687608347057ea1dfefa7de0"); // For now, hardcoded for testing
  const [text, setText] = useState("");
  const [liveMessages, setLiveMessages] = useState([]);

  const { data: messagesData, isLoading: loadingMessages } = useGetConversationQuery();
  const [sendMessage] = useSendMessageMutation();

  const socket = getSocket();

  // const handleTyping = (val) => {
  //   const { presenceSocket } = getSockets();
  //   if (presenceSocket && targetUserId) {
  //     presenceSocket.emit(val ? "start-typing" : "stop-typing", { toUserId: targetUserId });
  //   }
  // };

  const handleSend = async () => {
    if (!text.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!targetUserId) {
      toast.error("No recipient selected");
      return;
    }

    // const { chatSocket } = getSockets();
    const roomId = [currentUserId, targetUserId].sort().join("_");
    const newMessage = {
      from: currentUserId,
      to: targetUserId,
      message: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // Emit to socket
    if (socket) {
      socket.emit("sendMessage", { message: newMessage });
    }

    // Optimistic UI
    setLiveMessages((prev) => [...prev, newMessage]);
    setText("");

    try {
      await sendMessage({ to: targetUserId, message: text.trim() }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || "Send failed");
    }
  };

  const conversationId = "12345";

  return (
    <div className="h-[calc(100vh-64px)] w-full max-w-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-2 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
        <Avatar 
          sx={{ 
            width: { xs: 36, sm: 44, md: 48 }, 
            height: { xs: 36, sm: 44, md: 48 },
            bgcolor: 'primary.main'
          }}
        >
          AB
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
            Support Agent
          </h3>
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 truncate flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Online
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {value === 0 && (
          <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent px-2 sm:px-4 md:px-6 py-3 sm:py-4">
              <MessageList
                messages={[...(messagesData?.data || []), ...liveMessages]}
                loading={loadingMessages}
                currentUserId={currentUserId}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-2 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-lg shrink-0">
              <input
                type="text"
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <IconButton 
                onClick={handleSend} 
                disabled={!text.trim()}
                size="medium"
                sx={{ 
                  bgcolor: text.trim() ? 'primary.main' : 'grey.300',
                  color: text.trim() ? 'white' : 'grey.500',
                  '&:hover': {
                    bgcolor: text.trim() ? 'primary.dark' : 'grey.400'
                  },
                  '&:disabled': { 
                    bgcolor: 'grey.300',
                    color: 'grey.500'
                  },
                  width: { xs: 36, sm: 40, md: 44 },
                  height: { xs: 36, sm: 40, md: 44 }
                }}
              >
                <Send fontSize="small" />  
              </IconButton>
            </div>
          </div>
        )}

        {value === 1 && (
          <div className="h-full overflow-y-auto bg-white dark:bg-slate-800 px-2 sm:px-4 md:px-6 py-3 sm:py-4">
            {!conversationId ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Email sx={{ fontSize: { xs: 60, sm: 80, md: 100 }, color: 'text.secondary', mb: 2 }} />
                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 text-center">
                  Start a conversation via email
                </p>
              </div>
            ) : (
              <ChatWindow conversationId={conversationId} />
            )}
          </div>
        )}

        {value === 2 && (
          <div className="h-full overflow-y-auto bg-white dark:bg-slate-800">
            <CallList currentUserId={currentUserId} />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {/* <div className="bg-white dark:bg-slate-800 flex items-center justify-around border-t border-gray-200 dark:border-slate-700 shadow-lg shrink-0 py-2 sm:py-2.5 md:py-3 px-2">
        <button
          onClick={() => setValue(0)}
          className={`flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 transition-all duration-200 rounded-lg min-w-0 ${
            value === 0 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Forum sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
          <span className="text-[10px] sm:text-xs md:text-sm mt-0.5 font-medium">Chat</span>
        </button>
        <button
          onClick={() => setValue(1)}
          className={`flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 transition-all duration-200 rounded-lg min-w-0 ${
            value === 1 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Email sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
          <span className="text-[10px] sm:text-xs md:text-sm mt-0.5 font-medium">Email</span>
        </button>
        <button
          onClick={() => setValue(2)}
          className={`flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 transition-all duration-200 rounded-lg min-w-0 ${
            value === 2 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Call sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
          <span className="text-[10px] sm:text-xs md:text-sm mt-0.5 font-medium">Calls</span>
        </button>
      </div> */}
    </div>
  
  );
}
