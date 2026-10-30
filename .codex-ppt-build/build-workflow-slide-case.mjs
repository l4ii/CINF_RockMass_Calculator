import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = path.join(workspaceDir, '.codex-ppt-build');
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const pythonExecutable = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const draftPath = path.join(buildDir, 'workflow-workload-case-draft.pptx');
const finalPath = path.join(workspaceDir, 'deliverables', '岩体质量分级工作流程与工作量_案例版2.pptx');
const previewPath = path.join(buildDir, 'workflow-workload-case-preview.png');
const receiptPath = path.join(buildDir, 'workflow-workload-case2.validation.json');
const logoImage = path.join(workspaceDir, 'projects/rockmass_technology_report_20261026_final/cinf-logo-transparent.png');
const sceneImage = path.join(buildDir, 'previous-case-readback_files/image2.png');

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
const blue = '#3E79E9';
const navy = '#17395F';
const body = '#43566D';
const muted = '#728398';
const stroke = '#C9D9EE';
const paleText = '#B9CBE0';
const font = 'Microsoft YaHei';

async function imageBytes(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function rect(name, x, y, width, height, fill, lineFill = 'none', lineWidth = 0) {
  return slide.shapes.add({
    geometry: 'rect', name,
    position: { left: x, top: y, width, height },
    fill,
    line: { style: 'solid', fill: lineFill, width: lineWidth },
  });
}

function text(name, value, x, y, width, height, style = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox', name,
    position: { left: x, top: y, width, height },
    fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: font, fontSize: 18, color: body,
    verticalAlignment: 'middle', alignment: 'left',
    autoFit: 'none', wrap: 'none', insets: 0,
    ...style,
  };
  return shape;
}

rect('slide-background', 0, 0, 1280, 720, '#FFFFFF');
rect('header-band', 0, 0, 1280, 58, blue);
text('section-label', '1  |  项目背景及思路', 34, 9, 470, 40,
  { fontSize: 24, bold: true, color: '#FFFFFF' });
text('slide-deck-line', '不同评价方法的指标体系与评分规则各异，参数取值、计算与校核需按方法分别开展。',
  64, 70, 1152, 22, { fontSize: 15, color: muted });
text('slide-title', '多方法岩体质量评价的工作量与校审难点', 64, 96, 1152, 44,
  { fontSize: 30, bold: true, color: navy });

text('workflow-heading', '现有评价流程', 64, 151, 260, 25,
  { fontSize: 16, bold: true, color: blue });
text('workflow-context', '从资料整理到成果编制，参数与计算按方法分别处理',
  704, 151, 512, 25, { fontSize: 14, color: muted, alignment: 'right' });

const steps = [
  ['01', '工程资料', '岩芯编录等资料'],
  ['02', '指标整理', '提取评价指标'],
  ['03', '规范取值', '按方法查表定参'],
  ['04', '计算校核', '按评分规则复核'],
  ['05', '成果编制', '汇编计算书'],
];
const stepX = [64, 294, 524, 754, 984];
rect('workflow-rule', 174, 200, 932, 1.5, stroke);
for (let i = 0; i < steps.length; i++) {
  const [number, title, detail] = steps[i];
  const x = stepX[i];
  const center = x + 110;
  slide.shapes.add({
    geometry: 'ellipse', name: `step-${number}-node`,
    position: { left: center - 7, top: 193, width: 14, height: 14 },
    fill: '#FFFFFF', line: { style: 'solid', fill: blue, width: 2 },
  });
  text(`step-${number}-number`, number, x, 179, 220, 15,
    { fontSize: 12, bold: true, color: blue, alignment: 'center' });
  text(`step-${number}-title`, title, x, 218, 220, 26,
    { fontSize: 17, bold: true, color: navy, alignment: 'center' });
  text(`step-${number}-detail`, detail, x, 246, 220, 22,
    { fontSize: 13, color: muted, alignment: 'center' });
}

slide.images.add({
  blob: await imageBytes(sceneImage), contentType: 'image/png',
  alt: '典型矿山工程场景示意图', fit: 'cover',
  position: { left: 64, top: 292, width: 392, height: 238 },
});
rect('scene-border', 64, 292, 392, 238, 'none', stroke, 1);
text('scene-caption', '典型矿山工程场景示意', 64, 539, 392, 22,
  { fontSize: 13, color: muted });

text('project-label', '典型矿山项目统计', 496, 274, 660, 25,
  { fontSize: 16, bold: true, color: blue });
const metrics = [
  { value: '25', label: '工程部位' },
  { value: '500', label: '测点' },
  { value: '5', label: '种方法 / 点位' },
  { value: '≈20', label: '分钟 / 方法' },
];
const metricX = [496, 668, 840, 1012];
metrics.forEach((metric, index) => {
  text(`metric-${index + 1}-value`, metric.value, metricX[index], 313, 154, 43,
    { fontSize: 31, bold: true, color: navy });
  text(`metric-${index + 1}-label`, metric.label, metricX[index], 354, 154, 22,
    { fontSize: 13, color: muted });
  if (index < metrics.length - 1) {
    rect(`metric-divider-${index + 1}`, metricX[index] + 160, 315, 1, 55, stroke);
  }
});
rect('metric-rule', 496, 390, 680, 1, stroke);

rect('workload-band', 496, 405, 680, 130, navy);
rect('workload-accent', 496, 405, 5, 130, blue);
text('workload-kicker', '人工估算总量', 523, 418, 190, 20,
  { fontSize: 13, bold: true, color: paleText });
text('workload-total', '≈ 833', 523, 439, 280, 62,
  { fontSize: 48, bold: true, color: '#FFFFFF' });
text('workload-unit', '人时', 697, 459, 105, 36,
  { fontSize: 24, bold: true, color: '#FFFFFF' });
rect('workload-divider', 925, 420, 1, 100, '#47617F');
text('workload-equation-label', '估算口径', 949, 425, 185, 18,
  { fontSize: 13, color: paleText });
text('workload-equation-line-1', '500测点 × 5种方法', 949, 447, 205, 21,
  { fontSize: 14, bold: true, color: '#FFFFFF' });
text('workload-equation-line-2', '× 20分钟 ÷ 60', 949, 469, 205, 21,
  { fontSize: 14, bold: true, color: '#FFFFFF' });
text('workload-note', '含参数整理、查表与计算校核', 949, 494, 205, 20,
  { fontSize: 12, color: paleText });

rect('summary-rule', 64, 565, 1152, 2, blue);
text('summary-copy', '人工投入除公式计算外，还包括资料整理、参数录入与成果编制；\n取值依据和计算结果分散于不同表格与文档，增加成果校审成本，也不利于快速追溯结果来源和计算过程。',
  64, 579, 1152, 50, { fontSize: 14, color: body, verticalAlignment: 'top', wrap: 'square' });

rect('footer-rule', 64, 653, 1152, 1, stroke);
slide.images.add({
  blob: await imageBytes(logoImage), contentType: 'image/png',
  alt: '长沙有色冶金设计研究院有限公司与CINF标识', fit: 'contain',
  position: { left: 1022, top: 666, width: 242, height: 40 },
});

if (steps.length !== 5 || metrics.length !== 4 || Math.round(500 * 5 * 20 / 60) !== 833) {
  throw new Error('Slide content or workload estimate failed its self-check.');
}

const preview = await presentation.export({ slide, format: 'png', scale: 1.5 });
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
  finalPath,
  pythonExecutable,
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  fontPolicy: { basis: 'design', families: [font] },
  verifyArtifactToolImport: true,
  receiptPath,
});
console.log(JSON.stringify({ finalPath, previewPath, result }));
