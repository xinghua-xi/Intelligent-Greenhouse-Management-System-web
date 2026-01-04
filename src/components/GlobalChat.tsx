import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, ChevronRight, Loader2, Mic, MicOff } from 'lucide-react';
import { api } from '../api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const GlobalChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      text: '您好！我是绿智云棚智能助手。我可以回答种植问题、诊断病虫害、查询大棚状态或执行设备控制。请问有什么可以帮您？',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 更新对话历史
    const newHistory = [...chatHistory, { role: 'user', content: textToSend }];

    try {
      let responseText = '';

      // 判断是否是病虫害诊断请求
      if (textToSend.includes('诊断') || textToSend.includes('病') || textToSend.includes('虫') || textToSend.includes('黄') || textToSend.includes('斑')) {
        // 调用病虫害识别 API
        try {
          const diagnosis = await api.diagnosePlant({ 
            description: textToSend,
            cropType: '番茄' // 可以从上下文推断
          });
          
          const conditionMap: Record<string, string> = {
            healthy: '健康',
            pest: '虫害',
            disease: '病害'
          };
          
          responseText = `🔬 病虫害诊断结果：\n\n`;
          responseText += `状态: ${conditionMap[diagnosis.condition] || diagnosis.condition}\n`;
          if (diagnosis.disease) {
            responseText += `诊断: ${diagnosis.disease}\n`;
          }
          responseText += `置信度: ${Math.round(diagnosis.confidence * 100)}%\n\n`;
          if (diagnosis.treatment && diagnosis.treatment.length > 0) {
            responseText += `📋 建议措施:\n`;
            diagnosis.treatment.forEach((t, i) => {
              responseText += `${i + 1}. ${t}\n`;
            });
          }
        } catch (e) {
          // 诊断失败，使用通用问答
          const chatResponse = await api.chat({
            prompt: textToSend,
            history: newHistory,
            greenhouseId: 'gh_001'
          });
          responseText = chatResponse.text;
        }
      } 
      // 判断是否是设备控制请求
      else if (textToSend.includes('灌溉') || textToSend.includes('浇水') || textToSend.includes('开启') || textToSend.includes('关闭')) {
        // 先用 AI 理解意图
        const chatResponse = await api.chat({
          prompt: textToSend,
          history: newHistory,
          greenhouseId: 'gh_001'
        });
        responseText = chatResponse.text;
        
        // 如果确认执行，可以调用设备控制
        if (textToSend.includes('执行') || textToSend.includes('确认') || textToSend.includes('是')) {
          try {
            if (textToSend.includes('灌溉') || textToSend.includes('浇水')) {
              await api.controlDevice('pump_001', { action: 'IRRIGATION', duration: 900, mode: 'MANUAL' });
              responseText += '\n\n✅ 灌溉指令已下发，预计 15 分钟后自动关闭。';
            } else if (textToSend.includes('通风') || textToSend.includes('风机')) {
              await api.controlDevice('fan_001', { action: 'VENTILATION', duration: 600, mode: 'MANUAL' });
              responseText += '\n\n✅ 通风指令已下发，风机已启动。';
            }
          } catch (e) {
            responseText += '\n\n⚠️ 设备控制指令发送失败，请检查设备状态。';
          }
        }
      }
      // 查询大棚状态
      else if (textToSend.includes('状态') || textToSend.includes('温度') || textToSend.includes('湿度') || textToSend.includes('数据')) {
        try {
          const greenhouses = await api.getGreenhouses();
          if (greenhouses && greenhouses.length > 0) {
            responseText = '📊 当前大棚状态：\n\n';
            greenhouses.forEach(gh => {
              const statusMap: Record<string, string> = {
                NORMAL: '✅ 正常',
                WARNING: '⚠️ 需关注',
                CRITICAL: '🚨 异常'
              };
              responseText += `【${gh.name}】\n`;
              responseText += `  作物: ${gh.crop}\n`;
              responseText += `  状态: ${statusMap[gh.status] || gh.status}\n`;
              responseText += `  健康评分: ${gh.healthScore}/100\n\n`;
            });
          } else {
            // 没有数据时使用 AI 回答
            const chatResponse = await api.chat({
              prompt: textToSend,
              history: newHistory,
              greenhouseId: 'gh_001'
            });
            responseText = chatResponse.text;
          }
        } catch (e) {
          const chatResponse = await api.chat({
            prompt: textToSend,
            history: newHistory,
            greenhouseId: 'gh_001'
          });
          responseText = chatResponse.text;
        }
      }
      // AI 建议
      else if (textToSend.includes('建议') || textToSend.includes('推荐') || textToSend.includes('怎么办')) {
        try {
          const decision = await api.getRecommendation();
          const actionMap: Record<string, string> = {
            IRRIGATION: '灌溉',
            VENTILATION: '通风',
            LIGHTING: '补光',
            HEATING: '加热'
          };
          responseText = `🤖 AI 托管建议：\n\n`;
          responseText += `推荐操作: ${actionMap[decision.action] || decision.action}\n`;
          responseText += `原因: ${decision.reason}\n`;
          responseText += `置信度: ${Math.round(decision.confidence * 100)}%\n\n`;
          responseText += `需要我执行这个操作吗？`;
        } catch (e) {
          // 获取建议失败，使用通用问答
          const chatResponse = await api.chat({
            prompt: textToSend,
            history: newHistory,
            greenhouseId: 'gh_001'
          });
          responseText = chatResponse.text;
        }
      }
      // 通用问答 - 使用 AI Chat 接口
      else {
        const chatResponse = await api.chat({
          prompt: textToSend,
          history: newHistory,
          greenhouseId: 'gh_001'
        });
        responseText = chatResponse.text;
      }

      // 更新对话历史
      setChatHistory([...newHistory, { role: 'assistant', content: responseText }]);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: '抱歉，处理请求时出现错误。请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = ["查看大棚状态", "获取 AI 建议", "番茄叶子发黄怎么办"];

  // 语音录制功能
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // 转换为 Base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsTyping(true);
          
          try {
            // 调用语音转文字 API
            const result = await api.speechToText({ audio: base64, format: 'webm' });
            if (result.text) {
              setInput(result.text);
              // 自动发送
              setTimeout(() => handleSend(result.text), 500);
            }
          } catch (e) {
            console.error('语音识别失败:', e);
            const errorMsg: Message = {
              id: Date.now().toString(),
              type: 'ai',
              text: '语音识别失败，请重试或直接输入文字。',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
          } finally {
            setIsTyping(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (e) {
      console.error('无法访问麦克风:', e);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 group ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
        }`}
      >
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20 group-hover:opacity-40"></div>
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-48px)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col transition-all duration-500 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'
        }`}
        style={{ height: '600px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">绿智云棚 AI 助手</h3>
              <p className="text-xs text-indigo-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                在线 | DeepSeek 大模型
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                  msg.type === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-1 text-xs text-indigo-400 font-bold opacity-80">
                    <Bot className="w-3 h-3" /> AI 助手
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-sm text-slate-400">AI 思考中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && !isTyping && (
           <div className="px-4 pb-2">
             <div className="flex flex-wrap gap-2">
               {suggestions.map(s => (
                 <button 
                   key={s}
                   onClick={() => handleSend(s)}
                   className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                 >
                   {s} <ChevronRight className="w-3 h-3" />
                 </button>
               ))}
             </div>
           </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 rounded-b-2xl">
          <div className="flex gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTyping}
              className={`p-3 rounded-xl transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              } disabled:opacity-50`}
              title={isRecording ? '停止录音' : '语音输入'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isRecording ? '正在录音...' : '输入问题或指令...'}
              className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              disabled={isTyping || isRecording}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping || isRecording}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
