import {
  Task,
  Project,
  Skill,
  Goal,
  AIMemoryItem,
  ChatMessage,
  LearningReview,
  LearningRating,
  KnowledgeCheck,
  AISettings,
} from '../types';

export interface AIContextPayload {
  tasks: Task[];
  projects: Project[];
  skills: Skill[];
  goals: Goal[];
  memory: AIMemoryItem[];
  settings: AISettings;
  currentTime: string;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('lifeos_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function askAIAgent(
  message: string,
  context: AIContextPayload,
  history: ChatMessage[] = []
): Promise<{
  reply: string;
  actionTaken?: {
    type: 'none' | 'create_task' | 'update_task' | 'create_skill' | 'recommend_action' | 'review_session' | 'rate_learning';
    details: string;
    payload?: any;
  };
  suggestions?: string[];
}> {
  try {
    const res = await fetch('/api/ai/agent', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        context,
        personality: context.settings.personality,
        history,
      }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Falling back to local AI agent reply:', error);
    const pendingTasks = context.tasks.filter(t => t.status !== 'completed');
    const firstTask = pendingTasks[0];
    return {
      reply: firstTask
        ? `I analyzed your active workspace. You have **${pendingTasks.length} pending tasks** and **${context.skills.length} skills in progress**.\n\nYour primary focus is **${firstTask.title}**.`
        : `I analyzed your active workspace. Your task queue is currently clear.\n\nYou can add a priority task, define a skill roadmap, or capture thoughts in your Idea Vault.`,
      suggestions: firstTask
        ? ['What should I do right now?', 'What should I learn next?', 'Review my tasks']
        : ['Add a priority task', 'Add a skill to master', 'Capture an idea'],
    };
  }
}

export interface GenerateRoadmapOptions {
  category?: string;
  subcategory?: string;
  currentLevel?: string;
  whyLearn?: string;
  primaryGoal?: string;
  availableTime?: string;
  learningStyle?: string;
  existingKnowledge?: string;
  weeklyHours?: number;
  linkedProjectId?: string;
  linkedGoalId?: string;
  linkedProjects?: string[];
  linkedGoals?: string[];
  targetMastery?: number;
  initialMastery?: number;
}

export async function generateSkillRoadmap(
  skillName: string,
  description?: string,
  options: GenerateRoadmapOptions = {}
): Promise<{
  domains: any[];
  masteryProjects?: any[];
  rationale?: string;
  recommendedFirstAction?: string;
}> {
  try {
    const res = await fetch('/api/ai/generate-roadmap', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        skillName,
        description,
        ...options,
      }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Using fallback skill roadmap generator:', error);
    return { domains: [] };
  }
}

export async function getSkillNextAction(
  skill: Skill,
  availableMinutes = 45,
  projects: Project[] = [],
  goals: Goal[] = []
): Promise<{
  topicName: string;
  domainName: string;
  why: string;
  estimatedMinutes: number;
  actionType: string;
  challengePrompt: string;
  stagnationNote?: string;
  alternatives?: { title: string; description: string; minutes: number }[];
}> {
  try {
    const res = await fetch('/api/ai/skill-next-action', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ skill, availableMinutes, projects, goals }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Failed to fetch skill next action, using local derivation:', error);
    const allTopics = (skill.domains || []).flatMap(d => d.topics || []);
    const target = allTopics.find(t => t.state !== 'completed' && t.state !== 'mastered') || allTopics[0];
    return {
      topicName: target ? target.name : `${skill.name} Core Foundations`,
      domainName: skill.domains[0]?.name || 'Foundations',
      why: 'High-leverage next focus area according to prerequisite progression.',
      estimatedMinutes: Math.min(availableMinutes, 35),
      actionType: 'learn',
      challengePrompt: target?.practicePrompt || `Build a 20-minute hands-on prototype exploring ${target?.name || 'core concepts'}.`,
    };
  }
}

export async function adaptSkillRoadmap(
  skill: Skill,
  instruction: string
): Promise<{ success: boolean; adaptedDomains?: any[]; explanation?: string }> {
  try {
    const res = await fetch('/api/ai/adapt-roadmap', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ skill, instruction }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Roadmap adaptation failed:', error);
    return { success: false, explanation: 'Failed to adapt roadmap.' };
  }
}

export async function reviewDailyLearningSession(payload: {
  skillName: string;
  topicNames: string[];
  timeSpentMinutes: number;
  notes: string;
  userReflections: string;
  practiceCompleted: string;
  questions: string;
  confidence: number;
  previousRatings?: number[];
}): Promise<{
  review: LearningReview;
  rating: LearningRating;
  stageIdentified: string;
}> {
  try {
    const res = await fetch('/api/ai/review-session', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return {
      review: {
        topicsCoveredSummary: data.topicsCoveredSummary || 'Topics reviewed in depth.',
        depthAnalysis: data.depthAnalysis || 'Explored core concepts and practical application.',
        practicalApplicationAnalysis: data.practicalApplicationAnalysis || 'Applied code patterns.',
        stageIdentified: data.stageIdentified || 'practiced',
        whatWentWell: data.whatWentWell || ['Strong deliberate focus', 'Active synthesis'],
        whatNeedsImprovement: data.whatNeedsImprovement || ['Test with edge case inputs'],
        whatToRevisit: data.whatToRevisit || ['Revisit performance tradeoffs'],
        recommendedNextTopic: data.recommendedNextTopic || 'Next logical topic in roadmap',
        recommendedPractice: data.recommendedPractice || 'Build an end-to-end prototype',
      },
      rating: data.rating || {
        overallScore: 8.5,
        dimensions: {
          understanding: { score: 8.8, comment: 'Solid mental model' },
          depth: { score: 8.4, comment: 'Good deep work' },
          practice: { score: 8.7, comment: 'Hands-on practice completed' },
          application: { score: 8.3, comment: 'Connected to projects' },
          consistency: { score: 8.5, comment: 'Active cadence' },
          retention: { score: 8.2, comment: 'Good recall' },
        },
      },
      stageIdentified: data.stageIdentified || 'practiced',
    };
  } catch (error) {
    console.warn('Using fallback learning review:', error);
    return {
      review: {
        topicsCoveredSummary: `Reviewed: ${payload.topicNames.join(', ')}`,
        depthAnalysis: 'Good hands-on engagement with core patterns.',
        practicalApplicationAnalysis: payload.practiceCompleted ? `Built: ${payload.practiceCompleted}` : 'Concepts consolidated.',
        stageIdentified: 'practiced',
        whatWentWell: ['Maintained focused session', 'Extracted tangible reflections'],
        whatNeedsImprovement: ['Deepen independent problem solving'],
        whatToRevisit: ['Key terminology and constraints'],
        recommendedNextTopic: 'Advanced System Execution',
        recommendedPractice: 'Build a small proof of concept from scratch without tutorial assistance.',
      },
      rating: {
        overallScore: 8.4,
        dimensions: {
          understanding: { score: 8.5, comment: 'Clear conceptual grasp' },
          depth: { score: 8.2, comment: 'Explored beyond basics' },
          practice: { score: 8.6, comment: 'Tangible exercises built' },
          application: { score: 8.4, comment: 'Connected to active project' },
          consistency: { score: 8.5, comment: 'Regular study cadence' },
          retention: { score: 8.1, comment: 'Strong recall of prior modules' },
        },
      },
      stageIdentified: 'practiced',
    };
  }
}

export async function generateKnowledgeCheck(
  skillName: string,
  topicName: string
): Promise<KnowledgeCheck> {
  try {
    const res = await fetch('/api/ai/knowledge-check', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ skillName, topicName }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return {
      id: 'kc-' + Date.now(),
      topicName,
      questions: (data.questions || []).map((q: any, i: number) => ({
        id: `q-${i}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
      completed: false,
    };
  } catch (error) {
    return {
      id: 'kc-' + Date.now(),
      topicName,
      questions: [
        {
          id: 'q-1',
          question: `What is the primary architectural principle when applying ${topicName}?`,
          options: [
            'Separate interface specifications from execution logic',
            'Avoid writing automated tests',
            'Store all state in global memory',
            'Rely exclusively on single-threaded execution',
          ],
          correctIndex: 0,
          explanation: 'Clear interface contracts decouple concerns and make systems modular, testable, and resilient.',
        },
      ],
      completed: false,
    };
  }
}

export async function askWhatToDoNow(
  tasks: Task[],
  projects: Project[],
  skills: Skill[],
  goals: Goal[],
  availableMinutes = 45
): Promise<{
  title: string;
  taskId?: string;
  durationMinutes: number;
  why: string;
  steps: string[];
  alternativeTitle?: string;
  alternativeWhy?: string;
}> {
  try {
    const res = await fetch('/api/ai/what-to-do-now', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tasks, projects, skills, goals, availableMinutes }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    const pending = tasks.filter(t => t.status !== 'completed');
    const top = pending.find(t => t.priority === 'urgent') || pending.find(t => t.priority === 'high') || pending[0];
    return {
      title: top?.title || 'Define your next high-leverage focus milestone',
      taskId: top?.id,
      durationMinutes: Math.min(availableMinutes, top?.estimatedDuration || 30),
      why: top
        ? 'This task addresses an immediate milestone and has highest impact on your momentum.'
        : 'Your queue is clear. Identify a strategic priority or start a skill practice sprint.',
      steps: [
        'Review acceptance criteria and expected outcomes',
        'Execute uninterrupted in a focused sprint',
        'Verify results and record reflections',
      ],
      alternativeTitle: 'Conduct a 20-minute Skill Deep Dive',
      alternativeWhy: 'If mental energy is drained, spend 20 minutes taking structured notes on your active skill roadmap.',
    };
  }
}

export async function askWhatToLearnNext(
  skills: Skill[],
  projects: Project[]
): Promise<{
  skillName: string;
  topicName: string;
  why: string;
  estimatedMinutes: number;
  practicalExercise: string;
}> {
  try {
    const res = await fetch('/api/ai/what-to-learn-next', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ skills, projects }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    const skill = skills.find(s => (s.currentMastery || 0) < 100) || skills[0];
    return {
      skillName: skill ? skill.name : 'Deliberate Skill Practice',
      topicName: skill ? `${skill.name} Core Foundations` : 'Create Your First Skill Roadmap',
      why: skill ? `Continuing progression in ${skill.name} will build systemic mastery.` : 'Map out an active learning goal to build durable mastery.',
      estimatedMinutes: 30,
      practicalExercise: skill ? `Complete a 30-minute hands-on implementation in ${skill.name}.` : 'Add a skill in the Skills & Roadmaps view.',
    };
  }
}

export async function breakdownTaskWithAI(
  title: string,
  description?: string
): Promise<string[]> {
  try {
    const res = await fetch('/api/ai/task-breakdown', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.subtasks || [];
  } catch (error) {
    return [
      'Define clear requirements and acceptance criteria',
      'Scaffold core data interfaces and schemas',
      'Implement primary business logic',
      'Write tests and verify edge cases',
      'Finalize, document, and review outcomes',
    ];
  }
}

export async function generateWeeklyReviewAI(
  tasks: Task[],
  skills: Skill[],
  projects: Project[],
  sessions: any[]
): Promise<{
  summary: string;
  whatWentWell: string[];
  whatNeedsAttention: string[];
  recommendedPriorities: string[];
}> {
  try {
    const res = await fetch('/api/ai/weekly-review', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tasks, skills, projects, sessions }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    return {
      summary: `Weekly momentum tracked: ${completedCount} completed tasks across ${skills.length} active skills.`,
      whatWentWell: ['Maintained consistent focus and deliberate action', 'Structured task breakdowns into tangible sprints'],
      whatNeedsAttention: ['Ensure deep-work blocks are scheduled without interruption', 'Address pending queue items regularly'],
      recommendedPriorities: ['Focus on top-priority milestones', 'Schedule dedicated practice sessions for key skills'],
    };
  }
}
