import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Inbox, Users, List, ChevronDown, Plus, Search, PanelLeftClose, PanelLeft, X, FileText, Wrench, DollarSign, Lightbulb, Bug, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import ColorModeContext from '../../../context/ColorModeContext';
import NewConversationModal from './NewConversationModal';

/**
 * InboxLayout: Main ticketing inbox UI with LibreDesk-style navigation
 * - Left sidebar: My Inbox, Unassigned, All, Team Inboxes, Views
 * - Center: Ticket list with filters
 * - Right: Conversation detail (via Outlet)
 */
export default function InboxLayout() {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [teamInboxesExpanded, setTeamInboxesExpanded] = useState(true);
  const [viewsExpanded, setViewsExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Team inboxes configuration - Category wise
  const teamInboxes = [
    { name: 'General', icon: FileText, key: 'general' },
    { name: 'Technical Issue', icon: Wrench, key: 'technical-issue' },
    { name: 'Billing', icon: DollarSign, key: 'billing' },
    { name: 'Feature Request', icon: Lightbulb, key: 'feature-request' },
    { name: 'Bug Report', icon: Bug, key: 'bug-report' },
  ];

  const views = [
    { name: 'High', icon: AlertCircle, key: 'high-priority', priority: 'high' },
    { name: 'Medium', icon: AlertTriangle, key: 'medium-priority', priority: 'medium' },
    { name: 'Low', icon: Info, key: 'low-priority', priority: 'low' },
  ];

  // Determine active view
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes('/my-inbox')) return 'my-inbox';
    if (path.includes('/unassigned')) return 'unassigned';
    if (path.includes('/all')) return 'all';
    if (path.includes('/team/')) {
      const team = path.split('/team/')[1]?.split('/')[0];
      return `team-${team}`;
    }
    if (path.includes('/view/')) {
      const view = path.split('/view/')[1]?.split('/')[0];
      return `view-${view}`;
    }
    return 'my-inbox';
  };

  const activeView = getActiveView();

  const NavItem = ({ label, icon: Icon, view, count, emoji, priority }) => {
    const isActive = activeView === view;
    
    // Color based on priority
    const getPriorityColor = () => {
      if (priority === 'high') return 'text-red-600 dark:text-red-400';
      if (priority === 'medium') return 'text-yellow-600 dark:text-yellow-400';
      if (priority === 'low') return 'text-green-600 dark:text-green-400';
      return '';
    };
    
    return (
      <button
        onClick={() => {
          if (view === 'my-inbox') navigate('./my-inbox');
          else if (view === 'unassigned') navigate('./unassigned');
          else if (view === 'all') navigate('./all');
          else if (view.startsWith('team-')) {
            const team = view.replace('team-', '');
            navigate(`./team/${team}`);
          } else if (view.startsWith('view-')) {
            const v = view.replace('view-', '');
            navigate(`./view/${v}`);
          }
        }}
        className={`
          w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-normal transition-all
          ${isActive
            ? 'bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100'
          }
        `}
      >
        {emoji ? (() => {
          const EmojiIcon = emoji;
          return <EmojiIcon size={16} strokeWidth={2} className={getPriorityColor()} />;
        })() : Icon && <Icon size={16} strokeWidth={2} />}
        <span className="flex-1 text-left text-[13px]">{label}</span>
        {count !== undefined && count > 0 && (
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="ticketing-layout h-screen flex bg-white dark:bg-gray-950 overflow-hidden">
      {/* Left sidebar - Inbox */}
      {!sidebarCollapsed && (
        <div className="w-44 lg:w-48 xl:w-52 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
          {/* Sidebar header with Inbox title and search */}
          <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-3 gap-2 flex-shrink-0">
            <Inbox size={18} className="text-gray-700 dark:text-gray-300" />
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1">Inbox</h1>
            <button 
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
          {/* New conversation button */}
          {/* <div className="p-2.5">
            <button
              onClick={() => setShowNewConversation(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={8} />
              <span>New conversation</span>
            </button>
          </div> */}

          {/* Main views */}
          <nav className="px-2 space-y-0.5">
            <NavItem label="My Inbox" icon={Inbox} view="my-inbox" />
            <NavItem label="Unassigned" icon={Users} view="unassigned" />
            <NavItem label="All" icon={List} view="all" />
          </nav>

          {/* Team Inboxes */}
          <div className="mt-3 px-2">
            <button
              onClick={() => setTeamInboxesExpanded(!teamInboxesExpanded)}
              className="w-full flex items-center gap-1.5 px-1 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform ${teamInboxesExpanded ? '' : '-rotate-90'}`} />
              <span className="uppercase tracking-wide">Team Inboxes</span>
            </button>
            {teamInboxesExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {teamInboxes.map(t => (
                  <NavItem key={t.key} label={t.name} emoji={t.icon} view={`team-${t.key}`} />
                ))}
              </div>
            )}
          </div>

          {/* Priority Views */}
          <div className="mt-3 px-2">
            <button
              onClick={() => setViewsExpanded(!viewsExpanded)}
              className="w-full flex items-center gap-1.5 px-1 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform ${viewsExpanded ? '' : '-rotate-90'}`} />
              <span className="uppercase tracking-wide">Priority</span>
            </button>
            {viewsExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {views.map(v => (
                  <NavItem key={v.key} label={v.name} emoji={v.icon} view={`view-${v.key}`} priority={v.priority} />
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Center+Right: Tickets List and Opened Ticket Detail via Outlet */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        <Outlet context={{ sidebarCollapsed, setSidebarCollapsed, activeView, getActiveView }} />
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl mx-4">
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Search header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <Search size={18} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by reference number, contact email address or messages in conversations."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search results/empty state */}
              <div className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Search conversations
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Search by reference number, contact email address or messages in conversations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}
    </div>
  );
}
