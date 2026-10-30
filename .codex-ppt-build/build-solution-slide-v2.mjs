import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = `${workspaceDir}/.codex-ppt-build`;
const runtimeModules = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const runtimePython = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const finalPath = `${workspaceDir}/deliverables/项目背景及思路_解决方案页_最终版.pptx`;

await fs.symlink(runtimeModules, `${buildDir}/node_modules`, 'junction').catch(() => {});
const { Presentation, PresentationFile } = await import('@oai/artifact-tool');
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
slide.background.fill = '#FFFFFF';

const font = 'Microsoft YaHei', blue = '#3279F6', navy = '#17395F';
const body = '#43566D', muted = '#728398', rule = '#D6E0ED';
function rect(name, x, y, w, h, fill) {
  return slide.shapes.add({ geometry: 'rect', name,
    position: { left: x, top: y, width: w, height: h }, fill,
    line: { style: 'solid', fill: 'none', width: 0 } });
}
function text(name, value, x, y, w, h, style = {}) {
  const shape = slide.shapes.add({ geometry: 'textbox', name,
    position: { left: x, top: y, width: w, height: h }, fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 } });
  shape.text = value;
  shape.text.style = { typeface: font, fontSize: 18, color: body,
    verticalAlignment: 'middle', ...style };
  return shape;
}

rect('header-band', 0, 0, 1280, 58, blue);
text('section-label', '1 | 项目背景及思路', 54, 10, 560, 38,
  { fontSize: 25, bold: true, color: '#FFFFFF' });
text('slide-title', '项目目标与整体解决方案', 64, 76, 1120, 42,
  { fontSize: 31, bold: true, color: navy });
text('slide-subtitle', '面向工程实践，建设岩体质量分级智能化系统', 64, 120, 1120, 28,
  { fontSize: 19, color: muted });
rect('title-rule', 64, 160, 1152, 2, blue);

text('left-heading', '项目目标', 64, 184, 292, 34,
  { fontSize: 23, bold: true, color: navy });
rect('left-heading-rule', 64, 222, 292, 2, blue);
text('objective-title', '研发岩体质量分级智能化系统', 64, 240, 292, 52,
  { fontSize: 20, bold: true, color: navy });
text('objective-copy',
  '面向工程部位与点位组织评价资料和分级流程，建设集数据管理、多方法计算、依据关联与成果交付于一体的应用系统。',
  64, 294, 292, 106,
  { fontSize: 17, color: body, verticalAlignment: 'top' });
rect('left-lower-rule', 64, 410, 292, 1, rule);
text('expected-heading', '预期效果', 64, 426, 292, 26,
  { fontSize: 17, bold: true, color: blue });
const outcomes = [
  ['多方法分级流程一体化', blue],
  ['点位任务智能辅助', '#239D98'],
  ['成果依据全程可追溯', '#D98332'],
];
outcomes.forEach(([label, color], i) => {
  const y = 464 + i * 37;
  rect(`outcome-accent-${i + 1}`, 64, y + 3, 4, 23, color);
  text(`outcome-label-${i + 1}`, label, 82, y, 268, 28,
    { fontSize: 17, bold: true, color: navy });
});

rect('column-divider', 384, 184, 1, 422, rule);
text('right-heading', '功能模块与实现方法', 418, 184, 790, 34,
  { fontSize: 23, bold: true, color: navy });
rect('right-heading-rule', 418, 222, 790, 2, blue);
rect('system-input-band', 418, 238, 790, 38, '#EAF1FA');
text('system-input-label', '技术基础', 432, 241, 125, 30,
  { fontSize: 15, bold: true, color: blue });
text('system-input-copy', '工程资料  |  分级规则  |  专业知识  |  多模态信息',
  560, 241, 625, 30, { fontSize: 16, bold: true, color: navy });
text('th-direction', '建设方向', 432, 280, 176, 26,
  { fontSize: 15, bold: true, color: muted });
text('th-content', '关键技术与实现', 620, 280, 378, 26,
  { fontSize: 15, bold: true, color: muted });
text('th-output', '能力产出', 1010, 280, 185, 26,
  { fontSize: 15, bold: true, color: muted });

const rows = [
  { y: 308, num: '01', tag: '基础软件', title: '技术软件开发',
    detail: '以工程部位和点位组织数据，贯通资料录入、多方法计算、依据关联与计算书输出',
    output: '工程分级工作流一体化', color: blue },
  { y: 402, num: '02', tag: '创新点一', title: '点位智能体协同',
    detail: '结合工程上下文与专业知识检索，围绕点位输入、参数和结果开展问答解释与过程核查',
    output: '点位级智能分析与核查', color: '#239D98' },
  { y: 496, num: '03', tag: '创新点二', title: '多模态信息融合',
    detail: '融合多模态工程信息，为岩体质量评价相关资料的分析与判识提供辅助',
    output: '拓展工程资料智能分析能力', color: '#D98332' },
];
for (const row of rows) {
  rect(`row-rule-${row.num}`, 418, row.y + 91, 790, 1, rule);
  text(`row-number-${row.num}`, row.num, 428, row.y + 23, 52, 34,
    { fontSize: 20, bold: true, color: row.color });
  text(`row-tag-${row.num}`, row.tag, 488, row.y + 9, 150, 22,
    { fontSize: 14, bold: true, color: row.color });
  text(`row-title-${row.num}`, row.title, 488, row.y + 33, 158, 45,
    { fontSize: 16, bold: true, color: navy });
  text(`row-detail-${row.num}`, row.detail, 620, row.y + 10, 378, 70,
    { fontSize: 16, color: body });
  text(`row-output-${row.num}`, row.output, 1010, row.y + 10, 185, 70,
    { fontSize: 15, bold: true, color: navy });
}
rect('footer-rule', 64, 624, 1152, 2, blue);
text('closing-line', '基础软件支撑工程化流程，智能能力拓展点位分析与多模态信息应用',
  64, 638, 1000, 34, { fontSize: 19, bold: true, color: navy });
text('footer-label', '长沙有色冶金设计研究院有限公司', 867, 680, 341, 18,
  { fontSize: 12, color: muted, alignment: 'right' });

const draftPath = `${buildDir}/solution-slide-v2-draft.pptx`;
await (await PresentationFile.exportPptx(presentation)).save(draftPath);
const { finalizePresentation } = await import(pathToFileURL(
  `${skillDir}/container_tools/artifact_tool_utils.mjs`,
).href);
await fs.mkdir(`${buildDir}/.codex-finalizer`, { recursive: true });
const validation = await finalizePresentation({
  explicitTotalSlideCount: 1,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath: draftPath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: `${skillDir}/container_tools/inspect_presentation_package_integrity.py`,
  layoutValidatorPath: `${skillDir}/container_tools/inspect_presentation_layout_geometry.py`,
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000'],
  fontPolicy: { basis: 'design', families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: `${buildDir}/.codex-finalizer/solution-slide-v2-final.validation.json`,
});
console.log(JSON.stringify(validation));
