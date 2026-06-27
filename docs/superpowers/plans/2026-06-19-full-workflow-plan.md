# PaperCraft v2.0 全流程系统 — 实施计划

> **Goal:** 新增 6 个引擎 + 重写前端为 7 模块导航

**Architecture:** 新增 6 后端文件 + 改造现有 3 文件 + 重写前端

**Tech Stack:** Python FastAPI + DeepSeek + Semantic Scholar + python-docx + React 19 + TypeScript + Tailwind

## Global Constraints
- Semantic Scholar 无 Key 也能跑（免费 tier）
- 文献综述严禁 AI 虚构引用
- 所有模块共享 SharedPaperState
- 不破坏已有功能

---

### Task 1: semantic_scholar.py — API 客户端

**Files:** Create `backend/semantic_scholar.py`
**Produces:** `search_papers(query, limit, year_from) -> list`, `get_paper_details(paper_id) -> dict`

### Task 2: literature_engine.py — 文献综述引擎  

**Files:** Create `backend/literature_engine.py`
**Produces:** `search_literature(topic, keywords) -> dict`, `generate_review(topic, papers) -> dict`

### Task 3: topic_engine.py + proposal_engine.py — 选题+开题

**Files:** Create `backend/topic_engine.py`, `backend/proposal_engine.py`

### Task 4: plagiarism_engine.py + chart_engine.py — 查重+图表

**Files:** Create `backend/plagiarism_engine.py`, `backend/chart_engine.py`

### Task 5: 增强 paper_engine + polish_engine

**Files:** Modify `backend/paper_engine.py`, `backend/polish_engine.py`

### Task 6: main.py — 新增 ~12 个 API

**Files:** Modify `backend/main.py`

### Task 7: 前端 types.ts + api.ts

**Files:** Modify `frontend/.../src/types.ts`, `frontend/.../src/api.ts`

### Task 8: App.tsx — 7 模块 UI 大改

**Files:** Modify `frontend/.../src/App.tsx`

### Task 9: 验证
