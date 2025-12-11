import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  CircularProgress,
  IconButton,
  Alert,
  useTheme
} from '@mui/material';
import { ArrowBack, Edit, Save, Cancel, CameraAlt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ProfileImageUpload from '../../../components/common/ProfileImageUpload';
import { IMG_PROFILE_URL } from '../../../config/api';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const { data: profileData, isLoading, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    user_name: ''
  });

  useEffect(() => {
    if (profileData?.data) {
      const user = profileData.data;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        user_name: user.user_name || ''
      });
      if (user.profileImage) {
        setImagePreview(`${IMG_PROFILE_URL}/${user.profileImage}`);
      }
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('mobile', formData.mobile);
      formDataToSend.append('user_name', formData.user_name);
      
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      await updateProfile(formDataToSend).unwrap();
      toast.success('Profile updated successfully!');
      setEditMode(false);
      // Small delay to ensure backend has processed the update
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (profileData?.data) {
      const user = profileData.data;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        user_name: user.user_name || ''
      });
      setImagePreview(user.profileImage ? `${IMG_PROFILE_URL}/${user.profileImage}` : null);
      setProfileImage(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load profile. Please try again.</Alert>
      </Box>
    );
  }

  const user = profileData?.data;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        overflow: 'auto',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto', pb: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/customer')} sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            My Profile
          </Typography>
        </Stack>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            background: theme.palette.mode === 'dark' ? '#1e293b' : '#fff'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Profile Picture Section */}
            <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={imagePreview}
                  alt={user?.name}
                  sx={{
                    width: { xs: 80, sm: 100, md: 120 },
                    height: { xs: 80, sm: 100, md: 120 },
                    border: `4px solid ${theme.palette.mode === 'dark' ? '#3b82f6' : '#2563eb'}`,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }}
                />
                {editMode && (
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: theme.palette.mode === 'dark' ? '#3b82f6' : '#2563eb',
                      color: '#fff',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? '#2563eb' : '#1d4ed8'
                      }
                    }}
                  >
                    <CameraAlt />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </IconButton>
                )}
              </Box>
              
              {!editMode && (
                <Button
                  startIcon={<Edit />}
                  variant="contained"
                  onClick={() => setEditMode(true)}
                  sx={{
                    mt: 2,
                    background: theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
                    }
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Stack>

            {/* Profile Form */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editMode}
                  required
                  sx={{
                    '& .MuiInputBase-input': {
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff' : '#6b7280'
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#475569' : '#d1d5db'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Username"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  disabled={!editMode}
                  required
                  sx={{
                    '& .MuiInputBase-input': {
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff' : '#6b7280'
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#475569' : '#d1d5db'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  helperText="Email cannot be changed"
                  sx={{
                    '& .MuiInputBase-input': {
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiFormHelperText-root': {
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#475569' : '#d1d5db'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff' : '#6b7280'
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#475569' : '#d1d5db'
                      }
                    }
                  }}
                />

                {/* Account Info */}
                <Box sx={{ 
                  mt: 2, 
                  p: { xs: 2, sm: 3 }, 
                  borderRadius: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`
                }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2,
                      color: theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
                      fontWeight: 'bold',
                      fontSize: { xs: '14px', sm: '15px' }
                    }}
                  >
                    Account Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: { xs: '11px', sm: '12px' }
                        }}
                      >
                        Account Created
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          fontSize: { xs: '13px', sm: '14px' }
                        }}
                      >
                        {user?.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy hh:mm a') : 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: { xs: '11px', sm: '12px' }
                        }}
                      >
                        Role
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          fontSize: { xs: '13px', sm: '14px' }
                        }}
                      >
                        {user?.role || 'Customer'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: { xs: '11px', sm: '12px' }
                        }}
                      >
                        Status
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: user?.is_active ? '#10b981' : '#ef4444' 
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: user?.is_active ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            fontSize: { xs: '13px', sm: '14px' }
                          }}
                        >
                          {user?.is_active ? 'Active' : 'Offline'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                {/* Action Buttons */}
                {editMode && (
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ mt: 3 }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={isUpdating}
                      startIcon={isUpdating ? <CircularProgress size={20} /> : <Save />}
                      sx={{
                        py: { xs: 1.2, sm: 1.5 },
                        fontSize: { xs: '14px', sm: '15px' },
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                        }
                      }}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      startIcon={<Cancel />}
                      sx={{
                        py: { xs: 1.2, sm: 1.5 },
                        fontSize: { xs: '14px', sm: '15px' },
                        borderColor: theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626',
                        color: theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626',
                        '&:hover': {
                          borderColor: theme.palette.mode === 'dark' ? '#dc2626' : '#b91c1c',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
