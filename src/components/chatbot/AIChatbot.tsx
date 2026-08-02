import React, { useRef, useEffect } from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import { X, Send, Loader, Lightbulb } from 'lucide-react';

export function AIChatbot() {
  const { messages, isOpen, isLoading, setIsOpen, sendMessage, getSuggestedPrompts, clearHistory } = useChatbot();
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestedPrompts = getSuggestedPrompts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center text-2xl z-40 hover:scale-110 duration-200"
        title="Open AI Assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">AI Assistant</h3>
          <p className="text-cyan-100 text-xs">PraveshKavach™ Help</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="text-white font-semibold mb-2">Welcome to AI Assistant</h4>
            <p className="text-slate-400 text-sm mb-4">
              I can help you with visitor processes, document scanning, system settings, and more.
            </p>
            {suggestedPrompts.length > 0 && (
              <div className="w-full mt-4 space-y-2">
                <p className="text-xs text-slate-400 flex items-center gap-1 justify-center">
                  <Lightbulb className="w-3 h-3" /> Suggested topics:
                </p>
                {suggestedPrompts.slice(0, 2).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="w-full px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded text-left text-slate-300 hover:text-slate-200 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm">
              🤖
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-slate-400 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length > 0 && suggestedPrompts.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700/50 flex gap-2 overflow-x-auto">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSuggestedPrompt(prompt)}
              className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded text-xs text-slate-300 hover:text-slate-200 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-700 p-4 space-y-3">
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="w-full px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 rounded transition"
          >
            Clear History
          </button>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
