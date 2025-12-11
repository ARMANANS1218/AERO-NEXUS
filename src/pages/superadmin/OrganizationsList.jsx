import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import ColorModeContext from '../../context/ColorModeContext';
import { 
  FaBuilding, 
  FaPlus, 
  FaSearch, 
  FaFilter,
  FaEdit,
  FaTrash,
  FaBan,
  FaCheckCircle,
  FaEye
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CreateOrganizationModal from '../../components/superadmin/CreateOrganizationModal';

const OrganizationsList = () => {
  const { getAuthHeaders } = useSuperAdmin();
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrganizations();
  }, [currentPage, filterPlan, filterStatus, searchTerm]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterPlan !== 'all' && { plan: filterPlan }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/organizations?${params}`,
        getAuthHeaders()
      );

      if (response.data.status) {
        setOrganizations(response.data.data.organizations);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/v1/superadmin/organizations/${orgId}`,
        getAuthHeaders()
      );
      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handleSuspend = async (orgId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this organization?`)) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${orgId}/${action}`,
        action === 'suspend' ? { reason: 'Admin action' } : {},
        getAuthHeaders()
      );
      toast.success(`Organization ${action}d successfully`);
      fetchOrganizations();
    } catch (error) {
      console.error(`Error ${action}ing organization:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} organization`);
    }
  };

  const filteredOrganizations = organizations;

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>Organizations</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage all tenant organizations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-6 py-3 rounded-lg font-medium flex items-center shadow-sm transition`}
        >
          <FaPlus className="mr-2" />
          Create Organization
        </button>
      </div>

      {/* Filters */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-2 mb-6 border`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Search */}
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-10 pr-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            />
          </div>

          {/* Plan Filter */}
          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => {
                setFilterPlan(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none`}
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-indigo-400' : 'border-indigo-600'}`}></div>
        </div>
      ) : (
        <>
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-750' : 'bg-gray-50'}>
                  <tr>
                    <th className={`text-left py-4 px-6 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Organization</th>
                    <th className={`text-left py-4 px-6 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plan</th>
                    <th className={`text-left py-4 px-6 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                    <th className={`text-left py-4 px-6 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Users</th>
                    <th className={`text-left py-4 px-6 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created</th>
                    <th className={`text-right py-4 px-6 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.map((org) => (
                    <tr key={org._id} className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className="py-4 px-6">
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{org.name}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{org.organizationId}</p>
                          {org.subdomain && (
                            <p className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{org.subdomain}.chatcrm.com</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          org.subscription?.plan === 'enterprise' ? (isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700') :
                          org.subscription?.plan === 'professional' ? (isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700') :
                          org.subscription?.plan === 'basic' ? (isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') :
                          (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {org.subscription?.plan || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {org.isSuspended ? (
                          <span className={`px-3 py-1 ${isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'} rounded-full text-xs font-medium`}>
                            Suspended
                          </span>
                        ) : org.isActive ? (
                          <span className={`px-3 py-1 ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'} rounded-full text-xs font-medium`}>
                            Active
                          </span>
                        ) : (
                          <span className={`px-3 py-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-full text-xs font-medium`}>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className={`py-4 px-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {org.subscription?.maxAgents || 'Unlimited'}
                      </td>
                      <td className={`py-4 px-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/superadmin/organizations/${org._id}`}
                            className={`p-2 ${isDark ? 'text-indigo-400 hover:bg-gray-700' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg transition`}
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                          <button
                            onClick={() => handleSuspend(org._id, !org.isSuspended)}
                            className={`p-2 rounded-lg transition ${
                              org.isSuspended 
                                ? (isDark ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50')
                                : (isDark ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-yellow-50')
                            }`}
                            title={org.isSuspended ? 'Activate' : 'Suspend'}
                          >
                            {org.isSuspended ? <FaCheckCircle /> : <FaBan />}
                          </button>
                          <button
                            onClick={() => handleDelete(org._id)}
                            className={`p-2 ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'} rounded-lg transition`}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrganizations.length === 0 && (
              <div className="text-center py-12">
                <FaBuilding className={`mx-auto text-5xl ${isDark ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No organizations found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Previous
              </button>
              <span className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrganizations();
          }}
        />
      )}
    </div>
  );
};

export default OrganizationsList;
