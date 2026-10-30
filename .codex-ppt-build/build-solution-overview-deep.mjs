import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = path.join(workspaceDir, '.codex-ppt-build');
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const runtimeModules = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const pythonExecutable = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const outputPath = path.join(workspaceDir, 'deliverables', '总体解决方案_深化版_可编辑.pptx');
const draftPath = path.join(buildDir, 'solution-overview-deep-draft.pptx');
const previewPath = path.join(buildDir, 'solution-overview-deep-preview.png');
const logoPath = path.join(workspaceDir, 'projects/rockmass_technology_report_20261026_final/cinf-logo-transparent.png');
const font = 'Microsoft YaHei';

process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES = runtimeModules;

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
slide.background.fill = '#FFFFFF';

const c = {
  blue: '#3E79E9', navy: '#17395F', body: '#43566D', muted: '#728398',
  line: '#D6E0ED', pale: '#EEF4FC', teal: '#149C91', tealPale: '#EDF7F5',
  amber: '#D98232', amberPale: '#FBF3EA',
};

function rect(name, x, y, w, h, fill, line = 'none', lineWidth = 0) {
  return slide.shapes.add({
    geometry: 'rect', name, position: { left: x, top: y, width: w, height: h }, fill,
    line: { style: 'solid', fill: line, width: lineWidth },
  });
}

function text(name, value, x, y, w, h, style = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox', name, position: { left: x, top: y, width: w, height: h },
    fill: 'none', line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: font, fontSize: 16, color: c.body,
    verticalAlignment: 'top', alignment: 'left',
    autoFit: 'none', wrap: 'square', insets: 0, lineSpacing: 1.2,
    ...style,
  };
  return shape;
}

rect('header-band', 24, 26, 1232, 51, c.blue);
text('section-label', '1  |  项目背景及思路', 54, 32, 700, 37,
  { fontSize: 25, bold: true, color: '#FFFFFF', wrap: 'none', verticalAlignment: 'middle' });
text('slide-title', '总体解决方案', 64, 96, 1152, 40,
  { fontSize: 30, bold: true, color: c.navy, wrap: 'none', verticalAlignment: 'middle' });
text('slide-subtitle', '以工程部位和点位为主线，建设专业计算底座，拓展两项智能分析能力', 64, 138, 1152, 22,
  { fontSize: 16, color: c.muted, wrap: 'none', verticalAlignment: 'middle' });

text('left-heading', '总体建设思路', 64, 176, 340, 30,
  { fontSize: 20, bold: true, color: c.blue });
text('right-heading', '软件架构与关键能力', 484, 176, 732, 30,
  { fontSize: 20, bold: true, color: c.blue });
rect('left-heading-rule', 64, 214, 340, 1.5, c.blue);
rect('right-heading-rule', 484, 214, 732, 1.5, c.blue);
rect('column-divider', 444, 176, 1, 444, c.line);

const principles = [
  ['01', '工程对象建模', '以项目、工程部位、点位分层组织数据，统一挂接编录资料、参数与评价结果。'],
  ['02', '建立指标体系', '梳理各方法的指标定义、单位和取值条件，明确共用参数与方法专用项。'],
  ['03', '开发专业计算', '将规范规则固化为可校核的计算模块，保持方法逻辑独立，计算结果确定。'],
  ['04', '打通成果闭环', '关联参数、规范依据、计算过程和评价结果，支持工程师复核及计算书输出。'],
];
principles.forEach(([number, heading, detail], i) => {
  const y = 238 + i * 96;
  text(`principle-index-${i + 1}`, number, 64, y + 1, 36, 24,
    { fontSize: 15, bold: true, color: i === 0 ? c.blue : c.muted, wrap: 'none' });
  text(`principle-heading-${i + 1}`, heading, 108, y, 296, 25,
    { fontSize: 17, bold: true, color: c.navy, wrap: 'none' });
  text(`principle-detail-${i + 1}`, detail, 108, y + 30, 296, 53,
    { fontSize: 14, color: c.body, lineSpacing: 1.22 });
  if (i < principles.length - 1) rect(`principle-rule-${i + 1}`, 108, y + 84, 296, 1, c.line);
});

text('foundation-heading', '基础软件建设', 484, 232, 260, 25,
  { fontSize: 17, bold: true, color: c.navy, wrap: 'none' });
text('foundation-caption', '工程化工作流与专业计算底座', 835, 233, 381, 22,
  { fontSize: 14, color: c.muted, alignment: 'right', wrap: 'none' });
rect('foundation-band', 484, 267, 732, 111, c.navy);

