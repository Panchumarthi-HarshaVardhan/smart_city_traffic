/**
 * CITYFLOW AI - Traffic Intelligence Agent Client Service
 * Communicates strictly with the backend /api/agent/* endpoints.
 * Never calls Groq directly or exposes API credentials to the browser.
 */

const API_BASE = 'http://localhost:8000/api/agent';
const HISTORY_STORAGE_KEY = 'cityflow_chat_history_v2';

/**
 * Generate a fresh unique session ID.
 */
export function generateNewConversationId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Retrieve or create persistent session ID for the current browser session.
 */
export function getOrCreateConversationId() {
  let cid = sessionStorage.getItem('cityflow_agent_cid');
  if (!cid) {
    cid = generateNewConversationId();
    sessionStorage.setItem('cityflow_agent_cid', cid);
  }
  return cid;
}

/**
 * Send a user message to the Traffic Intelligence Agent.
 * 
 * @param {string} message User message
 * @param {string} conversationId Session identifier
 * @param {Object|null} location Optional browser coordinates {latitude, longitude}
 * @param {string} role User role ('citizen' or 'authority')
 * @returns {Promise<Object>} Agent response payload
 */
export async function sendAgentMessage(message, conversationId = null, location = null, role = 'citizen') {
  const cid = conversationId || getOrCreateConversationId();
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: cid,
        location,
        role,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Traffic Agent communication error:', err);
    throw err;
  }
}

/**
 * Fetch suggested prompts for the given role.
 * 
 * @param {string} role 'citizen' or 'authority'
 * @returns {Promise<Array<string>>}
 */
export async function getSuggestedPrompts(role = 'citizen') {
  try {
    const res = await fetch(`${API_BASE}/prompts?role=${role}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.prompts || [];
  } catch (err) {
    console.warn('Failed to fetch agent prompts:', err);
    return [];
  }
}

/**
 * Clear conversational memory for the current session.
 * 
 * @param {string} conversationId
 */
export async function clearAgentSession(conversationId = null) {
  const cid = conversationId || getOrCreateConversationId();
  try {
    await fetch(`${API_BASE}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: cid }),
    });
  } catch (err) {
    console.warn('Failed to clear agent session:', err);
  }
}

/* =========================================================================
   Frontend Chat History Management (localStorage)
   ========================================================================= */

/**
 * Load all saved conversations from localStorage.
 * Returns array sorted by updatedAt descending.
 */
export function loadChatHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.warn('Failed to load chat history:', err);
    return [];
  }
}

/**
 * Save or update a conversation in localStorage.
 * 
 * @param {Object} conv Conversation object
 */
export function saveConversationToHistory(conv) {
  if (!conv || !conv.id) return;
  try {
    const history = loadChatHistory();
    const existingIdx = history.findIndex((c) => c.id === conv.id);
    const updated = {
      ...conv,
      updatedAt: Date.now(),
    };

    if (existingIdx >= 0) {
      history[existingIdx] = updated;
    } else {
      history.unshift(updated);
    }

    // Keep maximum 30 conversations to save localStorage space
    const trimmed = history.slice(0, 30);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save conversation to history:', err);
  }
}

/**
 * Delete a conversation from localStorage by ID.
 * 
 * @param {string} id Conversation ID
 */
export function deleteConversationFromHistory(id) {
  try {
    const history = loadChatHistory();
    const filtered = history.filter((c) => c.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete conversation:', err);
  }
}

/**
 * Generate a friendly, clean title from the user's first query.
 * 
 * @param {string} text First user message
 * @returns {string} Clean title
 */
export function generateConversationTitle(text) {
  if (!text) return 'Traffic Conversation';
  let cleaned = text.trim();

  // Strip trailing punctuation
  cleaned = cleaned.replace(/[?!.]+$/, '');

  // Truncate cleanly up to 36 chars
  if (cleaned.length > 36) {
    cleaned = cleaned.substring(0, 36).trim() + '...';
  }

  // Capitalize first character
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Helper to group timestamp into "Today", "Yesterday", or "Earlier".
 */
export function formatHistoryDateGroup(timestamp) {
  if (!timestamp) return 'Earlier';
  const now = new Date();
  const date = new Date(timestamp);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return 'Earlier';
}
