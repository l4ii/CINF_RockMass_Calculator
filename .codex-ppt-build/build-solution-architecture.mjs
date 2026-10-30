import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = path.join(workspaceDir, '.codex-ppt-build');
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const runtimeModules = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const pythonExecutable = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const outputPath = path.join(workspaceDir, 'deliverables', '总体解决方案_软件架构版_可编辑.pptx');
const draftPath = path.join(buildDir, 'solution-architecture-draft.pptx');
const previewPath = path.join(buildDir, 'solution-architecture-preview.png');
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
    autoFit: 'none', wrap: 'square', insets: 0, lineSpacing: 1.25,
    ...style,
  };
  return shape;
}

function moduleLabel(name, value, x, y, w, h, color, size = 15) {
  return text(name, value, x, y, w, h, {
    fontSize: size, bold: true, color, alignment: 'center',
    verticalAlignment: 'middle', wrap: 'square',
  });
}

rect('header-band', 24, 26, 1232, 51, c.blue);
text('section-label', '1  |  项目背景及思路', 54, 32, 700, 37,
  { fontSize: 25, bold: true, color: '#FFFFFF', wrap: 'none', verticalAlignment: 'middle' });
text('slide-title', '项目目标与整体解决方案', 64, 96, 1152, 40,
  { fontSize: 30, bold: true, color: c.navy, wrap: 'none', verticalAlignment: 'middle' });
text('slide-subtitle', '面向工程点位的专业评价平台与软件架构', 64, 138, 1152, 22,
  { fontSize: 16, color: c.muted, wrap: 'none', verticalAlignment: 'middle' });

text('left-heading', '解决方案', 64, 176, 340, 30,
  { fontSize: 20, bold: true, color: c.blue });
text('right-heading', '软件总体架构', 484, 176, 732, 30,
  { fontSize: 20, bold: true, color: c.blue });
rect('left-heading-rule', 64, 214, 340, 1.5, c.blue);
rect('right-heading-rule', 484, 214, 732, 1.5, c.blue);
rect('column-divider', 444, 176, 1, 444, c.line);

text('solution-copy',
  '构建面向岩体质量分级的专业软件平台，将项目内各工程部位与测点纳入统一管理。工程人员围绕点位归集岩芯编录等资料，按工程任务开展多方法评价；系统组织各方法所需指标和参数，依据专业规则完成计算并汇集结果。\n\n原始资料、取值参数、规范依据、计算过程和评价成果均关联到具体点位，便于工程师校核结果，并按项目汇编计算书。多方法的规则与专用参数分别管理，共用数据统一归集，形成从工程资料到分级成果的完整对应关系。',
  64, 242, 340, 276,
  { fontSize: 17, color: c.body, lineSpacing: 1.35 });

rect('solution-emphasis', 64, 548, 340, 64, c.pale);
rect('solution-emphasis-accent', 64, 548, 4, 64, c.blue);
text('solution-emphasis-copy', '资料、参数、依据与结果\n统一关联到工程点位', 82, 557, 306, 46,
  { fontSize: 17, bold: true, color: c.navy, lineSpacing: 1.3, verticalAlignment: 'middle' });

text('app-layer-name', '应用层', 484, 232, 112, 24,
  { fontSize: 15, bold: true, color: c.blue, wrap: 'none' });
text('app-layer-caption', '工程人员使用的业务功能', 1070, 233, 146, 20,
  { fontSize: 12.5, color: c.muted, alignment: 'right', wrap: 'none' });
rect('app-layer', 484, 260, 732, 68, c.pale);
rect('app-rail', 484, 260, 104, 68, c.blue);
moduleLabel('app-rail-label', '业务应用', 491, 280, 90, 27, '#FFFFFF', 15);
const appModules = ['项目与部位管理', '点位评价工作台', '结果校审与成果输出'];
appModules.forEach((label, i) => {
  const x = 600 + i * 202;
  moduleLabel(`app-module-${i + 1}`, label, x, 273, 190, 40, c.navy, 15);
  if (i < appModules.length - 1) rect(`app-divider-${i + 1}`, x + 196, 273, 1, 40, '#C9D9EE');
});

