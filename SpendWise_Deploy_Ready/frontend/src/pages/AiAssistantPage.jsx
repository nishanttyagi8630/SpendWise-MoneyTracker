// AI Assistant Page
// Financial questions powered by backend OpenAI integration with a built-in smart fallback engine.

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Lightbulb, 
  CheckCircle, 
  Info,
  KeyRound
} from 'lucide-react';
import { aiApi } from '../services/api';

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm **SpendWise AI**, your personal financial assistant. 
I have access to your current spending summaries, budgets, and savings goals so I can give you personalized, practical advice.

Try asking me a question below or click one of the suggested prompts!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyActive, setApiKeyActive] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'How does the 50/30/20 rule apply to my income?',
    'Analyze my current spending habits',
    'Where can I cut expenses this month?',
    'How do I build an emergency fund?',
  ];

  const handleSendMessage = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: textToSend.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send chat history for context
      const historyPayload = newMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiApi.chat(textToSend.trim(), historyPayload);
      if (res.success && res.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
        if (res.apiKeyConfigured !== undefined) {
          setApiKeyActive(res.apiKeyConfigured);
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your question. Please make sure the backend server is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span>SpendWise Financial Advisor</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {apiKeyActive ? 'OpenAI Live' : 'Smart Advisor'}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Personalized budgeting strategies based on your database records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
          <span>API Key secured in backend .env</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-500 text-white rounded-tr-none shadow-md shadow-emerald-500/15'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-color)]'
                }`}
              >
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-[var(--bg-card-subtle)] border border-[var(--border-color)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-300" />
                <span className="text-xs text-[var(--text-secondary)] ml-2">Analyzing your financial records...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Suggestions:</span>
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] whitespace-nowrap transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about budgeting, savings, or reducing expenses..."
          className="w-full pl-4 pr-14 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm resize-none"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
