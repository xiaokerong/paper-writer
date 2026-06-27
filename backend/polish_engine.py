"""学术润色引擎"""
from paper_engine import _call_deepseek, _parse_json

POLISH_SYSTEM_PROMPT = """你是学术论文润色专家。根据用户选择的润色模式，对文本进行专业处理。

请严格按JSON格式返回：
{
  "polished": "润色后的文本",
  "changes": ["修改1说明", "修改2说明", "修改3说明"]
}

润色模式说明：
- grammar: 仅修正语法错误、拼写错误，保持原意不变
- academic: 将文本改写为学术化表达，使用正式学术用语
- expand: 在保持核心意思的基础上，扩展内容，增加论证深度
- condense: 精简文本，去除冗余表达，保留核心信息"""


async def polish_text(text: str, mode: str = "academic", context: str = "") -> dict:
    """润色文本"""
    mode_desc = {
        "grammar": "只修正语法和拼写错误，不要改变原意",
        "academic": "改写为学术化表达，使用正式学术用语",
        "expand": "扩展内容，增加论证深度和细节",
        "condense": "精简文本，去除冗余，保留核心要点",
        "de_plagiarize": "用同义替换和结构调整改写文本以降低相似度"
    }
    
    user_msg = f"""润色模式：{mode} - {mode_desc.get(mode, mode)}

{('上下文：' + context) if context else ''}

待润色文本：
{text}

请按JSON格式返回润色结果。"""

    content = await _call_deepseek(
        messages=[
            {"role": "system", "content": POLISH_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.5 if mode == "de_plagiarize" else 0.3,
        max_tokens=2048,
    )
    return _parse_json(content)
