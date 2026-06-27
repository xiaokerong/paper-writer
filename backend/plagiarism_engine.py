"""AI 查重分析引擎 — 原创度评估 + 智能降重"""
from paper_engine import _call_deepseek, _parse_json

PLAGIARISM_ANALYZE_PROMPT = """你是学术查重分析专家。分析给定文本，评估其原创度。

请按JSON格式返回：
{
  "overall_score": 78,
  "summary": "整体评估总结（50-100字）",
  "segments": [
    {
      "text": "段落原文（前50字截断）",
      "score": 85,
      "risk": "low",
      "comment": "此段表述独特，原创度高"
    }
  ]
}

评估标准：
- 90-100分：高度原创，表述独特
- 70-89分：整体原创，部分通用表达
- 50-69分：存在较高相似风险
- 0-49分：高度相似，明显套用模板

risk等级：low（低风险）/ medium（中风险）/ high（高风险）"""


PLAGIARISM_REDUCE_PROMPT = """你是降重改写专家。对给定文本进行改写，降低相似度。

请按JSON格式返回：
{
  "rewritten": "改写后的全文",
  "changes": ["修改1说明", "修改2说明"],
  "estimated_reduction": "预计相似度降低 25%"
}

改写策略：
- 同义替换：替换关键词汇
- 结构调整：改变句子顺序和结构
- 主动被动转换：变换语态
- 合并拆分：合并短句或拆分长句
- 保持原意不变，不添加新内容"""


async def analyze_originality(text: str) -> dict:
    """AI 分析文本原创度

    Args:
        text: 待分析的文本

    Returns:
        {"overall_score": int, "summary": str, "segments": [...]}
    """
    if len(text.strip()) < 50:
        raise ValueError("文本过短（少于50字），无法有效分析")

    # 将文本按段落分割，每段最多500字
    paragraphs = text.split("\n")
    segments = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) > 500 and current:
            segments.append(current.strip())
            current = para
        else:
            current += "\n" + para if current else para
    if current.strip():
        segments.append(current.strip())

    if len(segments) > 6:
        segments = segments[:6]

    user_msg = f"""请分析以下文本的原创度。共 {len(segments)} 段：

"""
    for i, seg in enumerate(segments, 1):
        user_msg += f"第{i}段：{seg[:400]}\n\n"

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": PLAGIARISM_ANALYZE_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        max_tokens=4096,
    )
    return _parse_json(content)


async def reduce_similarity(text: str, mode: str = "smart") -> dict:
    """AI 降重改写

    Args:
        text: 待改写文本
        mode: 改写模式 smart/structure/synonym

    Returns:
        {"rewritten": str, "changes": [...], "estimated_reduction": str}
    """
    if len(text.strip()) < 20:
        raise ValueError("文本过短，无法改写")

    mode_desc = {
        "smart": "综合使用同义替换、结构调整、语态转换等多种策略",
        "structure": "主要调整句子顺序和段落结构",
        "synonym": "主要替换关键词汇为同义表达",
    }

    user_msg = f"""改写模式：{mode} ({mode_desc.get(mode, mode)})

待改写文本：
{text}

请改写以上文本以降低相似度，保持原意不变。"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": PLAGIARISM_REDUCE_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.5,
        max_tokens=8192,  # 长文本改写需要更多 token
    )
    return _parse_json(content)
