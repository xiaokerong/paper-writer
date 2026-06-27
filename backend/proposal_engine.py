"""开题报告引擎 — 生成规范开题报告"""
from paper_engine import _call_deepseek, _parse_json

PROPOSAL_SYSTEM_PROMPT = """你是学术开题报告撰写专家。根据选题信息和已有文献综述，生成规范的开题报告。

请按JSON格式返回：
{
  "sections": [
    {"heading": "一、研究背景与意义", "content": "..."},
    {"heading": "二、国内外研究现状", "content": "..."},
    {"heading": "三、研究目标与内容", "content": "..."},
    {"heading": "四、研究方法与技术路线", "content": "..."},
    {"heading": "五、研究计划与进度安排", "content": "..."},
    {"heading": "六、预期成果与创新点", "content": "..."}
  ],
  "references": ["参考文献1", "参考文献2"]
}

要求：
- 每部分内容充实（300-800字）
- 技术路线要具体可行
- 进度安排要合理（给出具体时间节点）
- 如提供了文献综述引用，在"国内外研究现状"中整合使用"""


async def generate_proposal(
    topic: str,
    background: str = "",
    citations: list[dict] | None = None,
    paper_type: str = "本科毕业论文"
) -> dict:
    """生成开题报告

    Args:
        topic: 论文主题
        background: 研究背景补充
        citations: 文献综述产出的引用列表（可选）
        paper_type: 论文类型

    Returns:
        {"sections": [...], "references": [...]}
    """
    if not topic.strip():
        raise ValueError("请输入论文主题")

    citation_text = ""
    if citations:
        citation_text = "\n已有的文献综述引用：\n"
        for c in citations:
            citation_text += f"[{c.get('index', '')}] {c.get('full_text', '')}\n"

    user_msg = f"""论文主题：{topic}
论文类型：{paper_type}
补充背景：{background if background else '无'}
{citation_text}

请生成完整的开题报告。"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": PROPOSAL_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.5,
        max_tokens=8192,
    )
    return _parse_json(content)
