import { useRef, useState, useMemo, useEffect } from "react";
import {
  Box, Card, Grid, Avatar, OutlinedInput, InputAdornment, Typography,
  Stack, IconButton, TextField, CircularProgress, useTheme, List, ListItem
} from "@mui/material";
import {
  Search, Send, Videocam, Call, CallEnd, Mic, MicOff, VideocamOff,
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

const FullPageChat = ({ currentUserId }) => {
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
      <Box className="h-[calc(100vh-80px)] p-2">
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Left Panel - User List */}
          <Grid item xs={12} md={3} sx={{ height: '100%' }}>
            <Card 
              sx={{ 
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
              }}
            >
              <OutlinedInput
                startAdornment={
                  <InputAdornment position="start">
                    <Search className="text-gray-700 dark:text-gray-300" />
                  </InputAdornment>
                }
                fullWidth
                size="small"
                placeholder="Search users..."
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#475569' : '#d1d5db'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#64748b' : '#9ca3af'
                  },
                  '& input': {
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                  }
                }}
              />
              
              <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { display: 'none' } }}>
                {filteredCustomers.map((user) => (
                  <Box 
                    key={user._id} 
                    sx={{ 
                      p: 1.5, 
                      mb: 1,
                      backgroundColor: selectedUser?._id === user._id 
                        ? (theme.palette.mode === 'dark' ? '#475569' : '#dbeafe')
                        : (theme.palette.mode === 'dark' ? '#334155' : '#f3f4f6'), 
                      borderRadius: 2, 
                      cursor: "pointer",
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#475569' : '#e5e7eb'
                      }
                    }} 
                    onClick={() => setSelectedUser(user)}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <StyledBadge variant={user?.is_active ? "dot" : "none"}>
                        <Avatar src={`${IMG_PROFILE_URL}/${user.profileImage}`} />
                      </StyledBadge>
                      <Box sx={{ flex: 1 }}>
                        <Typography className="text-gray-900 dark:text-white font-medium">
                          {user.name}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                          {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Center Panel - Chat */}
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
              }}
            >
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    sx={{ 
                      p: 2, 
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e5e7eb'}`
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <StyledBadge variant={selectedUser?.is_active ? "dot" : "none"}>
                        <Avatar src={`${IMG_PROFILE_URL}/${selectedUser?.profileImage}`} />
                      </StyledBadge>
                      <Box>
                        <Typography variant="h6" className="text-gray-900 dark:text-white">
                          {selectedUser.name}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                          {isTyping ? "typing..." : `Last seen: ${renderTime(selectedUser.createdAt)}`}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        onClick={handleAudioCall}
                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                      >
                        <Call />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={handleVideoCall}
                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                      >
                        <Videocam />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* Messages Area */}
                  <Box sx={{ flex: 1, position: "relative", overflow: 'hidden' }}>
                    {currentDate && (
                      <Box sx={{ position: "sticky", top: 0, zIndex: 20, textAlign: "center", pt: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? '#475569' : '#e0e0e0',
                            color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 
                            px: 2, 
                            py: 0.5,
                            borderRadius: 1 
                          }}
                        >
                          {dayjs(currentDate).isSame(dayjs(), "day")
                            ? "Today"
                            : dayjs(currentDate).isSame(dayjs().subtract(1, "day"), "day")
                              ? "Yesterday"
                              : dayjs(currentDate).format("DD MMM YYYY")}
                        </Typography>
                      </Box>
                    )}
                    <Box 
                      ref={containerRef} 
                      sx={{ 
                        overflowY: "auto", 
                        p: 2, 
                        height: "100%", 
                        "&::-webkit-scrollbar": { width: '8px' },
                        "&::-webkit-scrollbar-track": { 
                          background: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f1f1' 
                        },
                        "&::-webkit-scrollbar-thumb": { 
                          background: theme.palette.mode === 'dark' ? '#475569' : '#888',
                          borderRadius: '4px'
                        }
                      }}
                    >
                      {loadingMessages ? (
                        <ChatSkeleton />
                      ) : combinedMessages.length > 0 ? (
                        combinedMessages.map((msg, index) => {
                          const messageDate = dayjs(msg.createdAt).format("YYYY-MM-DD");
                          return (
                            <Box key={msg._id || `temp-${index}`} data-date={messageDate}>
                              <ChatMessage msg={msg} selectedUser={selectedUser} />
                            </Box>
                          );
                        })
                      ) : (
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                          <Typography className="text-gray-600 dark:text-gray-400">
                            No messages yet. Start a conversation!
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Input Area */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e5e7eb'}`
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TextField
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            '& input': {
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                            }
                          }
                        }}
                        fullWidth
                        size="small"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message"
                        InputProps={{
                          sx: {
                            '& ::placeholder': {
                              color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                            }
                          }
                        }}
                      />
                      <IconButton 
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                      >
                        <Send />
                      </IconButton>
                    </Stack>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#e5e7eb' }}>
                      <Search sx={{ fontSize: 40 }} className="text-gray-400" />
                    </Avatar>
                    <Typography variant="h6" className="text-gray-600 dark:text-gray-400">
                      Select a user to start chatting
                    </Typography>
                  </Box>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Right Panel - Profile */}
          <Grid item xs={12} md={3} sx={{ height: '100%' }}>
            <Profile />
          </Grid>
        </Grid>
      </Box>

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

export default FullPageChat;
