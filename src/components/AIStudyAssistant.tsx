import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, MessageSquare, Sparkles, Loader2, MinusCircle, Maximize2 } from 'lucide-react';
import { Student } from '../types';
import { getAIAssistantResponse, ChatMessage } from '../services/aiAssistantService';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

interface AIStudyAssistantProps {
  student: Student;
}

export default function AIStudyAssistant({ student }: AIStudyAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await getAIAssistantResponse(inputValue, messages, student);
      setMessages([...newMessages, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
        }}
        className={cn(
          "fixed bottom-6 left-6 z-50 p-4 rounded-full bg-neon-blue text-deep-space shadow-[0_0_30px_rgba(0,229,255,0.4)] border-2 border-deep-space transition-all group",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Bot size={24} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full border-2 border-deep-space animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '500px',
              width: isMinimized ? '300px' : '380px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={cn(
              "fixed bottom-6 left-6 z-50 glass-card overflow-hidden flex flex-col border-neon-blue/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
              isMinimized ? "rounded-2xl" : "rounded-3xl"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-neon-blue/10 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                  <Bot size={18} className="text-neon-blue" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest uppercase">روبوت المساعدة</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-[10px] text-white/40 uppercase font-mono">متصل</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/5 rounded-md text-white/40 hover:text-white"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <MinusCircle size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-md text-white/40 hover:text-neon-red"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-right scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                      <Sparkles size={40} className="text-neon-blue mb-2" />
                      <p className="text-xs font-medium">أهلاً بك! أنا مساعدك الدراسي الذكي. كيف يمكنني مساعدتك اليوم في البرمجة أو الذكاء الاصطناعي؟</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.role === 'user' ? "mr-auto items-start" : "ml-auto items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-sm leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-bl-none" 
                            : "bg-white/5 text-white/90 border border-white/10 rounded-br-none"
                        )}
                      >
                        <div className="markdown-body">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-tighter text-white/20 mt-1">
                        {msg.role === 'user' ? 'أنت' : 'الروبوت'}
                      </span>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex flex-col items-end max-w-[85%] ml-auto">
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-br-none flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-neon-blue" />
                        <span className="text-xs italic text-white/40">جاري المعالجة...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <button 
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className="p-3 bg-neon-blue text-deep-space rounded-xl hover:bg-neon-blue/80 disabled:opacity-50 disabled:hover:bg-neon-blue transition-colors"
                    >
                      <Send size={18} />
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="اسألني أي شيء..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon-blue transition-colors text-right"
                      dir="rtl"
                    />
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
