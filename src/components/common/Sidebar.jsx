import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { menuData } from './menuData';

// TailwindCSS Sidebar (no MUI). Supports nested menus, active highlight, collapse on mobile.
export default function Sidebar({ open, onClose, role = 'Agent', width = 200 }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

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
      <div className={`flex items-center justify-between ${open ? padding : 'justify-center'} pr-3 py-2 rounded-lg transition ${bgClasses} relative group`}>
        <div className={`flex items-center gap-2 min-w-0 ${open ? '' : 'justify-center'}`}>
          {/* Icon */}
          {item.icon && (
            <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
          )}
          <span className={`truncate text-sm font-medium ${textClasses} transition-opacity ${open ? 'opacity-100' : 'opacity-0 w-0'}`}>
            {item.name}
          </span>
        </div>
        {hasChildren && open && (
          <span className={`${textClasses}`}>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        )}
        
        {/* Tooltip when collapsed */}
        {!open && item.route && (
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
          <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden ml-2`}>
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
      {/* Mini Sidebar - Only icons on small screens when main sidebar is hidden */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-10 transition-all duration-300 ${
          open ? 'lg:w-0 lg:opacity-0' : 'w-16'
        }`}
      >
        <div className={`${open ? 'hidden lg:hidden' : 'flex'} flex-col items-center py-4 space-y-2 h-full overflow-x-hidden pt-20`}>
          {topLevelItems.map((item) => {
            // For Dashboard, check exact route
            const isDashboard = item.route === '/admin' || item.route === '/agent' || item.route === '/qa' || item.route === '/tl' || item.route === '/customer';
            
            // Check if current item is active
            let isActive = false;
            if (item.route) {
              isActive = isDashboard 
                ? location.pathname === item.route  // Exact match for Dashboard
                : location.pathname.startsWith(item.route);  // Prefix match for other routes
            } else if (item.subMenu) {
              // For submenu parents, check if any submenu route matches
              const checkSubMenuActive = (subMenu) => {
                return subMenu.some(subItem => {
                  if (subItem.route) {
                    return location.pathname.startsWith(subItem.route);
                  }
                  if (subItem.nestedSubMenu) {
                    return subItem.nestedSubMenu.some(nestedItem => 
                      location.pathname.startsWith(nestedItem.route)
                    );
                  }
                  return false;
                });
              };
              isActive = checkSubMenuActive(item.subMenu);
            }
            
            const Icon = item.icon;
            
            // Handle navigation for items without routes (submenu parents)
            const getNavigationRoute = (item) => {
              if (item.route) return item.route;
              
              // For items with subMenu, navigate to first submenu item
              if (item.subMenu && item.subMenu.length > 0) {
                const firstSubItem = item.subMenu[0];
                if (firstSubItem.route) return firstSubItem.route;
                
                // For nested submenus (like Reports), go deeper
                if (firstSubItem.nestedSubMenu && firstSubItem.nestedSubMenu.length > 0) {
                  return firstSubItem.nestedSubMenu[0].route;
                }
              }
              
              return '#'; // Fallback
            };
            
            const navRoute = getNavigationRoute(item);
            
            return (
              <Link
                key={item.name}
                to={navRoute}
                className={`p-3 rounded-lg transition-colors relative group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
                title={item.name}
              >
                <Icon size={20} />
                {/* Tooltip on hover */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Sidebar - Full width with text */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-10 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
        style={{ width: open ? width : 64 }}
      >
        {/* Logo/Brand Area */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center px-4">
          <h1 className={`text-lg font-bold text-gray-900 dark:text-white transition-opacity ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
            LIVE CHAT CRM
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-3 overflow-x-hidden h-[calc(100vh-4rem)]">
          {sections.map((section) => (
            <div key={section.label}>
              <div className={`px-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 transition-opacity ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
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
