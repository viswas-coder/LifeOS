import { Task, Project, Goal, Skill, SkillDomain, SkillTopic, SkillLearningSession, DailyWin, Subtask, SkillMasteryState } from '../types';

export type ProgressState =
  | 'not_started'
  | 'started'
  | 'in_progress'
  | 'good_progress'
  | 'near_completion'
  | 'completed'
  | 'mastered';

export interface ProgressResult {
  value: number;
  maximum: number;
  percentage: number; // 0-100 (integer)
  status: ProgressState;
  statusLabel: string;
  detailLabel: string;
  hasMeasurableData: boolean;
}

export interface MasteryEvidence {
  positive: string[];
  needsImprovement: string[];
  levelTitle: string;
  levelDescription: string;
}

/**
 * Determines meaningful human-readable progress state based on actual percentage.
 */
export function getProgressState(percentage: number, hasData = true): { status: ProgressState; label: string } {
  if (!hasData || percentage === 0) {
    return { status: 'not_started', label: 'Not Started' };
  }
  if (percentage <= 25) {
    return { status: 'started', label: 'Started' };
  }
  if (percentage <= 55) {
    return { status: 'in_progress', label: 'In Progress' };
  }
  if (percentage <= 80) {
    return { status: 'good_progress', label: 'Good Progress' };
  }
  if (percentage < 100) {
    return { status: 'near_completion', label: 'Near Completion' };
  }
  return { status: 'completed', label: 'Completed' };
}

/**
 * Mastery level scale mapping (0-100):
 * 0–10   Not Started
 * 11–25  Exploring
 * 26–45  Learning
 * 46–65  Practicing
 * 66–80  Applying
 * 81–90  Advanced
 * 91–99  Mastery Candidate
 * 100    Mastered
 */
export function getMasteryLevelInfo(score: number): { state: SkillMasteryState; label: string; description: string } {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped <= 10) {
    return {
      state: 'not_started',
      label: 'Not Started',
      description: 'Foundational concepts not yet explored.',
    };
  }
  if (clamped <= 25) {
    return {
      state: 'exploring',
      label: 'Exploring',
      description: 'Beginning initial exploration and syllabus exposure.',
    };
  }
  if (clamped <= 45) {
    return {
      state: 'learning',
      label: 'Learning',
      description: 'Actively absorbing core terminology, mental models, and principles.',
    };
  }
  if (clamped <= 65) {
    return {
      state: 'practicing',
      label: 'Practicing',
      description: 'Regular hands-on exercises and practical application loops.',
    };
  }
  if (clamped <= 80) {
    return {
      state: 'applying',
      label: 'Applying',
      description: 'Building practical projects and solving real-world challenges.',
    };
  }
  if (clamped <= 90) {
    return {
      state: 'advanced',
      label: 'Advanced',
      description: 'Deep architectural understanding, edge case navigation, and fluency.',
    };
  }
  if (clamped < 100) {
    return {
      state: 'mastery_candidate',
      label: 'Mastery Candidate',
      description: 'Comprehensive retention, multiple shipped projects, and consistent evaluation.',
    };
  }
  return {
    state: 'mastered',
    label: 'Mastered',
    description: 'Verified real-world excellence with demonstrated production evidence.',
  };
}

/**
 * Calculates task subtask progress.
 */
export function calculateTaskProgress(task: Task): ProgressResult {
  if (!task.subtasks || task.subtasks.length === 0) {
    if (task.status === 'completed') {
      return {
        value: 1,
        maximum: 1,
        percentage: 100,
        status: 'completed',
        statusLabel: 'Completed',
        detailLabel: 'Task complete',
        hasMeasurableData: true,
      };
    }
    return {
      value: 0,
      maximum: 1,
      percentage: 0,
      status: task.status === 'in_progress' ? 'in_progress' : 'not_started',
      statusLabel: task.status === 'in_progress' ? 'In Progress' : 'Not Started',
      detailLabel: task.status === 'in_progress' ? 'In execution' : 'Pending',
      hasMeasurableData: false,
    };
  }

  const total = task.subtasks.length;
  const completed = task.subtasks.filter(s => s.completed).length;
  const percentage = Math.round((completed / total) * 100);
  const stateInfo = getProgressState(percentage, true);

  return {
    value: completed,
    maximum: total,
    percentage,
    status: stateInfo.status,
    statusLabel: stateInfo.label,
    detailLabel: `${completed} / ${total} subtasks`,
    hasMeasurableData: true,
  };
}

