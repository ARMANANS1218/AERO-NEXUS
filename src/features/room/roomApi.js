import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const roomApi = createApi({
  reducerPath: "roomApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Room"],
  endpoints: (builder) => ({
    createCall: builder.mutation({
      query: (body) => ({
        url: "/room",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Room"],
    }),
    updateCallStatus: builder.mutation({
      query: ({ roomId, status }) => ({
        url: `/room/${roomId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Room"],
    }),
    getCallHistory: builder.query({
      query: () => "/room/history",
      providesTags: ["Room"],
    }),
    deleteCallLog: builder.mutation({
      query: (callId) => ({
        url: `/room/${callId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Room"],
    }),
    clearCallLogsDate: builder.mutation({
      query: (dateKey) => ({
        url: `/room/clear/date`,
        method: "DELETE",
        body: { dateKey },
      }),
      invalidatesTags: ["Room"],
    }),
    clearAllCallLogs: builder.mutation({
      query: () => ({
        url: `/room/clear/all`,
        method: "DELETE",
      }),
      invalidatesTags: ["Room"],
    }),
  }),
});

export const {
  useCreateCallMutation,
  useUpdateCallStatusMutation,
  useGetCallHistoryQuery,
  useDeleteCallLogMutation,
  useClearCallLogsDateMutation,
  useClearAllCallLogsMutation,
} = roomApi;
