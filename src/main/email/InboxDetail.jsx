// src/pages/Tickets/InboxDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Reply,
  ArrowBack,
  AttachFile,
  Star,
  StarBorder,
  MoreVert,
  Send,
  DeleteOutline,
} from '@mui/icons-material';
import { useGetTicketIdQuery, useReplyToTicketMutation } from '../../features/ticket/ticketApi';
import renderTime from '../../utils/renderTime';


const InboxDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const { data, isLoading, error } = useGetTicketIdQuery(ticketId);
  const [replyToTicket] = useReplyToTicketMutation();

  const ticket = data?.data;
  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    try {
      await replyToTicket({
        ticketId,
        message: replyContent
      }).unwrap();

      setReplyContent('');
      setIsReplying(false);
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const nameParts = name.trim().split(' ');
    return nameParts
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          Error loading ticket: {error.message}
        </Typography>
        <Button onClick={() => navigate('/inbox')} sx={{ mt: 2 }}>
          Back to Tickets
        </Button>
      </Paper>
    );
  }

  if (!ticket) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Ticket not found</Typography>
        <Button onClick={() => navigate('/inbox')} sx={{ mt: 2 }}>
          Back to Tickets
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ margin: '0 auto', position: 'relative' }}>
      {/* Header with back button and actions */}
      <Box sx={{ position: 'sticky' }}>
        <IconButton onClick={() => navigate('/inbox')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
      </Box>
      <Stack direction={'row'} alignItems={'center'} sx={{ my: 1 }}>

        <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 'bold' }}>
          {ticket.subject || 'No Subject'}
        </Typography>
        <Chip
          label={ticket?.status || 'New'}
          color={
            ticket.status === 'closed' ? 'default' :
              ticket.status === 'pending' ? 'warning' : 'primary'
          }
          size="small"
          sx={{ mr: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          Ticket ID: {ticket?.ticketId}
        </Typography>
        <IconButton onClick={() => setIsStarred(!isStarred)} sx={{ mr: 1 }}>
          {isStarred ? <Star color="warning" /> : <StarBorder />}
        </IconButton>
        <IconButton>
          <MoreVert />
        </IconButton>
      </Stack>

      {/* Original message */}
      <Paper elevation={0} sx={{ border: 'none', }}>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Stack direction={'row'} spacing={1}>
            <Avatar sx={{
              width: 40,
              height: 40,
              bgcolor: stringToColor(ticket.customerName || ticket.customerEmail || '')
            }}>
              {getInitials(ticket.customerName || ticket.customerEmail || '')}
            </Avatar>
            <Typography variant="subtitle1" fontWeight="medium">
              {ticket.customerName || ticket.customerEmail || 'Unknown User'}
            </Typography>
          </Stack>

          <Stack direction={'row'} alignItems={'center'} spacing={2}>
            <Typography variant="caption" color="text.secondary">
              {ticket.createdAt ? renderTime(ticket.createdAt).toLocaleString() : 'Unknown date'}
            </Typography>
            <IconButton size='small' onClick={() => setIsStarred(!isStarred)} sx={{ mr: 1. }}>
              {isStarred ? <Star color="warning" sx={{ fontSize: '20px' }} /> : <StarBorder sx={{ fontSize: '20px' }} />}
            </IconButton>
            <Tooltip title="Reply" arrow>
              <IconButton
                size="small"
                onClick={() => setIsReplying(true)}
              >
                <Reply />
              </IconButton>
            </Tooltip>
            <IconButton size='small' >
              <MoreVert sx={{ fontSize: '20px' }} />
            </IconButton>
          </Stack>

        </Box>
        <Box sx={{ ml: 6, pb: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {ticket.message || 'No message content'}
          </Typography>
        </Box>
        <Divider />
      </Paper>

      {/* Replies section */}
      {ticket.replies?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            {ticket.replies.length} {ticket.replies.length === 1 ? 'Reply' : 'Replies'}
          </Typography>

          {ticket.replies.map((reply, index) => (
            <React.Fragment key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginLeft: reply.from === 'agent' ? 0 : '40px',
                  backgroundColor: reply.from === 'agent' ? '#f5f9ff' : '#ffffff'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{
                    width: 40,
                    height: 40,
                    mr: 2,
                    bgcolor: stringToColor(reply.senderName || reply.senderEmail || '')
                  }}>
                    {getInitials(reply.senderName || reply.senderEmail || '')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {reply.from === 'agent' ? 'You' : (reply.senderName || reply.senderEmail || 'Unknown')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reply.createdAt ? renderTime(reply.createdAt).toLocaleString() : 'Unknown date'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {reply.message || 'No message content'}
                </Typography>
              </Paper>
              {index < ticket.replies.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}
        </Box>
      )}

      {/* Reply editor */}
      {isReplying ? (
        <Box>
          <Stack direction={'row'} spacing={2}>
            <Avatar sx={{
              width: 40,
              height: 40,
              bgcolor: stringToColor(ticket.customerName || ticket.customerEmail || '')
            }}>
              {getInitials(ticket.customerName || ticket.customerEmail || '')}
            </Avatar>
            <Paper elevation={0} sx={{ p: 2,width:'100%' }}>
              <Typography variant="body1" sx={{ mb: 1, color: '#999' }}>
                Reply to {ticket.customerName || ticket.customerEmail || 'customer'}
              </Typography>
              <TextField
                multiline
                minRows={5}
                fullWidth
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                sx={{ mb: 2, outline: 'none', border: 'none' }}
              />
             <Stack direction={'row'} spacing={1}>

              {/* Send Button (Outlined) */}
              <Tooltip title="Send">
                <IconButton
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                  aria-label="send"
                  sx={{ borderRadius: '4px', width: 24, height: 24, }}
                >
                  <Send />
                </IconButton>
              </Tooltip>

              {/* Attach File Button */}
              <Tooltip title="Attach File">
                <IconButton
                  color='primary'
                  aria-label="attach-file"
                  sx={{ borderRadius: '4px', width: 24, height: 24, }}
                >
                  <AttachFile fontSize='small'/>
                </IconButton>
              </Tooltip>

              {/* Cancel Button */}
              <Tooltip title="Cancel">
                <IconButton
                  sx={{ borderRadius: '4px', width: 24, height: 24, }}
                  color='error'
                  variant="text"
                  onClick={() => setIsReplying(false)}
                >
                  <DeleteOutline fontSize='small' />
                </IconButton>
              </Tooltip>
              </Stack>
            </Paper>
          </Stack>
        </Box>

      ) : (
        <Button
          variant="outlined"
          startIcon={<Reply />}
          onClick={() => setIsReplying(true)}
          sx={{ mt: 2, borderRadius: '50px' }}
        >
          Reply to Ticket
        </Button>
      )}
    </Box>
  );
};

// Updated stringToColor function with null checks
function stringToColor(string) {
  if (!string) return '#cccccc'; // Default gray color

  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
}

export default InboxDetail;