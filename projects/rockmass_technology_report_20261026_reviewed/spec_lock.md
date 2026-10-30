<!-- ppt-master-schema: spec-lock/v1 -->
# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: ppt169

## communication
- primary_language: zh-CN
- audience: 设计院技术专家、科技项目评委及院内决策人员
- objective: 五分钟内说明矿山岩体质量分级的工程痛点、多模态智能体协同思路、核心创新、应用创效与产品化方案
- core_message: 将岩体分级计算、专业知识、现场图像和点位成果组织进可追溯的工程工作流，形成可推广的专业软件产品
- consumption_mode: presentation

## mode
- mode: custom
- mode_references: briefing
- mode_behavior: 沿用参考模板的正式科研汇报节奏；每页以一条结论和一项主视觉推进，背景、创新、应用三部分清楚分隔。

## visual_style
- visual_style: custom
- visual_style_behavior: 白底科研汇报风格，承接参考模板的橙色横线、企业标识和章节编号；正文以深灰文字、青蓝技术信息和橙色结论强调，截图与证书预留框按证据主次布局，避免重复卡片网格。

## colors
- background: #FFFFFF
- secondary_bg: #F3F6F7
- primary: #00A7C7
- accent: #E9672E
- yellow: #B58A33
- orange: #E9672E
- body_text: #242B30
- secondary_text: #66737B
- divider: #D9E1E4
- warning: #A76723

## typography
- font_family: Microsoft YaHei, Arial
- body: 22
- title: 40
- subtitle: 26
- annotation: 16
- footnote: 12
- display: 64
- section_display: 170
- section_title: 44
- card_heading: 23
- kpi: 54

## images
- cover-architecture: images/template-cover-architecture.png | source=user | crop=adaptive
- company-logo: images/template-cinf-logo.png | source=user | crop=no-crop
- calculation-screen: images/01-rmr-calculation.png | source=user | crop=no-crop
- engineering-overview: images/03-engineering-overview.png | source=user | crop=no-crop
- agent-screenshot: placeholder | source=placeholder | crop=adaptive
- vision-input-output: placeholder | source=placeholder | crop=adaptive
- copyright-certificates: placeholder | source=placeholder | crop=adaptive
- patent-certificates: placeholder | source=placeholder | crop=adaptive

## icons
- library: none
- inventory: none

## page_rhythm
- P01: anchor
- P02: breathing
- P03: anchor
- P04: dense
- P05: dense
- P06: anchor
- P07: dense
- P08: breathing
- P09: breathing
- P10: breathing
- P11: anchor
- P12: dense
- P13: dense
- P14: anchor

## pptx_structure
- mode: flat

## forbidden
- repeated equal-card grids without a page job
- invented project metrics, AI accuracy, IP records, or sales results
- presenting demo inputs as real engineering results
- mask, <style>, class, external CSS, <foreignObject>, textPath, @font-face, animation elements, scripts, event attributes, iframes
- HTML named entities in text; write typography as raw Unicode and escape XML reserved characters
