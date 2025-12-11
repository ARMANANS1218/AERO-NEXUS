import React, { useState, useEffect, useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";

import MessageItem from "./MessageItem";
import { useGetConversationQuery, useSendMessageMutation } from "../../../../../features/chat/chatApi";
// import chatSocket from "../../sockets/chatSocket";

export default function MessageList({ currentUserId }) {
  const [text, setText] = useState("");
  const [liveMessages, setLiveMessages] = useState([]);
  const [currentDate, setCurrentDate] = useState("");

  const containerRef = useRef(null);

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const agentId = decoded?.id;

  const otherUserId = "687608347057ea1dfefa7de0" || null;
  const roomId = otherUserId ? [currentUserId, otherUserId].sort().join("_") : null;

  const { data: messagesData, isLoading } = useGetConversationQuery(otherUserId, {
    skip: !otherUserId,
  });

  const [sendMessage] = useSendMessageMutation();

  // ✅ Send message
  // const handleSend = async () => {
  //   if (!text.trim() || !otherUserId) return;

  //   const newMessage = {
  //     from: currentUserId,
  //     to: otherUserId,
  //     message: text.trim(),
  //     createdAt: new Date().toISOString(),
  //   };

  //   setLiveMessages((prev) => [...prev, newMessage]);
  //   setText("");

  //   chatSocket.emit("sendMessage", { roomId, message: newMessage });

  //   try {
  //     await sendMessage({ to: otherUserId, message: newMessage.message }).unwrap();
  //   } catch (err) {
  //     toast.error(err?.data?.message || "Send failed");
  //   }
  // };

  // ✅ Socket listeners
  // useEffect(() => {
  //   if (!roomId) return;

  //   chatSocket.emit("joinRoom", roomId);

  //   const handleReceiveMessage = (msg) => {
  //     setLiveMessages((prev) => [...prev, msg]);
  //   };

  //   chatSocket.on("receiveMessage", handleReceiveMessage);
  //   return () => chatSocket.off("receiveMessage", handleReceiveMessage);
  // }, [roomId]);

  // ✅ Merge messages
  const combinedMessages = useMemo(() => {
    const history = messagesData?.data?.flatMap((item) => item.messages || []) || [];
    return [...history, ...liveMessages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [messagesData, liveMessages]);

  // ✅ Detect current visible date
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const items = container.querySelectorAll("[data-date]");
      for (let item of items) {
        const rect = item.getBoundingClientRect();
        const containerTop = container.getBoundingClientRect().top;
        if (rect.top >= containerTop && rect.top <= containerTop + 50) {
          setCurrentDate(item.getAttribute("data-date"));
          break;
        }
      }
    };

    container.addEventListener("scroll", onScroll);
    onScroll(); // initialize on mount

    return () => container.removeEventListener("scroll", onScroll);
  }, [combinedMessages]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Fixed Current Date Header */}
      {currentDate && (
        <div className="sticky top-0 z-20 text-center py-2 bg-transparent">
          <span className="inline-block px-3 py-1 text-[10px] sm:text-xs bg-gray-300/90 dark:bg-slate-700/90 text-gray-900 dark:text-white rounded-full shadow-sm backdrop-blur-sm font-medium">
            {dayjs(currentDate).isSame(dayjs(), "day")
              ? "Today"
              : dayjs(currentDate).isSame(dayjs().subtract(1, "day"), "day")
              ? "Yesterday"
              : dayjs(currentDate).format("DD MMM YYYY")}
          </span>
        </div>
      )}

      {/* Scrollable Messages */}
      <div
        ref={containerRef}
        className="flex-1"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : combinedMessages.length > 0 ? (
          <div className="py-2 sm:py-3">
            {combinedMessages.map((msg, index) => {
              const messageDate = dayjs(msg.createdAt).format("YYYY-MM-DD");
              return (
                <div key={msg._id || `temp-${index}`} data-date={messageDate}>
                  <MessageItem msg={msg} currentUserId={currentUserId} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Typography variant="h3" className="text-gray-400 dark:text-gray-500">💬</Typography>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">No messages yet</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
