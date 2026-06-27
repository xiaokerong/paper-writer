const fs = require('fs');
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'AI项目小组';
pptx.title = '课程论文智能写作与润色系统';

const C = {
  bg: '16213e', surface: '0f3460', accent: 'e94560',
  gold: 'f5c518', text: 'eaeaea', muted: 'a0a0b0'
};

function sidebar(slide) {
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.63, fill: { color: C.accent } });
}

// Slide 1: Title
{
  const s = pptx.addSlide();
  s.background = { color: C.bg }; sidebar(s);
  s.addText('人工智能综合项目开发 · 期末答辩', { x: 0.5, y: 0.6, w: 9, h: 0.4, fontSize: 12, color: C.accent, align: 'center', fontFace: 'Arial' });
  s.addText('课程论文智能写作\n与润色系统', { x: 0.5, y: 1.4, w: 9, h: 1.6, fontSize: 42, color: C.text, bold: true, align: 'center', fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 4.2, y: 3.0, w: 1.2, h: 0.04, fill: { color: C.gold } });
  s.addText('基于 DeepSeek 大模型的 AI 论文辅助写作平台', { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 18, color: C.gold, align: 'center', fontFace: 'Arial' });
  s.addText('选题5：论文自动生成及润色系统', { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 14, color: C.muted, align: 'center', fontFace: 'Arial' });
}

// Slide 2: Background
{
  const s = pptx.addSlide(); s.background = { color: C.bg }; sidebar(s);
  s.addText('项目背景与目标', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, color: C.text, bold: true, fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.95, w: 0.7, h: 0.04, fill: { color: C.accent } });

  s.addText([
    { text: '痛点：', options: { color: C.accent, bold: true, fontSize: 14 } },
    { text: '课程论文写作耗时长、学生缺乏学术写作经验、格式排版繁琐。', options: { color: C.text, fontSize: 14 } },
  ], { x: 0.5, y: 1.2, w: 9, h: 0.5, fontFace: 'Arial' });

  s.addText([
    { text: '机遇：', options: { color: C.accent, bold: true, fontSize: 14 } },
    { text: 'DeepSeek大模型具备强大的文本生成和语言理解能力，可辅助完成论文写作。', options: { color: C.text, fontSize: 14 } },
  ], { x: 0.5, y: 1.7, w: 9, h: 0.5, fontFace: 'Arial' });

  ['📝 AI自动生成完整论文初稿', '✨ 四种学术润色模式', '📥 一键导出规范Word文档'].forEach((c, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 2.6, w: 2.8, h: 2.0, fill: { color: C.surface }, rectRadius: 0.1 });
    s.addText(c, { x: x + 0.2, y: 3.0, w: 2.4, h: 1.2, fontSize: 14, color: C.gold, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
  });
}

// Slide 3: Architecture
{
  const s = pptx.addSlide(); s.background = { color: C.bg }; sidebar(s);
  s.addText('系统架构', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, color: C.text, bold: true, fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.95, w: 0.7, h: 0.04, fill: { color: C.accent } });

  const boxes = [
    { x: 0.5, y: 1.3, w: 4.2, h: 1.1, title: '🖥 前端层', desc: 'React + TypeScript | 分章节渲染 | 润色交互面板 | Word导出', c: C.accent },
    { x: 5.1, y: 1.3, w: 4.2, h: 1.1, title: '🤖 AI生成引擎', desc: 'DeepSeek v4 API | 结构化Prompt | JSON格式化输出 | 分段生成', c: C.gold },
    { x: 0.5, y: 2.9, w: 4.2, h: 1.1, title: '⚙ 后端服务', desc: 'FastAPI REST | 论文管理 | 多轮对话 | 历史记录', c: C.accent },
    { x: 5.1, y: 2.9, w: 4.2, h: 1.1, title: '✨ 润色引擎', desc: '语法修正 | 学术化改写 | 内容扩展 | 文本精简', c: C.gold },
    { x: 0.5, y: 4.2, w: 4.2, h: 1.1, title: '📄 导出模块', desc: 'python-docx | 规范格式 | 宋体/黑体 | GB/T 7714', c: C.accent },
    { x: 5.1, y: 4.2, w: 4.2, h: 1.1, title: '🔄 多轮交互', desc: '上下文保持 | 逐段修改 | 反复打磨 | 版本管理', c: C.gold },
  ];
  boxes.forEach(b => {
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: b.x, y: b.y, w: b.w, h: b.h, fill: { color: C.surface }, rectRadius: 0.06 });
    s.addShape(pptx.shapes.RECTANGLE, { x: b.x, y: b.y, w: 0.04, h: b.h, fill: { color: b.c } });
    s.addText(b.title, { x: b.x + 0.2, y: b.y + 0.12, w: b.w - 0.3, h: 0.3, fontSize: 11, color: b.c, bold: true, fontFace: 'Arial' });
    s.addText(b.desc, { x: b.x + 0.2, y: b.y + 0.45, w: b.w - 0.3, h: 0.5, fontSize: 10, color: C.muted, fontFace: 'Arial' });
  });
}

