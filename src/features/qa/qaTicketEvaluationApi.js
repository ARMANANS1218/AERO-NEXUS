import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const qaTicketEvaluationApi = createApi({
  reducerPath: 'qaTicketEvaluationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ['TicketEvaluation', 'TicketEvaluations', 'TicketAggregates'],
  endpoints: (builder) => ({
    rateTicket: builder.mutation({
      query: (body) => ({
        url: 'qa/ticket/evaluate',
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'TicketEvaluation', id: arg.ticketId },
        'TicketAggregates',
        'TicketEvaluations'
      ]
    }),
    getTicketEvaluation: builder.query({
      query: (ticketId) => `qa/ticket/by-ticket/${ticketId}`,
      providesTags: (result, error, ticketId) => [{ type: 'TicketEvaluation', id: ticketId }]
    }),
    listTicketEvaluations: builder.query({
      query: (params = {}) => ({
        url: 'qa/ticket/list',
        params
      }),
      providesTags: ['TicketEvaluations']
    }),
    listTicketAggregates: builder.query({
      query: (params = {}) => ({
        url: 'qa/ticket/aggregates',
        params
      }),
      providesTags: ['TicketAggregates']
    }),
    exportTicketCsv: builder.query({
      query: (params = {}) => ({
        url: 'qa/ticket/export/csv',
        params,
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        }
      })
    }),
    exportTicketXlsx: builder.query({
      query: (params = {}) => ({
        url: 'qa/ticket/export/xlsx',
        params,
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        }
      })
    })
  })
});

export const {
  useRateTicketMutation,
  useGetTicketEvaluationQuery,
  useListTicketEvaluationsQuery,
  useListTicketAggregatesQuery,
  useLazyExportTicketCsvQuery,
  useLazyExportTicketXlsxQuery
} = qaTicketEvaluationApi;
