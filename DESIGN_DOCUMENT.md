# 绿智云棚 - 智能大棚管理系统设计文档

## 一、项目概述

### 1.1 项目名称
绿智云棚 (GreenSmart Greenhouse) - Arduino 智能大棚管理系统

### 1.2 项目定位
基于 React + TypeScript + Vite 构建的现代化智能农业物联网前端管理平台，集成数据可视化、3D 数字孪生、AI 智能决策等功能。

### 1.3 技术栈
| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| UI 样式 | Tailwind CSS (CDN) |
| 图表库 | Recharts |
| 3D 渲染 | Three.js |
| 图标库 | Lucide React |
| 字体 | Inter (Google Fonts) |

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx (主容器)                      │
│  ┌─────────────┐  ┌──────────────────────────────────────┐  │
│  │   Sidebar   │  │            Main Content              │  │
│  │  (侧边导航)  │  │  ┌────────────────────────────────┐  │  │
│  │             │  │  │  Dashboard / Greenhouse /       │  │  │
│  │  • 数据驾驶舱 │  │  │  SmartSchedule / KnowledgeBase │  │  │
│  │  • 农事作业  │  │  │  / UserOperation               │  │  │
│  │  • 3D孪生   │  │  └────────────────────────────────┘  │  │
│  │  • AI排产   │  │                                      │  │
│  │  • 知识库   │  └──────────────────────────────────────┘  │
│  │             │                                            │
│  │  [模式切换]  │  ┌──────────────────────────────────────┐  │
│  │  标准/专家/极简│  │         GlobalChat (AI 助手)         │  │
│  └─────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 文件结构

```
src/
├── App.tsx              # 主应用组件，路由与状态管理
├── index.tsx            # 应用入口
├── types.ts             # TypeScript 类型定义
└── components/
    ├── Sidebar.tsx      # 侧边导航栏
    ├── Dashboard.tsx    # 数据驾驶舱（核心仪表盘）
    ├── Greenhouse.tsx   # 3D 数字孪生场景
    ├── SmartSchedule.tsx# AI 智能排产系统
    ├── KnowledgeBase.tsx# 专家知识库
    ├── UserOperation.tsx# 农事作业中心
    └── GlobalChat.tsx   # 全局 AI 对话助手
```

---

## 三、核心功能模块

### 3.1 数据驾驶舱 (Dashboard)

#### 功能描述
系统核心监控面板，实时展示大棚环境数据、设备状态、区域健康度等关键指标。

#### 三种显示模式

| 模式 | 目标用户 | 特点 |
|------|---------|------|
| 标准模式 (Standard) | 运营人员 | 均衡展示，图表+卡片+快捷操作 |
| 专家模式 (Expert) | 工程师/技术员 | 高密度数据表、终端控制台、PWM 精确控制 |
| 极简模式 (Minimal) | 管理层/大屏展示 | 大字体健康度环、一键 AI 调优 |

#### 核心组件
- **气象卡片**: 外部温度、风向、湿度、降雨概率
- **KPI 指标卡**: 土壤水分、光照量(DLI)、预计采收时间
- **环境趋势图**: 温度/湿度/光照/CO2 时序曲线 (Recharts AreaChart)
- **资源液位**: 清水箱、营养液 A/B 可视化液位计
- **区域健康度**: 4 区域健康评分网格
- **快捷操作**: 智能托管、强力通风、紧急灌溉、报警重置

#### 专家模式特有
- **LoRa MESH 拓扑表**: 节点 ID、角色、RSSI 信号、电量、状态
- **调试控制台**: 实时日志流、命令行输入
- **PWM 精确控制**: 风机转速、补光灯强度滑块
- **传感器相关性分析**: 温度-电压双 Y 轴折线图

---

### 3.2 3D 数字孪生 (Greenhouse)

#### 功能描述
基于 Three.js 构建的交互式 3D 大棚场景，支持鼠标拖拽旋转、点击查看区域详情。

