# PaperCraft v2.0 全流程学术写作系统 — 设计规范

> 版本: 2.0 | 日期: 2026-06-19 | 状态: 待实现
> 基于 v1.0 智能排版系统的全流程升级

---

## 1. 概述

在现有 PaperCraft「论文生成 + 文本润色 + 智能排版」基础上，升级为覆盖论文全生命周期的七大模块系统。核心突破：**文献综述基于 Semantic Scholar 真实学术数据库，杜绝 AI 虚构引用**。

### 核心价值

| v1.0 (当前) | v2.0 (升级后) |
|------------|-------------|
| 3 个 Tab：生成/润色/排版 | 7 大模块：选题/文献/开题/查重/撰写/改稿/排版 |
| AI 生成参考文献（可能虚构） | Semantic Scholar 真实文献 + DOI 标注 |
| 纯文本输出 | 支持图表规划建议 + 真实引用联动 |
| 单一论文视角 | 全流程覆盖，模块间自由跳转共享数据 |

### 七大模块

```
📋 选题推荐  →  📚 文献综述  →  📝 开题报告  →  🔍 查重降重  →  ✍️ 论文撰写  →  🔄 AI改稿  →  📐 智能排版
 (新增)        (新增·核心)      (新增)         (新增)        (已有·增强)    (已有·增强)    (已完成)
```

---

## 2. 系统架构

### 新增后端文件

| 文件 | 说明 |
|------|------|
| `backend/topic_engine.py` | 选题推荐引擎（AI 生成选题 + 背景分析） |
| `backend/literature_engine.py` | 文献综述引擎（Semantic Scholar API + AI 综述撰写） |
| `backend/semantic_scholar.py` | Semantic Scholar API 客户端封装 |
| `backend/proposal_engine.py` | 开题报告生成引擎 |
| `backend/plagiarism_engine.py` | AI 查重分析引擎（原创度评分 + 段落标注） |
| `backend/chart_engine.py` | 图表规划引擎（AI 建议图表 + 生成简单表格） |

### 修改后端文件

| 文件 | 变更 |
|------|------|
| `backend/main.py` | 新增 ~12 个 API 端点 |
| `backend/paper_engine.py` | 增强：支持传入真实引用列表 |
| `backend/polish_engine.py` | 增强：新增「降重改写」模式 |
| `backend/format_engine.py` | 已完成（v1.0）✅ |

### 前端文件变更

| 文件 | 变更 |
|------|------|
| `frontend/.../src/App.tsx` | 大改：7 模块水平导航 + 共享状态管理 |
| `frontend/.../src/api.ts` | 新增 ~15 个 API 函数 |
| `frontend/.../src/types.ts` | 新增 ~12 个接口/类型 |
| `frontend/.../src/components/` | 新增模块专属组件（或保持单文件大组件） |

### 新增依赖

```
# backend/requirements.txt 新增
httpx  # 已有 ✅
# semantic-scholar API 无需额外包，httpx 直接调用
```

### 架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                         React Frontend (Vite)                        │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐                │
│  │ 选题 │ 文献 │ 开题 │ 查重 │ 撰写 │ 改稿 │ 排版 │  7模块水平导航  │
│  └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┘                │
│     └──────┴──────┴──────┴──┬───┴──────┴──────┘                     │
│                             │                                        │
│                    共享状态: SharedPaperState                        │
│              { paperData, citations, chartPlans, ... }               │
├─────────────────────────────┼────────────────────────────────────────┤
│                      FastAPI Backend                                 │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌──────────┐            │
│  │ topic_   │ │literature_ │ │ proposal_  │ │plagiarism│            │
│  │ engine   │ │ engine     │ │ engine     │ │_engine   │            │
│  └────┬─────┘ └─────┬─────┘ └─────┬──────┘ └────┬─────┘            │
│       │             │             │              │                   │
│  ┌────┴─────┐ ┌─────┴─────┐ ┌────┴──────┐ ┌────┴──────┐            │
│  │ chart_   │ │semantic_  │ │ paper_    │ │ polish_   │            │
│  │ engine   │ │scholar.py │ │ engine    │ │ engine    │            │
│  └────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘            │
│       │             │             │              │                   │
│  ┌────┴─────────────┴─────────────┴──────────────┴────┐            │
│  │              format_engine (v1.0)                   │            │
│  └────────────────────────────────────────────────────┘            │
│                                                                      │
│  ┌──────────────┐  ┌─────────────────────┐                          │
│  │ DeepSeek API │  │ Semantic Scholar API│  外部服务                  │
│  │ (AI 生成)    │  │ (真实文献检索)       │                          │
│  └──────────────┘  └─────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 组件详细设计