slide.shapes.add({
  geometry: 'downArrow', name: 'app-service-connector',
  position: { left: 837, top: 330, width: 20, height: 14 },
  fill: c.blue, line: { style: 'solid', fill: 'none', width: 0 },
});

text('service-layer-name', '专业服务层', 484, 350, 150, 23,
  { fontSize: 15, bold: true, color: c.navy, wrap: 'none' });
rect('service-layer', 484, 378, 732, 72, c.navy);
rect('service-rail', 484, 378, 104, 72, '#24527D');
moduleLabel('service-rail-label', '专业计算', 491, 399, 90, 27, '#FFFFFF', 15);
const serviceModules = ['资料与参数管理', '多方法规则计算', '规范依据关联', '结果过程追溯'];
serviceModules.forEach((label, i) => {
  const x = 593 + i * 153;
  moduleLabel(`service-module-${i + 1}`, label, x, 395, 146, 38, '#FFFFFF', 13.5);
  if (i < serviceModules.length - 1) rect(`service-divider-${i + 1}`, x + 149, 391, 1, 46, '#49647F');
});

slide.shapes.add({
  geometry: 'downArrow', name: 'service-data-connector',
  position: { left: 837, top: 452, width: 20, height: 14 },
  fill: c.teal, line: { style: 'solid', fill: 'none', width: 0 },
});

text('data-layer-name', '数据支撑层', 484, 472, 150, 23,
  { fontSize: 15, bold: true, color: c.teal, wrap: 'none' });
rect('data-layer', 484, 500, 732, 68, c.tealPale);
rect('data-rail', 484, 500, 104, 68, c.teal);
moduleLabel('data-rail-label', '数据与规则', 491, 520, 90, 27, '#FFFFFF', 15);
const dataModules = [
  ['工程资料', '编录 / 数值 / 图像'],
  ['标准与知识', '规范 / 方法条件'],
  ['评价数据', '参数 / 依据 / 结果'],
];
dataModules.forEach(([heading, detail], i) => {
  const x = 600 + i * 202;
  moduleLabel(`data-heading-${i + 1}`, heading, x, 506, 190, 23, c.teal, 14.5);
  text(`data-detail-${i + 1}`, detail, x, 533, 190, 22,
    { fontSize: 12.5, color: c.body, alignment: 'center', verticalAlignment: 'middle', wrap: 'none' });
  if (i < dataModules.length - 1) rect(`data-divider-${i + 1}`, x + 196, 509, 1, 48, '#C5DED9');
});

text('extension-label', '智能化扩展', 484, 581, 100, 22,
  { fontSize: 13, bold: true, color: c.muted, wrap: 'none', verticalAlignment: 'middle' });
rect('extension-agent', 592, 577, 178, 29, c.tealPale);
moduleLabel('extension-agent-copy', '点位任务协同', 599, 580, 164, 22, c.teal, 13);
rect('extension-multimodal', 782, 577, 194, 29, c.amberPale);
moduleLabel('extension-multimodal-copy', '多模态资料辅助', 789, 580, 180, 22, c.amber, 13);
text('extension-note', '具体能力见后续章节', 986, 580, 230, 20,
  { fontSize: 12, color: c.muted, alignment: 'right', wrap: 'none', verticalAlignment: 'middle' });

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
slide.speakerNotes.text = '项目建设面向岩体质量评价与分级的专业软件平台，围绕项目、工程部位和测点组织工程资料。系统集中管理各评价方法所需指标、参数和规则，执行专业计算并汇集结果。数据与规范依据、参数、计算过程和成果关联到点位，支持校核和计算书编制。软件总体由应用层、专业服务层和数据支撑层构成，智能化扩展能力将在后续章节介绍。';

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
  receiptPath: path.join(buildDir, 'solution-architecture.validation.json'),
});
console.log(JSON.stringify({ outputPath, previewPath, result }));