const foundation = [
  ['业务数据模型', '项目 / 部位 / 点位'],
  ['指标与方法库', '参数定义 / 适用条件'],
  ['规则计算引擎', '多方法独立计算校核'],
  ['项目工作台', '结果追溯 / 计算书输出'],
];
foundation.forEach(([heading, detail], i) => {
  const x = 500 + i * 178;
  text(`foundation-heading-${i + 1}`, heading, x, 287, 158, 27,
    { fontSize: 15.5, bold: true, color: '#FFFFFF', alignment: 'center', wrap: 'none' });
  text(`foundation-detail-${i + 1}`, detail, x, 324, 158, 34,
    { fontSize: 12.5, color: '#D6E2F0', alignment: 'center', verticalAlignment: 'middle' });
  if (i < foundation.length - 1) {
    rect(`foundation-divider-${i + 1}`, x + 168, 284, 1, 65, '#49647F');
    slide.shapes.add({
      geometry: 'rightArrow', name: `foundation-arrow-${i + 1}`,
      position: { left: x + 162, top: 307, width: 11, height: 10 },
      fill: '#91B4E5', line: { style: 'solid', fill: 'none', width: 0 },
    });
  }
});

rect('control-strip', 484, 389, 732, 31, c.pale);
text('control-strip-copy', '工程师确认关键取值     |     规则化计算执行     |     规范依据与过程留痕',
  496, 395, 708, 20,
  { fontSize: 13, color: c.navy, alignment: 'center', wrap: 'none', verticalAlignment: 'middle' });
text('innovation-heading', '两项智能化创新能力', 484, 435, 732, 26,
  { fontSize: 17, bold: true, color: c.navy, wrap: 'none' });

rect('agent-panel', 484, 471, 352, 149, c.tealPale);
rect('agent-accent', 484, 471, 4, 149, c.teal);
text('agent-title', '01  智能体协同分析', 501, 484, 320, 26,
  { fontSize: 17, bold: true, color: c.teal, wrap: 'none' });
text('agent-copy', '以点位任务为单元，编排执行步骤；检索知识库中的规范与经验，结合工程上下文调用工具，结果回传后由工程师审核。',
  501, 520, 318, 51, { fontSize: 13.5, color: c.body, lineSpacing: 1.22 });
text('agent-sequence', '任务编排  →  知识检索  →  工具执行  →  人工审核',
  501, 584, 318, 21, { fontSize: 12, bold: true, color: c.teal, wrap: 'none' });

rect('multimodal-panel', 854, 471, 362, 149, c.amberPale);
rect('multimodal-accent', 854, 471, 4, 149, c.amber);
text('multimodal-title', '02  多模态融合取参', 871, 484, 328, 26,
  { fontSize: 17, bold: true, color: c.amber, wrap: 'none' });
text('multimodal-copy', '统一多方法指标映射，融合编录文本、数值和岩芯图像，辅助识别特征、提取候选参数；确认后写入点位参数并按规则分发。',
  871, 520, 328, 51, { fontSize: 13.5, color: c.body, lineSpacing: 1.22 });
text('multimodal-sequence', '多源资料  →  候选参数  →  人工确认  →  方法映射',
  871, 584, 328, 21, { fontSize: 12, bold: true, color: c.amber, wrap: 'none' });

rect('footer-rule', 24, 650, 1232, 1.5, c.blue);
const logoBytes = await fs.readFile(logoPath);
slide.images.add({
  blob: logoBytes.buffer.slice(logoBytes.byteOffset, logoBytes.byteOffset + logoBytes.byteLength),
  contentType: 'image/png', alt: '长沙有色冶金设计研究院有限公司标识', fit: 'contain',
  position: { left: 1038, top: 660, width: 210, height: 40 },
});
slide.shapes.add({
  geometry: 'rect', name: 'template-page-outline',
  position: { left: 22, top: 22, width: 1236, height: 676 },
  fill: 'none', line: { style: 'solid', fill: '#D8DEE8', width: 1 },
});
slide.speakerNotes.text = '项目按工程化产品路径建设岩体质量分级智能化系统。首先围绕项目、工程部位和点位建立业务数据模型，再梳理不同评价方法的指标定义、单位和适用条件，形成参数体系和方法库。专业计算规则固化在独立计算模块中，智能体负责任务理解和工具调度，关键取值由工程师确认。系统进一步将规范知识检索、工程上下文与点位任务结合，形成智能体协同分析；统一多方法指标映射，并融合编录文本、数值数据和岩芯图像，辅助提取候选参数，经工程师确认后进入点位参数库。最终关联参数、依据、过程和结果，支持复核与计算书输出。';

const preview = await presentation.export({ slide, format: 'png', scale: 1.2 });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
await (await PresentationFile.exportPptx(presentation)).save(draftPath);

const { finalizePresentation } = await import(pathToFileURL(
  path.join(skillDir, 'container_tools/artifact_tool_utils.mjs'),
).href);
const result = await finalizePresentation({
  explicitTotalSlideCount: 1,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath: draftPath,
  finalPath: outputPath,
  pythonExecutable,
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  fontPolicy: { basis: 'design', families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, 'solution-overview-deep.validation.json'),
});
console.log(JSON.stringify({ outputPath, previewPath, result }));
