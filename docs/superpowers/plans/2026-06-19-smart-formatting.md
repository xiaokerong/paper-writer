# 智能论文排版系统 — 实施计划

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 PaperCraft 系统上新增「智能排版」模块，支持 AI 识别论文结构、6套模板排版、样式自定义，导出规范 Word 文档。

**Architecture:** 新增 `format_engine.py`（AI结构识别+排版引擎）+ 6个模板 JSON；修改 `main.py`（3个新API）、`App.tsx`（第三个Tab）、`api.ts`、`types.ts`。复用现有 `paper_engine.py` 的 `_call_deepseek`。

**Tech Stack:** Python FastAPI + python-docx + DeepSeek API + React 19 + TypeScript + Tailwind CSS

## Global Constraints

- 不破坏已有的论文生成和文本润色功能
- 覆盖优先级：用户 overrides > 模板默认值 > 系统硬编码默认
- 中文文件名须 RFC 5987 编码
- 字体须用 `qn('w:eastAsia')` 保证跨平台

---

### Task 1: 6 个模板 JSON 配置文件

**Files:**
- Create: `backend/templates/undergrad_thesis.json`
- Create: `backend/templates/course_paper.json`
- Create: `backend/templates/review_article.json`
- Create: `backend/templates/tech_report.json`
- Create: `backend/templates/journal_cn.json`
- Create: `backend/templates/custom.json`

**Produces:** 6个 JSON 文件，每个符合 TemplateConfig schema

---

### Task 2: format_engine.py 排版引擎

**Files:**
- Create: `backend/format_engine.py`

**Produces:** `detect_structure(raw_text) -> dict`, `load_template(template_name) -> dict`, `apply_template(paper, template, overrides) -> bytes`

---

### Task 3: main.py 新增 API

**Files:**
- Modify: `backend/main.py`

**Produces:** `POST /api/format/detect`, `POST /api/format/export`, `GET /api/format/templates`

---

### Task 4: types.ts + api.ts 扩展

**Files:**
- Modify: `frontend/paper-writer-app/src/types.ts`
- Modify: `frontend/paper-writer-app/src/api.ts`

**Produces:** 新类型 + `detectPaperStructure`, `exportFormattedDocx`, `fetchTemplates`

---

### Task 5: App.tsx 排版 Tab UI

**Files:**
- Modify: `frontend/paper-writer-app/src/App.tsx`

**Produces:** 完整排版 Tab 交互

---

### Task 6: 端到端验证

**Files:** 无新增，验证所有导入和编译