// Slide 4: Core Modules
{
  const s = pptx.addSlide(); s.background = { color: C.bg }; sidebar(s);
  s.addText('核心功能详解', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, color: C.text, bold: true, fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.95, w: 0.7, h: 0.04, fill: { color: C.accent } });

  const mods = [
    ['📝 论文生成', '输入主题+关键词+大纲\nDeepSeek自动生成：\n标题→摘要→正文→结论→参考文献'],
    ['✨ 学术润色', '四种模式：\n语法修正 / 学术化改写\n内容扩展 / 文本精简\n返回修改说明'],
    ['📄 Word导出', 'python-docx生成规范文档\n宋体正文+黑体标题\n1.5倍行距+首行缩进'],
    ['🔄 多轮交互', '支持逐章修改\n上下文保持\n反复打磨优化'],
    ['🎨 前端界面', '分章节卡片渲染\n润色结果对比展示\n一键导出下载'],
  ];
  mods.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 3.2;
    const y = 1.3 + row * 2.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.9, h: 1.8, fill: { color: C.surface }, rectRadius: 0.08 });
    s.addText(m[0], { x: x + 0.15, y: y + 0.1, w: 2.6, h: 0.35, fontSize: 12, color: C.gold, bold: true, fontFace: 'Arial' });
    s.addText(m[1], { x: x + 0.15, y: y + 0.55, w: 2.6, h: 1.1, fontSize: 10, color: C.muted, fontFace: 'Arial' });
  });
}

// Slide 5: Tech Highlights
{
  const s = pptx.addSlide(); s.background = { color: C.bg }; sidebar(s);
  s.addText('技术亮点', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, color: C.text, bold: true, fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.95, w: 0.7, h: 0.04, fill: { color: C.accent } });

  const items = [
    { n: '1', t: 'DeepSeek v4 推理模型', d: '使用DeepSeek v4-flash推理模型，具备强大的链式思考和长文本生成能力' },
    { n: '2', t: '结构化 Prompt 工程', d: '精心设计System Prompt + JSON格式化指令，确保输出结构一致且内容高质量' },
    { n: '3', t: 'python-docx 规范导出', d: '按学术论文标准设置页边距、行距、字体、缩进，生成可直接提交的Word文档' },
    { n: '4', t: '多模式润色引擎', d: '支持语法修正、学术化改写、内容扩展、文本精简四种模式，满足不同需求' },
  ];
  items.forEach((item, i) => {
    const y = 1.3 + i * 1.0;
    s.addShape(pptx.shapes.OVAL, { x: 0.5, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: C.accent } });
    s.addText(item.n, { x: 0.5, y: y + 0.05, w: 0.42, h: 0.42, fontSize: 15, color: C.text, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
    s.addText(item.t, { x: 1.1, y, w: 8, h: 0.3, fontSize: 14, color: C.gold, bold: true, fontFace: 'Arial' });
    s.addText(item.d, { x: 1.1, y: 0.32, w: 8, h: 0.5, fontSize: 11, color: C.muted, fontFace: 'Arial' });
  });
}

// Slide 6: Summary
{
  const s = pptx.addSlide(); s.background = { color: C.bg }; sidebar(s);
  s.addText('总结与展望', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, color: C.text, bold: true, fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.95, w: 0.7, h: 0.04, fill: { color: C.accent } });

  s.addText('项目成果', { x: 0.7, y: 1.3, w: 4, h: 0.35, fontSize: 16, color: C.gold, bold: true, fontFace: 'Arial' });
  ['✅ AI自动生成完整课程论文（标题+摘要+正文+结论+参考文献）', '✅ 四种润色模式满足不同学术写作需求', '✅ 一键导出符合规范的Word格式文档', '✅ 精美的前端界面，支持论文预览和润色交互'].forEach((a, i) => {
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.8 + i * 0.55, w: 4.5, h: 0.45, fill: { color: C.surface }, rectRadius: 0.04 });
    s.addText(a, { x: 0.65, y: 1.8 + i * 0.55, w: 4.2, h: 0.45, fontSize: 10, color: C.muted, valign: 'middle', fontFace: 'Arial' });
  });

  s.addText('未来方向', { x: 5.7, y: 1.3, w: 4, h: 0.35, fontSize: 16, color: C.accent, bold: true, fontFace: 'Arial' });
  ['▸ 支持LaTeX和PDF导出', '▸ 增加参考文献自动检索', '▸ 支持更多论文模板', '▸ 接入知网/万方知识库', '▸ 多语言论文生成'].forEach((f, i) => {
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 5.3, y: 1.8 + i * 0.48, w: 4.2, h: 0.38, fill: { color: C.surface }, rectRadius: 0.04 });
    s.addText(f, { x: 5.45, y: 1.8 + i * 0.48, w: 3.9, h: 0.38, fontSize: 10, color: C.muted, valign: 'middle', fontFace: 'Arial' });
  });
}

// Slide 7: Thanks
{
  const s = pptx.addSlide(); s.background = { color: C.bg }; sidebar(s);
  s.addText('感谢聆听', { x: 0.5, y: 1.5, w: 9, h: 1.0, fontSize: 44, color: C.text, bold: true, align: 'center', fontFace: 'Arial' });
  s.addShape(pptx.shapes.RECTANGLE, { x: 4.2, y: 2.6, w: 1.2, h: 0.04, fill: { color: C.gold } });
  s.addText('课程论文智能写作与润色系统', { x: 0.5, y: 2.9, w: 9, h: 0.4, fontSize: 18, color: C.muted, align: 'center', fontFace: 'Arial' });
  s.addText('基于 DeepSeek 大模型的 AI 论文辅助写作平台', { x: 0.5, y: 3.3, w: 9, h: 0.4, fontSize: 14, color: C.muted, align: 'center', fontFace: 'Arial' });
  s.addText('React + FastAPI + DeepSeek v4 + python-docx', { x: 0.5, y: 4.0, w: 9, h: 0.4, fontSize: 12, color: C.gold, align: 'center', fontFace: 'Arial' });
}

const outPath = 'E:/deepchat/paper-writer/attachments/答辩PPT.pptx';
pptx.writeFile({ fileName: outPath }).then(() => console.log('PPT generated: ' + outPath));
