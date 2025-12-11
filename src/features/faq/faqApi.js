import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const faqApi = createApi({
  reducerPath: 'faqApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/faq`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['FAQ'],
  endpoints: (builder) => ({
    // Get all FAQs and Common Replies
    getFaqs: builder.query({
      query: (type) => ({
        url: '/',
        params: type ? { type } : {},
      }),
      providesTags: ['FAQ'],
    }),

    // Create new FAQ or Common Reply
    createFaq: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FAQ'],
    }),

    // Update FAQ or Common Reply
    updateFaq: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['FAQ'],
    }),

    // Delete FAQ or Common Reply
    deleteFaq: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FAQ'],
    }),
  }),
});

export const {
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = faqApi;
