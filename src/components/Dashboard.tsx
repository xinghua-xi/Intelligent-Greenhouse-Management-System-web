import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend, PieChart, Pie } from 'recharts';
import { 
  Droplet, Sun, Battery, Bug, Sprout, Wifi, 
  RefreshCw, Download, Power, Fan, CloudRain, 
  ShieldCheck, SlidersHorizontal, Zap, Activity,
  Database, Server, Terminal, CheckCircle, Wind, 
  Thermometer, Gauge, AlertTriangle, Layers, Send, Loader2
} from 'lucide-react';
import { ViewMode } from '../types';
import { useViewMode } from '../App';
import { useDeviceControl, useGreenhouses, useEnvironmentData, useNodeStatus, useSoilData, useSoilHistory } from '../hooks/useApi';
import type { SoilHistoryRange } from '../api/types';
import { FertilizerAnalysis } from './FertilizerAnalysis';

// --- Helper Components ---

// 1. Liquid Tank Component (For Standard Mode)
const LiquidTank: React.FC<{ label: string; percent: number; color: string }> = ({ label, percent, color }) => (
  <div className="flex flex-col items-center gap-2 group cursor-pointer">
    <div className="relative w-16 h-32 bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-inner">
      {/* Liquid */}
      <div 
        className={`absolute bottom-0 w-full transition-all duration-1000 ease-in-out opacity-80 group-hover:opacity-100 ${color}`}
        style={{ height: `${percent}%` }}
      >
        {/* Wave effect overlay */}
        <div className="absolute top-0 w-full h-2 bg-white/20 animate-pulse"></div>
      </div>
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none">
        {[1,2,3,4].map(i => <div key={i} className="w-2 h-[1px] bg-slate-500/50 self-end"></div>)}
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
        {percent}%
      </div>
    </div>
    <span className="text-xs text-slate-400 font-medium group-hover:text-white transition-colors">{label}</span>
  </div>
);

// 2. Zone Health Grid (For Standard Mode)
const ZoneHealthWidget: React.FC = () => (
  <div className="grid grid-cols-2 gap-3">
    {[
      { id: 'A', name: '茄果区', status: 'optimal', score: 98 },
      { id: 'B', name: '叶菜区', status: 'warning', score: 76 },
      { id: 'C', name: '育苗床', status: 'optimal', score: 95 },
      { id: 'D', name: '实验田', status: 'critical', score: 45 },
    ].map(zone => (
      <div key={zone.id} className={`p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer ${
        zone.status === 'optimal' ? 'bg-green-500/10 border-green-500/30' : 
        zone.status === 'warning' ? 'bg-orange-500/10 border-orange-500/30' : 
        'bg-red-500/10 border-red-500/30'
      }`}>
        <div>
          <div className="text-xs font-bold text-slate-300">{zone.id}区 - {zone.name}</div>
          <div className={`text-[10px] uppercase font-bold mt-1 ${
             zone.status === 'optimal' ? 'text-green-400' : 
             zone.status === 'warning' ? 'text-orange-400' : 
             'text-red-400'
          }`}>
            {zone.status === 'optimal' ? '健康' : zone.status === 'warning' ? '需关注' : '异常'}
          </div>
        </div>
        <div className="h-8 w-8 rounded-full border-2 border-slate-700 flex items-center justify-center text-[10px] font-bold text-white bg-slate-800">
          {zone.score}
        </div>
      </div>
    ))}
  </div>
);

// 3. PWM Slider Control (For Expert Mode)
const PWMControl: React.FC<{ label: string; value: number; unit: string; onChange: (val: number) => void }> = ({ label, value, unit, onChange }) => (
  <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg">
    <div className="flex justify-between text-xs mb-2">
      <span className="text-slate-400 font-mono">{label}</span>
      <span className="text-green-400 font-mono">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min="0" 
      max="100" 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400"
    />
  </div>
);

