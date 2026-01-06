import React, { useEffect, useState } from 'react';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { User, Mail, Phone, MapPin, Calendar, Monitor, Globe, Eye } from 'lucide-react';

export default function TLProfile() {
  const { data, isLoading } = useGetProfileQuery();
  const user = data?.data;

  const [systemInfo, setSystemInfo] = useState({
    browser: '',
    os: '',
    device: '',
    screen: `${window.screen.width}x${window.screen.height}`
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    let browser = 'Unknown';
    if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    let os = 'Unknown';
    if (/windows/i.test(platform)) os = 'Windows';
    else if (/mac/i.test(platform)) os = 'MacOS';
    else if (/linux/i.test(platform)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    const device = /mobile/i.test(ua) ? 'Mobile' : 'Desktop';
    setSystemInfo({ browser, os, device, screen: `${window.screen.width}x${window.screen.height}` });
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full">
        {/* Header Section with Read-Only Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">My Profile</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View your personal and system information</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Read Only</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-white dark:border-gray-900 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold overflow-hidden shadow-lg flex-shrink-0">
                {user?.profileImage ? (
                  <img 
                    src={user?.profileImage?.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL || ''}${user?.profileImage}`} 
                    alt={user?.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'T'
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{user?.name || 'N/A'}</h2>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-medium">
                    {user?.role || 'Team Lead'}
                  </span>
                  {user?.alias && (
                    <span className="text-xs sm:text-sm text-white/90">Alias: <span className="font-medium text-white">{user.alias}</span></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details - Two Column Layout */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <DetailRow icon={<User className="w-5 h-5" />} label="Role" value={user?.role || 'Team Lead'} />
                <DetailRow icon={<Mail className="w-5 h-5" />} label="Email" value={user?.email || 'N/A'} />
                <DetailRow icon={<Phone className="w-5 h-5" />} label="Mobile" value={user?.mobile || 'N/A'} />
                <DetailRow icon={<User className="w-5 h-5" />} label="Username" value={user?.user_name || 'N/A'} />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <DetailRow icon={<User className="w-5 h-5" />} label="Employee ID" value={user?.employee_id || 'N/A'} />
                <DetailRow icon={<MapPin className="w-5 h-5" />} label="Department" value={user?.department || 'N/A'} />
                <DetailRow 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Login Time" 
                  value={user?.login_time ? new Date(user.login_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'} 
                />
                <DetailRow 
                  icon={<MapPin className="w-5 h-5" />} 
                  label="Location" 
                  value={user?.location?.city ? `${user.location.city}, ${user.location.region || ''}, ${user.location.country || ''}`.replace(/, ,/g, ',').replace(/,\s*$/, '') : 'N/A'} 
                />
              </div>
            </div>

            {/* System Information Section */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">System Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <SystemDetailRow label="IP Address" value={user?.ip || 'N/A'} />
                  <SystemDetailRow label="Timezone" value={user?.location?.timezone || 'N/A'} />
                  <SystemDetailRow label="Browser" value={systemInfo.browser} />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <SystemDetailRow label="OS" value={systemInfo.os} />
                  <SystemDetailRow label="Device" value={systemInfo.device} />
                  <SystemDetailRow label="Screen Resolution" value={systemInfo.screen} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Profile Information</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Your profile information is managed by your administrator. If you need to update any details, please contact your supervisor or HR department.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// DetailRow Component
function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
}

// SystemDetailRow Component
function SystemDetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-1 sm:gap-2">
      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white break-all">{value}</span>
    </div>
  );
}
