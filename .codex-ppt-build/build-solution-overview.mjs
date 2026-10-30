import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = path.join(workspaceDir, '.codex-ppt-build');
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const runtimeModules = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const pythonExecutable = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const outputPath = path.join(workspaceDir, 'deliverables', '总体解决方案_可编辑.pptx');
const draftPath = path.join(buildDir, 'solution-overview-draft.pptx');
const previewPath = path.join(buildDir, 'solution-overview-preview.png');
const logoPath = path.join(workspaceDir, 'projects/rockmass_technology_report_20261026_final/cinf-logo-transparent.png');
const font = 'Microsoft YaHei';

process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES = runtimeModules;

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
slide.background.fill = '#FFFFFF';

const colors = {
  blue: '#3E79E9', navy: '#17395F', body: '#43566D', muted: '#728398',
  line: '#D6E0ED', pale: '#EEF4FC',
};

function rect(name, x, y, width, height, fill, line = 'none', lineWidth = 0) {
  return slide.shapes.add({
    geometry: 'rect', name,
    position: { left: x, top: y, width, height }, fill,
    line: { style: 'solid', fill: line, width: lineWidth },
  });
}

function text(name, value, x, y, width, height, style = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox', name,
    position: { left: x, top: y, width, height },
    fill: 'none', line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: font, fontSize: 18, color: colors.body,
    verticalAlignment: 'top', alignment: 'left',
    autoFit: 'none', wrap: 'square', insets: 0, lineSpacing: 1.25,
    ...style,
  };
  return shape;
}

rect('header-band', 24, 26, 1232, 51, colors.blue);
text('section-label', '1  |  项目背景及思路', 54, 32, 700, 37,
  { fontSize: 25, bold: true, color: '#FFFFFF', wrap: 'none', verticalAlignment: 'middle' });
text('slide-title', '总体解决方案', 64, 96, 1152, 40,
  { fontSize: 30, bold: true, color: colors.navy, wrap: 'none', verticalAlignment: 'middle' });
text('slide-subtitle', '以工程部位和点位为主线，贯通分级工作流与两项智能分析能力', 64, 138, 1152, 22,
  { fontSize: 16, color: colors.muted, wrap: 'none', verticalAlignment: 'middle' });

text('left-heading', '总体思路', 64, 176, 340, 30,
  { fontSize: 20, bold: true, color: colors.blue });
text('right-heading', '实现路径', 484, 176, 732, 30,
  { fontSize: 20, bold: true, color: colors.blue });
rect('left-heading-rule', 64, 214, 340, 1.5, colors.blue);
rect('right-heading-rule', 484, 214, 732, 1.5, colors.blue);
rect('column-divider', 444, 176, 1, 444, colors.line);

text('solution-prose',
  '资料分散、多方法重复处理、成果难以追溯，是现有分级工作的主要问题。项目以工程部位和点位为主线，构建一体化工作流，贯通资料录入、多方法计算、依据关联与成果输出。原始资料、采用参数、规范依据和评价结果均关联到点位。\n\n统一参数体系按规则复用共用信息，并保留方法差异。智能体结合点位任务、专业知识和工程上下文调用工具；多模态能力融合编录、数值与岩芯图像，辅助特征识别和取参，关键参数经工程师确认。',
  64, 240, 340, 380,
  { fontSize: 17, color: colors.body, bold: false, lineSpacing: 1.3 });

rect('point-workflow-band', 484, 240, 732, 38, colors.pale);
text('point-workflow-label', '以工程部位和点位组织资料与评价任务', 502, 246, 696, 26,
  { fontSize: 17, bold: true, color: colors.navy, alignment: 'center', wrap: 'none', verticalAlignment: 'middle' });

const steps = [
  ['资料录入', '文本、数值与图像'],
  ['多方法计算', '共用参数规则复用'],
  ['依据关联', '参数关联规范原文'],
  ['成果输出', '分级结果与计算书'],
];
for (let index = 0; index < steps.length; index++) {
  const x = 484 + index * 190;
  rect(`flow-step-${index + 1}`, x, 300, 162, 77, colors.pale);
  const label = text(`flow-copy-${index + 1}`, `${steps[index][0]}\n${steps[index][1]}`,
    x + 9, 311, 144, 56,
    { fontSize: 13, color: colors.body, bold: false, alignment: 'center', lineSpacing: 1.55 });
  label.text.get(steps[index][0]).bold = true;
  label.text.get(steps[index][0]).fontSize = 16;
  if (index < steps.length - 1) {
    slide.shapes.add({
      geometry: 'rightArrow', name: `flow-arrow-${index + 1}`,
      position: { left: x + 169, top: 326, width: 14, height: 12 },
      fill: colors.blue, line: { style: 'solid', fill: 'none', width: 0 },
    });
  }
}

text('agent-heading', '01  面向点位任务的智能体协同分析', 484, 392, 732, 31,
  { fontSize: 19, bold: true, color: colors.navy, wrap: 'none', verticalAlignment: 'middle' });
text('agent-copy', '任务编排管理点位步骤，智能体检索专业知识、结合工程上下文调用工具，执行结果由工程师审核。',
  484, 430, 732, 54,
  { fontSize: 16, color: colors.body, bold: false, lineSpacing: 1.3 });
rect('capability-divider', 484, 500, 732, 1, colors.line);
text('multimodal-heading', '02  多模态信息融合与工程辅助分析', 484, 519, 732, 31,
  { fontSize: 19, bold: true, color: colors.navy, wrap: 'none', verticalAlignment: 'middle' });
text('multimodal-copy', '建立共用指标映射，融合编录文本、数值资料和岩芯图像提取候选特征，经工程师确认后纳入点位参数并用于评价。',
  484, 560, 732, 60,
  { fontSize: 16, color: colors.body, bold: false, lineSpacing: 1.3 });

rect('footer-rule', 24, 650, 1232, 1.5, colors.blue);
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
slide.speakerNotes.text = '针对资料分散、多方法重复处理和成果难追溯等问题，项目构建了以工程部位和点位为主线的一体化工作流，贯通资料录入、多方法计算、依据关联和成果输出。在此基础上，重点提升两方面智能化能力：一是面向点位任务的智能体协同分析，将专业知识检索与工程上下文结合起来；二是多模态信息融合分析，拓展系统对工程资料的智能分析能力。下面重点介绍这两方面。';

const preview = await presentation.export({ slide, format: 'png', scale: 1.2 });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
await (await PresentationFile.exportPptx(presentation)).save(draftPath);

const { finalizePresentation } = await import(pathToFileURL(
  path.join(skillDir, 'container_tools/artifact_tool_utils.mjs'),
).href);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
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
  receiptPath: path.join(buildDir, 'solution-overview.validation.json'),
});
console.log(JSON.stringify({ outputPath, previewPath, result }));
