import React from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, CircularProgress
} from '@mui/material';

import { useGetProfileQuery } from '../../../features/auth/authApi';
import StyledBadge from '../../../components/common/StyledBadge';
import { IMG_PROFILE_URL } from '../../../config/api';

const Profile = () => {
  const { data, isLoading, isError } = useGetProfileQuery();

  if (isLoading) return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
  if (isError) return <Typography color="error" textAlign="center" mt={5}>Failed to fetch profile</Typography>;
  const user = data?.data;
  const location = user?.location;
  return (

        <Card sx={{ position: 'relative',height:'100%', overflow: 'visible' }}>
  {/* Top Background */}
  <Box
    sx={{
      height: '100px',
      background: '#ffffff8f', // Top background color
      borderTopLeftRadius: '5px',
      borderTopRightRadius: '5px',
    }}
  />

  {/* Avatar overlapping */}
  <CardContent
    sx={{
      background: 'none',
      pt: 5, // padding top to adjust space after overlapping avatar
      textAlign: 'center',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: 50, // adjust this to move avatar up/down
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant={user?.is_active === true ? 'dot' : 'none'}
      >
        <Avatar
          alt={user?.first_name}
          src={`${IMG_PROFILE_URL}/${user?.profileImage}`}
          sx={{ height: '80px', width: '80px', border: '2px solid #fff' }}
        />
      </StyledBadge>
    </Box>

    {/* Other content */}
    <Typography variant="h6" >
      {user?.first_name}
    </Typography>
     <Typography variant="h6">UserName: {user?.name?.first_name} {user?.name?.last_name}</Typography>
            <Typography variant="body2">Email: {user.email}</Typography>
            <Typography variant="body2">Mobile: {user.mobile}</Typography>
            <Typography variant="body2">Role: {user.role}</Typography>
            <Typography variant="body2">
              Name: {user.name?.first_name} {user.name?.last_name}
            </Typography>
         <Box>
            <Typography>IP Address: {location?.ip}</Typography>
            <Typography>City: {location?.city}</Typography>
            <Typography>Region: {location?.region}</Typography>
            <Typography>Country: {location?.country}</Typography>
            <Typography>ISP: {location?.isp}</Typography>
            <Typography>Timezone: {location?.timezone}</Typography>
          </Box>
  </CardContent>
</Card>


  );
};

export default Profile;
