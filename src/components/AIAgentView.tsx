import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Trash2,
  CheckCircle2,
  Plus,
  Compass,
  Cpu,
  RefreshCw,
  FolderGit2,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLifeOS } from '../context/LifeOSContext';

export const AIAgentView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clearChatHistory,
    settings,
    memory,
    tasks,
    skills,
    projects,
    goals,
  } = useLifeOS();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');
    setIsSending(true);
    try {
      await sendChatMessage(text);
    } catch {
      // Gracefully handled inside sendChatMessage fallback
    } finally {
      setIsSending(false);
    }
  };

  const samplePrompts = [
    'I have 40 minutes. What should I work on?',
    'What should I learn next for AI Agents?',
    'What am I currently behind on?',
    'Review what I learned today',
    'Remind me to benchmark agent throughput tomorrow at 3pm',
    'Rate my learning today',
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row max-w-6xl mx-auto overflow-hidden">
      {/* Main Chat Stream */}
      <div className="flex flex-1 flex-col h-full overflow-hidden border-r border-white/[0.06] bg-[#0b0c10]">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0e1015]/80 px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-neutral-300">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-neutral-100">LifeOS Co-pilot</h2>
                <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 border border-white/[0.06]">
                  {settings.personality}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Connected to Tasks, Skills, Projects, Goals & Memory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsContextDrawerOpen(!isContextDrawerOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              title="Inspect AI Context"
            >
              <Cpu className="h-3.5 w-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Context</span>
            </button>
            <button
              onClick={clearChatHistory}
              className="rounded-lg p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
              title="Clear Conversation History"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {chatMessages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-neutral-400 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-neutral-800 text-neutral-100 border border-white/[0.08]'
                      : 'surface-card text-neutral-200'
                  }`}
                >
                  <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-[#0c0d12] prose-pre:border prose-pre:border-white/[0.06]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Action feedback chip */}
                  {msg.actionTaken && (
                    <div className="mt-3 flex items-center gap-2 rounded-md bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5 text-[11px] text-neutral-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Action: <strong className="font-medium text-neutral-200">{msg.actionTaken.details}</strong></span>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] space-y-1.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        Suggested:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(sug)}
                            className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-neutral-400 hover:border-white/[0.15] hover:text-neutral-200 transition-colors text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-neutral-500 text-right font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-neutral-400 mt-0.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-neutral-400" />
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-xs text-neutral-400 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse" />
                <span>Processing context and synthesizing response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Fast Action Chips */}
        <div className="border-t border-white/[0.06] bg-[#0e1015] p-3.5 space-y-2.5">
          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-400 hover:border-white/[0.15] hover:text-neutral-200 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="ai-agent-input"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask anything, issue commands, or request skill guidance..."
              className="flex-1 rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/[0.2]"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-950 hover:bg-white disabled:opacity-30 transition-all shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Drawer: Context Inspector (Shows what AI remembers and references) */}
      {isContextDrawerOpen && (
        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-white/[0.06] bg-[#0e1015] p-4 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
              <Cpu className="h-3.5 w-3.5 text-neutral-400" />
              <span>Context Inspector</span>
            </div>
            <button
              onClick={() => setIsContextDrawerOpen(false)}
              className="text-neutral-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {/* Active Skills Context */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Skills in Memory ({skills.length})
            </span>
            <div className="space-y-1">
              {skills.map(s => (
                <div key={s.id} className="rounded-lg bg-white/[0.02] p-2 text-xs border border-white/[0.04]">
                  <div className="flex justify-between font-medium text-neutral-300">
                    <span className="truncate">{s.name}</span>
                    <span className="font-mono text-neutral-400 shrink-0 ml-2">{s.currentMastery}%</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 capitalize">{s.state}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Memory Context */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Memories ({memory.filter(m => m.enabled).length})
            </span>
            <div className="space-y-1">
              {memory.filter(m => m.enabled).slice(0, 4).map(m => (
                <div key={m.id} className="rounded-lg bg-white/[0.02] p-2 text-xs border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block truncate">{m.key}</span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed line-clamp-2">{m.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects Context */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Projects ({projects.length})
            </span>
            <div className="space-y-1">
              {projects.map(p => (
                <div key={p.id} className="rounded-lg bg-white/[0.02] p-2 text-xs border border-white/[0.04] flex justify-between">
                  <span className="text-neutral-300 truncate">{p.name}</span>
                  <span className="font-mono text-neutral-400 shrink-0 ml-2">{p.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
