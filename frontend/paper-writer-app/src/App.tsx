import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Download, RotateCcw,
  BookOpen, Lightbulb, Check, Expand, Shrink,
  Search as _Search, BarChart3,
  ChevronDown, ChevronUp, ArrowRight, CheckSquare, Square,
  TrendingUp, Radar, Cloud, Flame, Hash
} from 'lucide-react';
import type {
  PaperData, PolishResult, TemplateInfo, StyleOverrides,
  TopicSuggestion, ResearchPaper, LiteratureReview,
  ProposalData, PlagiarismReport, PlagiarismReduceResult,
  Citation,
  TopicRecommendResult, TopicTrendData, TopicCompareData,
  WordCloudData, HotspotData, CitationAnalysisData,
} from './types';
import {
  generatePaper, polishText, exportDocx,
  exportFormattedDocx, fetchTemplates, formatPipeline,
  recommendTopics, searchLiterature, generateReview,
  generateProposal, analyzeOriginality, reduceSimilarity,
  getTopicTrend, compareTopics, generateCharts, generateTables,
  getWordCloudData, getResearchHotspots, getCitationAnalysis
} from './api';
import {
  TrendLineChart, TopicRadarChart, SingleTopicRadar
} from './ChartComponents';

const MODULES = ['topic', 'literature', 'proposal', 'paper', 'polish', 'plagiarism', 'format'] as const;
type ModuleId = typeof MODULES[number];

const MODULE_LABELS: Record<ModuleId, { label: string; icon: string }> = {
  topic: { label: '选题推荐', icon: '📋' },
  literature: { label: '文献综述', icon: '📚' },
  proposal: { label: '开题报告', icon: '📝' },
  paper: { label: '论文撰写', icon: '✍️' },
  polish: { label: 'AI 改稿', icon: '🔄' },
  plagiarism: { label: '查重降重', icon: '🔍' },
  format: { label: '智能排版', icon: '📐' },
};

const POLISH_MODES = [
  { id: 'academic', label: '学术化', icon: BookOpen, desc: '改写为正式学术表达' },
  { id: 'grammar', label: '语法修正', icon: Check, desc: '修正语法和拼写错误' },
  { id: 'expand', label: '扩写', icon: Expand, desc: '扩展论证深度' },
  { id: 'condense', label: '精简', icon: Shrink, desc: '去除冗余保留要点' },
];

const DEFAULT_TEMPLATES = [
  { id: 'gbt7713', name: 'GB/T 7713 国标', description: '学位论文国家标准格式' },
  { id: 'general', name: '通用排版', description: '通用学术论文格式' },
  { id: 'course_paper', name: '课程论文', description: '日常课程作业格式' },
  { id: 'ieee', name: 'IEEE 会议', description: 'IEEE 会议论文模板' },
  { id: 'acm', name: 'ACM 会议', description: 'ACM 会议论文模板' },
  { id: 'journal', name: '期刊投稿', description: '通用期刊投稿格式' },
];

const TEMPLATE_ICONS: Record<string, string> = {
  gbt7713: '🎓', general: '📄', course_paper: '📝',
  ieee: '⚡', acm: '💻', journal: '📰',
};

