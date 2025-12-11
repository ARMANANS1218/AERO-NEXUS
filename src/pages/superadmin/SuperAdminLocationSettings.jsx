import React, { useState, useContext, useEffect } from 'react';
import { useGetSuperAdminLocationAccessSettingsQuery, useToggleSuperAdminLocationAccessMutation } from '../../features/admin/adminApi';
import ColorModeContext from '../../context/ColorModeContext';
import { toast } from 'react-toastify';
import { FourSquare } from 'react-loading-indicators';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import axios from 'axios';
import { API_URL } from '../../config/api';

const SuperAdminLocationSettings = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const { getAuthHeaders } = useSuperAdmin();

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const { data: settingsData, isLoading: loadingSettings, refetch } = useGetSuperAdminLocationAccessSettingsQuery(
    selectedOrgId,
    { skip: !selectedOrgId }
  );
  const [toggleLocationAccess, { isLoading: toggling }] = useToggleSuperAdminLocationAccessMutation();

  const [enforce, setEnforce] = useState(false);
  const [radius, setRadius] = useState(100);
  const [selectedRoles, setSelectedRoles] = useState(['Admin', 'Agent', 'QA', 'TL']);

  const availableRoles = ['Admin', 'Agent', 'QA', 'TL'];

  // Fetch all organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/v1/superadmin/organizations`,
          getAuthHeaders()
        );
        console.log('Organizations API response:', response.data);
        
        if (response.data.status) {
          // API returns data.organizations array
          const orgsData = response.data.data?.organizations || response.data.data || response.data.organizations || [];
          console.log('Organizations data:', orgsData);
          
          // Ensure it's an array
          const orgsArray = Array.isArray(orgsData) ? orgsData : [];
          setOrganizations(orgsArray);
          
          if (orgsArray.length > 0) {
            setSelectedOrgId(orgsArray[0]._id);
          } else {
            console.warn('No organizations found');
            toast.info('No organizations found in the system');
          }
        } else {
          console.error('API returned status false:', response.data);
          setOrganizations([]);
          toast.error('Failed to load organizations');
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load settings when data is fetched
  useEffect(() => {
    if (settingsData?.data?.loginLocationAccess) {
      const settings = settingsData.data.loginLocationAccess;
      setEnforce(settings.enforce || false);
      setRadius(settings.defaultRadiusMeters || 100);
      setSelectedRoles(settings.roles || ['Admin', 'Agent', 'QA', 'TL']);
    }
  }, [settingsData]);

  const handleToggle = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    const newEnforceValue = !enforce;
    
    try {
      const result = await toggleLocationAccess({
        orgId: selectedOrgId,
        enforce: newEnforceValue,
        defaultRadiusMeters: radius,
        roles: selectedRoles
      }).unwrap();

      toast.success(result.message || `Location access ${newEnforceValue ? 'enabled' : 'disabled'} successfully`);
      setEnforce(newEnforceValue);
      refetch();
    } catch (error) {
      console.error('Toggle location access error:', error);
      toast.error(error?.data?.message || 'Failed to update location access settings');
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    try {
      const result = await toggleLocationAccess({
        orgId: selectedOrgId,
        enforce,
        defaultRadiusMeters: radius,
        roles: selectedRoles
      }).unwrap();

      toast.success(result.message || 'Settings updated successfully');
      refetch();
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error?.data?.message || 'Failed to save settings');
    }
  };

  const handleRoleToggle = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  if (loadingOrgs) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <FourSquare color={isDark ? '#60A5FA' : '#3B82F6'} size="medium" text="" textColor="" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Location Access Settings (SuperAdmin)
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure location-based login restrictions for organizations
          </p>
        </div>

        {/* Organization Selector */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-6`}>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Select Organization
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-lg border
              ${isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            `}
          >
            <option value="">-- Select Organization --</option>
            {Array.isArray(organizations) && organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name} ({org.organizationId})
              </option>
            ))}
          </select>
        </div>

        {/* Main Settings Card */}
        {selectedOrgId && (
          <>
            {loadingSettings ? (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 flex items-center justify-center h-64`}>
                <FourSquare color={isDark ? '#60A5FA' : '#3B82F6'} size="medium" text="" textColor="" />
              </div>
            ) : (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-6`}>
                {/* Organization Info */}
                {settingsData?.data && (
                  <div className="mb-6 pb-6 border-b border-gray-700">
                    <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Organization: {settingsData.data.organizationName}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      ID: {settingsData.data.organizationId}
                    </p>
                  </div>
                )}

                {/* Enable/Disable Toggle */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Location-Based Login
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {enforce 
                          ? 'Employees must be at approved locations to login' 
                          : 'Employees can login from anywhere'
                        }
                      </p>
                    </div>
                    
                    <button
                      onClick={handleToggle}
                      disabled={toggling}
                      className={`
                        relative inline-flex h-10 w-20 items-center rounded-full transition-colors
                        ${enforce ? 'bg-blue-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'}
                        ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-8 w-8 transform rounded-full bg-white transition-transform
                          ${enforce ? 'translate-x-11' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4">
                    <span className={`
                      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${enforce 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }
                    `}>
                      {enforce ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </div>
                </div>

                {/* Advanced Settings - Only show when enabled */}
                {enforce && (
                  <>
                    {/* Default Radius */}
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Default Radius (meters)
                      </label>
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(Math.max(10, parseInt(e.target.value) || 100))}
                        min="10"
                        max="10000"
                        className={`
                          w-full px-4 py-2 rounded-lg border
                          ${isDark 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          }
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20
                        `}
                      />
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Employees must be within this distance from approved locations
                      </p>
                    </div>

                    {/* Enforced Roles */}
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Enforce Location For Roles
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {availableRoles.map((role) => (
                          <label
                            key={role}
                            className={`
                              flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                              ${selectedRoles.includes(role)
                                ? isDark
                                  ? 'bg-blue-900/30 border-blue-600'
                                  : 'bg-blue-50 border-blue-500'
                                : isDark
                                  ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                                  : 'bg-white border-gray-300 hover:border-gray-400'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role)}
                              onChange={() => handleRoleToggle(role)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {role}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Note: Agent, QA, and TL always require location access when any approved locations exist
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={toggling}
                        className={`
                          px-6 py-2 rounded-lg font-medium transition-colors
                          ${toggling
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                          }
                          text-white
                        `}
                      >
                        {toggling ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Information Card */}
        <div className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            How it works
          </h3>
          <ul className={`space-y-2 text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Disabled:</strong> Employees can login from anywhere without location restrictions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Enabled:</strong> Employees must be at approved locations to login</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Approved locations must be set up by the organization admin</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>SuperAdmin can manage location settings for any organization</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Location is checked each time an employee attempts to login</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLocationSettings;
