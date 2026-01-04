/**
 * 智慧温室 API 客户端示例
 * 基于 Axios 封装，可直接用于 React/Vue/Angular 项目
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginData,
  Greenhouse,
  GreenhouseDetail,
  ControlRequest,
  SensorData,
  Decision,
  AiTask,
  DiagnosisRequest,
  Diagnosis
} from './typescript-types';

// ==================== 配置 ====================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'smart_greenhouse_token';

// ==================== Axios 实例 ====================

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================== 请求拦截器 ====================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== 响应拦截器 ====================

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, msg } = response.data;
    
    // 业务错误处理
    if (code !== 200) {
      // 可以在这里统一处理业务错误
      console.error(`[API Error] ${code}: ${msg}`);
      return Promise.reject(new Error(msg));
    }
    
    return response;
  },
  (error) => {
    // HTTP 错误处理
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储并跳转登录
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== Auth API ====================

export const authApi = {
  /** 用户登录 */
  async login(data: LoginRequest): Promise<LoginData> {
    const response = await apiClient.post<ApiResponse<LoginData>>('/auth/login', data);
    const { token } = response.data.data;
    // 自动保存 Token
    localStorage.setItem(TOKEN_KEY, token);
    return response.data.data;
  },

  /** 退出登录 */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  /** 检查是否已登录 */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

// ==================== Device API ====================

export const deviceApi = {
  /** 获取大棚列表 */
  async getGreenhouses(): Promise<Greenhouse[]> {
    const response = await apiClient.get<ApiResponse<Greenhouse[]>>('/devices/greenhouses');
    return response.data.data;
  },

  /** 获取大棚详情（含分区和设备） */
  async getGreenhouseDetail(id: string): Promise<GreenhouseDetail> {
    const response = await apiClient.get<ApiResponse<GreenhouseDetail>>(
      `/devices/greenhouses/${id}/detail`
    );
    return response.data.data;
  },

  /** 发送设备控制指令 */
  async controlDevice(deviceId: string, command: ControlRequest): Promise<string> {
    const response = await apiClient.post<ApiResponse<string>>(
      `/devices/${deviceId}/control`,
      command
    );
    return response.data.data;
  }
};

// ==================== Data API ====================

export const dataApi = {
  /** 上传传感器数据 */
  async uploadSensorData(data: SensorData): Promise<string> {
    const response = await apiClient.post<ApiResponse<string>>('/data/upload', data);
    return response.data.data;
  }
};

// ==================== AI API ====================

export const aiApi = {
  /** 获取 AI 托管建议 */
  async getRecommendation(): Promise<Decision> {
    const response = await apiClient.get<ApiResponse<Decision>>('/ai/decision/recommend');
    return response.data.data;
  },

  /** 获取智能排产任务 */
  async getScheduleTasks(): Promise<AiTask[]> {
    const response = await apiClient.get<ApiResponse<AiTask[]>>('/ai/schedule/tasks');
    return response.data.data;
  }
};

// ==================== Vision API ====================

export const visionApi = {
  /** 病害识别 */
  async diagnosePlant(data: DiagnosisRequest): Promise<Diagnosis> {
    const response = await apiClient.post<ApiResponse<Diagnosis>>('/vision/diagnosis', data);
    return response.data.data;
  }
};

// ==================== 导出统一入口 ====================

export const api = {
  auth: authApi,
  device: deviceApi,
  data: dataApi,
  ai: aiApi,
  vision: visionApi
};

export default api;

// ==================== 使用示例 ====================
/*
import api from './api-client';

// 登录
const { token, user } = await api.auth.login({ username: 'admin', password: '123456' });

// 获取大棚列表
const greenhouses = await api.device.getGreenhouses();

// 获取大棚详情
const detail = await api.device.getGreenhouseDetail('gh_001');

// 发送控制指令
await api.device.controlDevice('actuator_001', { action: 'IRRIGATION', duration: 300 });

// 获取 AI 建议
const decision = await api.ai.getRecommendation();

// 病害识别
const diagnosis = await api.vision.diagnosePlant({ imageUrl: 'https://...' });
*/
