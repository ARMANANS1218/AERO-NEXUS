import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/dashboard`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['DashboardStats', 'WeeklyPerformance', 'Trends'],
  endpoints: (builder) => ({
    /**
     * Get dashboard statistics (auto-determines role)
     * For Agent: activeChats, pendingQueries, resolvedToday, avgResponseTime, callsMade, emailsSent, screenshotsCreated, etc.
     * For QA: ticketsToReview, approvedToday, rejectedToday, avgQualityScore, pendingReviews, etc.
     */
    getDashboardStats: builder.query({
      query: () => '/stats',
      providesTags: ['DashboardStats'],
    }),

    /**
     * Get Agent-specific dashboard statistics
     */
    getAgentStats: builder.query({
      query: () => '/agent/stats',
      providesTags: ['DashboardStats'],
    }),

    /**
     * Get QA-specific dashboard statistics
     */
    getQAStats: builder.query({
      query: () => '/qa/stats',
      providesTags: ['DashboardStats'],
    }),

    /**
     * Get weekly performance data for charts (last 7 days)
     * Returns: [{ day: 'Mon', value: 5, date: '2024-01-15' }, ...]
     */
    getWeeklyPerformance: builder.query({
      query: () => '/weekly-performance',
      providesTags: ['WeeklyPerformance'],
    }),

    /**
     * Get 30-day performance trends
     * Returns: [{ date: '2024-01-01', resolved: 5, pending: 3 }, ...]
     */
    getPerformanceTrends: builder.query({
      query: () => '/trends',
      providesTags: ['Trends'],
    }),

    /**
     * Refetch dashboard stats on demand
     */
    refreshDashboardStats: builder.mutation({
      queryFn: async (arg, api, extraOptions, baseQuery) => {
        const result = await baseQuery('/stats');
        if (result.data) {
          api.dispatch(dashboardApi.util.invalidateTags(['DashboardStats']));
        }
        return result;
      },
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetAgentStatsQuery,
  useGetQAStatsQuery,
  useGetWeeklyPerformanceQuery,
  useGetPerformanceTrendsQuery,
  useRefreshDashboardStatsMutation,
} = dashboardApi;
