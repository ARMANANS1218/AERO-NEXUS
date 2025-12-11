import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import ColorModeContext from '../../context/ColorModeContext';
import { 
  BarChart3, 
  Building2, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Moon,
  Sun,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  MapPinned
} from 'lucide-react';

const SuperAdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { superAdminData, logoutSuperAdmin } = useSuperAdmin();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isDark = mode === 'dark';

  const navigation = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: BarChart3 },
    { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
    { name: 'Location Status', href: '/superadmin/location-summary', icon: MapPin },
    { name: 'Location Settings', href: '/superadmin/location-settings', icon: MapPinned },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutSuperAdmin();
      navigate('/superadmin/login');
    }
  };

  return (
    <div className={`h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex overflow-hidden`}>
      {/* Sidebar - Desktop */}
      <div className={`hidden lg:flex lg:flex-shrink-0 ${isDark ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>
        <div className={`flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
          <div className={`flex flex-col h-screen ${isDark ? 'bg-gray-900' : 'bg-violet-700'}`}>
            {/* Logo & Toggle */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} h-14 px-2 ${isDark ? 'bg-gray-900' : 'bg-violet-800'}`}>
              {!sidebarCollapsed && (
                <div className="flex items-center">
                  <ShieldCheck className="w-5 h-5 text-white mr-2" />
                  <span className="text-lg font-bold text-white">SuperAdmin</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`px-4 py-1 text-white ${isDark ? 'hover:bg-gray-800' : 'hover:bg-violet-700'} rounded transition`}
                title={sidebarCollapsed ? 'Expand' : 'Collapse'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className={`h-px ${isDark ? 'bg-gray-800' : 'bg-violet-600'}`}></div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-lg transition ${
                      isActive
                        ? isDark ? 'bg-gray-800 text-white' : 'bg-violet-800 text-white'
                        : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-violet-100 hover:bg-violet-600'
                    }`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <Icon className={`w-4 h-4 ${!sidebarCollapsed && 'mr-2'}`} />
                    {!sidebarCollapsed && item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle */}
            <div className={`px-2 py-2 ${isDark ? 'border-t border-gray-800' : 'border-t border-violet-600'}`}>
              <button
                onClick={toggleColorMode}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-lg transition ${
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-violet-100 hover:bg-violet-600'
                }`}
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? <Sun className={`w-4 h-4 ${!sidebarCollapsed && 'mr-2'}`} /> : <Moon className={`w-4 h-4 ${!sidebarCollapsed && 'mr-2'}`} />}
                {!sidebarCollapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
              </button>
            </div>

            {/* User Profile */}
            <div className={`flex-shrink-0 ${isDark ? 'border-t border-gray-800' : 'border-t border-violet-600'} p-2`}>
              {!sidebarCollapsed ? (
                <>
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-violet-500'} flex items-center justify-center`}>
                        <span className="text-white text-sm font-semibold">
                          {superAdminData?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2 min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{superAdminData?.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-violet-200'} truncate`}>{superAdminData?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-center px-3 py-3 text-xs font-medium text-white ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-violet-600 hover:bg-violet-500'} rounded-lg transition`}
                  >
                    <LogOut className="mr-1.5 w-3 h-3" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className={`h-8 w-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-violet-500'} flex items-center justify-center`}>
                    <span className="text-white text-sm font-semibold">
                      {superAdminData?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`px-4 py-2 text-white ${isDark ? 'hover:bg-gray-800' : 'hover:bg-violet-600'} rounded transition`}
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-gray-600 transition-opacity ${
            sidebarOpen ? 'opacity-75' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 flex flex-col w-64 ${isDark ? 'bg-gray-900' : 'bg-violet-700'} transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className={`flex items-center justify-between h-16 px-4 ${isDark ? 'bg-gray-900' : 'bg-violet-800'}`}>
            <div className="flex items-center">
              <ShieldCheck className="w-6 h-6 text-white mr-3" />
              <span className="text-xl font-bold text-white">SuperAdmin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? isDark ? 'bg-gray-800 text-white' : 'bg-violet-800 text-white'
                      : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-violet-100 hover:bg-violet-600'
                  }`}
                >
                  <Icon className="mr-3 w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <div className={`px-3 py-2 ${isDark ? 'border-t border-gray-800' : 'border-t border-violet-600'}`}>
            <button
              onClick={toggleColorMode}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-violet-100 hover:bg-violet-600'
              }`}
            >
              {isDark ? <Sun className="mr-3 w-5 h-5" /> : <Moon className="mr-3 w-5 h-5" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* User Profile */}
          <div className={`flex-shrink-0 ${isDark ? 'border-t border-gray-800' : 'border-t border-violet-600'} p-2`}>
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-violet-500'} flex items-center justify-center`}>
                  <span className="text-white font-semibold">
                    {superAdminData?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{superAdminData?.name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-violet-200'}`}>{superAdminData?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-violet-600 hover:bg-violet-500'} rounded-lg transition`}
            >
              <LogOut className="mr-2 w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Mobile */}
        <div className={`lg:hidden flex items-center justify-between h-16 px-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <ShieldCheck className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'} mr-2`} />
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>SuperAdmin</span>
          </div>
          <button
            onClick={toggleColorMode}
            className={`p-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
