export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'postponed' | 'archived';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type SkillMasteryState =
  | 'not_started'
  | 'novice'
  | 'exploring'
  | 'learning'
  | 'practicing'
  | 'competent'
  | 'applying'
  | 'advanced'
  | 'expert'
  | 'mastery_candidate'
  | 'mastered';
export type AIPersonality = 'concise' | 'detailed' | 'friendly' | 'professional' | 'direct' | 'analytical' | 'encouraging';
export type ResponseLength = 'compact' | 'balanced' | 'comprehensive';
export type MotivationStyle = 'practical' | 'gentle' | 'stoic' | 'energetic';
export type MemoryCategory = 'personality' | 'working_style' | 'skills' | 'goals' | 'projects' | 'preferences';

export interface UserProfile {
  name: string;
  avatar: string;
  role: string;
  preferredWorkingHours: string;
  timezone: string;
  workStyle?: string;
  targetFocusHoursPerDay?: number;
}

export interface AIMemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface AISettings {
  personality: AIPersonality;
  responseLength: ResponseLength;
  motivationStyle: MotivationStyle;
  memoryEnabled: boolean;
  suggestionFrequency: 'low' | 'normal' | 'high';
  dailyBriefingEnabled: boolean;
  knowledgeCheckFrequency: 'occasional' | 'after_every_session' | 'manual';
  autoReschedulePrompt: boolean;
  proactivity?: 'high' | 'medium' | 'low';
  detailLevel?: 'concise' | 'balanced' | 'detailed';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedDuration?: number; // in minutes
  category?: string;
  projectId?: string;
  skillId?: string;
  tags: string[];
  notes?: string;
  subtasks: Subtask[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'weekdays';
  createdAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string;
  progress: number; // 0-100
  milestones: Milestone[];
  githubUrl?: string;
  technologies: string[];
  notes?: string;
  links: { title: string; url: string }[];
  color: string;
  createdAt: string;
}

export interface SkillSubtopic {
  id: string;
  title: string;
  completed: boolean;
}

export type TopicState =
  | 'locked'
  | 'available'
  | 'learning'
  | 'practicing'
  | 'understood'
  | 'applied'
  | 'completed'
  | 'needs_review'
  | 'not_started'
  | 'in_progress'
  | 'mastered';

export type SkillTopicState = TopicState;

export interface SkillTopic {
  id: string;
  name: string;
  description: string;
  importance: 'essential' | 'high' | 'supporting';
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  prerequisites: string[];
  state: TopicState;
  mastery: number; // 0-100
  subtopics: SkillSubtopic[];
  practicePrompt?: string;
  applicationPrompt?: string;
  skipped?: boolean;
  notes?: string;
  resources?: { title: string; url?: string; type: string }[];
}

export interface SkillDomain {
  id: string;
  name: string;
  description: string;
  mastery: number; // 0-100
  stage?: 'foundations' | 'core' | 'intermediate' | 'advanced' | 'specialization' | 'practical_application' | 'mastery';
  topics: SkillTopic[];
}

export interface SkillMasteryProject {
  id: string;
  title: string;
  description: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  completed: boolean;
  status?: 'not_started' | 'in_progress' | 'completed';
  projectUrl?: string;
  repositoryUrl?: string;
  evidenceNotes?: string;
  completedAt?: string;
}

export interface SkillTimelineEvent {
  id: string;
  date: string;
  title: string;
  rating?: number; // e.g., 8.7
  type: 'session' | 'topic_completed' | 'project_application' | 'milestone';
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  currentLevel?: string;
  whyLearn?: string;
  primaryGoal?: string;
  availableTime?: string;
  learningStyle?: string;
  targetMastery: number; // typically 100
  currentMastery: number; // 0-100
  state: SkillMasteryState;
  domains: SkillDomain[];
  masteryProjects?: SkillMasteryProject[];
  stagnationWarning?: string;
  weakAreas?: string[];
  rationale?: string;
  recommendedFirstAction?: string;
  startedAt: string;
  lastPracticedAt?: string;
  totalPracticeMinutes: number;
  timeline: SkillTimelineEvent[];
  linkedProjectIds: string[];
  iconName?: string;
  color?: string;
}

export interface LearningRatingDimension {
  score: number; // 1-10
  comment: string;
}

export interface LearningRating {
  overallScore: number;
  dimensions: {
    understanding: LearningRatingDimension;
    depth: LearningRatingDimension;
    practice: LearningRatingDimension;
    application: LearningRatingDimension;
    consistency: LearningRatingDimension;
    retention: LearningRatingDimension;
  };
}

export interface LearningReview {
  topicsCoveredSummary: string;
  depthAnalysis: string;
  practicalApplicationAnalysis: string;
  stageIdentified: 'exposed' | 'understood' | 'practiced' | 'applied' | 'mastered';
  whatWentWell: string[];
  whatNeedsImprovement: string[];
  whatToRevisit: string[];
  recommendedNextTopic: string;
  recommendedPractice: string;
}

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userSelection?: number;
  isCorrect?: boolean;
}

