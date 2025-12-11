import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Snackbar,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
} from "@mui/icons-material";
import { useCreateCallMutation } from "../../features/room/roomApi";
import useWebRTC from "../../hooks/webRtc";
import { getSocket } from "../../hooks/socket";

export default function VideoCall() {
  const agentId = "687608347057ea1dfefa7de0";
  const customerId = "68aa9e4a4e61ea8cf8705a21";

  const [inCall, setInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const timerRef = useRef(null);
  const socket = getSocket();

  const [createCall] = useCreateCallMutation();
  // Important: the hook is called with the CURRENT roomId each render
  const { localVideoRef, remoteVideoRef, startCall: startWebRTC, endCall } =
    useWebRTC(roomId);

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setOpenSnackbar(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // simple call timer
  useEffect(() => {
    if (!inCall) return;
    timerRef.current && clearInterval(timerRef.current);
    setCallTimer(0);
    timerRef.current = setInterval(() => {
      setCallTimer((p) => p + 1);
    }, 1000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [inCall]);

  // Socket lifecycle listeners relevant to caller
  useEffect(() => {
    if (!socket) return;

    const onAccepted = async () => {
      // At this point the callee has joined the room. roomId is set, hook has re-rendered.
      showSnackbar("Call accepted. Connecting…");
      await startWebRTC(); // creates offer, attaches local stream, etc.
      setInCall(true);
    };

    const onRejected = () => {
      showSnackbar("Call rejected");
      cleanupCallUI();
    };

    const onEnded = () => {
      showSnackbar("Call ended by remote");
      handleStopCall(); // ensures peer + streams closed
    };

    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, startWebRTC]);

  const startCall = async () => {
    try {
      setIsCalling(true);
      showSnackbar("Calling…");

      // 1) Create room on backend
      const res = await createCall({ receiverId: customerId }).unwrap();
      const backendRoomId = res?.data?.roomId;
      if (!backendRoomId) throw new Error("No roomId from backend");
      setRoomId(backendRoomId);

      // 2) Tell server to ring the customer
      socket.emit("call:init", {
        roomId: backendRoomId,
        from: agentId,
        receiverId: customerId,
      });

      // 3) Do NOT start WebRTC yet.
      //    Wait for "call:accepted" (see effect above).
      //    This guarantees the hook re-renders with the new roomId.
    } catch (err) {
      console.error("Start call error:", err);
      showSnackbar("Failed to start call");
      setIsCalling(false);
    } finally {
      setIsCalling(false);
    }
  };

  const handleStopCall = () => {
    // inform server (safe even if already ended)
    if (roomId) {
      socket.emit("call:end", { roomId });
    }
    // close peer + stop media
    endCall?.();

    cleanupCallUI();
    showSnackbar("Call ended");
  };

  const cleanupCallUI = () => {
    timerRef.current && clearInterval(timerRef.current);
    setInCall(false);
    setRoomId(null);
    setCallTimer(0);
    setMuted(false);
    setVideoOff(false);
    setScreenSharing(false);
  };

  const toggleMute = () => {
    if (localVideoRef?.current?.srcObject) {
      const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
      if (audioTracks.length) {
        const next = !audioTracks[0].enabled;
        audioTracks[0].enabled = next;
        setMuted(!next);
      }
    }
  };

  const toggleVideo = () => {
    if (localVideoRef?.current?.srcObject) {
      const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
      if (videoTracks.length) {
        const next = !videoTracks[0].enabled;
        videoTracks[0].enabled = next;
        setVideoOff(!next);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      // This assumes your hook exposes a peer connection via getPeerConnection elsewhere.
      // If not, wire this through your hook accordingly.
      const pc = require("../../hooks/socket").getPeerConnection?.();
      if (!pc) return showSnackbar("No peer connection");

      if (!screenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);

        screenTrack.onended = async () => {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const camTrack = camStream.getVideoTracks()[0];
          if (sender) await sender.replaceTrack(camTrack);
          setScreenSharing(false);
          showSnackbar("Screen sharing stopped");
        };

        setScreenSharing(true);
        showSnackbar("Screen sharing started");
      } else {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
        setScreenSharing(false);
        showSnackbar("Screen sharing stopped");
      }
    } catch (e) {
      console.error(e);
      showSnackbar("Failed to toggle screen share");
    }
  };

  // Add safety checks for refs
  useEffect(() => {
    if (localVideoRef?.current) {
      console.log("🎥 localVideo element:", localVideoRef.current);
      console.log("🎥 localVideo srcObject:", localVideoRef.current?.srcObject);
    }
    if (remoteVideoRef?.current) {
      console.log("📡 remoteVideo element:", remoteVideoRef.current);
      console.log("📡 remoteVideo srcObject:", remoteVideoRef.current?.srcObject);
    }
  }, [localVideoRef, remoteVideoRef]);

  return (
    <Box textAlign="center" p={2}>
      {!inCall ? (
        <Button
          onClick={startCall}
          variant="contained"
          color="primary"
          disabled={isCalling}
          startIcon={isCalling ? <CircularProgress size={16} /> : null}
        >
          {isCalling ? "Starting call..." : "Start call"}
        </Button>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            WebRTC Video Call
          </Typography>

          <Box display="flex" justifyContent="space-around" mt={2} flexWrap="wrap">
            <Box>
              <Typography variant="body2" gutterBottom>
                You
              </Typography>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                width="300"
                height="225"
                style={{ borderRadius: "8px", objectFit: "cover" }}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>
                Remote
              </Typography>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                width="300"
                height="225"
                style={{ borderRadius: "8px", objectFit: "cover" }}
              />
            </Box>
          </Box>

          <Typography variant="body1" mt={2}>
            Call Duration: {formatTime(callTimer)}
          </Typography>

          <Box mt={2} display="flex" justifyContent="center" flexWrap="wrap">
            <Button onClick={toggleMute} variant="contained" color={muted ? "error" : "primary"} sx={{ m: 1 }}>
              {muted ? <MicOff /> : <Mic />}
            </Button>
            <Button onClick={toggleVideo} variant="contained" color={videoOff ? "error" : "primary"} sx={{ m: 1 }}>
              {videoOff ? <VideocamOff /> : <Videocam />}
            </Button>
            <Button onClick={toggleScreenShare} variant="contained" color={screenSharing ? "error" : "primary"} sx={{ m: 1 }}>
              {screenSharing ? <StopScreenShare /> : <ScreenShare />}
            </Button>
            <Button onClick={handleStopCall} variant="contained" color="error" sx={{ m: 1 }}>
              <CallEnd />
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMsg}
      />
    </Box>
  );
}
