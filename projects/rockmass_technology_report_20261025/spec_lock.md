<!-- ppt-master-schema: spec-lock/v1 -->
# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: ppt169

## communication
- primary_language: zh-CN
- audience: 设计院技术专家与科技项目评委
- objective: 理解真实软件功能、验证证据及研发边界，形成可补证的正式汇报初稿
- core_message: 六方法计算与案例点位管理已形成基础，智能辅助和工程实测分阶段推进
- consumption_mode: balanced

## mode
- mode: custom
- mode_references: briefing
- mode_behavior: 保留14页科技汇报链条与主题标题，以真实机制、可核查证据和成熟度说明技术成果。

## visual_style
- visual_style: custom
- visual_style_references: dark-tech
- visual_style_behavior: 深蓝页面场、冰蓝细规则、青色重点、真实截图白色证据面；以流程、结构、表格任务变化构图，内容清楚可审阅。

## colors
- background: #07182B
- secondary_bg: #11263E
- primary: #5CB8FF
- accent: #49E0D0
- secondary_accent: #82A7D2
- body_text: #EAF2FA
- secondary_text: #A8BDD3
- divider: #284158
- warning: #F5BD65

## typography
- font_family: Microsoft YaHei, Arial
- title_family: Microsoft YaHei, Arial
- body_family: Microsoft YaHei, Arial
- code_family: Microsoft YaHei, Consolas
- body: 24
- title: 42
- subtitle: 28
- annotation: 18
- footnote: 14
- display: 64
- code: 18
- data: 22

## icons
- library: none
- inventory: none

## images
- calculation: images/01-rmr-calculation.png | source=user | crop=no-crop
- points: images/02-project-points.png | source=user | crop=no-crop
- overview: images/03-engineering-overview.png | source=user | crop=no-crop
- export: images/04-export-dialog.png | source=user | crop=no-crop

## page_rhythm
- P01: anchor
- P02: dense
- P03: dense
- P04: dense
- P05: dense
- P06: dense
- P07: dense
- P08: dense
- P09: dense
- P10: dense
- P11: dense
- P12: dense
- P13: breathing
- P14: anchor

## pptx_structure
- mode: flat

## forbidden
- `mask`, `<style>`, `class`, external CSS, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<set>`, `<script>` / event attributes, `<iframe>`
- HTML named entities in text; write typography as raw Unicode and escape XML reserved characters
