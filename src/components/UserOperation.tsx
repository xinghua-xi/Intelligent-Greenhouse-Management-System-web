import React, { useState } from 'react';
import { 
  Droplet, Wind, Sprout, 
  CheckSquare, AlertTriangle, 
  Thermometer, Power, 
  Users, Layers, Clock, Cpu,
  Activity, Loader2, FlaskConical, Leaf, CheckCircle, AlertCircle
} from 'lucide-react';
import { useViewMode } from '../App';
import { ViewMode } from '../types';
import { useDeviceControl, useGreenhouses, useUsers, useFertilizerAnalysis } from '../hooks/useApi';
import type { ActionType } from '../api/types';

// --- 区域数据类型 ---
interface ZoneData {
  id: string;
  name: string;
  crop: string;
  img: string;
  temp: number;
  humid: number;
  status: 'good' | 'warning' | 'critical';
  lastWater: string;
  harvestReady: boolean;
}

// --- 1. Minimal Mode: The "Gallery" View (For Visitors/Owners) ---
const MinimalOperator = () => {
  const { data: greenhouses, loading } = useGreenhouses();
  
  // 将大棚数据转换为区域数据格式
  const zones: ZoneData[] = greenhouses?.map((gh, idx) => ({
    id: gh.id,
    name: gh.name,
    crop: gh.crop || '未知作物',
    img: `https://images.unsplash.com/photo-${['1592187270271-9a4b84faa228', '1622383563227-0440114a0951', '1599598425947-d3527b1c4303', '1587393855524-087f83d95bc9'][idx % 4]}?q=80&w=400&auto=format&fit=crop`,
    temp: 22 + Math.floor(Math.random() * 6),
    humid: 50 + Math.floor(Math.random() * 30),
    status: gh.status === 'NORMAL' ? 'good' : gh.status === 'WARNING' ? 'warning' : 'critical',
    lastWater: `${Math.floor(Math.random() * 8) + 1}小时前`,
    harvestReady: gh.healthScore > 80
  })) || [];

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 p-8 overflow-y-auto animate-in fade-in duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-light text-white tracking-widest uppercase mb-2">作物生长画廊</h1>
        <p className="text-slate-500 font-light">实时查看园区作物状态与预计产值</p>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Sprout className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">暂无大棚数据</p>
          <p className="text-sm mt-2">请确保后端服务正常运行</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {zones.map(zone => (
          <div key={zone.id} className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl transition-transform duration-500 hover:-translate-y-2">
            {/* Background Image */}
            <div className="absolute inset-0 bg-slate-800">
              <img src={zone.img} alt={zone.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 scale-105 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                  {zone.id}区
                </span>
                {zone.harvestReady && (
                   <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg shadow-green-500/40">
                     可采收
                   </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{zone.crop}</h2>
                <p className="text-slate-300 text-sm mb-4 opacity-80">{zone.name}</p>
                
                {/* Simplified Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-300 uppercase">温度</div>
                    <div className="text-lg font-bold text-white">{zone.temp}°</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-300 uppercase">产量预估</div>
                    <div className="text-lg font-bold text-green-400">极佳</div>
                  </div>
                </div>

                <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

// --- 2. Expert Mode: The "Registry" View (For Engineers) ---
const ExpertOperator = () => {
  // 硬件设备注册表 - 需要后端提供设备详情 API
  // 目前使用本地状态管理设备状态
  const [devices, setDevices] = useState([
    { id: 'VLV-A-01', type: '电磁阀 (Solenoid)', zone: 'A', pin: 'GPIO_12', state: false, current: 0.24, lastPing: '12ms' },
    { id: 'VLV-A-02', type: '电磁阀 (Solenoid)', zone: 'A', pin: 'GPIO_13', state: false, current: 0.00, lastPing: '12ms' },
    { id: 'FAN-B-01', type: '排风扇 (Fan)', zone: 'B', pin: 'PWM_01', state: true, current: 1.5, lastPing: '15ms' },
    { id: 'PUMP-M-01', type: '主水泵 (Pump)', zone: 'SYS', pin: 'GPIO_05', state: false, current: 0.00, lastPing: '8ms' },
    { id: 'LED-C-01', type: '补光灯 (GrowLight)', zone: 'C', pin: 'DALI_01', state: true, current: 2.1, lastPing: '22ms' },
  ]);

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, state: !d.state, current: !d.state ? parseFloat((Math.random() * 2).toFixed(2)) : 0 } : d));
  };

  return (
    <div className="h-full bg-black p-6 font-mono text-xs overflow-y-auto">
      <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-green-500 flex items-center gap-2">
            <Cpu className="w-5 h-5" /> 硬件设备注册表 (HARDWARE_REGISTRY)
          </h1>
          <p className="text-slate-500 mt-1">底层驱动与引脚控制面板 (DMA Control Panel)</p>
        </div>
        <div className="text-right text-slate-500">
           <div>运行时间: 423小时 12分 04秒</div>
           <div>调试串口: /dev/ttyUSB0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800 text-slate-400">
                <th className="p-3">设备标识 (ID)</th>
                <th className="p-3">类型 (TYPE)</th>
                <th className="p-3">引脚映射 (PIN)</th>
                <th className="p-3">电流 (A)</th>
                <th className="p-3">延迟 (ms)</th>
                <th className="p-3 text-right">状态覆写 (OVERRIDE)</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-indigo-400 font-bold">{d.id}</td>
                  <td className="p-3 text-slate-300">{d.type}</td>
                  <td className="p-3 text-slate-500">{d.pin}</td>
                  <td className="p-3 text-yellow-500 font-bold">{d.current}A</td>
                  <td className="p-3 text-green-500">{d.lastPing}</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => toggleDevice(d.id)}
                      className={`px-3 py-1 rounded border ${
                        d.state 
                          ? 'bg-green-900/30 border-green-700 text-green-400 hover:bg-green-900/50' 
                          : 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50'
                      }`}
                    >
                      {d.state ? '高电平 (ON)' : '低电平 (OFF)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diagnostic Panel */}
        <div className="space-y-4">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded">
             <h3 className="text-slate-400 font-bold border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
               <Activity className="w-4 h-4" /> 总线数据流 (BUS_TRAFFIC)
             </h3>
             <div className="space-y-2">
               {[
                 { msg: '发送 > 设置引脚 GPIO_12 高电平', time: '14:00:01:223', color: 'text-blue-400' },
                 { msg: '接收 < 确认 GPIO_12 成功', time: '14:00:01:245', color: 'text-green-400' },
                 { msg: '接收 < 错误 节点_04 超时', time: '14:00:05:001', color: 'text-red-400' },
                 { msg: '发送 > 轮询所有节点状态', time: '14:00:10:000', color: 'text-blue-400' },
               ].map((log, i) => (
                 <div key={i} className="flex gap-2">
                   <span className="text-slate-600">[{log.time}]</span>
                   <span className={log.color}>{log.msg}</span>
                 </div>
               ))}
             </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 p-4 rounded">
              <h3 className="text-slate-400 font-bold border-b border-slate-800 pb-2 mb-3">
                 系统维护指令 (SYSTEM_COMMANDS)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                 <button className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded border border-slate-700">重启核心</button>
                 <button className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded border border-slate-700">清除缓存</button>
                 <button className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded border border-slate-700">看门狗测试</button>
                 <button className="bg-red-900/30 hover:bg-red-900/50 text-red-400 p-2 rounded border border-red-900">紧急停机</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 3. Standard Mode: The "Command Center" (For Farm Managers) ---
const StandardOperator = () => {
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [operationMode, setOperationMode] = useState<'water' | 'fertilize' | 'vent' | 'temp'>('water');
  
  // Parameter States
  const [duration, setDuration] = useState(15);
  const [intensity, setIntensity] = useState(50);
  const [targetTemp] = useState(25);
  const [executing, setExecuting] = useState(false);

  // Fertilizer Analysis Form State
  const [fertilizerForm, setFertilizerForm] = useState({
    week: 5,
    N_soil: 120,
    P_soil: 35,
    K_soil: 180,
    ph: 6.5,
    ec: 2.1,
    temp: 25
  });

  // API Hooks
  const { data: greenhouses, loading: ghLoading } = useGreenhouses();
  const { controlDevice, loading: controlLoading, error: controlError } = useDeviceControl();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: fertilizerResult, loading: fertilizerLoading, error: fertilizerError, analyze: analyzeFertilizer, reset: resetFertilizer } = useFertilizerAnalysis();

  // 将大棚数据转换为区域数据格式
  const zones: ZoneData[] = greenhouses?.map((gh, idx) => ({
    id: gh.id,
    name: gh.name,
    crop: gh.crop || '未知作物',
    img: `https://images.unsplash.com/photo-${['1592187270271-9a4b84faa228', '1622383563227-0440114a0951', '1599598425947-d3527b1c4303', '1587393855524-087f83d95bc9'][idx % 4]}?q=80&w=400&auto=format&fit=crop`,
    temp: 22 + Math.floor(Math.random() * 6),
    humid: 50 + Math.floor(Math.random() * 30),
    status: (gh.status === 'NORMAL' ? 'good' : gh.status === 'WARNING' ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
    lastWater: `${Math.floor(Math.random() * 8) + 1}小时前`,
    harvestReady: gh.healthScore > 80
  })) || [];

  const toggleZone = (id: string) => {
    setSelectedZones(prev => 
      prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedZones.length === zones.length) setSelectedZones([]);
    else setSelectedZones(zones.map(z => z.id));
  };

  const handleExecute = async () => {
    if (selectedZones.length === 0) return;
    
    setExecuting(true);
    
    // 映射操作模式到 API ActionType
    const actionMap: Record<string, ActionType> = {
      water: 'IRRIGATION',
      fertilize: 'IRRIGATION', // 施肥也通过灌溉系统
      vent: 'VENTILATION',
      temp: 'HEATING'
    };
    
    const action = actionMap[operationMode];
    const durationSeconds = duration * 60;
    
    try {
      // 对每个选中的区域发送控制指令
      for (const zoneId of selectedZones) {
        const deviceId = `device_zone_${zoneId.toLowerCase()}`;
        await controlDevice(deviceId, { 
          action, 
          duration: durationSeconds,
          mode: 'MANUAL'
        });
      }
      
      alert(`指令已下发: 对 [${selectedZones.join(', ')}区] 执行 ${operationMode === 'water' ? '灌溉' : operationMode === 'vent' ? '通风' : operationMode === 'temp' ? '控温' : '施肥'}\n参数: ${duration}分钟 / 强度${intensity}%`);
      setSelectedZones([]);
    } catch (err) {
      alert(`指令发送失败: ${controlError || '请检查网络连接'}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="text-indigo-500" /> 农事作业指挥中心
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            多区域协同控制 • 批量作业 • 人员调度
          </p>
        </div>
        <div className="flex gap-4 text-sm font-mono text-slate-400">
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 
             网关在线
           </div>
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
             <Users className="w-4 h-4" /> 
             值班人员: -
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Zone Selection & Map Grid */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-slate-800">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-slate-200">区域选择 ({selectedZones.length})</h2>
             <button 
               onClick={selectAll}
               className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1 hover:bg-indigo-500/10 rounded transition-colors"
               disabled={zones.length === 0}
             >
               {selectedZones.length === zones.length && zones.length > 0 ? '取消全选' : '全选所有区域'}
             </button>
           </div>

           {ghLoading ? (
             <div className="flex items-center justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
             </div>
           ) : zones.length === 0 ? (
             <div className="text-center py-20 text-slate-500">
               <Sprout className="w-12 h-12 mx-auto mb-4 opacity-50" />
               <p>暂无大棚数据</p>
               <p className="text-sm mt-2">请确保后端服务正常运行</p>
             </div>
           ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {zones.map(zone => (
               <div 
                 key={zone.id}
                 onClick={() => toggleZone(zone.id)}
                 className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer group select-none
                   ${selectedZones.includes(zone.id) 
                     ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                     : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                   }`}
               >
                 {/* Selection Checkbox */}
                 <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                   ${selectedZones.includes(zone.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 bg-slate-900 group-hover:border-slate-400'}
                 `}>
                   {selectedZones.includes(zone.id) && <CheckSquare className="w-4 h-4 text-white" />}
                 </div>

                 <div className="flex items-start gap-4">
                   <div className={`p-3 rounded-lg ${zone.status === 'warning' ? 'bg-orange-500/20 text-orange-400' : zone.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                     <Sprout className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className={`font-bold text-lg ${selectedZones.includes(zone.id) ? 'text-indigo-200' : 'text-slate-200'}`}>
                       {zone.name}
                     </h3>
                     <p className="text-slate-400 text-sm mb-2">{zone.crop}</p>
                     
                     <div className="flex gap-4 text-xs text-slate-500">
                       <span className="flex items-center gap-1"><Thermometer className="w-3 h-3"/> {zone.temp}°C</span>
                       <span className={`flex items-center gap-1 ${zone.humid < 40 ? 'text-orange-400 font-bold' : ''}`}>
                         <Droplet className="w-3 h-3"/> {zone.humid}%
                       </span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-xs text-slate-500">
                   <span>上次灌溉: {zone.lastWater}</span>
                   {zone.status === 'warning' && <span className="text-orange-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 需关注</span>}
                   {zone.status === 'critical' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 异常</span>}
                 </div>
               </div>
             ))}
           </div>
           )}

           {/* Task Dispatch Board - 人员管理 */}
           <div className="mt-8">
             <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
               <Users className="w-5 h-5 text-green-500" /> 人员任务指派
             </h2>
             {usersLoading ? (
               <div className="text-center py-8">
                 <Loader2 className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
               </div>
             ) : users && users.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {users.map(user => (
                   <div key={user.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                         {user.username[0]?.toUpperCase()}
                       </div>
                       <div>
                         <div className="text-white font-medium">{user.username} <span className="text-xs text-slate-500">({user.role})</span></div>
                         <div className={`text-xs ${user.status === 'busy' ? 'text-orange-400' : 'text-green-400'}`}>
                           • {user.status === 'busy' ? '忙碌中' : '空闲'}
                         </div>
                       </div>
                     </div>
                     <button className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors">
                       + 指派任务
                     </button>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
                 <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                 <p>暂无人员数据</p>
                 <p className="text-xs mt-1">正在从后端获取数据...</p>
               </div>
             )}
           </div>
        </div>

        {/* Right: Operation Control Panel */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20">
          
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white mb-1">批量作业配置</h2>
            <p className="text-xs text-slate-400">
              已选中 <span className="text-indigo-400 font-bold text-lg">{selectedZones.length}</span> 个区域
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Mode Selection */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'water', label: '灌溉', icon: Droplet, color: 'blue' },
                { id: 'fertilize', label: '施肥', icon: Sprout, color: 'green' },
                { id: 'vent', label: '通风', icon: Wind, color: 'cyan' },
                { id: 'temp', label: '控温', icon: Thermometer, color: 'orange' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setOperationMode(mode.id as any)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                    ${operationMode === mode.id 
                      ? `bg-${mode.color}-500/20 border-${mode.color}-500 text-${mode.color}-400` 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  <mode.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Parameters based on Mode */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-6">
               {operationMode === 'water' && (
                 <>
                   <div>
                     <div className="flex justify-between mb-2 text-sm text-slate-300">
                       <span>灌溉时长</span>
                       <span className="font-mono text-indigo-400">{duration} 分钟</span>
                     </div>
                     <input 
                       type="range" min="5" max="60" step="5" 
                       value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                       className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                   </div>
                   <div>
                     <div className="flex justify-between mb-2 text-sm text-slate-300">
                       <span>水压强度</span>
                       <span className="font-mono text-indigo-400">{intensity}%</span>
                     </div>
                     <input 
                       type="range" min="20" max="100" step="10" 
                       value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
                       className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                     <div className="mt-3 flex gap-2">
                       <label className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 p-2 rounded border border-slate-700 flex-1">
                         <input type="checkbox" className="accent-indigo-500" /> 结束后自动通风
                       </label>
                     </div>
                   </div>
                 </>
               )}
               {operationMode === 'fertilize' && (
                 <div className="space-y-4">
                    {/* AI 分析表单 */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-green-500" />
                        AI 精准施肥分析
                      </label>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">番茄模型</span>
                    </div>
                    
                    {/* 生长周数和温度 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">生长周数</label>
                        <div className="flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-green-500" />
                          <input
                            type="number"
                            value={fertilizerForm.week}
                            onChange={(e) => setFertilizerForm(prev => ({ ...prev, week: parseInt(e.target.value) || 0 }))}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-green-500 outline-none"
                            min="1" max="20"
                          />
                          <span className="text-xs text-slate-500">周</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">环境温度</label>
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-orange-500" />
                          <input
                            type="number"
                            value={fertilizerForm.temp}
                            onChange={(e) => setFertilizerForm(prev => ({ ...prev, temp: parseFloat(e.target.value) || 0 }))}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-green-500 outline-none"
                            step="0.1"
                          />
                          <span className="text-xs text-slate-500">°C</span>
                        </div>
                      </div>
                    </div>

                    {/* NPK 土壤含量 */}
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                      <h4 className="text-xs font-medium text-slate-400 mb-2">土壤养分 (mg/kg)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">氮 (N)</label>
                          <input
                            type="number"
                            value={fertilizerForm.N_soil}
                            onChange={(e) => setFertilizerForm(prev => ({ ...prev, N_soil: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">磷 (P)</label>
                          <input
                            type="number"
                            value={fertilizerForm.P_soil}
                            onChange={(e) => setFertilizerForm(prev => ({ ...prev, P_soil: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-orange-500 outline-none"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">钾 (K)</label>
                          <input
                            type="number"
                            value={fertilizerForm.K_soil}
                            onChange={(e) => setFertilizerForm(prev => ({ ...prev, K_soil: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-purple-500 outline-none"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* pH 和 EC */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">土壤 pH</label>
                        <input
                          type="number"
                          value={fertilizerForm.ph}
                          onChange={(e) => setFertilizerForm(prev => ({ ...prev, ph: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-green-500 outline-none"
                          step="0.1" min="0" max="14"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">EC (mS/cm)</label>
                        <input
                          type="number"
                          value={fertilizerForm.ec}
                          onChange={(e) => setFertilizerForm(prev => ({ ...prev, ec: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-green-500 outline-none"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* AI 分析按钮 */}
                    <button
                      onClick={() => analyzeFertilizer(fertilizerForm)}
                      disabled={fertilizerLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {fertilizerLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        <>
                          <FlaskConical className="w-4 h-4" />
                          AI 分析施肥方案
                        </>
                      )}
                    </button>

                    {/* 错误提示 */}
                    {fertilizerError && (
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-red-400">{fertilizerError}</div>
                      </div>
                    )}

                    {/* 分析结果 */}
                    {fertilizerResult && fertilizerResult.status === 'success' && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        {/* 环境状态 */}
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-400 text-sm">环境: {fertilizerResult.env_status}</span>
                        </div>

                        {/* 养分缺失量 */}
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <h4 className="text-xs font-medium text-slate-400 mb-2">养分缺失分析</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`p-2 rounded text-center ${fertilizerResult.deficits.N > 0 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800'}`}>
                              <div className="text-[10px] text-slate-400">氮 (N)</div>
                              <div className={`text-lg font-bold ${fertilizerResult.deficits.N > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                                {fertilizerResult.deficits.N > 0 ? `-${fertilizerResult.deficits.N.toFixed(1)}` : '✓'}
                              </div>
                            </div>
                            <div className={`p-2 rounded text-center ${fertilizerResult.deficits.P > 0 ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-800'}`}>
                              <div className="text-[10px] text-slate-400">磷 (P)</div>
                              <div className={`text-lg font-bold ${fertilizerResult.deficits.P > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                {fertilizerResult.deficits.P > 0 ? `-${fertilizerResult.deficits.P.toFixed(1)}` : '✓'}
                              </div>
                            </div>
                            <div className={`p-2 rounded text-center ${fertilizerResult.deficits.K > 0 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800'}`}>
                              <div className="text-[10px] text-slate-400">钾 (K)</div>
                              <div className={`text-lg font-bold ${fertilizerResult.deficits.K > 0 ? 'text-purple-400' : 'text-green-400'}`}>
                                {fertilizerResult.deficits.K > 0 ? `-${fertilizerResult.deficits.K.toFixed(1)}` : '✓'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI 建议列表 */}
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                            <Sprout className="w-3 h-3 text-green-500" />
                            AI 施肥建议
                          </h4>
                          <ul className="space-y-1.5">
                            {fertilizerResult.advice_list.map((advice, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                <span className="text-green-500 mt-0.5">•</span>
                                {advice}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 重置按钮 */}
                        <button
                          onClick={resetFertilizer}
                          className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                        >
                          重新分析
                        </button>
                      </div>
                    )}
                 </div>
               )}
               {operationMode === 'vent' && (
                 <div className="text-center py-4 text-slate-400 text-sm">
                   将开启侧窗与顶部天窗，直至环境温度降至 {targetTemp}°C
                 </div>
               )}
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={selectedZones.length === 0 || executing || controlLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
                ${selectedZones.length > 0 && !executing && !controlLoading
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transform hover:scale-[1.02]' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
            >
              {executing || controlLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在执行...
                </>
              ) : (
                <>
                  <Power className="w-5 h-5" />
                  {selectedZones.length === 0 ? '请先选择区域' : '立即执行指令'}
                </>
              )}
            </button>
          </div>

          {/* Operation Log Preview - 需要后端提供操作日志 API */}
          <div className="bg-slate-900 border-t border-slate-800 p-4 max-h-48 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" /> 近期操作审计
            </h3>
            <div className="text-center py-4 text-slate-500 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>暂无操作日志</p>
              <p className="mt-1">需要后端提供操作日志 API</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Main Wrapper ---
export const UserOperation: React.FC = () => {
  const { mode } = useViewMode();

  if (mode === ViewMode.MINIMAL) return <MinimalOperator />;
  if (mode === ViewMode.EXPERT) return <ExpertOperator />;
  return <StandardOperator />;
};