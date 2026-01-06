import React, { useState, useEffect, useContext } from 'react';
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Shield, AlertCircle, Check, X, Network } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ColorModeContext from '../../context/ColorModeContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OrganizationIpConfig = () => {
  const { mode } = useContext(ColorModeContext);
  const darkMode = mode === 'dark';
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ipAddresses, setIpAddresses] = useState([{ ip: '', description: '' }]);
  const [isActive, setIsActive] = useState(true);
  const [applyToRoles, setApplyToRoles] = useState(['Agent', 'TL', 'QA']);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/v1/organization-ip-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.data);
    } catch (error) {
      console.error('Error fetching organization IP config:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load IP configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (config) {
      setIpAddresses(config.allowedIps.map(ip => ({
        ip: ip.ip,
        description: ip.description || ''
      })));
      setIsActive(config.isActive);
      setApplyToRoles(config.applyToRoles || ['Agent', 'TL', 'QA']);
    } else {
      setIpAddresses([{ ip: '', description: '' }]);
      setIsActive(true);
      setApplyToRoles(['Agent', 'TL', 'QA']);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIpAddresses([{ ip: '', description: '' }]);
    setIsActive(true);
    setApplyToRoles(['Agent', 'TL', 'QA']);
  };

  const handleAddIpField = () => {
    setIpAddresses([...ipAddresses, { ip: '', description: '' }]);
  };

  const handleRemoveIpField = (index) => {
    if (ipAddresses.length > 1) {
      const newIps = ipAddresses.filter((_, i) => i !== index);
      setIpAddresses(newIps);
    }
  };

  const handleIpChange = (index, field, value) => {
    const newIps = [...ipAddresses];
    newIps[index][field] = value;
    setIpAddresses(newIps);
  };

  const handleRoleToggle = (role) => {
    if (applyToRoles.includes(role)) {
      setApplyToRoles(applyToRoles.filter(r => r !== role));
    } else {
      setApplyToRoles([...applyToRoles, role]);
    }
  };

  const handleSaveConfiguration = async () => {
    const validIps = ipAddresses.filter(item => item.ip.trim() !== '');
    if (validIps.length === 0) {
      toast.error('Please add at least one IP address');
      return;
    }

    // Clean IPs by removing subnet mask and validate
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const cleanedIps = [];
    const seenIps = new Set();
    
    for (const item of validIps) {
      const cleanIp = item.ip.split('/')[0].trim();
      
      if (seenIps.has(cleanIp)) continue;
      seenIps.add(cleanIp);
      
      if (!ipRegex.test(cleanIp)) {
        toast.error(`Invalid IP address format: ${item.ip}`);
        return;
      }
      
      const parts = cleanIp.split('.');
      const invalidPart = parts.find(part => {
        const num = parseInt(part, 10);
        return isNaN(num) || num < 0 || num > 255;
      });
      
      if (invalidPart !== undefined) {
        toast.error(`Invalid IP address: ${cleanIp}`);
        return;
      }
      
      cleanedIps.push({
        ip: cleanIp,
        description: item.description || 'Organization IP'
      });
    }
    
    if (cleanedIps.length === 0) {
      toast.error('No valid IP addresses found after removing duplicates');
      return;
    }

    if (applyToRoles.length === 0) {
      toast.error('Please select at least one role to apply restrictions');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/v1/organization-ip-config`,
        {
          allowedIps: cleanedIps,
          isActive,
          applyToRoles
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Organization IP configuration saved successfully');
      handleCloseModal();
      fetchConfig();
    } catch (error) {
      console.error('Error saving organization IP config:', error);
      toast.error(error.response?.data?.message || 'Failed to save IP configuration');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE}/api/v1/organization-ip-config/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Toggle response:', response.data);
      
      // Update local state immediately
      if (response.data.data) {
        setConfig(response.data.data);
      }
      
      toast.success(response.data.message);
      
      // Fetch again to ensure sync
      await fetchConfig();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteConfiguration = async () => {
    if (!window.confirm('Are you sure you want to delete the organization IP configuration? This will allow all users to login from any IP address.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/v1/organization-ip-config`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Organization IP configuration deleted successfully');
      fetchConfig();
    } catch (error) {
      console.error('Error deleting organization IP config:', error);
      toast.error('Failed to delete IP configuration');
    }
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-600" />
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Organization IP Configuration</h1>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {config ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {config ? 'Edit Configuration' : 'Create Configuration'}
          </button>
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure IP addresses that are allowed to access your organization. Only users from these IPs can login.
        </p>
      </div>

      {/* Info Alert */}
      <div className={`rounded-lg p-4 mb-6 ${darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
            <p className="font-semibold mb-2">How Organization IP Configuration Works:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Configure IP addresses for your entire organization</li>
              <li>All agents, team leaders, and QA members will be restricted to these IPs</li>
              <li>When disabled, users can login from any IP address</li>
              <li>Use your ISP's public IP (e.g., 122.185.245.96), not local IP (192.168.x.x)</li>
              <li>Subnet masks like /29 will be automatically removed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : config ? (
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className={`w-6 h-6 ${config.isActive ? 'text-green-600' : 'text-gray-400'}`} />
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Current Configuration
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  config.isActive
                    ? darkMode 
                      ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {config.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={handleDeleteConfiguration}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Allowed IPs */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Allowed IP Addresses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.allowedIps.map((ipItem, index) => (
                <div key={index} className={`rounded-lg p-3 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className={`font-mono font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{ipItem.ip}</span>
                  </div>
                  {ipItem.description && (
                    <p className={`text-sm ml-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ipItem.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Applied to Roles */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Applied to Roles</h3>
            <div className="flex gap-2">
              {config.applyToRoles.map((role, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    darkMode 
                      ? 'bg-blue-900/30 text-blue-400' 
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {new Date(config.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span>{' '}
                {new Date(config.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg shadow-md p-12 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Shield className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>No IP Configuration</h3>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your organization doesn't have IP restrictions configured yet. Users can login from any IP address.
          </p>
          <button
            onClick={handleOpenModal}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create IP Configuration
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {config ? 'Edit' : 'Create'} Organization IP Configuration
                </h2>
                <button
                  onClick={handleCloseModal}
                  className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* IP Addresses */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Allowed IP Addresses
                </label>
                {ipAddresses.map((ipItem, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g., 122.185.245.96"
                      value={ipItem.ip}
                      onChange={(e) => handleIpChange(index, 'ip', e.target.value)}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={ipItem.description}
                      onChange={(e) => handleIpChange(index, 'description', e.target.value)}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {ipAddresses.length > 1 && (
                      <button
                        onClick={() => handleRemoveIpField(index)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'text-red-400 hover:bg-red-900/30' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddIpField}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'text-blue-400 hover:bg-blue-900/30' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add Another IP
                </button>
              </div>

              {/* Apply to Roles */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Apply Restrictions to Roles
                </label>
                <div className="flex gap-4">
                  {['Agent', 'TL', 'QA'].map((role) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Configuration Status: {isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={handleCloseModal}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfiguration}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-blue-700 hover:bg-blue-800' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationIpConfig;
