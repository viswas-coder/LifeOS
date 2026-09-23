import React, { useState } from 'react';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { Sidebar, NavView } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { AIAgentView } from './components/AIAgentView';
import { TasksView } from './components/TasksView';
import { ProjectsView } from './components/ProjectsView';
import { SkillsView } from './components/SkillsView';
import { GoalsView } from './components/GoalsView';
import { CalendarView } from './components/CalendarView';
import { IdeasAndNotesView } from './components/IdeasAndNotesView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { AnalyticsView } from './components/AnalyticsView';
import { AIMemoryView } from './components/AIMemoryView';
import { WhatsAppAgentView } from './components/WhatsAppAgentView';
import { SettingsView } from './components/SettingsView';
import { FloatingAIGuide } from './components/FloatingAIGuide';
import { MomentumModeOverlay } from './components/MomentumModeOverlay';
import { FloatingStickyNotesHost } from './components/FloatingStickyNotesHost';
import { QuickAddModal } from './components/QuickAddModal';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

function MainLayout() {
  const { currentUser } = useLifeOS();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [history, setHistory] = useState<NavView[]>(['dashboard']);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | undefined>(undefined);

  const viewTitles: Record<NavView, string> = {
    dashboard: 'Dashboard',
    ai_agent: 'AI Co-pilot & Autonomous Execution',
    whatsapp_agent: 'WhatsApp AI Agent',
    tasks: 'Task Engine',
    projects: 'Projects & Architecture',
    skills: 'Skill Mastery Engine',
    goals: 'Strategic Goals',
    calendar: 'Time-Blocked Calendar',
    ideas_notes: 'Idea Vault & Scratchpads',
    knowledge_base: 'Engineering Knowledge Base',
    analytics: 'Performance & Mastery Analytics',
    ai_memory: 'AI Memory Console',
    settings: 'System Calibration & Backups',
  };

  const handleNavigate = (view: NavView) => {
    if (view !== currentView) {
      setHistory(prev => [...prev, view]);
      setCurrentView(view);
    }
    setIsMobileMenuOpen(false);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop(); // remove current view
      const prevView = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setCurrentView(prevView);
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    handleNavigate('skills');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c10] text-neutral-100 font-sans antialiased selection:bg-white/20 selection:text-white">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          currentView={currentView}
          onSelectView={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/80 backdrop-blur-sm">
          <div className="w-72 h-full bg-[#0e1015] border-r border-white/[0.06]">
            <Sidebar
              currentView={currentView}
              onSelectView={handleNavigate}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileMenuOpen(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {currentUser?.role === 'guest' && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>
                <strong>Guest Sandbox Session</strong> — Any changes remain in-memory and are isolated from the Admin workspace.
              </span>
            </div>
            <button
              onClick={() => setCurrentView('settings')}
              className="text-[11px] underline hover:text-amber-200 transition-colors"
            >
              Learn More
            </button>
          </div>
        )}

        <Navbar
          title={viewTitles[currentView]}
          canGoBack={currentView !== 'dashboard'}
          onBack={handleBack}
          backLabel={history.length > 1 ? 'Back' : 'Dashboard'}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto pb-16">
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} onSelectSkill={handleSelectSkill} />
          )}
          {currentView === 'ai_agent' && <AIAgentView />}
          {currentView === 'whatsapp_agent' && <WhatsAppAgentView />}
          {currentView === 'tasks' && <TasksView />}
          {currentView === 'projects' && <ProjectsView />}
          {currentView === 'skills' && (
            <SkillsView
              initialSelectedSkillId={selectedSkillId}
              onBackToDashboard={() => handleNavigate('dashboard')}
            />
          )}
          {currentView === 'goals' && <GoalsView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'ideas_notes' && <IdeasAndNotesView />}
          {currentView === 'knowledge_base' && <KnowledgeBaseView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'ai_memory' && <AIMemoryView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Persistent & Floating Overlays */}
      <FloatingAIGuide />
      <MomentumModeOverlay />
      <FloatingStickyNotesHost />
      <QuickAddModal onNavigateToAgent={() => handleNavigate('ai_agent')} />
      <DailyBriefingModal
        onNavigateToTasks={() => handleNavigate('tasks')}
        onNavigateToSkills={() => handleNavigate('skills')}
      />
      <GlobalSearchModal onNavigate={handleNavigate} />
    </div>
  );
}

function AppContent() {
  const { authStatus, currentUser, loginAdmin, setupAdmin, loginGuest } = useLifeOS();

  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0c10] text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Initializing LifeOS</span>
        </div>
      </div>
    );
  }

  if (authStatus === 'needs_setup' || authStatus === 'unauthenticated' || !currentUser) {
    return <AuthScreen />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <LifeOSProvider>
      <AppContent />
    </LifeOSProvider>
  );
}
