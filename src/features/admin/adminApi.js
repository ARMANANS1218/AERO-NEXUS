import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Employees', 'AdminDashboard', 'LocationAccessSettings', 'MyOrganization', 'OrgLocationRequests', 'OrgAllowedLocations'],
  endpoints: (builder) => ({
    getAllEmployees: builder.query({
      query: () => '/user/employees',
      providesTags: ['Employees'],
    }),
    getAssignableAgents: builder.query({
      query: () => '/user/assignable-agents',
      providesTags: ['Employees'],
    }),
    updateEmployeeStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/user/status/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    unblockLoginAccount: builder.mutation({
      query: (id) => ({
        url: `/user/unblock-login/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Employees'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/user/account/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employees'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, data }) => ({
        url: `/user/profile/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Employees'],
    }),
    resetEmployeePassword: builder.mutation({
      query: ({ id, password }) => ({
        url: `/user/reset-password/${id}`,
        method: 'PUT',
        body: { password },
      }),
      invalidatesTags: ['Employees'],
    }),
    getQATeam: builder.query({
      query: () => '/user/qa',
      providesTags: ['Employees'],
    }),
    getAgentTeam: builder.query({
      query: () => '/user/agents',
      providesTags: ['Employees'],
    }),
    getAdminDashboardStats: builder.query({
      query: () => '/dashboard/admin/stats',
      providesTags: ['AdminDashboard'],
    }),
    getAgentPerformanceList: builder.query({
      query: () => '/dashboard/agents/performance',
      providesTags: ['AdminDashboard'],
    }),
    getQAPerformanceList: builder.query({
      query: () => '/dashboard/qa/performance',
      providesTags: ['AdminDashboard'],
    }),
    // Escalation hierarchy (Tier -> Department -> Users)
    getEscalationHierarchy: builder.query({
      query: () => '/user/escalation/hierarchy',
      providesTags: ['Employees']
    }),
    // ===== Organization Location Access =====
    createOrgLocationRequest: builder.mutation({
      query: (body) => ({
        url: '/location/org/requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OrgLocationRequests','OrgAllowedLocations']
    }),
    getOrgLocationRequests: builder.query({
      query: () => '/location/org/requests',
      providesTags: ['OrgLocationRequests']
    }),
    getOrgAllowedLocations: builder.query({
      query: () => '/location/org/allowed',
      providesTags: ['OrgAllowedLocations']
    }),
    // SuperAdmin filtered queries by organization
    getOrgLocationRequestsByOrg: builder.query({
      query: (organizationId) => `/location/org/requests?organizationId=${organizationId}`,
      providesTags: ['OrgLocationRequests']
    }),
    getOrgAllowedLocationsByOrg: builder.query({
      query: (organizationId) => `/location/org/allowed?organizationId=${organizationId}`,
      providesTags: ['OrgAllowedLocations']
    }),
    // SuperAdmin actions on requests and allowed locations
    reviewOrgLocationRequest: builder.mutation({
      query: ({ id, action, reviewComments }) => ({
        url: `/location/org/requests/${id}/review`,
        method: 'PUT',
        body: { action, reviewComments }
      }),
      invalidatesTags: ['OrgLocationRequests','OrgAllowedLocations']
    }),
    stopAccessByOrgRequest: builder.mutation({
      query: (id) => ({
        url: `/location/org/requests/${id}/stop-access`,
        method: 'PUT'
      }),
      invalidatesTags: ['OrgLocationRequests','OrgAllowedLocations']
    }),
    startAccessByOrgRequest: builder.mutation({
      query: (id) => ({
        url: `/location/org/requests/${id}/start-access`,
        method: 'PUT'
      }),
      invalidatesTags: ['OrgLocationRequests','OrgAllowedLocations']
    }),
    deleteOrgLocationRequest: builder.mutation({
      query: (requestId) => ({
        url: `/location/org/requests/${requestId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['OrgLocationRequests']
    }),
    revokeOrgAllowedLocation: builder.mutation({
      query: (id) => ({
        url: `/location/org/allowed/${id}/revoke`,
        method: 'PUT'
      }),
      invalidatesTags: ['OrgAllowedLocations']
    }),
    deleteOrgAllowedLocation: builder.mutation({
      query: (id) => ({
        url: `/location/org/allowed/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['OrgAllowedLocations']
    }),
    getOrgLocationSummary: builder.query({
      query: () => '/location/org/summary',
      providesTags: ['OrgAllowedLocations','OrgLocationRequests']
    }),

    // ==================== LOCATION ACCESS SETTINGS (Admin) ====================
    getLocationAccessSettings: builder.query({
      query: () => '/admin/location-access',
      providesTags: ['LocationAccessSettings']
    }),
    toggleLocationAccess: builder.mutation({
      query: (body) => ({
        url: '/admin/location-access/toggle',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['LocationAccessSettings']
    }),
    getMyOrganization: builder.query({
      query: () => '/admin/organization',
      providesTags: ['MyOrganization']
    }),

    // ==================== LOCATION ACCESS SETTINGS (SuperAdmin) ====================
    getSuperAdminLocationAccessSettings: builder.query({
      query: (orgId) => `/superadmin/organizations/${orgId}/location-access`,
      providesTags: ['LocationAccessSettings']
    }),
    toggleSuperAdminLocationAccess: builder.mutation({
      query: ({ orgId, ...body }) => ({
        url: `/superadmin/organizations/${orgId}/location-access/toggle`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['LocationAccessSettings']
    }),
  }),
});

export const {
  useGetAllEmployeesQuery,
  useGetAssignableAgentsQuery,
  useUpdateEmployeeStatusMutation,
  useUnblockLoginAccountMutation,
  useDeleteEmployeeMutation,
  useUpdateEmployeeMutation,
  useResetEmployeePasswordMutation,
  useGetQATeamQuery,
  useGetAgentTeamQuery,
  useGetAdminDashboardStatsQuery,
  useGetAgentPerformanceListQuery,
  useGetQAPerformanceListQuery,
  useGetEscalationHierarchyQuery,
  useCreateOrgLocationRequestMutation,
  useGetOrgLocationRequestsQuery,
  useGetOrgAllowedLocationsQuery,
  useGetOrgLocationSummaryQuery,
  useGetOrgLocationRequestsByOrgQuery,
  useGetOrgAllowedLocationsByOrgQuery,
  useReviewOrgLocationRequestMutation,
  useStopAccessByOrgRequestMutation,
  useStartAccessByOrgRequestMutation,
  useDeleteOrgLocationRequestMutation,
  useRevokeOrgAllowedLocationMutation,
  useDeleteOrgAllowedLocationMutation,
  useGetLocationAccessSettingsQuery,
  useToggleLocationAccessMutation,
  useGetMyOrganizationQuery,
  useGetSuperAdminLocationAccessSettingsQuery,
  useToggleSuperAdminLocationAccessMutation,
} = adminApi;
