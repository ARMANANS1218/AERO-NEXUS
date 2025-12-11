import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const emailApi = createApi({
  reducerPath: 'emailApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/email`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Email', 'Ticket'],
  endpoints: (builder) => ({
    // Send email
    sendEmail: builder.mutation({
      query: (data) => ({
        url: '/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Email', 'Ticket'],
    }),

    // Send email with template
    sendEmailWithTemplate: builder.mutation({
      query: (data) => ({
        url: '/send-with-template',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Email', 'Ticket'],
    }),

    // Get all emails for a ticket
    getTicketEmails: builder.query({
      query: (ticketId) => `/ticket/${ticketId}`,
      providesTags: ['Email'],
    }),

    // Get single email by ID
    getEmailById: builder.query({
      query: (emailId) => `/${emailId}`,
      providesTags: ['Email'],
    }),

    // Mark email as read
    markEmailAsRead: builder.mutation({
      query: (emailId) => ({
        url: `/${emailId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Email'],
    }),

    // Delete email
    deleteEmail: builder.mutation({
      query: (emailId) => ({
        url: `/${emailId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Email'],
    }),

    // Get unread email count
    getUnreadCount: builder.query({
      query: () => '/unread/count',
      providesTags: ['Email'],
    }),

    // Search emails
    searchEmails: builder.query({
      query: (params) => ({
        url: '/search',
        params,
      }),
      providesTags: ['Email'],
    }),
  }),
});

export const {
  useSendEmailMutation,
  useSendEmailWithTemplateMutation,
  useGetTicketEmailsQuery,
  useGetEmailByIdQuery,
  useMarkEmailAsReadMutation,
  useDeleteEmailMutation,
  useGetUnreadCountQuery,
  useSearchEmailsQuery,
} = emailApi;
