import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  UserProfile,
  AISettings,
  AIMemoryItem,
  Task,
  Project,
  Skill,
  Goal,
  CalendarItem,
  StickyNote,
  IdeaItem,
  KnowledgeEntry,
  DailyWin,
  SkillLearningSession,
  ChatMessage,
  AIFloatingGuideState,
  FocusSession,
  SkillDomain,
  SkillTopic,
  KnowledgeCheck,
  SkillMasteryProject,
} from '../types';
import {
  initialProfile,
  initialSettings,
  initialMemory,
  initialSkills,
  initialProjects,
  initialTasks,
  initialGoals,
  initialCalendar,
  initialStickyNotes,
  initialIdeas,
  initialKnowledge,
  initialWins,
  initialLearningSessions,
  initialChatMessages,
} from '../initialData';
import {
  askAIAgent,
  generateSkillRoadmap,
  reviewDailyLearningSession,
  generateKnowledgeCheck,
  breakdownTaskWithAI,
  AIContextPayload,
  GenerateRoadmapOptions,
} from '../services/aiService';
import { calculateSkillMastery, calculateOverallSkillsProgress, getMasteryLevelInfo, getSkillMasteryPercentage } from '../utils/progressEngine';

export type AuthStatus = 'loading' | 'needs_setup' | 'unauthenticated' | 'authenticated';

export interface CurrentUser {
  role: 'admin' | 'guest';
  username: string;
  displayName: string;
}

const STORAGE_KEY = 'lifeos_ai_state_v2';