### 3.1 📚 文献综述引擎 — 核心模块

#### 3.1.1 Semantic Scholar API 客户端 (`semantic_scholar.py`)

```python
# 搜索论文
async def search_papers(query: str, limit: int = 20, year_from: int = 2020) -> list[dict]:
    """
    调用 Semantic Scholar API 搜索论文
    GET https://api.semanticscholar.org/graph/v1/paper/search
    
    返回每条论文:
    {
      "paperId": "xxx",
      "title": "论文标题",
      "authors": [{"name": "作者名"}],
      "year": 2024,
      "venue": "期刊/会议名",
      "citationCount": 引用次数,
      "abstract": "摘要（如有）",
      "externalIds": {"DOI": "10.xxx", "ArXiv": "xxx"},
      "url": "https://api.semanticscholar.org/xxx"
    }
    """

# 获取论文详情
async def get_paper_details(paper_id: str) -> dict:
    """获取单篇论文的完整信息，包括参考文献列表"""

# 批量获取论文引用信息
async def get_citations(paper_ids: list[str]) -> list[dict]:
    """批量获取多篇论文的被引用信息"""
```

**API 限制**: 免费 tier 100 请求/5分钟，无需 API Key。使用 `httpx.AsyncClient` 异步调用。

**关键实现**: 在 `httpx.AsyncClient` 中设置 `timeout=30.0`，处理限流（429）时返回友好错误提示。

#### 3.1.2 文献综述引擎 (`literature_engine.py`)

```
用户流程:
1. 输入选题关键词 → Semantic Scholar 搜索 → 返回 15-20 篇真实论文
2. 用户勾选感兴趣论文（5-20 篇）→ AI 阅读摘要 → 撰写综述
3. 输出: 综述正文（带引用编号 [1][2]...）+ 结构化引用列表
```

```python
async def search_literature(topic: str, keywords: list[str], year_from: int = 2020) -> dict:
    """搜索相关文献"""
    # 1. 用 topic + keywords 构建查询
    # 2. 调用 semantic_scholar.search_papers()
    # 3. 返回 { papers: [...], total_count: N }

async def generate_review(topic: str, selected_papers: list[dict], style: str = "academic") -> dict:
    """基于用户选中的真实论文撰写综述"""
    # 1. 构建 prompt：论文列表（标题/作者/摘要）
    # 2. 调用 DeepSeek 撰写综述
    # 3. 要求：每个观点标注引用编号，不虚构任何论文
    # 4. 返回 { review_text: str, citations: [...] }
```

**Prompt 核心约束**:
```
你是一位学术文献综述专家。请基于以下真实论文列表撰写文献综述。

你必须严格遵循：
1. 只引用下方列表中给出的论文，绝不虚构任何论文
2. 每条引用使用编号 [1][2]...标注在句中
3. 综述要按主题逻辑组织，不要简单罗列
4. 如有不确定之处，跳过该论文，不要编造内容

可选的真实论文列表：
[1] 作者 (年份). 标题. 期刊. DOI: xxx
    摘要: xxx
[2] 作者 (年份). 标题. 期刊. DOI: xxx
    摘要: xxx
...

请撰写文献综述（返回JSON）：
{
  "review_text": "综述正文（2000-4000字，带引用编号）",
  "citations": [
    {"index": 1, "full_text": "作者 (年份). 标题. 期刊. DOI"},
    ...
  ]
}
```

