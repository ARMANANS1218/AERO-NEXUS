import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  Card,
  Divider,
  Stack,
  IconButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

const Notification = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const isTeams = tab === 1;
  const [isLoading,setIsLoading] = useState(false);
const data =[
    {name:"name",type:"type",message:"message"}
]
//   const [markAsRead] = useMarkAsReadMutation();

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      refetch(); // Refresh notifications
    } catch (err) {
      console.error("Error marking as read", err);
    }
  };

  const allNotifications = data?.data?.notifications || [];

  // Optional filtering logic (future use if "type" is defined)
  const filteredNotifications = allNotifications.filter(n =>
    isTeams ? n.type === 'team' : true
  );

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        border: 'none', 
        p: 2, 
        width: 250,
        backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
        color: theme.palette.mode === 'light' ? '#000000' : '#ffffff'
      }}
    >
      <Typography variant="body1" fontWeight="bold" gutterBottom>
        Notifications
      </Typography>

      {/* Success message once at top */}
      {data?.notifications?.message && (
        <Typography variant="caption" color="success.main" align="center" sx={{ py: 1 }}>
          {data?.notifications?.message}
        </Typography>
      )}

      <Tabs
        value={tab}
        onChange={(e, newValue) => setTab(newValue)}
        variant="fullWidth"
        sx={{ 
          mb: 1,
          '& .MuiTab-root': {
            color: theme.palette.mode === 'light' ? '#666' : '#ccc',
            '&.Mui-selected': {
              color: theme.palette.mode === 'light' ? '#000' : '#fff',
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.mode === 'light' ? '#000' : '#fff',
          }
        }}
      >
        <Tab label="All" />
        <Tab label="Teams" />
      </Tabs>

      <Divider sx={{ mb: 1, backgroundColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#666' }} />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <List dense>
          {filteredNotifications.length === 0 ? (
            <Typography variant="body2" align="center" sx={{ py: 1 }}>
              No notifications.
            </Typography>
          ) : (
            filteredNotifications.map((item) => (
              <ListItem
                key={item._id}
                disablePadding
                secondaryAction={
                  !item.isRead && (
                    <IconButton
                      edge="end"
                      onClick={() => handleMarkAsRead(item._id)}
                      title="Mark as read"
                    >
                      <CheckCircleOutline fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Stack spacing={0.2}>
                      <Typography variant="body2">{item?.message}</Typography>
                      {item?.ticketId && (
                        <Typography variant="caption" color="text.secondary">
                          Ticket: {item.ticketId}
                        </Typography>
                      )}
                    </Stack>
                  }
                  sx={{ pl: 1, opacity: item.isRead ? 0.5 : 1 }}
                />
              </ListItem>
            ))
          )}
        </List>
      )}
    </Card>
  );
};

export default Notification;
