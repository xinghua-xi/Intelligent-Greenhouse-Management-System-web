/**
 * 智慧温室 API 客户端
 */

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
  Diagnosis,
  ChatRequest,
  ChatResponse,
  SpeechToTextRequest,
  SpeechToTextResponse,
  EnvironmentData,
  NodeStatus,
  UserInfo,
  CreateUserRequest,
  UpdateUserRequest,
  Article,
  CreateArticleRequest,
  UpdateArticleRequest,
  SoilData,
  SoilHistoryRange,
  FertilizerAnalyzeRequest,
  FertilizerAnalyzeResponse
} from './types';

// ==================== 配置 ====================

// 使用相对路径，让 Vite 代理处理请求转发
const BASE_URL = '';
const TOKEN_KEY = 'smart_greenhouse_token';
const USER_KEY = 'smart_greenhouse_user';

// ==================== 请求封装 ====================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // HTTP 错误处理
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // 可选：跳转登录页
      // window.location.href = '/login';
      throw new Error('未授权，请重新登录');
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();

    // 业务错误处理
    if (data.code !== 200) {
      throw new Error(data.msg || '请求失败');
    }

    return data.data;
  }

  // ==================== Auth API ====================

  async login(data: LoginRequest): Promise<LoginData> {
    const result = await this.request<LoginData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // 保存 Token 和用户信息
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // ==================== Device API ====================

  async getGreenhouses(): Promise<Greenhouse[]> {
    return this.request<Greenhouse[]>('/devices/greenhouses');
  }

  async getGreenhouseDetail(id: string): Promise<GreenhouseDetail> {
    return this.request<GreenhouseDetail>(`/devices/greenhouses/${id}/detail`);
  }

  async controlDevice(deviceId: string, command: ControlRequest): Promise<string> {
    return this.request<string>(`/devices/${deviceId}/control`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  // ==================== Data API ====================

  async uploadSensorData(data: SensorData): Promise<string> {
    return this.request<string>('/data/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== AI API ====================

  /** 智慧问答 */
  async chat(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** 语音转文字 */
  async speechToText(data: SpeechToTextRequest): Promise<SpeechToTextResponse> {
    return this.request<SpeechToTextResponse>('/ai/speech-to-text', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** 获取 AI 托管建议 */
  async getRecommendation(): Promise<Decision> {
    return this.request<Decision>('/ai/decision/recommend');
  }

  /** 获取智能排产任务 */
  async getScheduleTasks(): Promise<AiTask[]> {
    return this.request<AiTask[]>('/ai/schedule/tasks');
  }

  // ==================== Vision API ====================

  /** 病虫害识别 */
  async diagnosePlant(data: DiagnosisRequest): Promise<Diagnosis> {
    return this.request<Diagnosis>('/vision/diagnosis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== Environment Data API ====================

  /** 获取环境数据（温湿度、光照等） */
  async getEnvironmentData(greenhouseId?: string, range?: '1h' | '24h' | '7d'): Promise<EnvironmentData[]> {
    const params = new URLSearchParams();
    if (greenhouseId) params.append('greenhouseId', greenhouseId);
    if (range) params.append('range', range);
    const query = params.toString();
    return this.request<EnvironmentData[]>(`/data/environment${query ? `?${query}` : ''}`);
  }

  // ==================== Node Status API ====================

  /** 获取传感器节点状态 */
  async getNodeStatus(greenhouseId?: string): Promise<NodeStatus[]> {
    const query = greenhouseId ? `?greenhouseId=${greenhouseId}` : '';
    return this.request<NodeStatus[]>(`/devices/nodes${query}`);
  }

  // ==================== User Management API ====================

  /** 获取用户列表 */
  async getUsers(): Promise<UserInfo[]> {
    return this.request<UserInfo[]>('/auth/users');
  }

  /** 获取用户详情 */
  async getUser(id: string): Promise<UserInfo> {
    return this.request<UserInfo>(`/auth/users/${id}`);
  }

  /** 创建用户 */
  async createUser(data: CreateUserRequest): Promise<UserInfo> {
    return this.request<UserInfo>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** 更新用户 */
  async updateUser(id: string, data: UpdateUserRequest): Promise<UserInfo> {
    return this.request<UserInfo>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /** 删除用户 */
  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Knowledge Articles API ====================

  /** 获取文章列表 */
  async getArticles(category?: string, cropType?: string): Promise<Article[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (cropType) params.append('cropType', cropType);
    const query = params.toString();
    return this.request<Article[]>(`/ai/articles${query ? `?${query}` : ''}`);
  }

  /** 搜索文章 */
  async searchArticles(keyword: string): Promise<Article[]> {
    return this.request<Article[]>(`/ai/articles/search?keyword=${encodeURIComponent(keyword)}`);
  }

  /** 获取热门文章 */
  async getHotArticles(): Promise<Article[]> {
    return this.request<Article[]>('/ai/articles/hot');
  }

  /** 获取文章详情 */
  async getArticle(id: string): Promise<Article> {
    return this.request<Article>(`/ai/articles/${id}`);
  }

  /** 创建文章 */
  async createArticle(data: CreateArticleRequest): Promise<Article> {
    return this.request<Article>('/ai/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** 更新文章 */
  async updateArticle(id: string, data: UpdateArticleRequest): Promise<Article> {
    return this.request<Article>(`/ai/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /** 删除文章 */
  async deleteArticle(id: string): Promise<void> {
    return this.request<void>(`/ai/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Fertilizer Analysis API ====================

  /** 获取土壤数据 */
  async getSoilData(): Promise<SoilData> {
    // 通过 Vite 代理调用数据服务
    const response = await fetch('/api/soil/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取土壤数据失败: ${response.status}`);
    }
    
    const result: ApiResponse<SoilData> = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || '获取土壤数据失败');
    }
    return result.data;
  }

  /** 获取土壤历史数据 */
  async getSoilHistory(range: SoilHistoryRange = '24h'): Promise<SoilData[]> {
    const response = await fetch(`/api/soil/history?range=${range}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取土壤历史数据失败: ${response.status}`);
    }
    
    const result: ApiResponse<SoilData[]> = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || '获取土壤历史数据失败');
    }
    return result.data;
  }

  /** 番茄精准施肥分析 */
  async analyzeFertilizer(data: FertilizerAnalyzeRequest): Promise<FertilizerAnalyzeResponse> {
    // 通过 Vite 代理调用模型服务
    const response = await fetch('/api/fertilizer/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`施肥分析请求失败: ${response.status}`);
    }
    
    return response.json();
  }
}

// ==================== 导出单例 ====================

export const api = new ApiClient(BASE_URL);
export default api;