#### 3.1.3 图表规划功能 (`chart_engine.py`)

论文中的数据分析可视化建议：

```python
async def suggest_charts(paper_data: dict) -> dict:
    """AI 分析论文内容，建议适合加入图表的位置和类型"""
    # 返回:
    # {
    #   "suggestions": [
    #     {
    #       "section": "三、研究方法",
    #       "chart_type": "flowchart",  # 流程图
    #       "title": "研究技术路线图",
    #       "description": "建议用流程图展示从数据采集到结果分析的全流程",
    #       "data_points": ["步骤1: xxx", "步骤2: xxx", ...]
    #     },
    #     {
    #       "section": "四、实验结果",
    #       "chart_type": "bar_chart",  # 柱状图
    #       "title": "不同方法的准确率对比",
    #       "description": "建议对比3-5种方法的准确率数据",
    #       "data_points": [{"label": "方法A", "value": "95.2%"}, ...]
    #     }
    #   ],
    #   "generatable_tables": [...]  # 可自动生成文本表格
    # }

async def generate_text_table(data: list[dict], title: str) -> str:
    """生成纯文本/Markdown 表格，可直接插入论文"""
```

---

### 3.2 📋 选题推荐引擎 (`topic_engine.py`)

```python
async def recommend_topics(
    field: str,           # 学科领域
    level: str = "本科",  # 本科/硕士/博士
    count: int = 8       # 推荐数量
) -> dict:
    """AI 推荐研究选题"""
    # 返回:
    # {
    #   "topics": [
    #     {
    #       "title": "选题标题",
    #       "background": "研究背景（100-200字）",
    #       "innovation": "创新点",
    #       "feasibility": "可行性分析",
    #       "suggested_keywords": ["关键词1", "关键词2"],
    #       "difficulty": "中等"  # 简单/中等/困难
    #     }
    #   ]
    # }
```

---

### 3.3 📝 开题报告引擎 (`proposal_engine.py`)

```python
async def generate_proposal(
    topic: str,
    background: str,
    citations: list[dict],  # 文献综述产出的引用列表
    paper_type: str = "本科毕业论文"
) -> dict:
    """生成开题报告"""
    # 输出结构:
    # {
    #   "sections": [
    #     {"heading": "一、研究背景与意义", "content": "..."},
    #     {"heading": "二、国内外研究现状", "content": "..."},
    #     {"heading": "三、研究目标与内容", "content": "..."},
    #     {"heading": "四、研究方法与技术路线", "content": "..."},
    #     {"heading": "五、研究计划与进度", "content": "..."},
    #     {"heading": "六、预期成果与创新点", "content": "..."},
    #     {"heading": "七、参考文献", "content": "..."}
    #   ],
    #   "references": [...]
    # }
```

---

### 3.4 🔍 查重降重引擎 (`plagiarism_engine.py`)

```python
async def analyze_originality(text: str) -> dict:
    """AI 分析文本原创度（无外部数据库的纯 AI 方案）"""
    # 将文本分块，AI 分析每块:
    # - 判断是否可能是通用表达/模板句式
    # - 标注"高相似风险"段落
    # - 给出整体原创度评分 (0-100)
    # 返回:
    # {
    #   "overall_score": 78,
    #   "segments": [
    #     {"text": "...", "score": 92, "risk": "low", "comment": "表述独特"},
    #     {"text": "...", "score": 45, "risk": "high", "comment": "与常见表述高度相似"},
    #   ],
    #   "summary": "整体原创度良好，第3、7段存在较高相似风险，建议改写"
    # }

async def reduce_similarity(text: str, mode: str = "smart") -> dict:
    """AI 改写降重（增强版润色）"""
    # mode: smart(智能改写) / structure(结构调整) / synonym(同义替换)
    # 在现有 polish_engine.py 基础上新增降重 Prompt
    # 返回: { "rewritten": str, "changes": [...], "similarity_reduction": "估计降低X%" }
```

