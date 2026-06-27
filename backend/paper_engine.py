"""论文生成引擎 - DeepSeek 结构化生成"""
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
MODEL = "deepseek-v4-flash"

PAPER_SYSTEM_PROMPT = """你是一位资深的学术论文写作专家。你的任务是根据用户提供的主题、关键词和大纲，生成一篇结构完整、内容充实的学术论文。

请严格按照以下JSON格式输出论文内容：
{
  "title": "论文标题（中文学术风格）",
  "abstract": "摘要（200-400字，包含研究背景、方法、主要发现和结论）",
  "sections": [
    {"heading": "一、引言", "content": "引言内容（1500-2500字）"},
    {"heading": "二、...", "content": "章节内容（每章1200-2000字）"}
  ],
  "conclusion": "结论内容（800-1200字）",
  "references": ["参考文献1", "参考文献2", "..."]
}

论文要求：
- 学术语言规范，逻辑清晰
- 引用权威资料和最新研究
- 每个章节有明确的主题句和层次结构
- 数据和分析要具体，避免空泛论述
- 参考文献格式规范（APA或GB/T 7714）
- 根据用户提供的大纲来组织章节结构，如果没有提供大纲则自行规划"""


async def _call_deepseek(messages: list[dict], temperature: float = 0.7, max_tokens: int = 8192) -> str:
    """调用DeepSeek API"""
    if not DEEPSEEK_API_KEY:
        raise ValueError("未配置 DeepSeek API Key")

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        if resp.status_code != 200:
            detail = ""
            try:
                detail = resp.json()
            except Exception:
                detail = resp.text[:500]
            raise ValueError(f"DeepSeek API 返回错误 ({resp.status_code}): {detail}")
        data = resp.json()
        if "choices" not in data:
            raise ValueError(f"DeepSeek API 响应格式异常: {data}")
        content = data["choices"][0]["message"]["content"]
        if not content or not content.strip():
            raise ValueError("DeepSeek API 返回了空内容，请稍后重试")
        return content


def _parse_json(content: str) -> dict:
    """从DeepSeek响应中解析JSON，带容错处理"""
    import re

    content = content.strip()
    # 移除 markdown 代码块（正则方式，更鲁棒）
    content = re.sub(r'^```(?:json)?\s*\n?', '', content)
    content = re.sub(r'\n?```\s*$', '', content)
    content = content.strip()

    def _try_parse(text: str):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None

    # 1. 直接解析
    result = _try_parse(content)
    if result is not None:
        return result

    # 2. 修复无效的JSON转义序列
    #    AI 输出经常包含 LaTeX 命令（\section、\textbf 等）或 Markdown，
    #    这些反斜杠在 JSON 字符串中属于非法转义。
    #    合法 JSON 转义：\" \\ \/ \b \f \n \r \t \uXXXX
    fixed = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', content)
    result = _try_parse(fixed)
    if result is not None:
        return result

    # 3. 用正则从混合内容中提取JSON（也尝试修复转义）
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        extracted = match.group()
        result = _try_parse(extracted) or _try_parse(
            re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', extracted)
        )
        if result is not None:
            return result

    # 4. 尝试修复截断的 JSON（AI 输出达到 max_tokens 时常见）
    truncated = content.rstrip()
    open_braces = truncated.count("{") - truncated.count("}")
    open_brackets = truncated.count("[") - truncated.count("]")
    in_string = truncated.count('"') % 2 == 1
    fixed = truncated
    if in_string:
        # 找到最后一个未闭合的字符串位置并截断
        last_quote = fixed.rfind('"')
        if last_quote > 0:
            slash_count = 0
            j = last_quote - 1
            while j >= 0 and fixed[j] == '\\':
                slash_count += 1
                j -= 1
            if slash_count % 2 == 0:
                fixed = fixed[:last_quote]
    # 去除尾部逗号（截断后数组/对象末尾可能有残留逗号）
    fixed = fixed.rstrip(',')
    # 先闭合数组（内层），再闭合对象（外层）
    if open_brackets > 0:
        fixed += "]" * open_brackets
    if open_braces > 0:
        fixed += "}" * open_braces
    result = _try_parse(fixed)
    if result is not None:
        return result
    # 也尝试修复转义后再闭合
    result = _try_parse(re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', fixed))
    if result is not None:
        return result

    raise ValueError(
        f"AI 返回内容无法解析为 JSON。\n"
        f"原始内容(前500字符): {content[:500]}"
    )


async def generate_paper(
    topic: str,
    keywords: list[str],
    outline: str,
    paper_type: str,
    language: str,
    citations: list[dict] | None = None
) -> dict:
    """生成完整论文（支持传入真实引用列表）"""
    kw_str = "、".join(keywords) if keywords else "未指定"
    outline_str = outline if outline.strip() else "请根据主题自行规划合理的论文章节结构"

    citation_text = ""
    if citations:
        citation_text = "\n\n以下是论文中需要引用的真实文献（请在参考文献和正文中使用这些文献）：\n"
        for c in citations:
            citation_text += f"- {c.get('full_text', c.get('text', str(c)))}\n"
        citation_text += "\n请在论文正文中恰当引用这些文献，并在参考文献列表中包含它们。"

    user_msg = f"""请根据以下信息生成一篇{paper_type}：

论文主题：{topic}
关键词：{kw_str}
输出语言：{language}

用户提供的大纲/要求：
{outline_str}
{citation_text}

请生成完整的论文JSON。"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": PAPER_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.7,
        max_tokens=8192,
    )
    return _parse_json(content)


async def continue_writing(history: list[dict], instruction: str, context: str = "") -> str:
    """多轮对话 - 根据指令修改论文"""
    system_msg = """你是学术论文写作助手。用户要求对论文进行修改。
请根据用户的指令，返回修改后的完整内容（JSON格式或纯文本）。
如果是针对特定章节，只返回该章节的修改结果。
如果是全文修改，返回完整的论文JSON。"""
    
    messages = [{"role": "system", "content": system_msg}]
    # 添加最近的对话历史（最多保留最近6轮）
    for msg in history[-12:]:
        messages.append(msg)
    messages.append({"role": "user", "content": f"修改指令：{instruction}\n上下文：{context if context else '全文'}"})

    return await _call_deepseek(messages, temperature=0.5, max_tokens=4096)
