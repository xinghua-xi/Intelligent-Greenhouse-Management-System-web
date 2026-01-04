/**
 * 智慧温室 API TypeScript 类型定义
 */

// ==================== 通用 ====================

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/** 分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// ==================== Auth ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  role: 'EXPERT' | 'STANDARD' | 'MINIMAL';
  defaultMode?: 'EXPERT' | 'STANDARD' | 'MINIMAL';
  createdAt?: string;
}

export interface LoginData {
  token: string;
  user: User;
}

// ==================== Device ====================

export type GreenhouseStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type ZoneStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';
export type DeviceType = 'FAN' | 'LIGHT' | 'PUMP' | 'HEATER';
export type ActionType = 'IRRIGATION' | 'VENTILATION' | 'LIGHTING' | 'HEATING';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Greenhouse {
  id: string;
  name: string;
  crop: string;
  status: GreenhouseStatus;
  healthScore: number;
  location?: GeoPoint;
  createdAt?: string;
}

export interface Zone {
  id: string;
  name: string;
  greenhouseId?: string;
  cropType?: string;
  status?: ZoneStatus;
}

export interface Actuator {
  id: string;
  name: string;
  zoneId?: string;
  type: DeviceType;
  currentValue: string;
  autoMode?: boolean;
}

export interface ZoneWithDevices {
  zone: Zone;
  devices: Actuator[];
}

export interface GreenhouseDetail {
  info: Greenhouse;
  zones: ZoneWithDevices[];
}

export interface ControlRequest {
  mode?: string;
  action: ActionType;
  duration?: number;
}

// ==================== Data ====================

export interface SensorData {
  greenhouseId: string;
  temperature: number;
  humidity: number;
}

// ==================== AI ====================

export interface Decision {
  action: ActionType;
  reason: string;
  confidence: number;
}

export type TaskType = 'irrigation' | 'fertilizer' | 'ventilation' | 'lighting';
export type TaskStatus = 'pending' | 'completed' | 'failed';

export interface AiTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  aiConfidence: number;
}

// AI 智慧问答
export interface ChatRequest {
  prompt: string;
  history?: Array<{ role: string; content: string }>;
  greenhouseId?: string;
}

export interface ChatResponse {
  success: boolean;
  text: string;
  model: string;
  timestamp: number;
}

// 语音转文字
export interface SpeechToTextRequest {
  audio: string; // Base64 编码
  format: string; // 如 'm4a'
}

export interface SpeechToTextResponse {
  text: string;
}

// ==================== Vision ====================

export type PlantCondition = 'healthy' | 'pest' | 'disease';

export interface DiagnosisRequest {
  description: string;
  cropType?: string;
}

export interface Diagnosis {
  condition: PlantCondition;
  disease: string;
  confidence: number;
  treatment: string[];
}

// ==================== Environment Data ====================

export interface EnvironmentData {
  time: string;
  temp: number;
  humidity: number;
  light: number;
  co2: number;
  voltage: number;
}

// ==================== Node Status ====================

export interface NodeStatus {
  id: string;
  name: string;
  greenhouseId?: string;
  nodeType: 'SENSOR' | 'ACTUATOR' | 'GATEWAY';
  signalStrength: number;
  battery: number;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  lastHeartbeat: string;
}

// ==================== User Management ====================

export interface UserInfo {
  id: string;
  username: string;
  role: string;
  defaultMode?: string;
  status?: string;
  createdAt?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
  defaultMode?: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: string;
  defaultMode?: string;
}

// ==================== Knowledge Articles ====================

export interface Article {
  id: string;
  title: string;
  category: string;
  cropType?: string;
  author?: string;
  summary?: string;
  content?: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateArticleRequest {
  title: string;
  category: string;
  cropType?: string;
  summary?: string;
  content: string;
}

export interface UpdateArticleRequest {
  title?: string;
  category?: string;
  cropType?: string;
  summary?: string;
  content?: string;
}

// ==================== Fertilizer Analysis ====================

export interface SoilData {
  time?: string;
  week: number;
  N_soil: number;
  P_soil: number;
  K_soil: number;
  ph: number;
  ec: number;
  temp: number;
}

export type SoilHistoryRange = '1h' | '24h' | '7d' | '30d';

export interface FertilizerAnalyzeRequest {
  week: number;
  N_soil: number;
  P_soil: number;
  K_soil: number;
  ph: number;
  ec: number;
  temp: number;
}

export interface FertilizerDeficits {
  N: number;
  P: number;
  K: number;
}

export interface FertilizerAnalyzeResponse {
  status: string;
  env_status: string;
  deficits: FertilizerDeficits;
  advice_list: string[];
}
