import React from 'react';
import { LayoutDashboard, Cuboid, CalendarClock, BookOpen, Leaf, Zap, Wifi, Cpu, Eye, Layers, MousePointerClick, LogOut, User } from 'lucide-react';
import { NavPage, ViewMode } from '../types';
import { useViewMode, useAuth } from '../App';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { mode, setMode } = useViewMode();
  const { user, logout } = useAuth();

  const navItems = [
    { id: NavPage.DASHBOARD, label: '数据驾驶舱', icon: LayoutDashboard },
    { id: NavPage.USER_APP, label: '农事作业中心', icon: MousePointerClick },
    { id: NavPage.DIGITAL_TWIN, label: '3D 数字孪生', icon: Cuboid },
    { id: NavPage.SCHEDULER, label: 'AI 智能排产', icon: CalendarClock },
    { id: NavPage.KNOWLEDGE, label: '专家知识库', icon: BookOpen },
  ];

  const isMinimal = mode === ViewMode.MINIMAL;
  const widthClass = isMinimal ? 'w-20' : 'w-64';

  const roleLabels: Record<string, string> = {
    EXPERT: '专家',
    STANDARD: '标准用户',
    MINIMAL: '访客'
  };

  return (
    <div className={`${widthClass} bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-xl transition-all duration-300`}>
      <div className={`p-6 flex items-center ${isMinimal ? 'justify-center' : 'space-x-3'} border-b border-slate-800`}>
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-green-900/50 shrink-0">
          <Leaf className="text-white w-6 h-6" />
        </div>
        {!isMinimal && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">绿智云棚</h1>
            <p className="text-xs text-green-500 font-medium">智能大棚系统</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={isMinimal ? item.label : ''}
            className={`w-full flex items-center ${isMinimal ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 group ${
              currentPage === item.id
                ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/10 text-green-400 border border-green-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            {!isMinimal && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Mode Switcher */}
      <div className="p-4 border-t border-slate-800">
        {!isMinimal && <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 px-1">显示模式</div>}
        <div className={`flex ${isMinimal ? 'flex-col space-y-2' : 'space-x-1 bg-slate-800 rounded-lg p-1'}`}>
          <button 
             onClick={() => setMode(ViewMode.STANDARD)}
             className={`flex items-center justify-center p-2 rounded transition-all ${mode === ViewMode.STANDARD ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             title="标准模式"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button 
             onClick={() => setMode(ViewMode.EXPERT)}
             className={`flex items-center justify-center p-2 rounded transition-all ${mode === ViewMode.EXPERT ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             title="专家模式"
          >
            <Cpu className="w-4 h-4" />
          </button>
          <button 
             onClick={() => setMode(ViewMode.MINIMAL)}
             className={`flex items-center justify-center p-2 rounded transition-all ${mode === ViewMode.MINIMAL ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             title="极简模式"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimal && (
        <div className="p-4">
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> LoRaWAN</span>
              <span className="text-green-500">已连接</span>
            </div>
            {mode === ViewMode.EXPERT && (
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">网络延迟</span>
                <span className="text-blue-400">24ms</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 能源</span>
              <span className="text-yellow-500">充电中</span>
            </div>
          </div>
        </div>
      )}

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        {user && (
          <div className={`flex items-center ${isMinimal ? 'justify-center' : 'justify-between'}`}>
            {!isMinimal && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{user.username}</div>
                  <div className="text-[10px] text-slate-500">{roleLabels[user.role] || user.role}</div>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              title="退出登录"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