#### 场景元素
- **玻璃温室结构**: 半透明材质 + 边框线条
- **4 个种植区块**: 
  - A区 茄果类 (樱桃番茄) - 健康
  - B区 叶菜类 (水培生菜) - 警告 (水分过低)
  - C区 育苗床 (辣椒幼苗) - 健康
  - D区 实验田 (草莓) - 严重 (检测到红蜘蛛)
- **状态指示灯**: 底部 LED 条 (绿/橙/红)
- **AR 浮动标签**: 警告区域上方悬浮提示气泡

#### 交互功能
- 鼠标拖拽旋转视角
- 点击区块弹出详情侧边栏
- 自动巡检模式 (持续旋转)
- 详情面板: 土壤水分、温度、生长进度、AI 建议

---

### 3.3 农事作业中心 (UserOperation)

#### 功能描述
面向不同角色的农事操作界面，支持批量作业、人员调度、设备控制。

#### 三种视图模式

| 模式 | 视图名称 | 目标用户 | 核心功能 |
|------|---------|---------|---------|
| 极简 | 作物画廊 | 参观者/业主 | 大图卡片展示、产量预估 |
| 标准 | 指挥中心 | 农场管理员 | 多区域选择、批量灌溉/施肥/通风、人员任务指派 |
| 专家 | 硬件注册表 | 工程师 | 设备引脚映射、电流监控、总线数据流、底层覆写 |

#### 标准模式核心功能
- **区域多选**: 点击卡片选中/取消，支持全选
- **作业类型**: 灌溉、施肥、通风、控温
- **参数配置**: 时长滑块、强度滑块、配方选择
- **人员调度**: 显示值班人员状态，支持任务指派
- **操作审计**: 近期操作日志流

---

### 3.4 AI 智能排产 (SmartSchedule)

#### 功能描述
基于物候数据与作物生长模型的智能任务调度系统。

#### 核心组件
- **任务列表**: 待执行/进行中/已完成任务卡片
- **AI 置信度**: 每个任务显示 AI 推荐置信度百分比
- **优化预警**: VPD 异常检测、灌溉时机建议
- **资源预测**: 用水量、肥料库存进度条

#### 任务类型
- 灌溉 (irrigation)
- 施肥 (fertilizer)
- 采摘 (harvest)
- 维护 (maintenance)

---

### 3.5 专家知识库 (KnowledgeBase)

#### 功能描述
集成 AI 诊断助手与农业知识文章库。

#### 核心组件
- **搜索栏**: 全局知识检索入口
- **AI 诊断对话**: 模拟与 AI 助手的多轮对话
- **知识文章卡片**: 分类标签 (病害/系统/营养/虫害)

#### AI 对话示例
- 土壤 EC 值分析
- 营养配方计算
- 指令下发确认

---

### 3.6 全局 AI 助手 (GlobalChat)

#### 功能描述
悬浮于页面右下角的智能对话窗口，支持自然语言指令。

#### 交互特性
- 点击气泡图标展开/收起
- 预设快捷问题按钮
- 打字机效果回复动画
- 关键词识别响应 (温度、虫害、灌溉等)

#### 响应逻辑示例
| 用户输入关键词 | AI 响应 |
|--------------|--------|
| 温度/状态 | 返回全棚温度概览 |
| 虫/病/红蜘蛛 | 调用视觉模型分析，给出处理建议 |
| 灌溉/水 | 分析土壤含水量，建议灌溉方案 |
| 执行/是/开启 | 下发指令至 Arduino 控制器 |

---

## 四、数据模型 (types.ts)

### 4.1 枚举类型

```typescript
// 系统状态
enum SystemStatus {
  OPTIMAL = 'OPTIMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  OFFLINE = 'OFFLINE'
}

// 导航页面
enum NavPage {
  DASHBOARD = 'DASHBOARD',
  USER_APP = 'USER_APP',
  DIGITAL_TWIN = 'DIGITAL_TWIN',
  SCHEDULER = 'SCHEDULER',
  KNOWLEDGE = 'KNOWLEDGE'
}

// 显示模式
enum ViewMode {
  STANDARD = 'STANDARD',  // 标准模式
  EXPERT = 'EXPERT',      // 专家模式
  MINIMAL = 'MINIMAL'     // 极简模式
}
```

