import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'D:/软件/CINF_RockMass_Calculator';
const buildDir = path.join(workspaceDir, '.codex-ppt-build');
const skillDir = 'C:/Users/0303003/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const pythonExecutable = 'C:/Users/0303003/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const draftPath = path.join(buildDir, 'workflow-workload-polished-draft.pptx');
const finalPath = path.join(workspaceDir, 'deliverables', '岩体质量分级工作流程与工作量_页面调整版2.pptx');
const previewPath = path.join(buildDir, 'workflow-workload-polished-preview.png');
const logoImage = path.join(workspaceDir, 'projects/rockmass_technology_report_20261026_final/cinf-logo-transparent.png');
const mineImage = path.join(workspaceDir, 'frontend/public/about/2/mine-overview.jpeg');

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
const blue = '#3E79E9';
const navy = '#17395F';
const body = '#43566D';
const muted = '#728398';
const stroke = '#D7E1ED';
const accent = '#D98737';
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

// Rebuild the content area on a clean canvas while retaining the template banner and footer identity.
rect('slide-background', 0, 0, 1280, 720, '#FFFFFF');
rect('header-band', 0, 0, 1280, 58, blue);
text('section-label', '1  |  项目背景及思路', 34, 9, 470, 40,
  { fontSize: 24, bold: true, color: '#FFFFFF' });
text('slide-deck-line', '不同方法的指标与评分规则各异，需分别定参、计算和校核，多部位、多点位作业带来较大工作量。',
  64, 72, 1152, 22, { fontSize: 15, color: muted });
text('slide-title', '现有问题', 64, 101, 1152, 46,
  { fontSize: 32, bold: true, color: navy });

const steps = [
  ['01', '工程资料', '整理岩芯编录等资料'],
  ['02', '指标整理', '提取评价指标'],
  ['03', '规范取值', '查阅规范、确定参数'],
  ['04', '计算校核', '按方法计算并校核'],
  ['05', '成果编制', '汇编计算书'],
];
const centers = [160, 400, 640, 880, 1120];
const nodes = [];
for (let i = 0; i < steps.length; i++) {
  const [number, title, detail] = steps[i];
  const center = centers[i];
  text(`step-${number}-number`, number, center - 40, 157, 80, 18,
    { fontSize: 12, bold: true, color: blue, alignment: 'center' });
  nodes.push(slide.shapes.add({
    geometry: 'ellipse', name: `step-${number}-node`,
    position: { left: center - 7, top: 186, width: 14, height: 14 },
    fill: blue, line: { style: 'solid', fill: blue, width: 1 },
  }));
  text(`step-${number}-title`, title, center - 110, 217, 220, 26,
    { fontSize: 18, bold: true, color: navy, alignment: 'center' });
  text(`step-${number}-detail`, detail, center - 112, 247, 224, 24,
    { fontSize: 13, color: muted, alignment: 'center' });
}
for (let i = 0; i < nodes.length - 1; i++) {
  slide.shapes.connect(nodes[i], nodes[i + 1], {
    kind: 'straight', fromSide: 'right', toSide: 'left',
    line: { style: 'solid', fill: stroke, width: 1.5 },
    head: { type: 'arrow', width: 'sm', length: 'sm' },
  });
}

slide.images.add({
  blob: await imageBytes(mineImage), contentType: 'image/jpeg',
  alt: '露天矿区现场', fit: 'cover',
  position: { left: 64, top: 294, width: 430, height: 238 },
});
rect('photo-edge', 64, 294, 430, 238, 'none', '#DCE4EE', 1);

text('stats-heading', '典型矿山项目统计', 536, 294, 680, 26,
  { fontSize: 16, bold: true, color: blue });
const metrics = [
  { value: '25', label: '工程部位' },
  { value: '500', label: '测点' },
  { value: '5', label: '种方法 / 点位' },
  { value: '≈20', label: '分钟 / 方法' },
];
const metricX = [536, 706, 876, 1046];
metrics.forEach((metric, index) => {
  text(`metric-${index + 1}-value`, metric.value, metricX[index], 332, 150, 42,
    { fontSize: 30, bold: true, color: navy, alignment: 'center' });
  text(`metric-${index + 1}-label`, metric.label, metricX[index], 371, 150, 22,
    { fontSize: 13, color: muted, alignment: 'center' });
  if (index < metrics.length - 1) {
    rect(`metric-divider-${index + 1}`, metricX[index] + 162, 336, 1, 51, stroke);
  }
});

rect('workload-rule', 536, 416, 680, 1, stroke);
text('equation-label', '人工估算工作量', 536, 433, 235, 20,
  { fontSize: 13, bold: true, color: muted });
text('workload-equation', '500 × 5 × 20 ÷ 60', 536, 460, 382, 36,
  { fontSize: 22, bold: true, color: body });
rect('workload-divider', 936, 434, 1, 65, stroke);
text('workload-total', '≈ 833 人时', 968, 436, 248, 52,
  { fontSize: 32, bold: true, color: accent, alignment: 'center' });
text('workload-unit-note', '分级计算与成果编制', 968, 483, 248, 20,
  { fontSize: 13, color: muted, alignment: 'center' });

rect('summary-rule', 64, 562, 1152, 2, blue);
text('summary-copy', '工作量不仅来自公式计算，还包括多部位、多点位、多方法下的资料整理、参数录入与成果编制。资料、取值依据和计算结果分散在不同表格与文档中，增加校审工作量，也使结果来源和计算过程难以快速追溯。',
  64, 577, 1152, 58, { fontSize: 16, color: body, verticalAlignment: 'top', wrap: 'square' });

rect('footer-rule', 64, 653, 1152, 1, stroke);
slide.images.add({
  blob: await imageBytes(logoImage), contentType: 'image/png',
  alt: '长沙有色冶金设计研究院有限公司与CINF标识', fit: 'contain',
  position: { left: 1022, top: 666, width: 242, height: 40 },
});

slide.speakerNotes.text = '岩体质量分级流程包括工程资料整理、评价指标提取、查阅规范确定参数、计算校核和成果编制。不同方法的指标体系和评分规则存在差异，参数取值、计算和校核通常需按方法分别开展。工作量估算依据用户提供的典型矿山项目统计口径：25个工程部位、500个测点、每个点位采用5种方法、单种方法平均约20分钟，计算为500×5×20÷60≈833人时。';

if (steps.length !== 5 || metrics.length !== 4 || Math.round(500 * 5 * 20 / 60) !== 833) {
  throw new Error('Slide content or workload estimate failed its self-check.');
}

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
  receiptPath: path.join(buildDir, 'workflow-workload-polished2.validation.json'),
});
console.log(JSON.stringify({ finalPath, previewPath, result }));
