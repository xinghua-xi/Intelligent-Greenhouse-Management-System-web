# Mock 服务说明

在后端接口开发完成之前，前端可以使用 Mock 数据进行开发。

## 方案一：使用 Postman Mock Server

1. 导入 `postman_collection.json`
2. 在 Postman 中创建 Mock Server
3. 使用生成的 Mock URL 替换 `baseUrl`

## 方案二：使用 json-server（推荐本地开发）

### 安装

```bash
npm install -g json-server
```

### 创建 Mock 数据文件

创建 `db.json`：

```json
{
  "greenhouses": [
    {
      "id": "gh_001",
      "name": "1号温室",
      "crop": "樱桃番茄",
      "status": "NORMAL",
      "healthScore": 85
    },
    {
      "id": "gh_002",
      "name": "2号温室",
      "crop": "黄瓜",
      "status": "WARNING",
      "healthScore": 62
    }
  ],
  "zones": [
    {
      "id": "zone_001",
      "name": "A区 茄果类",
      "greenhouseId": "gh_001",
      "cropType": "樱桃番茄",
      "status": "HEALTHY"
    }
  ],
  "actuators": [
    {
      "id": "actuator_001",
      "name": "1号风机",
      "zoneId": "zone_001",
      "type": "FAN",
      "currentValue": "ON",
      "autoMode": true
    },
    {
      "id": "actuator_002",
      "name": "顶部补光灯",
      "zoneId": "zone_001",
      "type": "LIGHT",
      "currentValue": "80%",
      "autoMode": false
    }
  ],
  "tasks": [
    {
      "id": "task_01",
      "type": "irrigation",
      "status": "pending",
      "aiConfidence": 0.88
    },
    {
      "id": "task_02",
      "type": "fertilizer",
      "status": "pending",
      "aiConfidence": 0.75
    }
  ]
}
```

### 启动 Mock Server

```bash
json-server --watch db.json --port 3001
```

### 访问地址

- 大棚列表：`GET http://localhost:3001/greenhouses`
- 分区列表：`GET http://localhost:3001/zones?greenhouseId=gh_001`
- 设备列表：`GET http://localhost:3001/actuators?zoneId=zone_001`

---

## 方案三：使用 MSW（Mock Service Worker）

适合 React/Vue 项目，可在浏览器中拦截请求。

### 安装

```bash
npm install msw --save-dev
```

### 配置示例

```javascript
// src/mocks/handlers.js
import { rest } from 'msw'

export const handlers = [
  // 登录
  rest.post('/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        code: 200,
        msg: 'Success',
        data: {
          token: 'mock-jwt-token-xxx',
          user: {
            id: 'user_001',
            username: 'admin',
            role: 'EXPERT'
          }
        }
      })
    )
  }),

  // 大棚列表
  rest.get('/devices/greenhouses', (req, res, ctx) => {
    return res(
      ctx.json({
        code: 200,
        msg: 'Success',
        data: [
          { id: 'gh_001', name: '1号温室', crop: '樱桃番茄', status: 'NORMAL', healthScore: 85 },
          { id: 'gh_002', name: '2号温室', crop: '黄瓜', status: 'WARNING', healthScore: 62 }
        ]
      })
    )
  }),

  // AI 建议
  rest.get('/ai/decision/recommend', (req, res, ctx) => {
    return res(
      ctx.json({
        code: 200,
        msg: 'Success',
        data: {
          action: 'IRRIGATION',
          reason: '检测到土壤含水量(28%)低于设定阈值(30%)',
          confidence: 0.92
        }
      })
    )
  }),

  // 病害识别
  rest.post('/vision/diagnosis', (req, res, ctx) => {
    return res(
      ctx.json({
        code: 200,
        msg: 'Success',
        data: {
          condition: 'pest',
          disease: '红蜘蛛 (Spider Mite)',
          confidence: 0.96,
          treatment: ['增加环境湿度', '使用捕食螨进行生物防治']
        }
      })
    )
  })
]
```

---

## Mock 数据约定

为保证前后端联调顺利，Mock 数据需遵循以下规范：

1. 所有响应使用统一结构 `{ code, msg, data }`
2. ID 格式：`{类型}_{序号}`，如 `gh_001`、`zone_001`
3. 枚举值与文档保持一致
4. 时间格式：ISO 8601（`2024-01-15T10:30:00`）
