import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  ensureDataDir,
  hasAdmin,
  createAdmin,
  verifyAdminLogin,
  createGuestSession,
  getUserFromToken,
  invalidateToken,
  changeAdminPassword,
  updateAdminProfile,
  getWorkspace,
  saveWorkspace,
  restoreAdminWorkspace,
  createEmptyWorkspace,
} from './server/authStorage';
import { createWhatsAppRouter } from './server/whatsapp/routes';

dotenv.config();

// Ensure local data directory is initialized
ensureDataDir();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract Bearer token
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: () => void) {
  const token = extractToken(req);
  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in or continue as Guest.' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const token = extractToken(req);
  const user = getUserFromToken(token);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory cache for recent AI generation to prevent burst duplicate calls from exhausting quota
const promptResponseCache = new Map<string, { timestamp: number; response: any }>();

// Resilient helper to execute content generation with automatic model fallback
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  request: {
    contents: any;
    config?: any;
  }
): Promise<any | null> {
  // Simple cache key derivation
  const cacheKey = typeof request.contents === 'string'
    ? request.contents.slice(0, 300)
    : JSON.stringify(request.contents).slice(0, 300);

  const cached = promptResponseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 25000) {
    return cached.response;
  }

  // Model fallback tier: primary gemini-3.8-flash, high-capacity gemini-3.1-flash-lite, then gemini-flash-latest
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const response = await ai.models.generateContent({
        ...request,
        model,
      });
      if (response && response.text) {
        promptResponseCache.set(cacheKey, { timestamp: Date.now(), response });
        // Cap cache size
        if (promptResponseCache.size > 50) {
          const oldestKey = promptResponseCache.keys().next().value;
          if (oldestKey) promptResponseCache.delete(oldestKey);
        }
        return response;
      }
    } catch {
      // Quietly wait a brief interval on temporary rate limit / demand spike before trying fallback model
      if (i < models.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 350));
      }
    }
  }
  return null;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasAdmin: hasAdmin(),
    timestamp: new Date().toISOString(),
  });
});

// --- AUTHENTICATION & SESSION ENDPOINTS ---

// Check auth status & current session
app.get('/api/auth/status', (req: Request, res: Response) => {
  const token = extractToken(req);
  const user = getUserFromToken(token);
  res.json({
    hasAdmin: hasAdmin(),
    user: user || null,
  });
});

// Initial Admin setup (first run)
app.post('/api/auth/setup', (req: Request, res: Response) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const result = createAdmin(username, password, displayName);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to setup admin.' });
  }
});

// Admin login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const result = verifyAdminLogin(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  res.json(result);
});

// Guest mode session
app.post('/api/auth/guest', (_req: Request, res: Response) => {
  const result = createGuestSession();
  res.json(result);
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = extractToken(req);
  invalidateToken(token);
  res.json({ success: true });
});

// Change Admin Password (protected, Admin only)
app.post('/api/auth/change-password', requireAdmin, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    changeAdminPassword(currentPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password.' });
  }
});

// Update Profile name
app.post('/api/auth/profile', requireAdmin, (req: Request, res: Response) => {
  try {
    const { displayName } = req.body;
    const updated = updateAdminProfile(displayName);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

// --- WORKSPACE STORAGE ENDPOINTS (Completely isolated between Admin and Guest) ---

// Get current user workspace
app.get('/api/workspace', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const token = (req as any).token;
  const data = getWorkspace(user, token);
  res.json({ success: true, data });
});

// Save current user workspace
app.post('/api/workspace', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const token = (req as any).token;
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Data payload is required.' });
  }
  saveWorkspace(user, token, data);
  res.json({ success: true });
});

// Restore Admin workspace from imported backup (Admin only)
app.post('/api/workspace/restore', requireAdmin, (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Valid JSON workspace payload required.' });
    }
    restoreAdminWorkspace(data);
    res.json({ success: true, message: 'Workspace restored successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to restore workspace.' });
  }
});

// Reset workspace to fresh empty state
app.post('/api/workspace/reset', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const token = (req as any).token;
    const fresh = createEmptyWorkspace(user.displayName || 'Personal Workspace');
    saveWorkspace(user, token, fresh);
    res.json({ success: true, data: fresh, message: 'Workspace reset to fresh state.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset workspace.' });
  }
});

// --- WHATSAPP AI AGENT & WEBHOOK INTEGRATION ---
app.use('/api/whatsapp', createWhatsAppRouter(getGeminiClient, getUserFromToken, extractToken));

// 1. AI AGENT CHAT & NATURAL LANGUAGE CONTROL
app.post('/api/ai/agent', async (req: Request, res: Response) => {
  try {
    const { message, context, personality = 'analytical', history = [] } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Intelligent fallback when API key is not configured
      return res.json(generateLocalAgentFallback(message, context));
    }

    const systemPrompt = `You are the central intelligence of LifeOS AI — a Personal AI Operating System for productivity, skill mastery, projects, goals, and daily progress.
You are a proactive, high-signal personal co-pilot, NOT a generic chatbot or school helper.
Current personality setting: ${personality}.
Current time: ${context?.currentTime || new Date().toISOString()}.

User Context:
- Active Skills: ${JSON.stringify(context?.skills?.map((s: any) => ({ name: s.name, mastery: s.currentMastery, state: s.state })) || [])}
- Urgent & In-Progress Tasks: ${JSON.stringify(context?.tasks?.filter((t: any) => t.status !== 'completed').slice(0, 8).map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, project: t.projectId })) || [])}
- Active Projects: ${JSON.stringify(context?.projects?.map((p: any) => ({ name: p.name, progress: p.progress, deadline: p.deadline })) || [])}
- Goals: ${JSON.stringify(context?.goals?.map((g: any) => ({ title: g.title, progress: g.progress })) || [])}
- AI Memory Items: ${JSON.stringify(context?.memory?.filter((m: any) => m.enabled).map((m: any) => `${m.category}: ${m.content}`) || [])}

Rules:
1. Speak with precision, clarity, and constructive momentum. Never use generic empty cheerleading.
2. If the user asks to create a task, reschedule a task, create a skill, recommend what to do now, or what to learn next, execute it in the "actionTaken" JSON field.
3. Keep responses structured with Markdown.

Format your entire response as a valid JSON object matching this schema:
{
  "reply": "your thoughtful, context-aware markdown response",
  "actionTaken": {
    "type": "none" | "create_task" | "update_task" | "create_skill" | "recommend_action" | "review_session" | "rate_learning",
    "details": "short description of action",
    "payload": {}
  },
  "suggestions": ["3 quick follow-up prompt suggestions"]
}`;

    const prompt = `User query: "${message}"\nRecent conversation history:\n${JSON.stringify(history.slice(-4))}`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    if (!response || !response.text) {
      return res.json(generateLocalAgentFallback(req.body.message, req.body.context));
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    return res.json(generateLocalAgentFallback(req.body.message, req.body.context));
  }
});

