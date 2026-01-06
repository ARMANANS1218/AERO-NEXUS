// UniversalAppbar.js
import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  IconButton,
  Menu,
  Avatar,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
  Typography,
  Switch,
  CssBaseline,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Menu as MenuIcon,
  Bell,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import Sidebar from "../common/Sidebar";
import ProfileCard from "../common/ProfileCard";
import ColorModeContext from "../../context/ColorModeContext";

import {
  useGetProfileQuery,
  useToggleBreakMutation,
} from "../../features/auth/authApi";
import StyledBadge from "../common/StyledBadge";
import Notification from "../common/Notification";
import QueryNotificationPopup from "../QueryNotificationPopup";
import { toast } from "react-toastify";
import { IMG_PROFILE_URL, API_URL } from "../../config/api";
import { useNotificationSoundContext } from "../../context/NotificationSoundContext";
import { getQuerySocket } from "../../socket/querySocket";

const drawerWidth = 260;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: 10,
  ...(open && {
    marginLeft: `${drawerWidth}px`,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}));

const UniversalAppbar = ({ children }) => {
  const isLaptop = useMediaQuery("(min-width:1024px)");
  const [open, setOpen] = useState(false); // Start collapsed by default
  const [sidebarWidth, setSidebarWidth] = useState(64); // Track sidebar width
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { data, refetch } = useGetProfileQuery();
  const [toggleBreak, { isLoading }] = useToggleBreakMutation();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } =
    useNotificationSoundContext();

  const agent = data?.data;
  const role = data?.data?.role;
  // console.log("role", role);

  // Avatar source logic (same as Profile component)
  const avatarSrc = useMemo(() => {
    if (!agent?.profileImage) return "";
    // Backend may now store full Cloudinary URL; if so, use directly
    if (agent.profileImage?.startsWith("http")) return agent.profileImage;
    return `${IMG_PROFILE_URL}/${agent.profileImage}`;
  }, [agent?.profileImage]);

  // Optimized Hybrid Timer: LocalStorage (Instant) + Backend (Sync)
  // 1. Initialize from LocalStorage (if available) to show time immediately
  const [activeSeconds, setActiveSeconds] = useState(() => {
    const saved = localStorage.getItem("activeTimerSeconds");
    return saved ? parseFloat(saved) : 0;
  });

  const [breakMenuAnchor, setBreakMenuAnchor] = useState(null);
  const [breakReason, setBreakReason] = useState("");

  const breakOptions = [
    { label: "Lunch", value: "lunch", color: "#ef4444" },
    { label: "Coffee Break", value: "coffee", color: "#f59e0b" },
    { label: "Meeting", value: "meeting", color: "#8b5cf6" },
    { label: "Personal", value: "personal", color: "#3b82f6" },
    { label: "Other", value: "other", color: "#6366f1" },
  ];

  // SYNC: Fetch from backend every 5 minutes (Very low network usage)
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !agent) return;

        const response = await fetch(`${API_URL}/api/v1/user/active-time`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status && data.data) {
            // Backend is source of truth - correct the local time
            const backendSeconds = data.data.activeTimeMinutes * 60;
            setActiveSeconds(backendSeconds);
            localStorage.setItem(
              "activeTimerSeconds",
              backendSeconds.toString()
            );
          }
        }
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    };

    syncWithBackend(); // Sync on mount
    const interval = setInterval(syncWithBackend, 300000); // Sync every 5 minutes

    return () => clearInterval(interval);
  }, [agent]);

  // Listen for socket events to update status in real-time
  useEffect(() => {
    const socket = getQuerySocket();
    if (!socket) return;

    const handleStatusUpdate = () => {
      console.log(
        "🔄 Socket event received, refetching profile for status update..."
      );
      refetch();
    };

    socket.on("query-accepted", handleStatusUpdate);
    socket.on("work-status-changed", handleStatusUpdate);

    return () => {
      socket.off("query-accepted", handleStatusUpdate);
      socket.off("work-status-changed", handleStatusUpdate);
    };
  }, [refetch]);

  // TICK: Increment every second & Save to LocalStorage (Real-time display)
  useEffect(() => {
    if (agent?.workStatus !== "active" && agent?.workStatus !== "busy") return;

    const interval = setInterval(() => {
      setActiveSeconds((prev) => {
        const newVal = prev + 1;
        localStorage.setItem("activeTimerSeconds", newVal.toString());
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agent?.workStatus]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Handle break selection
  const handleBreakSelect = async (reason) => {
    try {
      setBreakReason(reason);
      setBreakMenuAnchor(null);

      // First trigger the break
      const res = await toggleBreak().unwrap();
      toast.success(`Break started - ${reason}`);

      // ✅ FIX: Immediately fetch accumulated time when GOING on break
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/v1/user/active-time`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.status && data.data) {
              const backendSeconds = data.data.activeTimeMinutes * 60;
              setActiveSeconds(backendSeconds);
              localStorage.setItem(
                "activeTimerSeconds",
                backendSeconds.toString()
              );
              console.log(
                "✅ Fetched on break:",
                data.data.activeTimeMinutes,
                "minutes"
              );
            }
          }
        } catch (error) {
          console.error("Failed to fetch active time on break:", error);
        }
      }

      refetch();
    } catch (error) {
      toast.error("Failed to start break");
    }
  };

  // Handle toggle (Check-in/Check-out)
  const handleToggle = async () => {
    try {
      if (agent?.workStatus === "active") {
        // Show break options dropdown
        const button = document.getElementById("break-button");
        setBreakMenuAnchor(button);
      } else if (agent?.workStatus === "break") {
        // Resume from break - return to active
        const res = await toggleBreak().unwrap();
        toast.success("✅ Resumed from break");
        setBreakReason("");

        // ✅ FIX: Immediately fetch active time from backend when resuming
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const response = await fetch(`${API_URL}/api/v1/user/active-time`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.status && data.data) {
                const backendSeconds = data.data.activeTimeMinutes * 60;
                setActiveSeconds(backendSeconds);
                localStorage.setItem(
                  "activeTimerSeconds",
                  backendSeconds.toString()
                );
              }
            }
          } catch (error) {
            console.error("Failed to fetch active time on resume:", error);
          }
        }

        refetch();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Handle check out (end of day)

  // Handle Check In

  useEffect(() => {
    setOpen(isLaptop);
  }, [isLaptop]);

  // Refetch profile data when profile menu is opened to ensure latest image is displayed
  useEffect(() => {
    if (profileAnchorEl) {
      refetch();
    }
  }, [profileAnchorEl, refetch]);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      toast.error("Failed to toggle fullscreen mode");
    }
  };

  const handleDrawerToggle = () => setOpen((prev) => !prev);

  const handleSidebarWidthChange = (width) => {
    setSidebarWidth(width);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <CssBaseline />
      {/* Query Notification Popup for Agent/QA */}
      <QueryNotificationPopup />

      {/* Sidebar - Fixed width using padding-left on main container */}
      <Sidebar
        open={open}
        handleDrawerClose={() => setOpen(false)}
        role={role}
        onSidebarWidthChange={handleSidebarWidthChange}
      />

      {/* Right Section - Header + Main Content, positioned after sidebar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          marginLeft: { xs: 0, lg: `${sidebarWidth}px` },
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* AppBar - Full width of container */}
        <AppBar
          elevation={0}
          position="fixed"
          open={open}
          className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm"
          sx={{
            backgroundColor:
              theme.palette.mode === "light" ? "#ffffff" : "#030712",
            width: { xs: "100%", lg: `calc(100% - ${sidebarWidth}px)` },
            marginLeft: { xs: 0, lg: `${sidebarWidth}px` },
            top: 0,
            zIndex: 10,
            transition:
              "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              minHeight: 64,
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              className="text-gray-700 dark:text-white"
              size="small"
            >
              <MenuIcon size={20} />
            </IconButton>
            {/* <Typography variant="h6">{role} Panel</Typography> */}
            <Box sx={{ flexGrow: 1 }} />

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ flexShrink: 0 }}
            >
              {/* Timer Display */}
              <Tooltip
                title={`Total active time today: ${formatTime(activeSeconds)}`}
              >
                <Stack direction="row" alignItems="center" spacing={0.25}>
                  <Clock
                    size={14}
                    className={
                      agent?.workStatus === "active"
                        ? "text-green-600 dark:text-green-400"
                        : agent?.workStatus === "busy"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  />
                  <Typography
                    variant="caption"
                    className={
                      agent?.workStatus === "active"
                        ? "text-green-600 dark:text-green-400"
                        : agent?.workStatus === "busy"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-red-600 dark:text-red-400"
                    }
                    sx={{ fontSize: "0.75rem", fontWeight: "bold" }}
                  >
                    {formatTime(activeSeconds)}
                  </Typography>
                </Stack>
              </Tooltip>

              {/* Status Toggle Switch */}
              <Tooltip
                title={
                  agent?.workStatus === "active"
                    ? "Active - Toggle to switch status"
                    : agent?.workStatus === "busy"
                    ? "Busy - Toggle to switch status"
                    : "On Break - Toggle to switch status"
                }
              >
                <Switch
                  checked={agent?.workStatus === "active"}
                  onChange={(e) => {
                    if (e.target.checked && agent?.workStatus !== "active") {
                      // Turn ON - Resume to Active
                      handleToggle();
                    } else if (!e.target.checked && agent?.workStatus === "active") {
                      // Turn OFF - Go to Break
                      const button = document.getElementById("break-button");
                      setBreakMenuAnchor(button);
                    }
                  }}
                  size="small"
                  sx={{
                    width: 36,
                    height: 20,
                    padding: 0,
                    '& .MuiSwitch-switchBase': {
                      padding: 0,
                      margin: '2px',
                      '&.Mui-checked': {
                        transform: 'translateX(16px)',
                        color: '#fff',
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#22c55e',
                          opacity: 1,
                        },
                      },
                    },
                    '& .MuiSwitch-thumb': {
                      width: 16,
                      height: 16,
                    },
                    '& .MuiSwitch-track': {
                      borderRadius: 10,
                      backgroundColor: '#ef4444',
                      opacity: 1,
                    },
                  }}
                />
              </Tooltip>

              {/* Status Button */}
              <Tooltip
                title={
                  agent?.workStatus === "active"
                    ? "Click to take a break"
                    : agent?.workStatus === "busy"
                    ? "You are currently busy"
                    : "Click to resume work"
                }
              >
                <Box
                  id="break-button"
                  onClick={
                    agent?.workStatus === "active"
                      ? (e) => setBreakMenuAnchor(e.currentTarget)
                      : agent?.workStatus === "busy"
                      ? undefined
                      : handleToggle
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "20px",
                    bgcolor:
                      agent?.workStatus === "active"
                        ? "rgba(34, 197, 94, 0.1)"
                        : agent?.workStatus === "busy"
                        ? "rgba(249, 115, 22, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                    border: "1px solid",
                    borderColor:
                      agent?.workStatus === "active"
                        ? "rgba(34, 197, 94, 0.2)"
                        : agent?.workStatus === "busy"
                        ? "rgba(249, 115, 22, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                    cursor:
                      agent?.workStatus === "busy" ? "default" : "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor:
                        agent?.workStatus === "active"
                          ? "rgba(34, 197, 94, 0.2)"
                          : agent?.workStatus === "busy"
                          ? "rgba(249, 115, 22, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      transform:
                        agent?.workStatus === "busy"
                          ? "none"
                          : "translateY(-1px)",
                    },
                  }}
                >
                  <Clock
                    size={14}
                    className={
                      agent?.workStatus === "active"
                        ? "text-green-600"
                        : agent?.workStatus === "busy"
                        ? "text-orange-600"
                        : "text-red-600"
                    }
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color:
                        agent?.workStatus === "active"
                          ? "success.main"
                          : agent?.workStatus === "busy"
                          ? "warning.main"
                          : "error.main",
                    }}
                  >
                    {agent?.workStatus === "active"
                      ? "Active"
                      : agent?.workStatus === "busy"
                      ? "Busy"
                      : "On Break"}
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip
                title={
                  soundEnabled
                    ? "Mute Notification Sounds"
                    : "Unmute Notification Sounds"
                }
              >
                <IconButton
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    toast.success(
                      soundEnabled
                        ? "Notification sounds muted"
                        : "Notification sounds enabled",
                      {
                        position: "top-center",
                        autoClose: 2000,
                      }
                    );
                  }}
                  className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                  size="small"
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </IconButton>
              </Tooltip>

              <Tooltip
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <IconButton
                  onClick={toggleFullscreen}
                  className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                  size="small"
                >
                  {isFullscreen ? (
                    <Minimize size={18} />
                  ) : (
                    <Maximize size={18} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip
                title={
                  theme.palette.mode === "dark" ? "Light Mode" : "Dark Mode"
                }
              >
                <IconButton
                  onClick={colorMode.toggleColorMode}
                  className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                  size="small"
                >
                  {theme.palette.mode === "dark" ? (
                    <Sun size={18} />
                  ) : (
                    <Moon size={18} />
                  )}
                </IconButton>
              </Tooltip>

              {/* <Tooltip title="Notifications">
              <IconButton 
                size="small" 
                onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 relative"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </IconButton>
            </Tooltip> */}

              <Tooltip title="Profile">
                <IconButton
                  size="small"
                  onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                  className="hover:bg-gray-100 dark:hover:bg-slate-700 flex-shrink-0"
                >
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant={agent?.is_active === true ? "dot" : "none"}
                  >
                    <Avatar
                      alt={agent?.first_name}
                      src={avatarSrc}
                      key={avatarSrc}
                      sx={{ height: "30px", width: "30px" }}
                    />
                  </StyledBadge>
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Main Content Area - Only this scrolls */}
        <Box
          component="main"
          className="flex-grow bg-gray-50 dark:bg-slate-900 w-full"
          sx={{
            flex: 1,
            width: "100%",
            paddingTop: "64px",
            height: "calc(100vh - 64px)",
            overflowY: "auto",
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Break Reasons & Status Menu */}
      <Menu
        anchorEl={breakMenuAnchor}
        open={Boolean(breakMenuAnchor)}
        onClose={() => setBreakMenuAnchor(null)}
        sx={{ mt: 1 }}
        PaperProps={{
          sx: {
            minWidth: 220,
            backgroundColor:
              theme.palette.mode === "light" ? "#ffffff" : "#111827",
            color: theme.palette.mode === "light" ? "#000000" : "#ffffff",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: "rgba(0, 0, 0, 0.02)",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: "bold", color: "#6b7280" }}
          >
            Select Action
          </Typography>
        </Box>

        {/* Break Reasons */}
        <Box sx={{ borderBottom: "1px solid #e5e7eb" }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              pt: 1,
              display: "block",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.75rem",
            }}
          >
            TAKE A BREAK
          </Typography>
          {breakOptions.map((option) => (
            <Box
              key={option.value}
              onClick={() => handleBreakSelect(option.label)}
              sx={{
                px: 2,
                py: 1,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                },
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "0.9rem",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: option.color,
                }}
              />
              {option.label}
            </Box>
          ))}
        </Box>
      </Menu>

      {/* Profile Menu */}
      <Menu
        elevation={0}
        sx={{ mt: 1.5 }}
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
      >
        <ProfileCard agent={{ ...data }} role={role} />
      </Menu>

      {/* Notifications Menu */}
      <Menu
        sx={{ mt: 2 }}
        anchorEl={notifAnchorEl}
        open={Boolean(notifAnchorEl)}
        onClose={() => setNotifAnchorEl(null)}
      >
        <Notification />
      </Menu>
    </Box>
  );
};

export default UniversalAppbar;
