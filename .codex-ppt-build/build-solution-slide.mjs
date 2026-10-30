import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = `${workspaceDir}/.codex-ppt-build`;
const runtimeModules = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const runtimePython = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const finalPath = `${workspaceDir}/deliverables/项目背景及思路_解决方案页.pptx`;

await fs.symlink(runtimeModules, `${buildDir}/node_modules`, 'junction').catch(() => {});
const { Presentation, PresentationFile } = await import('@oai/artifact-tool');
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
slide.background.fill = '#FFFFFF';

const font = 'Microsoft YaHei';
const blue = '#3279F6';
const navy = '#17395F';
const body = '#43566D';
const muted = '#728398';
const rule = '#D6E0ED';

function rect(name, x, y, w, h, fill) {
  return slide.shapes.add({
    geometry: 'rect', name,
    position: { left: x, top: y, width: w, height: h },
    fill, line: { style: 'solid', fill: 'none', width: 0 },
  });
}

function text(name, value, x, y, w, h, style = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox', name,
    position: { left: x, top: y, width: w, height: h },
    fill: 'none', line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: font, fontSize: 19, color: body,
    verticalAlignment: 'middle', ...style,
  };
  return shape;
}

rect('header-band', 0, 0, 1280, 58, blue);
text('section-label', '1 | 项目背景及思路', 54, 10, 560, 38,
  { fontSize: 25, bold: true, color: '#FFFFFF' });
text('slide-title', '项目目标与整体解决方案', 64, 76, 1120, 42,
  { fontSize: 31, bold: true, color: navy });
text('slide-subtitle', '围绕工程部位与点位，打通基础流程并拓展智能分析', 64, 120, 1120, 28,
  { fontSize: 19, color: muted });
rect('title-rule', 64, 160, 1152, 2, blue);

text('left-heading', '问题与目标', 64, 184, 292, 34,
  { fontSize: 23, bold: true, color: navy });
rect('left-heading-rule', 64, 222, 292, 2, blue);
text('problem-label', '现状问题', 64, 240, 292, 26,
  { fontSize: 17, bold: true, color: blue });
text('problem-paragraph',
  '项目涉及多个工程部位和大量测点，需采用多种评价方法。资料整理、参数取值、分方法计算与成果编制分散在不同环节，重复处理较多；资料、依据与结果也难以快速对应，增加了校审复核难度。',
  64, 274, 292, 178,
  { fontSize: 17, color: body, verticalAlignment: 'top' });
rect('left-lower-rule', 64, 472, 292, 1, rule);
text('goal-label', '建设目标', 64, 490, 292, 26,
  { fontSize: 17, bold: true, color: blue });
text('goal-copy', '以工程部位和点位为主线，贯通资料、计算与成果交付。', 64, 523, 292, 68,
  { fontSize: 19, bold: true, color: navy, verticalAlignment: 'top' });

rect('column-divider', 384, 184, 1, 422, rule);
text('right-heading', '技术软件开发与创新方向', 418, 184, 790, 34,
  { fontSize: 23, bold: true, color: navy });
rect('right-heading-rule', 418, 222, 790, 2, blue);

const x0 = 418, x1 = 648, x2 = 984;
rect('table-header', x0, 244, 790, 42, '#EAF1FA');
text('th-direction', '建设方向', x0 + 18, 249, 210, 32,
  { fontSize: 16, bold: true, color: navy });
text('th-content', '主要建设内容', x1 + 16, 249, 320, 32,
  { fontSize: 16, bold: true, color: navy });
text('th-output', '能力体现', x2 + 16, 249, 190, 32,
  { fontSize: 16, bold: true, color: navy });

const rows = [
  {
    y: 286, num: '01', kicker: '基础建设', title: '技术软件开发',
    content: '贯通工程与点位管理、参数录入、多方法计算、依据关联和计算书输出',
    output: '形成统一分级工作流', color: blue,
  },
  {
    y: 386, num: '02', kicker: '创新点一', title: '智能体协同分析',
    content: '面向点位任务，结合专业知识检索与工程上下文开展分析',
    output: '支持点位级智能分析', color: '#239D98',
  },
  {
    y: 486, num: '03', kicker: '创新点二', title: '多模态信息融合',
    content: '融合多模态信息，拓展系统对工程资料的智能分析能力',
    output: '拓展工程资料分析', color: '#D98332',
  },
];

for (const row of rows) {
  rect(`row-rule-${row.num}`, x0, row.y + 99, 790, 1, rule);
  text(`row-number-${row.num}`, row.num, x0 + 18, row.y + 18, 42, 32,
    { fontSize: 21, bold: true, color: row.color });
  text(`row-kicker-${row.num}`, row.kicker, x0 + 78, row.y + 7, 150, 24,
    { fontSize: 14, bold: true, color: row.color });
  text(`row-title-${row.num}`, row.title, x0 + 78, row.y + 32, 150, 48,
    { fontSize: 17, bold: true, color: navy });
  text(`row-content-${row.num}`, row.content, x1 + 16, row.y + 16, 320, 68,
    { fontSize: 17, color: body });
  text(`row-output-${row.num}`, row.output, x2 + 16, row.y + 16, 190, 68,
    { fontSize: 16, bold: true, color: navy });
}

rect('footer-rule', 64, 624, 1152, 2, blue);
text('closing-line', '以工程软件承载统一流程，智能化能力面向点位任务与多模态信息', 64, 638, 1000, 34,
  { fontSize: 19, bold: true, color: navy });
text('footer-label', '长沙有色冶金设计研究院有限公司', 867, 680, 341, 18,
  { fontSize: 12, color: muted, alignment: 'right' });

const draftPath = `${buildDir}/solution-slide-draft.pptx`;
await (await PresentationFile.exportPptx(presentation)).save(draftPath);
const { finalizePresentation } = await import(pathToFileURL(
  `${skillDir}/container_tools/artifact_tool_utils.mjs`,
).href);
await fs.mkdir(`${buildDir}/.codex-finalizer`, { recursive: true });
await fs.mkdir(`${workspaceDir}/deliverables`, { recursive: true });
const result = await finalizePresentation({
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
  receiptPath: `${buildDir}/.codex-finalizer/solution-slide.validation.json`,
});
console.log(JSON.stringify(result));
