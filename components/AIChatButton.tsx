import React, { useState, useRef, useEffect } from 'react';
import { getDiveAdvice } from '../services/geminiService';

export const AIChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'user'|'ai', text: string}[]>([
    {sender: 'ai', text: '안녕하세요! 다이빙에 대해 궁금한 점이 있으신가요? 안전 수칙, 장비, 생물 등 무엇이든 물어보세요!'}
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, {sender: 'user', text: userMsg}]);
    setInput('');
    setIsLoading(true);

    const answer = await getDiveAdvice(userMsg);
    setMessages(prev => [...prev, {sender: 'ai', text: answer}]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-ocean-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-ocean-700 transition-all z-40 hover:scale-110"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40 overflow-hidden animate-float">
          <div className="bg-ocean-600 text-white p-4 flex items-center">
            <span className="mr-2">🤖</span>
            <h3 className="font-bold">Ocean AI Buddy</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-ocean-500 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white p-3 rounded-lg border border-gray-200 rounded-tl-none shadow-sm">
                   <div className="flex space-x-1">
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                   </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="다이빙에 대해 물어보세요..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ocean-400"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-ocean-600 text-white p-2 rounded-full hover:bg-ocean-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};