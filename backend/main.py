"""论文智能写作与润色系统 - FastAPI 后端 v2.1"""
import uuid
import io
import json
import os

import traceback
from urllib.parse import quote
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from models import (
    PaperGenerateRequest, PolishRequest, MultiRoundRequest,
    FormatDetectRequest, FormatExportRequest,
    TopicRequest, LiteratureSearchRequest, LiteratureReviewRequest,
    ProposalRequest, PlagiarismAnalyzeRequest, PlagiarismReduceRequest,
    ChartGenerateRequest, ChartTablesRequest,
    TopicTrendRequest, TopicCompareRequest,
    WordCloudRequest, CitationRequest, KeywordNetworkRequest, HotspotRequest,
)
from paper_engine import generate_paper, continue_writing
from polish_engine import polish_text
from export_engine import export_to_docx
from format_engine import detect_structure, load_template, apply_template
from topic_engine import recommend_topics, get_topic_trend, compare_topics
from literature_engine import search_literature, generate_review
from proposal_engine import generate_proposal
from plagiarism_engine import analyze_originality, reduce_similarity
from chart_engine import generate_charts, generate_tables
from visual_engine import (
    get_wordcloud_data, get_citation_analysis,
    get_keyword_network, get_research_hotspots
)
from docx_parser import extract_text_from_docx, extract_structured_paper

app = FastAPI(title="论文智能写作与润色系统", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

papers_store: dict = {}
chat_history: dict = {}

# ── 静态文件（生产环境前端构建产物） ──
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    # API 路由在前面已经注册完毕，静态文件在最后兜底
    
    @app.get("/assets/{file_path:path}", include_in_schema=False)
    async def serve_assets(file_path: str):
        asset_file = os.path.join(STATIC_DIR, "assets", file_path)
        if os.path.exists(asset_file) and os.path.isfile(asset_file):
            return FileResponse(asset_file)
        raise HTTPException(404, "Asset not found")
    
    @app.get("/{filename:path}", include_in_schema=False)
    async def serve_frontend(filename: str):
        """SPA 前端：非 /api/ 请求都返回对应静态文件或 index.html"""
        if filename.startswith("api/"):
            raise HTTPException(404, "Not found")
        # 根路径或空路径 → 返回 index.html
        if not filename:
            index_path = os.path.join(STATIC_DIR, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path, media_type="text/html")
            raise HTTPException(404, "Not found")
        # 直接文件请求（如 favicon.svg, icons.svg）
        file_path = os.path.join(STATIC_DIR, filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # SPA 兜底：返回 index.html
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        raise HTTPException(404, "Not found")


# ═══════════════════════════════════════════
# 论文生成
# ═══════════════════════════════════════════

@app.post("/api/generate")
async def api_generate(req: PaperGenerateRequest):
    """生成论文初稿"""
    try:
        result = await generate_paper(
            topic=req.topic, keywords=req.keywords, outline=req.outline,
            paper_type=req.paper_type, language=req.language,
            citations=req.citations if req.citations else None,
        )
        paper_id = str(uuid.uuid4())[:8]
        papers_store[paper_id] = {**result, "id": paper_id, "topic": req.topic, "keywords": req.keywords}
        chat_history[paper_id] = [
            {"role": "user", "content": f"生成论文：主题={req.topic}，大纲={req.outline}"},
            {"role": "assistant", "content": JSON_STRINGIFY(result)},
        ]
        return papers_store[paper_id]
    except Exception as e:
        raise HTTPException(500, f"论文生成失败: {str(e)}")


# ═══════════════════════════════════════════
# 文本润色
# ═══════════════════════════════════════════

@app.post("/api/polish")
async def api_polish(req: PolishRequest):
    """润色文本"""
    try:
        result = await polish_text(req.text, req.mode, req.context)
        return result
    except Exception as e:
        raise HTTPException(500, f"润色失败: {str(e)}")


@app.post("/api/revise")
async def api_revise(req: MultiRoundRequest):
    """多轮对话修改论文"""
    if req.paper_id not in papers_store:
        raise HTTPException(404, "论文不存在")
    history = chat_history.get(req.paper_id, [])
    target = req.target_section if req.target_section else "全文"
    try:
        result = await continue_writing(history, req.instruction, target)
        chat_history[req.paper_id].append({"role": "user", "content": req.instruction})
        chat_history[req.paper_id].append({"role": "assistant", "content": result})
        return {"paper_id": req.paper_id, "result": result, "updated": True}
    except Exception as e:
        raise HTTPException(500, f"修改失败: {str(e)}")


# ═══════════════════════════════════════════
# 论文存取与导出
# ═══════════════════════════════════════════

@app.get("/api/paper/{paper_id}")
async def api_get_paper(paper_id: str):
    if paper_id not in papers_store:
        raise HTTPException(404, "论文不存在")
    return papers_store[paper_id]


@app.get("/api/export/{paper_id}")
async def api_export(paper_id: str):
    if paper_id not in papers_store:
        raise HTTPException(404, "论文不存在")
    try:
        docx_bytes = export_to_docx(papers_store[paper_id])
        title = papers_store[paper_id].get("title", "论文")
        safe_filename = quote(f"{title}.docx")
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}"}
        )
    except Exception as e:
        raise HTTPException(500, f"导出失败: {str(e)}")


