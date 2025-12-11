import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const geocamApi = createApi({
  reducerPath: 'geocamApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/geocam`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['GeocamCaptures'],
  endpoints: (builder) => ({
    createLink: builder.mutation({
      query: ({ employeeName, role, expiresInMinutes }) => ({
        url: '/link',
        method: 'POST',
        body: { employeeName, role, expiresInMinutes },
      }),
    }),
    listCaptures: builder.query({
      query: (params) => {
        const { status = 'all', search = '', page = 1, limit = 100 } = params || {};
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        if (status && status !== 'all') queryParams.append('status', status);
        if (search) queryParams.append('search', search);
        return `/captures?${queryParams.toString()}`;
      },
      providesTags: ['GeocamCaptures'],
    }),
    updateCaptureMeta: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/capture/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['GeocamCaptures'],
    }),
    deleteCapture: builder.mutation({
      query: (id) => ({
        url: `/capture/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GeocamCaptures'],
    }),
    // Public endpoints (no auth needed)
    getPublicSession: builder.query({
      query: (token) => `/session/${token}`,
    }),
    submitPublicCapture: builder.mutation({
      query: ({ token, payload }) => ({
        url: `/submit/${token}`,
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
  }),
});

export const {
  useCreateLinkMutation,
  useListCapturesQuery,
  useUpdateCaptureMetaMutation,
  useDeleteCaptureMutation,
  useGetPublicSessionQuery,
  useSubmitPublicCaptureMutation,
} = geocamApi;