// 2. SKILL MASTERY ROADMAP GENERATOR
app.post('/api/ai/generate-roadmap', async (req: Request, res: Response) => {
  try {
    const {
      skillName,
      description,
      category = 'Technology',
      subcategory,
      currentLevel = 'beginner',
      whyLearn,
      primaryGoal,
      availableTime,
      learningStyle,
      existingKnowledge,
      linkedProjects = [],
      linkedGoals = [],
      targetMastery = 100,
    } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateLocalSkillRoadmap(skillName, description, currentLevel, category));
    }

    const prompt = `Generate an authoritative, deeply structured, stage-by-stage Skill Mastery Curriculum for: "${skillName}".
Category: ${category} ${subcategory ? `(${subcategory})` : ''}
User Starting Level: ${currentLevel}
Why they want to learn: "${whyLearn || 'Professional competence & execution'}"
Primary Goal: "${primaryGoal || 'Mastery and practical production deployment'}"
Available Time: "${availableTime || '45 minutes daily'}"
Preferred Learning Style: "${learningStyle || 'Hands-on project-first building'}"
Existing Background / Context: "${existingKnowledge || 'None specified'}"
Linked Projects / Goals: ${JSON.stringify({ projects: linkedProjects, goals: linkedGoals })}
Target Mastery: ${targetMastery}%.

CURRICULUM MANDATES:
1. NOT a textbook index or shallow trivia list. Must be an actionable, prerequisite-driven mastery curriculum.
2. Structure into 5 sequential progression stages:
   - Stage 1: FOUNDATIONS (Syntax, mental models, environment, fundamental primitives)
   - Stage 2: CORE MECHANICS (Execution patterns, standard idioms, state, composition)
   - Stage 3: INTERMEDIATE & TOOLING (Architecture, testing, asynchronous IO, modular design)
   - Stage 4: ADVANCED SYSTEMS (Edge cases, performance profiling, resilience, deep internals)
   - Stage 5: PRACTICAL APPLICATION & MASTERY (Production synthesis, security, portfolio-grade system)
3. For each stage/domain:
   - Provide 2-3 concrete topics.
   - For each topic provide:
     - name: crisp, professional topic name
     - description: deep explanation of core concepts and principles
     - importance: "essential" | "high" | "supporting"
     - difficulty: "foundational" | "intermediate" | "advanced"
     - prerequisites: list of prerequisite topic names that must be grasped first
     - state: "available" for the very first foundational topic; "locked" or "available" for subsequent based on prerequisites
     - subtopics: 3-4 specific implementation aspects or concepts
     - practicePrompt: a hands-on, tangible coding or building exercise to write
     - applicationPrompt: how to apply this topic to real production projects
4. MASTERY PROJECTS: Include exactly 3 progressive, real-world portfolio projects that prove mastery:
   - Project 1: Foundational Utility / CLI / Core script
   - Project 2: Interactive Service / Integration / Modular system
   - Project 3: Full-Scale Production Application
5. Provide a personalized "rationale" explaining why this curriculum matches their starting level and goals.
6. Provide a "recommendedFirstAction" specifying the immediate 20-30 minute action to take right now.`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            domains: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  stage: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        importance: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                        state: { type: Type.STRING },
                        subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        practicePrompt: { type: Type.STRING },
                        applicationPrompt: { type: Type.STRING },
                      },
                      required: ['name', 'description', 'importance', 'difficulty', 'prerequisites', 'subtopics', 'practicePrompt'],
                    },
                  },
                },
                required: ['name', 'description', 'stage', 'topics'],
              },
            },
            masteryProjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN },
                },
                required: ['title', 'description', 'difficulty', 'completed'],
              },
            },
            rationale: { type: Type.STRING },
            recommendedFirstAction: { type: Type.STRING },
          },
          required: ['domains', 'masteryProjects', 'rationale', 'recommendedFirstAction'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json(generateLocalSkillRoadmap(req.body.skillName, req.body.description, req.body.currentLevel, req.body.category));
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json(generateLocalSkillRoadmap(req.body.skillName, req.body.description, req.body.currentLevel, req.body.category));
  }
});

