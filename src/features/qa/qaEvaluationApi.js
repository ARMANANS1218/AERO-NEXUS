import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const qaEvaluationApi = createApi({
  reducerPath: 'qaEvaluationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ['Evaluation','Evaluations','Aggregates'],
  endpoints: (builder) => ({
    rateQuery: builder.mutation({
      query: (body) => ({
        url: 'qa/evaluate',
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, arg) => [ { type: 'Evaluation', id: arg.petitionId }, 'Aggregates' ]
    }),
    getEvaluation: builder.query({
      query: (petitionId) => `qa/by-petition/${petitionId}`,
      providesTags: (result, error, petitionId) => [ { type: 'Evaluation', id: petitionId } ]
    }),
    listEvaluations: builder.query({
      query: (params = {}) => ({
        url: 'qa/list',
        params
      }),
      providesTags: ['Evaluations']
    }),
    listAggregates: builder.query({
      query: (params = {}) => ({
        url: 'qa/aggregates',
        params
      }),
      providesTags: ['Aggregates']
    }),
    exportCsv: builder.query({
      query: (params = {}) => ({
        url: 'qa/export/csv',
        params,
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        }
      })
    }),
    exportXlsx: builder.query({
      query: (params = {}) => ({
        url: 'qa/export/xlsx',
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
  useRateQueryMutation,
  useGetEvaluationQuery,
  useListEvaluationsQuery,
  useListAggregatesQuery,
  useExportCsvQuery,
  useExportXlsxQuery,
  useLazyExportCsvQuery,
  useLazyExportXlsxQuery
} = qaEvaluationApi;
