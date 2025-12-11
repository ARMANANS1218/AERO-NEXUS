// src/components/AudioCallModal.jsx
import React from "react";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Avatar,
  Stack,
} from "@mui/material";
import {
  Mic,
  MicOff,
  CallEnd,
} from "@mui/icons-material";

export default function AudioCallModal({
  open,
  onClose,
  localAudioRef,
  remoteAudioRef,
  username = "Username",
  callTimer = 0,
  muted = false,
  toggleMute,
  endCall,
}) {
  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const handleEndCall = () => {
    endCall?.();
    onClose?.();
  };

  if (!open) return null;

  return (<>
     <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
    <Modal open={open} onClose={onClose} aria-labelledby="audio-call-modal">
     
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "rgba(0, 0, 0, 0.6)", // semi-transparent backdrop
        }}
      >
        <Box
          sx={{
            width: 320,
            height: 500,
            bgcolor: "#2e4c45", // soft green-dark
            borderRadius: 3,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            py: 5,
            px: 3,
            boxShadow: 6,
          }}
        >
          {/* Caller Info */}
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="h6" id="audio-call-modal" fontWeight={600}>
              {username}
            </Typography>
            <Typography variant="body2" color="grey.300" mt={0.5}>
              {formatTime(callTimer)}
            </Typography>
          </Box>

          {/* Avatar */}
          <Avatar
            sx={{
              width: 140,
              height: 140,
              fontSize: 48,
              bgcolor: "#a3f1e1",
              color: "#2e4c45",
            }}
          >
            {username?.[0]?.toUpperCase() || "U"}
          </Avatar>

          {/* Controls */}
          <Stack direction="row" spacing={5} sx={{ mb: 3 }}>
            <IconButton
              onClick={toggleMute}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.25)",
                },
              }}
            >
              {muted ? <MicOff /> : <Mic />}
            </IconButton>

            <IconButton
              onClick={handleEndCall}
              aria-label="End call"
              sx={{
                bgcolor: "red",
                color: "#fff",
                "&:hover": {
                  bgcolor: "#cc0000",
                },
              }}
            >
              <CallEnd />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Modal>
 </> );
}
