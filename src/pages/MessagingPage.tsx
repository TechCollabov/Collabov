import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Paperclip, AlertTriangle, Search, X, Users, MessageSquarePlus, User as UserIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { detectOffPlatformContact, OFF_PLATFORM_WARNING } from '../lib/workflows';

// TODO: Replace with Supabase realtime subscription. For MVP, poll Supabase messages table every 30s using setInterval in useEffect.

interface DbMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  conversation_id: string | null;
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
  senderName?: string;
  text: string;
  time: string;
  type: 'text' | 'url';
  warning?: boolean;
}

interface ProfileLite {
  id: string;
  full_name: string | null;
  email: string | null;
  user_type: string | null;
}

interface Conversation {
  id: string; // other party's profile id for 1:1, or conversation uuid for groups
  isGroup: boolean;
  conversationId?: string; // set for group conversations
  counterparty: string;
  counterparty_type: 'vendor' | 'buyer';
  engagement: string;
  avatar_initials: string;
  avatar_color: string;
  preview: string;
  timestamp: string;
  lastMessageAt: string;
  unread: number;
  isRequest: boolean;
  messages: UiMessage[];
  participantIds?: string[];
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

function formatListDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

interface MessagingPageProps {
  initialConversationId?: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ initialConversationId }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // New message modal state
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<ProfileLite[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<ProfileLite[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchingRecipients, setSearchingRecipients] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeId) ?? null;

  // Fetch all conversations (1:1 + group) for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // --- 1:1 messages ---
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, conversation_id, content, is_read, created_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const directMessages = (messages ?? []).filter(
        (m: DbMessage) => !m.conversation_id
      ) as DbMessage[];

      const otherPartyIds = Array.from(
        new Set(directMessages.map(m => (m.sender_id === user.id ? m.recipient_id : m.sender_id)))
      ).filter((id): id is string => !!id);

      const { data: profiles } = otherPartyIds.length
        ? await supabase.from('profiles').select('id, full_name, email, user_type').in('id', otherPartyIds)
        : { data: [] as ProfileLite[] };

      const profileMap = new Map((profiles ?? []).map((p: ProfileLite) => [p.id, p]));

      // Determine known connections via engagements table (batch query)
      const { data: engagementRows } = otherPartyIds.length
        ? await supabase
            .from('engagements')
            .select('buyer_id, vendor_id')
            .or(
              `and(buyer_id.eq.${user.id},vendor_id.in.(${otherPartyIds.join(',')})),and(vendor_id.eq.${user.id},buyer_id.in.(${otherPartyIds.join(',')}))`
            )
        : { data: [] as { buyer_id: string; vendor_id: string }[] };

      const knownConnections = new Set<string>();
      (engagementRows ?? []).forEach((row: { buyer_id: string; vendor_id: string }) => {
        knownConnections.add(row.buyer_id === user.id ? row.vendor_id : row.buyer_id);
      });

      const convMap = new Map<string, { messages: DbMessage[]; unread: number; iInitiated: boolean }>();
      for (const msg of directMessages) {
        const otherId = msg.sender_id === user.id ? msg.recipient_id! : msg.sender_id;
        if (!convMap.has(otherId)) convMap.set(otherId, { messages: [], unread: 0, iInitiated: false });
        const conv = convMap.get(otherId)!;
        conv.messages.push(msg);
        if (!msg.is_read && msg.recipient_id === user.id) conv.unread++;
      }
      // Determine who initiated (earliest message in each thread)
      convMap.forEach(conv => {
        const earliest = conv.messages[conv.messages.length - 1]; // asc via desc-list, last = earliest
        conv.iInitiated = earliest?.sender_id === user.id;
      });

