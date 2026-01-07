import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { menuData } from './menuData';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_URL } from '../../config/api';

// TailwindCSS Sidebar (no MUI). Supports nested menus, active highlight, collapse on mobile.
export default function Sidebar({ open, onClose, role = 'Agent', width = 260, onSidebarWidthChange }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [organizationName, setOrganizationName] = useState('LIVE CHAT CRM');

  // Fetch organization name from JWT token (initial load) and API (real-time updates)
  useEffect(() => {
    const fetchOrganizationName = async () => {
      try {
        // First, try to get from JWT token as fallback
        const token = localStorage.getItem('token') || localStorage.getItem('superAdminToken');
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded.organizationName) {
            setOrganizationName(decoded.organizationName);
          }
        }

        // Then fetch from API for real-time updates (only for regular users, not SuperAdmin)
        if (localStorage.getItem('token')) {
          const response = await axios.get(`${API_URL}/api/v1/user/organization/name`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.data.status && response.data.data.organizationName) {
            setOrganizationName(response.data.data.organizationName);
          }
        }
      } catch (error) {
        console.error('Error fetching organization name:', error);
        // Keep the fallback value from JWT or default
      }
    };

    fetchOrganizationName();
    
    // Refresh organization name every 30 seconds to catch updates
    const interval = setInterval(fetchOrganizationName, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Notify parent of width changes
  useEffect(() => {
    if (onSidebarWidthChange) {
      const currentWidth = (open || isHovered) ? width : 64;
      onSidebarWidthChange(currentWidth);
    }
  }, [open, isHovered, width, onSidebarWidthChange]);

  useEffect(() => {
    // auto-open parents for active route
    const sections = menuData[role] || [];
    const newState = {};
    const path = location.pathname;
    sections.forEach((section, si) => {
      (section.items || []).forEach((item, i) => {
        if ((item.route && path.startsWith(item.route)) || (item.subMenu || item.nestedSubMenu)) {
          if (item.subMenu) {
            newState[`0-${item.name}`] = true;
            item.subMenu.forEach((sub) => {
              if (sub.route && path.startsWith(sub.route)) {
                newState[`1-${sub.name}`] = true;
              }
            });
          }
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...newState }));
  }, [location.pathname, role]);

  const toggle = (key) => setOpenMenus((s) => ({ ...s, [key]: !s[key] }));

  // Determine if sidebar should be expanded (either open prop on mobile or hovered on desktop)
  const isExpanded = open || isHovered;

  const NavItem = ({ item, level = 0 }) => {
    // For Dashboard, check exact route or direct child routes (not nested reports, etc)
    const isDashboard = item.route === '/admin' || item.route === '/agent' || item.route === '/qa' || item.route === '/tl' || item.route === '/customer';
    const isActive = item.route ? (
      isDashboard 
        ? location.pathname === item.route  // Exact match for Dashboard
        : location.pathname.startsWith(item.route)  // Prefix match for other routes
    ) : false;
    const hasChildren = !!(item.subMenu || item.nestedSubMenu);
    const key = `${level}-${item.name}`;
    const isOpen = openMenus[key];

    const padding = level === 0 ? 'pl-3' : level === 1 ? 'pl-6' : 'pl-8';
    const textClasses = isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300';
    const bgClasses = isActive ? 'bg-blue-50 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50';

    const content = (
      <div className={`flex items-center justify-between  ${isExpanded ? padding : 'justify-center'} px-2.5 py-2 rounded-lg transition-all duration-200 ${bgClasses} relative group`}>
        <div className={`flex  gap-2 min-w-0 ${isExpanded ? '' : 'items-center'}`}>
          {/* Icon */}
          {item.icon && (
            <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
          )}
          <span className={`truncate text-sm font-medium ${textClasses} transition-all duration-200 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
            {item.name}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <span className={`${textClasses} transition-opacity duration-200`}>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        )}
        
        {/* Tooltip when collapsed */}
        {!isExpanded && item.route && (
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {item.name}
          </span>
        )}
      </div>
    );

    if (hasChildren) {
      return (
        <div className="select-none">
          <button type="button" onClick={() => toggle(key)} className="w-full text-left">
            {content}
          </button>
          <div className={`grid transition-all duration-200 ${isOpen && isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden ml-2`}>
            <div className="min-h-0">
              {(item.subMenu || item.nestedSubMenu).map((child) => (
                <NavItem key={child.name} item={child} level={level + 1} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (item.route) {
      return (
        <Link to={item.route} onClick={() => { if (window.innerWidth < 1024) onClose?.(); }}>
          {content}
        </Link>
      );
    }

    return content;
  };

  const sections = menuData[role] || [];

  // Collect all top-level items with icons for mini sidebar (including submenu parents)
  const topLevelItems = sections.flatMap(section => 
    (section.items || []).filter(item => item.icon)
  );

  return (
    <>
      {/* Main Sidebar with hover support */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-20 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ 
          width: isExpanded ? width : 64,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isExpanded && !open ? '4px 0 12px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        {/* Logo/Brand Area */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 overflow-hidden">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">💬</span>
            </div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {organizationName}
            </h1>
          </div>
          {!isExpanded && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xs">💬</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-3 overflow-auto h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
          {sections.map((section) => (
            <div key={section.label}>
              <div className={`px-2 text-[10px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-1 transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 h-4' : 'opacity-0 h-0'}`}>
                {section.label}
              </div>
              <div className="space-y-1">
                {(section.items || []).map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
