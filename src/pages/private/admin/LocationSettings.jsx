import React, { useState, useContext, useEffect } from 'react';
import { useGetLocationAccessSettingsQuery, useToggleLocationAccessMutation } from '../../../features/admin/adminApi';
import ColorModeContext from '../../../context/ColorModeContext';
import { toast } from 'react-toastify';
import { FourSquare } from 'react-loading-indicators';

const LocationSettings = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  const { data: settingsData, isLoading, refetch } = useGetLocationAccessSettingsQuery();
  const [toggleLocationAccess, { isLoading: toggling }] = useToggleLocationAccessMutation();

  const [enforce, setEnforce] = useState(false);
  const [radius, setRadius] = useState(100);
  const [selectedRoles, setSelectedRoles] = useState(['Admin', 'Agent', 'QA', 'TL']);

  const availableRoles = ['Admin', 'Agent', 'QA', 'TL'];

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
    const newEnforceValue = !enforce;
    
    try {
      const result = await toggleLocationAccess({
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
    try {
      const result = await toggleLocationAccess({
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

  if (isLoading) {
    const spinnerColor = isDark ? '#60A5FA' : '#3B82F6';
    return (
      <div className={['min-h-screen flex items-center justify-center', isDark ? 'bg-gray-950' : 'bg-gray-50'].join(' ')}>
        <FourSquare color={spinnerColor} size="medium" text="" textColor="" />
      </div>
    );
  }

  return (
    <div className={['min-h-screen p-6', isDark ? 'bg-gray-950' : 'bg-gray-50'].join(' ')}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900'].join(' ')}>
            Location Access Settings
          </h1>
          <p className={['mt-2', isDark ? 'text-gray-400' : 'text-gray-600'].join(' ')}>
            Configure location-based login restrictions for your organization
          </p>
        </div>

        {/* Main Settings Card */}
        <div className={['rounded-lg shadow-lg p-6 mb-6', isDark ? 'bg-gray-800' : 'bg-white'].join(' ')}>
          {/* Organization Info */}
          {settingsData?.data && (
            <div className="mb-6 pb-6 border-b border-gray-700">
              <h2 className={['text-lg font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900'].join(' ')}>
                Organization: {settingsData.data.organizationName}
              </h2>
              <p className={['text-sm', isDark ? 'text-gray-400' : 'text-gray-600'].join(' ')}>
                ID: {settingsData.data.organizationId}
              </p>
            </div>
          )}

          {/* Enable/Disable Toggle */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={['text-xl font-semibold', isDark ? 'text-white' : 'text-gray-900'].join(' ')}>
                  Location-Based Login
                </h3>
                <p className={['text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600'].join(' ')}>
                  {enforce 
                    ? 'Employees must be at approved locations to login' 
                    : 'Employees can login from anywhere'
                  }
                </p>
              </div>
              
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={[
                  'relative inline-flex h-10 w-20 items-center rounded-full transition-colors',
                  enforce ? 'bg-blue-600' : (isDark ? 'bg-gray-600' : 'bg-gray-300'),
                  toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-8 w-8 transform rounded-full bg-white transition-transform',
                    enforce ? 'translate-x-11' : 'translate-x-1'
                  ].join(' ')}
                />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mt-4">
              <span className={[
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                enforce 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              ].join(' ')}>
                {enforce ? '✓ Enabled' : '○ Disabled'}
              </span>
            </div>
          </div>

          {/* Advanced Settings - Only show when enabled */}
          {enforce && (
            <>
              {/* Default Radius */}
              <div className="mb-6">
                <label className={['block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700'].join(' ')}>
                  Default Radius (meters)
                </label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(Math.max(10, parseInt(e.target.value) || 100))}
                  min="10"
                  max="10000"
                  className={[
                    'w-full px-4 py-2 rounded-lg border',
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500',
                    'focus:outline-none focus:ring-2',
                    'focus:ring-blue-500',
                    'focus:ring-opacity-20'
                  ].join(' ')}
                />
                <p className={['text-xs mt-1', isDark ? 'text-gray-400' : 'text-gray-500'].join(' ')}>
                  Employees must be within this distance from approved locations
                </p>
              </div>

              {/* Enforced Roles */}
              <div className="mb-6">
                <label className={['block text-sm font-medium mb-3', isDark ? 'text-gray-300' : 'text-gray-700'].join(' ')}>
                  Enforce Location For Roles
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    const labelClass = [
                      'flex items-center p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected
                        ? (isDark ? 'bg-blue-900 bg-opacity-30 border-blue-600' : 'bg-blue-50 border-blue-500')
                        : (isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 hover:border-gray-400')
                    ].join(' ');
                    
                    return (
                    <label
                      key={role}
                      className={labelClass}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={['ml-2', isDark ? 'text-white' : 'text-gray-900'].join(' ')}>
                        {role}
                      </span>
                    </label>
                    );
                  })}
                </div>
                <p className={['text-xs mt-2', isDark ? 'text-gray-400' : 'text-gray-500'].join(' ')}>
                  Note: Agent, QA, and TL always require location access when any approved locations exist
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={toggling}
                  className={[
                    'px-6 py-2 rounded-lg font-medium transition-colors text-white',
                    toggling
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  ].join(' ')}
                >
                  {toggling ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Information Card */}
        <div className={[
          'border rounded-lg p-6',
          isDark ? 'bg-blue-900 bg-opacity-20 border-blue-800' : 'bg-blue-50 border-blue-200'
        ].join(' ')}>
          <h3 className={['text-lg font-semibold mb-3', isDark ? 'text-blue-300' : 'text-blue-900'].join(' ')}>
            How it works
          </h3>
          <ul className={['space-y-2 text-sm', isDark ? 'text-blue-200' : 'text-blue-800'].join(' ')}>
            <li className="flex items-start">
              <span className="mr-2">&#8226;</span>
              <span><strong>Disabled:</strong> Employees can login from anywhere without location restrictions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&#8226;</span>
              <span><strong>Enabled:</strong> Employees must be at approved locations to login</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&#8226;</span>
              <span>Approved locations must be set up in the Location Access management page</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&#8226;</span>
              <span>Employees will be asked to allow location access in their browser when logging in</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&#8226;</span>
              <span>Location is checked each time an employee attempts to login</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationSettings;
