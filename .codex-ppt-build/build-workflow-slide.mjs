import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = path.join(workspaceDir, '.codex-ppt-build');
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const pythonExecutable = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const draftPath = path.join(buildDir, 'workflow-workload-updated-draft.pptx');
const finalPath = path.join(workspaceDir, 'deliverables', '岩体质量分级工作流程与工作量_修订版.pptx');
const previewPath = path.join(buildDir, 'workflow-workload-updated-preview.png');
const logoImage = path.join(workspaceDir, 'projects/rockmass_technology_report_20261026_final/cinf-logo-transparent.png');

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
const blue = '#3E79E9';
const navy = '#17395F';
const body = '#43566D';
const muted = '#728398';
const pale = '#EEF4FC';
const stroke = '#C9D9EE';
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

// Rebuild only the template chrome so no previous-page artwork remains underneath.
rect('slide-background', 0, 0, 1280, 720, '#FFFFFF');
rect('header-band', 0, 0, 1280, 58, blue);
text('section-label', '1  |  项目背景及思路', 34, 9, 470, 40,
  { fontSize: 24, bold: true, color: '#FFFFFF' });
text('slide-title', '现有问题', 64, 74, 1120, 46,
  { fontSize: 30, bold: true, color: navy });

text('workflow-heading', '现有工作流程', 64, 137, 220, 24,
  { fontSize: 16, bold: true, color: blue });

const steps = [
  ['01', '工程资料', '整理岩芯编录等资料'],
  ['02', '指标整理', '提取评价指标'],
  ['03', '规范取值', '查阅规范并确定参数'],
  ['04', '计算校核', '按评分规则计算复核'],
  ['05', '成果编制', '汇编计算书'],
];
const stepX = [64, 294, 524, 754, 984];
rect('workflow-rule', 174, 191, 932, 1.5, stroke);
for (let i = 0; i < steps.length; i++) {
  const [number, title, detail] = steps[i];
  const x = stepX[i];
  const center = x + 110;
  slide.shapes.add({
    geometry: 'ellipse', name: `step-${number}-node`,
    position: { left: center - 7, top: 184, width: 14, height: 14 },
    fill: '#FFFFFF', line: { style: 'solid', fill: blue, width: 2 },
  });
  text(`step-${number}-number`, number, x, 169, 220, 15,
    { fontSize: 12, bold: true, color: blue, alignment: 'center' });
  text(`step-${number}-title`, title, x, 211, 220, 26,
    { fontSize: 17, bold: true, color: navy, alignment: 'center' });
  text(`step-${number}-detail`, detail, x, 239, 220, 22,
    { fontSize: 13, color: muted, alignment: 'center' });
}

text('method-note', '不同方法的指标体系与评分规则存在差异，参数取值、计算和校核通常需按方法分别开展。',
  64, 285, 1152, 28, { fontSize: 15, color: body });

text('project-label', '西藏金龙矿山项目统计', 64, 337, 660, 24,
  { fontSize: 16, bold: true, color: blue });

const metrics = [
  { value: '25', label: '工程部位' },
  { value: '500', label: '测点' },
  { value: '5', label: '种方法 / 点位' },
  { value: '≈20', label: '分钟 / 方法' },
];
const metricX = [64, 352, 640, 928];
metrics.forEach((metric, index) => {
  text(`metric-${index + 1}-value`, metric.value, metricX[index], 369, 256, 42,
    { fontSize: 31, bold: true, color: navy, alignment: 'center' });
  text(`metric-${index + 1}-label`, metric.label, metricX[index], 409, 256, 21,
    { fontSize: 13, color: muted, alignment: 'center' });
});
rect('metric-divider-1', 351, 376, 1, 50, stroke);
rect('metric-divider-2', 639, 376, 1, 50, stroke);
rect('metric-divider-3', 927, 376, 1, 50, stroke);
rect('metric-rule', 64, 447, 1152, 1, stroke);

text('workload-label', '人工估算工作量', 64, 465, 300, 20,
  { fontSize: 13, bold: true, color: muted });
text('workload-equation', '500测点 × 5种方法 × 20分钟 ÷ 60', 64, 491, 666, 35,
  { fontSize: 20, bold: true, color: body });
rect('workload-divider', 770, 465, 1, 62, stroke);
text('workload-total', '≈ 833 人时', 810, 470, 406, 48,
  { fontSize: 34, bold: true, color: navy });

rect('summary-rule', 64, 552, 1152, 2, blue);
text('summary-copy', '工作量不只来自公式计算，多部位、多点位、多方法下的资料整理、参数录入与成果编制同样耗时。\n资料、取值依据和计算结果分散在不同表格与文档中，增加了校审工作量，也使结果来源和计算过程难以快速追溯。',
  64, 570, 1120, 60, { fontSize: 15, color: body, verticalAlignment: 'top' });

rect('footer-logo-clear', 980, 645, 300, 75, '#FFFFFF');
rect('footer-logo-rule', 980, 645, 236, 1, '#C9D9EE');
slide.images.add({
  blob: await imageBytes(logoImage), contentType: 'image/png',
  alt: '长沙有色冶金设计研究院有限公司与CINF标识', fit: 'contain',
  position: { left: 1022, top: 661, width: 242, height: 40 },
});

slide.speakerNotes.text = '工作量估算依据用户提供的讲稿：西藏金龙矿山项目统计25个工程部位、500个测点，每个点位根据工程要求采用5种岩体质量分级或评价方法，单种方法平均约20分钟。估算为500×5×20÷60≈833人时。不同方法的指标体系和评分规则存在差异，参数取值与计算校核通常需要按方法分别开展。';

const preview = await presentation.export({ slide, format: 'png', scale: 1.5 });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
await (await PresentationFile.exportPptx(presentation)).save(draftPath);

const { finalizePresentation } = await import(pathToFileURL(
  path.join(skillDir, 'container_tools/artifact_tool_utils.mjs'),
).href);
await fs.mkdir(path.dirname(finalPath), { recursive: true });
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
  receiptPath: path.join(buildDir, 'workflow-workload-updated.validation.json'),
});
console.log(JSON.stringify({ finalPath, previewPath, result }));
