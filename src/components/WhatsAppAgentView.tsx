import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Sparkles,
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Copy,
  CheckCircle2,
  RefreshCw,
  Send,
  Trash2,
  Lightbulb,
  CheckSquare,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Edit3,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { WhatsAppSuggestion, WhatsAppItemType, Priority } from '../types';

export const WhatsAppAgentView: React.FC = () => {
  const {
    whatsappSuggestions,
    pendingWhatsAppCount,
    isLoadingWhatsApp,
    loadWhatsAppSuggestions,
    approveWhatsAppSuggestion,
    rejectWhatsAppSuggestion,
    deleteWhatsAppSuggestion,
    clearProcessedWhatsAppSuggestions,
    simulateIncomingWhatsAppMessage,
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testSender, setTestSender] = useState('+1 (555) 019-2834');
  const [testSenderName, setTestSenderName] = useState('Alex Mercer');
  const [testMessageText, setTestMessageText] = useState('');
  const [simulationStatus, setSimulationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit modal state
  const [editingSuggestion, setEditingSuggestion] = useState<WhatsAppSuggestion | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<WhatsAppItemType>('task');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : '/api/whatsapp/webhook';
  const verifyToken = 'lifeos_whatsapp_verify_token_2026';

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const samplePresets = [
    {
      label: 'Assignment Deadline',
      sender: '+1 (555) 234-8901',
      name: 'Prof. Davis (College)',
      text: 'Reminder for all students: Submit the Distributed Systems Lab 4 report before this Friday 11:59 PM. High priority!',
    },
    {
      label: 'Team Sprint Sync',
      sender: '+1 (555) 432-1098',
      name: 'Sarah Chen (Lead)',
      text: 'Hey team, let us meet tomorrow at 3:00 PM for 45 minutes to review sprint architecture and milestones.',
    },
    {
      label: 'Project Idea',
      sender: '+1 (555) 789-0123',
      name: 'Marcus Bell',
      text: 'Idea: What if we integrate vector embeddings for LifeOS daily learning reflections to recommend next study topics?',
    },
    {
      label: 'Casual Greeting',
      sender: '+1 (555) 345-6789',
      name: 'Jordan Miller',
      text: 'Hey there! Hope you are having an awesome week. Let us grab lunch sometime soon!',
    },
  ];

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testMessageText.trim()) return;

    setIsSimulating(true);
    setSimulationStatus(null);
    try {
      const res = await simulateIncomingWhatsAppMessage(
        testMessageText.trim(),
        testSender.trim(),
        testSenderName.trim()
      );
      if (res.success) {
        setSimulationStatus({
          type: 'success',
          message: `Parsed successfully as ${res.suggestion?.parsedData.type || 'item'}. Added to suggestions queue!`,
        });
        setTestMessageText('');
        setActiveTab('pending');
      } else {
        setSimulationStatus({
          type: 'error',
          message: res.error || 'Failed to simulate message.',
        });
      }
    } catch {
      setSimulationStatus({ type: 'error', message: 'Network error during simulation.' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleOpenEdit = (sug: WhatsAppSuggestion) => {
    setEditingSuggestion(sug);
    setEditTitle(sug.parsedData.title);
    setEditDescription(sug.parsedData.description);
    setEditType(sug.parsedData.type || 'task');
    setEditPriority(sug.parsedData.priority || 'medium');
    setEditDueDate(sug.parsedData.dueDate || new Date().toISOString().slice(0, 10));
    setEditDueTime(sug.parsedData.dueTime || '');
  };

  const handleSaveEditAndApprove = async () => {
    if (!editingSuggestion) return;
    await approveWhatsAppSuggestion(editingSuggestion.id, {
      title: editTitle,
      description: editDescription,
      type: editType,
      priority: editPriority,
      dueDate: editDueDate,
      dueTime: editDueTime || undefined,
    });
    setEditingSuggestion(null);
  };

  const filteredSuggestions = whatsappSuggestions.filter(s => {
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'approved') return s.status === 'approved';
    if (activeTab === 'rejected') return s.status === 'rejected';
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-100">WhatsApp AI Agent</h1>
                <span className="rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Autonomous task, deadline, and event extraction from WhatsApp messages with user approval.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadWhatsAppSuggestions()}
            disabled={isLoadingWhatsApp}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-850 transition-colors disabled:opacity-50"
            title="Refresh suggestions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingWhatsApp ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {whatsappSuggestions.some(s => s.status !== 'pending') && (
            <button
              onClick={() => clearProcessedWhatsAppSuggestions()}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
              title="Clear approved and rejected history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Pending Review</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${pendingWhatsAppCount > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
              {pendingWhatsAppCount}
            </span>
            {pendingWhatsAppCount > 0 && (
              <span className="text-[10px] text-amber-400/80 font-medium">Needs Action</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Total Captured</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-200">
              {whatsappSuggestions.length}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Approved into LifeOS</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {whatsappSuggestions.filter(s => s.status === 'approved').length}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Webhook Status</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Ready & Listening</span>
          </div>
        </div>
      </div>

      {/* Test Mode Simulator (Interactive Playground) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-sm">
        <div
          onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer bg-zinc-900/90 hover:bg-zinc-850/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Interactive Test Simulator (No Meta Account Required)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">
              {isSimulatorOpen ? 'Collapse' : 'Simulate Message'}
            </span>
            {isSimulatorOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
          </div>
        </div>

        {isSimulatorOpen && (
          <div className="p-4 space-y-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Test how the LifeOS AI agent analyzes incoming WhatsApp messages, extracts deadlines and events, and constructs pending items. Pick a quick preset or type any custom message.
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-zinc-500 self-center">Presets:</span>
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTestSender(preset.sender);
                    setTestSenderName(preset.name);
                    setTestMessageText(preset.text);
                  }}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleRunSimulation} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={testSenderName}
                    onChange={e => setTestSenderName(e.target.value)}
                    placeholder="e.g. Prof. Davis"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Sender Phone Number</label>
                  <input
                    type="text"
                    value={testSender}
                    onChange={e => setTestSender(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Message Body</label>
                <textarea
                  rows={3}
                  value={testMessageText}
                  onChange={e => setTestMessageText(e.target.value)}
                  placeholder="Type or paste a WhatsApp message (e.g. 'Submit project presentation by tomorrow at 5 PM')..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none font-sans"
                />
              </div>

              {simulationStatus && (
                <div
                  className={`rounded-lg p-2.5 text-xs flex items-center gap-2 ${
                    simulationStatus.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}
                >
                  {simulationStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{simulationStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSimulating || !testMessageText.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSimulating ? 'Analyzing with Gemini...' : 'Analyze & Receive'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Webhook Configuration Guide */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <ExternalLink className="h-4 w-4 text-zinc-400" />
            <span>Meta WhatsApp Cloud API Webhook Endpoints</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Production Ready</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          For real-time messages directly from WhatsApp, configure a Webhook in the Meta Developer Portal pointing to this endpoint:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Webhook Callback URL</span>
              <button
                onClick={() => handleCopy(webhookUrl, 'url')}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                {copiedField === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'url' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-zinc-300 truncate">{webhookUrl}</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Verify Token</span>
              <button
                onClick={() => handleCopy(verifyToken, 'token')}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                {copiedField === 'token' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-zinc-300 truncate">{verifyToken}</p>
          </div>
        </div>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Pending Review</span>
            {pendingWhatsAppCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-mono">
                {pendingWhatsAppCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'approved'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Approved</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'rejected'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Dismissed</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>All ({whatsappSuggestions.length})</span>
          </button>
        </div>

        <span className="text-xs text-zinc-500">
          Showing {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Suggestions List */}
      {filteredSuggestions.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-850 border border-zinc-750 text-zinc-400">
            <MessageSquareQuote className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {activeTab === 'pending'
              ? 'Inbox Zero: No Pending WhatsApp Suggestions'
              : `No ${activeTab} suggestions found`}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            {activeTab === 'pending'
              ? 'New tasks, events, and notes extracted from WhatsApp will arrive here for your confirmation before touching your workspace.'
              : 'Items you approve or dismiss will be recorded in your history.'}
          </p>
          {activeTab === 'pending' && (
            <button
              onClick={() => {
                setIsSimulatorOpen(true);
                setTestSender('+1 (555) 234-8901');
                setTestSenderName('Prof. Davis');
                setTestMessageText('Reminder: Submit the Distributed Systems project by tomorrow 5 PM!');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors mt-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Simulate a Test Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map(sug => {
            const isPending = sug.status === 'pending';
            const isApproved = sug.status === 'approved';
            const isRejected = sug.status === 'rejected';

            const typeIcon = {
              task: <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />,
              calendar_event: <Calendar className="h-3.5 w-3.5 text-emerald-400" />,
              idea: <Lightbulb className="h-3.5 w-3.5 text-amber-400" />,
              casual: <MessageSquareQuote className="h-3.5 w-3.5 text-zinc-400" />,
            }[sug.parsedData.type || 'task'];

            const priorityColor = {
              urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
              medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
            }[sug.parsedData.priority || 'medium'];

            return (
              <div
                key={sug.id}
                className={`rounded-xl border transition-all ${
                  isPending
                    ? 'border-zinc-750 bg-zinc-900/90 shadow-sm'
                    : 'border-zinc-850 bg-zinc-900/50 opacity-80'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Top Bar: Sender & Status */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                        WA
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-200">
                          {sug.senderName || 'WhatsApp Contact'}
                        </span>
                        <span className="text-zinc-500 text-[11px] ml-1.5 font-mono">
                          {sug.sender}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500">
                        {new Date(sug.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(sug.receivedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>

                      {isApproved && (
                        <span className="rounded px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Added to LifeOS</span>
                        </span>
                      )}

                      {isRejected && (
                        <span className="rounded px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Dismissed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Raw WhatsApp Message Preview (Chat bubble) */}
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 text-xs text-zinc-300 font-sans leading-relaxed relative">
                    <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1">
                      Incoming Message
                    </div>
                    <p className="italic text-zinc-200">"{sug.rawMessage}"</p>
                  </div>

                  {/* AI Extraction Analysis */}
                  <div className="rounded-lg bg-zinc-850/40 border border-zinc-800 p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {typeIcon}
                          <span className="capitalize">{sug.parsedData.type.replace('_', ' ')}</span>
                        </span>

                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono uppercase border ${priorityColor}`}>
                          {sug.parsedData.priority}
                        </span>

                        <span className="text-[10px] text-zinc-500 font-mono">
                          Confidence: {Math.round(sug.parsedData.confidence * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        {sug.parsedData.dueDate && (
                          <div className="flex items-center gap-1 font-mono text-zinc-300">
                            <Calendar className="h-3 w-3 text-zinc-400" />
                            <span>{sug.parsedData.dueDate}</span>
                          </div>
                        )}
                        {sug.parsedData.dueTime && (
                          <div className="flex items-center gap-1 font-mono text-zinc-300">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span>{sug.parsedData.dueTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">
                        {sug.parsedData.title}
                      </h4>
                      {sug.parsedData.description && sug.parsedData.description !== sug.rawMessage && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                          {sug.parsedData.description}
                        </p>
                      )}
                    </div>

                    {sug.parsedData.reasoning && (
                      <p className="text-[10px] text-zinc-500 italic">
                        AI Reasoning: {sug.parsedData.reasoning}
                      </p>
                    )}

                    {/* Tags */}
                    {sug.parsedData.tags && sug.parsedData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sug.parsedData.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => approveWhatsAppSuggestion(sug.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-1.5 text-xs font-semibold transition-all shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              Accept as {sug.parsedData.type === 'calendar_event' ? 'Event' : sug.parsedData.type === 'idea' ? 'Idea' : 'Task'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(sug)}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-850 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Edit & Accept</span>
                          </button>

                          <button
                            onClick={() => rejectWhatsAppSuggestion(sug.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-850 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => deleteWhatsAppSuggestion(sug.id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5"
                      title="Delete from list"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit & Approve Modal */}
      {editingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Review & Refine WhatsApp Item</h3>
              </div>
              <button
                onClick={() => setEditingSuggestion(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Item Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">LifeOS Target</label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="task">Task Engine</option>
                    <option value="calendar_event">Calendar Event</option>
                    <option value="idea">Idea Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Due Time (Optional)</label>
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={e => setEditDueTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setEditingSuggestion(null)}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditAndApprove}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-1.5 text-xs font-semibold"
              >
                Approve & Add to LifeOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
