import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { User, Mail, Building2, Clock, MapPin, Globe, LogOut, Eye } from 'lucide-react';
import { IMG_PROFILE_URL } from '../../config/api';
import { useLogoutUserMutation, useToggleBreakMutation } from '../../features/auth/authApi';

const ProfileCard = ({ agent, onToggle, role }) => {
  const navigate = useNavigate();
  const [logoutUser] = useLogoutUserMutation();
  const [toggleBreak] = useToggleBreakMutation();

  const cardToggle = () => {
    const profileRoutes = {
      Admin: '/admin/profile',
      admin: '/admin/profile',
      QA: '/qa/profile',
      qa: '/qa/profile',
      TL: '/tl/profile',
      tl: '/tl/profile',
      Agent: '/agent/profile',
      agent: '/agent/profile',
    };
    const route = profileRoutes[role] || '/agent/profile';
    navigate(route);
  };

  const avatarSrc = useMemo(() => {
    if (!agent?.data?.profileImage) return '';
    if (agent.data.profileImage?.startsWith('http')) return agent.data.profileImage;
    return `${IMG_PROFILE_URL}/${agent.data.profileImage}`;
  }, [agent?.data?.profileImage]);

  const formatToIST = (date) => {
    return format(new Date(date), 'hh:mm:ss a', {
      timeZone: 'Asia/Kolkata',
    });
  };

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap(); // Call backend logout
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleToggle = async () => {
    try {
      await toggleBreak().unwrap();
      toast.success(`Status changed to ${agent?.data?.is_active ? 'Break' : 'Active'}`);
      if (onToggle) onToggle(agent._id);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center cursor-pointer"
              onClick={handleToggle}
              title="Click to toggle status"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={agent?.data?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-base font-bold">
                  {agent?.data?.name?.charAt(0)?.toUpperCase() ||
                    agent?.data?.user_name?.charAt(0)?.toUpperCase() ||
                    'U'}
                </span>
              )}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                agent?.data?.is_active ? 'bg-green-500' : 'bg-gray-400'
              }`}
            ></div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm leading-tight">
              {agent?.data?.name || agent?.data?.user_name || 'User'}
            </h3>
            <p className="text-white/80 text-xs">{agent?.data?.role || 'Agent'}</p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-3 space-y-2">
        {/* Alias */}
        {agent?.data?.alias && (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Alias Name</p>
              <p className="text-xs text-gray-900 dark:text-white font-medium">
                {agent?.data?.alias}
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
            <p className="text-xs text-gray-900 dark:text-white font-medium truncate">
              {agent?.data?.email || 'N/A'}
            </p>
          </div>
        </div>

        {/* Employee ID */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Employee ID</p>
            <p className="text-xs text-gray-900 dark:text-white font-medium">
              {agent?.data?.employee_id || 'N/A'}
            </p>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Department</p>
            <p className="text-xs text-gray-900 dark:text-white font-medium">
              {agent?.data?.department || 'N/A'}
            </p>
          </div>
        </div>

        {/* Login Time */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Login Time</p>
            <p className="text-xs text-gray-900 dark:text-white font-medium">
              {agent?.data?.login_time ? formatToIST(agent?.data?.login_time) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Break Info */}
        {agent?.data?.breakLogs?.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2 mt-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Last Break Info
            </p>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Start:</span>{' '}
                {formatToIST(agent?.data?.breakLogs[0].start)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">End:</span>{' '}
                {formatToIST(agent?.data?.breakLogs[0].end)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Duration:</span>{' '}
                {formatToIST(agent?.data?.breakLogs[0].duration)}
              </p>
            </div>
          </div>
        )}

        {/* Location */}
        {agent?.data?.address?.city ? (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">City</p>
              <p className="text-xs text-gray-900 dark:text-white font-medium">
                {agent?.data?.address?.city}, {agent?.data?.address?.state}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 dark:text-white font-medium">N/A</p>
            </div>
          </div>
        )}

        {/* Country */}
        {agent?.data?.location?.country && (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Country</p>
              <p className="text-xs text-gray-900 dark:text-white font-medium">
                {agent?.data?.location?.country}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-800"></div>

      {/* Accounts Section */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Accounts
        </p>
        <button
          onClick={cardToggle}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-800"
        >
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            View Full Profile
          </span>
          <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Logout Button */}
      <div className="p-3 pt-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
