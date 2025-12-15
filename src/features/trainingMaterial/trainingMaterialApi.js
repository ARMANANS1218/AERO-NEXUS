import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const trainingMaterialApi = createApi({
  reducerPath: 'trainingMaterialApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/training-material`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['TrainingMaterial'],
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['TrainingMaterial'],
    }),

    // Get all training materials (with optional category filter)
    getTrainingMaterials: builder.query({
      query: (category) => ({
        url: '/',
        params: category ? { category } : {},
      }),
      providesTags: ['TrainingMaterial'],
    }),

    // Get single training material by ID
    getTrainingMaterialById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ['TrainingMaterial'],
    }),

    // Upload training material (Admin only)
    uploadTrainingMaterial: builder.mutation({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['TrainingMaterial'],
    }),

    // Update training material (Admin only)
    updateTrainingMaterial: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['TrainingMaterial'],
    }),

    // Delete training material (Admin only)
    deleteTrainingMaterial: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TrainingMaterial'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetTrainingMaterialsQuery,
  useGetTrainingMaterialByIdQuery,
  useUploadTrainingMaterialMutation,
  useUpdateTrainingMaterialMutation,
  useDeleteTrainingMaterialMutation,
} = trainingMaterialApi;
