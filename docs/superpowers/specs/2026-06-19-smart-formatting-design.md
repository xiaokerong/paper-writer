# 智能论文排版系统 — 设计规范

> 版本: 1.0 | 日期: 2026-06-19 | 状态: 待实现

---

## 1. 概述

在现有 PaperCraft「论文生成 + 文本润色」系统基础上，新增第三模块「智能排版」。用户输入纯文本（或复用已生成的论文），AI 自动识别论文结构（标题、作者、摘要、章节、参考文献），选择排版模板并自定义样式，最终导出符合学术规范的 Word 文档。

### 核心价值

| 痛点 | 解决方案 |
|------|---------|
| 论文格式调整耗时且容易出错 | AI 自动识别结构，一键套用模板 |
| 不同场景（课程/毕业/期刊）格式要求不同 | 6 套预置模板覆盖常见场景 |
| 学校有特殊格式要求 | 前端样式面板自由覆盖任意参数 |
| 生成工具和排版工具割裂 | 生成Tab的论文无缝复用到排版Tab |

### 用户流程

```
[场景A] 生成Tab生成论文 → 切到排版Tab → 自动填入 → 选模板 → 导出
[场景B] 粘贴外部文本 → AI识别结构 → 确认/修正 → 选模板 → 自定义 → 导出
```

---

## 2. 系统架构

### 新增文件

| 文件 | 说明 |
|------|------|
| `backend/format_engine.py` | AI 结构识别 + 排版引擎 |
| `backend/templates/undergrad_thesis.json` | 本科毕业论文模板 |
| `backend/templates/course_paper.json` | 课程论文模板 |
| `backend/templates/review_article.json` | 综述文章模板 |
| `backend/templates/tech_report.json` | 技术报告模板 |
| `backend/templates/journal_cn.json` | 中文期刊模板 |
| `backend/templates/custom.json` | 自定义模板（空配置） |

### 修改文件

| 文件 | 变更 |
|------|------|
| `backend/main.py` | 新增 2 个接口 |
| `frontend/.../src/App.tsx` | 新增第三个 Tab + 完整交互逻辑 |
| `frontend/.../src/api.ts` | 新增 API 调用函数 |
| `frontend/.../src/types.ts` | 新增类型定义 |