---

### 3.5 论文撰写与 AI 改稿（增强）

**撰写**：现有 `paper_engine.py` 增强 — 支持 `citations` 参数，将真实引用列表传入 AI：

```python
async def generate_paper(
    topic, keywords, outline, paper_type, language,
    citations: list[dict] = None  # 🆕 可选的真实引用列表
) -> dict
```

**改稿**：现有 `polish_engine.py` 增强 — 新增 `de plagiarize` 模式（降重改写）。

---

### 3.6 智能排版（v1.0 已完成）

✅ 无需变动，已有 6 套模板 + AI 结构识别 + 自定义样式。

---

## 4. 数据流设计

### 4.1 共享状态管理 (`SharedPaperState`)

所有模块共享一个核心状态对象：

```typescript
interface SharedPaperState {
  // 选题模块
  selectedTopic: TopicSuggestion | null;
  
  // 文献综述模块
  searchedPapers: ResearchPaper[];   // Semantic Scholar 搜索结果
  selectedPapers: ResearchPaper[];    // 用户勾选的论文
  literatureReview: string;          // 综述正文
  citations: Citation[];             // 结构化引用列表
  
  // 开题报告模块
  proposal: ProposalData | null;
  
  // 查重模块
  plagiarismReport: PlagiarismReport | null;
  
  // 图表规划
  chartSuggestions: ChartSuggestion[];
  
  // 论文数据（核心，贯穿全流程）
  paperData: PaperData | null;
}
```

### 4.2 模块间数据流转

```
📋 选题 ──selectedTopic──→ 📚 文献 ──citations──→ 📝 开题
  │                           │                      │
  │                     selectedPapers               │
  │                           │                      │
  └─────── 都可以作为 ────────→ ✍️ 撰写 ←─────────────┘
                                  │
                                  ↓
                            🔄 改稿 → 🔍 查重
                                  │
                                  ↓
                            📐 排版 → 📥 导出
```

任何模块都可以独立启动，但模块间数据可自动传递。

---

## 5. 前端设计

### 5.1 布局升级

从 3 Tab 垂直切换 → **7 模块水平导航栏 + 左侧操作面板 + 右侧预览**：

```
┌──────────────────────────────────────────────────────────────┐
│  PaperCraft v2.0  │ 📋选题 │ 📚文献 │ 📝开题 │ 🔍查重 │ ✍️撰写 │ 🔄改稿 │ 📐排版 │
├───────────────────────────┴──────────────────────────────────┤
│  左侧面板 (420px)              │  右侧面板 (flex-1)            │
│                                │                              │
│  ┌──────────────────────┐     │  ┌────────────────────────┐  │
│  │ 当前模块专属操作区域   │     │  │ 实时论文预览 / 结果展示 │  │
│  │                      │     │  │                        │  │
│  │ [选题推荐输入框]      │     │  │ 标题: xxx              │  │
│  │ [推荐按钮]            │     │  │ 摘要: xxx              │  │
│  │ [选题卡片列表]        │     │  │ 章节: ...              │  │
│  └──────────────────────┘     │  │ 引用文献: ...           │  │
│                                │  └────────────────────────┘  │
│  ┌──────────────────────┐     │                              │
│  │ 全局状态指示器        │     │  [图表建议面板]             │
│  │ 📄有论文  📚有文献    │     │                              │
│  └──────────────────────┘     │                              │
└───────────────────────────────┴──────────────────────────────┘
```

### 5.2 7 个模块的左侧面板内容

