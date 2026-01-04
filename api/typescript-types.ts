/**
 * 智慧温室 API TypeScript 类型定义
 * 供前端项目直接使用
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
  defaultMode: 'EXPERT' | 'STANDARD' | 'MINIMAL';
  createdAt: string;
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
  coordinates: [number, number]; // [lng, lat]
}

export interface Greenhouse {
  id: string;
  name: string;
  crop: string;
  status: GreenhouseStatus;
  healthScore: number;
  location?: GeoPoint;
  createdAt: string;
}

export interface Zone {
  id: string;
  name: string;
  greenhouseId: string;
  cropType: string;
  status: ZoneStatus;
}

export interface Actuator {
  id: string;
  name: string;
  zoneId: string;
  type: DeviceType;
  currentValue: string;
  autoMode: boolean;
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

// ==================== Vision ====================

export type PlantCondition = 'healthy' | 'pest' | 'disease';

export interface DiagnosisRequest {
  imageUrl: string;
}

export interface Diagnosis {
  condition: PlantCondition;
  disease: string;
  confidence: number;
  treatment: string[];
}

// ==================== API 响应类型别名 ====================

export type LoginResponse = ApiResponse<LoginData>;
export type GreenhouseListResponse = ApiResponse<Greenhouse[]>;
export type GreenhouseDetailResponse = ApiResponse<GreenhouseDetail>;
export type ControlResponse = ApiResponse<string>;
export type DecisionResponse = ApiResponse<Decision>;
export type TaskListResponse = ApiResponse<AiTask[]>;
export type DiagnosisResponse = ApiResponse<Diagnosis>;
