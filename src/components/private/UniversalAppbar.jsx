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
import { Menu as MenuIcon, Bell, Sun, Moon, Maximize, Minimize, Clock, Volume2, VolumeX } from "lucide-react";
import Sidebar from "../common/Sidebar";
import ProfileCard from "../common/ProfileCard";
import ColorModeContext from "../../context/ColorModeContext";
import { useGetProfileQuery, useToggleBreakMutation } from "../../features/auth/authApi";
import StyledBadge from "../common/StyledBadge";
import Notification from "../common/Notification";
import QueryNotificationPopup from "../QueryNotificationPopup";
import { toast } from "react-toastify";
import { IMG_PROFILE_URL } from "../../config/api";
import { useNotificationSoundContext } from "../../context/NotificationSoundContext";

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
  const [open, setOpen] = useState(isLaptop);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { data, refetch } = useGetProfileQuery();
  const [toggleBreak, { isLoading }] = useToggleBreakMutation();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useNotificationSoundContext();

  const agent = data?.data;
  const role = data?.data?.role;
  console.log("role", role);

  // Avatar source logic (same as Profile component)
  const avatarSrc = useMemo(() => {
    if (!agent?.profileImage) return '';
    // Backend may now store full Cloudinary URL; if so, use directly
    if (agent.profileImage?.startsWith('http')) return agent.profileImage;
    return `${IMG_PROFILE_URL}/${agent.profileImage}`;
  }, [agent?.profileImage]);

  // Timer state for active time tracking
  const [activeTime, setActiveTime] = useState(0);
  const [todayActive, setTodayActive] = useState(0);
  const [breakMenuAnchor, setBreakMenuAnchor] = useState(null);
  const [breakReason, setBreakReason] = useState('');

  const breakOptions = [
    { label: 'Lunch', value: 'lunch', color: '#ef4444' },
    { label: 'Coffee Break', value: 'coffee', color: '#f59e0b' },
    { label: 'Meeting', value: 'meeting', color: '#8b5cf6' },
    { label: 'Personal', value: 'personal', color: '#3b82f6' },
    { label: 'Other', value: 'other', color: '#6366f1' },
  ];

  // Load timer from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeTime');
    const storedToday = localStorage.getItem('todayActive');
    if (stored) setActiveTime(parseInt(stored));
    if (storedToday) setTodayActive(parseInt(storedToday));
  }, []);

  // Format seconds to readable time (hh:mm:ss)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Update timer every second when agent is active (NOT on break)
  useEffect(() => {
    if (agent?.workStatus !== 'active') return;

    const interval = setInterval(() => {
      setActiveTime((prev) => {
        const newTime = prev + 1;
        localStorage.setItem('activeTime', newTime.toString());
        return newTime;
      });
      setTodayActive((prev) => {
        const newTime = prev + 1;
        localStorage.setItem('todayActive', newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agent?.workStatus]);

  // Handle break selection
  const handleBreakSelect = async (reason) => {
    try {
      setBreakReason(reason);
      setBreakMenuAnchor(null);
      const res = await toggleBreak().unwrap();
      toast.success(`Break started - ${reason}`);
      refetch();
    } catch (error) {
      toast.error('Failed to start break');
    }
  };

  // Handle toggle (Check-in/Check-out)
  const handleToggle = async () => {
    try {
      if (agent?.workStatus === 'active') {
        // Show break options dropdown
        const button = document.getElementById('break-button');
        setBreakMenuAnchor(button);
      } else if (agent?.workStatus === 'break') {
        // Resume from break - return to active
        const res = await toggleBreak().unwrap();
        toast.success('✅ Checked in - Resumed from break');
        setBreakReason('');
        refetch();
      } else {
        // First time - check in (or after check out)
        // Reset timer when checking in
        setActiveTime(0);
        localStorage.setItem('activeTime', '0');
        
        const res = await toggleBreak().unwrap();
        toast.success('✅ Checked in successfully');
        refetch();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle check out (end of day)
  const handleCheckOut = async () => {
    try {
      const res = await toggleBreak().unwrap();
      toast.success('✅ Checked out - See you tomorrow!');
      setBreakMenuAnchor(null);
      setBreakReason('');
      
      // Reset timer on check out
      setActiveTime(0);
      setTodayActive(0);
      localStorage.setItem('activeTime', '0');
      localStorage.setItem('todayActive', '0');
      
      refetch();
    } catch (error) {
      toast.error('Failed to check out');
    }
  };
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

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Failed to toggle fullscreen mode');
    }
  };

  const handleDrawerToggle = () => setOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", height: "100vh", width: "100%", overflow: 'hidden' }}>
      <CssBaseline />
      {/* Query Notification Popup for Agent/QA */}
      <QueryNotificationPopup />
      
      {/* Sidebar - Fixed width using padding-left on main container */}
      <Sidebar open={open} handleDrawerClose={() => setOpen(false)} role={role} />

      {/* Right Section - Header + Main Content, positioned after sidebar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          marginLeft: open ? `${drawerWidth}px` : '64px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* AppBar - Full width of container */}
        <AppBar
          elevation={0}
          position="fixed"
          open={open}
          className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm"
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#030712',
            width: `calc(100% - ${open ? drawerWidth : 64}px)`,
            marginLeft: open ? `${drawerWidth}px` : '64px',
            top: 0,
            zIndex: 10,
            transition: 'margin-left 0.3s ease, width 0.3s ease',
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, minHeight: 64 }}>
            <IconButton
              onClick={handleDrawerToggle}
              className="text-gray-700 dark:text-white"
              size="small"
            >
              <MenuIcon size={20} />
            </IconButton>
            {/* <Typography variant="h6">{role} Panel</Typography> */}
            <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            {/* ✅ Zoho-style Status Toggle with Timer and Status Display */}
            <Stack spacing={0.5} alignItems={"center"} direction={"row"} sx={{ pr: 1, borderRight: '1px solid', borderColor: 'divider' }}>
              
              {/* Status Label */}
              <Tooltip title="Current work status">
                <Typography variant="caption" className="text-gray-700 dark:text-gray-300 whitespace-nowrap hidden sm:inline">
                  Status:
                </Typography>
              </Tooltip>

              {/* ON/OFF Toggle Button (Zoho Style) */}
              <Tooltip title={
                agent?.workStatus === 'active' 
                  ? 'Click to take a break' 
                  : agent?.workStatus === 'break'
                  ? 'Click to resume work'
                  : 'Click to check in'
              }>
                <Box
                  id="break-button"
                  onClick={handleToggle}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.8,
                    py: 0.1,
                    borderRadius: '20px',
                    backgroundColor: agent?.workStatus === 'active' 
                      ? '#22c55e' 
                      : '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    userSelect: 'none',
                    border: '2px solid',
                    borderColor: agent?.workStatus === 'active'
                      ? '#16a34a'
                      : '#dc2626',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${agent?.workStatus === 'active' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    }
                  }}
                >
                  {/* Status Indicator Dot */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                      }
                    }}
                  />
                  
                  {/* Status Text */}
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {agent?.workStatus === 'active' 
                      ? 'ON' 
                      : agent?.workStatus === 'break'
                      ? 'BREAK'
                      : 'OFF'}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Status Details */}
              <Tooltip title={
                agent?.workStatus === 'active'
                  ? 'Currently working'
                  : agent?.workStatus === 'break'
                  ? `On break${breakReason ? ` - ${breakReason}` : ''}`
                  : 'Not working'
              }>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    px: 1,
                    py: 0.25,
                    borderRadius: '6px',
                    backgroundColor: agent?.workStatus === 'active'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : agent?.workStatus === 'break'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(107, 114, 128, 0.1)',
                    color: agent?.workStatus === 'active'
                      ? '#16a34a'
                      : agent?.workStatus === 'break'
                      ? '#dc2626'
                      : '#6b7280',
                  }}
                >
                  {agent?.workStatus === 'active'
                    ? 'Active'
                    : agent?.workStatus === 'break'
                    ? 'On Break'
                    : 'Offline'}
                </Typography>
              </Tooltip>

              {/* Timer Display */}
              {(agent?.workStatus === 'active' || agent?.workStatus === 'break') && (
                <Tooltip title={`Total active time today: ${formatTime(todayActive)}`}>
                  <Stack direction="row" alignItems="center" spacing={0.25}>
                    <Clock size={14} className={agent?.workStatus === 'active' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} />
                    <Typography 
                      variant="caption" 
                      className={agent?.workStatus === 'active' ? "text-green-600 dark:text-green-400 font-mono whitespace-nowrap" : "text-red-600 dark:text-red-400 font-mono whitespace-nowrap"}
                      sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      {formatTime(activeTime)}
                    </Typography>
                  </Stack>
                </Tooltip>
              )}
            </Stack>

            <Tooltip title={soundEnabled ? "Mute Notification Sounds" : "Unmute Notification Sounds"}>
              <IconButton 
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  toast.success(soundEnabled ? "Notification sounds muted" : "Notification sounds enabled", {
                    position: "top-center",
                    autoClose: 2000,
                  });
                }}
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                size="small"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton 
                onClick={toggleFullscreen}
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                size="small"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </IconButton>
            </Tooltip>

            <Tooltip title={theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton 
                onClick={colorMode.toggleColorMode}
                className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                size="small"
              >
                {theme.palette.mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
            width: '100%',
            paddingTop: '64px',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
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
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#6b7280' }}>
            Select Action
          </Typography>
        </Box>

        {/* Break Reasons */}
        <Box sx={{ borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="caption" sx={{ px: 2, pt: 1, display: 'block', fontWeight: '600', color: '#374151', fontSize: '0.75rem' }}>
            TAKE A BREAK
          </Typography>
          {breakOptions.map((option) => (
            <Box
              key={option.value}
              onClick={() => handleBreakSelect(option.label)}
              sx={{
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.9rem',
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: option.color,
                }}
              />
              {option.label}
            </Box>
          ))}
        </Box>

        {/* Check Out Option */}
        <Box
          onClick={handleCheckOut}
          sx={{
            px: 2,
            py: 1,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.9rem',
            color: '#dc2626',
            fontWeight: '500',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#dc2626',
            }}
          />
          Check Out
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
