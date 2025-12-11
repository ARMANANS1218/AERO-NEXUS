// src/features/auth/authApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/user`, 
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
    tagTypes: ["User"],
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (userData) => ({
        url: '/sign-up',
        method: 'POST',
        body: userData,
      }),
    }),
    loginUser: builder.mutation({
      query: (data) => ({
        url: '/login',
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query({
      query: () => '/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (formData) => ({
        url: '/profile-update',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
    deleteAccount: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
    }),
    getAllAgents: builder.query({
      query: () => '/',
    }),
    getAllCustomer: builder.query({
      query: () => '/customers',
      providesTags: ["User"],
    }),
    requestOtp: builder.mutation({
      query: (data) => ({
        url: '/reset-otp-pass',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/change-otp-pass/verify',
        method: 'POST',
        body: data,
      }),
    }),
    toggleBreak: builder.mutation({
      query: () => ({
        url: '/break',
        method: 'PUT',
      }),
    }),
    acceptTerms: builder.mutation({
      query: () => ({
        url: '/accept-terms',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useGetAllCustomerQuery,
  useLoginUserMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
  useGetAllAgentsQuery,
  useRequestOtpMutation,
  useResetPasswordMutation,
  useToggleBreakMutation,
  useAcceptTermsMutation,
} = authApi;
