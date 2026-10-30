import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const path = 'D:/软件/CINF_RockMass_Calculator/deliverables/项目背景及思路_解决方案页_最终版.pptx';
const outPath = 'D:/软件/CINF_RockMass_Calculator/.codex-ppt-build/final-render-v2.png';
const presentation = await PresentationFile.importPptx(await FileBlob.load(path));
const slide = presentation.slides.items[0];
const png = await presentation.export({ slide, format: 'png', scale: 1 });
await fs.writeFile(outPath, new Uint8Array(await png.arrayBuffer()));
console.log(JSON.stringify({ slideCount: presentation.slides.items.length, outPath }));
