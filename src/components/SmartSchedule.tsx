import React from 'react';
import { Calendar, CheckCircle2, Circle, Clock, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useAiTasks, useAiRecommendation } from '../hooks/useApi';

const typeLabels: Record<string, string> = {
  irrigation: '灌溉',
  fertilizer: '施肥',
  harvest: '采摘',
  maintenance: '维护',
  ventilation: '通风',
  lighting: '补光'
};

const actionLabels: Record<string, string> = {
  IRRIGATION: '灌溉',
  VENTILATION: '通风',
  LIGHTING: '补光',
  HEATING: '加热'
};

export const SmartSchedule: React.FC = () => {
  const { data: tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useAiTasks();
  const { data: recommendation, loading: recLoading, error: recError, refetch: refetchRec } = useAiRecommendation();

  const handleRefresh = () => {
    refetchTasks();
    refetchRec();
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-indigo-500" /> 智能排产系统
          </h2>
          <p className="text-slate-400 mt-2">
            基于实时物候数据与作物生长模型 AI 优化。
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={tasksLoading || recLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${(tasksLoading || recLoading) ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">即将执行的任务</h3>
          
          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="ml-3 text-slate-400">加载任务列表...</span>
            </div>
          ) : tasksError ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
              <p>加载失败: {tasksError}</p>
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
              <p>暂无排产任务</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${task.status === 'completed' ? 'bg-green-500/20 text-green-500' : task.status === 'failed' ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-400'}`}>
                     {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {typeLabels[task.type] || task.type} 任务 #{task.id}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 待执行</span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-slate-700/50 text-xs border border-slate-600">
                        {typeLabels[task.type] || task.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  {task.status !== 'completed' && (
                    <div className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                      <span>AI 置信度: {Math.round(task.aiConfidence * 100)}%</span>
                    </div>
                  )}
                  <button className="mt-2 text-xs text-slate-400 hover:text-white underline decoration-slate-600">
                    详情
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Insight Side Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-indigo-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> AI 托管建议
            </h3>
            
            {recLoading ? (
              <div className="flex items-center py-4">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="ml-2 text-slate-400 text-sm">获取 AI 建议...</span>
              </div>
            ) : recError ? (
              <p className="text-sm text-red-400 mb-4">获取建议失败: {recError}</p>
            ) : recommendation ? (
              <>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {recommendation.reason}
                </p>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700 mb-4">
                  <p className="text-xs text-slate-400 font-mono">建议操作:</p>
                  <p className="text-sm text-white font-medium">
                    {actionLabels[recommendation.action] || recommendation.action}
                  </p>
                  <p className="text-xs text-indigo-400 mt-1">
                    置信度: {Math.round(recommendation.confidence * 100)}%
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">暂无建议</p>
            )}
            
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              应用调整
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
             <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">资源消耗预测</h3>
             <div className="space-y-3">
               <div>
                 <div className="flex justify-between text-xs text-slate-300 mb-1">
                   <span>用水量</span>
                   <span>较平均值 -12%</span>
                 </div>
                 <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[40%]"></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs text-slate-300 mb-1">
                   <span>肥料库存</span>
                   <span>充足</span>
                 </div>
                 <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 w-[75%]"></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
