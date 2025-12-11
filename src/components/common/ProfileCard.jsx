import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Stack,
  Switch,
  Box,
  Divider,
  Button,
  Avatar,
  List,
  ListItemButton,
  useTheme
} from '@mui/material';
import { PowerSettingsNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToggleBreakMutation } from '../../features/auth/authApi'; // ✅ Import your RTK hook
import { format } from 'date-fns';
import StyledBadge from './StyledBadge';
import { IMG_PROFILE_URL } from '../../config/api';

const ProfileCard = ({ agent, onToggle, role }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(agent?.elapsedTime || 0);
  const [operProfile, setOpenProfile] = useState(false);
  const [toggleBreak] = useToggleBreakMutation();
  const cardToggle = () => {
    setOpenProfile((prev) => !prev);
    // Navigate based on user role (handle both lowercase and uppercase, TL uses QA profile)
    const profileRoutes = {
      Admin: '/admin/profile',
      admin: '/admin/profile',
      QA: '/qa/profile',
      qa: '/qa/profile',
      TL: '/tl/profile',
      tl: '/tl/profile',
      Agent: '/agent/profile',
      agent: '/agent/profile'
    };
    const route = profileRoutes[role] || '/agent/profile';
    navigate(route);
  };

  // Avatar source logic (same as Profile component)
  const avatarSrc = useMemo(() => {
    if (!agent?.data?.profileImage) return '';
    // Backend may now store full Cloudinary URL; if so, use directly
    if (agent.data.profileImage?.startsWith('http')) return agent.data.profileImage;
    return `${IMG_PROFILE_URL}/${agent.data.profileImage}`;
  }, [agent?.data?.profileImage]);

  useEffect(() => {
    let timer;
    if (!agent?.data?.breakLogs?.start) {
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [agent?.data?.breakLogs?.start]);

  const formatToIST = (date) => {
    return format(new Date(date), 'hh:mm:ss a', {
      timeZone: 'Asia/Kolkata',
    });
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleToggle = async () => {
    try {
      await toggleBreak().unwrap(); // ✅ Call API
      toast.success(`Status changed to ${agent?.data?.workStatus ? 'Break' : 'Active'}`);
      onToggle(agent._id); 
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <Card 
      elevation={0} 
      variant="outlined" 
      sx={{ 
        p: 2, 
        border: 'none', 
        width: 260,
        backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
        color: theme.palette.mode === 'light' ? '#000000' : '#ffffff'
      }}
    >
      <Stack spacing={2} direction="row" alignItems="center">
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant={agent?.data?.is_active === true ? "dot" : "none"}
        >
          <Avatar alt={agent?.data?.name || agent?.data?.first_name || agent?.data?.user_name || ''} src={avatarSrc} key={avatarSrc} sx={{ height: "50px", width: '50px' }} />
        </StyledBadge>
        <Box>
          {/* Display full name if available */}
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            {agent?.data?.name || agent?.data?.user_name || 'User'}
          </Typography>
          <Typography variant="body2">{agent?.data?.email}</Typography>
          <Typography variant="body2">E.ID: {agent?.data?.employee_id}</Typography>
           <Typography variant="body2">Department: {agent?.data?.department}</Typography>
           <Typography variant='body2'sx={{color: '#827717',}}>login Time : {agent?.data?.login_time && formatToIST(agent?.data?.login_time)}</Typography>
        </Box>
      </Stack>
      <Divider sx={{ mt: 1, mb: 1, background: theme.palette.mode === 'light' ? '#999' : '#666', width: '100%' }} />
      <Stack spacing={2}>
        <Box>
          {agent?.data?.breakLogs?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight="bold">
                Last Break Info:
              </Typography>
              <Typography variant="caption">
                Start: {formatToIST(agent?.data?.breakLogs[0].start)}
              </Typography>
              <br />
              <Typography variant="caption">
                End: {formatToIST(agent?.data?.breakLogs[0].end)}
              </Typography>
              <br />
              <Typography variant="caption">
                Duration: {formatToIST(agent?.data?.breakLogs[0].duration)}
              </Typography>
            </Box>
          )}
          {agent?.data?.location?.city && (
            <>
              <Typography sx={{ mt: 1 }}>City: {agent?.data?.location?.city}, {agent?.data?.location?.region}</Typography>
            </>
          )}
          {agent?.data?.location?.country && (
            <Typography>Country: {agent?.data?.location?.country}</Typography>
          )}
        </Box>
      </Stack>

      <Divider sx={{ mt: 1, mb: 1, background: theme.palette.mode === 'light' ? '#fff' : '#666', width: '100%' }} />
      <List>
        <Typography variant="body1" color="info.main" sx={{ mb: 1 }}>
          Accounts
        </Typography>
        <ListItemButton onClick={cardToggle}>
          View Full Profile
        </ListItemButton>
      </List>

      <Button onClick={handleLogout} fullWidth color="error" variant="outlined">
        <PowerSettingsNew sx={{ mr: 1 }} /> Logout
      </Button>
    </Card>
  );
};

export default ProfileCard;
