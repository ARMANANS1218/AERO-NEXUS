import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api/v1/screenshot`;

export const screenshotApi = createApi({
  reducerPath: 'screenshotApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Screenshot'],
  endpoints: (builder) => ({
    // Upload screenshot
    uploadScreenshot: builder.mutation({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Screenshot'],
    }),

    // Get all screenshots (with filters)
    getAllScreenshots: builder.query({
      query: ({ roomId, petitionId, limit, page } = {}) => {
        const params = new URLSearchParams();
        if (roomId) params.append('roomId', roomId);
        if (petitionId) params.append('petitionId', petitionId);
        if (limit) params.append('limit', limit);
        if (page) params.append('page', page);
        return `/?${params.toString()}`;
      },
      providesTags: ['Screenshot'],
    }),

    // Get screenshots for a specific petition
    getScreenshotsByPetition: builder.query({
      query: (petitionId) => `/petition/${petitionId}`,
      providesTags: ['Screenshot'],
    }),

    // Get single screenshot by ID
    getScreenshotById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Screenshot', id }],
    }),

    // Delete screenshot
    deleteScreenshot: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Screenshot'],
    }),
  }),
});

export const {
  useUploadScreenshotMutation,
  useGetAllScreenshotsQuery,
  useGetScreenshotsByPetitionQuery,
  useGetScreenshotByIdQuery,
  useDeleteScreenshotMutation,
} = screenshotApi;
