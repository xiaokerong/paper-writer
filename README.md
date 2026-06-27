# 课程论文智能写作与润色系统

## 环境要求
- Python 3.10+
- Node.js 18+
- DeepSeek API Key

## 启动方式

### 1. 配置API Key
编辑 `backend/.env`，填入DeepSeek API Key:
```
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 2. 启动后端
```bash
cd backend
pip install -r requirements.txt
python main.py
```
后端运行在 http://localhost:8000

### 3. 启动前端
```bash
cd frontend/paper-writer-app
npm install
npm run dev
```
前端运行在 http://localhost:5173

## API接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/generate | 生成论文 |
| POST | /api/polish | 润色文本 |
| POST | /api/revise | 多轮修改 |
| GET | /api/paper/{id} | 获取论文 |
| GET | /api/export/{id} | 导出Word |
| GET | /api/health | 健康检查 |

## 技术栈
- 前端：React 18 + TypeScript + Tailwind CSS + Vite
- 后端：Python FastAPI + httpx
- AI：DeepSeek v4 API
- 文档：python-docx / docx-js
