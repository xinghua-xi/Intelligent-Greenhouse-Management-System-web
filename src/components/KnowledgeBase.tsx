import React, { useState, useRef, useEffect } from 'react';
import { Search, Bot, Book, ChevronRight, BrainCircuit, Send, Loader2, User } from 'lucide-react';
import { api } from '../api';
import { useArticles } from '../hooks/useApi';

const categoryLabels: Record<string, string> = {
  disease: '病害',
  DISEASE: '病害',
  system: '系统',
  SYSTEM: '系统',
  nutrition: '营养',
  NUTRITION: '营养',
  pest: '虫害',
  PEST: '虫害',
  PLANTING: '种植',
  MANAGEMENT: '管理'
};

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

export const KnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      text: '您好！我是绿智云棚专家系统 AI 助手。您可以向我咨询任何关于种植、病虫害防治、土壤管理等问题。'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 获取文章列表
  const { data: articles, loading: articlesLoading } = useArticles();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMessage]);
    const newHistory = [...chatHistory, { role: 'user', content: query }];
    setQuery('');
    setIsLoading(true);

    try {
      // 调用 AI 问答接口
      const response = await api.chat({
        prompt: query,
        history: newHistory,
        greenhouseId: 'gh_001'
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: response.text
      };

      setMessages(prev => [...prev, aiMessage]);
      setChatHistory([...newHistory, { role: 'assistant', content: response.text }]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: '抱歉，处理您的问题时出现错误。请稍后重试。'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setQuery(question);
    setTimeout(() => handleSearch(), 100);
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="mb-6 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">绿智云棚专家系统</h2>
        <p className="text-slate-400">基于 DeepSeek 大模型的智能农业知识问答</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* AI Chat Interface */}
        <div className="lg:col-span-2 flex flex-col bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-2">
            <BrainCircuit className="text-purple-500 w-5 h-5" />
            <span className="font-semibold text-slate-200">AI 专家问答</span>
            <span className="ml-auto text-xs text-slate-500">DeepSeek 大模型</span>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === 'ai' ? 'bg-purple-600/20' : 'bg-slate-600'
                }`}>
                  {msg.type === 'ai' ? (
                    <Bot className="text-purple-400 w-4 h-4" />
                  ) : (
                    <User className="text-slate-300 w-4 h-4" />
                  )}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.type === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-700/50 text-slate-300 rounded-bl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                  <Bot className="text-purple-400 w-4 h-4" />
                </div>
                <div className="bg-slate-700/50 rounded-2xl rounded-bl-none p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-400">AI 思考中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {['番茄叶子发黄怎么办', '如何防治红蜘蛛', '最佳灌溉时间'].map(q => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  disabled={isLoading}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-900/50 border-t border-slate-700">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="输入您的问题..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!query.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Articles */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-4">
            <span className="text-sm font-bold uppercase">知识库文章</span>
            <Book className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {articlesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-purple-500" />
                <p className="text-sm text-slate-500 mt-2">加载中...</p>
              </div>
            ) : articles && articles.length > 0 ? (
              articles.map(article => (
                <div key={article.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl hover:bg-slate-750 hover:border-slate-600 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      article.category === 'DISEASE' || article.category === 'disease' ? 'bg-red-900/30 text-red-400' :
                      article.category === 'SYSTEM' || article.category === 'system' ? 'bg-blue-900/30 text-blue-400' :
                      article.category === 'PEST' || article.category === 'pest' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-green-900/30 text-green-400'
                    }`}>{categoryLabels[article.category] || article.category}</span>
                    {article.viewCount !== undefined && (
                      <span className="text-xs text-slate-500">{article.viewCount} 次阅读</span>
                    )}
                  </div>
                  <h4 className="text-slate-200 font-medium text-sm mb-2 group-hover:text-purple-400 transition-colors">
                    {article.title}
                  </h4>
                  {article.cropType && (
                    <span className="text-[10px] text-slate-500 mb-1 block">作物: {article.cropType}</span>
                  )}
                  <p className="text-xs text-slate-400 line-clamp-2">{article.summary || '暂无摘要'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-purple-400 font-medium flex items-center">
                      阅读文章 <ChevronRight className="w-3 h-3 ml-1" />
                    </span>
                    {article.author && (
                      <span className="text-[10px] text-slate-500">作者: {article.author}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Book className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无知识库文章</p>
                <p className="text-xs mt-1">正在从后端获取数据...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
