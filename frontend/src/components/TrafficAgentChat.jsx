import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  History,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Trash2,
  MapPin,
  RotateCcw,
  Compass,
  Radio,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  sendAgentMessage,
  getSuggestedPrompts,
  clearAgentSession,
  generateNewConversationId,
  loadChatHistory,
  saveConversationToHistory,
  deleteConversationFromHistory,
  generateConversationTitle,
  formatHistoryDateGroup,
} from '../services/agentService';

export default function TrafficAgentChat({
  role = 'citizen',
  isWidget = false,
  onClose = null,
  initialFullScreen = false,
}) {
  // Session & conversation management
  const [currentConvId, setCurrentConvId] = useState(() => `conv_${Date.now()}`);
  const [backendSessionId, setBackendSessionId] = useState(() => generateNewConversationId());
  const [conversationTitle, setConversationTitle] = useState('New Conversation');

  // UI state
  const [isFullScreen, setIsFullScreen] = useState(initialFullScreen);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [thinkingStatus, setThinkingStatus] = useState('Getting traffic information…');
  const [lastUserQuery, setLastUserQuery] = useState('');

  // Welcome message template
  const getWelcomeMessage = () => ({
    id: 'welcome',
    role: 'assistant',
    content:
      role === 'authority'
        ? "Hello! I am **CITYFLOW AI**, your operations traffic assistant.\n\nI can analyze corridor congestion, investigate incident obstructions, evaluate emergency routes to hospitals, and provide traffic management advisories.\n\nHow can I assist municipal operations?"
        : "Hi! I'm **CITYFLOW AI**.\n\nI can help you understand traffic, find better routes, investigate congestion, and check available traffic forecasts.\n\nWhat would you like to know?",
    sources: [],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState([getWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied'
  const [prompts, setPrompts] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history on mount
  useEffect(() => {
    setHistoryList(loadChatHistory());
  }, []);

  // Keyboard shortcut: ESC to exit fullscreen or close history
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
        } else if (isFullScreen) {
          setIsFullScreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, showHistory]);

  // Load role-aware suggested prompts
  useEffect(() => {
    async function loadPrompts() {
      const p = await getSuggestedPrompts(role);
      if (p && p.length > 0) {
        setPrompts(p);
      } else {
        // Fallback default clean prompts
        setPrompts(
          role === 'authority'
            ? [
                'How is corridor flow across major arterials?',
                'Are there any active road incidents reported?',
                'Find fastest emergency route to hospital',
                "Tomorrow's traffic forecast for Silk Board",
              ]
            : [
                'How is traffic in Bengaluru right now?',
                'Why is traffic heavy near Silk Board?',
                'Find a route from Hyderabad to Bengaluru',
                'What traffic should I expect tomorrow?',
              ]
        );
      }
    }
    loadPrompts();
  }, [role]);

  // Persist current conversation to localStorage history
  useEffect(() => {
    // Only save if conversation has actual user messages
    const hasUserMessages = messages.some((m) => m.role === 'user');
    if (!hasUserMessages) return;

    const convRecord = {
      id: currentConvId,
      conversationId: backendSessionId,
      title: conversationTitle,
      role,
      messages,
      updatedAt: Date.now(),
    };
    saveConversationToHistory(convRecord);
    setHistoryList(loadChatHistory());
  }, [messages, currentConvId, backendSessionId, conversationTitle, role]);

  // Handle Location Permission Request
  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationStatus('granted');
      },
      (err) => {
        console.warn('Location permission denied or failed:', err);
        setLocationStatus('denied');
      },
      { timeout: 7000 }
    );
  };

  // Determine user-friendly thinking status text
  const determineThinkingStatus = (query) => {
    const q = (query || '').toLowerCase();
    if (/\b(route|to|directions|travel to|how to reach|from .* to)\b/.test(q)) {
      return 'Finding the best route…';
    }
    if (/\b(speed|current|flow|live|how is traffic|now)\b/.test(q)) {
      return 'Checking current traffic…';
    }
    if (/\b(why|incident|accident|hazard|block|obstruction|delay)\b/.test(q)) {
      return 'Checking traffic incidents…';
    }
    if (/\b(tomorrow|forecast|predict|next day|future)\b/.test(q)) {
      return 'Looking at the forecast…';
    }
    return 'Getting traffic information…';
  };

  // Submit Message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setError(null);
    setInput('');
    setLastUserQuery(text);

    // If this is the first user query, derive title
    const isFirstUserMsg = !messages.some((m) => m.role === 'user');
    if (isFirstUserMsg) {
      setConversationTitle(generateConversationTitle(text));
    }

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setThinkingStatus(determineThinkingStatus(text));
    setLoading(true);

    try {
      const res = await sendAgentMessage(text, backendSessionId, userLocation, role);

      const agentMsg = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        data: res.data || {},
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      setError(err.message || 'Unable to retrieve traffic information.');
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          "I couldn't get the traffic information right now. Please try again.",
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Start a new conversation
  const handleStartNewChat = () => {
    const newId = `conv_${Date.now()}`;
    const newSession = generateNewConversationId();
    setCurrentConvId(newId);
    setBackendSessionId(newSession);
    setConversationTitle('New Conversation');
    setMessages([getWelcomeMessage()]);
    setError(null);
    setInput('');
    setShowHistory(false);
  };

  // Restore conversation from history
  const handleSelectHistoryItem = (item) => {
    if (!item) return;
    setCurrentConvId(item.id);
    setBackendSessionId(item.conversationId || generateNewConversationId());
    setConversationTitle(item.title || 'Traffic Conversation');
    setMessages(item.messages && item.messages.length > 0 ? item.messages : [getWelcomeMessage()]);
    setError(null);
    setInput('');
    setShowHistory(false);
  };

  // Delete conversation from history
  const handleDeleteHistoryItem = (e, id) => {
    e.stopPropagation();
    deleteConversationFromHistory(id);
    setHistoryList(loadChatHistory());
    if (id === currentConvId) {
      handleStartNewChat();
    }
  };

  // Minimal subtle source label helper
  const getSubtleSourceLabel = (src) => {
    if (!src) return null;
    if (src.includes('TomTom')) return 'Based on real-time traffic flow';
    if (src.includes('Google')) return 'Traffic-aware route data';
    if (src.includes('CITYFLOW ML')) return 'Next-day ML forecast (Bengaluru corridor)';
    if (src.includes('Incident')) return 'Active road incident report';
    return 'CITYFLOW verified data';
  };

  // Render markdown-like simple text formatting
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Headers: **Title**
          if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
            return (
              <div key={idx} className="font-bold text-slate-900 tracking-tight pt-1">
                {trimmed.slice(2, -2)}
              </div>
            );
          }

          // Bullet points
          if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-accent font-bold mt-1 text-xs">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
              </div>
            );
          }

          // Table divider
          if (trimmed.startsWith('|') && trimmed.includes('---')) {
            return null;
          }

          // Table row
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.split('|').filter((c) => c.trim().length > 0);
            return (
              <div
                key={idx}
                className="grid grid-flow-col auto-cols-fr gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-800"
              >
                {cells.map((cell, cIdx) => (
                  <div key={cIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell.trim()) }} />
                ))}
              </div>
            );
          }

          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />;
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
  };

  // Structured response cards (Current Traffic, Routes, Forecast)
  const renderStructuredDataCard = (data) => {
    if (!data) return null;

    // 1. Current Live Traffic Card
    if (data.live_traffic && data.live_traffic.current_speed !== undefined) {
      const lt = data.live_traffic;
      const delayMin = Math.round((lt.delay_seconds || 0) / 60);
      const isSlow = lt.current_speed < (lt.freeflow_speed || 40) * 0.7;

      return (
        <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-accent dark:text-sky-400" />
              <span>{lt.road || 'Current Traffic'}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSlow ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {isSlow ? 'Heavy Traffic' : 'Flowing Normally'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-center">
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Current Speed</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{lt.current_speed} km/h</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Normal Speed</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{lt.freeflow_speed || '--'} km/h</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Delay</div>
              <div className={`text-xs font-bold ${delayMin > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {delayMin > 0 ? `+${delayMin} min` : 'None'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. Route Summary Card
    if (data.route && data.route.duration_formatted) {
      const r = data.route;
      return (
        <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-accent dark:text-sky-400" />
              <span>{r.origin} → {r.destination}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
              {r.traffic_condition || 'Recommended'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-center">
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">ETA</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{r.duration_formatted}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Distance</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.distance_km ? `${r.distance_km} km` : '--'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Traffic Impact</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{r.traffic_condition ? r.traffic_condition.replace(' Traffic Impact', '') : 'Normal'}</div>
            </div>
          </div>
        </div>
      );
    }

    // 3. Forecast Card
    if (data.forecast && data.forecast.corridor) {
      const f = data.forecast;
      return (
        <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{f.corridor}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Next-Day Forecast
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-center">
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Congestion</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{f.congestion_level || 'Moderate'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Est. Speed</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{f.speed ? `${f.speed} km/h` : '--'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Model</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">CITYFLOW ML</div>
            </div>
          </div>
        </div>
      );
    }

    // 4. Clean Coverage Presentation Card
    if (data.coverage) {
      return (
        <div className="mt-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white tracking-tight text-xs">CITYFLOW AI</div>
              <div className="text-[11px] text-accent dark:text-sky-400 font-semibold">India-wide traffic intelligence</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-accent dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
              Platform Scope
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Location & map coverage</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">India</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Traffic-aware route planning</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">India / supported routes</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Current traffic & incidents</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">Available locations through connected traffic services</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">CITYFLOW next-day ML forecast</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span>Bengaluru arterial corridors</span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">Currently validated</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 italic">
            ML forecast coverage is being expanded city-by-city as models are validated.
          </div>
        </div>
      );
    }

    return null;
  };

  // Group history items by relative dates
  const groupedHistory = historyList.reduce((acc, item) => {
    const group = formatHistoryDateGroup(item.updatedAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  // Common Chat Header JSX
  const ChatHeader = (
    <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 select-none transition-colors">
      {/* Brand & Assistant Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900 flex items-center justify-center text-accent shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">CITYFLOW AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {role === 'authority' ? 'Operations Assistant' : 'Your traffic assistant'}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5">
        {/* Location pill */}
        <button
          type="button"
          onClick={handleEnableLocation}
          title={locationStatus === 'granted' ? 'Location enabled' : 'Share browser location for local queries'}
          aria-label="Toggle location"
          className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-[11px] font-medium ${
            locationStatus === 'granted'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">
            {locationStatus === 'granted' ? 'Nearby On' : locationStatus === 'locating' ? 'Locating...' : 'Near Me'}
          </span>
        </button>

        {/* Chat History button */}
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          title="Chat History"
          aria-label="View chat history"
          className={`p-2 rounded-xl border transition-all text-xs ${
            showHistory
              ? 'bg-sky-50 text-accent border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-bold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
        </button>

        {/* Fullscreen toggle button */}
        <button
          type="button"
          onClick={() => setIsFullScreen(!isFullScreen)}
          title={isFullScreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
          aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white transition-all text-xs"
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Close/Minimize for widget mode */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close Assistant"
            aria-label="Close assistant"
            className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-all text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // Common Chat Input & Prompt Chips JSX
  const ChatInputSection = (
    <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Suggested Prompt Chips */}
      {prompts.length > 0 && !loading && (
        <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {prompts.slice(0, 4).map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-accent hover:border-sky-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-sky-300 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap shrink-0 transition-colors border border-slate-200/80 dark:border-slate-700 active:scale-95"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 flex items-center gap-2"
      >
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              role === 'authority'
                ? 'Ask about corridor flow, incidents, or emergency routing...'
                : 'Ask about current speeds, route options, incidents, or tomorrow...'
            }
            disabled={loading}
            aria-label="Ask CITYFLOW AI"
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="px-4 py-3 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );

  // Common Messages Scroll View JSX
  const MessagesScrollView = (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/40 transition-colors">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                isUser
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white border border-slate-200 text-accent dark:bg-slate-800 dark:border-slate-700 dark:text-sky-400'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 shadow-soft space-y-2 ${
                isUser
                  ? 'bg-accent text-white rounded-tr-sm'
                  : 'bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-sm text-slate-800 dark:text-slate-100'
              }`}
            >
              {/* Message text */}
              <div className={isUser ? 'text-white text-xs sm:text-sm font-medium' : ''}>
                {isUser ? msg.content : renderFormattedText(msg.content)}
              </div>

              {/* Structured Info Card (if present) */}
              {!isUser && msg.data && renderStructuredDataCard(msg.data)}

              {/* Subtle Source Attribution */}
              {!isUser && msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400">
                  {msg.sources.map((src, sIdx) => {
                    const label = getSubtleSourceLabel(src);
                    return label ? (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/80" />
                        <span>{label}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Timestamp & Try Again (for error) */}
              <div
                className={`text-[10px] flex items-center justify-between gap-2 ${
                  isUser ? 'text-white/70 text-right' : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.isError && lastUserQuery && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(lastUserQuery)}
                    className="text-accent dark:text-sky-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Thinking / Getting Information Indicator */}
      {loading && (
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-accent dark:text-sky-400">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-3xl rounded-tl-sm p-4 shadow-soft space-y-2 max-w-[85%]">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>{thinkingStatus}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );

  // History Drawer Overlay JSX
  const HistoryDrawer = showHistory && (
    <div className="absolute inset-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
      {/* History Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">Chat History</span>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(false)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Close history"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleStartNewChat}
          className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs space-y-1">
            <Clock className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p>No past conversations yet.</p>
            <p className="text-[11px]">Ask CITYFLOW AI about routes, traffic, or forecasts.</p>
          </div>
        ) : (
          Object.entries(groupedHistory).map(([group, items]) => (
            <div key={group} className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                {group}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = item.id === currentConvId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistoryItem(item)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all border ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-accent dark:text-sky-300 font-semibold shadow-xs'
                          : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="truncate flex-1 pr-2">
                        <div className="truncate">{item.title || 'Traffic Conversation'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Fullscreen Container
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-200">
        {/* Fullscreen Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="max-w-3xl w-full mx-auto">
            {ChatHeader}
          </div>
        </div>

        {/* Fullscreen Conversation Body */}
        <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col overflow-hidden relative">
          {HistoryDrawer}
          {MessagesScrollView}
          {ChatInputSection}
        </div>
      </div>
    );
  }

  // Standard Floating / In-page Container
  return (
    <div
      className={`relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 ${
        isWidget
          ? 'h-[580px] max-h-[85vh] rounded-3xl shadow-soft-xl'
          : 'h-[720px] max-h-[85vh] rounded-3xl shadow-soft'
      } overflow-hidden transition-colors`}
    >
      {HistoryDrawer}
      {ChatHeader}
      {MessagesScrollView}
      {ChatInputSection}
    </div>
  );
}

