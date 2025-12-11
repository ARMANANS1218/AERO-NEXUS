import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Grid, Paper, TableContainer, Table, TableHead,
  TableCell, TableBody, Tooltip, TableRow, OutlinedInput, Chip,
  Button, Checkbox, InputAdornment, IconButton, Avatar, Stack,
  Menu, MenuItem, Skeleton
} from '@mui/material';
import { Search, Star, StarBorder, Reply, Remove } from '@mui/icons-material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useNavigate } from 'react-router-dom';
import { useGetAgentTicketsQuery, useReplyToTicketMutation } from '../../features/ticket/ticketApi';
import renderTime from '../../utils/renderTime';
import Paginations from '../../components/common/Paginations';
import InboxModal from './InboxModal';

const tableHeaders = ['Star', 'Customer', 'Subject', 'Status', 'Last Activity', 'Action'];
const statusOptions = ['All', 'Open', 'In Progress', 'Escalated', 'Resolved'];

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 60%)`;
};

const StatusFilterHeader = ({ onSelectStatus, current }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <>
      <Box onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <Typography variant="body2" fontWeight={600}>{current}</Typography>
        <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
      </Box>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {statusOptions.map(status => (
          <MenuItem key={status} onClick={() => { setAnchorEl(null); onSelectStatus(status); }}>
            {status}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const Ticket = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [modalType, setModalType] = useState('');

  const { data, isLoading, error } = useGetAgentTicketsQuery();
  const [replyToTicket] = useReplyToTicketMutation();

  const tickets = data?.data || [];

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tickets.filter(ticket => {
      const matchesSearch = ticket.subject?.toLowerCase().includes(query) ||
        ticket.customerEmail?.toLowerCase().includes(query) ||
        ticket.customerName?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleRowClick = (ticket) => navigate(`/agent/inbox/${ticket.ticketId}`, { state: { ticketData: ticket, replyMode: true } });

  const handleQuickReply = (ticket, e) => {
    e.stopPropagation();
    setReplyingTo(ticket);
    setModalType('reply');
    setOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!replyingTo || !replyContent.trim()) return;
    try {
      await replyToTicket({ ticketId: replyingTo._id, message: replyContent }).unwrap();
      setReplyContent('');
      setOpen(false);
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  return (
    <>
      <Paper elevation={0} sx={{ p: 2 }}>
        <Grid container spacing={2} justifyContent="space-between" mb={2}>
          <Grid size={{xs:12,md:4}}>
            <Typography variant="h6">Tickets [{filteredData.length}]</Typography>
          </Grid>
          <Grid size={{xs:12,md:4}}>
            <OutlinedInput
              fullWidth
              size="small"
              type="search"
              placeholder="Search tickets..."
              startAdornment={<InputAdornment position="start"><Search sx={{ color: '#999' }} /></InputAdornment>}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ backgroundColor: '#fff' }}
            />
          </Grid>
        </Grid>

        <TableContainer sx={{ maxHeight: 640 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#ced1e371' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    color="success"
                    onClick={() => setSelectedItems(selectedItems.length === tickets.length ? [] : tickets.map(t => t._id))}
                    checked={selectedItems.length === tickets.length && tickets.length > 0}
                  />
                </TableCell>
                {tableHeaders.map((header, index) => (
                  <TableCell key={index}>
                    {header === 'Status' ? (
                      <StatusFilterHeader onSelectStatus={setStatusFilter} current={statusFilter} />
                    ) : (
                      <Typography variant="body2" fontWeight={600}>{header}</Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading
                ? Array.from({ length: rowsPerPage }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: tableHeaders.length + 1 }).map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton variant="text" height={30} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
                : paginatedData.length ? paginatedData.map((ticket) => (
                  <TableRow
                    key={ticket._id}
                    hover
                    onClick={() => handleRowClick(ticket)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedItems.includes(ticket._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedItems(prev =>
                            prev.includes(ticket._id)
                              ? prev.filter(id => id !== ticket._id)
                              : [...prev, ticket._id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Star/Unstar" arrow>
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          {ticket.starred ? <Star color="warning" fontSize="small" /> : <StarBorder fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 25, height: 25, mr: 1, bgcolor: stringToColor(ticket.customerName || ticket.customerEmail) }}>
                          {getInitials(ticket.customerName || ticket.customerEmail)}
                        </Avatar>
                        <Stack>
                          <Typography>{ticket.customerName || ticket.customerEmail.split('@')[0]}</Typography>
                          <Typography variant="body2" color="text.secondary">{ticket.customerEmail}</Typography>
                        </Stack>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight="bold">{ticket.subject || 'No subject'}</Typography>
                        <Remove sx={{ fontSize: '15px' }} />
                        <Typography variant="body2">{ticket.message || 'No message'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ticket.status}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{renderTime(ticket.updatedAt || ticket.createdAt)}</TableCell>
                    <TableCell>
                      <Tooltip title="Quick Reply" arrow>
                        <IconButton size="small" onClick={(e) => handleQuickReply(ticket, e)}>
                          <Reply fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length + 1} align="center">No Ticket Found</TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </TableContainer>

        <Paginations
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      </Paper>

      {modalType === 'reply' && replyingTo && (
        <InboxModal
          open={open}
          handleClose={() => setOpen(false)}
          title={`Reply to ${replyingTo.subject}`}
          content={
            <Box sx={{ mt: 2 }}>
              <Typography><strong>To:</strong> {replyingTo.customerEmail}</Typography>
              <Typography><strong>Subject:</strong> {replyingTo.subject}</Typography>
              <OutlinedInput
                multiline rows={6} fullWidth
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                sx={{ mt: 2, mb: 2 }}
              />
              <Button variant="contained" onClick={handleReplySubmit} disabled={!replyContent.trim()}>Send Reply</Button>
            </Box>
          }
        />
      )}
    </>
  );
};

export default Ticket;