export interface KnowledgeCheck {
  id: string;
  topicName: string;
  questions: KnowledgeCheckQuestion[];
  completed: boolean;
  score?: number;
}

export interface SkillLearningSession {
  id: string;
  skillId: string;
  skillName: string;
  topicIds: string[];
  topicNames: string[];
  timeSpentMinutes: number;
  date: string; // ISO date
  notes: string;
  userReflections: string;
  practiceCompleted: string;
  questions: string;
  confidence: number; // 1-5
  review?: LearningReview;
  rating?: LearningRating;
  knowledgeCheck?: KnowledgeCheck;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'technical' | 'personal' | 'growth';
  targetDate: string;
  progress: number; // 0-100
  milestones: Milestone[];
  linkedSkillIds: string[];
  linkedProjectIds: string[];
  createdAt: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes?: number;
  type: 'task' | 'milestone' | 'deadline' | 'learning_session' | 'event';
  referenceId?: string;
  completed?: boolean;
  color?: string;
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Subject {
  id: string;
  code: string;
  name: string;
  faculty: string;
  building: string;
  room: string;
  color?: string;
}

export interface TimetableEntry {
  id: string;
  weekday: Weekday;
  subjectId: string;
  startTime: string; // e.g. "09:30 AM"
  endTime: string;   // e.g. "10:20 AM"
}

export interface StickyNoteTaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority?: Priority;
  linkedTaskId?: string;
}

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isCollapsed: boolean;
  opacity: number; // 0.6 to 1.0
  position: { x: number; y: number };
  size: { width: number; height: number };
  linkedProjectId?: string;
  linkedSkillId?: string;
  isFloatingOpen: boolean;
  mode?: 'tasks' | 'notes' | 'combined';
  noteTasks?: StickyNoteTaskItem[];
  trackDailyProgress?: boolean;
  isExternalPiPOpen?: boolean;
  createdAt: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  description: string;
  category: 'project' | 'technical' | 'creative' | 'business' | 'growth';
  tags: string[];
  status: 'inbox' | 'evaluating' | 'converted' | 'archived';
  convertedTo?: { type: 'task' | 'project' | 'goal' | 'note'; id: string };
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: 'snippet' | 'architecture' | 'reference' | 'guide' | string;
  tags: string[];
  codeLanguage?: string;
  codeSnippet?: string;
  linkedSkillId?: string;
  linkedProjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyWin {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  category: 'accomplishment' | 'solved' | 'learned' | 'shipped';
}

export interface FocusSession {
  id: string;
  title: string;
  durationMinutes: number;
  startedAt: string;
  completedAt?: string;
  taskId?: string;
  skillId?: string;
  projectId?: string;
  completed: boolean;
}

export interface AIFloatingGuideState {
  isOpen: boolean;
  isMinimized: boolean;
  currentFocusTitle: string;
  currentStepIndex: number;
  totalSteps: number;
  steps: { id: string; title: string; completed: boolean }[];
  aiCoachingTip: string;
  taskId?: string;
  skillId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionTaken?: {
    type: 'create_task' | 'update_task' | 'create_skill' | 'recommend_action' | 'review_session' | 'rate_learning' | 'none';
    details: string;
    payload?: any;
  };
  suggestions?: string[];
}

export type WhatsAppItemType = 'task' | 'calendar_event' | 'idea' | 'casual';

export interface WhatsAppParsedData {
  isActionable: boolean;
  type: WhatsAppItemType;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedDuration?: number; // minutes
  tags: string[];
  confidence: number; // 0.0 - 1.0
  reasoning: string;
}

export interface WhatsAppSuggestion {
  id: string;
  messageId: string;
  sender: string;
  senderName?: string;
  rawMessage: string;
  receivedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  parsedData: WhatsAppParsedData;
  approvedAt?: string;
  createdItemId?: string;
  targetType?: WhatsAppItemType;
}

export interface WhatsAppConfig {
  enabled: boolean;
  verifyToken: string;
  allowedSenders: string[];
  autoCategorize: boolean;
  notificationOnReceived: boolean;
  defaultPriority: 'urgent' | 'high' | 'medium' | 'low';
}
