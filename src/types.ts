
export enum SystemStatus {
  OPTIMAL = 'OPTIMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  OFFLINE = 'OFFLINE'
}

export interface SensorData {
  id: string;
  type: 'soil' | 'air' | 'energy' | 'water';
  value: number;
  unit: string;
  label: string;
  trend: 'up' | 'down' | 'stable';
}

export interface EnergyStats {
  solarInput: number; // Watts
  piezoInput: number; // Watts
  batteryLevel: number; // Percentage
  gridStatus: 'connected' | 'disconnected';
}

export interface Task {
  id: string;
  title: string;
  date: string;
  type: 'irrigation' | 'fertilizer' | 'harvest' | 'maintenance';
  status: 'pending' | 'in-progress' | 'completed';
  aiConfidence: number; // AI recommendation confidence
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'pest' | 'disease' | 'nutrition' | 'system';
  summary: string;
  date: string;
}

export enum NavPage {
  DASHBOARD = 'DASHBOARD',
  USER_APP = 'USER_APP', // 农户作业端
  DIGITAL_TWIN = 'DIGITAL_TWIN',
  SCHEDULER = 'SCHEDULER',
  KNOWLEDGE = 'KNOWLEDGE'
}

export enum ViewMode {
  STANDARD = 'STANDARD', // 标准模式：均衡
  EXPERT = 'EXPERT',     // 专家模式：高密度、数据表、Raw Data
  MINIMAL = 'MINIMAL'    // 极简模式：大字体、状态概览、Zen Mode
}