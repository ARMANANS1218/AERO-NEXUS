import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Menu, Bell, Sun, Moon, Maximize, Minimize, X } from "lucide-react";
import ColorModeContext from "../../context/ColorModeContext";
import Sidebar from "../common/Sidebar";
import ProfileCard from "../../pages/private/customer/ProfileCard";
import { useGetProfileQuery } from "../../features/auth/authApi";
import { IMG_PROFILE_URL } from "../../config/api";

const CustomerAppbar = ({ children }) => {
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const { data } = useGetProfileQuery();

  const role = data?.data?.role;
  const isDark = document.documentElement.classList.contains("dark");

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => setOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      toast.error("Failed to toggle fullscreen mode");
    }
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileToggle = () => {
    setProfileOpen(!profileOpen);
  };

  return (
    <div className="flex min-h-screen w-screen">
      {/* Sidebar - responsive, fixed positioning with z-index */}
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        width={200}
      />

      {/* Main content area - responsive, shrinks with sidebar, uses margin to account for fixed sidebar */}
      <div className="flex flex-col flex-1 w-full min-h-screen" style={{
        marginLeft: open ? '200px' : 0,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header - responsive positioning */}
        <header
          className="fixed top-0 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
          style={{
            zIndex: 10,
            width: `calc(100% - ${open ? 200 : 0}px)`,
            marginLeft: open ? '200px' : 0,
            transition: 'margin-left 0.3s ease, width 0.3s ease'
          }}
        >
          <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-3 sm:gap-2">
            {/* Left: Menu Icon */}
            <button
              onClick={handleDrawerToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-white transition-colors flex-shrink-0 hover:scale-105 active:scale-95"
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>

            {/* Spacer */}
            <div className="flex-grow min-w-0" />

            {/* Right: Actions - Always visible on all screens */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-white transition-all flex-shrink-0 hover:scale-105 active:scale-95"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={colorMode.toggleColorMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-white transition-all flex-shrink-0 hover:scale-105 active:scale-95"
                title={isDark ? "Light Mode" : "Dark Mode"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notifications */}
              {/* <button
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-white transition-all flex-shrink-0 hover:scale-105 active:scale-95"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button> */}

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>

              {/* Profile Avatar */}
              <button
                onClick={handleProfileToggle}
                className="relative p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 active:scale-95"
                title="View Full Profile"
              >
                <div className="relative">
                  <img
                    src={
                      data?.data?.profileImage?.startsWith("http")
                        ? data?.data?.profileImage
                        : `${IMG_PROFILE_URL}/${data?.data?.profileImage}`
                    }
                    alt={data?.data?.first_name || "User"}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    onError={(e) => {
                      // Use a data URI for default avatar instead of external URL
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23e2e8f0"/%3E%3Cpath d="M16 16a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-10 2.67-10 6v2h20v-2c0-3.33-4.67-6-10-6z" fill="%2394a3b8"/%3E%3C/svg%3E';
                    }}
                  />
                  {data?.data?.is_active && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Overlay for mobile when sidebar is open */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          />
        )}

        {/* Main Content - flex-grow to fill remaining space */}
        <main
          className="flex-1 overflow-auto w-full bg-gray-50 dark:bg-slate-900"
          style={{
            paddingTop: '64px',
            paddingLeft: open ? '0px' : '60px',
            transition: 'padding-left 0.3s ease'
          }}
        >
          <div className="p-2 min-h-full">{children}</div>
        </main>

        {/* Profile Dropdown */}
        {profileOpen && (
          <>
            <div
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-30"
            />
            <div className="fixed top-16 right-3 sm:right-4 md:right-6 z-40 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <ProfileCard profile={data?.data} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerAppbar;
