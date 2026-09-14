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
} from './types';

export const initialProfile: UserProfile = {
  name: 'Personal Workspace',
  avatar: '',
  role: 'LifeOS Operator',
  targetFocusHoursPerDay: 4,
  workStyle: 'Focused & Deliberate',
  preferredWorkingHours: '9:00 AM - 6:00 PM',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

export const initialSettings: AISettings = {
  personality: 'analytical',
  responseLength: 'balanced',
  motivationStyle: 'practical',
  memoryEnabled: true,
  suggestionFrequency: 'normal',
  dailyBriefingEnabled: true,
  knowledgeCheckFrequency: 'occasional',
  autoReschedulePrompt: true,
  proactivity: 'medium',
  detailLevel: 'balanced',
};

export const initialMemory: AIMemoryItem[] = [];

export const initialSkills: Skill[] = [];

export const initialProjects: Project[] = [];

export const initialTasks: Task[] = [];

export const initialGoals: Goal[] = [];

export const initialCalendar: CalendarItem[] = [];

export const initialStickyNotes: StickyNote[] = [];

export const initialIdeas: IdeaItem[] = [];

export const initialKnowledge: KnowledgeEntry[] = [];

export const initialWins: DailyWin[] = [];

export const initialLearningSessions: SkillLearningSession[] = [];

export const initialChatMessages: ChatMessage[] = [];