@app.post("/api/export/docx")
async def api_export_docx(req: Request):
    try:
        data = await req.json()
        docx_bytes = export_to_docx(data)
        title = data.get("title", "论文")
        safe_filename = quote(f"{title}.docx")
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}"}
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"导出失败: {str(e)}")


# ═══════════════════════════════════════════
# 智能排版
# ═══════════════════════════════════════════

@app.post("/api/format/detect")
async def api_format_detect(req: FormatDetectRequest):
    if req.paper_id and req.paper_id in papers_store:
        return papers_store[req.paper_id]
    try:
        result = await detect_structure(req.raw_text)
        return result
    except Exception as e:
        raise HTTPException(500, f"结构识别失败: {str(e)}")


@app.post("/api/format/export")
async def api_format_export(req: FormatExportRequest):
    try:
        template = load_template(req.template)
        docx_bytes = apply_template(req.paper_data, template, req.style_overrides)
        title = req.paper_data.get("title", "论文")
        safe_filename = quote(f"{title}.docx")
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}"}
        )
    except Exception as e:
        raise HTTPException(500, f"排版导出失败: {str(e)}")


@app.get("/api/format/templates")
async def api_format_templates():
    templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    templates = []
    if os.path.isdir(templates_dir):
        for f in sorted(os.listdir(templates_dir)):
            if f.endswith(".json"):
                with open(os.path.join(templates_dir, f), "r", encoding="utf-8") as fh:
                    t = json.load(fh)
                    templates.append({"id": f.replace(".json", ""), "name": t.get("name", f), "description": t.get("description", "")})
    return {"templates": templates}


class FormatPipelineRequest(BaseModel):
    text: str = ""          # 纯文本输入
    file_bytes_b64: str = ""  # DOCX 文件 Base64 编码（可选）
    template_name: str = "gbt7713"

@app.post("/api/format/pipeline")
async def api_format_pipeline(text: str = Form(""), file: UploadFile = File(None), template_name: str = Form("gbt7713")):
    """统一排版管道：上传文件/文本 → 解析 → LLM 结构识别 → 返回结构化数据 + 模板元信息

    支持：
    - 纯文本粘贴（text 参数）
    - DOCX 文件上传（file 参数，自动提取纯文本后调用 LLM 识别）
    - 返回论文结构化数据 + 可用模板列表
    """
    try:
        raw_text = text.strip()

        # 上传文件时先提取纯文本
        if file and file.filename:
            contents = await file.read()
            raw_text = extract_text_from_docx(contents)
            if not raw_text.strip():
                raise HTTPException(400, "DOCX 文件内容为空")

        if not raw_text:
            raise HTTPException(400, "请提供文本内容或上传 DOCX 文件")

        # LLM 结构识别
        paper = await detect_structure(raw_text)

        # 加载模板信息
        template = load_template(template_name)
        templates_info = []
        templates_dir = os.path.join(os.path.dirname(__file__), "templates")
        if os.path.isdir(templates_dir):
            for f in sorted(os.listdir(templates_dir)):
                if f.endswith(".json"):
                    with open(os.path.join(templates_dir, f), "r", encoding="utf-8") as fh:
                        t = json.load(fh)
                        templates_info.append({"id": f.replace(".json", ""), "name": t.get("name", f), "description": t.get("description", "")})

        return {
            "paper": paper,
            "current_template": template_name,
            "template_info": template,
            "templates": templates_info,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"排版管道处理失败: {str(e)}")


# ═══════════════════════════════════════════
# v2.0 全流程模块
# ═══════════════════════════════════════════

@app.post("/api/topic/recommend")
async def api_topic_recommend(req: TopicRequest):
    """AI 选题推荐 + 可视化分析数据"""
    try:
        result = await recommend_topics(req.field, req.level, req.count)
        return result
    except Exception as e:
        raise HTTPException(500, f"选题推荐失败: {str(e)}")

@app.post("/api/literature/search")
async def api_literature_search(req: LiteratureSearchRequest):
    try:
        result = await search_literature(req.topic, req.keywords, req.year_from, req.limit)
        return result
    except Exception as e:
        raise HTTPException(500, f"文献搜索失败: {str(e)}")

@app.post("/api/literature/review")
async def api_literature_review(req: LiteratureReviewRequest):
    try:
        result = await generate_review(req.topic, req.selected_papers, req.language)
        return result
    except Exception as e:
        raise HTTPException(500, f"综述生成失败: {str(e)}")