### 架构图

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                     │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │ 论文生成  │ │ 文本润色  │ │  智能排版 ← NEW    │   │
│  │   Tab     │ │   Tab    │ │ detect → preview   │   │
│  └────┬─────┘ └────┬─────┘ │   → template →      │   │
│       └────────────┼───────│   → customize →     │   │
│                    │       │   → export           │   │
│                    │       └──────────┬───────────┘   │
│                    │                  │                │
│              ─ ─ ─ │ ─ ─ REST API ─ ─│─ ─ ─ ─ ─      │
│                    │                  │                │
├────────────────────┼──────────────────┼────────────────┤
│              FastAPI Backend          │                │
│  ┌──────────┐ ┌────┴───┐ ┌───────────┴───────────┐   │
│  │ paper_   │ │ polish_ │ │ format_engine.py ← NEW│   │
│  │ engine   │ │ engine  │ │  detect_structure()   │   │
│  │          │ │         │ │  apply_template()     │   │
│  └────┬─────┘ └────┬────┘ │  load_template()      │   │
│       └────────────┼──────└───────────┬───────────┘   │
│                    │                  │                │
│                    ▼                  ▼                │
│              ┌─────────────────────────────┐          │
│              │     DeepSeek API            │          │
│              └─────────────────────────────┘          │
│                                                       │
│              ┌─────────────────────────────┐          │
│              │  templates/*.json (6 files) │          │
│              └─────────────────────────────┘          │
└───────────────────────────────────────────────────────┘
```

---

## 3. 组件详细设计

### 3.1 `format_engine.py` — 排版引擎

#### 3.1.1 `detect_structure(raw_text: str) -> dict`

**功能**: 调用 DeepSeek 将任意格式的纯文本解析为结构化 PaperData。

**Prompt 设计要点**:
- 明确定义输出 JSON Schema
- 识别规则：标题（首行/大字号行）、作者（标题下独立行）、摘要（"摘要"/"Abstract"标记段落）、关键词（"关键词"/"Keywords"后冒号分隔）、章节标题（"一、"/"1."/"第x章"）、参考文献（"参考文献"/"References"后的列表）
- 输出格式与现有 `PaperData` 接口完全对齐

**容错机制**:
- 格式遵循 `paper_engine.py` 已有的 `_parse_json` 模式（markdown代码块移除 + JSON解析 + 正则兜底）
- 识别失败时返回明确错误信息，前端展示让用户手动标注

**输入/输出**:
```python
# 输入
{"raw_text": "人工智能对高等教育的影响\n张三\n\n摘要：本文探讨了..."}

# 输出（与 PaperData 接口对齐）
{
  "title": "人工智能对高等教育的影响",
  "author": "张三",
  "abstract": "本文探讨了...",
  "keywords": ["人工智能", "高等教育"],
  "sections": [
    {"heading": "一、引言", "content": "..."},
    ...
  ],
  "conclusion": "...",
  "references": ["[1] 陈某某...", ...]
}
```

#### 3.1.2 `load_template(template_name: str) -> TemplateConfig`

**功能**: 从 `templates/` 目录加载 JSON 模板文件，解析为 `TemplateConfig` 对象。

#### 3.1.3 `apply_template(paper: dict, template: TemplateConfig, overrides: dict) -> bytes`

**功能**: 将结构化论文数据按模板配置生成 Word 文档。

**流程**:
1. 加载模板默认值
2. 合并用户 `overrides`（覆盖优先级：`overrides > template > 系统默认`）
3. 调用 `python-docx` 生成文档
4. 返回 `.docx` 字节流

**集成至现有导出**:
- 复用 `export_engine.py` 中的字体设置（宋体/黑体 `qn('w:eastAsia')`）
- 保留已有的 `python-docx` 调用模式
- 新增模板感知的样式应用

### 3.2 模板系统

#### 模板配置文件结构 (`templates/*.json`)

```json
{
  "name": "模板名称",
  "description": "模板描述",
  "page": {
    "width_cm": 21,
    "height_cm": 29.7,
    "margin_top_cm": 2.54,
    "margin_bottom_cm": 2.54,
    "margin_left_cm": 3.17,
    "margin_right_cm": 3.17
  },
  "title": {
    "font": "黑体",
    "font_eastasia": "黑体",
    "size_pt": 16,
    "bold": true,
    "align": "center"
  },
  "author": {
    "font": "宋体",
    "font_eastasia": "宋体",
    "size_pt": 14,
    "align": "center",
    "show": true
  },
  "abstract": {
    "heading_font": "黑体",
    "heading_size_pt": 14,
    "heading_bold": true,
    "body_font": "宋体",
    "body_size_pt": 12
  },
  "body": {
    "font": "宋体",
    "font_eastasia": "宋体",
    "size_pt": 12,
    "line_spacing": 1.5,
    "first_line_indent_cm": 0.74
  },
  "section_heading": {
    "font": "黑体",
    "font_eastasia": "黑体",
    "size_pt": 14,
    "bold": true
  },
  "reference": {
    "font": "宋体",
    "font_eastasia": "宋体",
    "size_pt": 10.5,
    "format": "GB/T 7714"
  },
  "extras": {}
}
```

#### 六套预置模板差异

| 模板 | 文件 | 正文 | 行距 | 页边距 | 独有特性 |
|------|------|------|------|--------|---------|
| 🎓 本科毕业论文 | `undergrad_thesis.json` | 宋体小四 | 1.5 | 学院规范 | 封面页、独创声明、目录 |
| 📝 课程论文 | `course_paper.json` | 宋体小四 | 1.25 | 稍宽 | 轻量、课程信息栏 |
| 📊 综述文章 | `review_article.json` | 宋体五号 | 1.5 | 标准 | 图表格式、致谢、基金标注 |
| 🛠️ 技术报告 | `tech_report.json` | 宋体/等宽 | 1.15 | 略宽 | 代码块样式、表格样式 |
| 📰 期刊投稿 | `journal_cn.json` | 宋体五号 | 单倍 | 期刊标准 | 两栏可选、作者单位 |
| ✏️ 自定义 | `custom.json` | 空 | 空 | 空 | 全部前端覆盖 |

#### 覆盖优先级

```
用户自定义 overrides (前端面板)
    ↓ 覆盖
模板默认值 (templates/*.json)
    ↓ 兜底
系统硬编码默认值 (format_engine.py)
```

### 3.3 前端设计

#### 3.3.1 新增 Tab

在现有 `['paper', 'polish']` Tab 基础上新增 `'format'`：

```typescript
{['paper', 'polish', 'format'] as const).map(t => (...))}
```

#### 3.3.2 排版Tab状态管理

```typescript
interface FormatState {
  rawText: string;
  detectedPaper: PaperData | null;  // AI识别后的结构化数据
  isDetecting: boolean;             // AI识别进行中
  detectError: string;
  selectedTemplate: string;         // 'undergrad_thesis' | 'course_paper' | ...
  styleOverrides: {
    bodyFont?: string;
    bodySize?: number;
    lineSpacing?: number;
    headingFont?: string;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    refFormat?: string;
  };
  isExporting: boolean;
}
```

#### 3.3.3 与生成Tab联动

```typescript
// 当 paper 状态变化（生成Tab产出论文），自动填充排版Tab
useEffect(() => {
  if (paper && activeTab === 'format') {
    setFormatRawText('');  // 清空文本区
    setFormatDetectedPaper(paper);  // 直接用已有结构化数据
  }
}, [paper, activeTab]);
```

#### 3.3.4 UI 布局

```
┌─ 左侧面板 (420px) ─────────────────────────────┐
│                                                  │
│  [文本输入区 (textarea)]                          │
│  或显示 "已从生成Tab导入论文 ✓"                    │
│                                                  │
│  [🔍 AI自动识别结构] 按钮                          │
│  （已有纸时禁用，显示 "已识别 ✓"）                 │
│                                                  │
│  ── 结构预览 (可编辑) ──                          │
│  标题: [______________]                          │
│  作者: [______________]                          │
│  摘要: [______________]                          │
│  章节1: [标题___] [内容区域___]                   │
│  ...                                             │
│                                                  │
│  ── 模板选择 ──                                   │
│  [🎓本科] [📝课程] [📊综述]                       │
│  [🛠️技术] [📰期刊] [✏️自定义]                     │
│                                                  │
│  ── 样式自定义 ──                                 │
│  正文字体: [宋体 ▾]  字号: [小四 ▾]               │
│  行距: [1.5倍 ▾]    标题字体: [黑体 ▾]            │
│  页边距: 上[__] 下[__] 左[__] 右[__] cm          │
│  参考文献格式: [GB/T 7714 ▾]                      │
│                                                  │
│  [📥 导出规范Word] 按钮                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 3.4 API 设计

#### `POST /api/format/detect`

```python
# 请求
{
  "raw_text": "纯文本论文内容...",
  "paper_id": "可选，有则跳过AI识别直接复用存储的论文"
}

# 响应 200
{
  "title": "...",
  "author": "...",
  "abstract": "...",
  "keywords": [...],
  "sections": [...],
  "conclusion": "...",
  "references": [...]
}

# 响应 500
{"detail": "结构识别失败: AI返回内容无法解析..."}
```

#### `POST /api/format/export`

```python
# 请求
{
  "paper_data": {...},            # 完整的 PaperData
  "template": "undergrad_thesis",  # 模板名称
  "style_overrides": {             # 用户覆盖（可选）
    "bodyFont": "宋体",
    "bodySize": 12,
    "lineSpacing": 1.5,
    "marginTop": 2.54,
    ...
  }
}

# 响应 200
# Content-Disposition: attachment; filename*=UTF-8''...
# Content-Type: application/vnd.openxmlformats-officedocument...
{字节流}
```

#### `GET /api/format/templates`

```python
# 响应 200
{
  "templates": [
    {"id": "undergrad_thesis", "name": "本科毕业论文", "description": "..."},
    {"id": "course_paper", "name": "课程论文", "description": "..."},
    ...
  ]
}
```

### 3.5 TypeScript 类型扩展 (`types.ts`)

```typescript
// 新增
export interface FormatDetectRequest {
  raw_text: string;
  paper_id?: string;
}

export interface FormatExportRequest {
  paper_data: PaperData;
  template: string;
  style_overrides?: StyleOverrides;
}

export interface StyleOverrides {
  bodyFont?: string;
  bodySize?: number;
  lineSpacing?: number;
  headingFont?: string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  refFormat?: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
}

// PaperData 扩展 author 字段
export interface PaperData {
  id: string;
  topic: string;
  title: string;
  author?: string;  // ← 新增
  abstract: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
  references: string[];
  keywords: string[];
}
```

---

## 4. 错误处理

| 场景 | 处理方式 |
|------|---------|
| AI 结构识别失败 | 后端返回明确错误信息，前端展示并允许用户手动填入结构 |
| 模板文件缺失 | 回退至系统默认值（宋体/黑体/标准页边距） |
| 导出时 `python-docx` 异常 | 后端 `traceback.print_exc()`，前端显示 "导出失败: {detail}" |
| 用户未识别就直接导出 | 前端显示提示 "请先进行结构识别或从生成Tab导入论文" |

---

## 5. 测试策略

| 测试类型 | 覆盖范围 |
|---------|---------|
| 单元测试 | `format_engine.py` 的 `load_template`、`apply_template` |
| 集成测试 | `POST /api/format/detect` 用多种格式的纯文本 |
| E2E 测试 | 完整流程：生成 → 排版 → 导出，检查 .docx 输出 |
| 边界测试 | 空文本、纯英文论文、无参考文献、异常超长文本 |

---

## 6. 实现顺序

| 阶段 | 内容 | 预计工作量 |
|------|------|-----------|
| Phase 1 | `format_engine.py` + 6 个模板 JSON | 核心引擎 |
| Phase 2 | `main.py` 新增 3 个接口 | 后端集成 |
| Phase 3 | `types.ts` + `api.ts` 扩展 | 前端基础 |
| Phase 4 | `App.tsx` 排版Tab 完整 UI | 前端主菜 |
| Phase 5 | 端到端测试 + Bug 修复 | 打磨 |
