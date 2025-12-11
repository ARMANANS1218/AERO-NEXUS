import React, { useEffect, useState } from 'react';
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
  useTheme,
  CircularProgress
} from '@mui/material';
import { PowerSettingsNew, PersonOutline, EmailOutlined, PhoneOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import StyledBadge from '../../../components/common/StyledBadge';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { IMG_PROFILE_URL } from '../../../config/api';

const ProfileCard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [openProfile, setOpenProfile] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const { data: customerData, isLoading, error } = useGetProfileQuery();
  
  // Get token data as fallback
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setTokenData(decoded);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);
  
  // Use API data if available, otherwise use token data
  const customer = customerData?.data || tokenData;
  
  const cardToggle = () => {
    setOpenProfile((prev) => !prev);
    navigate('/customer/profile');
  };

  const formatToIST = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'hh:mm:ss a', {
      timeZone: 'Asia/Kolkata',
    });
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (isLoading && !customer) {
    return (
      <Card 
        variant="outlined" 
        sx={{ 
          p: 3, 
          border: 'none', 
          width: { xs: '100%', sm: 320, md: 360 },
          backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  if (error && !customer) {
    return (
      <Card 
        variant="outlined" 
        sx={{ 
          p: 3, 
          border: 'none', 
          width: { xs: '100%', sm: 320, md: 360 },
          backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        }}
      >
        <Typography color="warning" align="center" sx={{ mb: 2 }}>
          Using offline profile data
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center">
          Unable to fetch latest profile from server
        </Typography>
      </Card>
    );
  }

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        p: { xs: 2, sm: 2.5, md: 3 }, 
        border: 'none', 
        width: { xs: '100%', sm: 320, md: 360 },
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
        borderRadius: 2
      }}
    >
      {/* Profile Header */}
      <Stack spacing={2} direction="row" alignItems="center">
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant={customer?.is_active === true ? "dot" : "none"}
        >
          <Avatar 
            alt={customer?.name} 
            src={customer?.profileImage ? `${IMG_PROFILE_URL}/${customer.profileImage}` : undefined}
            sx={{ 
              height: { xs: 56, sm: 64 }, 
              width: { xs: 56, sm: 64 },
              fontSize: { xs: '24px', sm: '28px' },
              bgcolor: 'primary.main'
            }}
          >
            {customer?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
        </StyledBadge>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              fontWeight: 'bold',
              fontSize: { xs: '16px', sm: '18px' },
              mb: 0.5
            }}
          >
            {customer?.name || 'Customer'}
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailOutlined sx={{ fontSize: 16, color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#d1d5db' : '#6b7280',
                  fontSize: { xs: '12px', sm: '13px' }
                }}
                noWrap
              >
                {customer?.email || 'N/A'}
              </Typography>
            </Box>
            {customer?.mobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneOutlined sx={{ fontSize: 16, color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? '#d1d5db' : '#6b7280',
                    fontSize: { xs: '12px', sm: '13px' }
                  }}
                >
                  {customer.mobile}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
      
      <Divider sx={{ mt: 2, mb: 2, background: theme.palette.mode === 'dark' ? '#475569' : '#e5e7eb' }} />
      
      {/* Account Details */}
      <Stack spacing={1.5}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
            fontWeight: 'bold',
            fontSize: { xs: '14px', sm: '15px' }
          }}
        >
          Account Information
        </Typography>
        
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            Account Created
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              fontSize: { xs: '13px', sm: '14px' }
            }}
          >
            {customer?.createdAt ? format(new Date(customer.createdAt), 'MMM dd, yyyy') : 'N/A'}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            Status
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: customer?.is_active ? '#10b981' : '#ef4444' 
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: customer?.is_active ? '#10b981' : '#ef4444',
                fontWeight: 600,
                fontSize: { xs: '13px', sm: '14px' }
              }}
            >
              {customer?.is_active ? 'Active' : 'Offline'}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Divider sx={{ mt: 2, mb: 2, background: theme.palette.mode === 'dark' ? '#475569' : '#e5e7eb' }} />
      
      {/* Actions */}
      <List sx={{ p: 0 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 1,
            color: theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
            fontWeight: 'bold',
            fontSize: { xs: '14px', sm: '15px' }
          }}
        >
          Quick Actions
        </Typography>
        <ListItemButton 
          onClick={cardToggle}
          sx={{
            borderRadius: 1,
            mb: 1,
            color: theme.palette.mode === 'dark' ? '#d1d5db' : '#000000',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#334155' : '#f3f4f6'
            }
          }}
        >
          <PersonOutline sx={{ mr: 1.5, fontSize: 20 }} />
          <Typography variant="body2">View Full Profile</Typography>
        </ListItemButton>
      </List>

      <Button 
        onClick={handleLogout} 
        fullWidth 
        color="error" 
        variant="outlined"
        sx={{ 
          mt: 2,
          py: 1,
          fontSize: { xs: '13px', sm: '14px' },
          fontWeight: 600
        }}
      >
        <PowerSettingsNew sx={{ mr: 1, fontSize: 20 }} /> Logout
      </Button>
    </Card>
  );
};

export default ProfileCard;
