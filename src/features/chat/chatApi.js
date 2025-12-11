import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/chatmessage`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ['Chat'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: ({ to, message }) => ({
        url: '/send',
        method: 'POST',
        body: { to, message }
      }),
      invalidatesTags: ['Chat']
    }),
   getConversation: builder.query({
      query: (id) => `/conversation/${id}`,
      providesTags: ['Chat']
    }),
    replyToPetition: builder.mutation({
      query: ({ petitionId, message }) => ({
        url: `${petitionId}/reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: (result, error, { petitionId }) => [
        { type: 'Chat', id: petitionId }
      ],
    }),
    transferPetition: builder.mutation({
      query: ({ petitionId, newAgentId }) => ({
        url: `/${petitionId}/petition-transfer`,
        method: "POST",
        body: { petitionId, newAgentId },
      }),
    }),
  })
});

export const {useSendMessageMutation, useGetConversationQuery , useReplyToPetitionMutation,useTransferPetitionMutation } = chatApi;
