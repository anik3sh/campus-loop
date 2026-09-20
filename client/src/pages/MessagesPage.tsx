import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, Package } from 'lucide-react';
import { messagesAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  const loadConversations = async () => {
    try {
      const { data } = await messagesAPI.getConversations();
      setConversations(data.conversations || []);
    } catch {}
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data } = await messagesAPI.getMessages(convId);
      setMessages(data.messages || []);
      setActiveConv(data.conversation);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    loadConversations().then(() => {
      if (conversationId) {
        loadMessages(conversationId);
      }
    }).finally(() => setLoading(false));

    // Poll for new messages
    pollRef.current = setInterval(() => {
      loadConversations();
      if (conversationId) loadMessages(conversationId);
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [user, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      const { data } = await messagesAPI.sendMessage(conversationId, content);
      setMessages(prev => [...prev, data.message]);
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <Link to="/login" className="text-[#6b7c5e] hover:underline">Sign in to view messages</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 py-0 sm:py-8">
        <div className="bg-white border border-[#e8e4de] rounded-none sm:rounded-2xl overflow-hidden flex" style={{ height: 'calc(100vh - 8rem)' }}>
          {/* Conversation list */}
          <div className={`w-full sm:w-80 border-r border-[#e8e4de] flex-shrink-0 flex flex-col ${conversationId ? 'hidden sm:flex' : 'flex'}`}>
            <div className="px-4 py-4 border-b border-[#e8e4de]">
              <h2 className="font-serif text-lg font-semibold text-[#1a1a1a]">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-[#f3f0eb] rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-[#f3f0eb] rounded w-2/3" />
                        <div className="h-2.5 bg-[#f3f0eb] rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#8a8a8a]">No conversations yet</p>
                  <Link to="/marketplace" className="text-xs text-[#6b7c5e] hover:underline mt-1 block">Browse listings to start a chat</Link>
                </div>
              ) : (
                conversations.map(conv => (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    onClick={() => loadMessages(conv.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#f3f0eb] transition-colors ${
                      conv.id === conversationId ? 'bg-[#f3f0eb]' : 'hover:bg-[#faf8f5]'
                    }`}
                  >
                    <div className="w-10 h-10 bg-[#6b7c5e] rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {conv.other_user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{conv.other_user?.name}</p>
                        {conv.my_unread > 0 && (
                          <span className="w-4 h-4 bg-[#6b7c5e] text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 ml-1">{conv.my_unread}</span>
                        )}
                      </div>
                      {conv.listing_title && (
                        <p className="text-xs text-[#6b7c5e] truncate">{conv.listing_title}</p>
                      )}
                      {conv.last_message && (
                        <p className="text-xs text-[#8a8a8a] truncate">{conv.last_message}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col min-w-0 ${!conversationId ? 'hidden sm:flex' : 'flex'}`}>
            {conversationId ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e8e4de]">
                  <Link to="/messages" className="sm:hidden p-1 text-[#5c5c5c]">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  {activeConv && (
                    <>
                      {activeConv.listing_title && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] truncate">{activeConv.listing_title}</p>
                          <p className="text-xs text-[#8a8a8a]">₹{activeConv.listing_price?.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs sm:max-w-sm ${isMe ? 'order-2' : ''}`}>
                          {!isMe && (
                            <p className="text-xs text-[#8a8a8a] mb-1">{msg.sender_name}</p>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#6b7c5e] text-white rounded-br-sm'
                              : 'bg-[#f3f0eb] text-[#1a1a1a] rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <p className="text-xs text-[#c4c0bc] mt-1">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-[#e8e4de] px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-[#f3f0eb] border border-[#e8e4de] rounded-xl text-sm focus:outline-none focus:border-[#6b7c5e]"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="p-2.5 bg-[#6b7c5e] text-white rounded-xl hover:bg-[#4a5c40] disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-3">
                <Package className="w-12 h-12 text-[#e8e4de]" />
                <p className="text-sm text-[#8a8a8a]">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
