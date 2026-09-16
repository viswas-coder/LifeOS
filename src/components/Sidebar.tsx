import React from 'react';
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  FolderGit2,
  GraduationCap,
  Target,
  Calendar,
  Lightbulb,
  BookOpen,
  BarChart3,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  LogOut,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export type NavView =
  | 'dashboard'
  | 'ai_agent'
  | 'tasks'
  | 'projects'
  | 'skills'
  | 'goals'
  | 'calendar'
  | 'ideas_notes'
  | 'knowledge_base'
  | 'analytics'
  | 'ai_memory'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { profile, skillsProgressPercentage, startMomentumMode, skills, currentUser, logout } = useLifeOS();

  const navItems: { id: NavView; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai_agent', label: 'AI Agent', icon: Bot, badge: 'AI' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'skills', label: 'Skills & Mastery', icon: GraduationCap, badge: skills.length },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ideas_notes', label: 'Idea Vault & Notes', icon: Lightbulb },
    { id: 'knowledge_base', label: 'Knowledge Base', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai_memory', label: 'AI Memory', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="main-sidebar"
      className={`relative flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-250 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-zinc-800">
        <button
          onClick={() => onSelectView('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none min-w-0"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-850 text-zinc-100 border border-zinc-750 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-zinc-100 text-sm">LifeOS</span>
                <span className="rounded px-1 py-0.2 text-[9px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-800 border border-zinc-700">
                  AI
                </span>
              </div>
            </div>
          )}
        </button>

        <button
          id="btn-sidebar-collapse"
          onClick={onToggleCollapse}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Skills Progress Gauge (When expanded) */}
      {!isCollapsed && (
        <div className="mx-3 mt-3 rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
            <span className="text-zinc-400">Skills Progress</span>
            <span className="font-mono text-zinc-200">{skillsProgressPercentage}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-300 transition-all duration-300"
              style={{ width: `${skillsProgressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectView(item.id)}
              className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-850 text-zinc-100 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-850/60 hover:text-zinc-200 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-zinc-750 text-zinc-200'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Momentum Mode CTA */}
      <div className="p-2.5 border-t border-zinc-800">
        <button
          id="btn-sidebar-momentum"
          onClick={() => startMomentumMode()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-750 bg-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 py-2 text-xs font-medium text-zinc-200 hover:text-white transition-all ${
            isCollapsed ? 'px-0' : 'px-2.5'
          }`}
          title="Start Momentum Focus Mode"
        >
          <Zap className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
          {!isCollapsed && <span>Momentum Focus</span>}
        </button>
      </div>

      {/* User Mini Profile & Logout */}
      <div className="flex items-center gap-2.5 border-t border-zinc-800 p-2.5">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name || 'User Avatar'}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-700 shrink-0"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-semibold shrink-0 uppercase select-none">
            {((currentUser?.displayName || profile.name || 'U').trim()[0] || 'U').toUpperCase()}
          </div>
        )}
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-medium text-zinc-200">{currentUser?.displayName || profile.name}</p>
              <span
                className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                  currentUser?.role === 'admin'
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {currentUser?.role || 'user'}
              </span>
            </div>
            <p className="truncate text-[10px] text-zinc-400">
              {currentUser?.role === 'guest' ? 'Guest session' : `@${currentUser?.username || 'admin'}`}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="Sign Out / Lock Workspace"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
};
