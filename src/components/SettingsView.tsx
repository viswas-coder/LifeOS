import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Bot,
  User,
  Download,
  Upload,
  RotateCcw,
  Check,
  Sparkles,
  Shield,
  FileJson,
  Lock,
  Key,
  Database,
  LogOut,
  AlertCircle,
  CheckCircle2,
  MessageSquareQuote,
  Copy,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { getWhatsAppConfigApi, saveWhatsAppConfigApi } from '../services/whatsappService';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    settings,
    updateSettings,
    exportDataJSON,
    importDataJSON,
    restoreDefaults,
    currentUser,
    logout,
    changeAdminPassword,
    updateAdminProfileName,
    restoreWorkspaceBackup,
  } = useLifeOS();

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || profile.name);
  const [nameStatus, setNameStatus] = useState<string | null>(null);

  // WhatsApp Integration Settings
  const [waConfig, setWaConfig] = useState<{
    enabled: boolean;
    verifyToken: string;
    allowedSenders: string[];
    defaultPriority: 'urgent' | 'high' | 'medium' | 'low';
  }>({
    enabled: true,
    verifyToken: 'lifeos_whatsapp_verify_token_2026',
    allowedSenders: [],
    defaultPriority: 'medium',
  });
  const [waWhitelistInput, setWaWhitelistInput] = useState('');
  const [waSaveStatus, setWaSaveStatus] = useState<string | null>(null);
  const [waCopied, setWaCopied] = useState<string | null>(null);

  React.useEffect(() => {
    getWhatsAppConfigApi().then(cfg => {
      if (cfg) {
        setWaConfig(cfg);
        setWaWhitelistInput(cfg.allowedSenders?.join(', ') || '');
      }
    });
  }, []);

  const handleSaveWaConfig = async () => {
    const senders = waWhitelistInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const updated = await saveWhatsAppConfigApi({
      ...waConfig,
      allowedSenders: senders,
    });
    if (updated) {
      setWaConfig(updated);
      setWaSaveStatus('WhatsApp integration settings saved successfully.');
      setTimeout(() => setWaSaveStatus(null), 3000);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          importDataJSON(content);
          if (currentUser?.role === 'admin') {
            await restoreWorkspaceBackup(parsed);
          }
          setSaveStatus('Workspace data successfully restored and synced to server!');
          setTimeout(() => setSaveStatus(null), 4000);
        } catch {
          alert('Failed to parse backup JSON file. Ensure it is a valid LifeOS export.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Reset workspace to an empty clean state? Current local items will be cleared.')) {
      restoreDefaults();
      setSaveStatus('Workspace reset to clean state.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    updateProfile({ name: displayNameInput.trim() });
    if (currentUser?.role === 'admin') {
      const res = await updateAdminProfileName(displayNameInput.trim());
      if (res.success) {
        setNameStatus('Display name updated in admin credentials.');
        setTimeout(() => setNameStatus(null), 3000);
      }
    } else {
      setNameStatus('Display name updated for this session.');
      setTimeout(() => setNameStatus(null), 3000);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    const result = await changeAdminPassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (result.success) {
      setPasswordStatus({ type: 'success', message: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus(null), 4000);
    } else {
      setPasswordStatus({ type: 'error', message: result.error || 'Failed to update password.' });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Settings & Calibration</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure authentication, security, AI behavior, and data backup.
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {saveStatus && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 1. Account & Security */}
      <div className="surface-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <Shield className="h-4 w-4 text-neutral-400" />
            <h3>Account & Workspace Security</h3>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
              currentUser?.role === 'admin'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {currentUser?.role === 'admin' ? 'Admin Active' : 'Guest Sandbox'}
          </span>
        </div>

        {currentUser?.role === 'guest' ? (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Guest Session Mode</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              You are currently using an isolated in-memory guest session. Guest data is not persisted to disk and does not have access to the Admin workspace. To persist your tasks, roadmaps, and AI history permanently, sign out and create an Admin account.
            </p>
            <div className="pt-2">
              <button
                onClick={logout}
                className="rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
              >
                Sign In or Setup Admin Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display Name Edit */}
            <form onSubmit={handleSaveDisplayName} className="space-y-2">
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs text-neutral-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={e => setDisplayNameInput(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors"
                >
                  Update Name
                </button>
              </div>
              {nameStatus && <p className="text-[11px] text-emerald-400">{nameStatus}</p>}
            </form>

            {/* Change Password */}
            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                <Key className="h-3.5 w-3.5 text-neutral-400" />
                <span>Change Admin Password</span>
              </div>

              {passwordStatus && (
                <div
                  className={`rounded-lg p-2.5 text-xs flex items-center gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}
                >
                  {passwordStatus.type === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Confirm New Password</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
                    />
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="shrink-0 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-neutral-100 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 2. AI Personality & Calibration */}
      <div className="surface-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 border-b border-white/[0.06] pb-2.5">
          <Bot className="h-4 w-4 text-neutral-400" />
          <h3>AI Co-Pilot Calibration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-neutral-300 mb-1">Personality Archetype</label>
            <select
              value={settings.personality}
              onChange={e => updateSettings({ personality: e.target.value as any })}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
            >
              <option value="analytical">Analytical & Systems-Oriented</option>
              <option value="direct">Direct & Concise</option>
              <option value="friendly">Friendly & Collaborative</option>
              <option value="encouraging">Momentum-Building</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1">Proactivity Level</label>
            <select
              value={settings.proactivity}
              onChange={e => updateSettings({ proactivity: e.target.value as any })}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
            >
              <option value="high">High (Proactive Suggestions)</option>
              <option value="medium">Medium (Standard Guidance)</option>
              <option value="low">Low (Prompt-Only Responses)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1">Detail & Synthesis Level</label>
            <select
              value={settings.detailLevel}
              onChange={e => updateSettings({ detailLevel: e.target.value as any })}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
            >
              <option value="concise">Concise & Dense</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">In-Depth & Exhaustive</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. User Work Style */}
      <div className="surface-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 border-b border-white/[0.06] pb-2.5">
          <User className="h-4 w-4 text-neutral-400" />
          <h3>Work Style & Focus Goals</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-300 mb-1">Role / Specialization</label>
            <input
              type="text"
              value={profile.role}
              onChange={e => updateProfile({ role: e.target.value })}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1">Daily Deep Focus Target (Hours)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={profile.targetFocusHoursPerDay}
              onChange={e => updateProfile({ targetFocusHoursPerDay: Number(e.target.value) })}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-300 mb-1">Work Style Description</label>
            <input
              type="text"
              value={profile.workStyle}
              onChange={e => updateProfile({ workStyle: e.target.value })}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp AI Webhook & Integration */}
      <div className="surface-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <MessageSquareQuote className="h-4 w-4 text-emerald-400" />
            <h3>WhatsApp AI Integration & Webhook</h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={waConfig.enabled}
              onChange={e => setWaConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-white/[0.2] bg-white/[0.05] text-emerald-500 focus:ring-0"
            />
          </label>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
          Authorized Meta WhatsApp Cloud API webhooks automatically analyze messages with Gemini 3.8 Flash, extract deadlines and meetings, and send them to your review queue before modifying your tasks or calendar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/[0.08] bg-[#0c0d12] p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Webhook Endpoint</span>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/api/whatsapp/webhook`;
                  navigator.clipboard.writeText(url);
                  setWaCopied('url');
                  setTimeout(() => setWaCopied(null), 2000);
                }}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                {waCopied === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{waCopied === 'url' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-neutral-300 truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}
            </p>
          </div>

          <div className="rounded-lg border border-white/[0.08] bg-[#0c0d12] p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Verify Token</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(waConfig.verifyToken);
                  setWaCopied('token');
                  setTimeout(() => setWaCopied(null), 2000);
                }}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                {waCopied === 'token' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{waCopied === 'token' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-neutral-300 truncate">
              {waConfig.verifyToken}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-neutral-300">
            Allowed Senders Whitelist (Optional)
          </label>
          <input
            type="text"
            value={waWhitelistInput}
            onChange={e => setWaWhitelistInput(e.target.value)}
            placeholder="e.g. +15551234567, +15559876543 (leave empty to accept from all senders)"
            className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-white/[0.2]"
          />
          <span className="text-[11px] text-neutral-500">
            Comma-separated international phone numbers. If empty, messages from any sender will be analyzed.
          </span>
        </div>

        {waSaveStatus && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{waSaveStatus}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveWaConfig}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 transition-all shadow-ambient-sm"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Save WhatsApp Settings</span>
          </button>
        </div>
      </div>

      {/* 4. Data Portability & Local Persistence */}
      <div className="surface-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 border-b border-white/[0.06] pb-2.5">
          <Database className="h-4 w-4 text-neutral-400" />
          <h3>Local Storage & Backup</h3>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
          LifeOS AI saves data directly to your local file storage (`/data/admin_workspace.json`). You can export standalone JSON archives or restore your database at any time.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 transition-all shadow-ambient-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON Archive</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-neutral-400" />
            <span>Import & Restore</span>
          </button>

          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-neutral-500 hover:text-rose-400 hover:border-rose-500/20 transition-colors ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear Workspace</span>
          </button>
        </div>
      </div>

      {/* 5. Desktop Deployment & API Security */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-neutral-400 space-y-1.5">
        <div className="flex items-center gap-2 text-neutral-300 font-medium">
          <Lock className="h-3.5 w-3.5 text-neutral-400" />
          <span>Local Personal Installation Security</span>
        </div>
        <p className="leading-relaxed">
          The application backend binds to your local server only. API keys such as <code className="font-mono text-neutral-300">GEMINI_API_KEY</code> are loaded through server environment variables and are never transmitted to or readable by the frontend client. If no API key is provided or the network is disconnected, LifeOS executes built-in deterministic planning algorithms with zero downtime.
        </p>
      </div>
    </div>
  );
};
