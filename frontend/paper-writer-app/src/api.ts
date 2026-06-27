import type {
  PaperData, PolishResult, GenerateRequest, TemplateInfo,
  ResearchPaper, LiteratureReview,
  ProposalData, PlagiarismReport, PlagiarismReduceResult,
  TopicRecommendResult, TopicTrendData, TopicCompareData,
  WordCloudData, CitationAnalysisData,
  ChartGenerateResult,
} from './types';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '请求失败';
    try { const errBody = await res.json(); detail = errBody.detail || JSON.stringify(errBody); }
    catch { detail = `HTTP ${res.status}: ${res.statusText}`; }
    throw new Error(detail);
  }
  return res.json();
}

// ── 论文生成 ──
export async function generatePaper(req: GenerateRequest): Promise<PaperData> {
  const res = await fetch(`${BASE}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
  return handleResponse<PaperData>(res);
}

// ── 文本润色 ──
export async function polishText(text: string, mode: string = 'academic', context: string = ''): Promise<PolishResult> {
  const res = await fetch(`${BASE}/polish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, mode, context }) });
  return handleResponse<PolishResult>(res);
}

export async function revisePaper(paperId: string, instruction: string, targetSection: string = ''): Promise<any> {
  const res = await fetch(`${BASE}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paper_id: paperId, instruction, target_section: targetSection }) });
  return handleResponse(res);
}

// ── 导出 ──
export function getExportUrl(paperId: string): string { return `${BASE}/export/${paperId}`; }

export async function exportDocx(paperData: PaperData): Promise<Blob> {
  const res = await fetch(`${BASE}/export/docx`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paperData) });
  if (!res.ok) { let d = '导出失败'; try { d = (await res.json()).detail || d; } catch { d = `导出失败 (HTTP ${res.status})`; } throw new Error(d); }
  return res.blob();
}

// ── 智能排版 ──
export async function exportFormattedDocx(paperData: PaperData, template: string, styleOverrides?: Record<string, unknown>): Promise<Blob> {
  const res = await fetch(`${BASE}/format/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paper_data: paperData, template, style_overrides: styleOverrides || {} }) });
  if (!res.ok) { let d = '排版导出失败'; try { d = (await res.json()).detail || d; } catch { d = `排版导出失败 (HTTP ${res.status})`; } throw new Error(d); }
  return res.blob();
}

export async function fetchTemplates(): Promise<TemplateInfo[]> {
  const res = await fetch(`${BASE}/format/templates`);
  if (!res.ok) throw new Error('获取模板列表失败');
  const data = await res.json();
  return data.templates;
}

export async function formatPipeline(text: string, file?: File, template: string = 'gbt7713'): Promise<{
  paper: PaperData;
  current_template: string;
  template_info: Record<string, unknown>;
  templates: TemplateInfo[];
}> {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('template_name', template);
  if (file) formData.append('file', file);
  const res = await fetch(`${BASE}/format/pipeline`, { method: 'POST', body: formData });
  return handleResponse(res);
}

// ═══════════════════════════════════════════
// 文献综述
// ═══════════════════════════════════════════
export async function recommendTopics(field: string, level: string = '本科', count: number = 8): Promise<TopicRecommendResult> {
  const res = await fetch(`${BASE}/topic/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field, level, count }) });
  return handleResponse(res);
}

export async function searchLiterature(topic: string, keywords: string[] = [], yearFrom: number = 2020, limit: number = 20): Promise<{ papers: ResearchPaper[]; total_count: number }> {
  const res = await fetch(`${BASE}/literature/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, keywords, year_from: yearFrom, limit }) });
  return handleResponse(res);
}

export async function generateReview(topic: string, selectedPapers: ResearchPaper[], language: string = '中文'): Promise<LiteratureReview> {
  const papers = selectedPapers.map(p => ({ paperId: p.paperId, title: p.title, authors: p.authors, year: p.year, venue: p.venue, abstract: p.abstract, doi: p.doi }));
  const res = await fetch(`${BASE}/literature/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, selected_papers: papers, language }) });
  return handleResponse(res);
}

// 开题报告
export async function generateProposal(topic: string, background: string = '', citations: Array<{ index: number; full_text: string }> = [], paperType: string = '本科毕业论文'): Promise<ProposalData> {
  const res = await fetch(`${BASE}/proposal/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, background, citations, paper_type: paperType }) });
  return handleResponse(res);
}

// 查重分析
export async function analyzeOriginality(text: string): Promise<PlagiarismReport> {
  const res = await fetch(`${BASE}/plagiarism/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  return handleResponse(res);
}

// 降重改写
export async function reduceSimilarity(text: string, mode: string = 'smart'): Promise<PlagiarismReduceResult> {
  const res = await fetch(`${BASE}/plagiarism/reduce`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, mode }) });
  return handleResponse(res);
}

// ═══════════════════════════════════════════
// 可视化分析 API
// ═══════════════════════════════════════════

export async function getTopicTrend(keyword: string, startYear: number = 2018, endYear: number = 2025): Promise<TopicTrendData> {
  const res = await fetch(`${BASE}/topic/trend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, start_year: startYear, end_year: endYear }) });
  return handleResponse(res);
}

export async function compareTopics(keywords: string[]): Promise<TopicCompareData> {
  const res = await fetch(`${BASE}/topic/compare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords }) });
  return handleResponse(res);
}

export async function generateCharts(paperData: PaperData, chartTypes?: string[]): Promise<ChartGenerateResult> {
  const res = await fetch(`${BASE}/chart/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paper_data: paperData, chart_types: chartTypes || [] }) });
  return handleResponse(res);
}

export async function generateTables(paperData: PaperData, count: number = 3): Promise<{ tables: import('./types').TableItem[] }> {
  const res = await fetch(`${BASE}/chart/tables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paper_data: paperData, count }) });
  return handleResponse(res);
}

export async function getWordCloudData(field: string, maxWords: number = 60): Promise<WordCloudData> {
  const res = await fetch(`${BASE}/visual/wordcloud`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field, max_words: maxWords }) });
  return handleResponse(res);
}

export async function getCitationAnalysis(keyword: string, limit: number = 20): Promise<CitationAnalysisData> {
  const res = await fetch(`${BASE}/visual/citations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, limit }) });
  return handleResponse(res);
}

export async function getResearchHotspots(field: string, years: number = 5): Promise<import('./types').HotspotData> {
  const res = await fetch(`${BASE}/visual/hotspots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field, years }) });
  return handleResponse(res);
}

// ═══════════════════════════════════════════
// v2.2 多智能体协作 API
// ═══════════════════════════════════════════
