"""Semantic Scholar API 客户端 — 真实学术文献检索"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "")
BASE_URL = "https://api.semanticscholar.org/graph/v1"
FIELDS = "title,authors,year,venue,citationCount,abstract,externalIds,url"


async def search_papers(
    query: str,
    limit: int = 20,
    year_from: int = 2020
) -> dict:
    """搜索学术论文

    Args:
        query: 搜索关键词
        limit: 返回数量（最大 100）
        year_from: 起始年份过滤

    Returns:
        {"papers": [...], "total_count": N}
    """
    headers = {}
    if API_KEY:
        headers["x-api-key"] = API_KEY

    params = {
        "query": query,
        "limit": min(limit, 100),
        "fields": FIELDS,
    }
    if year_from:
        params["year"] = f"{year_from}-"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BASE_URL}/paper/search",
            headers=headers,
            params=params,
        )

        if resp.status_code == 429:
            raise RuntimeError(
                "Semantic Scholar API 请求过于频繁，请 1 分钟后重试。"
                "如果有 API Key 请配置到 .env: SEMANTIC_SCHOLAR_API_KEY=xxx"
            )
        if resp.status_code != 200:
            raise RuntimeError(f"Semantic Scholar API 错误 ({resp.status_code}): {resp.text[:300]}")

        data = resp.json()
        papers = []
        for item in data.get("data", []):
            authors = [a.get("name", "") for a in item.get("authors", [])]
            external = item.get("externalIds", {})
            papers.append({
                "paperId": item.get("paperId", ""),
                "title": item.get("title", ""),
                "authors": authors,
                "year": item.get("year"),
                "venue": item.get("venue", ""),
                "citationCount": item.get("citationCount", 0),
                "abstract": item.get("abstract", ""),
                "doi": external.get("DOI", ""),
                "url": item.get("url", ""),
            })

        return {
            "papers": papers,
            "total_count": data.get("total", len(papers)),
        }


async def get_paper_details(paper_id: str) -> dict:
    """获取单篇论文详细信息"""
    headers = {}
    if API_KEY:
        headers["x-api-key"] = API_KEY

    detail_fields = f"{FIELDS},references,referenceCount"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BASE_URL}/paper/{paper_id}",
            headers=headers,
            params={"fields": detail_fields},
        )

        if resp.status_code == 429:
            raise RuntimeError("Semantic Scholar API 限流，请稍后重试")
        if resp.status_code != 200:
            raise RuntimeError(f"获取论文详情失败 ({resp.status_code})")

        data = resp.json()
        authors = [a.get("name", "") for a in data.get("authors", [])]
        external = data.get("externalIds", {})

        return {
            "paperId": data.get("paperId", ""),
            "title": data.get("title", ""),
            "authors": authors,
            "year": data.get("year"),
            "venue": data.get("venue", ""),
            "citationCount": data.get("citationCount", 0),
            "abstract": data.get("abstract", ""),
            "doi": external.get("DOI", ""),
            "url": data.get("url", ""),
        }