| 模块 | 左侧面板内容 |
|------|------------|
| 📋 选题 | 学科领域输入 → 选题卡片列表（可选中） → 详细信息展开 |
| 📚 文献 | 关键词搜索 → 论文列表（勾选） → 生成综述按钮 → 综述/引用预览 |
| 📝 开题 | 选题确认 → 引用确认 → 生成开题报告按钮 → 报告预览 |
| 🔍 查重 | 粘贴文本 → 开始分析 → 热力图展示 → 逐段降重 |
| ✍️ 撰写 | 现有的生成 Tab UI（论文主题/关键词/大纲 → 生成） |
| 🔄 改稿 | 现有的润色 Tab UI + 新增降重模式 |
| 📐 排版 | 现有的排版 Tab UI ✅ |

### 5.3 右侧面板 — 多视图切换

右侧面板显示当前选中的内容，支持两个视图：

1. **论文预览视图**: 展示 `paperData`（标题、摘要、章节正文、引用）
2. **模块结果视图**: 展示当前模块的产出（如文献综述列表、查重报告、图表建议）

---

## 6. API 设计

### 6.1 新增端点总览

| 方法 | 路径 | 说明 | 所属引擎 |
|------|------|------|---------|
| POST | `/api/topic/recommend` | 推荐选题 | topic_engine |
| POST | `/api/literature/search` | 搜索文献 | literature_engine |
| POST | `/api/literature/review` | 生成综述 | literature_engine |
| POST | `/api/literature/paper/{id}` | 获取论文详情 | semantic_scholar |
| POST | `/api/proposal/generate` | 生成开题报告 | proposal_engine |
| POST | `/api/plagiarism/analyze` | 原创度分析 | plagiarism_engine |
| POST | `/api/plagiarism/reduce` | 降重改写 | plagiarism_engine |
| POST | `/api/chart/suggest` | 图表规划建议 | chart_engine |
| POST | `/api/chart/table` | 生成文本表格 | chart_engine |
| POST | `/api/generate` | 论文生成（增强：支持 citations） | paper_engine |
| POST | `/api/polish` | 润色（增强：支持 de plagiarize 模式） | polish_engine |

### 6.2 请求/响应示例

#### 文献搜索

```python
# POST /api/literature/search
{
  "topic": "人工智能教育",
  "keywords": ["个性化学习", "智能辅导"],
  "year_from": 2020,
  "limit": 20
}

# 响应
{
  "papers": [
    {
      "paperId": "abc123",
      "title": "AI-Driven Personalized Learning: A Review",
      "authors": ["Smith J.", "Brown K."],
      "year": 2024,
      "venue": "Journal of Educational Technology",
      "citationCount": 156,
      "abstract": "This paper reviews...",
      "doi": "10.1234/xxx"
    },
    ...
  ],
  "total_count": 234
}
```

#### 文献综述生成

```python
# POST /api/literature/review
{
  "topic": "人工智能在高等教育中的应用",
  "selected_papers": [
    {"paperId": "abc123", "title": "...", "authors": [...], "year": 2024, "abstract": "...", "doi": "..."},
    ...
  ]
}

# 响应
{
  "review_text": "在人工智能与教育融合领域，Smith和Brown（2024）系统回顾了个性化学习...[1]...",
  "citations": [
    {"index": 1, "full_text": "Smith J., Brown K. (2024). AI-Driven Personalized Learning: A Review. Journal of Educational Technology. DOI: 10.1234/xxx"}
  ]
}
```

#### 查重分析

```python
# POST /api/plagiarism/analyze
{
  "text": "人工智能技术正在深刻改变..."
}

# 响应
{
  "overall_score": 78,
  "summary": "整体原创度良好，第3段存在较高相似风险",
  "segments": [
    {"text": "...", "score": 92, "risk": "low", "comment": "表述独特"},
    {"text": "...", "score": 45, "risk": "high", "comment": "与常见表述高度相似"}
  ]
}
```

---