// 2b. WHAT SHOULD I LEARN NEXT (FOR A SPECIFIC SKILL)
app.post('/api/ai/skill-next-action', async (req: Request, res: Response) => {
  try {
    const { skill, availableMinutes = 45, projects = [], goals = [] } = req.body;
    const ai = getGeminiClient();

    const fallback = generateLocalSkillNextAction(skill, availableMinutes);

    if (!ai) {
      return res.json(fallback);
    }

    const prompt = `Analyze this specific skill and recommend the SINGLE best next learning action:
Skill: "${skill.name}" (Mastery: ${skill.currentMastery}%, Level: ${skill.currentLevel || 'Learner'})
Domains: ${JSON.stringify(skill.domains)}
Total practice minutes: ${skill.totalPracticeMinutes || 0}
Last practiced: ${skill.lastPracticedAt || 'Never'}
Weak areas / Mistakes: ${JSON.stringify(skill.weakAreas || [])}
Available time right now: ${availableMinutes} minutes
Projects Context: ${JSON.stringify(projects.slice(0, 3).map((p: any) => ({ name: p.name, tech: p.technologies })))}

Requirements:
1. Identify the highest leverage topic to tackle next respecting prerequisites.
2. If the user hasn't practiced in over 3 days, flag a stagnation reactivation step.
3. If they have weak areas or low retention checks, suggest targeted revision.
4. Give:
   - topicName
   - domainName
   - why (clear strategic reasoning connecting to prerequisites or projects)
   - estimatedMinutes (<= ${availableMinutes})
   - actionType: "learn" | "practice" | "review" | "build_project"
   - challengePrompt (concrete exercise or code prompt to build)
   - alternatives (1-2 lower cognitive load or alternative options)`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicName: { type: Type.STRING },
            domainName: { type: Type.STRING },
            why: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            actionType: { type: Type.STRING },
            challengePrompt: { type: Type.STRING },
            stagnationNote: { type: Type.STRING },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  minutes: { type: Type.INTEGER },
                },
                required: ['title', 'description', 'minutes'],
              },
            },
          },
          required: ['topicName', 'domainName', 'why', 'estimatedMinutes', 'actionType', 'challengePrompt'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json(fallback);
    }

    return res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    return res.json(generateLocalSkillNextAction(req.body.skill, req.body.availableMinutes || 45));
  }
});

// 2c. ADAPT ROADMAP
app.post('/api/ai/adapt-roadmap', async (req: Request, res: Response) => {
  try {
    const { skill, instruction = 'Optimize for practical projects and focus on weak areas' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({ success: true, adaptedDomains: skill.domains, message: 'Roadmap aligned with current progress.' });
    }

    const prompt = `Adapt the roadmap for skill "${skill.name}" based on this user instruction: "${instruction}".
Current Domains: ${JSON.stringify(skill.domains)}
Mastery: ${skill.currentMastery}%
Weak Areas: ${JSON.stringify(skill.weakAreas || [])}

Deliver an updated array of domains and topics with adjusted difficulties, practice prompts, or newly inserted bridge topics where needed.`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adaptedDomains: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  stage: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        importance: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                        state: { type: Type.STRING },
                        subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        practicePrompt: { type: Type.STRING },
                      },
                      required: ['name', 'description', 'importance', 'difficulty', 'subtopics', 'practicePrompt'],
                    },
                  },
                },
                required: ['name', 'description', 'topics'],
              },
            },
            explanation: { type: Type.STRING },
          },
          required: ['adaptedDomains', 'explanation'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json({ success: true, adaptedDomains: skill.domains, explanation: 'Current roadmap is well structured.' });
    }

    return res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    return res.json({ success: true, adaptedDomains: req.body.skill?.domains || [], explanation: 'Kept current structure.' });
  }
});

// 3. DAILY LEARNING REVIEW & RATING ENGINE
app.post('/api/ai/review-session', async (req: Request, res: Response) => {
  try {
    const { skillName, topicNames, timeSpentMinutes, notes, userReflections, practiceCompleted, questions, confidence, previousRatings } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateLocalSessionReview(req.body));
    }

    const prompt = `Perform an objective, professional Daily Learning Review and Multi-Dimensional Rating for a skill session in: "${skillName}".
Topics Covered: ${JSON.stringify(topicNames)}
Time Spent: ${timeSpentMinutes} minutes
User Notes: "${notes}"
User Reflection: "${userReflections}"
What User Actually Built/Practiced: "${practiceCompleted}"
Questions / Uncertainties: "${questions}"
User Self-Reported Confidence (1-5): ${confidence}
Recent rating history context: ${JSON.stringify(previousRatings || [])}

EVALUATION CRITERIA:
1. Distinguish carefully between: "exposed to" -> "understood" -> "practiced" -> "applied" -> "mastered". Do not blindly assume mastery just because notes exist.
2. Score each dimension on a 1.0 - 10.0 scale with a rigorous, honest, and constructive comment:
   - understanding: conceptual grasp
   - depth: did it go beyond surface-level syntax?
   - practice: hands-on coding or building
   - application: connected to real project or tangible scenario
   - consistency: steady cadence of learning
   - retention: evidence of recalling previous concepts
3. Overall score should be a balanced weighted composite (e.g. 8.4).
4. Provide actionable constructive feedback:
   - whatWentWell (2-3 items)
   - whatNeedsImprovement (1-2 items)
   - whatToRevisit (1-2 items)
   - recommendedNextTopic (concrete topic name)
   - recommendedPractice (concrete building prompt)`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stageIdentified: { type: Type.STRING },
            topicsCoveredSummary: { type: Type.STRING },
            depthAnalysis: { type: Type.STRING },
            practicalApplicationAnalysis: { type: Type.STRING },
            whatWentWell: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatNeedsImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatToRevisit: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedNextTopic: { type: Type.STRING },
            recommendedPractice: { type: Type.STRING },
            rating: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER },
                dimensions: {
                  type: Type.OBJECT,
                  properties: {
                    understanding: {
                      type: Type.OBJECT,
                      properties: { score: { type: Type.NUMBER }, comment: { type: Type.STRING } },
                      required: ['score', 'comment'],
                    },
                    depth: {
                      type: Type.OBJECT,
                      properties: { score: { type: Type.NUMBER }, comment: { type: Type.STRING } },
                      required: ['score', 'comment'],
                    },
                    practice: {
                      type: Type.OBJECT,
                      properties: { score: { type: Type.NUMBER }, comment: { type: Type.STRING } },
                      required: ['score', 'comment'],
                    },
                    application: {
                      type: Type.OBJECT,
                      properties: { score: { type: Type.NUMBER }, comment: { type: Type.STRING } },
                      required: ['score', 'comment'],
                    },
                    consistency: {
                      type: Type.OBJECT,
                      properties: { score: { type: Type.NUMBER }, comment: { type: Type.STRING } },
                      required: ['score', 'comment'],
                    },
                    retention: {
                      type: Type.OBJECT,
                      properties: { score: { type: Type.NUMBER }, comment: { type: Type.STRING } },
                      required: ['score', 'comment'],
                    },
                  },
                  required: ['understanding', 'depth', 'practice', 'application', 'consistency', 'retention'],
                },
              },
              required: ['overallScore', 'dimensions'],
            },
          },
          required: [
            'stageIdentified',
            'topicsCoveredSummary',
            'depthAnalysis',
            'practicalApplicationAnalysis',
            'whatWentWell',
            'whatNeedsImprovement',
            'whatToRevisit',
            'recommendedNextTopic',
            'recommendedPractice',
            'rating',
          ],
        },
      },
    });

    if (!response || !response.text) {
      return res.json(generateLocalSessionReview(req.body));
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json(generateLocalSessionReview(req.body));
  }
});

