// src/features/tickets/ticketApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ticketApi = createApi({
  reducerPath: 'ticketApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`, 
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ['Ticket'],

  endpoints: (builder) => ({
    // Create ticket
    createTicket: builder.mutation({
      query: (body) => ({
        url: '/tickets',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Ticket'],
    }),

    // Get all tickets for agent
    getAgentTickets: builder.query({
      query: () => ({
        url: '/tickets/agent-tickets',
        method: 'GET',
      }),
      providesTags: ['Ticket'],
    }),

    // Reply to ticket
    replyToTicket: builder.mutation({
      query: ({ ticketId, message }) => ({
        url: `tickets/${ticketId}/reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'Ticket', id: ticketId }
      ],
    }),

    // Get single Ticket
    getTicketId: builder.query({
      query: (ticketId) => ({
        url: `/tickets/${ticketId}`,
        method: 'GET',
      }),
    }),
     // Get replies
    getTicketReplies: builder.query({
      query: (ticketId) => ({
        url: `/tickets/replies/${ticketId}`,
        method: 'GET',
      }),
    }),

    // Filter tickets (with pagination)
    getFilteredTickets: builder.query({
      query: ({ status, page, limit }) => ({
        url: `/tickets/filter?status=${status}&page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Ticket'],
    }),
  }),
});

export const {
  useCreateTicketMutation,
  useGetAgentTicketsQuery,
  useGetTicketIdQuery,
  useReplyToTicketMutation,
  useGetTicketRepliesQuery,
  useGetFilteredTicketsQuery,
} = ticketApi;
