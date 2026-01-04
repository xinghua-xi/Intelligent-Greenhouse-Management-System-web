import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type {
  Greenhouse,
  GreenhouseDetail,
  Decision,
  AiTask,
  ControlRequest,
  LoginRequest,
  LoginData,
  Diagnosis,
  DiagnosisRequest,
  ChatRequest,
  ChatResponse,
  EnvironmentData,
  NodeStatus,
  UserInfo,
  Article,
  SoilData,
  SoilHistoryRange,
  FertilizerAnalyzeRequest,
  FertilizerAnalyzeResponse
} from '../api/types';

// ==================== 通用 Hook ====================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ==================== Auth Hook ====================

export function useAuth() {
  const [user, setUser] = useState(api.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginData | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(credentials);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: api.isAuthenticated(),
    loading,
    error,
    login,
    logout
  };
}

// ==================== Greenhouses Hook ====================

export function useGreenhouses() {
  const [state, setState] = useState<UseApiState<Greenhouse[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchGreenhouses = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getGreenhouses();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取大棚列表失败'
      });
    }
  }, []);

  useEffect(() => {
    fetchGreenhouses();
  }, [fetchGreenhouses]);

  return { ...state, refetch: fetchGreenhouses };
}

// ==================== Greenhouse Detail Hook ====================

export function useGreenhouseDetail(id: string | null) {
  const [state, setState] = useState<UseApiState<GreenhouseDetail>>({
    data: null,
    loading: false,
    error: null
  });
  const fetchedRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id || fetchedRef.current === id) return;
    fetchedRef.current = id;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getGreenhouseDetail(id);
      setState({ data, loading: false, error: null });
    } catch (err) {
      console.error('获取大棚详情失败:', err);
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取大棚详情失败'
      });
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const refetch = useCallback(() => {
    fetchedRef.current = null;
    fetchDetail();
  }, [fetchDetail]);

  return { ...state, refetch };
}

// ==================== Device Control Hook ====================

export function useDeviceControl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlDevice = useCallback(async (
    deviceId: string,
    command: ControlRequest
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.controlDevice(deviceId, command);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '控制指令发送失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { controlDevice, loading, error };
}

// ==================== AI Recommendation Hook ====================

export function useAiRecommendation() {
  const [state, setState] = useState<UseApiState<Decision>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchRecommendation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getRecommendation();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取 AI 建议失败'
      });
    }
  }, []);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  return { ...state, refetch: fetchRecommendation };
}

// ==================== AI Tasks Hook ====================

export function useAiTasks() {
  const [state, setState] = useState<UseApiState<AiTask[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchTasks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getScheduleTasks();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取任务列表失败'
      });
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { ...state, refetch: fetchTasks };
}

// ==================== Plant Diagnosis Hook ====================

export function usePlantDiagnosis() {
  const [state, setState] = useState<UseApiState<Diagnosis>>({
    data: null,
    loading: false,
    error: null
  });

  const diagnose = useCallback(async (request: DiagnosisRequest): Promise<Diagnosis | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.diagnosePlant(request);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '病害识别失败'
      });
      return null;
    }
  }, []);

  return { ...state, diagnose };
}


// ==================== AI Chat Hook ====================

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = useCallback(async (request: ChatRequest): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.chat(request);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 对话失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { chat, loading, error };
}

// ==================== Environment Data Hook ====================

export function useEnvironmentData(greenhouseId?: string, range?: '1h' | '24h' | '7d') {
  const [state, setState] = useState<UseApiState<EnvironmentData[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getEnvironmentData(greenhouseId, range);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取环境数据失败'
      });
    }
  }, [greenhouseId, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ==================== Node Status Hook ====================

export function useNodeStatus(greenhouseId?: string) {
  const [state, setState] = useState<UseApiState<NodeStatus[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getNodeStatus(greenhouseId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取节点状态失败'
      });
    }
  }, [greenhouseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ==================== Users Hook ====================

export function useUsers() {
  const [state, setState] = useState<UseApiState<UserInfo[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchUsers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getUsers();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取用户列表失败'
      });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { ...state, refetch: fetchUsers };
}

// ==================== Articles Hook ====================

export function useArticles(category?: string, cropType?: string) {
  const [state, setState] = useState<UseApiState<Article[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchArticles = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getArticles(category, cropType);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取文章列表失败'
      });
    }
  }, [category, cropType]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { ...state, refetch: fetchArticles };
}

export function useHotArticles() {
  const [state, setState] = useState<UseApiState<Article[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchArticles = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getHotArticles();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取热门文章失败'
      });
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { ...state, refetch: fetchArticles };
}

export function useSearchArticles() {
  const [state, setState] = useState<UseApiState<Article[]>>({
    data: null,
    loading: false,
    error: null
  });

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.searchArticles(keyword);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '搜索文章失败'
      });
    }
  }, []);

  return { ...state, search };
}

// ==================== Soil Data Hook ====================

export function useSoilData() {
  const [state, setState] = useState<UseApiState<SoilData>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getSoilData();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取土壤数据失败'
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ==================== Soil History Hook ====================

export function useSoilHistory(range: SoilHistoryRange = '24h') {
  const [state, setState] = useState<UseApiState<SoilData[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getSoilHistory(range);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '获取土壤历史数据失败'
      });
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ==================== Fertilizer Analysis Hook ====================

export function useFertilizerAnalysis() {
  const [state, setState] = useState<UseApiState<FertilizerAnalyzeResponse>>({
    data: null,
    loading: false,
    error: null
  });

  const analyze = useCallback(async (request: FertilizerAnalyzeRequest): Promise<FertilizerAnalyzeResponse | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.analyzeFertilizer(request);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '施肥分析失败'
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}
