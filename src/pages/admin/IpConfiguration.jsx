import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Shield, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const IpConfiguration = () => {
  const [users, setUsers] = useState([]);
  const [ipConfigs, setIpConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // Modal state
  const [ipAddresses, setIpAddresses] = useState([{ ip: '', description: '' }]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchIpConfigurations();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/v1/user/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only agents, QA, and team leaders
      const allUsers = response.data.data || [];
      const filteredUsers = allUsers.filter(user => 
        ['agent', 'qa', 'tl'].includes(user.role?.toLowerCase())
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchIpConfigurations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = filterRole !== 'all' ? { role: filterRole } : {};
      
      const response = await axios.get(`${API_BASE}/api/v1/ip-configuration`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setIpConfigs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching IP configurations:', error);
      toast.error('Failed to load IP configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null, config = null) => {
    if (config) {
      // Editing mode
      setSelectedUser({ ...user, isEditing: true });
      setIpAddresses(config.allowedIps.map(ip => ({
        ip: ip.ip,
        description: ip.description || ''
      })));
      setIsActive(config.isActive);
    } else {
      // Creating new
      setSelectedUser(user);
      setIpAddresses([{ ip: '', description: '' }]);
      setIsActive(true);
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setIpAddresses([{ ip: '', description: '' }]);
    setIsActive(true);
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

  const handleSaveConfiguration = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    // Check if user already has IP configuration
    const existingConfig = ipConfigs.find(config => config.userId?._id === selectedUser._id);
    if (existingConfig && !selectedUser.isEditing) {
      toast.error(`IP already configured for ${selectedUser.name}. Please edit the existing configuration.`);
      return;
    }

    // Validate IPs
    const validIps = ipAddresses.filter(item => item.ip.trim() !== '');
    if (validIps.length === 0) {
      toast.error('Please add at least one IP address');
      return;
    }

    // Clean IPs by removing subnet mask (e.g., /29) and validate
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const cleanedIps = [];
    const seenIps = new Set(); // Track unique IPs
    
    for (const item of validIps) {
      // Remove subnet mask if present (e.g., 122.185.245.96/29 -> 122.185.245.96)
      const cleanIp = item.ip.split('/')[0].trim();
      
      // Skip duplicate IPs
      if (seenIps.has(cleanIp)) {
        continue;
      }
      seenIps.add(cleanIp);
      
      if (!ipRegex.test(cleanIp)) {
        toast.error(`Invalid IP address format: ${item.ip}`);
        return;
      }
      
      // Validate IP range (0-255)
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
        description: item.description || 'Office IP'
      });
    }
    
    if (cleanedIps.length === 0) {
      toast.error('No valid IP addresses found after removing duplicates');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/v1/ip-configuration`,
        {
          userId: selectedUser._id,
          allowedIps: cleanedIps,
          isActive,
          userRole: selectedUser.role.toLowerCase()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`IP configuration saved successfully for ${selectedUser.name}`);
      handleCloseModal();
      fetchIpConfigurations();
    } catch (error) {
      console.error('Error saving IP configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to save IP configuration');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE}/api/v1/ip-configuration/user/${userId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(response.data.message);
      fetchIpConfigurations();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteConfiguration = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this IP configuration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/v1/ip-configuration/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('IP configuration deleted successfully');
      fetchIpConfigurations();
    } catch (error) {
      console.error('Error deleting IP configuration:', error);
      toast.error('Failed to delete IP configuration');
    }
  };

  const filteredConfigs = ipConfigs.filter(config => {
    const matchesSearch = config.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getAvailableUsers = () => {
    const configuredUserIds = ipConfigs.map(config => config.userId?._id);
    return users.filter(user => !configuredUserIds.includes(user._id));
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            IP Configuration
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage IP-based access control for agents, QA, and team leaders
        </p>
      </div>

      {/* Alert Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">How IP Configuration Works:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Users can only login from configured IP addresses</li>
            <li>Multiple IPs can be added per user</li>
            <li>When access is disabled, users will receive an error message during login</li>
            <li>Applies to: Agents, Team Leaders, and QA members</li>
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="agent">Agents</option>
              <option value="qa">QA</option>
              <option value="teamleader">Team Leaders</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (getAvailableUsers().length === 0) {
                toast.info('All eligible users already have IP configurations');
                return;
              }
              handleOpenModal(getAvailableUsers()[0]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Configuration
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredConfigs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No IP configurations found. Click "Add Configuration" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Allowed IPs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConfigs.map((config) => (
                  <tr key={config._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {config.userId?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {config.userId?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {config.userRole?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {config.allowedIps?.slice(0, 3).map((ipItem, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            title={ipItem.description}
                          >
                            {ipItem.ip}
                          </span>
                        ))}
                        {config.allowedIps?.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{config.allowedIps.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {config.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <X className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(config.userId, config)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(config.userId._id)}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title={config.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {config.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteConfiguration(config.userId._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedUser ? 'Configure IP Access' : 'Select User'}
              </h2>

              {/* User Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select User
                </label>
                <select
                  value={selectedUser?._id || ''}
                  onChange={(e) => {
                    const user = users.find(u => u._id === e.target.value);
                    setSelectedUser(user);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Choose a user...</option>
                  {getAvailableUsers().map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* IP Addresses */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allowed IP Addresses
                  </label>
                  <button
                    onClick={handleAddIpField}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add IP
                  </button>
                </div>

                <div className="space-y-3">
                  {ipAddresses.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., 192.168.1.1"
                        value={item.ip}
                        onChange={(e) => handleIpChange(index, 'ip', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={item.description}
                        onChange={(e) => handleIpChange(index, 'description', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      {ipAddresses.length > 1 && (
                        <button
                          onClick={() => handleRemoveIpField(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Configuration Status</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {isActive ? 'Access enabled' : 'Access disabled'}
                  </div>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    isActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpConfiguration;
