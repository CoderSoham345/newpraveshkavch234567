import React, { useState, useEffect, useRef } from 'react';
import { 
  Send as TelegramIcon, 
  X, 
  Send, 
  User, 
  Shield, 
  RefreshCw, 
  MessageSquare,
  CheckCheck,
  Building,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'resident' | 'guard' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  visitorId?: string;
}

interface TelegramGuardChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChatId?: string;
}

export const TelegramGuardChatModal: React.FC<TelegramGuardChatModalProps> = ({
  isOpen,
  onClose,
  defaultChatId = '8612476614',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/telegram/messages');
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.warn('Failed fetching telegram messages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();

      // Setup Server-Sent Events listener for real-time updates
      const eventSource = new EventSource('/api/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'telegram_chat_message' && payload.data) {
            setMessages((prev) => [...prev, payload.data]);
          }
        } catch (err) {
          // Ignore SSE parse error
        }
      };

      return () => {
        eventSource.close();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetch('/api/telegram/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: defaultChatId,
          text: messageText,
          guardName: 'Security Officer Suresh',
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error('Error sending telegram message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <TelegramIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Resident Telegram Live Chat</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  Connected
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct two-way messaging between Gate 01 Security & Resident
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Chat"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              id="btn-close-telegram-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 text-[11px] text-cyan-300/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connected Telegram Chat ID: <strong className="font-mono text-white">{defaultChatId}</strong></span>
          </div>
          <span className="text-slate-400 hidden sm:inline">Replies are delivered to Telegram instantly</span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">No Telegram Messages Yet</p>
              <p className="text-xs max-w-sm">
                When a resident messages the PraveshKavach™ Telegram Bot, their message will appear here in real time.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isGuard = msg.sender === 'guard';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isGuard ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-md ${
                      isGuard
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none border border-cyan-400/30'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                      <span>{isGuard ? 'Sent to Telegram' : 'Received via Telegram'}</span>
                      <CheckCheck className="w-3 h-3 text-cyan-200" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message to send directly to Resident's Telegram..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            id="input-telegram-guard-chat"
          />

          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            id="btn-send-telegram-guard-chat"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send to Telegram</span>
          </button>
        </form>

      </div>
    </div>
  );
};
