const pptxgen = require('pptxgenjs');
const html2pptx = require('C:\\Users\\xyh\\.deepchat\\skills\\pptx\\scripts\\html2pptx');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'ppt_assets');
const BG_IMG = path.join(ASSETS, 'bg.png');
const ACCENT_IMG = path.join(ASSETS, 'accent.png');

async function main() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '论文自动排版系统团队';
  pptx.title = '基于大模型的论文自动排版系统 - 答辩PPT';

  const slides = [
    'slide00_cover.html',
    'slide01_outline.html',
    'slide02_background.html',
    'slide03_tech.html',
    'slide04_arch.html',
    'slide05_flow.html',
    'slide06_results.html',
    'slide07_features.html',
    'slide08_division.html',
    'slide09_summary.html',
  ];

  for (const f of slides) {
    const htmlFile = path.join(__dirname, f);
    const { slide, placeholders } = await html2pptx(htmlFile, pptx);
    // Add full-slide gradient background
    slide.addImage({ path: BG_IMG, x: 0, y: 0, w: 10, h: 5.625 });

    // Add chart for results slide
    if (f === 'slide06_results.html' && placeholders.length > 0) {
      slide.addChart(pptx.charts.BAR, [{
        name: '准确率',
        labels: ['标题', '摘要', '关键词', '章节标题', '章节内容', '参考文献'],
        values: [100, 100, 100, 96.3, 94.8, 100]
      }], {
        ...placeholders[0],
        barDir: 'col',
        showTitle: false,
        showLegend: false,
        chartColors: ['00d4aa'],
        showCatAxisTitle: false,
        showValAxisTitle: true,
        valAxisTitle: '准确率 (%)',
        valAxisMinVal: 85,
        valAxisMaxVal: 100,
        valAxisMajorUnit: 5,
        dataLabelPosition: 'outEnd',
        dataLabelColor: 'ffffff',
        catAxisLabelColor: 'b0bec5',
        valAxisLabelColor: 'b0bec5',
      });
    }
  }

  const outFile = path.join(__dirname, '..', '论文自动排版系统_答辩PPT.pptx');
  await pptx.writeFile({ fileName: outFile });
  console.log('PPT saved to: ' + outFile);
}

main().catch(e => { console.error(e); process.exit(1); });
