# PaperCraft → WPS 论文助手风格改造计划

> 日期: 2026-06-20 | 目标: 对标 WPS AI 论文助手 + 知网研学 AI 选题分析

---

## 改造目标

### 1. 🔥 AI 选题分析升级（对标知网研学）
- ✅ 选题趋势折线图（年份-发文量）
- ✅ 研究热点雷达图（多维度对比）
- ✅ 关键词词云 / 关联图
- ✅ 学科分布饼图
- ✅ 选题对比（多选题雷达图对比）
- ✅ 选题可行性评分卡片

### 2. 🎨 学术配图生成
- ✅ 柱状图、折线图、饼图、散点图 实际生成
- ✅ 流程图（Mermaid 风格）
- ✅ 图表可导出/嵌入论文
- ✅ 论文数据表自动生成

### 3. 📊 文献计量分析
- ✅ 高引论文排行
- ✅ 发文趋势分析
- ✅ 研究热点演变

---

## 技术选型
- 前端图表: **recharts** (React 原生，轻量)
- 数据生成: DeepSeek API + Semantic Scholar API
- 词云: react-wordcloud 或自绘

## 实施步骤
- [ ] Task 1: 安装 recharts，更新依赖
- [ ] Task 2: 重构 topic_engine.py — 返回选题分析可视化数据
- [ ] Task 3: 重构 chart_engine.py — 返回实际图表配置
- [ ] Task 4: 新增 visual_engine.py — 选题趋势/词云/关联数据
- [ ] Task 5: 更新 main.py — 新增可视化 API
- [ ] Task 6: 更新 types.ts — 新增可视化类型
- [ ] Task 7: 更新 api.ts — 新增可视化 API 调用
- [ ] Task 8: 创建 ChartComponents.tsx — 可复用图表组件
- [ ] Task 9: 重写 App.tsx 选题模块 — WPS 风格
- [ ] Task 10: 重写 App.tsx 图表模块 — 学术配图
- [ ] Task 11: 验证编译
