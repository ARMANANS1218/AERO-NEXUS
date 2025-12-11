import { useRef, useState, useMemo, useEffect } from "react";
import {
  Avatar, CircularProgress, useTheme
} from "@mui/material";
import {
  Search, Send, Videocam, Call,
} from "@mui/icons-material";
import { useGetConversationQuery, useSendMessageMutation } from "../../features/chat/chatApi";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useCreateCallMutation
} from "../../features/room/roomApi";
import renderTime from "../../utils/renderTime";
import ChatMessage from "./ChatMessage";
import ChatSkeleton from "../../components/reusbale/SkeltonCard";
import { useGetAllCustomerQuery } from "../../features/auth/authApi";
import Profile from "../../pages/private/profile/Profile";
import StyledBadge from "../../components/common/StyledBadge";
import useWebRTC from "../../hooks/webRtc";
import { getSocket } from "../../hooks/socket";
import CallModal from "../../components/call/CallModal";
import { IMG_PROFILE_URL } from "../../config/api";

const Chat = ({ currentUserId }) => {
  const theme = useTheme();
  const agentId = "687608347057ea1dfefa7de0";
  const customerId = "68aa9e4a4e61ea8cf8705a21";

  const [inCall, setInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const [liveMessages, setLiveMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  const [openVideoCallModal, setOpenVideoCallModal] = useState(false);
  const [openAudioCallModal, setOpenAudioCallModal] = useState(false);

  const timerRef = useRef(null);
  const socket = getSocket();
  const containerRef = useRef(null);

  const [createCall] = useCreateCallMutation();

  const { data: customerData } = useGetAllCustomerQuery();
  const customers = customerData?.data || [];

  const [sendMessage] = useSendMessageMutation();
  const { data: messagesData, isLoading: loadingMessages } = useGetConversationQuery(
    selectedUser?._id,
    { skip: !selectedUser }
  );

  
  // WebRTC hooks
  const {
    localMediaRef: localVideoRef,
    remoteMediaRef: remoteVideoRef,
    startCall: startVideoCall,
    endCall: endVideoCall,
    toggleVideo: toggleVideoTrack,
    toggleAudio: toggleAudioTrack,
  } = useWebRTC(roomId, { audio: true, video: true });

  const {
    localMediaRef: localAudioRef,
    remoteMediaRef: remoteAudioRef,
    startCall: startAudioCall,
    endCall: endAudioCall,
    toggleAudio: toggleAudioOnlyTrack,
  } = useWebRTC(roomId, { audio: true, video: false });
  
  // console.log("localAudioRef", localAudioRef)
  // console.log("remoteAudioRef", remoteAudioRef)
  // console.log("localVideoRef", localVideoRef)
  // console.log("remoteVideoRef", remoteVideoRef)
  // Messages
  const handleSend = async () => {
    if (!text.trim() || !selectedUser?._id) return;
    const msg = {
      from: currentUserId,
      to: selectedUser._id,
      message: text.trim(),
      createdAt: new Date().toISOString(),
      _id: "temp-" + Date.now(),
    };
    setLiveMessages((prev) => [...prev, msg]);
    setText("");
    socket.emit("sendMessage", msg);
    try {
      await sendMessage({ to: selectedUser._id, message: msg.message }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || "Send failed");
    }
  };

  const combinedMessages = useMemo(() => {
    const history = messagesData?.data?.flatMap((i) => i.messages || []) || [];
    return [...history, ...liveMessages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [messagesData, liveMessages]);

  // Call flow
  const handleVideoCall = async () => {
    setIsCalling(true);
    try {
      const res = await createCall({ receiverId: customerId }).unwrap();
      const backendRoomId = res?.data?.roomId;
      console.log("backendRoomId", backendRoomId);
      setRoomId(backendRoomId);
      socket.emit("call:init", { roomId: backendRoomId, from: agentId, receiverId: customerId, callType: "video" });
      await startVideoCall();
      setOpenVideoCallModal(true);
      
    } catch (err) {
      toast.error("Failed to start call");
    } finally {
      setIsCalling(false);
    }
  };

  const handleAudioCall = async () => {
    setIsCalling(true);
    try {
      const res = await createCall({ receiverId: customerId }).unwrap();
      const backendRoomId = res?.data?.roomId;
      setRoomId(backendRoomId);
      socket.emit("call:init", { roomId: backendRoomId, from: agentId, receiverId: customerId, callType: "audio" });
      await startAudioCall();
      setOpenAudioCallModal(true);
      
    } catch (err) {
      toast.error("Failed to start call");
    } finally {
      setIsCalling(false);
    }
  };

  const handleStopCall = () => {
    if (roomId) socket.emit("call:end", { roomId });
    endVideoCall();
    endAudioCall();
    cleanupCallUI();
  };

  const cleanupCallUI = () => {
    clearInterval(timerRef.current);
    setInCall(false);
    setRoomId(null);
    setCallTimer(0);
    setMuted(false);
    setVideoOff(false);
  };

  // Socket listeners for call flow
  useEffect(() => {
    if (!socket) return;
    const onAccepted = async ({ callType }) => {
      if (callType === "video") await startVideoCall();
      if (callType === "audio") await startAudioCall();
      setInCall(true);
    };
    const onRejected = () => {
      toast.info("Call rejected");
      cleanupCallUI();
    };
    const onEnded = () => {
      toast.info("Call ended");
      handleStopCall();
    };
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);
    return () => {
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
    };
  }, [socket, roomId, startVideoCall, startAudioCall]);

  // Timer
  useEffect(() => {
    if (inCall) {
      setCallTimer(0);
      timerRef.current = setInterval(() => setCallTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [inCall]);

  // Mute/video toggle
  const toggleMute = () => {
    const isMuted = openVideoCallModal ? toggleAudioTrack() : toggleAudioOnlyTrack();
    setMuted(isMuted);
  };

  const toggleVideo = () => {
    if (!openVideoCallModal) return; // Only for video calls
    const isCameraOff = toggleVideoTrack();
    setVideoOff(isCameraOff);
  };

  // Track current date while scrolling
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
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [combinedMessages]);

  const filteredCustomers = useMemo(() => {
    return customers?.filter(
      (user) =>
        user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  return (
    <>
      <div className="h-screen w-full fixed top-0 left-0 bg-gray-50 dark:bg-slate-900">
        <div className="grid grid-cols-12 gap-0 h-full">
          {/* Left Panel - User List */}
          <div className="col-span-12 md:col-span-3 h-full border-r border-gray-200 dark:border-slate-700">
            <div className="h-full flex flex-col p-2 bg-white dark:bg-slate-800">
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
              
              {/* User List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredCustomers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedUser?._id === user._id
                        ? 'bg-blue-100 dark:bg-slate-600 shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <StyledBadge variant={user?.is_active ? "dot" : "none"}>
                          <Avatar src={`${IMG_PROFILE_URL}/${user.profileImage}`} />
                        </StyledBadge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Chat */}
          <div className="col-span-12 md:col-span-6 h-full border-r border-gray-200 dark:border-slate-700">
            <div className="h-full flex flex-col bg-white dark:bg-slate-800">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <StyledBadge variant={selectedUser?.is_active ? "dot" : "none"}>
                        <Avatar src={`${IMG_PROFILE_URL}/${selectedUser?.profileImage}`} />
                      </StyledBadge>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedUser.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isTyping ? "typing..." : `Last seen: ${renderTime(selectedUser.createdAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAudioCall}
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Call className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleVideoCall}
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Videocam className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 relative overflow-hidden">
                    {currentDate && (
                      <div className="sticky top-0 z-20 text-center pt-2">
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200">
                          {dayjs(currentDate).isSame(dayjs(), "day")
                            ? "Today"
                            : dayjs(currentDate).isSame(dayjs().subtract(1, "day"), "day")
                              ? "Yesterday"
                              : dayjs(currentDate).format("DD MMM YYYY")}
                        </span>
                      </div>
                    )}
                    <div
                      ref={containerRef}
                      className="h-full overflow-y-auto p-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
                    >
                      {loadingMessages ? (
                        <ChatSkeleton />
                      ) : combinedMessages.length > 0 ? (
                        combinedMessages.map((msg, index) => {
                          const messageDate = dayjs(msg.createdAt).format("YYYY-MM-DD");
                          return (
                            <div key={msg._id || `temp-${index}`} data-date={messageDate}>
                              <ChatMessage msg={msg} selectedUser={selectedUser} />
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400">
                              No messages yet. Start a conversation!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className={`p-2 rounded-lg transition-colors ${
                          text.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                      <Search className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                      Select a user to start chatting
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Choose from the list on the left
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Profile */}
          <div className="col-span-12 md:col-span-3 h-full">
            <div className="h-full bg-white dark:bg-slate-800 overflow-auto">
              <Profile />
            </div>
          </div>
        </div>
      </div>

      {/* Audio Call Modal */}
      <CallModal
        open={openAudioCallModal}
        onClose={() => setOpenAudioCallModal(false)}
        callType="audio"
        username={selectedUser?.name}
        isRinging={!inCall}
        ringingType="outgoing"
        localRef={localAudioRef}
        remoteRef={remoteAudioRef}
        callTimer={callTimer}
        muted={muted}
        toggleMute={toggleMute}
        endCall={handleStopCall}
      />

      {/* Video Call Modal */}
      <CallModal
        open={openVideoCallModal}
        onClose={() => setOpenVideoCallModal(false)}
        callType="video"
        username={selectedUser?.name}
        isRinging={!inCall}
        ringingType="outgoing"
        localRef={localVideoRef}
        remoteRef={remoteVideoRef}
        callTimer={callTimer}
        muted={muted}
        cameraOff={videoOff}
        toggleMute={toggleMute}
        toggleCamera={toggleVideo}
        endCall={handleStopCall}
      />
    </>
  );
};

export default Chat;
