import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const emailTicketApi = createApi({
  reducerPath: 'emailTicketApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/email-ticketing`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['EmailTicket', 'EmailTicketMessages'],
  
  endpoints: (builder) => ({
    // List tickets with filters
    listTickets: builder.query({
      query: ({ status, assignedTo, channel, search, page = 1, limit = 20, teamInbox, view, sortBy = 'activity', priority }) => ({
        url: '/tickets',
        params: { status, assignedTo, channel, search, page, limit, teamInbox, view, sortBy, priority },
      }),
      providesTags: (result) =>
        result?.tickets
          ? [
              ...result.tickets.map((ticket) => ({ type: 'EmailTicket', id: ticket.ticketId })),
              { type: 'EmailTicket', id: 'LIST' },
            ]
          : [{ type: 'EmailTicket', id: 'LIST' }],
    }),

    // Get single ticket with messages
    getTicket: builder.query({
      query: (ticketId) => `/tickets/${ticketId}`,
      providesTags: (result, error, ticketId) => [
        { type: 'EmailTicket', id: ticketId },
        { type: 'EmailTicketMessages', id: ticketId },
      ],
    }),

    // Create new ticket (internal)
    createTicket: builder.mutation({
      query: (payload) => ({
        url: '/tickets/create',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'EmailTicket', id: 'LIST' }],
    }),

    // Reply to ticket
    replyToTicket: builder.mutation({
      query: ({ ticketId, message, html, senderType = 'agent', sendEmail = true }) => ({
        url: '/tickets/reply',
        method: 'POST',
        body: { ticketId, message, html, senderType, sendEmail },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'EmailTicket', id: ticketId },
        { type: 'EmailTicketMessages', id: ticketId },
      ],
    }),

    // Update ticket status
    updateTicketStatus: builder.mutation({
      query: ({ ticketId, status }) => ({
        url: `/tickets/${ticketId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'EmailTicket', id: ticketId },
        { type: 'EmailTicket', id: 'LIST' },
      ],
    }),

    // Assign ticket
    assignTicket: builder.mutation({
      query: ({ ticketId, assignedTo }) => ({
        url: `/tickets/${ticketId}/assign`,
        method: 'PUT',
        body: { assignedTo },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'EmailTicket', id: ticketId },
        { type: 'EmailTicket', id: 'LIST' },
      ],
    }),

    // Update tags
    updateTicketTags: builder.mutation({
      query: ({ ticketId, tags }) => ({
        url: `/tickets/${ticketId}/tags`,
        method: 'PUT',
        body: { tags },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'EmailTicket', id: ticketId },
        { type: 'EmailTicket', id: 'LIST' },
      ],
    }),

    // Update team inbox
    updateTeamInbox: builder.mutation({
      query: ({ ticketId, teamInbox }) => ({
        url: `/tickets/${ticketId}/team`,
        method: 'PUT',
        body: { teamInbox },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'EmailTicket', id: ticketId },
        { type: 'EmailTicket', id: 'LIST' },
      ],
    }),

    // Delete ticket
    deleteTicket: builder.mutation({
      query: (ticketId) => ({
        url: `/tickets/${ticketId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['EmailTicket'],
    }),

    // Admin: Get email configs
    getEmailConfigs: builder.query({
      query: () => '/admin/configs',
      providesTags: ['EmailConfig'],
    }),

    // Admin: Create email config
    createEmailConfig: builder.mutation({
      query: (payload) => ({
        url: '/admin/configs',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['EmailConfig'],
    }),

    // Admin: Update email config
    updateEmailConfig: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/admin/configs/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['EmailConfig'],
    }),

    // Admin: Delete email config
    deleteEmailConfig: builder.mutation({
      query: (id) => ({
        url: `/admin/configs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['EmailConfig'],
    }),

    // Admin: Test email config
    testEmailConfig: builder.mutation({
      query: (id) => ({
        url: `/admin/configs/${id}/test`,
        method: 'POST',
      }),
    }),

    // Get ticket statistics
    getTicketStats: builder.query({
      query: () => '/stats',
      providesTags: ['EmailTicket'],
    }),
  }),
});

export const {
  useListTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useReplyToTicketMutation,
  useUpdateTicketStatusMutation,
  useAssignTicketMutation,
  useUpdateTicketTagsMutation,
  useUpdateTeamInboxMutation,
  useDeleteTicketMutation,
  useGetEmailConfigsQuery,
  useCreateEmailConfigMutation,
  useUpdateEmailConfigMutation,
  useDeleteEmailConfigMutation,
  useTestEmailConfigMutation,
  useGetTicketStatsQuery,
} = emailTicketApi;
