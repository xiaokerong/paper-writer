"""Render 部署入口 - 转发到 backend 模块"""
import os
import sys

# 将 backend 目录加入 Python 路径
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

# 导入并启动 FastAPI 应用
from main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