// 4. KNOWLEDGE CHECK GENERATOR
app.post('/api/ai/knowledge-check', async (req: Request, res: Response) => {
  try {
    const { skillName, topicName } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateLocalKnowledgeCheck(skillName, topicName));
    }

    const prompt = `Create a lightweight, practical 3-question knowledge check for the topic: "${topicName}" within skill: "${skillName}".
DO NOT make this an academic trivia test. Focus on practical scenarios, edge cases, and real engineering trade-offs.
Each question must have 4 clear choices, with exactly one correct answer and an explanatory breakdown.`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json(generateLocalKnowledgeCheck(req.body.skillName, req.body.topicName));
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json(generateLocalKnowledgeCheck(req.body.skillName, req.body.topicName));
  }
});

// 5. WHAT SHOULD I DO NOW?
app.post('/api/ai/what-to-do-now', async (req: Request, res: Response) => {
  try {
    const { tasks, projects, skills, goals, availableMinutes = 45, currentTime } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateLocalWhatToDoNow(tasks, availableMinutes));
    }

    const prompt = `You are LifeOS AI. Analyze the user's workload and recommend the SINGLE most high-leverage action right now.
Available Time: ${availableMinutes} minutes
Current Time: ${currentTime || new Date().toLocaleTimeString()}
Tasks: ${JSON.stringify(tasks.filter((t: any) => t.status !== 'completed').slice(0, 10))}
Projects: ${JSON.stringify(projects.map((p: any) => ({ name: p.name, progress: p.progress, deadline: p.deadline })))}
Goals: ${JSON.stringify(goals.map((g: any) => ({ title: g.title, progress: g.progress })))}
Skills: ${JSON.stringify(skills.map((s: any) => ({ name: s.name, mastery: s.currentMastery })))}

Deliver:
1. The exact recommended task or focus item.
2. Estimated duration in minutes (<= availableTime).
3. Clear strategic reasoning ("Why this right now").
4. First 3 concrete micro-steps to gain immediate momentum.
5. An alternative recommendation if they prefer lower cognitive load.`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            taskId: { type: Type.STRING },
            durationMinutes: { type: Type.INTEGER },
            why: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternativeTitle: { type: Type.STRING },
            alternativeWhy: { type: Type.STRING },
          },
          required: ['title', 'durationMinutes', 'why', 'steps'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json(generateLocalWhatToDoNow(req.body.tasks, req.body.availableMinutes));
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json(generateLocalWhatToDoNow(req.body.tasks, req.body.availableMinutes));
  }
});

// 6. WHAT SHOULD I LEARN NEXT?
app.post('/api/ai/what-to-learn-next', async (req: Request, res: Response) => {
  try {
    const { skills, projects } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateLocalWhatToLearnNext(skills));
    }

    const prompt = `Analyze current skill mastery and recommend the SINGLE best next topic to study or practice:
Skills: ${JSON.stringify(skills.map((s: any) => ({
      name: s.name,
      mastery: s.currentMastery,
      domains: s.domains.map((d: any) => ({
        name: d.name,
        topics: d.topics.map((t: any) => ({ name: t.name, state: t.state, mastery: t.mastery })),
      })),
    })))}
Active Projects: ${JSON.stringify(projects.map((p: any) => ({ name: p.name, technologies: p.technologies })))}

Deliver:
- skillId
- skillName
- topicName
- why: strategic reasoning linking to projects or prerequisites
- estimatedMinutes: estimated study/practice time
- practicalExercise: an immediate mini-challenge to solidify the concept`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillName: { type: Type.STRING },
            topicName: { type: Type.STRING },
            why: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            practicalExercise: { type: Type.STRING },
          },
          required: ['skillName', 'topicName', 'why', 'estimatedMinutes', 'practicalExercise'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json(generateLocalWhatToLearnNext(req.body.skills));
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json(generateLocalWhatToLearnNext(req.body.skills));
  }
});

