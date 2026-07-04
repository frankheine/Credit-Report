import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CopilotChat({ isOpen, onClose }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'I am the DATAcartel AI Specialist. I have deep authorization and statutory leverage to assist in disputing negative credit marks. What discrepancies are we attacking today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.concat(userMessage) 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with Copilot.');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Copilot Chat Sidebar */}
      <div 
        className={`fixed top-0 right-0 z-50 w-full sm:w-[450px] h-full bg-[#0a0a0a] border-l border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-neutral-800 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-wide">DATAcartel Copilot</span>
              <span className="text-[10px] text-neutral-400 font-mono">ABLITERATED SPECIALIST ASSISTANT</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-neutral-200 text-black rounded-tr-sm font-medium' 
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-xs font-mono">Analyzing credit repair statutes...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-950/50 border border-red-900/50 text-red-200 text-xs p-4 rounded-xl">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-neutral-800 bg-neutral-900/30">
          <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-xl p-2 focus-within:border-neutral-600 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about fixing discrepancies..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-white text-black p-3 rounded-lg disabled:opacity-50 hover:bg-neutral-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
