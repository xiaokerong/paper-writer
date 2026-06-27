"""学术配图生成引擎 — 生成可渲染的图表数据 + AI 自动配图"""
from paper_engine import _call_deepseek, _parse_json

CHART_GENERATE_PROMPT = """你是学术论文配图专家。分析论文内容，生成可直接用于数据可视化的图表。

请严格按JSON格式返回。每种图表都有特定格式：

对于柱状图 (bar_chart):
{
  "chart_type": "bar_chart",
  "title": "图表标题",
  "x_label": "X轴标签",
  "y_label": "Y轴标签",
  "data": [
    {"name": "类别1", "value": 85},
    {"name": "类别2", "value": 72}
  ]
}

对于折线图 (line_chart):
{
  "chart_type": "line_chart",
  "title": "图表标题",
  "x_label": "X轴标签",
  "y_label": "Y轴标签",
  "data": [
    {"name": "系列1", "points": [{"x": 2020, "y": 50}, {"x": 2021, "y": 65}]}
  ]
}

对于饼图 (pie_chart):
{
  "chart_type": "pie_chart",
  "title": "图表标题",
  "data": [
    {"name": "类别1", "value": 35},
    {"name": "类别2", "value": 25}
  ]
}

对于散点图 (scatter_chart):
{
  "chart_type": "scatter_chart",
  "title": "图表标题",
  "x_label": "X轴",
  "y_label": "Y轴",
  "data": [
    {"name": "系列1", "points": [{"x": 12, "y": 45}, {"x": 18, "y": 55}]}
  ]
}

对于流程图 (flowchart):
{
  "chart_type": "flowchart",
  "title": "流程标题",
  "nodes": [
    {"id": "1", "label": "步骤1", "description": "说明"},
    {"id": "2", "label": "步骤2", "description": "说明"}
  ],
  "edges": [{"from": "1", "to": "2", "label": "过渡说明"}]
}

同时返回：
{
  "tables": [
    {
      "title": "表格标题",
      "headers": ["列1", "列2", "列3"],
      "rows": [["数据1", "数据2", "数据3"]],
      "caption": "表格说明"
    }
  ]
}

要求：
- 数据要合理、具体、有学术依据
- 每个数据点都要有实际意义
- 图表类型要匹配内容特点
- 如内容确实不适合某类图表，返回空数组
- 至少生成 1-3 个有意义的图表"""


async def generate_charts(paper_data: dict, chart_types: list[str] | None = None) -> dict:
    """AI 分析论文并生成实际图表数据

    Args:
        paper_data: 论文结构化数据
        chart_types: 指定图表类型列表，None 则自动推荐

    Returns:
        {"charts": [...], "tables": [...]}
    """
    paper_summary = f"标题：{paper_data.get('title', '')}\n"
    paper_summary += f"摘要：{paper_data.get('abstract', '')[:400]}\n"

    sections = paper_data.get("sections", [])
    for sec in sections[:5]:
        paper_summary += f"## {sec.get('heading', '')}\n{sec.get('content', '')[:300]}\n\n"

    if paper_data.get("conclusion"):
        paper_summary += f"结论：{paper_data['conclusion'][:300]}\n"

    chart_hint = ""
    if chart_types:
        chart_hint = f"\n请优先生成以下类型的图表：{', '.join(chart_types)}"

    user_msg = f"""分析以下论文内容，生成适合的数据可视化图表：

{paper_summary}
{chart_hint}

请生成图表数据和表格数据。数据要具体、合理，体现论文核心发现。"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": CHART_GENERATE_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.4,
        max_tokens=6144,
    )
    result = _parse_json(content)

    # 确保返回结构完整
    if isinstance(result, list):
        return {"charts": result, "tables": []}
    if "charts" not in result:
        result["charts"] = []
    if "tables" not in result:
        result["tables"] = []
    return result


async def generate_tables(paper_data: dict, count: int = 3) -> dict:
    """专门生成数据表格

    Args:
        paper_data: 论文数据
        count: 表格数量

    Returns:
        {"tables": [...]}
    """
    paper_summary = f"标题：{paper_data.get('title', '')}\n摘要：{paper_data.get('abstract', '')[:300]}\n"

    sections = paper_data.get("sections", [])
    for sec in sections[:3]:
        paper_summary += f"{sec.get('heading', '')}: {sec.get('content', '')[:200]}\n"

    prompt = f"""分析以下论文内容，生成 {count} 个有学术意义的数据表格。

{paper_summary}

请按JSON返回：
{{
  "tables": [
    {{
      "title": "表格标题",
      "headers": ["列1", "列2", "列3"],
      "rows": [["数据1", "数据2", "数据3"]],
      "caption": "表格说明"
    }}
  ]
}}"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": "你是学术数据整理专家。根据论文内容生成合理的示例数据表格。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=3072,
    )
    return _parse_json(content)


# 保留旧函数名兼容
async def suggest_charts(paper_data: dict) -> dict:
    """已废弃，请使用 generate_charts。保留以兼容已有 API。"""
    return await generate_charts(paper_data)
