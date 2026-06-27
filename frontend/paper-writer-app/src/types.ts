export interface PaperData {
  id: string;
  topic: string;
  title: string;
  author?: string;
  abstract: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
  references: string[];
  keywords: string[];
  bibtex?: string;
}

export interface PolishResult {
  original: string;
  polished: string;
  changes: string[];
  mode: string;
}

export interface GenerateRequest {
  topic: string;
  keywords: string[];
  outline: string;
  paper_type: string;
  language: string;
  citations?: Array<{ full_text: string }>;
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

export interface TopicSuggestion {
  title: string;
  background: string;
  innovation: string;
  feasibility: string;
  suggested_keywords: string[];
  difficulty: string;
  metrics?: TopicMetrics;
  _compared?: boolean;
}

export interface TopicMetrics {
  research_heat: number;
  innovation_score: number;
  data_availability: number;
  practical_value: number;
  method_maturity: number;
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
  url: string;
  selected: boolean;
}

export interface Citation {
  index: number;
  full_text: string;
}

export interface LiteratureReview {
  review_text: string;
  citations: Citation[];
}

export interface ProposalSection {
  heading: string;
  content: string;
}

export interface ProposalData {
  sections: ProposalSection[];
  references: string[];
}

export interface PlagiarismSegment {
  text: string;
  score: number;
  risk: 'low' | 'medium' | 'high';
  comment: string;
}

export interface PlagiarismReport {
  overall_score: number;
  summary: string;
  segments: PlagiarismSegment[];
}

export interface PlagiarismReduceResult {
  rewritten: string;
  changes: string[];
  estimated_reduction: string;
}

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

export interface HotKeyword {
  keyword: string;
  frequency: number;
  trend: 'hot' | 'rising' | 'stable' | 'cooling';
}

export interface KeywordCluster {
  cluster: string;
  keywords: string[];
  weight: number;
}

export interface SubjectDist {
  name: string;
  value: number;
}

export interface TopicRecommendResult {
  topics: TopicSuggestion[];
  hot_keywords: HotKeyword[];
  keyword_clusters: KeywordCluster[];
  subject_distribution: SubjectDist[];
}

export interface TrendPoint {
  year: number;
  count: number;
}

export interface TopicTrendData {
  keyword: string;
  trend: TrendPoint[];
}

export interface TopicCompareItem {
  topic: string;
  metrics: Record<string, number>;
}

export interface TopicCompareData {
  comparison: TopicCompareItem[];
  radar_axes: string[];
}

export interface WordCloudItem {
  text: string;
  value: number;
  trend: string;
}

export interface WordCloudData {
  words: WordCloudItem[];
}

export interface CitationItem {
  title: string;
  authors: string[];
  year: number;
  citations: number;
  venue: string;
}

export interface YearDistItem {
  year: number;
  count: number;
}

export interface CitationAnalysisData {
  top_cited: CitationItem[];
  year_distribution: YearDistItem[];
  total_found: number;
}

export interface NetworkNode {
  id: string;
  group: number;
  weight: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface KeywordNetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface HotspotYearItem {
  year: number;
  keywords: string[];
}

export interface HotspotData {
  hotspots: HotspotYearItem[];
}

export interface ChartDataPoint {
  name?: string;
  value?: number;
  x?: number | string;
  y?: number;
  points?: Array<{ x: number | string; y: number }>;
}

export interface ChartItem {
  chart_type: 'bar_chart' | 'line_chart' | 'pie_chart' | 'scatter_chart' | 'flowchart';
  title: string;
  x_label?: string;
  y_label?: string;
  data: ChartDataPoint[];
  nodes?: Array<{ id: string; label: string; description: string }>;
  edges?: Array<{ from: string; to: string; label: string }>;
}

export interface TableItem {
  title: string;
  headers: string[];
  rows: string[][];
  caption: string;
}

export interface ChartGenerateResult {
  charts: ChartItem[];
  tables: TableItem[];
}

export interface ChartGenerateRequest {
  paper_data: PaperData;
  chart_types?: string[];
}

export interface ChartSuggestion {
  section: string;
  chart_type: string;
  title: string;
  description: string;
  data_descriptions: string[];
}

export interface GeneratableTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ChartPlan {
  suggestions: ChartSuggestion[];
  generatable_tables: GeneratableTable[];
}

export interface RiskDistributionItem {
  name: string;
  value: number;
  color: string;
}

