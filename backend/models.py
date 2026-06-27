"""数据模型定义 — 统一管理所有 Pydantic 请求/响应模型"""
from pydantic import BaseModel, Field
from typing import Optional


# ═══════════════════════════════════════════
# v1.0 论文生成/润色
# ═══════════════════════════════════════════

class PaperGenerateRequest(BaseModel):
    topic: str = Field(..., description="论文主题", min_length=2)
    keywords: list[str] = Field(default=[], description="关键词列表")
    outline: str = Field(default="", description="用户提供的大纲")
    paper_type: str = Field(default="课程论文", description="论文类型")
    language: str = Field(default="中文", description="输出语言")
    citations: list[dict] = Field(default=[], description="引用文献列表")


class PaperResponse(BaseModel):
    id: str
    topic: str
    title: str
    abstract: str
    sections: list[dict]  # [{heading: str, content: str}]
    conclusion: str
    references: list[str]
    full_text: str


class PolishRequest(BaseModel):
    text: str = Field(..., description="待润色的文本")
    mode: str = Field(default="academic", description="润色模式: grammar/academic/expand/condense")
    context: str = Field(default="", description="上下文（如前后的段落）")


class PolishResponse(BaseModel):
    original: str
    polished: str
    changes: list[str]  # 具体修改说明
    mode: str


class MultiRoundRequest(BaseModel):
    paper_id: str
    instruction: str = Field(..., description="用户的修改指令")
    target_section: str = Field(default="", description="目标章节，空表示全文")


class ExportRequest(BaseModel):
    paper_id: str
    format: str = Field(default="docx", description="导出格式")


class PaperHistory(BaseModel):
    paper_id: str
    messages: list[dict] = []  # [{role: str, content: str}]


# ═══════════════════════════════════════════
# v1.0 智能排版
# ═══════════════════════════════════════════

class FormatDetectRequest(BaseModel):
    raw_text: str
    paper_id: str = ""


class FormatExportRequest(BaseModel):
    paper_data: dict
    template: str = "gbt7713"
    style_overrides: dict = {}


# ═══════════════════════════════════════════
# v2.0 全流程模块
# ═══════════════════════════════════════════

class TopicRequest(BaseModel):
    field: str
    level: str = "本科"
    count: int = 8


class LiteratureSearchRequest(BaseModel):
    topic: str
    keywords: list[str] = []
    year_from: int = 2020
    limit: int = 20


class LiteratureReviewRequest(BaseModel):
    topic: str
    selected_papers: list[dict]
    language: str = "中文"


class ProposalRequest(BaseModel):
    topic: str
    background: str = ""
    citations: list[dict] = []
    paper_type: str = "本科毕业论文"


class PlagiarismAnalyzeRequest(BaseModel):
    text: str


class PlagiarismReduceRequest(BaseModel):
    text: str
    mode: str = "smart"


# ═══════════════════════════════════════════
# v2.1 图表生成 & 选题可视化
# ═══════════════════════════════════════════

class ChartGenerateRequest(BaseModel):
    paper_data: dict
    chart_types: list[str] = []


class ChartTablesRequest(BaseModel):
    paper_data: dict
    count: int = 3


class TopicTrendRequest(BaseModel):
    keyword: str
    start_year: int = 2018
    end_year: int = 2025


class TopicCompareRequest(BaseModel):
    keywords: list[str]


class WordCloudRequest(BaseModel):
    field: str
    max_words: int = 60


class CitationRequest(BaseModel):
    keyword: str
    limit: int = 20


class KeywordNetworkRequest(BaseModel):
    field: str


class HotspotRequest(BaseModel):
    field: str
    years: int = 5