## 7. TypeScript 类型扩展

```typescript
// ── 新增核心类型 ──

export interface TopicSuggestion {
  title: string;
  background: string;
  innovation: string;
  feasibility: string;
  suggestedKeywords: string[];
  difficulty: '简单' | '中等' | '困难';
}

export interface ResearchPaper {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  citationCount: number;
  abstract: string;
  doi: string;
  selected: boolean;  // 用户是否勾选
}

export interface Citation {
  index: number;
  fullText: string;
}

export interface LiteratureReview {
  reviewText: string;
  citations: Citation[];
}

export interface ProposalSection {
  heading: string;
  content: string;
}

export interface ProposalData {
  sections: ProposalSection[];
  references: Citation[];
}

export interface PlagiarismSegment {
  text: string;
  score: number;
  risk: 'low' | 'medium' | 'high';
  comment: string;
}

export interface PlagiarismReport {
  overallScore: number;
  summary: string;
  segments: PlagiarismSegment[];
}

export interface ChartSuggestion {
  section: string;
  chartType: 'bar_chart' | 'line_chart' | 'flowchart' | 'table' | 'pie_chart' | 'scatter';
  title: string;
  description: string;
  dataPoints: Record<string, unknown>[];
}

// ── SharedPaperState ──
export interface SharedPaperState {
  selectedTopic: TopicSuggestion | null;
  searchedPapers: ResearchPaper[];
  selectedPapers: ResearchPaper[];
  literatureReview: LiteratureReview | null;
  proposal: ProposalData | null;
  plagiarismReport: PlagiarismReport | null;
  chartSuggestions: ChartSuggestion[];
  paperData: PaperData | null;
}
```

---

## 8. 错误处理

| 场景 | 处理 |
|------|------|
| Semantic Scholar API 不可用 | 前端提示"文献检索服务暂时不可用"，建议用户稍后重试或手动输入文献 |
| Semantic Scholar 限流 (429) | `semantic_scholar.py` 返回明确错误码，前端提示"请求过于频繁，请1分钟后重试" |
| AI 文献综述仍虚构引用 | Prompt 强制约束 + 后端校验：综述中的引用编号必须在 citations 列表中存在 |
| 查重分析文本过短 (< 100 字) | 返回提示 "文本过短，无法有效分析" |
| 模块间数据缺失 | 前端按钮禁用 + 提示"请先在 XX 模块完成 XX" |

---

## 9. 测试策略

| 测试类型 | 覆盖范围 |
|---------|---------|
| 单元测试 | `semantic_scholar.py` API 解析、`_map_overrides`、`_deep_merge` |
| 集成测试 | 文献搜索 → 综述生成 → 论文撰写（引用联动）端到端 |
| E2E | 完整选题→文献→开题→撰写→查重→排版流程 |
| Mock | Semantic Scholar 离线 Mock 数据（不受 API 限流影响） |

---

## 10. 实现顺序

| 阶段 | 内容 | 预计文件数 |
|------|------|-----------|
| Phase 1 | `semantic_scholar.py` + `literature_engine.py` | 2 新文件 |
| Phase 2 | `topic_engine.py` + `proposal_engine.py` | 2 新文件 |
| Phase 3 | `chart_engine.py` + `plagiarism_engine.py` | 2 新文件 |
| Phase 4 | `main.py` 新增 12 个 API | 1 修改 |
| Phase 5 | 增强 `paper_engine.py` + `polish_engine.py` | 2 修改 |
| Phase 6 | 前端类型 + API 层 (`types.ts` + `api.ts`) | 2 修改 |
| Phase 7 | 前端 UI (`App.tsx` 7 模块布局) | 1 大改 |
| Phase 8 | 端到端测试 | — |

---

## 11. 文件变更总览

| 操作 | 文件数 |
|------|--------|
| 新建 | 6 个后端 Python 文件 |
| 修改 | 3 个后端 + 3 个前端 |