@app.post("/api/proposal/generate")
async def api_proposal_generate(req: ProposalRequest):
    try:
        result = await generate_proposal(req.topic, req.background, req.citations, req.paper_type)
        return result
    except Exception as e:
        raise HTTPException(500, f"开题报告生成失败: {str(e)}")

@app.post("/api/plagiarism/analyze")
async def api_plagiarism_analyze(req: PlagiarismAnalyzeRequest):
    try:
        result = await analyze_originality(req.text)
        return result
    except Exception as e:
        raise HTTPException(500, f"查重分析失败: {str(e)}")

@app.post("/api/plagiarism/reduce")
async def api_plagiarism_reduce(req: PlagiarismReduceRequest):
    try:
        result = await reduce_similarity(req.text, req.mode)
        return result
    except Exception as e:
        raise HTTPException(500, f"降重改写失败: {str(e)}")


# ═══════════════════════════════════════════
# v2.1 学术配图 & 可视化分析（对标 WPS 论文助手）
# ═══════════════════════════════════════════

@app.post("/api/chart/generate")
async def api_chart_generate(req: ChartGenerateRequest):
    """AI 生成学术配图（柱状图/折线图/饼图/散点/流程图）"""
    try:
        result = await generate_charts(req.paper_data, req.chart_types if req.chart_types else None)
        return result
    except Exception as e:
        raise HTTPException(500, f"图表生成失败: {str(e)}")


@app.post("/api/chart/tables")
async def api_chart_tables(req: ChartTablesRequest):
    """AI 生成数据表格"""
    try:
        result = await generate_tables(req.paper_data, req.count)
        return result
    except Exception as e:
        raise HTTPException(500, f"表格生成失败: {str(e)}")


# ── 选题分析可视化 ──

@app.post("/api/topic/trend")
async def api_topic_trend(req: TopicTrendRequest):
    """获取选题发文趋势（Semantic Scholar 真实数据）"""
    try:
        result = await get_topic_trend(req.keyword, req.start_year, req.end_year)
        return result
    except Exception as e:
        raise HTTPException(500, f"趋势分析失败: {str(e)}")


@app.post("/api/topic/compare")
async def api_topic_compare(req: TopicCompareRequest):
    """多选题对比雷达图数据"""
    try:
        result = await compare_topics(req.keywords)
        return result
    except Exception as e:
        raise HTTPException(500, f"选题对比失败: {str(e)}")


# ── 可视化数据 ──

@app.post("/api/visual/wordcloud")
async def api_visual_wordcloud(req: WordCloudRequest):
    """AI 生成领域词云数据"""
    try:
        result = await get_wordcloud_data(req.field, req.max_words)
        return result
    except Exception as e:
        raise HTTPException(500, f"词云生成失败: {str(e)}")


@app.post("/api/visual/citations")
async def api_visual_citations(req: CitationRequest):
    """高引论文排行 + 年份分布"""
    try:
        result = await get_citation_analysis(req.keyword, req.limit)
        return result
    except Exception as e:
        raise HTTPException(500, f"引文分析失败: {str(e)}")


@app.post("/api/visual/keyword-network")
async def api_visual_keyword_network(req: KeywordNetworkRequest):
    """关键词共现关联网络"""
    try:
        result = await get_keyword_network(req.field)
        return result
    except Exception as e:
        raise HTTPException(500, f"关联网络生成失败: {str(e)}")


@app.post("/api/visual/hotspots")
async def api_visual_hotspots(req: HotspotRequest):
    """研究热点年度演化"""
    try:
        result = await get_research_hotspots(req.field, req.years)
        return result
    except Exception as e:
        raise HTTPException(500, f"热点分析失败: {str(e)}")


# ═══════════════════════════════════════════
# v2.3 DOCX 上传解析 + LaTeX/PDF 导出
# ═══════════════════════════════════════════


@app.post("/api/docx/parse")
async def api_docx_parse(file: UploadFile = File(...)):
    """上传 DOCX 文件，提取结构化论文数据"""
    try:
        if not file.filename.endswith('.docx'):
            raise HTTPException(400, "仅支持 .docx 文件")
        contents = await file.read()
        result = extract_structured_paper(contents)
        # 同时生成纯文本版本（用于 agent 管线输入）
        result["raw_text"] = extract_text_from_docx(contents)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"DOCX 解析失败: {str(e)}")


@app.post("/api/docx/to-text")
async def api_docx_to_text(file: UploadFile = File(...)):
    """上传 DOCX 文件，提取纯文本"""
    try:
        contents = await file.read()
        text = extract_text_from_docx(contents)
        return {"text": text, "length": len(text)}
    except Exception as e:
        raise HTTPException(500, f"文本提取失败: {str(e)}")


# ═══════════════════════════════════════════
# 健康检查
# ═══════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.1.0", "stored_papers": len(papers_store)}


def JSON_STRINGIFY(obj: dict) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
