import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { detectOffPlatformContact, OFF_PLATFORM_WARNING } from '../lib/workflows';

// TODO: Replace with Supabase realtime subscription. For MVP, poll Supabase messages table every 30s using setInterval in useEffect.

interface DbMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  parent_message_id: string | null;
  project_id: string | null;
  created_at: string;
}

interface UiMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  type: 'text' | 'url';
  warning?: boolean;
}

interface Conversation {
  id: string; // other party's profile id
  counterparty: string;
  counterparty_type: 'vendor' | 'buyer';
  engagement: string;
  avatar_initials: string;
  avatar_color: string;
  preview: string;
  timestamp: string;
  lastMessageAt: string;
  unread: number;
  messages: UiMessage[];
}

const IDLE_READONLY_DAYS = 90;

function isIdleReadOnly(lastMessageAt: string): boolean {
  const days = (Date.now() - new Date(lastMessageAt).getTime()) / 86400000;
  return days > IDLE_READONLY_DAYS;
}

const AVATAR_COLORS = [
  'bg-[#0070F3]', 'bg-[#0E7C6A]', 'bg-purple-500',
  'bg-rose-500', 'bg-amber-500', 'bg-teal-600',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface MessagingPageProps {
  initialConversationId?: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ initialConversationId }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeId) ?? conversations[0] ?? null;

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all messages involving this user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, is_read, created_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!messages || messages.length === 0) {
        setConversations([]);
        return;
      }

      // Collect unique other-party ids
      const otherPartyIds = Array.from(
        new Set(
          messages.map((m: { sender_id: string; recipient_id: string }) =>
            m.sender_id === user.id ? m.recipient_id : m.sender_id
          )
        )
      );

      // Fetch profiles for all other parties
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, user_type')
        .in('id', otherPartyIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null; user_type: string | null }) => [p.id, p])
      );

      // Group messages by other party
      const convMap = new Map<string, { messages: DbMessage[]; unread: number }>();
      for (const msg of messages as DbMessage[]) {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!convMap.has(otherId)) convMap.set(otherId, { messages: [], unread: 0 });
        const conv = convMap.get(otherId)!;
        conv.messages.push(msg);
        if (!msg.is_read && msg.recipient_id === user.id) conv.unread++;
      }

      // Build Conversation objects (messages already sorted desc, latest first = preview)
      const convList: Conversation[] = Array.from(convMap.entries()).map(([otherId, { messages: msgs, unread }]) => {
        const profile = profileMap.get(otherId);
        const name = profile?.full_name ?? profile?.email ?? 'Unknown';
        const latest = msgs[0]; // desc order so first is latest

        return {
          id: otherId,
          counterparty: name,
          counterparty_type: (profile?.user_type === 'customer' ? 'buyer' : 'vendor') as 'vendor' | 'buyer',
          engagement: latest.subject ?? '',
          avatar_initials: getInitials(name),
          avatar_color: getAvatarColor(otherId),
          preview: latest.content.slice(0, 80),
          timestamp: timeAgo(latest.created_at),
          lastMessageAt: latest.created_at,
          unread,
          messages: [], // loaded on demand
        };
      });

      setConversations(convList);

      // If no activeId, pick first
      setActiveId(prev => {
        if (prev && convList.find(c => c.id === prev)) return prev;
        return convList[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a specific conversation (both parties, asc order)
  const fetchConversationMessages = useCallback(async (otherId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, is_read, created_at')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) return;

    const uiMessages: UiMessage[] = (data as DbMessage[]).map(m => {
      const isMe = m.sender_id === user.id;
      const isUrl = /^https?:\/\//.test(m.content.trim());
      const showWarning = !isMe ? false : detectOffPlatformContact(m.content);
      return {
        id: m.id,
        sender: isMe ? 'me' : 'them',
        text: m.content,
        time: m.created_at,
        type: isUrl ? 'url' : 'text',
        warning: showWarning,
      };
    });

    setConversations(prev =>
      prev.map(c => c.id === otherId ? { ...c, messages: uiMessages } : c)
    );

    // Mark unread messages as read
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', otherId)
      .eq('is_read', false);

    // Clear unread count locally
    setConversations(prev =>
      prev.map(c => c.id === otherId ? { ...c, unread: 0 } : c)
    );
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeId) fetchConversationMessages(activeId);
  }, [activeId, fetchConversationMessages]);

  // Poll every 30s: conversation list previews/unread counts, and the open thread.
  useEffect(() => {
    const t = setInterval(() => {
      fetchConversations();
      if (activeId) fetchConversationMessages(activeId);
    }, 30000);
    return () => clearInterval(t);
  }, [fetchConversations, fetchConversationMessages, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConversation?.messages.length]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || !activeId || sending) return;
    if (activeConversation && isIdleReadOnly(activeConversation.lastMessageAt)) return;

    setSending(true);
    const isUrl = /^https?:\/\//.test(text);
    const showWarning = detectOffPlatformContact(text);
    const now = new Date().toISOString();

    const optimisticMsg: UiMessage = {
      id: `opt-${Date.now()}`,
      sender: 'me',
      text,
      time: now,
      type: isUrl ? 'url' : 'text',
      warning: showWarning,
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, optimisticMsg], preview: text, timestamp: 'just now' }
          : c
      )
    );
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: activeId,
          content: text,
          subject: null,
          is_read: false,
          created_at: now,
          // Admin sees this flag; the message still delivers.
          flagged_off_platform: showWarning,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Replace optimistic message with real id
      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === optimisticMsg.id ? { ...m, id: data.id } : m
                ),
              }
            : c
        )
      );
    } catch {
      // Remove optimistic message on failure
      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? { ...c, messages: c.messages.filter(m => m.id !== optimisticMsg.id) }
            : c
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * 4 + 20;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  };

  const filteredConversations = conversations.filter(c =>
    c.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.engagement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group messages by date for separators
  const renderMessages = () => {
    if (!activeConversation) return null;
    const messages = activeConversation.messages;
    const rendered: React.ReactNode[] = [];
    let lastDate = '';

    messages.forEach(msg => {
      const dateKey = getDateKey(msg.time);
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        rendered.push(
          <div key={`sep-${dateKey}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateSeparator(msg.time)}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        );
      }

      const isMe = msg.sender === 'me';

      rendered.push(
        <div key={msg.id}>
          {msg.warning && (
            <div className="flex justify-end mb-1">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 flex gap-2 items-start max-w-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{OFF_PLATFORM_WARNING} This notice has been logged for admin visibility.</span>
              </div>
            </div>
          )}
          <div className={`flex items-end gap-1 mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {!isMe && activeConversation && (
              <div className={`w-7 h-7 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mb-0.5 ${activeConversation.avatar_color}`}>
                {activeConversation.avatar_initials}
              </div>
            )}
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {msg.type === 'url' ? (
                <div className={`rounded-2xl ${isMe ? 'rounded-br-sm bg-[#0070F3]' : 'rounded-bl-sm bg-white border shadow-sm'} px-4 py-2.5 max-w-xs`}>
                  <a
                    href={msg.text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm underline ${isMe ? 'text-blue-100' : 'text-[#0070F3]'}`}
                  >
                    {msg.text}
                  </a>
                </div>
              ) : (
                <div className={`rounded-2xl ${isMe ? 'rounded-br-sm bg-[#0070F3] text-white' : 'rounded-bl-sm bg-white text-gray-900 border shadow-sm'} px-4 py-2.5 max-w-xs`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              )}
              <span className="text-[10px] text-gray-400 mx-2 mt-1">{formatTime(msg.time)}</span>
            </div>
          </div>
        </div>
      );
    });

    return rendered;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left panel */}
      <div className="w-72 flex flex-col border-r border-gray-200 bg-white flex-shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0070F3]/30"
          />
        </div>

        {/* Conversation list */}
        <div className="overflow-y-auto flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No conversations yet</div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 flex items-start gap-3 ${conv.id === activeId ? 'bg-blue-50' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full text-white text-sm flex items-center justify-center flex-shrink-0 font-medium ${conv.avatar_color}`}>
                  {conv.avatar_initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">{conv.counterparty}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{conv.timestamp}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{conv.engagement}</div>
                  <div className="flex items-center justify-between mt-0.5 gap-1">
                    <span className="text-xs text-gray-500 truncate max-w-[160px]">{conv.preview}</span>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 bg-[#0070F3] text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
            <div className={`w-10 h-10 rounded-full text-white text-sm flex items-center justify-center flex-shrink-0 font-medium ${activeConversation.avatar_color}`}>
              {activeConversation.avatar_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">{activeConversation.counterparty}</div>
              <div className="text-xs text-gray-500">{activeConversation.engagement}</div>
            </div>
            <a
              href="#"
              className="text-sm text-[#0070F3] hover:underline flex-shrink-0"
            >
              {activeConversation.counterparty_type === 'vendor' ? 'View Contract' : 'View Profile'}
            </a>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
            {activeConversation.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No messages yet — say hello!</div>
            ) : (
              renderMessages()
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          {isIdleReadOnly(activeConversation.lastMessageAt) ? (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500 flex items-center gap-2 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              This thread has been inactive for over 90 days and is now read-only.
            </div>
          ) : (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3 items-end flex-shrink-0">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="flex-1 resize-none bg-gray-100 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0070F3]/30 focus:border-[#0070F3]/40"
                style={{ minHeight: '42px', maxHeight: '100px' }}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 pb-2"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className="bg-[#0070F3] text-white w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No conversations yet
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
