import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import ColorModeContext from '../../context/ColorModeContext';
import { 
  FaBuilding, 
  FaUsers, 
  FaCheckCircle, 
  FaBan, 
  FaChartLine,
  FaDollarSign,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { getAuthHeaders } = useSuperAdmin();
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinkedAdminsCount, setUnlinkedAdminsCount] = useState(0);

  useEffect(() => {
    fetchDashboardStats();
    fetchUnlinkedAdmins();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/dashboard/stats`,
        getAuthHeaders()
      );
      if (response.data.status) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlinkedAdmins = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/admins/unlinked`,
        getAuthHeaders()
      );
      if (response.data.status) {
        setUnlinkedAdminsCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unlinked admins:', error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-indigo-400' : 'border-indigo-600'}`}></div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const subscriptions = stats?.subscriptions || [];
  const usage = stats?.usage || {};
  const recentOrgs = stats?.recentOrganizations || [];

  // Calculate growth (mock data - you can enhance this with real historical data)
  // const growthRate = 12.5; // Commented: Static data - needs actual historical data

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>Dashboard Overview</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Monitor and manage your multi-tenant CRM platform</p>
      </div>

      {/* Warning Banner for Unlinked Admins */}
      {unlinkedAdminsCount > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-2 rounded-lg">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-xl mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                Action Required: {unlinkedAdminsCount} Admin{unlinkedAdminsCount > 1 ? 's' : ''} Not Linked to Organizations
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                Some Admin accounts are not linked to any organization and cannot create employees or access organization features.
              </p>
              <Link
                to="/superadmin/link-admins"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200"
              >
                Fix Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Organizations */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border hover:shadow-md transition`}>
          <div className="flex items-center justify-between mb-4">
            <div className={isDark ? 'bg-indigo-900 p-3 rounded-lg' : 'bg-indigo-100 p-3 rounded-lg'}>
              <FaBuilding className={`text-2xl ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            {/* Commented: Static growth rate - needs actual historical data */}
            {/* <span className="flex items-center text-sm text-green-600 font-medium">
              <FaArrowUp className="mr-1" /> {growthRate}%
            </span> */}
          </div>
          <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>Total Organizations</h3>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{overview.totalOrganizations || 0}</p>
        </div>

        {/* Active Organizations */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border hover:shadow-md transition`}>
          <div className="flex items-center justify-between mb-4">
            <div className={isDark ? 'bg-green-900 p-3 rounded-lg' : 'bg-green-100 p-3 rounded-lg'}>
              <FaCheckCircle className={`text-2xl ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
          <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>Active</h3>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{overview.activeOrganizations || 0}</p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
            {overview.trialOrganizations || 0} on trial
          </p>
        </div>

        {/* Suspended Organizations */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border hover:shadow-md transition`}>
          <div className="flex items-center justify-between mb-4">
            <div className={isDark ? 'bg-red-900 p-3 rounded-lg' : 'bg-red-100 p-3 rounded-lg'}>
              <FaBan className={`text-2xl ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            </div>
          </div>
          <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>Suspended</h3>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{overview.suspendedOrganizations || 0}</p>
        </div>

        {/* Total Users */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border hover:shadow-md transition`}>
          <div className="flex items-center justify-between mb-4">
            <div className={isDark ? 'bg-purple-900 p-3 rounded-lg' : 'bg-purple-100 p-3 rounded-lg'}>
              <FaUsers className={`text-2xl ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
          <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>Total Users</h3>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{usage.totalUsers || 0}</p>
        </div>
      </div>

      {/* Subscription Breakdown - Full Width */}
      <div className="mb-8">
        {/* Subscription Breakdown */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
            <FaDollarSign className={`mr-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            Subscription Breakdown
          </h2>
          <div className="space-y-4">
            {subscriptions.map((sub, index) => {
              const total = overview.totalOrganizations || 1;
              const percentage = ((sub.count / total) * 100).toFixed(1);
              const colors = {
                trial: 'bg-gray-200 text-gray-700',
                basic: 'bg-blue-200 text-blue-700',
                professional: 'bg-indigo-200 text-indigo-700',
                enterprise: 'bg-purple-200 text-purple-700',
                custom: 'bg-pink-200 text-pink-700',
              };
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[sub._id] || 'bg-gray-200 text-gray-700'} capitalize`}>
                      {sub._id}
                    </span>
                    <div className="ml-4 flex-1">
                      <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                        <div 
                          className={isDark ? 'bg-indigo-500 h-2 rounded-full' : 'bg-indigo-600 h-2 rounded-full'}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <span className={`ml-4 ${isDark ? 'text-white' : 'text-gray-700'} font-semibold`}>{sub.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Organizations */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center`}>
            <FaBuilding className={`mr-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            Recent Organizations
          </h2>
          <Link 
            to="/superadmin/organizations" 
            className={`${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} font-medium text-sm`}
          >
            View All →
          </Link>
        </div>
        
        {recentOrgs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Organization</th>
                  <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plan</th>
                  <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                  <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created</th>
                  <th className={`text-right py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrgs.map((org) => (
                  <tr key={org._id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="py-4 px-4">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{org.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{org.organizationId}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'} rounded-full text-xs font-medium capitalize`}>
                        {org.subscription?.plan || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {org.isActive && !org.isSuspended ? (
                        <span className={`px-3 py-1 ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'} rounded-full text-xs font-medium`}>
                          Active
                        </span>
                      ) : (
                        <span className={`px-3 py-1 ${isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'} rounded-full text-xs font-medium`}>
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/superadmin/organizations/${org._id}`}
                        className={`${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} text-sm font-medium`}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <FaBuilding className={`mx-auto text-4xl mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p>No organizations yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