// 4. Terminal Widget (For Expert Mode)
const TerminalWidget: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([
    '> 系统初始化... 完成 (SYSTEM_INIT)',
    '> 连接 LoRaWAN 网关... 成功 (SUCCESS)',
    '> [14:00:01] 收到心跳包: 节点_04 (Node_04)',
    '> [14:00:05] 传感器读数: 温度=24.5, 湿度=60%'
  ]);
  const [cmd, setCmd] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCmd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cmd) {
      setLogs(prev => [...prev, `> ${cmd}`, `  正在执行指令: ${cmd}...`, '  完成.']);
      setCmd('');
    }
  };

  return (
    <div className="bg-black border border-slate-700 rounded-lg font-mono text-xs flex flex-col h-64 shadow-inner">
      <div className="bg-slate-800 px-3 py-1 text-slate-400 flex items-center gap-2 border-b border-slate-700">
        <Terminal className="w-3 h-3" /> 调试控制台 (DEBUG_CONSOLE)
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300">
        {logs.map((l, i) => <div key={i} className={l.startsWith('>') ? 'text-green-400' : 'text-slate-400'}>{l}</div>)}
        <div ref={logEndRef} />
      </div>
      <div className="p-2 border-t border-slate-700 flex gap-2">
        <span className="text-green-500">$</span>
        <input 
          type="text" 
          className="bg-transparent border-none outline-none text-white flex-1 placeholder-slate-600"
          placeholder="输入指令 (如: RESET_NODE 01)"
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={handleCmd}
        />
      </div>
    </div>
  );
};

// --- Layouts ---

