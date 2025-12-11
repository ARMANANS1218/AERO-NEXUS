import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AlertTriangle, Link as LinkIcon, Building2, User, Mail, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LinkUnlinkedAdmins = () => {
  const navigate = useNavigate();
  const [unlinkedAdmins, setUnlinkedAdmins] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [linkingAdmin, setLinkingAdmin] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch unlinked admins
      const adminsResponse = await axios.get(
        `${API_URL}/api/v1/superadmin/admins/unlinked`,
        { headers }
      );

      // Fetch all organizations
      const orgsResponse = await axios.get(
        `${API_URL}/api/v1/superadmin/organizations`,
        { headers }
      );

      setUnlinkedAdmins(adminsResponse.data.data || []);
      setOrganizations(orgsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAdmin = async (adminId, organizationId) => {
    try {
      setLinkingAdmin(adminId);
      const token = localStorage.getItem('superAdminToken');

      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/admins/link-to-organization`,
        { adminId, organizationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || 'Admin linked successfully!');
      
      // Refresh the list
      await fetchData();
      setSelectedAdmin(null);
      setSelectedOrg('');
    } catch (error) {
      console.error('Error linking admin:', error);
      toast.error(error.response?.data?.message || 'Failed to link admin');
    } finally {
      setLinkingAdmin(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/superadmin/dashboard')}
            className="mb-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={32} />
            Link Unlinked Admins
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            These Admin accounts are not linked to any organization. Link them to enable employee management.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlinked Admins</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{unlinkedAdmins.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Organizations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{organizations.length}</p>
            </div>
          </div>
        </div>

        {/* No unlinked admins */}
        {unlinkedAdmins.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              All Admins are Linked!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              There are no unlinked admin accounts. All admins have been assigned to organizations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unlinkedAdmins.map((admin) => (
              <div
                key={admin._id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  {/* Admin Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                        <User className="text-yellow-600 dark:text-yellow-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {admin.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {admin.email}
                          </span>
                          {admin.employee_id && (
                            <span>ID: {admin.employee_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <Calendar size={14} />
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Link to Organization */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <select
                      value={selectedAdmin === admin._id ? selectedOrg : ''}
                      onChange={(e) => {
                        setSelectedAdmin(admin._id);
                        setSelectedOrg(e.target.value);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                        bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Select Organization</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleLinkAdmin(admin._id, selectedOrg)}
                      disabled={selectedAdmin !== admin._id || !selectedOrg || linkingAdmin === admin._id}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                        text-white font-semibold rounded-lg shadow-md 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {linkingAdmin === admin._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Linking...
                        </>
                      ) : (
                        <>
                          <LinkIcon size={16} />
                          Link to Org
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Building2 size={20} />
            What happens after linking?
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Admin will be assigned to the selected organization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Admin must <strong>logout and login again</strong> to get new JWT token</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Admin can then create employees (Agent, QA, and TL) in their organization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Admin will only see employees from their organization</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LinkUnlinkedAdmins;