// 模板参数速查表：供 UI 展示用（实际排版以模板 JSON 为准）
const TEMPLATE_PARAMS: Record<string, { body: string; title: string; margins: string; sideMargins: string; ref: string; extras: boolean }> = {
  gbt7713: { body: '宋体 12pt / 1.5倍', title: '黑体 18pt', margins: '3.0 / 2.5 cm', sideMargins: '3.0 / 2.5 cm', ref: 'GB/T 7714', extras: true },
  general: { body: '宋体 12pt / 1.5倍', title: '黑体 16pt', margins: '2.54 / 2.54 cm', sideMargins: '3.17 / 3.17 cm', ref: 'GB/T 7714', extras: false },
  course_paper: { body: '宋体 12pt / 1.25倍', title: '黑体 15pt', margins: '2.5 / 2.5 cm', sideMargins: '2.8 / 2.8 cm', ref: 'GB/T 7714', extras: false },
  ieee: { body: 'Times 10pt / 1.0倍', title: 'Times 24pt', margins: '1.78 / 1.78 cm', sideMargins: '1.78 / 1.78 cm', ref: 'IEEE', extras: false },
  acm: { body: 'Times 9pt / 1.0倍', title: 'Times 18pt', margins: '2.54 / 2.54 cm', sideMargins: '1.91 / 1.91 cm', ref: 'ACM', extras: false },
  journal: { body: 'Times 12pt / 2.0倍', title: 'Times 16pt', margins: '2.54 / 2.54 cm', sideMargins: '2.54 / 2.54 cm', ref: 'APA', extras: false },
};

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('paper');
  const [error, setError] = useState('');

  // ═══════════ 共享状态 ═══════════
  const [paperData, setPaperData] = useState<PaperData | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chartSuggestions, setChartSuggestions] = useState<any[]>([]);
  const [generatedTables, setGeneratedTables] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  // ── 段落多选 ──
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<string>>(new Set());

  // ── 论文撰写 ──
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [outline, setOutline] = useState('');
  const [loading, setLoading] = useState(false);

  // ── 润色 ──
  const [polishMode, setPolishMode] = useState('academic');
  const [polishInput, setPolishInput] = useState('');
  const [polishResult, setPolishResult] = useState<PolishResult | null>(null);
  const [polishing, setPolishing] = useState(false);

  // ── 排版 ──
  const [formatRawText, setFormatRawText] = useState('');
  const [detectedPaper, setDetectedPaper] = useState<PaperData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('gbt7713');
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  const [selectedText, setSelectedText] = useState('');
  const [selectionPos, setSelectionPos] = useState<{x:number,y:number}|null>(null);  const [styleOverrides, setStyleOverrides] = useState<StyleOverrides>({});
  const [isExporting, setIsExporting] = useState(false);
  const [formatError, setFormatError] = useState('');
  const [formatFile, setFormatFile] = useState<File | null>(null);
  const [formatDragOver, setFormatDragOver] = useState(false);

  const handleFormatFileUpload = async (file: File) => {
    setFormatFile(file);
    setIsDetecting(true); setFormatError(''); setDetectedPaper(null);
    try {
      const r = await formatPipeline('', file, selectedTemplate);
      setDetectedPaper(r.paper);
      setFormatRawText('');
    } catch (e: unknown) { setFormatError(e instanceof Error ? e.message : '文件解析失败'); }
    setIsDetecting(false);
  };

  const handleFormatDrop = (e: React.DragEvent) => {
    e.preventDefault(); setFormatDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.docx'))) handleFormatFileUpload(file);
  };

  const handleFormatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFormatFileUpload(file);
  };

  // ── 选题 ──
  const [topicField, setTopicField] = useState('');
  const [topicLevel, setTopicLevel] = useState('本科');
  const [topicList, setTopicList] = useState<TopicSuggestion[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  // v2.1 选题可视化
  const [_topicResult, setTopicResult] = useState<TopicRecommendResult | null>(null);
  const [topicTrend, setTopicTrend] = useState<TopicTrendData | null>(null);
  const [topicCompare, setTopicCompare] = useState<TopicCompareData | null>(null);
  const [wordCloud, setWordCloud] = useState<WordCloudData | null>(null);
  const [hotspots, setHotspots] = useState<HotspotData | null>(null);
    const [vizTab, setVizTab] = useState<'trend' | 'compare' | 'cloud' | 'hotspots'>('trend');

  // ── 文献 ──
  const [litQuery, setLitQuery] = useState('');
  const [litPapers, setLitPapers] = useState<ResearchPaper[]>([]);
  const [litSearching, setLitSearching] = useState(false);
  const [litReview, setLitReview] = useState<LiteratureReview | null>(null);
  const [litGenerating, setLitGenerating] = useState(false);
  const [litShowFullReview, setLitShowFullReview] = useState(false);
  const [litCitationData, setLitCitationData] = useState<CitationAnalysisData | null>(null);

  // ── 开题 ──
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [expandedProposalSec, setExpandedProposalSec] = useState<number | null>(null);

  // ── 查重 ──
  const [plagText, setPlagText] = useState('');
  const [plagReport, setPlagReport] = useState<PlagiarismReport | null>(null);
  const [plagAnalyzing, setPlagAnalyzing] = useState(false);
  const [plagReduced, setPlagReduced] = useState<PlagiarismReduceResult | null>(null);
  const [plagReducing, setPlagReducing] = useState(false);

  // ── 智能体协作 ──
  const SAVED_STATE_KEY = 'papercraft_session';
  const isInitialMount = useRef(true);

  // 启动时从 localStorage 恢复状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_STATE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.paperData) setPaperData(d.paperData);
        if (d.selectedTopic) setSelectedTopic(d.selectedTopic);
        if (d.citations) setCitations(d.citations);
        if (d.topic) setTopic(d.topic);
        if (d.keywords) setKeywords(d.keywords);
        if (d.outline) setOutline(d.outline);
        if (d.topicField) setTopicField(d.topicField);
        if (d.topicLevel) setTopicLevel(d.topicLevel);
        if (d.topicList) setTopicList(d.topicList);
        if (d.activeModule) setActiveModule(d.activeModule);
        if (d.litReview) setLitReview(d.litReview);
        if (d.litQuery) setLitQuery(d.litQuery);
        if (d.litPapers) setLitPapers(d.litPapers);
        if (d.litCitationData) setLitCitationData(d.litCitationData);
        if (d.proposalData) setProposalData(d.proposalData);
        if (d.plagText) setPlagText(d.plagText);
        if (d.plagReport) setPlagReport(d.plagReport);
        if (d.plagReduced) setPlagReduced(d.plagReduced);
        if (d.polishInput) setPolishInput(d.polishInput);
        if (d.polishMode) setPolishMode(d.polishMode);
        if (d.polishResult) setPolishResult(d.polishResult);
        if (d.chartSuggestions) setChartSuggestions(d.chartSuggestions);
        if (d.generatedTables) setGeneratedTables(d.generatedTables);
        if (d.selectedTemplate) setSelectedTemplate(d.selectedTemplate);
        if (d.styleOverrides) setStyleOverrides(d.styleOverrides);
      }
    } catch { /* corrupted data, ignore */ }
    isInitialMount.current = false;
  }, []);

  // 自动保存关键状态到 localStorage
  useEffect(() => {
    if (isInitialMount.current) return;
    try {
      localStorage.setItem(SAVED_STATE_KEY, JSON.stringify({
        paperData, selectedTopic, citations,
        topic, keywords, outline,
        topicField, topicLevel, topicList,
        activeModule,
        litReview, litQuery, litPapers, litCitationData,
        proposalData,
        plagText, plagReport, plagReduced,
        polishInput, polishMode, polishResult,
        chartSuggestions, generatedTables,
        selectedTemplate, styleOverrides,
      }));
    } catch { /* quota exceeded, ignore */ }
  }, [
    paperData, selectedTopic, citations,
    topic, keywords, outline,
    topicField, topicLevel, topicList,
    activeModule,
    litReview, litQuery, litPapers, litCitationData,
    proposalData,
    plagText, plagReport, plagReduced,
    polishInput, polishMode, polishResult,
    chartSuggestions, generatedTables,
    selectedTemplate, styleOverrides,
  ]);

  // ═══════════ 段落选择逻辑 ═══════════

  const toggleParagraph = (para: string) => {
    setSelectedParagraphs(prev => {
      const next = new Set(prev);
      if (next.has(para)) next.delete(para);
      else next.add(para);
      return next;
    });
  };

  const selectAllParagraphs = () => {
    if (!paperData) return;
    const allParas: string[] = [];
    (paperData.sections ?? []).forEach(s => {
      s.content.split('\n').filter(Boolean).forEach(p => allParas.push(p));
    });
    if (paperData.conclusion) {
      paperData.conclusion.split('\n').filter(Boolean).forEach(p => allParas.push(p));
    }
    setSelectedParagraphs(new Set(allParas));
  };

  const deselectAllParagraphs = () => {
    setSelectedParagraphs(new Set());
  };

  const batchPlagiarismCheck = () => {
    const combined = Array.from(selectedParagraphs).join('\n\n');
    if (!combined.trim()) return;
    setPlagText('');
    // 用小延时确保 state 更新
    setTimeout(() => setPlagText(combined), 100);
    setActiveModule('plagiarism');
  };

  // ═══════════ Handlers ═══════════

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(''); setSelectedParagraphs(new Set());
    try {
      const kwList = keywords.split(/[,，、]/).map(k => k.trim()).filter(Boolean);
      const result = await generatePaper({
        topic: topic.trim(), keywords: kwList, outline: outline.trim(),
        paper_type: '课程论文', language: '中文',
        citations: citations.length > 0 ? citations.map(c => ({ full_text: c.full_text })) : undefined,
      });
      setPaperData(result);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '生成失败'); }
    setLoading(false);
  };

  const handlePolish = async () => {
    if (!polishInput.trim()) return;
    setPolishing(true); setPolishResult(null); setError('');
    try { setPolishResult(await polishText(polishInput, polishMode)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '润色失败'); }
    setPolishing(false);
  };

  const handleExport = async () => {
    if (!paperData) return;
    try {
      const blob = await exportDocx(paperData);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `${paperData.title || '论文'}.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '导出失败'); }
  };


  useEffect(() => { if (activeModule === 'format' && !templatesLoaded) { fetchTemplates().then(setTemplates).catch(() => {}); setTemplatesLoaded(true); } }, [activeModule]);
  useEffect(() => { if (paperData && activeModule === 'format') { setDetectedPaper(paperData); setFormatRawText(''); } }, [paperData, activeModule]);

  const handleFormatExport = async () => {
    const pd = detectedPaper;
    if (!pd) { setFormatError('请先导入或识别论文'); return; }
    setIsExporting(true); setFormatError('');
    try {
      const blob = await exportFormattedDocx(pd, selectedTemplate,
        Object.keys(styleOverrides).length > 0 ? styleOverrides as Record<string, unknown> : undefined);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `${pd.title || '论文'}.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) { setFormatError(e instanceof Error ? e.message : '导出失败'); }
    setIsExporting(false);
  };

  const handleTopicRecommend = async () => {
    if (!topicField.trim()) return;
    setTopicLoading(true); setError(''); setExpandedTopic(null);
    setTopicResult(null); setTopicTrend(null); setWordCloud(null); setHotspots(null);
    try {
      const r = await recommendTopics(topicField, topicLevel);
      setTopicList(r.topics || []);
      setTopicResult(r);
      // 并行加载可视化数据
      getTopicTrend(topicField).then(d => setTopicTrend(d)).catch(() => {});
      getWordCloudData(topicField).then(d => setWordCloud(d)).catch(() => {});
      getResearchHotspots(topicField).then(d => setHotspots(d)).catch(() => {});
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '推荐失败'); }
    setTopicLoading(false);
  };

  const handleCompareTopics = async (kw: string[]) => {
    try {
      const r = await compareTopics(kw);
      setTopicCompare(r);
      setVizTab('compare');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '对比失败'); }
  };

  const handleSelectTopic = (t: TopicSuggestion) => {
    setSelectedTopic(t);
    setTopic(t.title);
    setKeywords(t.suggested_keywords?.join(', ') || '');
  };
  const handleLitSearch = async () => {
    if (!litQuery.trim()) return;
    setLitSearching(true); setLitPapers([]); setLitReview(null); setLitShowFullReview(false); setError("");
    try {
      const r = await searchLiterature(litQuery);
      setLitPapers(r.papers?.map(p => ({ ...p, selected: false })) || []);
      // 并行加载引文分析数据
      getCitationAnalysis(litQuery).then(d => setLitCitationData(d)).catch(() => {});
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "搜索失败"); }
    setLitSearching(false);
  };
  const handleTextSelection = (e: React.MouseEvent) => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 0) {
        setSelectedText(text);
        setSelectionPos({ x: e.clientX, y: e.clientY });
      } else {
        setSelectedText('');
        setSelectionPos(null);
      }
    }, 100);
  };

  const handleSendToPolish = () => {
    if (selectedText) {
      setPolishInput(selectedText);
      setActiveModule('polish');
      setSelectedText('');
      setSelectionPos(null);
    }
  };



  const toggleLitPaper = (paperId: string) => {
    setLitPapers(prev => prev.map(x => x.paperId === paperId ? { ...x, selected: !x.selected } : x));
  };

  const handleLitGenerate = async () => {
    const selected = litPapers.filter(p => p.selected);
    if (selected.length === 0) { setError('请至少勾选一篇论文'); return; }
    setLitGenerating(true); setError('');
    try { const r = await generateReview(litQuery, selected); setLitReview(r); setCitations(r.citations || []); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '综述生成失败'); }
    setLitGenerating(false);
  };

  const handleProposalGenerate = async () => {
    const t = selectedTopic?.title || topic;
    if (!t) { setError('请先输入或选择论文主题'); return; }
    setProposalLoading(true); setError(''); setExpandedProposalSec(null);
    try {
      const r = await generateProposal(t, selectedTopic?.background || '', citations);
      setProposalData(r);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '生成失败'); }
    setProposalLoading(false);
  };

  const handlePlagAnalyze = async () => {
    if (!plagText.trim()) return;
    setPlagAnalyzing(true); setPlagReport(null); setPlagReduced(null); setError('');
    try { setPlagReport(await analyzeOriginality(plagText)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '分析失败'); }
    setPlagAnalyzing(false);
  };

  const handlePlagReduce = async () => {
    if (!plagText.trim()) return;
    setPlagReducing(true); setPlagReduced(null); setError('');
    try { setPlagReduced(await reduceSimilarity(plagText)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '降重失败'); }
    setPlagReducing(false);
  };

  const handleChartSuggest = async () => {
    if (!paperData) return;
    try { const r = await generateCharts(paperData); setChartSuggestions(r.charts || []); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '图表建议失败'); }
  };

  const handleGenerateTables = async () => {
    if (!paperData) return;
    setTableLoading(true);
    try { const r = await generateTables(paperData); setGeneratedTables(r.tables || []); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '表格生成失败'); }
    setTableLoading(false);
  };

  const handleClearSession = () => {
    localStorage.removeItem('papercraft_session');
    window.location.reload();
  };

  // ═══════════ 右侧面板 — 完整论文 + 段落多选 ═══════════
  const renderPreview = () => {
    if (paperData) {
      return (
        <div className="animate-fade-in space-y-4">
          <h1 className="font-serif text-2xl font-bold text-white mb-2 text-center">{paperData.title}</h1>
          {paperData.author && <p className="text-paper-muted text-sm text-center mb-4">{paperData.author}</p>}

          {/* 段落选择工具栏 */}
          {activeModule === 'plagiarism' && selectedParagraphs.size > 0 && (
            <div className="bg-paper-accent/10 border border-paper-accent/20 rounded-lg p-2 flex items-center justify-between text-xs">
              <span>已选 <span className="text-paper-gold font-bold">{selectedParagraphs.size}</span> 段</span>
              <div className="flex gap-2">
                <button onClick={batchPlagiarismCheck}
                  className="px-3 py-1 bg-paper-accent text-white rounded text-[10px] font-medium">
                  批量查重
                </button>
              </div>
            </div>
          )}

          {/* Abstract */}
          <div className="bg-paper-surface/50 rounded-xl p-4 border border-paper-card/30">
            <h2 className="text-xs font-bold text-paper-gold uppercase mb-2">摘  要</h2>
            <p className="text-sm leading-relaxed text-paper-text/85 indent-8">{paperData.abstract}</p>
            {paperData.keywords?.length > 0 && (
              <p className="text-xs text-paper-muted mt-2"><strong>关键词：</strong>{paperData.keywords.join('；')}</p>
            )}
          </div>

          {/* Sections — full content with checkboxes */}
          {paperData.sections?.map((sec, i) => (
            <div key={i} className="mb-4">
              <h2 className="font-serif text-lg font-bold text-white mb-2">{sec.heading}</h2>
              {(sec.content || '').split('\n').filter(Boolean).map((para, j) => {
                const isSelected = selectedParagraphs.has(para);
                return (
                  <div key={j}
                    onClick={() => toggleParagraph(para)}
                    className="flex items-start gap-2 group cursor-pointer hover:bg-paper-accent/5 rounded px-1 py-0.5 transition-colors">
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-paper-gold border-paper-gold text-paper-bg' : 'border-paper-card/30 opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSelected ? <Check className="w-3 h-3" /> : <Square className="w-3 h-3 text-paper-muted/50" />}
                    </div>
                    <p className="text-sm leading-relaxed text-paper-text/85 indent-8 flex-1">{para}</p>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Conclusion */}
          {paperData.conclusion && (
            <div className="mb-4">
              <h2 className="font-serif text-lg font-bold text-white mb-2">结  论</h2>
              {paperData.conclusion.split('\n').filter(Boolean).map((para, j) => {
                const isSelected = selectedParagraphs.has(para);
                return (
                  <div key={j} onClick={() => toggleParagraph(para)}
                    className="flex items-start gap-2 group cursor-pointer hover:bg-paper-accent/5 rounded px-1 py-0.5 transition-colors">
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-paper-gold border-paper-gold text-paper-bg' : 'border-paper-card/30 opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSelected ? <Check className="w-3 h-3" /> : <Square className="w-3 h-3 text-paper-muted/50" />}
                    </div>
                    <p className="text-sm leading-relaxed text-paper-text/85 indent-8 flex-1">{para}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* References */}
          {paperData.references && paperData.references.length > 0 && (
            <div className="mb-4 border-t border-paper-card/30 pt-3">
              <h2 className="font-serif text-lg font-bold text-white mb-2">参考文献</h2>
              {paperData.references.map((ref, i) => (
                <div key={i} className="text-xs text-paper-text/70">[{i + 1}] {ref}</div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-paper-card/30">
            <button onClick={selectAllParagraphs}
              className="text-[10px] px-2 py-1 rounded bg-paper-bg border border-paper-card text-paper-muted hover:text-paper-text">
              <CheckSquare className="w-3 h-3 inline mr-1" />全选段落
            </button>
            <button onClick={deselectAllParagraphs}
              className="text-[10px] px-2 py-1 rounded bg-paper-bg border border-paper-card text-paper-muted hover:text-paper-text">
              取消全选
            </button>
            {selectedParagraphs.size > 0 && (
              <button onClick={batchPlagiarismCheck}
                className="text-[10px] px-2 py-1 rounded bg-paper-accent text-white">
                将选中的 {selectedParagraphs.size} 段送往查重
              </button>
            )}
            <button onClick={handleExport}
              className="text-[10px] px-2 py-1 rounded bg-paper-gold text-paper-bg font-medium">
              <Download className="w-3 h-3 inline mr-1" />导出 Word
            </button>
            <button onClick={handleChartSuggest}
              className="text-[10px] px-2 py-1 rounded bg-paper-bg border border-paper-card text-paper-muted hover:text-paper-text">
              <BarChart3 className="w-3 h-3 inline mr-1" />图表建议
            </button>
            <button onClick={handleGenerateTables} disabled={tableLoading}
              className="text-[10px] px-2 py-1 rounded bg-paper-bg border border-paper-card text-paper-muted hover:text-paper-text">
              {tableLoading ? <RotateCcw className="w-3 h-3 inline mr-1 animate-spin" /> : null}📊 数据表格
            </button>
          </div>

          {/* Citations */}
          {citations.length > 0 && (
            <div className="bg-paper-gold/5 rounded-xl p-4 border border-paper-gold/10">
              <p className="text-xs text-paper-gold font-bold mb-1">📚 引用文献 ({citations.length}篇)</p>
              <ol className="text-[10px] text-paper-muted space-y-0.5 list-decimal list-inside">
                {citations.map((c, i) => <li key={i}>{c.full_text}</li>)}
              </ol>
            </div>
          )}

          {chartSuggestions.length > 0 && (
            <div className="bg-paper-surface/30 rounded-xl p-4 border border-paper-card/20">
              <p className="text-xs text-paper-gold font-bold mb-1">📊 AI 图表建议</p>
              {chartSuggestions.map((cs, i) => (
                <div key={i} className="text-[11px] text-paper-muted mt-1">
                  <span className="text-white">{cs.chart_type}</span>: {cs.title} — {cs.description}
                </div>
              ))}
            </div>
          )}

          {generatedTables.length > 0 && (
            <div className="bg-paper-surface/30 rounded-xl p-4 border border-paper-card/20">
              <p className="text-xs text-paper-gold font-bold mb-2">📊 数据表格 ({generatedTables.length}个)</p>
              {generatedTables.map((tbl, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-[11px] font-medium text-white mb-1">表{i+1}: {tbl.title}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-paper-card/30">
                          {(tbl.headers || []).map((h: string, j: number) => (
                            <th key={j} className="border border-paper-card/30 px-2 py-1 text-left text-paper-gold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(tbl.rows || []).map((row: string[], ri: number) => (
                          <tr key={ri} className="border-b border-paper-card/20">
                            {row.map((cell: string, ci: number) => (
                              <td key={ci} className="border border-paper-card/20 px-2 py-1 text-paper-muted">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {tbl.caption && <p className="text-[9px] text-paper-muted mt-1 text-center">{tbl.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-paper-card/30" />
        <p className="text-paper-muted text-sm">从上方模块开始你的学术写作之旅</p>
      </div>
    );
  };

  const statusIndicators = [];
  if (selectedTopic) statusIndicators.push('📋 已选题');
  if (citations.length > 0) statusIndicators.push(`📚 ${citations.length}篇文献`);
  if (proposalData) statusIndicators.push('📝 有开题');
  if (paperData) statusIndicators.push('📄 有论文');

  return (
    <div className="h-screen flex flex-col bg-paper-bg text-paper-text font-sans overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-paper-surface border-b border-paper-card/50 flex items-center px-4 gap-2 shrink-0">
        <BookOpen className="w-4 h-4 text-paper-gold" />
        <span className="font-serif text-base tracking-wide">
          Paper<span className="text-paper-accent">Craft</span>
          <span className="text-paper-muted text-xs ml-2">v2.1</span>
        </span>
        <div className="ml-auto flex items-center gap-3 text-[10px]">
          {statusIndicators.map((s, i) => <span key={i} className="text-green-400">{s}</span>)}
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          DeepSeek AI
          <button onClick={handleClearSession} title="清除本地缓存"
            className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 ml-1">
            清缓存
          </button>
        </div>
      </header>

      {/* Module Nav */}
      <nav className="h-10 bg-paper-surface/80 border-b border-paper-card/30 flex shrink-0 overflow-x-auto">
        {MODULES.map(m => (
          <button key={m} onClick={() => setActiveModule(m)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeModule === m ? 'text-paper-gold border-paper-gold' : 'text-paper-muted border-transparent hover:text-paper-text'
            }`}>
            {MODULE_LABELS[m].icon} {MODULE_LABELS[m].label}
          </button>
        ))}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[420px] bg-paper-surface border-r border-paper-card/50 flex flex-col shrink-0 overflow-y-auto p-4 gap-3">
          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-paper-muted hover:text-white">✕</button>
            </div>
          )}

          {/* ========================== 选题推荐 ========================== */}
          {activeModule === 'topic' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={topicField} onChange={e => setTopicField(e.target.value)}
                  placeholder="输入学科领域，如：人工智能、教育学、金融学..."
                  className="flex-1 bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paper-accent transition-colors" />
                <select value={topicLevel} onChange={e => setTopicLevel(e.target.value)}
                  className="bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-sm">
                  <option value="本科">本科</option>
                  <option value="硕士">硕士</option>
                  <option value="博士">博士</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleTopicRecommend} disabled={topicLoading || !topicField.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:brightness-110 disabled:opacity-40 transition-all">
                  {topicLoading ? <RotateCcw className="w-4 h-4 inline animate-spin mr-1" /> : null}
                   AI 选题分析
                </button>

              </div>

              {/* 可视化分析面板 */}
              {(topicTrend || wordCloud || hotspots) && (
                <div className="bg-paper-bg border border-paper-card rounded-xl overflow-hidden">
                  <div className="flex border-b border-paper-card/50">
                    {([
                      { id: 'trend', icon: TrendingUp, label: '发文趋势' },
                      { id: 'cloud', icon: Cloud, label: '关键词云' },
                      { id: 'hotspots', icon: Flame, label: '热点演化' },
                      { id: 'compare', icon: Radar, label: '选题对比' },
                    ] as const).map(tab => (
                      <button key={tab.id} onClick={() => setVizTab(tab.id)}
                        className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          vizTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-paper-muted hover:text-white'
                        }`}>
                        <tab.icon className="w-3.5 h-3.5" />{tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-4">
                    {vizTab === 'trend' && topicTrend && <TrendLineChart data={topicTrend.trend} />}
                    {vizTab === 'trend' && !topicTrend && <div className="text-xs text-paper-muted text-center py-8">加载中...</div>}

                    {vizTab === 'cloud' && wordCloud && (
                      <div>
                        <h4 className="text-xs font-medium text-paper-text mb-3 text-center">研究热点关键词</h4>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {wordCloud.words.slice(0, 40).map((w, i) => {
                            const size = Math.max(10, Math.min(24, 10 + (w.value / 10)));
                            const trendColor = w.trend === 'hot' ? 'text-red-400' : w.trend === 'rising' ? 'text-green-400' : w.trend === 'cooling' ? 'text-gray-500' : 'text-blue-300';
                            return (
                              <span key={i} className={`${trendColor} hover:scale-110 transition-transform cursor-default`}
                                style={{ fontSize: `${size}px`, fontWeight: w.value > 70 ? 600 : 400 }}>
                                {w.text}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {vizTab === 'cloud' && !wordCloud && <div className="text-xs text-paper-muted text-center py-8">加载中...</div>}

                    {vizTab === 'hotspots' && hotspots && (
                      <div>
                        <h4 className="text-xs font-medium text-paper-text mb-3 text-center">研究热点年度演化</h4>
                        <div className="space-y-2">
                          {hotspots.hotspots.map((h, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-paper-card/30">
                              <span className="text-xs font-bold text-blue-400 min-w-[40px]">{h.year}</span>
                              <div className="flex flex-wrap gap-1">
                                {h.keywords.map((k, j) => (
                                  <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{k}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {vizTab === 'hotspots' && !hotspots && <div className="text-xs text-paper-muted text-center py-8">加载中...</div>}

                    {vizTab === 'compare' && topicCompare && (
                      <div>
                        <h4 className="text-xs font-medium text-paper-text mb-1 text-center">多选题多维对比</h4>
                        <TopicRadarChart data={topicCompare.comparison} axes={topicCompare.radar_axes} height={280} />
                      </div>
                    )}
                    {vizTab === 'compare' && !topicCompare && (
                      <div className="text-xs text-paper-muted text-center py-8">
                        在下方选题列表中选择2-5个选题后点击"对比分析"
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* 选题列表 */}
              {topicList.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-paper-text flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                      推荐选题 ({topicList.length})
                    </h4>
                    {topicList.filter(t => t._compared).length >= 2 && (
                      <button onClick={() => {
                        const selected = topicList.filter(t => t._compared);
                        const kw = selected.map((t: TopicSuggestion) => t.suggested_keywords?.[0] || t.title).filter(Boolean);
                        handleCompareTopics(kw);
                      }}
                        className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20">
                        <Radar className="w-3 h-3 inline mr-1" />对比分析
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {topicList.map((t, i) => {
                      const isExpanded = expandedTopic === i;
                      const isCompared = t._compared || false;
                      return (
                        <div key={i}
                          className={`rounded-xl border transition-all ${
                            selectedTopic?.title === t.title
                              ? 'bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/5'
                              : 'bg-paper-bg border-paper-card hover:border-paper-card/70'
                          }`}>
                          <div className="p-3 flex items-start gap-2">
                            <div onClick={(e) => {
                              e.stopPropagation();
                              t._compared = !isCompared;
                              setTopicList([...topicList]);
                            }} className="mt-0.5 cursor-pointer">
                              {isCompared
                                ? <CheckSquare className="w-4 h-4 text-purple-400" />
                                : <Square className="w-4 h-4 text-paper-muted/40" />
                              }
                            </div>
                            <div onClick={() => setExpandedTopic(isExpanded ? null : i)}
                              className="flex-1 min-w-0 cursor-pointer">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">{t.title}</div>
                                  <div className="flex gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      t.difficulty === '简单' ? 'bg-green-500/10 text-green-400' :
                                      t.difficulty === '困难' ? 'bg-red-500/10 text-red-400' :
                                      'bg-yellow-500/10 text-yellow-400'
                                    }`}>{t.difficulty}</span>
                                    <span className="text-[10px] text-paper-muted">
                                      {t.suggested_keywords?.slice(0, 3).join(' · ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-paper-muted mt-1">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                              {t.metrics && (
                                <div className="flex gap-3 mt-2">
                                  {([
                                    { k: 'research_heat', label: '热度', val: t.metrics.research_heat },
                                    { k: 'innovation_score', label: '创新', val: t.metrics.innovation_score },
                                    { k: 'practical_value', label: '实践', val: t.metrics.practical_value },
                                  ] as const).map(m => (
                                    <div key={m.k} className="flex-1">
                                      <div className="flex justify-between text-[9px] text-paper-muted mb-0.5">
                                        <span>{m.label}</span><span>{m.val}</span>
                                      </div>
                                      <div className="h-1 bg-paper-card rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all"
                                          style={{ width: `${m.val}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-paper-card/30 pt-3 space-y-3">
                              {t.metrics && (
                                <div className="bg-paper-card/20 rounded-lg p-2">
                                  <SingleTopicRadar metrics={t.metrics as unknown as Record<string, number>} height={200} />
                                </div>
                              )}
                              <div className="space-y-2">
                                <div><div className="text-[10px] text-paper-gold font-medium mb-1">研究背景</div><p className="text-[10px] text-paper-muted leading-relaxed">{t.background}</p></div>
                                <div><div className="text-[10px] text-paper-gold font-medium mb-1">创新点</div><p className="text-[10px] text-paper-muted leading-relaxed">{t.innovation}</p></div>
                                <div><div className="text-[10px] text-paper-gold font-medium mb-1">可行性分析</div><p className="text-[10px] text-paper-muted leading-relaxed">{t.feasibility}</p></div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleSelectTopic(t); }}
                                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-xs font-medium hover:brightness-110 flex items-center justify-center gap-1.5 transition-all">
                                <ArrowRight className="w-3.5 h-3.5" /> 确认选题，开始写作
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeModule === 'literature' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={litQuery} onChange={e => setLitQuery(e.target.value)}
                  placeholder={selectedTopic ? `建议：${selectedTopic.title?.slice(0, 30)}` : '输入研究主题关键词'}
                  className="flex-1 bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paper-accent transition-colors" />
                {selectedTopic && (
                  <button onClick={() => setLitQuery(selectedTopic.title)}
                    className="text-[10px] text-paper-muted hover:text-paper-text text-left">
                    💡 使用选题作为搜索词
                  </button>
                )}
                <button onClick={handleLitSearch} disabled={litSearching || !litQuery.trim()}
                  className="px-4 py-2 bg-paper-accent text-white rounded-lg text-sm font-medium hover:brightness-110 disabled:opacity-40">
                  {litSearching ? <RotateCcw className="w-4 h-4 animate-spin" /> : '搜索文献'}
                </button>
              </div>

              {/* 引文分析可视化 */}
              {litCitationData && !litSearching && (
                <div className="grid grid-cols-2 gap-3">
                  {/* 年份分布 */}
                  {litCitationData.year_distribution && litCitationData.year_distribution.length > 0 && (
                    <div className="bg-paper-bg border border-paper-card rounded-xl p-3">
                      <h4 className="text-xs font-medium text-paper-text mb-2 text-center flex items-center justify-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> 年份发文量
                      </h4>
                      <TrendLineChart
                        data={litCitationData.year_distribution.map((d) => ({ year: d.year, count: d.count }))}
                        height={180}
                      />
                    </div>
                  )}

                  {/* 高引论文排行 */}
                  {litCitationData.top_cited && litCitationData.top_cited.length > 0 && (
                    <div className="bg-paper-bg border border-paper-card rounded-xl p-3">
                      <h4 className="text-xs font-medium text-paper-text mb-2 text-center flex items-center justify-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-yellow-400" /> 高引论文 Top {Math.min(8, litCitationData.top_cited.length)}
                      </h4>
                      <div className="space-y-1.5">
                        {litCitationData.top_cited.slice(0, 8).map((p, i) => (
                          <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-paper-card/30">
                            <span className="text-[10px] font-bold min-w-[16px] text-center"
                              style={{ color: i < 3 ? '#f59e0b' : '#64748b' }}>{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] text-white leading-tight truncate">{p.title}</div>
                              <div className="text-[9px] text-paper-muted mt-0.5">
                                {p.authors?.slice(0, 2).join(', ')} ({p.year}) · 被引 {p.citations}次
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {litPapers.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs text-paper-muted">找到 {litPapers.length} 篇文献</h4>
                    <button onClick={handleLitGenerate} disabled={litGenerating || litPapers.filter(p => p.selected).length === 0}
                      className="text-[10px] px-3 py-1.5 bg-paper-gold text-paper-bg rounded font-medium hover:brightness-110 disabled:opacity-40">
                      {litGenerating ? <RotateCcw className="w-3 h-3 inline animate-spin mr-1" /> : null}
                      生成综述 ({litPapers.filter(p => p.selected).length}篇已选)
                    </button>
                  </div>
                  <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                    {litPapers.map(p => (
                      <div key={p.paperId} onClick={() => toggleLitPaper(p.paperId)}
                        className={`p-2 rounded cursor-pointer border text-xs transition-all ${p.selected ? 'bg-paper-accent/15 border-paper-accent/30' : 'bg-paper-bg border-paper-card hover:border-paper-card/70'}`}>
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${p.selected ? 'bg-paper-gold border-paper-gold text-paper-bg' : 'border-paper-card/50'}`}>
                            {p.selected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white truncate">{p.title}</div>
                            <div className="text-[10px] text-paper-muted mt-0.5">{p.authors?.slice(0, 3).join(', ')} ({p.year}) · {p.venue} · 被引 {p.citationCount}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {litReview && (
                <div className="bg-paper-bg border border-paper-card rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-paper-gold">综述 · {litReview.citations?.length || 0} 篇引用</div>
                    <button onClick={() => setLitShowFullReview(!litShowFullReview)}
                      className="text-[10px] text-paper-muted hover:text-paper-text">{litShowFullReview ? '收起' : '展开全文'}</button>
                  </div>
                  <div className="text-xs leading-relaxed text-paper-text/85 whitespace-pre-wrap">
                    {litShowFullReview ? litReview.review_text : litReview.review_text?.slice(0, 600) + (litReview.review_text?.length > 600 ? '...' : '')}
                  </div>
                  {litReview.citations?.length > 0 && (
                    <div className="border-t border-paper-card/30 pt-2">
                      {litReview.citations.map((c, i) => (
                        <div key={i} className="text-[9px] text-paper-muted leading-relaxed">[{c.index}] {c.full_text}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}{/* ========================== 开题报告 ========================== */}
          {activeModule === 'proposal' && (
            <>
              <label className="text-xs text-paper-muted uppercase tracking-wider">论文主题</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={selectedTopic ? `已选定：${selectedTopic.title}` : '输入论文主题'}
                className="w-full bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paper-accent transition-colors" />
              {selectedTopic && <div className="bg-paper-accent/10 border border-paper-accent/20 rounded p-2 text-[10px]">📋 选题：<span className="text-white font-medium">{selectedTopic.title}</span></div>}
              {citations.length > 0 && <div className="bg-paper-gold/10 border border-paper-gold/20 rounded p-2 text-[10px]">📚 基于 {citations.length} 篇真实文献</div>}
              <button onClick={handleProposalGenerate} disabled={proposalLoading || !topic.trim()}
                className="w-full py-2.5 bg-paper-accent text-white rounded text-sm font-medium hover:brightness-110 disabled:opacity-40">
                {proposalLoading ? '生成中...' : '📝 生成开题报告'}
              </button>
              {proposalData && (
                <div className="space-y-2">
                  {proposalData.sections?.map((s, i) => {
                    const isExpanded = expandedProposalSec === i;
                    return (
                      <div key={i} className="bg-paper-bg border border-paper-card rounded-lg overflow-hidden">
                        <div onClick={() => setExpandedProposalSec(isExpanded ? null : i)} className="p-3 cursor-pointer flex items-center justify-between">
                          <div className="text-xs font-bold text-white">{s.heading}</div>
                          <div className="text-paper-muted">{isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</div>
                        </div>
                        {isExpanded && <div className="px-3 pb-3 border-t border-paper-card/30 pt-2"><p className="text-[11px] text-paper-text/80 leading-relaxed whitespace-pre-wrap">{s.content}</p></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ========================== 论文撰写 ========================== */}
          {activeModule === 'paper' && (
            <>
              <label className="text-xs text-paper-muted uppercase tracking-wider">论文主题</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="输入论文主题..."
                className="w-full bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paper-accent transition-colors" />
              {selectedTopic && (<div className="bg-paper-accent/10 border border-paper-accent/20 rounded p-2 text-[10px] flex items-center gap-2"><span>📋 已选题：<span className="text-white font-medium">{selectedTopic.title}</span></span><button onClick={() => { setTopic(selectedTopic.title); setKeywords(selectedTopic.suggested_keywords?.join(', ') || ''); }} className="text-[9px] text-paper-accent hover:underline ml-auto">填入表单</button></div>)}
              {!selectedTopic && (
                <div className="flex flex-wrap gap-1">
                  {['人工智能对高等教育的影响', '基于深度学习的图像识别技术综述', '大数据时代个人隐私保护研究'].map((t, i) => (
                    <button key={i} onClick={() => setTopic(t)} className="text-[10px] px-2 py-0.5 rounded-full bg-paper-card/50 text-paper-muted hover:bg-paper-card">{t.length > 18 ? t.slice(0, 18) + '...' : t}</button>
                  ))}
                </div>
              )}
              {(!selectedTopic?.suggested_keywords) && (<><label className="text-xs text-paper-muted uppercase tracking-wider">关键词（逗号分隔）</label><input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="人工智能, 高等教育" className="w-full bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paper-accent transition-colors" /></>)}
              <label className="text-xs text-paper-muted uppercase tracking-wider">论文大纲（留空由AI自动规划）</label>
              <textarea value={outline} onChange={e => setOutline(e.target.value)}
                placeholder={'一、引言\n二、文献综述\n三、研究方法\n四、分析与讨论\n五、结论与展望'}
                className="w-full h-[100px] bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-paper-accent transition-colors font-mono" />
              <div className="text-[10px] text-paper-muted space-y-0.5">
                {citations.length > 0 && <div>📚 将引用 {citations.length} 篇文献</div>}
                {proposalData && <div>📝 开题报告已就绪</div>}
              </div>
              <button onClick={handleGenerate} disabled={loading || !topic.trim()}
                className="w-full py-3 bg-paper-accent text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40">
                {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {loading ? '生成中...' : '生成论文初稿'}
              </button>
            </>
          )}

          {/* ========================== AI 改稿 ========================== */}
          {activeModule === 'polish' && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {POLISH_MODES.map(m => (
                  <button key={m.id} onClick={() => setPolishMode(m.id)}
                    className={`p-2 rounded-lg text-left text-xs transition-all ${polishMode === m.id ? 'bg-paper-accent/20 border border-paper-accent/40 text-white' : 'bg-paper-bg border border-paper-card text-paper-muted hover:border-paper-card/70'}`}>
                    <m.icon className={`w-3 h-3 mb-0.5 ${polishMode === m.id ? 'text-paper-accent' : 'text-paper-muted'}`} />
                    <div className="font-medium">{m.label}</div>
                    <div className="text-[9px] text-paper-muted mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
              <textarea value={polishInput} onChange={e => setPolishInput(e.target.value)}
                placeholder="粘贴需要改稿的文本，或从右侧论文复制..."
                className="w-full h-[150px] bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-paper-accent transition-colors" />
              <button onClick={handlePolish} disabled={polishing || !polishInput.trim()}
                className="w-full py-2.5 bg-paper-gold text-paper-bg rounded font-medium text-sm hover:brightness-110 disabled:opacity-40">
                {polishing ? '改稿中...' : '开始改稿'}
              </button>
              {polishResult && (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  <div className="text-xs font-medium text-green-400">改稿结果</div>
                  <div className="bg-paper-bg border border-paper-card rounded-lg p-3">
                    <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{polishResult.polished}</p>
                  </div>
                  {polishResult.changes && polishResult.changes.length > 0 && (
                    <div className="bg-paper-bg border border-paper-card rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-paper-text">变更明细 · {polishResult.changes.length}处</h4>
                        <button onClick={() => setPolishInput(polishResult.original)}
                          className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">
                          恢复原文
                        </button>
                      </div>
                      <div className="space-y-1">
                        {polishResult.changes.map((c: string, i: number) => (
                          <div key={i} className="text-[10px] text-paper-muted flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                            <span className="flex-1">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

{/* ========================== 查重降重 ========================== */}
          {activeModule === 'plagiarism' && (
            <>
              <label className="text-xs text-paper-muted uppercase tracking-wider">
                待分析文本 {plagText && <span className="text-green-400">({plagText.length} 字)</span>}
              </label>
              <div className="flex flex-col" style={{ minHeight: '40vh' }}>
                <textarea value={plagText} onChange={e => setPlagText(e.target.value)}
                  placeholder="粘贴需要查重的段落，或点击右侧论文段落旁的checkbox多选..."
                  className="w-full min-h-[120px] bg-paper-bg border border-paper-card rounded-lg px-3 py-2 text-xs resize-y focus:outline-none focus:border-paper-accent transition-colors flex-shrink-0" />
                <div className="flex gap-2 mt-2 flex-shrink-0">
                  <button onClick={handlePlagAnalyze} disabled={plagAnalyzing || !plagText.trim()}
                    className="flex-1 py-2 bg-paper-accent text-white rounded text-xs font-medium hover:brightness-110 disabled:opacity-40">
                    {plagAnalyzing ? <RotateCcw className="w-3 h-3 animate-spin inline mr-1" /> : '🔍'} 原创度分析
                  </button>
                  <button onClick={handlePlagReduce} disabled={plagReducing || !plagText.trim()}
                    className="flex-1 py-2 bg-paper-gold text-paper-bg rounded text-xs font-medium hover:brightness-110 disabled:opacity-40">
                    {plagReducing ? <RotateCcw className="w-3 h-3 animate-spin inline mr-1" /> : '✨'} 降重改写
                  </button>
                </div>
                {/* Results scroll independently */}
                <div className="flex-1 overflow-y-auto mt-2 space-y-2">
                  {plagReport && (
                    <div className="bg-paper-bg border border-paper-card rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl font-bold ${plagReport.overall_score >= 80 ? 'text-green-400' : plagReport.overall_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{plagReport.overall_score}</div>
                        <div><div className="text-xs text-paper-muted">/100 原创度评分</div><div className="text-[10px] text-paper-text mt-0.5">{plagReport.summary}</div></div>
                      </div>
                      {plagReport.segments?.map((s, i) => (
                        <div key={i} className={`p-2 rounded text-[10px] ${s.risk === 'high' ? 'bg-red-500/10 border border-red-500/20 text-red-300' : s.risk === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300' : 'bg-green-500/10 border border-green-500/20 text-green-300'}`}>
                          <span className="font-medium">{s.risk === 'high' ? '🔴 高风险' : s.risk === 'medium' ? '🟡 中风险' : '🟢 低风险'}</span> ({s.score}分) — {s.comment}
                        </div>
                      ))}
                    </div>
                  )}
                  {plagReduced && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="text-xs font-medium text-green-400 mb-1">✨ 降重结果 ({plagReduced.estimated_reduction})</div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{plagReduced.rewritten}</p>
                      {plagReduced.changes?.length > 0 && <div className="mt-2 border-t border-green-500/10 pt-2">{plagReduced.changes.map((c, i) => <div key={i} className="text-[10px] text-paper-muted">· {c}</div>)}</div>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========================== 智能排版 ========================== */}
          {activeModule === 'format' && (
            <>
              {formatError && (
                <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded flex items-center justify-between">
                  <span>{formatError}</span>
                  <button onClick={() => setFormatError('')} className="text-paper-muted hover:text-white">✕</button>
                </div>
              )}
              {detectedPaper ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs">
                  ✅ 已导入「{detectedPaper.title}」
                  <button onClick={() => { setDetectedPaper(null); setFormatRawText(''); }} className="ml-2 text-[10px] text-paper-accent hover:underline">清除</button>
                </div>
              ) : (
                <>
                  {/* 文件拖拽上传区 */}
                  <div
                    onDragOver={e => { e.preventDefault(); setFormatDragOver(true); }}
                    onDragLeave={() => setFormatDragOver(false)}
                    onDrop={handleFormatDrop}
                    onClick={() => document.getElementById('format-file-input')?.click()}
                    className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer ${
                      formatDragOver ? 'border-paper-accent bg-paper-accent/5' : 'border-paper-card/50 hover:border-paper-card'
                    }`}>
                    <input id="format-file-input" type="file" accept=".docx" onChange={handleFormatFileSelect} className="hidden" />
                    {formatFile ? (
                      <p className="text-[10px] text-green-400">📄 {formatFile.name}</p>
                    ) : (
                      <p className="text-[10px] text-paper-muted">📂 拖拽上传 Word 文档</p>
                    )}
                  </div>
                </>
              )}
              <div className="grid grid-cols-3 gap-1">
                {(templates.length > 0 ? templates : DEFAULT_TEMPLATES).map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                    className={`p-2 rounded-lg text-center text-[10px] transition-all ${selectedTemplate === t.id ? 'bg-paper-accent/20 border border-paper-accent/40' : 'bg-paper-bg border border-paper-card hover:border-paper-card/70'}`}>
                    <div className="text-base">{TEMPLATE_ICONS[t.id] || '📄'}</div><div className="font-medium">{t.name}</div></button>
                ))}
              </div>
                          <div className="space-y-2 bg-paper-bg border border-paper-card rounded-lg p-3">
                <h4 className="text-xs font-medium text-paper-text mb-2">当前模板参数</h4>
                {(() => { const p = TEMPLATE_PARAMS[selectedTemplate] || TEMPLATE_PARAMS['general']; return (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex justify-between"><span className="text-paper-muted">正文</span><span className="text-white">{p.body}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">标题</span><span className="text-white">{p.title}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">上/下边距</span><span className="text-white">{p.margins}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">左/右边距</span><span className="text-white">{p.sideMargins}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">参考文献</span><span className="text-white">{p.ref}</span></div>
                  {p.extras && (
                    <div className="col-span-2 text-paper-gold text-[9px]">含封面页、声明页、目录、致谢页</div>
                  )}
                </div>
                ); })()}
              </div>

              <div className="space-y-2 bg-paper-bg border border-paper-card rounded-lg p-3">
                <h4 className="text-xs font-medium text-paper-text mb-2">样式微调</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-paper-muted">字号 (pt)</label>
                    <input type="number" min="9" max="18" value={styleOverrides.bodySize || 12}
                      onChange={e => setStyleOverrides(p => ({...p, bodySize: Number(e.target.value)}))}
                      className="w-full bg-paper-surface border border-paper-card/50 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-paper-accent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-paper-muted">行距</label>
                    <select value={styleOverrides.lineSpacing || 1.5}
                      onChange={e => setStyleOverrides(p => ({...p, lineSpacing: Number(e.target.value)}))}
                      className="w-full bg-paper-surface border border-paper-card/50 rounded px-2 py-1 text-[10px] focus:outline-none">
                      <option value={1.0}>1.0 倍</option>
                      <option value={1.25}>1.25 倍</option>
                      <option value={1.5}>1.5 倍</option>
                      <option value={2.0}>2.0 倍</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-paper-muted">上边距 (cm)</label>
                    <input type="number" min="1" max="5" step="0.1" value={styleOverrides.marginTop || 2.5}
                      onChange={e => setStyleOverrides(p => ({...p, marginTop: Number(e.target.value)}))}
                      className="w-full bg-paper-surface border border-paper-card/50 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-paper-accent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-paper-muted">下边距 (cm)</label>
                    <input type="number" min="1" max="5" step="0.1" value={styleOverrides.marginBottom || 2.5}
                      onChange={e => setStyleOverrides(p => ({...p, marginBottom: Number(e.target.value)}))}
                      className="w-full bg-paper-surface border border-paper-card/50 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-paper-accent" />
                  </div>
                </div>
              </div>

              <button onClick={handleFormatExport} disabled={isExporting || !detectedPaper}
                className="w-full py-3 bg-paper-gold text-paper-bg rounded font-medium text-sm hover:brightness-110 disabled:opacity-40">
                {isExporting ? '导出中...' : '📥 导出规范 Word 文档'}
              </button>
            </>
          )}

        </aside>

        {/* Right Panel */}
        <main className="flex-1 overflow-y-auto p-6" onMouseUp={handleTextSelection}>
          <div className="max-w-3xl mx-auto">{renderPreview()}</div>
        </main>
        {selectedText && selectionPos && (
          <button onClick={handleSendToPolish}
            style={{ position: 'fixed', left: selectionPos.x, top: selectionPos.y - 30, zIndex: 50 }}
            className="px-3 py-1.5 bg-paper-accent text-white rounded-lg text-xs font-medium shadow-lg hover:brightness-110 transition-all animate-pulse">
            → 发送到改稿
          </button>
        )}
      </div>
    </div>
  );
}