const StandardLayout = ({ commonProps }: any) => {
  const [activeWeather, setActiveWeather] = useState('sunny');
  const [chartType, setChartType] = useState<'temp' | 'light'>('temp');
  const { soilData, soilLoading } = commonProps;

  return (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* Top Row: Weather & KPI Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Weather Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl group-hover:bg-yellow-400/30 transition-all"></div>
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <div className="text-blue-100 text-sm font-medium">大棚外部气象</div>
            <div className="text-4xl font-bold mt-1">26°C</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-blue-100">
              <Wind className="w-4 h-4" /> 东南风 3级
            </div>
          </div>
          <Sun className="w-12 h-12 text-yellow-300 animate-pulse-slow" />
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-xs text-blue-100">
          <span>湿度 45%</span>
          <span>降雨概率 10%</span>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-600 transition-colors">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-green-500/10 rounded-lg"><Sprout className="w-6 h-6 text-green-500" /></div>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">+12% 生长率</span>
        </div>
        <div>
          <div className="text-slate-400 text-xs">平均土壤水分</div>
          <div className="text-2xl font-bold text-white">62.8 <span className="text-sm font-normal text-slate-500">%</span></div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-600 transition-colors">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-orange-500/10 rounded-lg"><Sun className="w-6 h-6 text-orange-500" /></div>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">正常范围</span>
        </div>
        <div>
          <div className="text-slate-400 text-xs">累计光照量 (DLI)</div>
          <div className="text-2xl font-bold text-white">14.2 <span className="text-sm font-normal text-slate-500">mol/m²</span></div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-600 transition-colors">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-purple-500/10 rounded-lg"><Activity className="w-6 h-6 text-purple-500" /></div>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">AI 预测</span>
        </div>
        <div>
          <div className="text-slate-400 text-xs">预计采收时间</div>
          <div className="text-2xl font-bold text-white">18 <span className="text-sm font-normal text-slate-500">天后</span></div>
        </div>
      </div>
    </div>

    {/* Middle Row: Chart & Tanks & Health */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chart */}
      <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> 环境趋势分析
          </h3>
          <select 
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'temp' | 'light')}
            className="bg-slate-900 border border-slate-600 text-xs text-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500"
          >
            <option value="temp">温度 & 湿度</option>
            <option value="light">光照 & CO2</option>
          </select>
        </div>
        <div className="h-64 w-full">
          {commonProps.envData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={commonProps.envData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
              {chartType === 'temp' ? (
                <>
                  <Area type="monotone" dataKey="temp" name="温度" stroke="#fb923c" strokeWidth={3} fill="url(#colorTemp)" />
                  <Area type="monotone" dataKey="humidity" name="湿度" stroke="#60a5fa" strokeWidth={3} fill="url(#colorHum)" />
                </>
              ) : (
                <>
                  <Area type="monotone" dataKey="light" name="光照" stroke="#fbbf24" strokeWidth={3} fill="url(#colorLight)" />
                  <Area type="monotone" dataKey="co2" name="CO2" stroke="#a78bfa" strokeWidth={3} fill="url(#colorCo2)" />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无环境数据</p>
                <p className="text-xs mt-1">正在从后端获取数据...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource & Health Column */}
      <div className="space-y-6">
        {/* Tanks */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex gap-2 items-center"><Droplet className="w-4 h-4"/> 资源液位</h3>
          <div className="flex justify-around">
            <LiquidTank label="清水箱" percent={85} color="bg-blue-500" />
            <LiquidTank label="营养液 A" percent={40} color="bg-green-500" />
            <LiquidTank label="营养液 B" percent={65} color="bg-emerald-600" />
          </div>
        </div>
        
        {/* Zone Health */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex gap-2 items-center"><Activity className="w-4 h-4"/> 区域健康度</h3>
          <ZoneHealthWidget />
        </div>
      </div>
    </div>

    {/* New Row: Soil Environment Monitoring */}
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-500" /> 土壤环境监测
        </h3>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">实时数据</span>
      </div>
      {soilLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          <span className="ml-2 text-slate-400">加载土壤数据...</span>
        </div>
      ) : soilData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: '生长周数', value: soilData.week, unit: '周', icon: Sprout, color: 'green' },
            { label: '氮含量 (N)', value: soilData.N_soil.toFixed(1), unit: 'mg/kg', icon: Droplet, color: 'blue' },
            { label: '磷含量 (P)', value: soilData.P_soil.toFixed(1), unit: 'mg/kg', icon: Droplet, color: 'orange' },
            { label: '钾含量 (K)', value: soilData.K_soil.toFixed(1), unit: 'mg/kg', icon: Droplet, color: 'purple' },
            { label: 'pH 值', value: soilData.ph.toFixed(1), unit: '', icon: Gauge, color: 'cyan' },
            { label: '电导率 EC', value: soilData.ec.toFixed(1), unit: 'mS/cm', icon: Zap, color: 'yellow' },
            { label: '土壤温度', value: soilData.temp.toFixed(1), unit: '°C', icon: Thermometer, color: 'red' },
          ].map((item, idx) => (
            <div key={idx} className={`bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-center hover:border-${item.color}-500/50 transition-colors`}>
              <div className={`inline-flex p-2 rounded-lg bg-${item.color}-500/10 mb-2`}>
                <item.icon className={`w-4 h-4 text-${item.color}-500`} />
              </div>
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-[10px] text-slate-500">{item.unit}</div>
              <div className="text-xs text-slate-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <Sprout className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>暂无土壤数据</p>
          <p className="text-xs mt-1">请确保数据服务正常运行</p>
        </div>
      )}
    </div>

    {/* New Row: Soil Trend Chart */}
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-500" /> 土壤趋势分析
        </h3>
        <select 
          value={commonProps.soilChartType}
          onChange={(e) => commonProps.setSoilChartType(e.target.value)}
          className="bg-slate-900 border border-slate-600 text-xs text-slate-300 rounded px-2 py-1 outline-none focus:border-green-500"
        >
          <option value="npk">氮磷钾 (NPK)</option>
          <option value="env">pH & EC & 温度</option>
        </select>
      </div>
      <div className="h-64 w-full">
        {commonProps.soilHistory && commonProps.soilHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={commonProps.soilHistory}>
              <defs>
                <linearGradient id="colorN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorK" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSoilTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
              {commonProps.soilChartType === 'npk' ? (
                <>
                  <Area type="monotone" dataKey="N_soil" name="氮 (N)" stroke="#3b82f6" strokeWidth={2} fill="url(#colorN)" />
                  <Area type="monotone" dataKey="P_soil" name="磷 (P)" stroke="#f97316" strokeWidth={2} fill="url(#colorP)" />
                  <Area type="monotone" dataKey="K_soil" name="钾 (K)" stroke="#a855f7" strokeWidth={2} fill="url(#colorK)" />
                </>
              ) : (
                <>
                  <Area type="monotone" dataKey="ph" name="pH" stroke="#06b6d4" strokeWidth={2} fill="url(#colorPh)" />
                  <Area type="monotone" dataKey="ec" name="EC" stroke="#eab308" strokeWidth={2} fill="url(#colorEc)" />
                  <Area type="monotone" dataKey="temp" name="温度" stroke="#ef4444" strokeWidth={2} fill="url(#colorSoilTemp)" />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无土壤历史数据</p>
              <p className="text-xs mt-1">正在从后端获取数据...</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* New Row: Fertilizer Analysis & Quick Actions */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Fertilizer Analysis */}
      <FertilizerAnalysis />

      {/* Quick Actions */}
      <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '智能托管模式', icon: Power, active: commonProps.autoMode, action: () => commonProps.setAutoMode(!commonProps.autoMode), color: 'green' },
            { label: '开启强力通风', icon: Fan, active: commonProps.ventActive, action: () => commonProps.setVentActive(!commonProps.ventActive), color: 'cyan' },
            { label: '全区紧急灌溉', icon: CloudRain, active: commonProps.irrigationActive, action: () => commonProps.setIrrigationActive(!commonProps.irrigationActive), color: 'blue' },
            { label: '重置报警状态', icon: ShieldCheck, active: false, action: () => {}, color: 'purple', temp: true },
          ].map((btn, idx) => (
            <button 
              key={idx}
              onClick={btn.action}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden
                ${btn.active 
                  ? `bg-${btn.color}-500/10 border-${btn.color}-500 text-${btn.color}-400` 
                  : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
            >
              <div className={`p-3 rounded-full transition-all ${btn.active ? `bg-${btn.color}-500 text-white shadow-lg shadow-${btn.color}-500/30` : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                <btn.icon className={`w-5 h-5 ${btn.active && btn.label.includes('通风') ? 'animate-spin-slow' : ''}`} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">{btn.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{btn.active ? '运行中' : '已就绪'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

const MinimalLayout = ({ commonProps }: any) => {
  const [optimized, setOptimized] = useState(false);

  return (
  <div className="flex flex-col h-full items-center justify-center max-w-4xl mx-auto animate-in zoom-in duration-500">
    {/* Zen Health Ring */}
    <div className="relative mb-16 group">
      {/* Background glow */}
      <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${optimized ? 'bg-green-500/20' : 'bg-emerald-500/20'}`}></div>
      
      {/* The Ring Container */}
      <div className="relative w-80 h-80 flex items-center justify-center">
         {/* SVG Ring */}
         <svg className="w-full h-full -rotate-90">
           <circle cx="160" cy="160" r="140" stroke="#1e293b" strokeWidth="12" fill="none" />
           <circle 
             cx="160" cy="160" r="140" 
             stroke={optimized ? "#22c55e" : "#10b981"} 
             strokeWidth="12" 
             fill="none" 
             strokeDasharray="880" 
             strokeDashoffset={optimized ? "0" : "120"} 
             strokeLinecap="round"
             className="transition-all duration-[1.5s] ease-out"
           />
         </svg>
         
         {/* Center Content */}
         <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="mb-2 p-3 bg-slate-800/50 rounded-full backdrop-blur-sm">
              <CheckCircle className={`w-12 h-12 ${optimized ? 'text-green-400' : 'text-emerald-400'}`} />
            </div>
            <div className="text-6xl font-bold text-white tracking-tighter mb-1">
              {optimized ? '100' : '92'}
            </div>
            <div className={`text-lg font-medium tracking-widest uppercase ${optimized ? 'text-green-400' : 'text-emerald-400'}`}>
              系统健康度
            </div>
         </div>
      </div>
    </div>

    {/* Key Metrics Row */}
    <div className="grid grid-cols-3 gap-8 w-full px-8 mb-16">
       {[
         { label: '平均温度', val: '24.2°C', icon: Thermometer },
         { label: '光照强度', val: '适宜', icon: Sun },
         { label: '灌溉系统', val: '待机', icon: Droplet },
       ].map((item, i) => (
         <div key={i} className="flex flex-col items-center text-center gap-2">
            <item.icon className="w-6 h-6 text-slate-500" />
            <div className="text-2xl font-bold text-slate-200">{item.val}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</div>
         </div>
       ))}
    </div>

    {/* Magic Button */}
    <button 
      onClick={() => setOptimized(true)}
      disabled={optimized}
      className={`group relative overflow-hidden rounded-full px-10 py-4 font-bold text-sm tracking-widest uppercase transition-all duration-500
        ${optimized 
          ? 'bg-green-500/10 text-green-500 cursor-default border border-green-500/50' 
          : 'bg-white text-slate-900 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
        }`}
    >
      {optimized ? (
        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> 已处于最佳状态</span>
      ) : (
        <span className="flex items-center gap-2">✨ AI 一键调优</span>
      )}
    </button>
  </div>
  );
};

const ExpertLayout = ({ commonProps }: any) => {
  const [fanSpeed, setFanSpeed] = useState(60);
  const [lightIntensity, setLightIntensity] = useState(85);

  return (
  <div className="font-mono text-xs text-slate-300 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
    {/* Row 1: Topology & Console */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Node Topology */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-lg p-4">
         <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
           <h3 className="font-bold text-white flex items-center gap-2"><Server className="w-4 h-4 text-blue-500"/> LoRa MESH 拓扑网络 (TOPOLOGY)</h3>
           <span className="text-green-500">网关在线 (GATEWAY_ONLINE)</span>
         </div>
         <div className="overflow-x-auto">
           {commonProps.nodeStatus.length > 0 ? (
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="text-slate-500 border-b border-slate-800">
                 <th className="py-2 pl-2">节点ID (NODE)</th>
                 <th>名称 (NAME)</th>
                 <th>类型 (TYPE)</th>
                 <th>信号强度 (%)</th>
                 <th>电量 (BAT)</th>
                 <th>状态 (STATUS)</th>
               </tr>
             </thead>
             <tbody>
               {commonProps.nodeStatus.map((n: any, i: number) => (
                 <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                   <td className="py-2 pl-2 font-bold text-white">{n.id}</td>
                   <td>{n.name || n.nodeType}</td>
                   <td className={n.signalStrength < 50 ? 'text-red-400' : 'text-green-400'}>{n.signalStrength}%</td>
                   <td>
                     <div className="flex items-center gap-2">
                       <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                         <div className={`h-full ${n.battery < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${n.battery}%`}}></div>
                       </div>
                       {n.battery}%
                     </div>
                   </td>
                   <td>
                     <span className={`px-1.5 py-0.5 rounded ${
                       n.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 
                       n.status === 'WARNING' ? 'bg-orange-500/20 text-orange-400' : 
                       'bg-red-500/20 text-red-400'
                     }`}>{n.status}</span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           ) : (
             <div className="py-8 text-center text-slate-500">
               <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p>暂无节点数据</p>
               <p className="text-xs mt-1">正在从后端获取数据...</p>
             </div>
           )}
         </div>
      </div>

      {/* Terminal */}
      <TerminalWidget />
    </div>

    {/* Row 2: Precision Control & Detailed Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col justify-between">
        <div className="mb-4 pb-2 border-b border-slate-800 flex justify-between">
          <h3 className="font-bold text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-orange-500"/> 执行器 PWM 精确控制</h3>
          <span className="text-slate-500">手动接管 (MANUAL)</span>
        </div>
        
        <div className="space-y-4">
          <PWMControl label="主风机转速 (FAN_RPM)" value={fanSpeed} unit="%" onChange={setFanSpeed} />
          <PWMControl label="补光灯光强 (LIGHT_PAR)" value={lightIntensity} unit="%" onChange={setLightIntensity} />
          
          <div className="grid grid-cols-2 gap-2 mt-2">
             <button className="bg-red-900/30 border border-red-900 text-red-400 py-2 rounded hover:bg-red-900/50 transition-colors">
               紧急停止 (STOP)
             </button>
             <button className="bg-blue-900/30 border border-blue-900 text-blue-400 py-2 rounded hover:bg-blue-900/50 transition-colors">
               重新校准 (CALIB)
             </button>
          </div>
        </div>
      </div>

      {/* Multi-Layer Chart */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-lg p-4">
         <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white flex items-center gap-2"><Database className="w-4 h-4 text-purple-500"/> 传感器相关性分析 (CORRELATION)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> 温度 (TEMP)</span>
              <span className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> 电压 (VOLT)</span>
            </div>
         </div>
         <div className="h-48">
          {commonProps.envData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={commonProps.envData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} domain={[3.5, 4.5]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontFamily: 'monospace' }} />
              <Line yAxisId="left" type="step" dataKey="temp" stroke="#f97316" dot={false} strokeWidth={1.5} />
              <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#06b6d4" dot={true} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无传感器数据</p>
              </div>
            </div>
          )}
         </div>
      </div>
    </div>
  </div>
  );
};

// --- Main Dashboard Component ---

export const Dashboard: React.FC = () => {
  const { mode } = useViewMode();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [soilTimeRange, setSoilTimeRange] = useState<SoilHistoryRange>('24h');
  const [soilChartType, setSoilChartType] = useState<'npk' | 'env'>('npk');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // API Hooks - 环境数据支持时间范围参数
  const { data: greenhouses, loading: ghLoading, refetch: refetchGreenhouses } = useGreenhouses();
  const { controlDevice, loading: controlLoading, error: controlError } = useDeviceControl();
  const { data: envData, loading: envLoading, refetch: refetchEnv } = useEnvironmentData(undefined, timeRange);
  const { data: nodeStatus, loading: nodeLoading, refetch: refetchNodes } = useNodeStatus();
  const { data: soilData, loading: soilLoading, refetch: refetchSoil } = useSoilData();
  const { data: soilHistory, loading: soilHistoryLoading, refetch: refetchSoilHistory } = useSoilHistory(soilTimeRange);
  
  // Simulation States for Controls (Shared across modes)
  const [autoMode, setAutoMode] = useState(true);
  const [ventActive, setVentActive] = useState(false);
  const [irrigationActive, setIrrigationActive] = useState(false);

  // 处理设备控制
  const handleVentilation = async () => {
    const newState = !ventActive;
    setVentActive(newState);
    if (newState) {
      try {
        await controlDevice('fan_001', { action: 'VENTILATION', duration: 300 });
      } catch (e) {
        console.error('通风指令发送失败:', e);
        setVentActive(false); // 失败时恢复状态
      }
    }
  };

  const handleIrrigation = async () => {
    const newState = !irrigationActive;
    setIrrigationActive(newState);
    if (newState) {
      try {
        await controlDevice('pump_001', { action: 'IRRIGATION', duration: 900 });
      } catch (e) {
        console.error('灌溉指令发送失败:', e);
        setIrrigationActive(false); // 失败时恢复状态
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchGreenhouses();
    refetchEnv();
    refetchNodes();
    refetchSoil();
    refetchSoilHistory();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const commonProps = {
    autoMode, setAutoMode,
    ventActive, setVentActive: handleVentilation,
    irrigationActive, setIrrigationActive: handleIrrigation,
    controlLoading,
    envData: envData || [],
    nodeStatus: nodeStatus || [],
    envLoading,
    nodeLoading,
    soilData,
    soilLoading,
    soilHistory: soilHistory || [],
    soilHistoryLoading,
    soilChartType,
    setSoilChartType
  };

  return (
    <div className="p-6 h-full overflow-y-auto pb-20 scroll-smooth custom-scrollbar">
      {/* Universal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            数据驾驶舱 
            <span className={`text-xs font-normal px-2 py-0.5 rounded border ${
              mode === ViewMode.EXPERT 
                ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' 
                : 'border-green-500/30 text-green-400 bg-green-500/10'
            }`}>
              {mode === ViewMode.STANDARD ? '运营视图' : mode === ViewMode.EXPERT ? '工程师终端' : '大屏监控'}
            </span>
          </h2>
          {mode !== ViewMode.MINIMAL && (
            <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              系统状态: <span className="text-green-400 font-bold">运行最佳</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full mx-1"></span>
              上次同步: <span className="text-slate-300">刚刚</span>
            </p>
          )}
        </div>

        {/* Tools (Hidden in Minimal Mode) */}
        {mode !== ViewMode.MINIMAL && (
          <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex bg-slate-900 rounded-lg p-1 mr-2">
              {(['1h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeRange === range 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {range === '1h' ? '1小时' : range === '24h' ? '24小时' : '7天'}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleRefresh}
              className={`p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/20">
              <Download className="w-3 h-3" />
              导出
            </button>
          </div>
        )}
      </div>

      {/* Mode-Specific Content */}
      {mode === ViewMode.STANDARD && <StandardLayout commonProps={commonProps} />}
      {mode === ViewMode.MINIMAL && <MinimalLayout commonProps={commonProps} />}
      {mode === ViewMode.EXPERT && <ExpertLayout commonProps={commonProps} />}
    </div>
  );
};