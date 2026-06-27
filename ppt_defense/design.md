# Design Document

## 1. Profile Baseline Declaration

- **Profile selection**: `profiles/academic.md`
- **Selection rationale**: 本PPT为课程期末答辩演示，属于学术/项目汇报场景，目标受众为课程老师和同学，需要展现专业性和学术规范。
- **Referenced dimensions**: 高信息密度、内容为王的设计哲学、导航栏设计、严谨的字体层级、学术配色指导。
- **Deviation notes**: 
  - 本PPT为课程项目答辩而非严格学位论文答辩，因此允许在封面和章节页适度增加视觉活力和现代科技感。
  - 由于项目本身是AI/技术类产品，配色可偏向科技蓝而非传统学术灰，以体现项目特性。
  - 不强制要求参考文献页（课程答辩通常不需要），节省页数用于功能展示。

## 2. Style Baseline Declaration

- **Style anchor selection**: 
  - 主锚点：Nature/Science 论文图表风格 —— 参考其清晰的信息层级、数据可视化的严谨性。
  - 辅锚点：Apple Keynote 产品演示风格 —— 参考其大字体、留白呼吸感、简洁有力的排版。
- **Referenced dimension explanation**: 
  - 从 Nature/Science 风格参考：信息层级、图表标注规范、数据驱动叙事。
  - 从 Apple Keynote 风格参考：封面的视觉冲击、大字号标题、极简留白、核心信息单点聚焦。

## 3. Style Details

### 3.1 Color Design Principles
- **Overall tendency**: 介于保守稳重与鲜明大胆之间 —— 以稳重为基底，封面/章节页用科技感深蓝+金色点缀创造视觉记忆。
- **Temperature**: 偏冷，科技矿物质感。
- **Primary color**: `#1B3A5F`（深邃科技蓝）— 体现AI科技属性，沉稳专业，同时避开了廉价的亮蓝。
- **Background**: `#F5F7FA`（极浅蓝灰）— 保证图表和文本的高可读性，比纯白更有质感。
- **Text color**: `#1A1A2E`（深墨蓝）— 用于正文，比纯黑更柔和，与主色同色系。
- **Secondary color**: `#4A6D8C`（中蓝灰）— 用于导航栏、次要信息、辅助装饰。
- **Accent color**: `#D4A843`（学术金）— 仅用于关键数据、核心结论、封面/章节页的高光点缀，极度克制使用。
- **Light surface**: `#E8EEF4`（浅蓝灰）— 用于卡片背景、表格交替行。

### 3.2 Font Usage Principles
- **Title font**: `QuattrocentoSans, MiSans` — 经典优雅无衬线，英文清晰，中文匹配现代感。
- **Body font**: `QuattrocentoSans, MiSans` — 确保投影环境下的高可读性。
- **Font size hierarchy**:
  - 封面标题: 44px
  - 封面副标题: 20px
  - 页面标题: 30px
  - 内容小标题: 22px
  - 正文: 18px（内容密集）/ 20px（内容适中）
  - 辅助文字/脚注/导航: 14px
- **Title treatment**: 使用 Bold 字重，封面标题可配合字母间距（letterSpacing: 2）增加精致感。

### 3.3 Text Box and Container Styles
- **Content separation**: 优先使用留白和字号差异建立层级，辅以细线（1px, `#D1D9E0`）进行物理分隔。
- **Cards**: 仅在需要强烈 grouping 时使用浅色卡片（`#E8EEF4`，圆角 8px，无边框，无阴影），保持扁平化。
- **Decorative elements**: 
  - 页面标题下方使用 4px 高的短色条（Primary color 或 Accent color）作为视觉锚点。
  - 导航栏使用 Primary color 背景，当前章节高亮使用白色文字+底部 Accent color 指示条。

### 3.4 Image Style
- **Icons**: 使用 Solid 风格（fas:）图标，填充色为 Primary 或 Accent，用于功能列表和架构图节点，使用克制。
- **Tables**: 极简三线表风格，Header 行使用 Primary color 背景+白色文字，Body 行使用纯白与 `#E8EEF4` 交替，无竖向边框。
- **Charts**: 扁平化风格，使用同色系配色（Primary, Secondary, Accent, 及浅色调和色），确保数据区分度。
- **Illustrations**: 本项目以系统截图和架构图为主，截图需保持清晰，无需额外装饰性插图。

## 4. Layout System

### 4.1 Global Layout Characteristics
- **Page size**: 1280x720 (16:9)
- **Page margins**: 左右 60px，上下 50px。
- **Unified elements**:
  - **顶部导航栏**: 高度 40px，位于页面顶部，背景 Primary color，包含章节指示文字，当前章节使用白色文字+底部 3px Accent color 高亮条。
  - **页面标题区**: 位于导航栏下方（y=50），左侧对齐，标题下方紧跟 4px 高、50px 宽的色条。
  - **页脚**: 右下角放置页码（14px, Secondary color），左下角可放置辅助注释。

