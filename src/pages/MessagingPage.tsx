import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, AlertTriangle } from 'lucide-react';

// TODO: Replace with Supabase realtime subscription. For MVP, poll Supabase messages table every 30s using setInterval in useEffect.

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  type: 'text' | 'url';
  warning?: boolean;
}

interface Conversation {
  id: string;
  counterparty: string;
  counterparty_type: 'vendor' | 'buyer';
  engagement: string;
  avatar_initials: string;
  avatar_color: string;
  preview: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    counterparty: 'TechForge Solutions',
    counterparty_type: 'vendor',
    engagement: 'Payment Gateway Rebuild',
    avatar_initials: 'TF',
    avatar_color: 'bg-[#0070F3]',
    preview: 'Milestone 2 evidence has been submitted for your review.',
    timestamp: '2m ago',
    unread: 2,
    messages: [
      { id: 'm1', sender: 'them', text: 'Hi, we have completed the authentication module and submitted evidence for Milestone 1.', time: '2026-06-09 09:00', type: 'text' },
      { id: 'm2', sender: 'me', text: 'Received, reviewing now. Will get back to you within 24 hours.', time: '2026-06-09 10:15', type: 'text' },
      { id: 'm3', sender: 'them', text: 'Milestone 2 evidence has been submitted for your review. The staging URL is attached.', time: '2026-06-09 14:30', type: 'text' },
      { id: 'm4', sender: 'them', text: 'https://staging.paytrace-dev.com', time: '2026-06-09 14:31', type: 'url' },
    ],
  },
  {
    id: '2',
    counterparty: 'CloudNorth MSP',
    counterparty_type: 'vendor',
    engagement: 'Infrastructure Management',
    avatar_initials: 'CN',
    avatar_color: 'bg-[#0E7C6A]',
    preview: 'Monthly check-in is ready for your review.',
    timestamp: '1h ago',
    unread: 0,
    messages: [
      { id: 'm5', sender: 'them', text: 'Your monthly service review is now available. Uptime this month: 99.94%. No critical incidents.', time: '2026-06-09 08:00', type: 'text' },
      { id: 'm6', sender: 'me', text: 'Great month. Happy with the service. Confirming the check-in.', time: '2026-06-09 09:30', type: 'text' },
    ],
  },
  {
    id: '3',
    counterparty: 'Sarah Johnson',
    counterparty_type: 'buyer',
    engagement: 'Pre-engagement',
    avatar_initials: 'SJ',
    avatar_color: 'bg-purple-500',
    preview: 'Could you share more details about your availability for a React project?',
    timestamp: '3h ago',
    unread: 1,
    messages: [
      { id: 'm7', sender: 'them', text: 'Hi, I found your profile on Collabov. Could you share more details about your availability for a React project starting in July?', time: '2026-06-09 11:00', type: 'text' },
    ],
  },
];

function hasOffPlatformContent(text: string): boolean {
  const emailPattern = /@/;
  const phonePattern = /\d{5,}/;
  const sortCodePattern = /\d{2}-\d{2}-\d{2}/;
  return emailPattern.test(text) || phonePattern.test(text) || sortCodePattern.test(text);
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDateKey(dateStr: string): string {
  return dateStr.split(' ')[0];
}

interface MessagingPageProps {
  initialConversationId?: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ initialConversationId }) => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(
    initialConversationId ?? MOCK_CONVERSATIONS[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeId) ?? conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConversation?.messages.length]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, unread: 0 } : c)
    );
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msgId = `msg-${Date.now()}`;
    const isUrl = /^https?:\/\//.test(text);
    const showWarning = hasOffPlatformContent(text);

    const newMessage: Message = {
      id: msgId,
      sender: 'me',
      text,
      time: timeStr,
      type: isUrl ? 'url' : 'text',
      warning: showWarning,
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMessage], preview: text }
          : c
      )
    );
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
    const messages = activeConversation.messages;
    const rendered: React.ReactNode[] = [];
    let lastDate = '';

    messages.forEach((msg, idx) => {
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
                <span>Sharing contact or payment details outside the platform may void your escrow protection and breach platform terms.</span>
              </div>
            </div>
          )}
          <div className={`flex items-end gap-1 mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {!isMe && (
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
              <span className="text-[10px] text-gray-400 mx-2 mt-1">{msg.time.split(' ')[1]}</span>
            </div>
          </div>
        </div>
      );
    });

    return rendered;
  };

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
          {filteredConversations.map(conv => (
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
          ))}
        </div>
      </div>

      {/* Right panel */}
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
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        {/* Input row */}
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
            disabled={!inputText.trim()}
            className="bg-[#0070F3] text-white w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
