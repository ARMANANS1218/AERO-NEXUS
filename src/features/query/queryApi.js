import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const queryApi = createApi({
  reducerPath: 'queryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/query`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Query'],
  endpoints: (builder) => ({
    // Create new query
    createQuery: builder.mutation({
      query: (data) => ({
        url: '/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Query'],
    }),

    // Get customer's queries
    getCustomerQueries: builder.query({
      query: (status) => ({
        url: '/my-queries',
        params: status ? { status } : {},
      }),
      providesTags: ['Query'],
    }),

    // Get all queries (for Agent/QA)
    getAllQueries: builder.query({
      query: ({ status, category, assignedTo, page, limit, sort, transferTarget } = {}) => ({
        url: '/all',
        params: { status, category, assignedTo, page, limit, sort, transferTarget },
      }),
      providesTags: ['Query'],
    }),

    // Get single query by petition ID
    getQueryByPetitionId: builder.query({
      query: (petitionId) => `/${petitionId}`,
      providesTags: (result, error, petitionId) => [{ type: 'Query', id: petitionId }],
    }),

    // Get escalation chain for a query
    getEscalationChain: builder.query({
      query: (petitionId) => `/${petitionId}/escalation-chain`,
      providesTags: (result, error, petitionId) => [{ type: 'Query', id: `chain-${petitionId}` }],
    }),

    // Accept query
    acceptQuery: builder.mutation({
      query: (petitionId) => ({
        url: `/${petitionId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Query'],
    }),

    // Send message in query
    sendQueryMessage: builder.mutation({
      query: ({ petitionId, message }) => ({
        url: `/${petitionId}/message`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: (result, error, { petitionId }) => [
        { type: 'Query', id: petitionId },
      ],
    }),

    // Transfer query
    transferQuery: builder.mutation({
      query: ({ petitionId, toAgentId, reason }) => ({
        url: `/${petitionId}/transfer`,
        method: 'POST',
        body: { toAgentId, reason },
      }),
      invalidatesTags: ['Query'],
    }),

    // Request transfer (recipient must accept)
    transferRequest: builder.mutation({
      query: ({ petitionId, toAgentId, reason }) => ({
        url: `/${petitionId}/transfer/request`,
        method: 'POST',
        body: { toAgentId, reason },
      }),
      invalidatesTags: ['Query'],
    }),

    // Resolve query
    resolveQuery: builder.mutation({
      query: (petitionId) => ({
        url: `/${petitionId}/resolve`,
        method: 'POST',
      }),
      invalidatesTags: ['Query'],
    }),

    // Submit feedback
    submitFeedback: builder.mutation({
      query: ({ petitionId, rating, comment }) => ({
        url: `/${petitionId}/feedback`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (result, error, { petitionId }) => [
        { type: 'Query', id: petitionId },
      ],
    }),

    // Reopen query
    reopenQuery: builder.mutation({
      query: ({ petitionId, message }) => ({
        url: `/${petitionId}/reopen`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Query'],
    }),

    // Get available agents
    getAvailableAgents: builder.query({
      query: (category) => ({
        url: '/available-agents',
        params: category ? { category } : {},
      }),
    }),

    // Recent escalations for dashboard (QA/TL/Admin)
    getRecentEscalations: builder.query({
      query: ({ limit } = {}) => ({
        url: '/escalations/recent',
        params: limit ? { limit } : {},
      }),
      providesTags: ['Query'],
    }),

    // Delete query by petitionId
    deleteQuery: builder.mutation({
      query: (petitionId) => ({
        url: `/${petitionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Query'],
    }),
  }),
});

export const {
  useCreateQueryMutation,
  useGetCustomerQueriesQuery,
  useGetAllQueriesQuery,
  useGetQueryByPetitionIdQuery,
  useGetEscalationChainQuery,
  useAcceptQueryMutation,
  useSendQueryMessageMutation,
  useTransferQueryMutation,
  useTransferRequestMutation,
  useResolveQueryMutation,
  useSubmitFeedbackMutation,
  useReopenQueryMutation,
  useGetAvailableAgentsQuery,
  useGetRecentEscalationsQuery,
  useDeleteQueryMutation,
} = queryApi;