### 4.2 核心接口

```typescript
// 传感器数据
interface SensorData {
  id: string;
  type: 'soil' | 'air' | 'energy' | 'water';
  value: number;
  unit: string;
  label: string;
  trend: 'up' | 'down' | 'stable';
}

// 能源统计
interface EnergyStats {
  solarInput: number;    // 太阳能输入 (W)
  piezoInput: number;    // 压电能量 (W)
  batteryLevel: number;  // 电池电量 (%)
  gridStatus: 'connected' | 'disconnected';
}

// 任务
interface Task {
  id: string;
  title: string;
  date: string;
  type: 'irrigation' | 'fertilizer' | 'harvest' | 'maintenance';
  status: 'pending' | 'in-progress' | 'completed';
  aiConfidence: number;
}

// 知识文章
interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'pest' | 'disease' | 'nutrition' | 'system';
  summary: string;
  date: string;
}
```

---

## 五、状态管理

### 5.1 全局状态 (Context)

```typescript
// 显示模式上下文
interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

export const ViewModeContext = createContext<ViewModeContextType>({
  mode: ViewMode.STANDARD,
  setMode: () => {},
});
```

### 5.2 页面级状态
- `currentPage`: 当前导航页面
- `mode`: 当前显示模式
- 各组件内部状态 (如 Dashboard 的 `autoMode`, `ventActive` 等)

---

## 六、UI/UX 设计规范

### 6.1 配色方案

| 用途 | 颜色值 | 说明 |
|------|-------|------|
| 主背景 | `#0f172a` (slate-950) | 深色主题背景 |
| 卡片背景 | `#1e293b` (slate-800) | 内容卡片 |
| 边框 | `#334155` (slate-700) | 分隔线 |
| 主强调色 | `#4f46e5` (indigo-600) | 按钮、选中态 |
| 成功/健康 | `#22c55e` (green-500) | 正常状态 |
| 警告 | `#f59e0b` (orange-500) | 需关注 |
| 危险 | `#ef4444` (red-500) | 严重警告 |

### 6.2 字体规范
- 主字体: Inter (Google Fonts)
- 专家模式: `font-mono` 等宽字体
- 标题: `font-bold`, 24-32px
- 正文: 14px
- 辅助文字: 12px, `text-slate-400`

### 6.3 动效规范
- 页面切换: `animate-in fade-in duration-500`
- 卡片悬停: `hover:scale-[1.02]`, `transition-all`
- 加载状态: `animate-spin`, `animate-pulse`
- 3D 场景: 60fps 渲染循环

---

## 七、响应式设计

### 7.1 断点策略
- 移动端: 单列布局
- 平板 (md): 2 列网格
- 桌面 (lg): 3-4 列网格，侧边栏固定

### 7.2 侧边栏适配
- 标准/专家模式: `w-64` (256px)
- 极简模式: `w-20` (80px)，仅显示图标

---

## 八、扩展性设计

### 8.1 预留接口
- 传感器数据: 当前为 Mock 数据，可替换为 WebSocket/REST API
- AI 对话: 可对接 LLM API (如 OpenAI, Claude)
- 设备控制: 可通过 MQTT/HTTP 对接 Arduino/ESP32

### 8.2 模块化组件
- 所有页面组件独立，可按需加载
- 图表组件可复用 (Recharts 配置化)
- 3D 场景可扩展更多交互对象

---

## 九、部署说明

### 9.1 开发环境
```bash
npm install
npm run dev
```

### 9.2 生产构建
```bash
npm run build
```

### 9.3 环境变量
- `.env.local`: 本地开发配置

---

## 十、版本信息

| 项目 | 版本 |
|------|------|
| 文档版本 | v1.0 |
| React | ^19.2.3 |
| Vite | ^7.3.0 |
| Three.js | ^0.182.0 |
| Recharts | ^3.6.0 |

---

*文档生成日期: 2025年12月21日*
