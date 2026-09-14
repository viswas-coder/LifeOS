import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const ADMIN_WORKSPACE_FILE = path.join(DATA_DIR, 'admin_workspace.json');

export interface SessionUser {
  role: 'admin' | 'guest';
  username: string;
  displayName: string;
}

interface StoredSession {
  role: 'admin' | 'guest';
  username: string;
  displayName: string;
  createdAt: string;
  expiresAt: string;
}

interface AuthData {
  admin: {
    username: string;
    passwordHash: string;
    salt: string;
    displayName: string;
    createdAt: string;
  } | null;
  sessions: Record<string, StoredSession>;
}

// In-memory isolated storage for guest sessions
const guestWorkspaces = new Map<string, any>();

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(AUTH_FILE)) {
    const initialAuth: AuthData = {
      admin: null,
      sessions: {},
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(initialAuth, null, 2), 'utf8');
  }
}

function readAuthData(): AuthData {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read auth data, reinitializing:', err);
    const initialAuth: AuthData = { admin: null, sessions: {} };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(initialAuth, null, 2), 'utf8');
    return initialAuth;
  }
}

function writeAuthData(data: AuthData) {
  ensureDataDir();
  const tempFile = `${AUTH_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, AUTH_FILE);
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (hash.length !== expected.length) return false;
    return crypto.timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export function createEmptyWorkspace(displayName = 'Personal Workspace') {
  return {
    profile: {
      name: displayName,
      avatar: '',
      role: 'LifeOS Operator',
      targetFocusHoursPerDay: 4,
      workStyle: 'Focused & Deliberate',
      preferredWorkingHours: '9:00 AM - 6:00 PM',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    settings: {
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
    },
    memory: [],
    skills: [],
    projects: [],
    tasks: [],
    goals: [],
    calendar: [],
    stickyNotes: [],
    ideas: [],
    knowledge: [],
    wins: [],
    learningSessions: [],
    chatMessages: [],
  };
}

export function hasAdmin(): boolean {
  const auth = readAuthData();
  return Boolean(auth.admin && auth.admin.username && auth.admin.passwordHash);
}

export function createAdmin(username: string, password: string, displayName?: string): { token: string; user: SessionUser } {
  const auth = readAuthData();
  if (auth.admin) {
    throw new Error('Admin account already exists. Use login instead.');
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const name = displayName?.trim() || cleanUsername;

  auth.admin = {
    username: cleanUsername,
    passwordHash,
    salt,
    displayName: name,
    createdAt: new Date().toISOString(),
  };

  // Generate session token (valid 14 days)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
  auth.sessions[token] = {
    role: 'admin',
    username: cleanUsername,
    displayName: name,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  writeAuthData(auth);

  // Initialize clean admin workspace if not present
  if (!fs.existsSync(ADMIN_WORKSPACE_FILE)) {
    const initialWorkspace = createEmptyWorkspace(name);
    fs.writeFileSync(ADMIN_WORKSPACE_FILE, JSON.stringify(initialWorkspace, null, 2), 'utf8');
  }

  return {
    token,
    user: {
      role: 'admin',
      username: cleanUsername,
      displayName: name,
    },
  };
}

export function verifyAdminLogin(username: string, password: string): { token: string; user: SessionUser } | null {
  const auth = readAuthData();
  if (!auth.admin) return null;

  if (auth.admin.username.toLowerCase() !== username.trim().toLowerCase()) {
    return null;
  }

  const isValid = verifyPassword(password, auth.admin.salt, auth.admin.passwordHash);
  if (!isValid) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
  auth.sessions[token] = {
    role: 'admin',
    username: auth.admin.username,
    displayName: auth.admin.displayName || auth.admin.username,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  writeAuthData(auth);

  return {
    token,
    user: {
      role: 'admin',
      username: auth.admin.username,
      displayName: auth.admin.displayName || auth.admin.username,
    },
  };
}

export function createGuestSession(): { token: string; user: SessionUser } {
  const token = `guest_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 2 * 86400000).toISOString(); // 48h
  const auth = readAuthData();

  const user: SessionUser = {
    role: 'guest',
    username: 'Guest',
    displayName: 'Guest User',
  };

  auth.sessions[token] = {
    role: 'guest',
    username: user.username,
    displayName: user.displayName,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  writeAuthData(auth);

  // Initialize isolated in-memory guest workspace
  guestWorkspaces.set(token, createEmptyWorkspace('Guest Workspace'));

  return { token, user };
}

export function getUserFromToken(token?: string): SessionUser | null {
  if (!token) return null;
  const auth = readAuthData();
  const session = auth.sessions[token];
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete auth.sessions[token];
    writeAuthData(auth);
    guestWorkspaces.delete(token);
    return null;
  }

  return {
    role: session.role,
    username: session.username,
    displayName: session.displayName,
  };
}

export function invalidateToken(token?: string): boolean {
  if (!token) return false;
  const auth = readAuthData();
  if (auth.sessions[token]) {
    delete auth.sessions[token];
    writeAuthData(auth);
    guestWorkspaces.delete(token);
    return true;
  }
  return false;
}

export function changeAdminPassword(currentPassword: string, newPassword: string): boolean {
  const auth = readAuthData();
  if (!auth.admin) {
    throw new Error('Admin not configured.');
  }

  const isValid = verifyPassword(currentPassword, auth.admin.salt, auth.admin.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  auth.admin.salt = newSalt;
  auth.admin.passwordHash = hashPassword(newPassword, newSalt);

  writeAuthData(auth);
  return true;
}

export function updateAdminProfile(displayName?: string): { username: string; displayName: string } {
  const auth = readAuthData();
  if (!auth.admin) throw new Error('Admin not configured.');

  if (displayName) {
    auth.admin.displayName = displayName.trim();
  }

  writeAuthData(auth);
  return {
    username: auth.admin.username,
    displayName: auth.admin.displayName,
  };
}

// Workspace Management with complete isolation between Admin and Guest
export function getWorkspace(user: SessionUser, token: string): any {
  if (user.role === 'admin') {
    ensureDataDir();
    if (!fs.existsSync(ADMIN_WORKSPACE_FILE)) {
      const initial = createEmptyWorkspace(user.displayName);
      fs.writeFileSync(ADMIN_WORKSPACE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    try {
      const raw = fs.readFileSync(ADMIN_WORKSPACE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read admin workspace, fallback to empty:', err);
      return createEmptyWorkspace(user.displayName);
    }
  }

  // Guest workspace: strictly in-memory and isolated
  if (!guestWorkspaces.has(token)) {
    guestWorkspaces.set(token, createEmptyWorkspace('Guest Workspace'));
  }
  return guestWorkspaces.get(token);
}

export function saveWorkspace(user: SessionUser, token: string, data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  if (user.role === 'admin') {
    ensureDataDir();
    const tempFile = `${ADMIN_WORKSPACE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, ADMIN_WORKSPACE_FILE);
    return true;
  }

  // Guest: save only to isolated in-memory map
  guestWorkspaces.set(token, data);
  return true;
}

export function restoreAdminWorkspace(data: any): boolean {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid workspace data payload.');
  }
  ensureDataDir();
  const tempFile = `${ADMIN_WORKSPACE_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, ADMIN_WORKSPACE_FILE);
  return true;
}
