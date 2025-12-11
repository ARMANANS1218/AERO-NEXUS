// src/features/customer/customerApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/customer`, 
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['CustomerProfile'],
  endpoints: (builder) => ({
    // Get customer profile
    getCustomerProfile: builder.query({
      query: () => '/profile',
      providesTags: ['CustomerProfile'],
    }),
    
    // Update customer profile
    updateCustomerProfile: builder.mutation({
      query: (formData) => ({
        url: '/profile',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['CustomerProfile'],
    }),
    
    // Register customer
    registerCustomer: builder.mutation({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // Login customer
    loginCustomer: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useRegisterCustomerMutation,
  useLoginCustomerMutation,
} = customerApi;
