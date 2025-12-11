import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Stack,
  Chip,
  Grid,
  useTheme,
  Paper,
} from "@mui/material";
import { Call, Videocam, Phone, PhoneInTalk, PhoneMissed, PhoneForwarded } from "@mui/icons-material";
import { useGetCallHistoryQuery } from "../../../features/room/roomApi";
import renderTime from "../../../utils/renderTime";
import { IMG_PROFILE_URL as IMG_BASE_URL } from "../../../config/api";

const getStatusColor = (status) => {
  switch (status) {
    case "accepted":
      return "success";
    case "ended":
      return "default";
    case "rejected":
      return "error";
    case "missed":
      return "warning";
    default:
      return "default";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "accepted":
      return <PhoneInTalk fontSize="small" />;
    case "rejected":
      return <PhoneMissed fontSize="small" />;
    case "ended":
      return <Phone fontSize="small" />;
    default:
      return <PhoneForwarded fontSize="small" />;
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export default function Calls() {
  const theme = useTheme();
  const { data, isLoading, error } = useGetCallHistoryQuery();
  const calls = data?.data || [];

  return (
    <Box className="p-3 sm:p-2 md:p-6 lg:p-8 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Typography 
          variant="h4" 
          className="mb-4 sm:mb-6 font-bold text-gray-900 dark:text-white text-xl sm:text-2xl md:text-3xl flex items-center gap-2 sm:gap-3"
        >
          <Phone sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} className="text-blue-600 dark:text-blue-400" />
          Call History
        </Typography>

        {isLoading ? (
          <Box className="flex justify-center items-center h-96">
            <div className="text-center">
              <CircularProgress size={60} className="text-blue-600 dark:text-blue-400 mb-4" />
              <Typography className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Loading call history...
              </Typography>
            </div>
          </Box>
        ) : error ? (
          <Paper 
            elevation={0} 
            className="p-6 sm:p-8 text-center bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl"
          >
            <PhoneMissed className="text-red-600 dark:text-red-400" sx={{ fontSize: { xs: 60, sm: 80 }, mb: 2 }} />
            <Typography variant="h6" className="text-red-600 dark:text-red-400 text-base sm:text-lg md:text-xl mb-2">
              Failed to load call history
            </Typography>
            <Typography className="text-sm sm:text-base text-gray-500 dark:text-gray-500">
              Please try again later
            </Typography>
          </Paper>
        ) : calls.length === 0 ? (
          <Paper 
            elevation={0} 
            className="p-8 sm:p-12 text-center bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm"
          >
            <Phone className="text-gray-400 dark:text-gray-600" sx={{ fontSize: { xs: 80, sm: 100 }, mb: 3 }} />
            <Typography variant="h6" className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl font-semibold mb-2">
              No call history yet
            </Typography>
            <Typography variant="body2" className="text-gray-500 dark:text-gray-500 text-sm sm:text-base">
              Your call history will appear here once you make or receive calls
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {calls.map((call) => {
              const caller = call?.participants?.find((p) => p.role === "caller")?.userId;
              const receiver = call?.participants?.find((p) => p.role === "receiver")?.userId;

              return (
                <Grid item xs={12} key={call._id}>
                  <Card 
                    elevation={0}
                    className="p-3 sm:p-2 md:p-5 bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      {/* Avatar */}
                      <ListItemAvatar>
                        <Avatar 
                          src={caller?.profileImage ? `${IMG_BASE_URL}/${caller.profileImage}` : ""}
                          sx={{ 
                            width: { xs: 48, sm: 56, md: 64 }, 
                            height: { xs: 48, sm: 56, md: 64 },
                            backgroundColor: theme.palette.mode === 'dark' ? '#475569' : '#e5e7eb',
                            fontSize: { xs: '20px', sm: '24px', md: '28px' },
                            fontWeight: 'bold'
                          }}
                        >
                          {caller?.name?.charAt(0)?.toUpperCase() || "U"}
                        </Avatar>
                      </ListItemAvatar>

                      {/* Call Details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems={{ xs: 'flex-start', sm: 'center' }} className="mb-1 sm:mb-2">
                          <Typography 
                            variant="h6" 
                            className="text-gray-900 dark:text-white font-bold text-base sm:text-lg md:text-xl truncate"
                          >
                            {caller?.name || "Unknown"}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(call.status)}
                            label={call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                            color={getStatusColor(call.status)}
                            size="small"
                            sx={{ fontSize: { xs: '11px', sm: '12px' } }}
                          />
                        </Stack>
                        
                        <Typography 
                          variant="body2" 
                          className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2 truncate"
                        >
                          To: {receiver?.name || "Unknown"}
                        </Typography>
                        
                        <Stack direction="row" spacing={{ xs: 1.5, sm: 2, md: 3 }} className="flex-wrap gap-y-1">
                          <Typography 
                            variant="caption" 
                            className="text-gray-500 dark:text-gray-500 flex items-center gap-1 text-[10px] sm:text-xs"
                          >
                            <PhoneInTalk sx={{ fontSize: { xs: 12, sm: 14 } }} />
                            {formatDuration(call.duration)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            className="text-gray-500 dark:text-gray-500 text-[10px] sm:text-xs"
                          >
                            {renderTime(call.createdAt)}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Action Icons */}
                      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
                        <IconButton 
                          size="small"
                          className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                          sx={{ 
                            width: { xs: 36, sm: 40, md: 44 }, 
                            height: { xs: 36, sm: 40, md: 44 }
                          }}
                        >
                          <Call sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />
                        </IconButton>
                        <IconButton 
                          size="small"
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          sx={{ 
                            width: { xs: 36, sm: 40, md: 44 }, 
                            height: { xs: 36, sm: 40, md: 44 }
                          }}
                        >
                          <Videocam sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </div>
    </Box>
  );
}
