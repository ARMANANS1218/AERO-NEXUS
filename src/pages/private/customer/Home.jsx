import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { Chat } from "@mui/icons-material";
import SpeedDial from "@mui/material/SpeedDial";

import ChatBotComponent from "../../../components/chatbot/ChatBotComponent";
import { getSocket } from "../../../hooks/socket";
import useWebRTC from "../../../hooks/webRtc";
import CallModal from "../../../components/call/CallModal";

export default function CustomerVideoCall({ currentUserId }) {
  const [incomingCall, setIncomingCall] = useState(null); // { roomId, from, type }
  const [incomingOffer, setIncomingOffer] = useState(null); // store remote offer SDP until user accepts
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCallType, setActiveCallType] = useState(null); // "audio" | "video"
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  const timerRef = useRef(null);
  const socket = getSocket();

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const customerUserId = decoded?.id;

  // Video WebRTC
  const {
    localMediaRef: localVideoRef,
    remoteMediaRef: remoteVideoRef,
    acceptCall: acceptVideoCall,
    endCall: endVideoCall,
  } = useWebRTC(incomingCall?.roomId, { audio: true, video: true });



  // Audio WebRTC
  const {
    localMediaRef: localAudioRef,
    remoteMediaRef: remoteAudioRef,
    acceptCall: acceptAudioCall,
    endCall: endAudioCall,
  } = useWebRTC(incomingCall?.roomId, { audio: true, video: false });

  /** -------------------------
   *  SOCKET LISTENERS
   * ------------------------- */
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      // Example: { roomId, from, type: "audio"|"video" }
      console.log("incoming call", data);
      setIncomingCall({
        roomId: data.roomId,
        from: data.from,
        callType: data?.callType ,
      });
      setIncomingOffer(null);
    };

    const handleEnded = () => {
      handleStopCall();
    };

      // When caller creates offer, it will be relayed as "webrtc:offer"
    const handleWebrtcOffer = ({ sdp, from, roomId }) => {
      console.log("Received webrtc:offer", { from, roomId, hasSdp: !!sdp });
      // Only accept/store the offer if it matches the incoming call's room
      if (incomingCall && roomId && incomingCall.roomId === roomId) {
        setIncomingOffer(sdp);
      } else if (!incomingCall && roomId) {
        // If we didn't yet receive call:incoming (rare), still store offer and set minimal incomingCall
        setIncomingCall({ roomId, from, callType: incomingCall?.callType || "video" });
        setIncomingOffer(sdp);
      } else {
        // store anyway (helps resilience)
        setIncomingOffer(sdp);
      }
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:ended", handleEnded);
    socket.on("webrtc:offer", handleWebrtcOffer);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:ended", handleEnded);
      socket.off("webrtc:offer", handleWebrtcOffer);
    };
  }, [socket, incomingCall]);

  /** -------------------------
   *  TIMER HANDLING
   * ------------------------- */
  useEffect(() => {
    if (isCallActive) {
      setCallTimer(0);
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCallTimer((t) => t + 1);
      }, 1000);
    } else {
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = null;
      setCallTimer(0);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [isCallActive]);

  /** -------------------------
   *  ACCEPT / REJECT / END
   * ------------------------- */
  const handleAcceptVideo = async() => {
    console.log("handleAcceptVideo", { incomingCall });
    if (!incomingCall) return;
    socket.emit("call:accept", { roomId: incomingCall.roomId });
    setIsCallActive(true);
    setActiveCallType("video");

     try {
      if (incomingOffer) {
        await acceptVideoCall(incomingOffer);
        // clear stored offer after consuming it
        setIncomingOffer(null);
      } else {
        // If the offer hasn't arrived yet, we rely on the useWebRTC internal listener
        // (if your hook emits acceptCall on offer reception automatically).
        console.warn("No incomingOffer stored — waiting for webrtc:offer to arrive.");
      }
    } catch (err) {
      console.error("Failed to accept video call:", err);
    }

  };

  const handleAcceptAudio = async() => {
    console.log("handleAcceptAudio", { incomingCall });
    if (!incomingCall) return;
    socket.emit("call:accept", { roomId: incomingCall.roomId });
    setIsCallActive(true);
    setActiveCallType("audio");

    try {
      if (incomingOffer) {
        await acceptAudioCall(incomingOffer);
        setIncomingOffer(null);
      } else {
        console.warn("No incomingOffer stored — waiting for webrtc:offer to arrive.");
      }
    } catch (err) {
      console.error("Failed to accept audio call:", err);
    }
  };

  const handleReject = () => {
    if (!incomingCall) return;
    socket.emit("call:reject", { roomId: incomingCall.roomId });
    setIncomingCall(null);
    setIncomingOffer(null);
  };

  const handleStopCall = () => {
    try {
      endVideoCall?.();
    } catch {}
    try {
      endAudioCall?.();
    } catch {}

    if (incomingCall?.roomId) {
      socket.emit("call:end", { roomId: incomingCall.roomId });
    }

    setIncomingCall(null);
    setIncomingOffer(null);
    setIsCallActive(false);
    setActiveCallType(null);
    setMuted(false);
    setVideoOff(false);

    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;
    setCallTimer(0);
  };

  /** -------------------------
   *  TOGGLES
   * ------------------------- */
  const toggleVideo = () => {
    const vidStream =
      localVideoRef?.current?.srcObject || localAudioRef?.current?.srcObject;
    if (!vidStream) return;
    const videoTracks = vidStream.getVideoTracks();
    if (!videoTracks.length) return;
    const next = !videoTracks[0].enabled;
    videoTracks[0].enabled = next;
    setVideoOff(!next);
  };

  const toggleMute = () => {
    const localStream =
      localVideoRef?.current?.srcObject || localAudioRef?.current?.srcObject;
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (!audioTracks.length) return;
    const next = !audioTracks[0].enabled;
    audioTracks[0].enabled = next;
    setMuted(!next);
  };

  /** -------------------------
   *  CLEANUP
   * ------------------------- */
  useEffect(() => {
    return () => {
      try {
        endVideoCall?.();
      } catch {}
      try {
        endAudioCall?.();
      } catch {}
      timerRef.current && clearInterval(timerRef.current);
    };
  }, []);

  /** -------------------------
   *  RENDER
   * ------------------------- */

  // console.log("Rendering CustomerVideoCall", {
  //   incomingCall,
  //   isCallActive,
  //   activeCallType,
  //   muted,
  //   videoOff,
  //   callTimer,
  //   localAudioRef,
  //   remoteAudioRef,
  //   localVideoRef,
  //   remoteVideoRef,
  // });

  return (
    <>
      {/* Incoming Call Modal */}
      {incomingCall && !isCallActive && (
        <CallModal
          open
          callType={incomingCall.callType}
          username={incomingCall.from || "Unknown"}
          isRinging
          ringingType="incoming"
          onAccept={
            incomingCall.callType === "audio" ? handleAcceptAudio : handleAcceptVideo
          }
          onReject={handleReject}
        />
      )}

      {/* Active Call Modal */}
      {isCallActive && (
        <CallModal
          open
          callType={activeCallType}
          localRef={activeCallType === "audio" ? localAudioRef : localVideoRef}
          remoteRef={activeCallType === "audio" ? remoteAudioRef : remoteVideoRef}
          username={incomingCall?.from || "Agent"}
          callTimer={callTimer}
          muted={muted}
          cameraOff={videoOff}
          toggleMute={toggleMute}
          toggleCamera={toggleVideo}
          endCall={handleStopCall}
        />
      )}

      {/* Welcome Screen with ChatBot */}
      <div className="h-[87.7vh] flex items-center justify-center bg-gray-50 dark:bg-slate-900 relative">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to ChatCRM
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Use the navigation menu to access Chat, Inbox, and other features.
          </p>
        </div>

        {/* ChatBot Popup */}
        {showChat && (
          <div className="fixed bottom-24 right-4 z-[999] w-full max-w-md h-[600px] shadow-2xl">
            <ChatBotComponent 
              onClose={() => setShowChat(false)}
              onConnectToAgent={() => {
                setShowChat(false);
                // Navigate to chat or trigger agent connection
              }}
            />
          </div>
        )}

        {/* Floating Chat Button */}
        <SpeedDial
          ariaLabel="Chat"
          sx={{ 
            position: "absolute", 
            bottom: 16, 
            right: 16,
            '& .MuiFab-primary': {
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }
          }}
          icon={<Chat />}
          onClick={() => setShowChat((prev) => !prev)}
        />
      </div>
    </>
  );
}
