import React, { useState } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, Star, CheckCircle, Schedule } from '@mui/icons-material';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';

const AgentsPerformance = () => {
  const { data: employeesData, isLoading } = useGetAllEmployeesQuery();
  const [sortBy, setSortBy] = useState('performance');

  const agents = employeesData?.data?.filter(emp => emp.role === 'Agent') || [];

  // Mock performance data (can be replaced with real API data)
  const agentsWithPerformance = agents.map(agent => ({
    ...agent,
    performance: {
      ticketsResolved: Math.floor(Math.random() * 100) + 20,
      avgResponseTime: (Math.random() * 10 + 1).toFixed(1), // minutes
      satisfaction: (Math.random() * 2 + 3).toFixed(1), // out of 5
      activeChats: Math.floor(Math.random() * 10),
      totalHours: Math.floor(Math.random() * 160) + 40,
    }
  }));

  const getPerformanceColor = (satisfaction) => {
    if (satisfaction >= 4.5) return 'text-green-600 dark:text-green-400';
    if (satisfaction >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceIcon = (satisfaction) => {
    if (satisfaction >= 4.5) return <TrendingUp className="text-green-600 dark:text-green-400" />;
    if (satisfaction >= 3.5) return <TrendingUp className="text-yellow-600 dark:text-yellow-400" />;
    return <TrendingDown className="text-red-600 dark:text-red-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Agents Performance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and analyze agent performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {agents.length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Star className="text-blue-600 dark:text-blue-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Satisfaction</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {(agentsWithPerformance.reduce((acc, a) => acc + parseFloat(a.performance.satisfaction), 0) / agents.length || 0).toFixed(1)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="text-green-600 dark:text-green-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets Resolved</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {agentsWithPerformance.reduce((acc, a) => acc + a.performance.ticketsResolved, 0)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <TrendingUp className="text-indigo-600 dark:text-indigo-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {(agentsWithPerformance.reduce((acc, a) => acc + parseFloat(a.performance.avgResponseTime), 0) / agents.length || 0).toFixed(1)}m
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Schedule className="text-amber-600 dark:text-amber-400" fontSize="large" />
            </div>
          </div>
        </div>
      </div>

      {/* Agents Performance Table */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-2 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Agent Performance Details
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tickets Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Satisfaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Active Chats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Total Hours
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {agentsWithPerformance.map((agent) => (
                <tr key={agent._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={agent.profileImage}
                        alt={agent.name}
                        className="w-10 h-10 bg-blue-500"
                      >
                        {agent.name.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                    }`}>
                      {agent.is_active ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">
                    {agent.performance.ticketsResolved}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {agent.performance.avgResponseTime} min
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getPerformanceIcon(agent.performance.satisfaction)}
                      <span className={`font-semibold ${getPerformanceColor(agent.performance.satisfaction)}`}>
                        {agent.performance.satisfaction}/5.0
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {agent.performance.activeChats}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {agent.performance.totalHours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentsPerformance;