// 7. AI TASK BREAKDOWN
app.post('/api/ai/task-breakdown', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        subtasks: [
          'Define technical specification and boundary constraints',
          'Set up baseline scaffolding and interface types',
          'Implement core functional logic and error handling',
          'Verify edge cases and run integration tests',
          'Document usage instructions and clean up code',
        ],
      });
    }

    const prompt = `Break down this task into 4 to 6 concise, actionable subtasks:
Task: "${title}"
Details: "${description || ''}"
Avoid generating overly fluffy checklists. Focus on high-signal engineering/execution milestones.`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['subtasks'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json({
        subtasks: [
          'Analyze requirements and edge cases',
          'Scaffold core data structures and types',
          'Implement primary execution flow',
          'Add error boundaries and unit tests',
          'Deploy and verify in live environment',
        ],
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json({
      subtasks: [
        'Analyze requirements and edge cases',
        'Scaffold core data structures and types',
        'Implement primary execution flow',
        'Add error boundaries and unit tests',
        'Deploy and verify in live environment',
      ],
    });
  }
});

// 8. WEEKLY AI REVIEW
app.post('/api/ai/weekly-review', async (req: Request, res: Response) => {
  try {
    const { tasks = [], skills = [], projects = [], sessions = [] } = req.body;
    const ai = getGeminiClient();

    const completedTasksCount = tasks.filter((t: any) => t.status === 'completed').length;
    const pendingTasksCount = tasks.filter((t: any) => t.status !== 'completed').length;

    if (!ai) {
      return res.json({
        summary: tasks.length > 0 || skills.length > 0 || projects.length > 0
          ? `Current progress: ${completedTasksCount} tasks completed, ${pendingTasksCount} tasks pending across ${skills.length} active skills.`
          : 'Your workspace is clear. Establish your key goals, projects, and skills to track weekly momentum.',
        whatWentWell: completedTasksCount > 0
          ? [`Completed ${completedTasksCount} tasks successfully.`, 'Maintained system organization.']
          : ['Initialized clean personal operating system.', 'Ready to capture goals and milestones.'],
        whatNeedsAttention: pendingTasksCount > 0
          ? [`${pendingTasksCount} pending items remaining in queue.`]
          : ['No pending bottlenecks identified.'],
        recommendedPriorities: skills.length > 0
          ? [`Continue progression on ${skills[0].name}.`, 'Plan upcoming focus sprints.']
          : ['Add your primary focus projects and active skills.', 'Establish daily focus targets.'],
      });
    }

    const prompt = `Synthesize a comprehensive Weekly Review for LifeOS AI:
Completed Tasks: ${completedTasksCount}
Pending Tasks: ${pendingTasksCount}
Skills Active: ${skills.map((s: any) => `${s.name} (${s.currentMastery || 0}%)`).join(', ') || 'None'}
Recent Learning Sessions: ${sessions?.length || 0}
Projects: ${projects.map((p: any) => `${p.name} (${p.progress || 0}%)`).join(', ') || 'None'}

Provide:
1. Executive summary of weekly momentum.
2. What went well (2-3 bullet points).
3. What needs attention / weak areas (1-3 bullet points).
4. Recommended strategic priorities for next week (2-3 bullet points).`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            whatWentWell: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatNeedsAttention: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedPriorities: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'whatWentWell', 'whatNeedsAttention', 'recommendedPriorities'],
        },
      },
    });

    if (!response || !response.text) {
      return res.json({
        summary: 'Consistent progress tracked across active milestones.',
        whatWentWell: ['Maintained daily workspace updates and deliberate focus.'],
        whatNeedsAttention: ['Ensure deep-work blocks are scheduled without interruption.'],
        recommendedPriorities: ['Address top-priority project tasks and skill milestones.'],
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return res.json({
      summary: 'Consistent progress tracked across active milestones.',
      whatWentWell: ['Maintained daily workspace updates and deliberate focus.'],
      whatNeedsAttention: ['Ensure deep-work blocks are scheduled without interruption.'],
      recommendedPriorities: ['Address top-priority project tasks and skill milestones.'],
    });
  }
});

// --- HELPER FALLBACK GENERATORS (for offline or when key is not provided) ---

function generateLocalAgentFallback(message: string, context: any) {
  const lower = (message || '').toLowerCase();
  const tasks = context?.tasks || [];
  const skills = context?.skills || [];
  const projects = context?.projects || [];

  if (lower.includes('what should i do') || lower.includes('what to do')) {
    const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');
    const urgentTask = pendingTasks.find((t: any) => t.priority === 'urgent') || pendingTasks.find((t: any) => t.priority === 'high') || pendingTasks[0];
    return {
      reply: urgentTask
        ? `### Recommended Action\nFocus on **${urgentTask.title}**.\n\n* **Estimated Time:** ${urgentTask.estimatedDuration || 30} minutes\n* **Priority:** ${urgentTask.priority}\n\nWould you like to launch Momentum Mode for this task?`
        : 'Your task queue is clear! Take a moment to capture what matters most today, add a new project, or define a skill roadmap.',
      actionTaken: urgentTask ? { type: 'recommend_action', details: `Selected priority task: ${urgentTask.title}` } : { type: 'none', details: 'Task queue clear' },
      suggestions: urgentTask ? ['Start Momentum Mode', 'Break down this task', 'What should I learn next?'] : ['Add a new task', 'Add a skill roadmap', 'Review projects'],
    };
  }

  if (lower.includes('learn next') || lower.includes('what to learn')) {
    const activeSkill = skills.find((s: any) => (s.currentMastery || 0) < 100) || skills[0];
    if (activeSkill) {
      return {
        reply: `### Next Learning Priority\nFor **${activeSkill.name}** (current mastery: ${activeSkill.currentMastery || 0}%):\n\n* Dedicate a 25-35 minute focused session to practical exercises.\n* Document key insights and code snippets in the knowledge base.`,
        actionTaken: { type: 'recommend_action', details: `Analyzed skill: ${activeSkill.name}` },
        suggestions: ['Log a learning session', 'Run a knowledge check', 'Show skill roadmap'],
      };
    }
    return {
      reply: `### Skill Learning\nYou have no active skill roadmaps yet.\n\nAdd a skill in the Skills & Roadmaps view and LifeOS AI will generate an end-to-end curriculum with domains, topics, and practice prompts.`,
      suggestions: ['Add a new skill', 'What should I work on now?', 'View dashboard'],
    };
  }

  if (lower.includes('behind') || lower.includes('missed') || lower.includes('overdue')) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter((t: any) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr);
    return {
      reply: overdue.length > 0
        ? `### System Status Check\nYou have **${overdue.length} overdue tasks**:\n${overdue.slice(0, 5).map((t: any) => `* **${t.title}** (due ${t.dueDate})`).join('\n')}\n\nYou can use Smart Reschedule to rebalance your calendar.`
        : '### System Status Check\nAll tasks with due dates are currently on track!',
      suggestions: ['What should I do now?', 'Smart reschedule tasks', 'View tasks engine'],
    };
  }

  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t: any) => t.status !== 'completed').length;

  return {
    reply: `I have analyzed your workspace context:\n* **Tasks:** ${completedCount} completed, ${pendingCount} pending\n* **Skills Tracked:** ${skills.length}\n* **Active Projects:** ${projects.length}\n\nHow can I help steer your focus right now?`,
    suggestions: [
      'What should I work on now?',
      'What should I learn next?',
      'Review my today tasks',
    ],
  };
}

