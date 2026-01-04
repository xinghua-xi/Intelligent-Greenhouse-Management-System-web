import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 代理 API 请求到后端网关
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/devices': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/vision': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 代理施肥分析模型服务
      '/api/fertilizer': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      // 代理土壤数据服务
      '/api/soil/data': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => '/data/soil',
      },
      '/api/soil/history': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/soil/, '/data/soil'),
      },
    },
  },
});