      const directConvList: Conversation[] = Array.from(convMap.entries()).map(([otherId, { messages: msgs, unread, iInitiated }]) => {
        const profile = profileMap.get(otherId);
        const name = profile?.full_name ?? profile?.email ?? 'Unknown';
        const latest = msgs[0];
        const isKnown = knownConnections.has(otherId);
        const isRequest = !isKnown && !iInitiated;

        return {
          id: otherId,
          isGroup: false,
          counterparty: name,
          counterparty_type: (profile?.user_type === 'buyer' ? 'buyer' : 'vendor') as 'vendor' | 'buyer',
          engagement: latest.subject ?? '',
          avatar_initials: getInitials(name),
          avatar_color: getAvatarColor(otherId),
          preview: latest.content.slice(0, 80),
          timestamp: formatListDate(latest.created_at),
          lastMessageAt: latest.created_at,
          unread,
          isRequest,
          messages: [],
        };
      });

      // --- group conversations ---
      const { data: myParticipantRows } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      const groupConvIds = (myParticipantRows ?? []).map((r: { conversation_id: string }) => r.conversation_id);
      let groupConvList: Conversation[] = [];

      if (groupConvIds.length > 0) {
        const { data: convRows } = await supabase
          .from('conversations')
          .select('id, is_group, name, created_by')
          .in('id', groupConvIds)
          .eq('is_group', true);

        const groupIds = (convRows ?? []).map((c: { id: string }) => c.id);

        if (groupIds.length > 0) {
          const { data: allParticipants } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .in('conversation_id', groupIds);

          const { data: groupMessages } = await supabase
            .from('messages')
            .select('id, sender_id, recipient_id, conversation_id, content, is_read, created_at')
            .in('conversation_id', groupIds)
            .order('created_at', { ascending: false });

          const participantIdsByConv = new Map<string, string[]>();
          (allParticipants ?? []).forEach((p: { conversation_id: string; user_id: string }) => {
            if (!participantIdsByConv.has(p.conversation_id)) participantIdsByConv.set(p.conversation_id, []);
            participantIdsByConv.get(p.conversation_id)!.push(p.user_id);
          });

          const lastReadByConv = new Map(
            (myParticipantRows ?? []).map((r: { conversation_id: string; last_read_at: string | null }) => [r.conversation_id, r.last_read_at])
          );

          const allParticipantProfileIds = Array.from(
            new Set((allParticipants ?? []).map((p: { user_id: string }) => p.user_id))
          );
          const { data: participantProfiles } = allParticipantProfileIds.length
            ? await supabase.from('profiles').select('id, full_name, email, user_type').in('id', allParticipantProfileIds)
            : { data: [] as ProfileLite[] };
          const participantProfileMap = new Map((participantProfiles ?? []).map((p: ProfileLite) => [p.id, p]));

          groupConvList = (convRows ?? []).map((c: { id: string; is_group: boolean; name: string | null; created_by: string | null }) => {
            const msgsForConv = (groupMessages ?? []).filter((m: DbMessage) => m.conversation_id === c.id) as DbMessage[];
            const latest = msgsForConv[0];
            const lastRead = lastReadByConv.get(c.id);
            const unread = msgsForConv.filter(m => m.sender_id !== user.id && (!lastRead || new Date(m.created_at) > new Date(lastRead))).length;
            const otherParticipantIds = (participantIdsByConv.get(c.id) ?? []).filter(id => id !== user.id);
            const displayName = c.name || otherParticipantIds
              .map(id => participantProfileMap.get(id)?.full_name ?? participantProfileMap.get(id)?.email ?? 'Member')
              .slice(0, 3)
              .join(', ') || 'Group chat';

            return {
              id: c.id,
              isGroup: true,
              conversationId: c.id,
              counterparty: displayName,
              counterparty_type: 'vendor' as const,
              engagement: `${(participantIdsByConv.get(c.id) ?? []).length} members`,
              avatar_initials: getInitials(displayName),
              avatar_color: getAvatarColor(c.id),
              preview: latest ? latest.content.slice(0, 80) : 'No messages yet',
              timestamp: latest ? formatListDate(latest.created_at) : formatListDate(new Date().toISOString()),
              lastMessageAt: latest ? latest.created_at : new Date().toISOString(),
              unread,
              isRequest: false,
              messages: [],
              participantIds: participantIdsByConv.get(c.id) ?? [],
            };
          });
        }
      }