function generateLocalSkillRoadmap(skillName: string, description?: string, currentLevel = 'beginner', category = 'Technology') {
  return {
    domains: [
      {
        name: 'Stage 1: FOUNDATIONS & MENTAL MODELS',
        stage: 'foundations',
        description: `Core primitives, environment setup, and fundamental concepts of ${skillName}.`,
        topics: [
          {
            name: `${skillName} Core Primitives & Syntax`,
            description: `Fundamental syntax, execution runtime, and mental model of ${skillName}.`,
            importance: 'essential',
            difficulty: 'foundational',
            prerequisites: [],
            state: 'available',
            subtopics: ['Key vocabulary and abstractions', 'Standard runtime and environment setup', 'First end-to-end hello world workflow'],
            practicePrompt: `Build a minimalist standalone script/prototype verifying your environment and demonstrating fundamental syntax of ${skillName}.`,
            applicationPrompt: `Establish standard project templates and tooling boilerplate for ${skillName}.`,
          },
          {
            name: 'Data Structures & Control Flow',
            description: 'How data flows, memory is organized, and logic branches.',
            importance: 'essential',
            difficulty: 'foundational',
            prerequisites: [`${skillName} Core Primitives & Syntax`],
            state: 'locked',
            subtopics: ['Primitive vs composite types', 'Branching and iterative execution loops', 'State mutability vs immutability'],
            practicePrompt: 'Implement a structured data model with validation guards and error handling.',
            applicationPrompt: 'Build input parsing and validation logic for realistic payloads.',
          },
        ],
      },
      {
        name: 'Stage 2: CORE MECHANICS & PATTERNS',
        stage: 'core',
        description: 'Idiomatic patterns, composition, and standard library execution.',
        topics: [
          {
            name: 'Asynchronous Operations & IO',
            description: 'Non-blocking execution, event loops, and asynchronous pipelines.',
            importance: 'essential',
            difficulty: 'intermediate',
            prerequisites: ['Data Structures & Control Flow'],
            state: 'locked',
            subtopics: ['Async/await and promises', 'Event loops and task scheduling', 'Cancellation and timeout policies'],
            practicePrompt: 'Create a concurrent task runner with rate-limiting and retry logic.',
            applicationPrompt: 'Fetch remote APIs safely with exponential backoff and error logging.',
          },
          {
            name: 'Modular Architecture & Clean Contracts',
            description: 'Decoupling responsibilities, dependency management, and design patterns.',
            importance: 'high',
            difficulty: 'intermediate',
            prerequisites: [`${skillName} Core Primitives & Syntax`],
            state: 'locked',
            subtopics: ['Interface contracts and types', 'Dependency injection patterns', 'Module isolation'],
            practicePrompt: 'Build a modular plugin system that dynamically registers extensions.',
            applicationPrompt: 'Architect clean service boundaries in production codebases.',
          },
        ],
      },
      {
        name: 'Stage 3: INTERMEDIATE & TOOLING',
        stage: 'intermediate',
        description: 'Testing suites, static analysis, state stores, and tooling ecosystems.',
        topics: [
          {
            name: 'Automated Testing & Edge Case Verification',
            description: 'Unit testing, integration harnesses, and property-based validation.',
            importance: 'essential',
            difficulty: 'intermediate',
            prerequisites: ['Modular Architecture & Clean Contracts'],
            state: 'locked',
            subtopics: ['Test runners and assertions', 'Mocking IO and side effects', 'Regression safety'],
            practicePrompt: 'Write a comprehensive test suite testing edge cases and boundary failures.',
            applicationPrompt: 'Integrate pre-commit hooks and automated CI verification.',
          },
          {
            name: 'State Management & Concurrency Controls',
            description: 'Preventing race conditions, deadlocks, and stale state.',
            importance: 'high',
            difficulty: 'intermediate',
            prerequisites: ['Asynchronous Operations & IO'],
            state: 'locked',
            subtopics: ['Atomic operations', 'Optimistic locking and synchronization', 'Pub/sub event streams'],
            practicePrompt: 'Build an in-memory transactional cache with eviction policies.',
            applicationPrompt: 'Manage complex multi-entity state transitions cleanly.',
          },
        ],
      },
      {
        name: 'Stage 4: ADVANCED SYSTEMS & PERFORMANCE',
        stage: 'advanced',
        description: 'Scalability, latency profiling, error recovery, and low-level internals.',
        topics: [
          {
            name: 'Resilience & Fault Tolerance',
            description: 'Circuit breakers, jitter backoff, dead letter queues, and graceful degradation.',
            importance: 'essential',
            difficulty: 'advanced',
            prerequisites: ['State Management & Concurrency Controls'],
            state: 'locked',
            subtopics: ['Circuit breaker patterns', 'Graceful shutdown handling', 'Telemetry and health checks'],
            practicePrompt: 'Simulate chaotic network drops and verify zero data corruption or unhandled crashes.',
            applicationPrompt: 'Build bulletproof production services that withstand downstream outages.',
          },
          {
            name: 'Benchmarking & Profiling Internals',
            description: 'Eliminating memory leaks, CPU bottlenecks, and latency spikes.',
            importance: 'supporting',
            difficulty: 'advanced',
            prerequisites: ['Automated Testing & Edge Case Verification'],
            state: 'locked',
            subtopics: ['Flamegraph profiling', 'Memory allocation minimization', 'Latency percentiles (p95/p99)'],
            practicePrompt: 'Profile and optimize an intensive algorithm to achieve a 30%+ speedup.',
            applicationPrompt: 'Tune critical server paths to reduce compute costs and response lag.',
          },
        ],
      },
      {
        name: 'Stage 5: PRACTICAL APPLICATION & MASTERY',
        stage: 'mastery',
        description: 'End-to-end production systems, real-world portfolio artifacts, and deployment.',
        topics: [
          {
            name: 'End-to-End Production Synthesis',
            description: `Synthesizing all ${skillName} domains into an autonomous production tool.`,
            importance: 'essential',
            difficulty: 'advanced',
            prerequisites: ['Resilience & Fault Tolerance', 'Benchmarking & Profiling Internals'],
            state: 'locked',
            subtopics: ['Continuous deployment pipelines', 'Distributed logging and tracing', 'Production security audits'],
            practicePrompt: `Build and deploy a complete production-grade tool using ${skillName} with real telemetry.`,
            applicationPrompt: 'Ship a portfolio-grade public project or production feature.',
          },
        ],
      },
    ],
    masteryProjects: [
      {
        title: `${skillName} CLI Utility & Automator`,
        description: `A lightweight, focused command-line utility demonstrating core syntax, data structures, and error handling in ${skillName}.`,
        difficulty: 'foundational',
        completed: false,
      },
      {
        title: `Interactive ${skillName} Service Engine`,
        description: `A resilient, asynchronous service featuring clean modular boundaries, structured logging, and thorough automated tests.`,
        difficulty: 'intermediate',
        completed: false,
      },
      {
        title: `Full-Scale Production ${skillName} Platform`,
        description: `An end-to-end production architecture with observability, fault tolerance, benchmarking, and real-world deployment.`,
        difficulty: 'advanced',
        completed: false,
      },
    ],
    rationale: `Curriculum calibrated for ${currentLevel} in ${category}. Progression starts with foundational primitives and builds steadily to real production architecture.`,
    recommendedFirstAction: `Spend 25 minutes reviewing ${skillName} Core Primitives and complete the environment verification challenge.`,
  };
}

