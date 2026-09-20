import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, ArrowRight } from 'lucide-react';
import { aiAPI } from '../../api';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  listings?: any[];
}

const SUGGESTED_QUERIES = [
  'Find me a calculator under ₹700',
  'What laptops are available?',
  'I need cheap engineering books',
  'Show me hostel essentials',
];

export default function LoopAI({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Loop AI 👋 I can help you find the best deals on Campus Loop. What are you looking for?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (query?: string) => {
    const msg = query || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await aiAPI.chat(msg, history);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        listings: data.listings,
      }]);
    } catch (err: any) {
      const isNotConfigured = err.response?.data?.fallback;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isNotConfigured
          ? '⚠️ Loop AI is not configured yet. Please add your GROQ_API_KEY to the server .env file to enable AI features. In the meantime, you can use the marketplace search directly!'
          : 'Sorry, I\'m having trouble responding right now. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white border border-[#e8e4de] rounded-2xl shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#6b7c5e] text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Loop AI</span>
          <span className="text-xs text-[#c5d4b8]">· Campus Marketplace Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 bg-[#6b7c5e] rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-[#8a8a8a]">Loop AI</span>
                </div>
              )}
              <div className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#6b7c5e] text-white rounded-br-sm'
                  : 'bg-[#f3f0eb] text-[#1a1a1a] rounded-bl-sm'
              }`}>
                {msg.content}
              </div>

              {/* Listing cards from AI */}
              {msg.listings && msg.listings.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.listings.map((l: any) => (
                    <Link
                      key={l.id}
                      to={`/listing/${l.id}`}
                      onClick={onClose}
                      className="flex items-center gap-2.5 bg-white border border-[#e8e4de] rounded-xl p-2.5 hover:border-[#6b7c5e] transition-colors group"
                    >
                      {l.image ? (
                        <img src={l.image} alt={l.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-[#f3f0eb] rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1a1a1a] truncate group-hover:text-[#6b7c5e] transition-colors">{l.title}</p>
                        <p className="text-xs text-[#6b7c5e] font-semibold">₹{l.price?.toLocaleString('en-IN')}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#8a8a8a] flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#f3f0eb] px-3 py-2.5 rounded-xl rounded-bl-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-[#6b7c5e] animate-spin" />
              <span className="text-xs text-[#8a8a8a]">Searching...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested queries */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs bg-[#f3f0eb] text-[#5c5c5c] px-2.5 py-1 rounded-full hover:bg-[#e8e4de] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#e8e4de] px-3 py-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Loop AI..."
            disabled={loading}
            className="flex-1 px-3 py-2 bg-[#f3f0eb] text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6b7c5e] disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="p-2 bg-[#6b7c5e] text-white rounded-lg hover:bg-[#4a5c40] disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