/**
 * Calculates Project progress based on:
 * - Completed tasks linked to project (50% weight)
 * - Completed milestones (40% weight)
 * - Project stage status (10% base or 100% if completed)
 *
 * If no tasks and no milestones exist:
 * returns hasMeasurableData: false, label: "No measurable progress yet", percentage: 0
 */
export function calculateProjectProgress(project: Project, allTasks: Task[] = []): ProgressResult & {
  completedTasks: number;
  totalTasks: number;
  completedMilestones: number;
  totalMilestones: number;
} {
  const projectTasks = allTasks.filter(t => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;

  const totalMilestones = project.milestones?.length || 0;
  const completedMilestones = project.milestones?.filter(m => m.completed).length || 0;

  // Check if project status is explicitly 'completed'
  if (project.status === 'completed') {
    return {
      value: totalTasks + totalMilestones || 1,
      maximum: totalTasks + totalMilestones || 1,
      percentage: 100,
      status: 'completed',
      statusLabel: 'Completed',
      detailLabel: `${completedTasks} / ${totalTasks} tasks · ${completedMilestones} / ${totalMilestones} milestones`,
      hasMeasurableData: true,
      completedTasks,
      totalTasks,
      completedMilestones,
      totalMilestones,
    };
  }

  // If no tasks AND no milestones exist:
  if (totalTasks === 0 && totalMilestones === 0) {
    return {
      value: 0,
      maximum: 0,
      percentage: 0,
      status: 'not_started',
      statusLabel: 'Not Started',
      detailLabel: 'No measurable progress yet',
      hasMeasurableData: false,
      completedTasks: 0,
      totalTasks: 0,
      completedMilestones: 0,
      totalMilestones: 0,
    };
  }

  let computedPercentage = 0;

  if (totalTasks > 0 && totalMilestones > 0) {
    const taskRatio = completedTasks / totalTasks;
    const milestoneRatio = completedMilestones / totalMilestones;
    computedPercentage = Math.round((taskRatio * 0.55 + milestoneRatio * 0.45) * 100);
  } else if (totalTasks > 0) {
    computedPercentage = Math.round((completedTasks / totalTasks) * 100);
  } else if (totalMilestones > 0) {
    computedPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  }

  // If planning and no completed items, show 0%
  if (project.status === 'planning' && completedTasks === 0 && completedMilestones === 0) {
    computedPercentage = 0;
  }

  const clamped = Math.max(0, Math.min(100, computedPercentage));
  const stateInfo = getProgressState(clamped, true);

  const detailParts: string[] = [];
  if (totalTasks > 0) detailParts.push(`${completedTasks}/${totalTasks} tasks`);
  if (totalMilestones > 0) detailParts.push(`${completedMilestones}/${totalMilestones} milestones`);

  return {
    value: completedTasks + completedMilestones,
    maximum: totalTasks + totalMilestones,
    percentage: clamped,
    status: stateInfo.status,
    statusLabel: stateInfo.label,
    detailLabel: detailParts.join(' · ') || 'No measurable progress yet',
    hasMeasurableData: true,
    completedTasks,
    totalTasks,
    completedMilestones,
    totalMilestones,
  };
}

/**
 * Calculates Goal progress based on milestones or linked projects.
 */
export function calculateGoalProgress(goal: Goal, allTasks: Task[] = [], allSkills: Skill[] = []): ProgressResult & {
  completedMilestones: number;
  totalMilestones: number;
} {
  const totalMilestones = goal.milestones?.length || 0;
  const completedMilestones = goal.milestones?.filter(m => m.completed).length || 0;

  if (totalMilestones === 0) {
    // If no milestones, check linked skills or manually saved progress
    const linkedSkills = allSkills.filter(s => goal.linkedSkillIds?.includes(s.id));
    if (linkedSkills.length > 0) {
      const avgMastery = Math.round(
        linkedSkills.reduce((acc, s) => acc + s.currentMastery, 0) / linkedSkills.length
      );
      const stateInfo = getProgressState(avgMastery, avgMastery > 0);
      return {
        value: avgMastery,
        maximum: 100,
        percentage: avgMastery,
        status: stateInfo.status,
        statusLabel: stateInfo.label,
        detailLabel: `${linkedSkills.length} linked skills avg`,
        hasMeasurableData: true,
        completedMilestones: 0,
        totalMilestones: 0,
      };
    }

    return {
      value: 0,
      maximum: 0,
      percentage: 0,
      status: 'not_started',
      statusLabel: 'Not Started',
      detailLabel: 'No measurable progress yet',
      hasMeasurableData: false,
      completedMilestones: 0,
      totalMilestones: 0,
    };
  }

  const percentage = Math.round((completedMilestones / totalMilestones) * 100);
  const stateInfo = getProgressState(percentage, true);

  return {
    value: completedMilestones,
    maximum: totalMilestones,
    percentage,
    status: stateInfo.status,
    statusLabel: stateInfo.label,
    detailLabel: `${completedMilestones} / ${totalMilestones} milestones`,
    hasMeasurableData: true,
    completedMilestones,
    totalMilestones,
  };
}

/**
 * Calculates Skill Mastery using a multi-dimensional evidence-based model:
 *
 * 1. Roadmap Completion (35% weight):
 *    - Topics completed / understood / mastered out of total topics.
 * 2. Practice & Depth (25% weight):
 *    - Total minutes practiced & number of recorded sessions.
 *    - Average daily session rating.
 * 3. Real Application & Projects (20% weight):
 *    - Completed linked projects or mastery projects.
 * 4. Retention & Knowledge Checks (20% weight):
 *    - Completed knowledge checks score, self-reported confidence.
 *
 * Crucial Rule:
 * NEVER allow 100% simply because topics are checked.
 * 100% requires:
 * - 100% roadmap topics completed
 * - At least 1 completed practical project
 * - At least 3 logged learning sessions with average rating >= 8.0
 * - At least 1 knowledge check passed >= 80%
 */
export function calculateSkillMastery(
  skill: Skill,
  allSessions: SkillLearningSession[] = [],
  allProjects: Project[] = []
): ProgressResult & {
  masteryInfo: ReturnType<typeof getMasteryLevelInfo>;
  evidence: MasteryEvidence;
  breakdown: {
    topicCompletion: { score: number; completedTopics: number; totalTopics: number };
    practiceVolume: { score: number; hoursLogged: number; sessionsCount: number };
    projectApplication: { score: number; completedCount: number; totalCount: number };
    knowledgeRetention: { score: number; checksPassed: number; confidenceScore: number };
  };
  completedTopics: number;
  totalTopics: number;
  sessionCount: number;
  completedProjectsCount: number;
} {
  const allTopics: SkillTopic[] = (skill.domains || []).flatMap(d => d.topics || []);
  const totalTopics = allTopics.length;

  // Topics completed or mastered
  const completedTopics = allTopics.filter(
    t => t.state === 'completed' || t.state === 'mastered' || t.state === 'applied' || (t.mastery || 0) >= 85
  ).length;

  const topicsUnderstood = allTopics.filter(
    t => t.state === 'understood' || t.state === 'practicing' || (t.mastery || 0) >= 50
  ).length;

  const skillSessions = allSessions.filter(s => s.skillId === skill.id);
  const sessionCount = skillSessions.length;

  const linkedProjects = allProjects.filter(p => skill.linkedProjectIds?.includes(p.id));
  const completedProjects = linkedProjects.filter(p => p.status === 'completed' || p.progress >= 95);

  const completedMasteryProjects = (skill as any).masteryProjects?.filter((p: any) => p.completed)?.length || 0;
  const totalProjectsCompleted = completedProjects.length + completedMasteryProjects;

  const positiveEvidence: string[] = [];
  const needsImprovement: string[] = [];

  // If no topics exist in the roadmap yet
  if (totalTopics === 0 && sessionCount === 0) {
    const levelInfo = getMasteryLevelInfo(0);
    return {
      value: 0,
      maximum: 100,
      percentage: 0,
      status: 'not_started',
      statusLabel: 'Not Started',
      detailLabel: 'No progress yet',
      hasMeasurableData: false,
      masteryInfo: levelInfo,
      evidence: {
        positive: [],
        needsImprovement: ['Generate or add syllabus topics to begin learning.'],
        levelTitle: levelInfo.label,
        levelDescription: levelInfo.description,
      },
      breakdown: {
        topicCompletion: { score: 0, completedTopics: 0, totalTopics: 0 },
        practiceVolume: { score: 0, hoursLogged: 0, sessionsCount: 0 },
        projectApplication: { score: 0, completedCount: 0, totalCount: 0 },
        knowledgeRetention: { score: 0, checksPassed: 0, confidenceScore: 0 },
      },
      completedTopics: 0,
      totalTopics: 0,
      sessionCount: 0,
      completedProjectsCount: 0,
    };
  }

  // Dimension 1: Roadmap Topic Completion (35%)
  let topicScore = 0;
  if (totalTopics > 0) {
    const fullWeight = (completedTopics / totalTopics) * 35;
    const partialWeight = ((topicsUnderstood - completedTopics) / totalTopics) * 15;
    topicScore = Math.max(0, fullWeight + Math.max(0, partialWeight));

    if (completedTopics > 0) {
      positiveEvidence.push(`${completedTopics} of ${totalTopics} roadmap topics fully mastered`);
    } else {
      needsImprovement.push('Complete foundational roadmap topics');
    }
  }

  // Dimension 2: Practice & Depth (25%)
  let practiceScore = 0;
  const totalMinutes = skill.totalPracticeMinutes || 0;
  if (totalMinutes > 0 || sessionCount > 0) {
    // 5 hours (300 mins) = high practice baseline
    const timeRatio = Math.min(1, totalMinutes / 300);
    const sessionRatio = Math.min(1, sessionCount / 5);

    // Average session rating if available
    const ratings = skillSessions.map(s => s.rating?.overallScore).filter((r): r is number => typeof r === 'number');
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 7.0;
    const ratingRatio = avgRating / 10;

    practiceScore = (timeRatio * 0.4 + sessionRatio * 0.3 + ratingRatio * 0.3) * 25;

    positiveEvidence.push(`${Math.round(totalMinutes)} mins deliberate practice across ${sessionCount} sessions`);
    if (ratings.length > 0) {
      positiveEvidence.push(`Consistent AI evaluation average rating: ${avgRating.toFixed(1)} / 10`);
    }
  } else {
    needsImprovement.push('Log practice sessions with notes and code reflections');
  }

  // Dimension 3: Application & Projects (20%)
  let applicationScore = 0;
  if (totalProjectsCompleted > 0) {
    const projectRatio = Math.min(1, totalProjectsCompleted / 2);
    applicationScore = projectRatio * 20;
    positiveEvidence.push(`${totalProjectsCompleted} practical project(s) shipped demonstrating real-world use`);
  } else {
    needsImprovement.push('Build a tangible project applying this skill in production');
  }

  // Dimension 4: Retention & Knowledge Checks (20%)
  let retentionScore = 0;
  const checks = skillSessions.filter(s => s.knowledgeCheck?.completed);
  if (checks.length > 0) {
    const checkScores = checks.map(c => c.knowledgeCheck?.score || 80);
    const avgCheck = checkScores.reduce((a, b) => a + b, 0) / checkScores.length;
    retentionScore = Math.min(20, (avgCheck / 100) * 20);
    positiveEvidence.push(`Retention checks verified (${Math.round(avgCheck)}% avg accuracy)`);
  } else if (sessionCount > 0) {
    // Base score for active sessions
    retentionScore = Math.min(10, sessionCount * 3);
    needsImprovement.push('Take an AI knowledge check to verify conceptual retention');
  } else {
    needsImprovement.push('Verify understanding with interactive scenario checks');
  }

  // Combined score
  let rawMastery = Math.round(topicScore + practiceScore + applicationScore + retentionScore);

  // Verification Gate: To reach 100% (Mastered), require strict proof:
  // Cannot be 100% unless at least 1 completed project, 3 sessions, and all topics done
  if (rawMastery >= 100) {
    const hasProjectEvidence = totalProjectsCompleted >= 1;
    const hasSessionEvidence = sessionCount >= 3;
    const hasAllTopics = totalTopics > 0 && completedTopics >= totalTopics;

    if (!hasProjectEvidence || !hasSessionEvidence || !hasAllTopics) {
      rawMastery = 95; // Capped as "Mastery Candidate" until full evidence is provided
      if (!hasProjectEvidence) {
        needsImprovement.push('Ship 1 final portfolio project to confirm 100% Mastery');
      }
    }
  }

  const finalMastery = Math.max(0, Math.min(100, rawMastery));
  const masteryInfo = getMasteryLevelInfo(finalMastery);

  return {
    value: finalMastery,
    maximum: 100,
    percentage: finalMastery,
    status: masteryInfo.state as ProgressState,
    statusLabel: masteryInfo.label,
    detailLabel: `${completedTopics} / ${totalTopics} topics · ${sessionCount} sessions`,
    hasMeasurableData: true,
    masteryInfo,
    evidence: {
      positive: positiveEvidence,
      needsImprovement,
      levelTitle: masteryInfo.label,
      levelDescription: masteryInfo.description,
    },
    breakdown: {
      topicCompletion: {
        score: Math.round((topicScore / 35) * 100),
        completedTopics,
        totalTopics,
      },
      practiceVolume: {
        score: Math.round((practiceScore / 25) * 100),
        hoursLogged: Math.round((totalMinutes / 60) * 10) / 10,
        sessionsCount: sessionCount,
      },
      projectApplication: {
        score: Math.round((applicationScore / 20) * 100),
        completedCount: totalProjectsCompleted,
        totalCount: Math.max(2, (skill.masteryProjects?.length || 0) + (skill.linkedProjectIds?.length || 0)),
      },
      knowledgeRetention: {
        score: Math.round((retentionScore / 20) * 100),
        checksPassed: checks.length,
        confidenceScore: checks.length > 0 ? 4 : 2,
      },
    },
    completedTopics,
    totalTopics,
    sessionCount,
    completedProjectsCount: totalProjectsCompleted,
  };
}

/**
 * Calculates Daily Progress based on meaningful actions:
 * - Tasks due today and completed today
 * - Learning sessions completed today
 * - Focus sessions completed today
 * - Daily wins logged today
 *
 * If no tasks, sessions, or wins exist today:
 * Returns percentage: 0, status: 'not_started', label: 'No actions yet today'
 * Avoids decorative 75% or fake numbers.
 */
export function calculateDailyProgress(
  tasks: Task[] = [],
  sessions: SkillLearningSession[] = [],
  wins: DailyWin[] = [],
  focusSessions: any[] = []
): ProgressResult & {
  completedActions: number;
  totalPlanned: number;
  summary: string;
} {
  const today = new Date().toISOString().slice(0, 10);

  // Meaningful tasks for today:
  // 1. Tasks explicitly scheduled for today
  // 2. Tasks marked urgent or in_progress
  // 3. Tasks actually completed today
  const todayScheduledTasks = tasks.filter(t => t.dueDate === today);
  const tasksCompletedToday = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    if (t.completedAt && t.completedAt.startsWith(today)) return true;
    return t.dueDate === today;
  });

  const sessionsToday = sessions.filter(s => s.date && s.date.startsWith(today));
  const winsToday = wins.filter(w => w.date === today);
  const focusToday = focusSessions.filter(f => f.startedAt && f.startedAt.startsWith(today) && f.completed);

  // Total planned actions:
  // If there are scheduled tasks, base it on scheduled tasks.
  // Each learning session or win counts as meaningful completed action.
  const scheduledCount = todayScheduledTasks.length;
  const completedTaskCount = tasksCompletedToday.length;
  const completedSessionCount = sessionsToday.length;
  const completedWinCount = winsToday.length;
  const completedFocusCount = focusToday.length;

  const totalCompletedActions = completedTaskCount + completedSessionCount + completedWinCount + completedFocusCount;

  // If nothing is scheduled and nothing has been done:
  if (scheduledCount === 0 && totalCompletedActions === 0) {
    return {
      value: 0,
      maximum: 0,
      percentage: 0,
      status: 'not_started',
      statusLabel: 'Not Started',
      detailLabel: 'No actions planned or logged yet today',
      hasMeasurableData: false,
      completedActions: 0,
      totalPlanned: 0,
      summary: 'No active priorities scheduled for today.',
    };
  }

  // Denominator: If tasks scheduled, use scheduled count (minimum 3 target items for a balanced day).
  // If no tasks scheduled but user completed actions (e.g. studied a skill or logged a win), benchmark against 3 daily goals.
  const denominator = Math.max(scheduledCount, 3);
  const rawPercentage = Math.round((totalCompletedActions / denominator) * 100);
  const clamped = Math.max(0, Math.min(100, rawPercentage));

  const stateInfo = getProgressState(clamped, true);

  const parts: string[] = [];
  if (completedTaskCount > 0) parts.push(`${completedTaskCount} task${completedTaskCount > 1 ? 's' : ''}`);
  if (completedSessionCount > 0) parts.push(`${completedSessionCount} study session${completedSessionCount > 1 ? 's' : ''}`);
  if (completedWinCount > 0) parts.push(`${completedWinCount} win${completedWinCount > 1 ? 's' : ''}`);

  const summary = parts.length > 0 ? parts.join(', ') + ' logged' : `${completedTaskCount} / ${scheduledCount} tasks`;

  return {
    value: totalCompletedActions,
    maximum: denominator,
    percentage: clamped,
    status: stateInfo.status,
    statusLabel: stateInfo.label,
    detailLabel: summary,
    hasMeasurableData: true,
    completedActions: totalCompletedActions,
    totalPlanned: denominator,
    summary,
  };
}