function generateLocalSkillNextAction(skill: any, availableMinutes: number) {
  const allTopics = (skill?.domains || []).flatMap((d: any) =>
    (d.topics || []).map((t: any) => ({ ...t, domainName: d.name }))
  );
  const uncompleted = allTopics.filter((t: any) => t.state !== 'completed' && t.state !== 'mastered');
  const target = uncompleted.find((t: any) => t.state === 'available' || t.state === 'learning' || t.state === 'practicing') || uncompleted[0] || allTopics[0];

  const daysSincePractice = skill?.lastPracticedAt
    ? Math.round((Date.now() - new Date(skill.lastPracticedAt).getTime()) / (1000 * 3600 * 24))
    : 99;

  return {
    topicName: target ? target.name : `${skill?.name || 'Skill'} Foundations`,
    domainName: target ? target.domainName : 'Foundations',
    why: target?.prerequisites?.length > 0
      ? `This builds directly on your foundational knowledge and unlocks the next stage of ${skill?.name}.`
      : `High-leverage focus area to build tangible momentum in ${skill?.name}.`,
    estimatedMinutes: Math.min(availableMinutes, 35),
    actionType: target?.state === 'practicing' ? 'practice' : 'learn',
    challengePrompt: target?.practicePrompt || `Build a 20-minute hands-on prototype exploring ${target?.name || 'core concepts'}.`,
    stagnationNote: daysSincePractice >= 3
      ? `You haven't practiced ${skill?.name} in ${daysSincePractice} days. A short 20-minute session will refresh retention.`
      : undefined,
    alternatives: [
      {
        title: 'Quick Knowledge Check',
        description: 'Verify your conceptual retention with a 3-question challenge.',
        minutes: 10,
      },
      {
        title: 'Hands-on Coding Practice',
        description: 'Write a self-contained exercise without looking at documentation.',
        minutes: 25,
      },
    ],
  };
}