### 4.2 Special Page Layouts
- **Cover**: Hero design。全尺寸深色背景图（可合成：深蓝渐变底+抽象几何线条）+ 居中布局。主标题 44px 白色，副标题 20px 浅灰，底部金色细线分隔，最下方放项目信息。
- **Table of Contents**: 网格布局。左侧 1/3 放置巨型 "CONTENTS" 字样（竖排或横排，Secondary color），右侧 2/3 使用等宽网格排列 4 个章节卡片，每个卡片带序号和章节名。
- **Final (Thanks)**: 与封面呼应。深色背景+居中布局，"感谢聆听" 44px 白色，下方金色细线，底部项目 Slogan。

### 4.3 Content Page Layout Patterns
- **Pattern A (架构/流程图)**: 左右分栏（6:4）。左侧文字说明，右侧使用 Shape 组合绘制系统架构图或流程图。
- **Pattern B (功能列表)**: 上下分栏。顶部标题区，下方使用 2x2 或 3x2 的等宽卡片网格，每个卡片包含 Icon + 功能名 + 简述。
- **Pattern C (技术亮点)**: 左图右文或左文右图。一侧放置核心图表/截图，另一侧使用编号列表（大号数字 + 标题 + 说明）进行解读。
- **Pattern D (总结对比)**: 双栏对比。左侧项目成果（绿色/Primary 标记），右侧未来展望（Accent 标记），底部横跨的总结色块。

## 5. Style Usage Rules

- **textStyles usage**:
  - `$title`: 仅用于封面主标题和最终页大标题。
  - `$subtitle`: 用于封面副标题、章节页标题。
  - `$heading`: 用于所有内容页的顶部标题。
  - `$subheading`: 用于内容页内的模块小标题（如卡片标题、列表项标题）。
  - `$body`: 用于所有正文段落、描述性文字。
  - `$caption`: 用于导航栏文字、页码、图表注释、来源标注。
- **color usage**:
  - `$primary`: 导航栏背景、页面标题色条、表格表头、核心图标。
  - `$secondary`: 辅助文字、次要边框、非激活导航项。
  - `$accent`: 仅用于关键数据高亮、当前章节指示条、封面/章节页装饰线。
  - `$background`: 全局页面背景。
  - `$text`: 所有正文和标题文字颜色。
  - `$light`: 卡片背景、表格交替行背景。

## 6. Risk Prohibitions

- [ ] **禁止使用高饱和亮蓝/青色**（如 `#0A97C0`, `#2C80FD`），避免廉价科技感。
- [ ] **禁止大面积深色背景**（如黑色、深灰），仅允许封面和结束页使用深色背景，正文页必须保持浅灰/白底以确保可读性。
- [ ] **禁止正文字号低于 18px**，确保投影清晰度。
- [ ] **禁止标题字号与正文字号差距过小**，必须保持至少 8px 的级差（如标题 30px vs 正文 18px）。
- [ ] **禁止无意义的装饰性图标/插画**，学术答辩以内容为核心，图标仅用于功能/架构图辅助。
- [ ] **禁止左右布局时底部不对齐**，如左侧内容到底而右侧仅占一半高度。
- [ ] **禁止图表/表格缺少标题和标注**，所有数据可视化必须自解释。
- [ ] **禁止在导航栏使用过多颜色**，非激活状态统一使用 Secondary color，仅当前章节高亮。

## 7. Theme Definition

```yaml
theme:
  colors:
    primary: "#1B3A5F"
    secondary: "#4A6D8C"
    accent: "#D4A843"
    background: "#F5F7FA"
    text: "#1A1A2E"
    light: "#E8EEF4"
    white: "#FFFFFF"
  textStyles:
    title:
      fontSize: 44
      color: "$white"
      fontFamily: "QuattrocentoSans, MiSans"
      lineHeight: 1.2
      letterSpacing: 2
    subtitle:
      fontSize: 20
      color: "$secondary"
      fontFamily: "QuattrocentoSans, MiSans"
      lineHeight: 1.4
    heading:
      fontSize: 30
      color: "$primary"
      fontFamily: "QuattrocentoSans, MiSans"
      lineHeight: 1.3
    subheading:
      fontSize: 22
      color: "$primary"
      fontFamily: "QuattrocentoSans, MiSans"
      lineHeight: 1.3
    body:
      fontSize: 18
      color: "$text"
      fontFamily: "QuattrocentoSans, MiSans"
      lineHeight: 1.6
    caption:
      fontSize: 14
      color: "$secondary"
      fontFamily: "QuattrocentoSans, MiSans"
      lineHeight: 1.4
  tableStyles:
    default:
      fontSize: 16
      fontFamily: "QuattrocentoSans, MiSans"
      headerFill: "$primary"
      headerColor: "$white"
      headerBold: true
      bodyFill: ["$white", "$light"]
      bodyColor: "$text"
      border:
        style: solid
        width: 1
        color: "#D1D9E0"
```
