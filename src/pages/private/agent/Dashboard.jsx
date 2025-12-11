import React, { useState } from 'react';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { useGetDashboardStatsQuery, useGetWeeklyPerformanceQuery } from '../../../features/dashboard/dashboardApi';
import { CircularProgress } from '@mui/material';
import EnhancedDashboard from '../../../components/Dashboard/EnhancedDashboard';
import { BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const { data: statsData, isLoading: statsLoading, isError: statsError } = useGetDashboardStatsQuery();
  const { data: weeklyData, isLoading: weeklyLoading } = useGetWeeklyPerformanceQuery();

  const isLoading = profileLoading || statsLoading || weeklyLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-red-600 dark:text-red-400">Failed to load dashboard statistics</div>
      </div>
    );
  }

  // Get real dashboard stats from API
  const dashboardStats = statsData?.data || {};

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="px-4 md:px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && (
          <EnhancedDashboard 
            userRole="Agent" 
            dashboardStats={dashboardStats}
            weeklyData={weeklyData?.data || []}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;