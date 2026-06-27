"""可视化数据引擎 — 词云/引文分析/热点演化"""
import asyncio
import httpx
from paper_engine import _call_deepseek, _parse_json

SS_BASE = "https://api.semanticscholar.org/graph/v1"
_RATE_LIMIT_DELAY = 0.3  # Semantic Scholar 限流延迟（秒），可调


async def _search_ss(query: str, year_from: int = 2020, limit: int = 50) -> dict:
    """搜索 Semantic Scholar"""
    params = {
        "query": query,
        "limit": min(limit, 100),
        "fields": "title,year,citationCount,authors,venue,externalIds",
    }
    if year_from:
        params["year"] = f"{year_from}-"

    await asyncio.sleep(_RATE_LIMIT_DELAY)
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{SS_BASE}/paper/search", params=params)
        if resp.status_code != 200:
            return {"total": 0, "data": []}
        return resp.json()


async def get_wordcloud_data(field: str, max_words: int = 60) -> dict:
    """AI 生成领域词云数据

    Args:
        field: 学科领域关键词
        max_words: 最大词数

    Returns:
        {"words": [{"text": "深度学习", "value": 95, "trend": "hot"}, ...]}
    """
    prompt = f"""针对"{field}"领域，生成 {max_words} 个热门关键词的词云数据。

按JSON返回：
{{
  "words": [
    {{"text": "深度学习", "value": 95, "trend": "hot"}},
    {{"text": "神经网络", "value": 85, "trend": "rising"}},
    {{"text": "迁移学习", "value": 60, "trend": "stable"}}
  ]
}}
value 范围 1-100 表示热度，trend 为 hot/rising/stable/cooling"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": "你是学术领域分析专家，给出该领域的关键词分布。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2048,
    )
    return _parse_json(content)


async def get_citation_analysis(keyword: str, limit: int = 20) -> dict:
    """获取高引论文排行（真实数据）

    Args:
        keyword: 搜索关键词
        limit: 返回数量

    Returns:
        {"top_cited": [...], "year_distribution": [...], "total_found": N}
    """
    data = await _search_ss(query=keyword, limit=limit)

    papers = []
    years = {}
    for item in data.get("data", []):
        authors = [a.get("name", "") for a in item.get("authors", [])[:3]]
        paper = {
            "title": item.get("title", ""),
            "authors": authors,
            "year": item.get("year"),
            "citations": item.get("citationCount", 0),
            "venue": item.get("venue", ""),
        }
        papers.append(paper)

        y = item.get("year")
        if y:
            years[y] = years.get(y, 0) + 1

    # 按引用数排序
    papers.sort(key=lambda p: p["citations"], reverse=True)

    # 年份分布
    year_dist = [{"year": y, "count": c} for y, c in sorted(years.items())]

    return {
        "top_cited": papers[:limit],
        "year_distribution": year_dist,
        "total_found": data.get("total", len(papers)),
    }


async def get_keyword_network(field: str) -> dict:
    """AI 生成关键词关联网络数据

    Args:
        field: 领域关键词

    Returns:
        {"nodes": [...], "links": [...]}  — d3-force 格式
    """
    prompt = f"""针对"{field}"领域，生成关键词共现关联网络。

按JSON返回：
{{
  "nodes": [
    {{"id": "深度学习", "group": 1, "weight": 95}},
    {{"id": "神经网络", "group": 1, "weight": 85}},
    {{"id": "计算机视觉", "group": 2, "weight": 78}}
  ],
  "links": [
    {{"source": "深度学习", "target": "神经网络", "value": 0.9}},
    {{"source": "深度学习", "target": "计算机视觉", "value": 0.7}}
  ]
}}
- group 决定节点颜色分组（1-4 代表不同子领域）
- weight 节点权重 1-100
- value 连线强度 0-1"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": "你是学术知识图谱专家，分析领域关键词关联关系。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=3072,
    )
    return _parse_json(content)


async def get_research_hotspots(field: str, years: int = 5) -> dict:
    """AI 分析研究热点演化

    Args:
        field: 领域
        years: 最近几年

    Returns:
        {"hotspots": [{"year": 2024, "keywords": [...]}, ...]}
    """
    current_year = 2025
    year_list = list(range(current_year - years + 1, current_year + 1))

    prompt = f"""分析"{field}"领域从{year_list[0]}到{year_list[-1]}年每年最热门的研究方向（3-5个关键词）。

按JSON返回：
{{
  "hotspots": [
    {{"year": 2024, "keywords": ["大语言模型", "多模态学习", "AI安全"]}},
    {{"year": 2023, "keywords": ["大模型微调", "RLHF", "知识蒸馏"]}}
  ]
}}"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": "你是学术趋势分析师，追踪领域研究热点的年度变化。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=3072,
    )
    return _parse_json(content)
