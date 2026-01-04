import React, { useState, createContext, useContext, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Greenhouse } from './components/Greenhouse';
import { SmartSchedule } from './components/SmartSchedule';
import { KnowledgeBase } from './components/KnowledgeBase';
import { GlobalChat } from './components/GlobalChat';
import { UserOperation } from './components/UserOperation';
import { Login } from './components/Login';
import { NavPage, ViewMode } from './types';
import { api } from './api';
import type { User } from './api/types';

// Create Context for View Mode
interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

export const ViewModeContext = createContext<ViewModeContextType>({
  mode: ViewMode.STANDARD,
  setMode: () => {},
});

export const useViewMode = () => useContext(ViewModeContext);

// Create Context for Auth
interface AuthContextType {
  user: User | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>(NavPage.DASHBOARD);
  const [mode, setMode] = useState<ViewMode>(ViewMode.STANDARD);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated());
  const [user, setUser] = useState<User | null>(api.getCurrentUser());

  // 检查登录状态
  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // 根据用户角色设置默认模式
      if (currentUser.role === 'EXPERT' || currentUser.defaultMode === 'EXPERT') {
        setMode(ViewMode.EXPERT);
      } else if (currentUser.role === 'MINIMAL' || currentUser.defaultMode === 'MINIMAL') {
        setMode(ViewMode.MINIMAL);
      }
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUser(api.getCurrentUser());
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  // 未登录显示登录页
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case NavPage.DASHBOARD:
        return <Dashboard />;
      case NavPage.USER_APP:
         return <UserOperation />;
      case NavPage.DIGITAL_TWIN:
        return <Greenhouse />;
      case NavPage.SCHEDULER:
        return <SmartSchedule />;
      case NavPage.KNOWLEDGE:
        return <KnowledgeBase />;
      default:
        return <Dashboard />;
    }
  };

  // Adjust margin based on sidebar state (Minimal mode has a narrower sidebar)
  const mainMargin = mode === ViewMode.MINIMAL ? 'ml-20' : 'ml-64';

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      <ViewModeContext.Provider value={{ mode, setMode }}>
        <div className={`flex h-screen bg-slate-950 text-slate-100 font-sans transition-all duration-500 ${mode === ViewMode.EXPERT ? 'font-mono' : ''}`}>
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          
          <main className={`flex-1 ${mainMargin} h-screen relative overflow-hidden transition-all duration-300`}>
            {renderContent()}
          </main>

          {/* Global AI Copilot - Floats above all content */}
          <GlobalChat />

          {/* Background decoration */}
          <div className="fixed inset-0 pointer-events-none z-[-1]">
            {mode === ViewMode.MINIMAL ? (
               <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black"></div>
            ) : mode === ViewMode.EXPERT ? (
               <div className="absolute inset-0 bg-slate-950 opacity-90"></div>
            ) : (
               <>
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[100px] opacity-50"></div>
                 <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] opacity-30"></div>
               </>
            )}
          </div>
        </div>
      </ViewModeContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