function generateLocalSessionReview(body: any) {
  const time = body.timeSpentMinutes || 30;
  const confidence = body.confidence || 4;
  const score = Math.min(9.5, Math.max(6.5, 7.0 + (confidence * 0.4) + (time >= 40 ? 0.6 : 0.2)));

  return {
    stageIdentified: 'practiced',
    topicsCoveredSummary: `Session covering: ${body.topicNames?.join(', ') || 'Skill fundamentals'}.`,
    depthAnalysis: 'Good exploration of practical mechanics. Focused on hands-on code and concrete problem solving.',
    practicalApplicationAnalysis: body.practiceCompleted ? `Built: "${body.practiceCompleted}"` : 'Explored conceptual architecture.',
    whatWentWell: [
      'Dedicated uninterrupted time to deliberate practice.',
      'Documented specific reflections rather than just passive reading.',
      'Identified immediate next questions to research.',
    ],
    whatNeedsImprovement: [
      'Consider testing edge cases and malformed inputs to push system boundaries.',
    ],
    whatToRevisit: [
      'Revisit schema typing patterns in tomorrow\'s warm-up session.',
    ],
    recommendedNextTopic: 'Practical Systems & Error Reflection',
    recommendedPractice: 'Build a small self-contained test suite validating edge cases.',
    rating: {
      overallScore: Number(score.toFixed(1)),
      dimensions: {
        understanding: { score: Number(Math.min(10, score + 0.3).toFixed(1)), comment: 'Clear mental model demonstrated in notes.' },
        depth: { score: Number(score.toFixed(1)), comment: 'Went beyond surface-level syntax.' },
        practice: { score: Number(Math.min(10, score + 0.2).toFixed(1)), comment: 'Produced tangible code artifact.' },
        application: { score: Number((score - 0.2).toFixed(1)), comment: 'Can be tied more deeply to production project.' },
        consistency: { score: 8.5, comment: 'Strong regular learning cadence.' },
        retention: { score: 8.0, comment: 'Successfully incorporated prior concepts.' },
      },
    },
  };
}

function generateLocalKnowledgeCheck(skillName: string, topicName: string) {
  return {
    questions: [
      {
        question: `When designing a production architecture for ${topicName || skillName}, what is the primary benefit of strict schema validation?`,
        options: [
          'It completely eliminates the need for unit testing.',
          'It prevents malformed payloads from causing unpredictable runtime crashes.',
          'It guarantees zero memory allocation.',
          'It automatically writes documentation.',
        ],
        correctIndex: 1,
        explanation: 'Strict schemas enforce compile-time and runtime contracts, preventing malformed inputs from breaking downstream execution.',
      },
      {
        question: 'Which strategy best ensures resilience against transient external failures?',
        options: [
          'Immediate panic and crash on first error.',
          'Ignoring error codes and returning empty responses.',
          'Exponential backoff with jitter and circuit breaker protection.',
          'Infinite synchronous retry loops.',
        ],
        correctIndex: 2,
        explanation: 'Exponential backoff with jitter prevents thundering herd problems, while circuit breakers protect downstream resources.',
      },
      {
        question: 'What distinguishes true mastery from superficial conceptual knowledge?',
        options: [
          'Memorizing all syntax and keywords.',
          'Passing a multiple choice quiz.',
          'The ability to independently diagnose edge cases, debug complex errors, and build working systems.',
          'Completing a tutorial without modifications.',
        ],
        correctIndex: 2,
        explanation: 'Mastery requires independent problem solving and synthesis in real projects, not merely repeating tutorial steps.',
      },
    ],
  };
}

function generateLocalWhatToDoNow(tasks: any[], availableMinutes: number) {
  const pending = tasks?.filter((t: any) => t.status !== 'completed') || [];
  if (pending.length === 0) {
    return {
      title: 'Define your first priority task or explore a new skill roadmap',
      taskId: '',
      durationMinutes: 15,
      why: 'Your task queue is clear. Capture your highest-leverage task or start a new skill roadmap to direct your momentum.',
      steps: [
        'Click "+ Add" to create a high-leverage task or project',
        'Or create a skill roadmap to begin deliberate practice',
      ],
      alternativeTitle: 'Capture spontaneous ideas or notes',
      alternativeWhy: 'Use the Idea Vault to record thoughts without committing to a full task.',
    };
  }

  const topTask = pending.find((t: any) => t.priority === 'urgent') || pending.find((t: any) => t.priority === 'high') || pending[0];
  return {
    title: topTask.title,
    taskId: topTask.id,
    durationMinutes: Math.min(availableMinutes, topTask.estimatedDuration || 35),
    why: topTask.priority === 'urgent'
      ? 'This task is marked urgent and offers the highest immediate leverage on your momentum.'
      : 'Addressing this task maintains steady progress toward your active milestones.',
    steps: [
      'Review requirements and define the single next tangible action',
      'Execute uninterrupted in a focused work block',
      'Mark complete and log reflections or follow-up steps',
    ],
    alternativeTitle: 'Review upcoming project milestones',
    alternativeWhy: 'Step back and verify schedule alignment before diving deep.',
  };
}

function generateLocalWhatToLearnNext(skills: any[]) {
  if (!skills || skills.length === 0) {
    return {
      skillName: 'General Learning',
      topicName: 'Explore and Add Your First Skill',
      why: 'No active skill roadmaps exist yet. Adding a skill allows LifeOS AI to generate a deliberate mastery progression.',
      estimatedMinutes: 20,
      practicalExercise: 'Navigate to Skills & Roadmaps, click "Add Skill", and define a domain to master.',
    };
  }

  const activeSkill = skills.find((s: any) => (s.currentMastery || 0) < 100) || skills[0];
  const domain = activeSkill.domains?.[0];
  const topic = domain?.topics?.find((t: any) => t.state !== 'completed') || domain?.topics?.[0];

  return {
    skillName: activeSkill.name,
    topicName: topic?.name || `${activeSkill.name} Core Foundations`,
    why: `Continuing deliberate practice in ${activeSkill.name} will build systematic mastery.`,
    estimatedMinutes: 30,
    practicalExercise: topic?.practicePrompt || `Complete 30 minutes of hands-on deliberate practice on ${topic?.name || activeSkill.name}.`,
  };
}

// 9. START SERVER & VITE INTEGRATION
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeOS AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