      const combined = [...directConvList, ...groupConvList].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      setConversations(prev => {
        // preserve loaded messages for the currently active conversation
        return combined.map(c => {
          const existing = prev.find(p => p.id === c.id);
          return existing && existing.messages.length > 0 ? { ...c, messages: existing.messages } : c;
        });
      });

      setActiveId(prev => {
        if (prev && combined.find(c => c.id === prev)) return prev;
        return combined[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a specific conversation (1:1 or group)
  const fetchConversationMessages = useCallback(async (conv: Conversation) => {
    if (!user) return;

    if (conv.isGroup && conv.conversationId) {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, conversation_id, content, is_read, created_at')
        .eq('conversation_id', conv.conversationId)
        .order('created_at', { ascending: true });

      if (error) return;

      const senderIds = Array.from(new Set((data ?? []).map((m: DbMessage) => m.sender_id)));
      const { data: senderProfiles } = senderIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', senderIds)
        : { data: [] as ProfileLite[] };
      const senderMap = new Map((senderProfiles ?? []).map((p: ProfileLite) => [p.id, p.full_name ?? p.email ?? 'Member']));

      const uiMessages: UiMessage[] = (data as DbMessage[]).map(m => {
        const isMe = m.sender_id === user.id;
        const isUrl = /^https?:\/\//.test(m.content.trim());
        return {
          id: m.id,
          sender: isMe ? 'me' : 'them',
          senderName: isMe ? undefined : senderMap.get(m.sender_id),
          text: m.content,
          time: m.created_at,
          type: isUrl ? 'url' : 'text',
          warning: false,
        };
      });

      setConversations(prev => prev.map(c => (c.id === conv.id ? { ...c, messages: uiMessages, unread: 0 } : c)));

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conv.conversationId)
        .eq('user_id', user.id);

      return;
    }

    const otherId = conv.id;
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, conversation_id, content, is_read, created_at')
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
      prev.map(c => (c.id === otherId ? { ...c, messages: uiMessages } : c))
    );

    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', otherId)
      .eq('is_read', false);

    setConversations(prev =>
      prev.map(c => (c.id === otherId ? { ...c, unread: 0 } : c))
    );
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversation) fetchConversationMessages(activeConversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Poll every 30s: conversation list previews/unread counts, and the open thread.
  useEffect(() => {
    const t = setInterval(() => {
      fetchConversations();
      if (activeConversation) fetchConversationMessages(activeConversation);
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchConversations, fetchConversationMessages, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConversation?.messages.length]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || !activeConversation || sending) return;
    if (!activeConversation.isGroup && isIdleReadOnly(activeConversation.lastMessageAt)) return;

    setSending(true);
    const isUrl = /^https?:\/\//.test(text);
    const showWarning = !activeConversation.isGroup && detectOffPlatformContact(text);
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
          ? { ...c, messages: [...c.messages, optimisticMsg], preview: text, timestamp: formatListDate(now), lastMessageAt: now }
          : c
      )
    );
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const insertPayload: Record<string, unknown> = {
        sender_id: user.id,
        content: text,
        subject: null,
        is_read: false,
        created_at: now,
      };

      if (activeConversation.isGroup && activeConversation.conversationId) {
        insertPayload.conversation_id = activeConversation.conversationId;
        insertPayload.recipient_id = null;
      } else {
        insertPayload.recipient_id = activeConversation.id;
        insertPayload.flagged_off_platform = showWarning;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) throw error;

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

  // --- Tab classification & counts ---
  const messagesTabConvs = useMemo(() => conversations.filter(c => !c.isRequest), [conversations]);
  const requestsTabConvs = useMemo(() => conversations.filter(c => c.isRequest), [conversations]);

  const messagesUnread = useMemo(() => messagesTabConvs.reduce((sum, c) => sum + c.unread, 0), [messagesTabConvs]);
  const requestsUnread = useMemo(() => requestsTabConvs.reduce((sum, c) => sum + c.unread, 0), [requestsTabConvs]);

  const tabConversations = activeTab === 'messages' ? messagesTabConvs : requestsTabConvs;

  const filteredConversations = tabConversations.filter(c =>
    c.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.engagement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ensure activeId stays valid within the active tab; otherwise fall back
  useEffect(() => {
    if (!tabConversations.length) return;
    if (!tabConversations.find(c => c.id === activeId)) {
      setActiveId(tabConversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- New message modal ---
  const openNewMessage = () => {
    setShowNewMessage(true);
    setRecipientQuery('');
    setRecipientResults([]);
    setSelectedRecipients([]);
    setGroupName('');
  };

  const closeNewMessage = () => {
    setShowNewMessage(false);
  };

  useEffect(() => {
    if (!showNewMessage) return;
    const q = recipientQuery.trim();
    if (!q) {
      setRecipientResults([]);
      return;
    }
    let cancelled = false;
    setSearchingRecipients(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, user_type')
        .ilike('full_name', `%${q}%`)
        .neq('id', user?.id ?? '')
        .limit(20);
      if (!cancelled) {
        setRecipientResults((data ?? []) as ProfileLite[]);
        setSearchingRecipients(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [recipientQuery, showNewMessage, user]);

  const toggleRecipient = (p: ProfileLite) => {
    setSelectedRecipients(prev =>
      prev.find(r => r.id === p.id) ? prev.filter(r => r.id !== p.id) : [...prev, p]
    );
  };

  const handleStartConversation = async () => {
    if (!user || selectedRecipients.length === 0 || creatingConversation) return;
    setCreatingConversation(true);

    try {
      if (selectedRecipients.length === 1) {
        // 1:1 — no conversation row needed, just open/create the thread on first send
        const other = selectedRecipients[0];
        const name = other.full_name ?? other.email ?? 'Unknown';

        setConversations(prev => {
          if (prev.find(c => c.id === other.id)) return prev;
          const newConv: Conversation = {
            id: other.id,
            isGroup: false,
            counterparty: name,
            counterparty_type: (other.user_type === 'buyer' ? 'buyer' : 'vendor'),
            engagement: '',
            avatar_initials: getInitials(name),
            avatar_color: getAvatarColor(other.id),
            preview: '',
            timestamp: formatListDate(new Date().toISOString()),
            lastMessageAt: new Date().toISOString(),
            unread: 0,
            isRequest: false,
            messages: [],
          };
          return [newConv, ...prev];
        });
        setActiveTab('messages');
        setActiveId(other.id);
      } else {
        // Group chat
        const { data: convRow, error: convError } = await supabase
          .from('conversations')
          .insert({ is_group: true, name: groupName.trim() || null, created_by: user.id })
          .select('id')
          .single();

        if (convError) throw convError;

        const participantRows = [user.id, ...selectedRecipients.map(r => r.id)].map(uid => ({
          conversation_id: convRow.id,
          user_id: uid,
        }));

        const { error: partError } = await supabase.from('conversation_participants').insert(participantRows);
        if (partError) throw partError;

        const displayName = groupName.trim() || selectedRecipients.map(r => r.full_name ?? r.email ?? 'Member').join(', ');

        const newConv: Conversation = {
          id: convRow.id,
          isGroup: true,
          conversationId: convRow.id,
          counterparty: displayName,
          counterparty_type: 'vendor',
          engagement: `${selectedRecipients.length + 1} members`,
          avatar_initials: getInitials(displayName),
          avatar_color: getAvatarColor(convRow.id),
          preview: 'No messages yet',
          timestamp: formatListDate(new Date().toISOString()),
          lastMessageAt: new Date().toISOString(),
          unread: 0,
          isRequest: false,
          messages: [],
          participantIds: [user.id, ...selectedRecipients.map(r => r.id)],
        };

        setConversations(prev => [newConv, ...prev]);
        setActiveTab('messages');
        setActiveId(convRow.id);
      }

      closeNewMessage();
    } catch (e) {
      console.error('Failed to start conversation', e);
    } finally {
      setCreatingConversation(false);
    }
  };

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
              <div className={`w-7 h-7 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mb-0.5 ${activeConversation.isGroup ? getAvatarColor(msg.id) : activeConversation.avatar_color}`}>
                {activeConversation.isGroup ? getInitials(msg.senderName ?? '?') : activeConversation.avatar_initials}
              </div>
            )}
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && activeConversation.isGroup && msg.senderName && (
                <span className="text-[10px] text-gray-400 mx-2 mb-0.5">{msg.senderName}</span>
              )}
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
      <div className="w-96 flex flex-col border-r border-gray-200 bg-white flex-shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
          <button
            type="button"
            onClick={openNewMessage}
            className="flex items-center gap-1.5 bg-[#0070F3] hover:bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Message
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'messages' ? 'bg-[#0070F3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Messages
            {messagesUnread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                {messagesUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'requests' ? 'bg-[#0070F3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Message Requests
            {requestsUnread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                {requestsUnread}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0070F3]/30"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="overflow-y-auto flex-1 border-t border-gray-100">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              {activeTab === 'requests' ? 'No message requests' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 flex items-start gap-3 ${conv.id === activeId ? 'bg-blue-50' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${conv.isGroup ? 'bg-blue-100' : 'bg-blue-50'}`}>
                  {conv.isGroup ? (
                    <Users className="h-5 w-5 text-[#0070F3]" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-[#0070F3]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">{conv.counterparty}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 gap-1">
                    <span className="text-xs text-gray-500 truncate">{conv.engagement || conv.preview}</span>
                    {conv.unread > 0 && (
                      <span className={`w-5 h-5 text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0 font-medium ${activeTab === 'requests' ? 'bg-amber-500' : 'bg-[#0070F3]'}`}>
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
              {activeConversation.isGroup ? <Users className="h-5 w-5" /> : activeConversation.avatar_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">{activeConversation.counterparty}</div>
              <div className="text-xs text-gray-500">{activeConversation.engagement}</div>
            </div>
            {!activeConversation.isGroup && (
              <a
                href="#"
                className="text-sm text-[#0070F3] hover:underline flex-shrink-0"
              >
                {activeConversation.counterparty_type === 'vendor' ? 'View Contract' : 'View Profile'}
              </a>
            )}
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
          {!activeConversation.isGroup && isIdleReadOnly(activeConversation.lastMessageAt) ? (
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

      {/* New Message modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">New Message</h2>
              <button type="button" onClick={closeNewMessage} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedRecipients.map(r => (
                    <span
                      key={r.id}
                      className="flex items-center gap-1 bg-blue-50 text-[#0070F3] text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {r.full_name ?? r.email}
                      <button type="button" onClick={() => toggleRecipient(r)} className="hover:text-blue-800">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {selectedRecipients.length >= 2 && (
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="w-full mb-3 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0070F3]/30"
                />
              )}

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={recipientQuery}
                  onChange={e => setRecipientQuery(e.target.value)}
                  placeholder="Search people by name..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0070F3]/30"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                {searchingRecipients && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-blue-600" size={18} />
                  </div>
                )}
                {!searchingRecipients && recipientQuery.trim() && recipientResults.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-4">No people found</div>
                )}
                {recipientResults.map(p => {
                  const checked = !!selectedRecipients.find(r => r.id === p.id);
                  const name = p.full_name ?? p.email ?? 'Unknown';
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(p)}
                        className="h-4 w-4 accent-[#0070F3]"
                      />
                      <div className={`w-8 h-8 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 font-medium ${getAvatarColor(p.id)}`}>
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 truncate">{name}</div>
                        <div className="text-xs text-gray-400 truncate">{p.user_type ?? p.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={handleStartConversation}
                disabled={selectedRecipients.length === 0 || creatingConversation}
                className="w-full bg-[#0070F3] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {creatingConversation && <Loader2 className="animate-spin h-4 w-4" />}
                {selectedRecipients.length >= 2 ? 'Create Group Chat' : 'Start Conversation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
