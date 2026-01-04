import React, { useState } from 'react';
import { Sprout, FlaskConical, Loader2, AlertCircle, CheckCircle, Leaf, Thermometer } from 'lucide-react';
import { useFertilizerAnalysis } from '../hooks/useApi';

export const FertilizerAnalysis: React.FC = () => {
  const { data: result, loading, error, analyze, reset } = useFertilizerAnalysis();
  
  // 表单状态
  const [formData, setFormData] = useState({
    week: 5,
    N_soil: 120,
    P_soil: 35,
    K_soil: 180,
    ph: 6.5,
    ec: 2.1,
    temp: 25
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyze(formData);
  };

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-green-500" />
          番茄精准施肥分析
        </h3>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          AI 模型
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 生长周数 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">生长周数</label>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-500" />
              <input
                type="number"
                value={formData.week}
                onChange={(e) => handleInputChange('week', parseInt(e.target.value) || 0)}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
                min="1"
                max="20"
              />
              <span className="text-xs text-slate-500">周</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">环境温度</label>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <input
                type="number"
                value={formData.temp}
                onChange={(e) => handleInputChange('temp', parseFloat(e.target.value) || 0)}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
                step="0.1"
              />
              <span className="text-xs text-slate-500">°C</span>
            </div>
          </div>
        </div>

        {/* NPK 含量 */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-3">土壤养分含量 (mg/kg)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">氮 (N)</label>
              <input
                type="number"
                value={formData.N_soil}
                onChange={(e) => handleInputChange('N_soil', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">磷 (P)</label>
              <input
                type="number"
                value={formData.P_soil}
                onChange={(e) => handleInputChange('P_soil', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">钾 (K)</label>
              <input
                type="number"
                value={formData.K_soil}
                onChange={(e) => handleInputChange('K_soil', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* pH 和 EC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">土壤 pH 值</label>
            <input
              type="number"
              value={formData.ph}
              onChange={(e) => handleInputChange('ph', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
              step="0.1"
              min="0"
              max="14"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">电导率 EC (mS/cm)</label>
            <input
              type="number"
              value={formData.ec}
              onChange={(e) => handleInputChange('ec', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
              step="0.1"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <FlaskConical className="w-4 h-4" />
              开始分析
            </>
          )}
        </button>
      </form>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}

      {/* 分析结果 */}
      {result && result.status === 'success' && (
        <div className="mt-6 space-y-4 animate-in fade-in duration-300">
          {/* 环境状态 */}
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400 font-medium">环境状态: {result.env_status}</span>
          </div>

          {/* 养分缺失量 */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3">养分缺失分析</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg text-center ${result.deficits.N > 0 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800'}`}>
                <div className="text-xs text-slate-400 mb-1">氮 (N)</div>
                <div className={`text-xl font-bold ${result.deficits.N > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                  {result.deficits.N > 0 ? `-${result.deficits.N.toFixed(1)}` : '✓'}
                </div>
                <div className="text-[10px] text-slate-500">mg/kg</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${result.deficits.P > 0 ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-800'}`}>
                <div className="text-xs text-slate-400 mb-1">磷 (P)</div>
                <div className={`text-xl font-bold ${result.deficits.P > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {result.deficits.P > 0 ? `-${result.deficits.P.toFixed(1)}` : '✓'}
                </div>
                <div className="text-[10px] text-slate-500">mg/kg</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${result.deficits.K > 0 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800'}`}>
                <div className="text-xs text-slate-400 mb-1">钾 (K)</div>
                <div className={`text-xl font-bold ${result.deficits.K > 0 ? 'text-purple-400' : 'text-green-400'}`}>
                  {result.deficits.K > 0 ? `-${result.deficits.K.toFixed(1)}` : '✓'}
                </div>
                <div className="text-[10px] text-slate-500">mg/kg</div>
              </div>
            </div>
          </div>

          {/* AI 建议 */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-green-500" />
              AI 施肥建议
            </h4>
            <ul className="space-y-2">
              {result.advice_list.map((advice, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-green-500 mt-1">•</span>
                  {advice}
                </li>
              ))}
            </ul>
          </div>

          {/* 重置按钮 */}
          <button
            onClick={reset}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            重新分析
          </button>
        </div>
      )}
    </div>
  );
};
