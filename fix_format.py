# -*- coding: utf-8 -*-
"""Replace format module custom styles with template params display - v2"""
with open(r'E:\deepchat\paper-writer\frontend\paper-writer-app\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the old custom styles section start
section_start = content.find('{key:\'bodyFont\'')
if section_start > 0:
    section_start = content.rfind('<div className="grid grid-cols-2 gap-1">', 0, section_start)
    # Find the end - look for the next button after this section
    # The export button text
    end_marker = "导出规范 Word 文档"
    section_end = content.find(end_marker, section_start)
    if section_end > 0:
        # Go back to find the closing </div> and </> before the button
        section_end = content.rfind('<button onClick={handleFormatExport}', 0, section_end)
        
        new_section = '''            <div className="space-y-2 bg-paper-bg border border-paper-card rounded-lg p-3">
                <h4 className="text-xs font-medium text-paper-text mb-2">当前模板参数</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex justify-between"><span className="text-paper-muted">正文字体</span><span className="text-white">SimSun 宋体</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">字号/行距</span><span className="text-white">{selectedTemplate === 'course_paper' ? '12pt / 1.25倍' : '12pt / 1.5倍'}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">标题字体</span><span className="text-white">SimHei 黑体</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">标题字号</span><span className="text-white">{selectedTemplate === 'gbt7713' ? '18pt' : selectedTemplate === 'general' ? '16pt' : '15pt'}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">上/下边距</span><span className="text-white">{selectedTemplate === 'gbt7713' ? '3.0/2.5cm' : selectedTemplate === 'general' ? '2.54/2.54cm' : '2.5/2.5cm'}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">左/右边距</span><span className="text-white">{selectedTemplate === 'gbt7713' ? '3.0/2.5cm' : selectedTemplate === 'general' ? '3.17/3.17cm' : '2.8/2.8cm'}</span></div>
                  <div className="flex justify-between"><span className="text-paper-muted">参考文献</span><span className="text-white">GB/T 7714</span></div>
                  {selectedTemplate === 'gbt7713' && (
                    <div className="col-span-2 text-paper-gold text-[9px]">含封面页、声明页、目录、致谢页</div>
                  )}
                </div>
              </div>\n\n              '''
        
        content = content[:section_start] + new_section + content[section_end:]
        
        with open(r'E:\deepchat\paper-writer\frontend\paper-writer-app\src\App.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Format module template params replaced successfully!')
    else:
        print('Export button end marker not found')
else:
    print('bodyFont marker not found')
