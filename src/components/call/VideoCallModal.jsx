// src/components/VideoCallModal.jsx
import React from "react";
import { Modal, Box, IconButton, Stack, Typography, Paper } from "@mui/material";
import { Mic, MicOff, Videocam, VideocamOff, CallEnd } from "@mui/icons-material";

export default function VideoCallModal({
  open,
  onClose,
  localVideoRef,
  remoteVideoRef,
  callActive,
  callTimer,
  muted,
  cameraOff,
  toggleMute,
  toggleCamera,
  endCall,
}) {
  const format = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Paper sx={{ position: "relative", width: { xs: "95%", md: "70%" }, height: "80vh", bgcolor: "black" }}>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <Box sx={{ position: "absolute", top: 12, left: 12, color: "#fff", bgcolor: "rgba(0,0,0,0.4)", px: 1, borderRadius: 1 }}>
            <Typography variant="caption">{format(callTimer)}</Typography>
          </Box>

          <Box sx={{ position: "absolute", right: 16, top: 70, width: 160, height: 120, borderRadius: 1, overflow: "hidden", border: "1px solid rgba(255,255,255,0.3)" }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>

          <Stack direction="row" spacing={2} sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)" }}>
            <IconButton onClick={toggleMute} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.4)" }}>
              {muted ? <MicOff /> : <Mic />}
            </IconButton>
            <IconButton onClick={toggleCamera} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.4)" }}>
              {cameraOff ? <VideocamOff /> : <Videocam />}
            </IconButton>
            <IconButton onClick={() => {onClose(); endCall();  }} sx={{ color: "#fff", bgcolor: "red" }}>
              <CallEnd />
            </IconButton>
          </Stack>
        </Paper>
      </Box>
    </Modal>
  );
}
