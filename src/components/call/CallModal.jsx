import React, { useEffect, useRef } from "react";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Avatar,
  Stack,
  Paper,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  Call,
  CameraAlt,
} from "@mui/icons-material";

export default function CallModal({
  open,
  onClose,
  callType = "audio", // "audio" | "video"
  localRef,
  remoteRef,
  username = "User",
  callTimer = 0,
  muted = false,
  cameraOff = false,
  toggleMute,
  toggleCamera,
  endCall,
  isRinging = false,
  ringingType = "incoming", // "incoming" | "outgoing"
  onAccept,
  onReject,
  onScreenshot, // New prop for screenshot handler
}) {
  const ringtoneRef = useRef(null);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    endCall?.();
    onClose?.();
  };

  const handleScreenshot = () => {
    if (!remoteRef?.current || callType !== 'video') return;
    
    try {
      const video = remoteRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob && onScreenshot) {
          onScreenshot(blob);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot error:', err);
    }
  };

  useEffect(() => {
    if (isRinging && ringtoneRef.current) {
      ringtoneRef.current.play().catch((err) =>
        console.warn("Autoplay blocked:", err)
      );
    } else if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, [isRinging, ringingType]);

  if (!open) return null;

  return (
    <>
      {isRinging && (
        <audio
          ref={ringtoneRef}
          src={
            ringingType === "incoming"
              ? "/ringing.mp3"
              : "/calling.mp3"
          }
          loop
        />
      )}

      {!isRinging && callType === "audio" && (
        <>
          <audio ref={localRef} autoPlay muted />
          <audio ref={remoteRef} autoPlay />
        </>
      )}
      {!isRinging && callType === "video" && (
        <>
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain", 
              background: "black" 
            }}
          />
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              width: 160,
              height: 120,
              borderRadius: 8,
              border: "2px solid rgba(255,255,255,0.3)",
              objectFit: "cover",
              background: "black",
              transform: "scaleX(-1)", // Mirror local video
            }}
          />
          {cameraOff && (
            <Box
              sx={{
                position: "absolute",
                right: 16,
                top: 16,
                width: 160,
                height: 120,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.8)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <VideocamOff sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
          )}
        </>
      )}

      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            bgcolor: "rgba(0,0,0,0.7)",
          }}
        >
          {isRinging ? (
            ringingType === "incoming" ? (
              <Box
                sx={{
                  width: 320,
                  height: 500,
                  bgcolor: "#2e4c45",
                  borderRadius: 3,
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 5,
                  px: 3,
                }}
              >
                <Avatar sx={{ width: 140, height: 140, fontSize: 48, bgcolor: "#a3f1e1", color: "#2e4c45", mb: 2 }}>
                  {username?.[0]?.toUpperCase() || "U"}
                </Avatar>
                <Typography variant="h6">{username}</Typography>
                <Typography variant="body2" color="grey.300" mt={1}>
                  {callType === "audio" ? "Incoming Audio Call…" : "Incoming Video Call…"}
                </Typography>
                <Stack direction="row" spacing={5} sx={{ mt: 5 }}>
                  <IconButton onClick={onReject} sx={{ bgcolor: "red", color: "#fff" }}>
                    <CallEnd />
                  </IconButton>
                  <IconButton onClick={onAccept} sx={{ bgcolor: "green", color: "#fff" }}>
                    <Call />
                  </IconButton>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  width: 320,
                  height: 500,
                  bgcolor: "#1f2a44",
                  borderRadius: 3,
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 5,
                  px: 3,
                }}
              >
                <Avatar sx={{ width: 140, height: 140, fontSize: 48, bgcolor: "#6fa8dc", color: "#fff", mb: 2 }}>
                  {username?.[0]?.toUpperCase() || "U"}
                </Avatar>
                <Typography variant="h6">{username}</Typography>
                <Typography variant="body2" color="grey.300" mt={1}>
                  Calling…
                </Typography>
                <IconButton onClick={handleEndCall} sx={{ bgcolor: "red", color: "#fff", mt: 5 }}>
                  <CallEnd />
                </IconButton>
              </Box>
            )
          ) : (
            <>
              {callType === "audio" ? (
                <Box
                  sx={{
                    width: 320,
                    height: 500,
                    bgcolor: "#2e4c45",
                    borderRadius: 3,
                    color: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 5,
                    px: 3,
                  }}
                >
                  <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="h6" fontWeight={600}>{username}</Typography>
                    <Typography variant="body2" color="grey.300" mt={0.5}>{formatTime(callTimer)}</Typography>
                  </Box>
                  <Avatar sx={{ width: 140, height: 140, fontSize: 48, bgcolor: "#a3f1e1", color: "#2e4c45" }}>
                    {username?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <Stack direction="row" spacing={5} sx={{ mb: 3 }}>
                    <IconButton onClick={toggleMute} sx={{ color: "#fff" }}>
                      {muted ? <MicOff /> : <Mic />}
                    </IconButton>
                    <IconButton onClick={handleEndCall} sx={{ bgcolor: "red", color: "#fff" }}>
                      <CallEnd />
                    </IconButton>
                  </Stack>
                </Box>
              ) : (
                <Paper 
                  sx={{ 
                    position: "relative", 
                    width: { xs: "95%", sm: "90%", md: "80%", lg: "70%" }, 
                    height: { xs: "90vh", sm: "85vh", md: "80vh" }, 
                    bgcolor: "black",
                    borderRadius: { xs: 1, sm: 2 },
                    overflow: "hidden"
                  }}
                >
                  <Box sx={{ 
                    position: "absolute", 
                    top: { xs: 8, sm: 12 }, 
                    left: { xs: 8, sm: 12 }, 
                    color: "#fff", 
                    bgcolor: "rgba(0,0,0,0.6)", 
                    px: { xs: 1, sm: 1.5 }, 
                    py: 0.5,
                    borderRadius: 1,
                    backdropFilter: "blur(4px)"
                  }}>
                    <Typography variant="body2" fontWeight={600}>
                      {formatTime(callTimer)}
                    </Typography>
                  </Box>
                  <Stack 
                    direction="row" 
                    spacing={{ xs: 1.5, sm: 2 }} 
                    sx={{ 
                      position: "absolute", 
                      bottom: { xs: 16, sm: 20 }, 
                      left: "50%", 
                      transform: "translateX(-50%)",
                      bgcolor: "rgba(0,0,0,0.5)",
                      borderRadius: 3,
                      p: { xs: 1, sm: 1.5 },
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    <IconButton 
                      onClick={toggleMute} 
                      sx={{ 
                        color: "#fff",
                        bgcolor: muted ? "rgba(239, 68, 68, 0.8)" : "rgba(255,255,255,0.1)",
                        width: { xs: 44, sm: 52 },
                        height: { xs: 44, sm: 52 },
                        "&:hover": {
                          bgcolor: muted ? "rgba(239, 68, 68, 1)" : "rgba(255,255,255,0.2)",
                        }
                      }}
                    >
                      {muted ? <MicOff sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <Mic sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                    </IconButton>
                    <IconButton 
                      onClick={toggleCamera} 
                      sx={{ 
                        color: "#fff",
                        bgcolor: cameraOff ? "rgba(239, 68, 68, 0.8)" : "rgba(255,255,255,0.1)",
                        width: { xs: 44, sm: 52 },
                        height: { xs: 44, sm: 52 },
                        "&:hover": {
                          bgcolor: cameraOff ? "rgba(239, 68, 68, 1)" : "rgba(255,255,255,0.2)",
                        }
                      }}
                    >
                      {cameraOff ? <VideocamOff sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <Videocam sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                    </IconButton>
                    {onScreenshot && !isRinging && (
                      <IconButton 
                        onClick={handleScreenshot} 
                        sx={{ 
                          color: "#fff",
                          bgcolor: "rgba(59, 130, 246, 0.8)",
                          width: { xs: 44, sm: 52 },
                          height: { xs: 44, sm: 52 },
                          "&:hover": {
                            bgcolor: "rgba(59, 130, 246, 1)",
                          }
                        }} 
                        title="Take Screenshot"
                      >
                        <CameraAlt sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </IconButton>
                    )}
                    <IconButton 
                      onClick={handleEndCall} 
                      sx={{ 
                        color: "#fff", 
                        bgcolor: "rgba(220, 38, 38, 0.9)",
                        width: { xs: 52, sm: 60 },
                        height: { xs: 52, sm: 60 },
                        "&:hover": {
                          bgcolor: "rgba(220, 38, 38, 1)",
                          transform: "scale(1.05)"
                        },
                        transition: "all 0.2s"
                      }}
                    >
                      <CallEnd sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    </IconButton>
                  </Stack>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}