interface LifeOSContextType {
  // Auth
  authStatus: AuthStatus;
  currentUser: CurrentUser | null;
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setupAdmin: (username: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  loginGuest: () => Promise<void>;
  logout: () => Promise<void>;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateAdminProfileName: (displayName: string) => Promise<{ success: boolean; error?: string }>;
  restoreWorkspaceBackup: (jsonData: any) => Promise<{ success: boolean; error?: string }>;

  // State
  profile: UserProfile;
  settings: AISettings;
  memory: AIMemoryItem[];
  skills: Skill[];
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  calendar: CalendarItem[];
  stickyNotes: StickyNote[];
  ideas: IdeaItem[];
  knowledge: KnowledgeEntry[];
  wins: DailyWin[];
  learningSessions: SkillLearningSession[];
  chatMessages: ChatMessage[];
  floatingGuide: AIFloatingGuideState;
  activeFocusSession: FocusSession | null;
  isMomentumModeOpen: boolean;
  searchQuery: string;
  isSearchOpen: boolean;
  isQuickAddOpen: boolean;
  isDailyBriefingOpen: boolean;

  // Setters & Modals
  setSearchQuery: (q: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsQuickAddOpen: (open: boolean) => void;
  setIsDailyBriefingOpen: (open: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (updates: Partial<AISettings>) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  breakdownTaskAI: (id: string) => Promise<void>;
  rescheduleTask: (id: string, newDate: string, newTime?: string) => void;

  // Skills
  addSkill: (name: string, description: string, options?: GenerateRoadmapOptions | string) => Promise<Skill>;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  updateSkillMastery: (id: string, mastery: number) => void;
  deleteSkill: (id: string) => void;
  logSkillLearningSession: (sessionData: {
    skillId: string;
    topicIds: string[];
    timeSpentMinutes: number;
    notes: string;
    userReflections: string;
    practiceCompleted: string;
    questions: string;
    confidence: number;
  }) => Promise<SkillLearningSession>;
  runKnowledgeCheck: (skillId: string, topicName: string) => Promise<KnowledgeCheck>;
  saveKnowledgeCheckResult: (sessionId: string, check: KnowledgeCheck) => void;
  updateTopicState: (skillId: string, topicId: string, state: SkillTopic['state'], mastery: number) => void;
  updateTopicDetails: (skillId: string, topicId: string, updates: Partial<SkillTopic>) => void;
  addCustomTopic: (skillId: string, domainId: string, topic: Partial<SkillTopic>) => void;
  deleteTopic: (skillId: string, domainId: string, topicId: string) => void;
  updateSkillMasteryProject: (skillId: string, projectId: string, updates: Partial<SkillMasteryProject>) => void;

  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => void;

  // Calendar
  addCalendarItem: (item: Omit<CalendarItem, 'id'>) => CalendarItem;
  deleteCalendarItem: (id: string) => void;

  // Sticky Notes
  addStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt'>) => StickyNote;
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteStickyNote: (id: string) => void;
  openDailyProgressStickyNote: () => StickyNote;
  toggleStickyNoteFloating: (id: string) => void;

  // Ideas
  addIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => IdeaItem;
  updateIdea: (id: string, updates: Partial<IdeaItem>) => void;
  deleteIdea: (id: string) => void;
  convertIdea: (ideaId: string, targetType: 'task' | 'project' | 'goal' | 'note') => void;

  // Knowledge
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => KnowledgeEntry;
  updateKnowledgeEntry: (id: string, updates: Partial<KnowledgeEntry>) => void;
  deleteKnowledgeEntry: (id: string) => void;

  // Memory
  addMemoryItem: (item: Omit<AIMemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => AIMemoryItem;
  updateMemoryItem: (id: string, updates: Partial<AIMemoryItem>) => void;
  deleteMemoryItem: (id: string) => void;
  clearAllMemory: () => void;

  // Daily Wins
  addDailyWin: (text: string, category?: DailyWin['category']) => DailyWin;
  deleteDailyWin: (id: string) => void;

  // AI Chat & Co-Pilot
  sendChatMessage: (content: string) => Promise<void>;
  clearChatHistory: () => void;

  // Floating Guide & Momentum
  startMomentumMode: (task?: Task) => void;
  exitMomentumMode: () => void;
  setFloatingGuide: (guide: Partial<AIFloatingGuideState>) => void;
  advanceFloatingGuideStep: () => void;
  closeFloatingGuide: () => void;

  // Import / Export / Backup
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  restoreDefaults: () => void;

  // Metrics
  skillsProgressPercentage: number;
  dailyProgressPercentage: number;
}

const LifeOSContext = createContext<LifeOSContextType | null>(null);

export function LifeOSProvider({ children }: { children: ReactNode }) {
  // Load state from localStorage or initial seed
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
      return saved ? JSON.parse(saved) : initialProfile;
    } catch {
      return initialProfile;
    }
  });

  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [memory, setMemory] = useState<AIMemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_memory`);
      return saved ? JSON.parse(saved) : initialMemory;
    } catch {
      return initialMemory;
    }
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_skills`);
      return saved ? JSON.parse(saved) : initialSkills;
    } catch {
      return initialSkills;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
      return saved ? JSON.parse(saved) : initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
      return saved ? JSON.parse(saved) : initialGoals;
    } catch {
      return initialGoals;
    }
  });

  const [calendar, setCalendar] = useState<CalendarItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_calendar`);
      return saved ? JSON.parse(saved) : initialCalendar;
    } catch {
      return initialCalendar;
    }
  });

  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_stickynotes`);
      return saved ? JSON.parse(saved) : initialStickyNotes;
    } catch {
      return initialStickyNotes;
    }
  });

  const [ideas, setIdeas] = useState<IdeaItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ideas`);
      return saved ? JSON.parse(saved) : initialIdeas;
    } catch {
      return initialIdeas;
    }
  });

  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_knowledge`);
      return saved ? JSON.parse(saved) : initialKnowledge;
    } catch {
      return initialKnowledge;
    }
  });

  const [wins, setWins] = useState<DailyWin[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_wins`);
      return saved ? JSON.parse(saved) : initialWins;
    } catch {
      return initialWins;
    }
  });

  const [learningSessions, setLearningSessions] = useState<SkillLearningSession[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sessions`);
      return saved ? JSON.parse(saved) : initialLearningSessions;
    } catch {
      return initialLearningSessions;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_chat`);
      return saved ? JSON.parse(saved) : initialChatMessages;
    } catch {
      return initialChatMessages;
    }
  });

  // Auth & Session State
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('lifeos_auth_token');
    } catch {
      return null;
    }
  });

  // UI States
  const [floatingGuide, setFloatingGuideState] = useState<AIFloatingGuideState>({
    isOpen: false,
    isMinimized: false,
    currentFocusTitle: '',
    currentStepIndex: 0,
    totalSteps: 0,
    steps: [],
    aiCoachingTip: '',
    taskId: undefined,
  });

  const [activeFocusSession, setActiveFocusSession] = useState<FocusSession | null>(null);
  const [isMomentumModeOpen, setIsMomentumModeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);

  // Load workspace data from server
  const loadWorkspaceFromServer = async (token?: string | null) => {
    const activeToken = token || authToken || localStorage.getItem('lifeos_auth_token');
    if (!activeToken) return;
    try {
      const res = await fetch('/api/workspace', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const payload = await res.json();
        const data = payload?.data;
        if (data) {
          if (data.profile) setProfile(data.profile);
          if (data.settings) setSettings(data.settings);
          if (data.memory) setMemory(data.memory);
          if (data.skills) setSkills(data.skills);
          if (data.projects) setProjects(data.projects);
          if (data.tasks) setTasks(data.tasks);
          if (data.goals) setGoals(data.goals);
          if (data.calendar) setCalendar(data.calendar);
          if (data.stickyNotes) setStickyNotes(data.stickyNotes);
          if (data.ideas) setIdeas(data.ideas);
          if (data.knowledge) setKnowledge(data.knowledge);
          if (data.wins) setWins(data.wins);
          if (data.learningSessions) setLearningSessions(data.learningSessions);
          if (data.chatMessages) setChatMessages(data.chatMessages);
        }
      }
    } catch (err) {
      console.error('Failed to load workspace from server:', err);
    }
  };

  // Check auth on initial mount
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const token = localStorage.getItem('lifeos_auth_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/auth/status', { headers });
        if (!res.ok) {
          if (isMounted) setAuthStatus('needs_setup');
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        if (!data.hasAdmin) {
          setAuthStatus('needs_setup');
          setCurrentUser(null);
        } else if (data.user) {
          setCurrentUser(data.user);
          setAuthStatus('authenticated');
          setAuthToken(token);
          loadWorkspaceFromServer(token);
        } else {
          setAuthStatus('unauthenticated');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth status check error:', err);
        if (isMounted) setAuthStatus('unauthenticated');
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state to local storage cache & server
  useEffect(() => {
    if (authStatus !== 'authenticated' || !authToken) return;

    const currentData = {
      profile,
      settings,
      memory,
      skills,
      projects,
      tasks,
      goals,
      calendar,
      stickyNotes,
      ideas,
      knowledge,
      wins,
      learningSessions,
      chatMessages,
    };

    try {
      localStorage.setItem(`${STORAGE_KEY}_${currentUser?.role || 'admin'}`, JSON.stringify(currentData));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    const handler = setTimeout(() => {
      fetch('/api/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ data: currentData }),
      }).catch(err => console.error('Failed to persist workspace:', err));
    }, 1000);

    return () => clearTimeout(handler);
  }, [profile, settings, memory, skills, projects, tasks, goals, calendar, stickyNotes, ideas, knowledge, wins, learningSessions, chatMessages, authStatus, authToken, currentUser?.role]);

  // Context payload for AI
  const aiContextPayload: AIContextPayload = useMemo(() => ({
    tasks,
    projects,
    skills,
    goals,
    memory,
    settings,
    currentTime: new Date().toISOString(),
  }), [tasks, projects, skills, goals, memory, settings]);

  // Skills Progress Calculation
  // Calculated STRICTLY and ONLY from the user's added skills.
  // Overall Skills Progress = average mastery percentage of all added skills.
  // If the user has no skills added, display 0%.
  // Do NOT calculate this from daily tasks, completed tasks, calendar events, or today's activity.
  const skillsProgressPercentage = useMemo(() => {
    return calculateOverallSkillsProgress(skills, learningSessions, projects);
  }, [skills, learningSessions, projects]);

  // Backwards compatibility alias
  const dailyProgressPercentage = skillsProgressPercentage;

  // Settings & Profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // --- TASKS ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);

    // Also sync to calendar if it has due date
    if (newTask.dueDate) {
      addCalendarItem({
        title: newTask.title,
        date: newTask.dueDate,
        time: newTask.dueTime,
        durationMinutes: newTask.estimatedDuration || 30,
        type: 'task',
        referenceId: newTask.id,
        color: newTask.priority === 'urgent' ? '#EF4444' : '#6366F1',
      });
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setCalendar(prev => prev.filter(c => c.referenceId !== id));
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const isCompleted = t.status !== 'completed';
          const newStatus = isCompleted ? 'completed' : 'in_progress';
          const completedAt = isCompleted ? new Date().toISOString() : undefined;
          if (isCompleted) {
            addDailyWin(`Completed task: "${t.title}"`, 'accomplishment');
          }
          return { ...t, status: newStatus, completedAt };
        }
        return t;
      })
    );
  };

  const breakdownTaskAI = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const subtaskTitles = await breakdownTaskWithAI(task.title, task.description);
    const newSubtasks = subtaskTitles.map((title, idx) => ({
      id: `sub-${Date.now()}-${idx}`,
      title,
      completed: false,
    }));
    updateTask(id, { subtasks: [...task.subtasks, ...newSubtasks] });
  };

  const rescheduleTask = (id: string, newDate: string, newTime?: string) => {
    updateTask(id, { dueDate: newDate, dueTime: newTime, status: 'in_progress' });
    setCalendar(prev =>
      prev.map(c => (c.referenceId === id ? { ...c, date: newDate, time: newTime } : c))
    );
  };

  // --- SKILLS ---
  const addSkill = async (
    name: string,
    description: string,
    options?: GenerateRoadmapOptions | string
  ): Promise<Skill> => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
    const chosenColor = colors[skills.length % colors.length];

    const opts: GenerateRoadmapOptions = typeof options === 'string'
      ? { category: options }
      : (options || { category: 'Technology' });

    const roadmapData = await generateSkillRoadmap(name, description, opts);
    const domains: SkillDomain[] = (roadmapData.domains || []).map((dom: any, dIdx: number) => ({
      id: `dom-${Date.now()}-${dIdx}`,
      name: dom.name,
      stage: dom.stage,
      description: dom.description,
      mastery: 0,
      topics: (dom.topics || []).map((top: any, tIdx: number) => ({
        id: `top-${Date.now()}-${dIdx}-${tIdx}`,
        name: top.name,
        description: top.description,
        importance: top.importance || 'essential',
        difficulty: top.difficulty || 'foundational',
        prerequisites: top.prerequisites || [],
        state: top.state || (dIdx === 0 && tIdx === 0 ? 'available' : 'locked'),
        mastery: 0,
        subtopics: (top.subtopics || []).map((st: string, sIdx: number) => ({
          id: `sub-${Date.now()}-${dIdx}-${tIdx}-${sIdx}`,
          title: st,
          completed: false,
        })),
        practicePrompt: top.practicePrompt,
        applicationPrompt: top.applicationPrompt,
      })),
    }));

    const masteryProjects: SkillMasteryProject[] = (roadmapData.masteryProjects || []).map((p: any, pIdx: number) => ({
      id: `proj-m-${Date.now()}-${pIdx}`,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty || 'intermediate',
      completed: false,
    }));

    const newSkill: Skill = {
      id: 'skill-' + Date.now(),
      name,
      description,
      category: opts.category || 'Technology',
      subcategory: opts.subcategory,
      currentLevel: opts.currentLevel || 'beginner',
      whyLearn: opts.whyLearn,
      primaryGoal: opts.primaryGoal,
      availableTime: opts.availableTime,
      learningStyle: opts.learningStyle,
      targetMastery: 100,
      currentMastery: typeof opts.initialMastery === 'number' ? Math.max(0, Math.min(100, Math.round(opts.initialMastery))) : 0,
      state: typeof opts.initialMastery === 'number' && opts.initialMastery > 0 ? (getMasteryLevelInfo(opts.initialMastery).state as any) : 'novice',
      domains,
      masteryProjects,
      rationale: roadmapData.rationale,
      recommendedFirstAction: roadmapData.recommendedFirstAction,
      startedAt: new Date().toISOString().slice(0, 10),
      totalPracticeMinutes: 0,
      timeline: [
        {
          id: 'tl-' + Date.now(),
          date: new Date().toISOString().slice(0, 10),
          title: 'Skill roadmap generated by AI',
          type: 'milestone',
          description: `Structured ${domains.length} progression stages and ${domains.reduce((acc, d) => acc + d.topics.length, 0)} mastery topics with 3 real-world projects.`,
        },
      ],
      linkedProjectIds: opts.linkedProjects || [],
      color: chosenColor,
    };

    setSkills(prev => [newSkill, ...prev]);

    // Log AI chat confirmation
    setChatMessages(prev => [
      ...prev,
      {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        content: `I've created the **${name}** mastery roadmap with **${domains.length} progression stages**. Today's first recommended foundational topic is **${domains[0]?.topics[0]?.name || 'Core Foundations'}**.`,
        timestamp: new Date().toISOString(),
        actionTaken: {
          type: 'create_skill',
          details: `Generated structured roadmap for ${name}`,
        },
        suggestions: [
          `What should I learn first in ${name}?`,
          `Log a practice session for ${name}`,
          `Link a project to ${name}`,
        ],
      },
    ]);

    return newSkill;
  };

  const updateSkill = (id: string, updates: Partial<Skill>) => {
    setSkills(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        if (updates.currentMastery !== undefined) {
          const clamped = Math.max(0, Math.min(100, Math.round(updates.currentMastery)));
          updated.currentMastery = clamped;
          updated.state = getMasteryLevelInfo(clamped).state as any;
        }
        return updated;
      })
    );
  };

  const updateSkillMastery = (id: string, mastery: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(mastery)));
    updateSkill(id, { currentMastery: clamped });
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const updateTopicState = (skillId: string, topicId: string, state: SkillTopic['state'], mastery: number) => {
    setSkills(prev =>
      prev.map(skill => {
        if (skill.id !== skillId) return skill;
        const updatedDomains = skill.domains.map(dom => {
          const updatedTopics = dom.topics.map(topic => {
            if (topic.id === topicId) {
              return { ...topic, state, mastery };
            }
            return topic;
          });
          const domMastery = Math.round(
            updatedTopics.reduce((acc, t) => acc + t.mastery, 0) / (updatedTopics.length || 1)
          );
          return { ...dom, topics: updatedTopics, mastery: domMastery };
        });

        // Recalculate genuine mastery evidence
        const tempSkill = { ...skill, domains: updatedDomains };
        const masteryResult = calculateSkillMastery(tempSkill, learningSessions, projects);

        return {
          ...skill,
          domains: updatedDomains,
          currentMastery: masteryResult.percentage,
          state: masteryResult.masteryInfo.state,
          lastPracticedAt: new Date().toISOString().slice(0, 10),
        };
      })
    );
  };

  const updateTopicDetails = (skillId: string, topicId: string, updates: Partial<SkillTopic>) => {
    setSkills(prev =>
      prev.map(skill => {
        if (skill.id !== skillId) return skill;
        const updatedDomains = skill.domains.map(dom => {
          const updatedTopics = dom.topics.map(topic => {
            if (topic.id === topicId) {
              const newState = updates.state || topic.state;
              const newMastery = updates.mastery !== undefined
                ? updates.mastery
                : (newState === 'completed' || newState === 'mastered' ? 100 : newState === 'applied' ? 85 : newState === 'understood' ? 65 : topic.mastery);
              return { ...topic, ...updates, state: newState, mastery: newMastery };
            }
            return topic;
          });
          const domMastery = Math.round(
            updatedTopics.reduce((acc, t) => acc + (t.mastery || 0), 0) / (updatedTopics.length || 1)
          );
          return { ...dom, topics: updatedTopics, mastery: domMastery };
        });

        const tempSkill = { ...skill, domains: updatedDomains };
        const masteryResult = calculateSkillMastery(tempSkill, learningSessions, projects);

        return {
          ...skill,
          domains: updatedDomains,
          currentMastery: masteryResult.percentage,
          state: masteryResult.masteryInfo.state,
        };
      })
    );
  };

  const addCustomTopic = (skillId: string, domainId: string, topicData: Partial<SkillTopic>) => {
    setSkills(prev =>
      prev.map(skill => {
        if (skill.id !== skillId) return skill;
        const newTopic: SkillTopic = {
          id: `top-custom-${Date.now()}`,
          name: topicData.name || 'New Topic',
          description: topicData.description || 'Custom added learning topic.',
          importance: topicData.importance || 'high',
          difficulty: topicData.difficulty || 'intermediate',
          prerequisites: topicData.prerequisites || [],
          state: topicData.state || 'available',
          mastery: 0,
          subtopics: topicData.subtopics || [],
          practicePrompt: topicData.practicePrompt || 'Apply this concept in an interactive exercise.',
          applicationPrompt: topicData.applicationPrompt,
          notes: topicData.notes,
        };

        const updatedDomains = skill.domains.map(dom => {
          if (dom.id === domainId) {
            return { ...dom, topics: [...dom.topics, newTopic] };
          }
          return dom;
        });

        const tempSkill = { ...skill, domains: updatedDomains };
        const masteryResult = calculateSkillMastery(tempSkill, learningSessions, projects);

        return {
          ...skill,
          domains: updatedDomains,
          currentMastery: masteryResult.percentage,
          state: masteryResult.masteryInfo.state,
        };
      })
    );
  };

  const deleteTopic = (skillId: string, domainId: string, topicId: string) => {
    setSkills(prev =>
      prev.map(skill => {
        if (skill.id !== skillId) return skill;
        const updatedDomains = skill.domains.map(dom => {
          if (dom.id === domainId) {
            return { ...dom, topics: dom.topics.filter(t => t.id !== topicId) };
          }
          return dom;
        });

        const tempSkill = { ...skill, domains: updatedDomains };
        const masteryResult = calculateSkillMastery(tempSkill, learningSessions, projects);

        return {
          ...skill,
          domains: updatedDomains,
          currentMastery: masteryResult.percentage,
          state: masteryResult.masteryInfo.state,
        };
      })
    );
  };

  const updateSkillMasteryProject = (skillId: string, projectId: string, updates: Partial<SkillMasteryProject>) => {
    setSkills(prev =>
      prev.map(skill => {
        if (skill.id !== skillId) return skill;
        const updatedProjects = (skill.masteryProjects || []).map(p =>
          p.id === projectId ? { ...p, ...updates } : p
        );
        const tempSkill = { ...skill, masteryProjects: updatedProjects };
        const masteryResult = calculateSkillMastery(tempSkill, learningSessions, projects);
        return {
          ...skill,
          masteryProjects: updatedProjects,
          currentMastery: masteryResult.percentage,
          state: masteryResult.masteryInfo.state,
        };
      })
    );
  };

  const logSkillLearningSession = async (sessionData: {
    skillId: string;
    topicIds: string[];
    timeSpentMinutes: number;
    notes: string;
    userReflections: string;
    practiceCompleted: string;
    questions: string;
    confidence: number;
  }): Promise<SkillLearningSession> => {
    const skill = skills.find(s => s.id === sessionData.skillId);
    const skillName = skill?.name || 'Skill';

    // Find topic names
    const allTopics = skill?.domains.flatMap(d => d.topics) || [];
    const topicNames = allTopics
      .filter(t => sessionData.topicIds.includes(t.id))
      .map(t => t.name);

    // Call AI Review Engine
    const { review, rating } = await reviewDailyLearningSession({
      skillName,
      topicNames: topicNames.length > 0 ? topicNames : ['Skill Session Practice'],
      timeSpentMinutes: sessionData.timeSpentMinutes,
      notes: sessionData.notes,
      userReflections: sessionData.userReflections,
      practiceCompleted: sessionData.practiceCompleted,
      questions: sessionData.questions,
      confidence: sessionData.confidence,
    });

    const newSession: SkillLearningSession = {
      id: 'sess-' + Date.now(),
      skillId: sessionData.skillId,
      skillName,
      topicIds: sessionData.topicIds,
      topicNames,
      timeSpentMinutes: sessionData.timeSpentMinutes,
      date: new Date().toISOString(),
      notes: sessionData.notes,
      userReflections: sessionData.userReflections,
      practiceCompleted: sessionData.practiceCompleted,
      questions: sessionData.questions,
      confidence: sessionData.confidence,
      review,
      rating,
    };

    setLearningSessions(prev => [newSession, ...prev]);

    // Update skill practice time & timeline
    if (skill) {
      const addedMastery = Math.min(100, Math.round(skill.currentMastery + (rating.overallScore >= 8 ? 4 : 2)));
      const newTimelineEvent = {
        id: 'tl-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        title: topicNames[0] || 'Learning Session',
        rating: rating.overallScore,
        type: 'session' as const,
        description: review.topicsCoveredSummary,
      };

      // Advance topic state
      sessionData.topicIds.forEach(tId => {
        updateTopicState(skill.id, tId, 'completed', 90);
      });

      updateSkill(skill.id, {
        currentMastery: addedMastery,
        totalPracticeMinutes: skill.totalPracticeMinutes + sessionData.timeSpentMinutes,
        lastPracticedAt: new Date().toISOString().slice(0, 10),
        timeline: [newTimelineEvent, ...skill.timeline],
      });
    }

    // Add daily win
    addDailyWin(
      `Learned ${skillName}: ${topicNames.join(', ')} (Rated ${rating.overallScore}/10 ⭐)`,
      'learned'
    );

    return newSession;
  };

  const runKnowledgeCheck = async (skillId: string, topicName: string): Promise<KnowledgeCheck> => {
    const skill = skills.find(s => s.id === skillId);
    return await generateKnowledgeCheck(skill?.name || 'Skill', topicName);
  };

  const saveKnowledgeCheckResult = (sessionId: string, check: KnowledgeCheck) => {
    setLearningSessions(prev =>
      prev.map(sess => (sess.id === sessionId ? { ...sess, knowledgeCheck: check } : sess))
    );
  };

  // --- PROJECTS ---
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    const newProj: Project = {
      ...projectData,
      id: 'proj-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [newProj, ...prev]);
    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updatedMilestones = p.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
        return { ...p, milestones: updatedMilestones, progress };
      })
    );
  };

  // --- GOALS ---
  const addGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: 'goal-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [newGoal, ...prev]);
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleGoalMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
        return { ...g, milestones: updatedMilestones, progress };
      })
    );
  };

  // --- CALENDAR ---
  const addCalendarItem = (itemData: Omit<CalendarItem, 'id'>): CalendarItem => {
    const newItem: CalendarItem = {
      ...itemData,
      id: 'cal-' + Date.now(),
    };
    setCalendar(prev => [...prev, newItem]);
    return newItem;
  };

  const deleteCalendarItem = (id: string) => {
    setCalendar(prev => prev.filter(c => c.id !== id));
  };

  // --- STICKY NOTES ---
  const addStickyNote = (noteData: Omit<StickyNote, 'id' | 'createdAt'>): StickyNote => {
    const newNote: StickyNote = {
      ...noteData,
      id: 'note-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setStickyNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateStickyNote = (id: string, updates: Partial<StickyNote>) => {
    setStickyNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
  };

  const openDailyProgressStickyNote = (): StickyNote => {
    // Check if there is already a sticky note configured for daily progress
    const existing = stickyNotes.find(n => n.trackDailyProgress);
    if (existing) {
      updateStickyNote(existing.id, { isFloatingOpen: true, isCollapsed: false });
      return existing;
    }

    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 380) : 100;
    const newNote = addStickyNote({
      title: 'Daily Progress & Focus',
      content: '',
      color: '#18181b',
      isPinned: true,
      isCollapsed: false,
      opacity: 0.98,
      position: { x: defaultX, y: 72 },
      size: { width: 340, height: 480 },
      isFloatingOpen: true,
      mode: 'tasks',
      trackDailyProgress: true,
      noteTasks: [],
    });
    return newNote;
  };

  const toggleStickyNoteFloating = (id: string) => {
    setStickyNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, isFloatingOpen: !n.isFloatingOpen } : n))
    );
  };

  // --- IDEAS ---
  const addIdea = (ideaData: Omit<IdeaItem, 'id' | 'createdAt'>): IdeaItem => {
    const newIdea: IdeaItem = {
      ...ideaData,
      id: 'idea-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setIdeas(prev => [newIdea, ...prev]);
    return newIdea;
  };

  const updateIdea = (id: string, updates: Partial<IdeaItem>) => {
    setIdeas(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
  };

  const deleteIdea = (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
  };

  const convertIdea = (ideaId: string, targetType: 'task' | 'project' | 'goal' | 'note') => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    if (targetType === 'task') {
      const newTask = addTask({
        title: idea.title,
        description: idea.description,
        priority: 'medium',
        status: 'not_started',
        dueDate: new Date().toISOString().slice(0, 10),
        tags: idea.tags,
        subtasks: [],
      });
      updateIdea(ideaId, { status: 'converted', convertedTo: { type: 'task', id: newTask.id } });
    } else if (targetType === 'project') {
      const newProj = addProject({
        name: idea.title,
        description: idea.description,
        status: 'planning',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        progress: 0,
        milestones: [],
        technologies: idea.tags,
        links: [],
        color: '#6366F1',
      });
      updateIdea(ideaId, { status: 'converted', convertedTo: { type: 'project', id: newProj.id } });
    } else if (targetType === 'goal') {
      const newGoal = addGoal({
        title: idea.title,
        description: idea.description,
        category: 'growth',
        targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        progress: 0,
        milestones: [],
        linkedSkillIds: [],
        linkedProjectIds: [],
      });
      updateIdea(ideaId, { status: 'converted', convertedTo: { type: 'goal', id: newGoal.id } });
    } else if (targetType === 'note') {
      const newNote = addStickyNote({
        title: idea.title,
        content: idea.description,
        color: '#FEF08A',
        isPinned: false,
        isCollapsed: false,
        opacity: 1,
        position: { x: 50, y: 150 },
        size: { width: 280, height: 180 },
        isFloatingOpen: true,
      });
      updateIdea(ideaId, { status: 'converted', convertedTo: { type: 'note', id: newNote.id } });
    }
  };

  // --- KNOWLEDGE ---
  const addKnowledgeEntry = (entryData: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeEntry => {
    const newEntry: KnowledgeEntry = {
      ...entryData,
      id: 'kb-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setKnowledge(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const updateKnowledgeEntry = (id: string, updates: Partial<KnowledgeEntry>) => {
    setKnowledge(prev =>
      prev.map(k => (k.id === id ? { ...k, ...updates, updatedAt: new Date().toISOString() } : k))
    );
  };

  const deleteKnowledgeEntry = (id: string) => {
    setKnowledge(prev => prev.filter(k => k.id !== id));
  };

  // --- MEMORY ---
  const addMemoryItem = (itemData: Omit<AIMemoryItem, 'id' | 'createdAt' | 'updatedAt'>): AIMemoryItem => {
    const newItem: AIMemoryItem = {
      ...itemData,
      id: 'mem-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemory(prev => [newItem, ...prev]);
    return newItem;
  };

  const updateMemoryItem = (id: string, updates: Partial<AIMemoryItem>) => {
    setMemory(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m))
    );
  };

  const deleteMemoryItem = (id: string) => {
    setMemory(prev => prev.filter(m => m.id !== id));
  };

  const clearAllMemory = () => {
    setMemory([]);
  };

  // --- DAILY WINS ---
  const addDailyWin = (text: string, category: DailyWin['category'] = 'accomplishment'): DailyWin => {
    const newWin: DailyWin = {
      id: 'win-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      text,
      category,
    };
    setWins(prev => [newWin, ...prev]);
    return newWin;
  };

  const deleteDailyWin = (id: string) => {
    setWins(prev => prev.filter(w => w.id !== id));
  };

  // --- AI CHAT ---
  const sendChatMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMsg]);

    const res = await askAIAgent(content, aiContextPayload, chatMessages);

    // If an action was taken, execute it reactively!
    if (res.actionTaken) {
      if (res.actionTaken.type === 'create_task' && res.actionTaken.payload?.title) {
        addTask({
          title: res.actionTaken.payload.title,
          priority: res.actionTaken.payload.priority || 'medium',
          status: 'not_started',
          dueDate: res.actionTaken.payload.dueDate || new Date().toISOString().slice(0, 10),
          tags: ['ai-added'],
          subtasks: [],
        });
      }
    }

    const assistantMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1),
      sender: 'assistant',
      content: res.reply,
      timestamp: new Date().toISOString(),
      actionTaken: res.actionTaken?.type !== 'none' ? res.actionTaken : undefined,
      suggestions: res.suggestions,
    };

    setChatMessages(prev => [...prev, assistantMsg]);
  };

  const clearChatHistory = () => {
    setChatMessages([]);
  };

  // --- FLOATING GUIDE & MOMENTUM ---
  const setFloatingGuide = (guide: Partial<AIFloatingGuideState>) => {
    setFloatingGuideState(prev => ({ ...prev, ...guide }));
  };

  const advanceFloatingGuideStep = () => {
    setFloatingGuideState(prev => {
      const nextIdx = prev.currentStepIndex + 1;
      const updatedSteps = prev.steps.map((s, idx) =>
        idx <= prev.currentStepIndex ? { ...s, completed: true } : s
      );
      return {
        ...prev,
        currentStepIndex: Math.min(nextIdx, prev.totalSteps - 1),
        steps: updatedSteps,
      };
    });
  };

  const closeFloatingGuide = () => {
    setFloatingGuideState(prev => ({ ...prev, isOpen: false }));
  };

  const startMomentumMode = (task?: Task) => {
    const target = task || tasks.find(t => t.status === 'in_progress') || tasks[0];
    if (target) {
      setActiveFocusSession({
        id: 'foc-' + Date.now(),
        title: target.title,
        durationMinutes: target.estimatedDuration || 35,
        startedAt: new Date().toISOString(),
        taskId: target.id,
        projectId: target.projectId,
        skillId: target.skillId,
        completed: false,
      });
      setFloatingGuideState({
        isOpen: true,
        isMinimized: false,
        currentFocusTitle: target.title,
        currentStepIndex: 0,
        totalSteps: target.subtasks.length || 3,
        steps: target.subtasks.length > 0
          ? target.subtasks
          : [
              { id: 's1', title: 'Review requirements and setup environment', completed: false },
              { id: 's2', title: 'Implement primary solution logic', completed: false },
              { id: 's3', title: 'Verify tests and edge cases', completed: false },
            ],
        aiCoachingTip: `Focus strictly on "${target.title}". Eliminate secondary tabs and distractions.`,
        taskId: target.id,
      });
    }
    setIsMomentumModeOpen(true);
  };

  const exitMomentumMode = () => {
    setIsMomentumModeOpen(false);
  };

  // --- IMPORT / EXPORT / BACKUP ---
  const exportDataJSON = (): string => {
    const backup = {
      version: 'LifeOS-AI-v2.0',
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      memory,
      skills,
      projects,
      tasks,
      goals,
      calendar,
      stickyNotes,
      ideas,
      knowledge,
      wins,
      learningSessions,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) setProfile(data.profile);
      if (data.settings) setSettings(data.settings);
      if (data.memory) setMemory(data.memory);
      if (data.skills) setSkills(data.skills);
      if (data.projects) setProjects(data.projects);
      if (data.tasks) setTasks(data.tasks);
      if (data.goals) setGoals(data.goals);
      if (data.calendar) setCalendar(data.calendar);
      if (data.stickyNotes) setStickyNotes(data.stickyNotes);
      if (data.ideas) setIdeas(data.ideas);
      if (data.knowledge) setKnowledge(data.knowledge);
      if (data.wins) setWins(data.wins);
      if (data.learningSessions) setLearningSessions(data.learningSessions);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  const restoreDefaults = async () => {
    setProfile(initialProfile);
    setSettings(initialSettings);
    setMemory(initialMemory);
    setSkills(initialSkills);
    setProjects(initialProjects);
    setTasks(initialTasks);
    setGoals(initialGoals);
    setCalendar(initialCalendar);
    setStickyNotes(initialStickyNotes);
    setIdeas(initialIdeas);
    setKnowledge(initialKnowledge);
    setWins(initialWins);
    setLearningSessions(initialLearningSessions);
    setChatMessages(initialChatMessages);

    // Clear all client-side cached workspace state in localStorage
    const keysToRemove = [
      `${STORAGE_KEY}_profile`,
      `${STORAGE_KEY}_settings`,
      `${STORAGE_KEY}_memory`,
      `${STORAGE_KEY}_skills`,
      `${STORAGE_KEY}_projects`,
      `${STORAGE_KEY}_tasks`,
      `${STORAGE_KEY}_goals`,
      `${STORAGE_KEY}_calendar`,
      `${STORAGE_KEY}_notes`,
      `${STORAGE_KEY}_ideas`,
      `${STORAGE_KEY}_knowledge`,
      `${STORAGE_KEY}_wins`,
      `${STORAGE_KEY}_sessions`,
      `${STORAGE_KEY}_chat`,
    ];
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        // ignore
      }
    });

    // Notify server to clear persisted workspace if logged in
    const activeToken = authToken || localStorage.getItem('lifeos_auth_token');
    if (activeToken) {
      try {
        await fetch('/api/workspace/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      } catch (err) {
        console.warn('Backend reset notification failed:', err);
      }
    }
  };

  // --- AUTH METHODS ---
  const loginAdmin = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }
      localStorage.setItem('lifeos_auth_token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setAuthStatus('authenticated');
      await loadWorkspaceFromServer(data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const setupAdmin = async (username: string, password: string, displayName?: string) => {
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Setup failed.' };
      }
      localStorage.setItem('lifeos_auth_token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      if (data.user?.displayName) {
        setProfile(prev => ({ ...prev, name: data.user.displayName }));
      }
      setAuthStatus('authenticated');
      await loadWorkspaceFromServer(data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const loginGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('lifeos_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setAuthStatus('authenticated');
        await loadWorkspaceFromServer(data.token);
      }
    } catch (err) {
      console.error('Guest login failed:', err);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('lifeos_auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('lifeos_auth_token');
      setAuthToken(null);
      setCurrentUser(null);
      setAuthStatus('unauthenticated');
      restoreDefaults();
    }
  };

  const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = localStorage.getItem('lifeos_auth_token') || authToken;
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to change password.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const updateAdminProfileName = async (displayName: string) => {
    try {
      const token = localStorage.getItem('lifeos_auth_token') || authToken;
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(prev => prev ? { ...prev, displayName: data.user.displayName } : null);
        setProfile(prev => ({ ...prev, name: data.user.displayName }));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const restoreWorkspaceBackup = async (jsonData: any) => {
    try {
      const token = localStorage.getItem('lifeos_auth_token') || authToken;
      const res = await fetch('/api/workspace/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: jsonData }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to restore workspace.' };
      }
      await loadWorkspaceFromServer(token || undefined);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  return (
    <LifeOSContext.Provider
      value={{
        authStatus,
        currentUser,
        loginAdmin,
        setupAdmin,
        loginGuest,
        logout,
        changeAdminPassword,
        updateAdminProfileName,
        restoreWorkspaceBackup,
        profile,
        settings,
        memory,
        skills,
        projects,
        tasks,
        goals,
        calendar,
        stickyNotes,
        ideas,
        knowledge,
        wins,
        learningSessions,
        chatMessages,
        floatingGuide,
        activeFocusSession,
        isMomentumModeOpen,
        searchQuery,
        isSearchOpen,
        isQuickAddOpen,
        isDailyBriefingOpen,
        setSearchQuery,
        setIsSearchOpen,
        setIsQuickAddOpen,
        setIsDailyBriefingOpen,
        updateProfile,
        updateSettings,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        breakdownTaskAI,
        rescheduleTask,
        addSkill,
        updateSkill,
        deleteSkill,
        logSkillLearningSession,
        runKnowledgeCheck,
        saveKnowledgeCheckResult,
        updateTopicState,
        updateTopicDetails,
        addCustomTopic,
        deleteTopic,
        updateSkillMasteryProject,
        addProject,
        updateProject,
        deleteProject,
        toggleMilestone,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleGoalMilestone,
        addCalendarItem,
        deleteCalendarItem,
        addStickyNote,
        updateStickyNote,
        deleteStickyNote,
        openDailyProgressStickyNote,
        toggleStickyNoteFloating,
        addIdea,
        updateIdea,
        deleteIdea,
        convertIdea,
        addKnowledgeEntry,
        updateKnowledgeEntry,
        deleteKnowledgeEntry,
        addMemoryItem,
        updateMemoryItem,
        deleteMemoryItem,
        clearAllMemory,
        addDailyWin,
        deleteDailyWin,
        sendChatMessage,
        clearChatHistory,
        startMomentumMode,
        exitMomentumMode,
        setFloatingGuide,
        advanceFloatingGuideStep,
        closeFloatingGuide,
        exportDataJSON,
        importDataJSON,
        restoreDefaults,
        skillsProgressPercentage,
        dailyProgressPercentage,
        updateSkillMastery,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
}
