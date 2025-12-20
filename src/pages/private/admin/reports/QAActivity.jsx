import React, { useState } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { AccessTime, Login, Logout, Coffee, Work } from '@mui/icons-material';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import { format } from 'date-fns';

const QAActivity = () => {
  const { data: employeesData, isLoading } = useGetAllEmployeesQuery();
  const [filterDate, setFilterDate] = useState('today');

  // Filter to show only QA members (not TL)
  const qaMembers = employeesData?.data?.filter(emp => emp.role === 'QA') || [];

  // Calculate real activity data from actual login/logout times and break logs
  const qaWithActivity = qaMembers.map(qa => {
    const loginTime = qa.login_time ? new Date(qa.login_time) : null;
    const logoutTime = qa.logout_time ? new Date(qa.logout_time) : null;
    const breakLogs = qa.breakLogs || [];
    
    // Calculate total break duration
    let totalBreakMinutes = 0;
    breakLogs.forEach(log => {
      if (log.start && log.end) {
        const breakStart = new Date(log.start);
        const breakEnd = new Date(log.end);
        totalBreakMinutes += Math.floor((breakEnd - breakStart) / 60000);
      }
    });
    
    // Calculate active time (login to logout minus breaks)
    let activeMinutes = 0;
    if (loginTime) {
      const endTime = logoutTime || new Date(); // Use current time if still active
      const totalMinutes = Math.floor((endTime - loginTime) / 60000);
      activeMinutes = Math.max(0, totalMinutes - totalBreakMinutes);
    }
    
    return {
      ...qa,
      activity: {
        loginTime: loginTime,
        logoutTime: logoutTime,
        totalBreaks: breakLogs.length,
        breakDuration: totalBreakMinutes,
        activeTime: activeMinutes,
        idleTime: 0, // Can be calculated based on workStatus changes if tracked
      }
    };
  });

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'hh:mm a');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            QA Activity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track QA member work hours, breaks, and activity status
          </p>
        </div>
        
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
            bg-white dark:bg-slate-700 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currently Active</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {qaMembers.filter(q => q.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Work className="text-green-600 dark:text-green-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On Break</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {qaMembers.filter(q => q.workStatus === 'break').length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coffee className="text-amber-600 dark:text-amber-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
              <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {qaMembers.filter(q => !q.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-950">
              <Logout className="text-gray-600 dark:text-gray-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Active Time</p>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatDuration(qaWithActivity.reduce((acc, q) => acc + q.activity.activeTime, 0) / qaMembers.length || 0)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <AccessTime className="text-blue-600 dark:text-blue-400" fontSize="large" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-2 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Activity Details
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  QA Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Login Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Logout Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Active Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Breaks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Break Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Idle Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {qaWithActivity.map((qa) => (
                <tr key={qa._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={qa.profileImage}
                        alt={qa.name}
                        className="w-10 h-10 bg-amber-500"
                      >
                        {qa.name.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {qa.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {qa.employee_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      qa.activity.logoutTime
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                        : qa.is_active 
                          ? qa.workStatus === 'break'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                    }`}>
                      {qa.activity.logoutTime
                        ? 'Offline'
                        : qa.is_active 
                          ? qa.workStatus === 'break' ? 'On Break' : 'Active'
                          : 'Offline'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Login fontSize="small" className="text-green-600 dark:text-green-400" />
                      {formatTime(qa.activity.loginTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Logout fontSize="small" className="text-red-600 dark:text-red-400" />
                      {formatTime(qa.activity.logoutTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatDuration(qa.activity.activeTime)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                    {qa.activity.totalBreaks}
                  </td>
                  <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                    {formatDuration(qa.activity.breakDuration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDuration(qa.activity.idleTime)}
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

export default QAActivity;
