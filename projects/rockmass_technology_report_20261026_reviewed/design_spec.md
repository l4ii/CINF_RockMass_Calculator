<!-- ppt-master-schema: design-spec/v1 -->
# 矿山岩体质量分级智能化系统研发与应用 - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | rockmass_technology_report_20261026_reviewed |
| Canvas Format | ppt169, 1280 × 720 |
| Page Count | 14 |
| Primary Language | zh-CN |
| Target Audience | 设计院技术评审专家与科技项目评委 |
| Communication Intent | 按模板三章结构说明工程痛点、软件解决思路、核心创新和应用路径 |
| Desired Audience Outcome | 五分钟内理解工程痛点、多模态智能体协同思路、应用收益和产品化方式 |
| Core Message / Ask / Action | 将岩体分级计算、专业知识、现场图像和工程点位组织进可追溯的工作流，形成可推广的专业软件产品 |
| Delivery Context | 约5分钟现场科研成果汇报 |
| Artifact Afterlife | 补入脱敏工程数据、智能体演示、知识产权和财务测算后用于正式评审 |
| Reading Mode | presentation |
| Content Strategy | 参考模板三章框架；计算、数据看板和追溯作为平台底座简述，重点呈现智能体运行协同和多模态识别，并预留两页知识产权成果 |
| Design Style | 白底科研汇报风格，沿用模板橙色横线和企业标识，以深灰文字、青蓝技术信息、橙色强调构成页面节奏 |
| Speaker Notes | enabled |
| Custom Animations | disabled |
| Narration Audio | disabled |
| Created Date | 2026-10-26 |

## II. Canvas Specification

| Property | Value |
| --- | --- |
| Format | PPT 16:9 |
| Dimensions | 1280 × 720 |
| viewBox | `0 0 1280 720` |
| Margins | 56 px |
| Content Area | x56–1224, y148–648 |

## III. Visual Theme

### Theme Style
- **Mode**: custom
- **Mode References**: briefing
- **Mode Behavior**: 目录与章节分隔页沿用参考模板的科研汇报框架，正文按一页一结论组织，使用工程流程、智能体结构图、界面截图、指标对照和经济模型支撑观点。
- **Visual style**: custom
- **Visual Style References**: research-briefing
- **Visual Style Behavior**: 白色页面、浅灰辅助区、细橙色页眉线；深灰标题，青蓝技术标注，橙色聚焦数据或结论；减少卡片，用留白、基线和大幅证据画面建立层次。

### Color Scheme
| Role | HEX | Purpose |
| --- | --- | --- |
| Background | #FFFFFF | 页面场 |
| Secondary background | #F3F6F7 | 数据与说明辅助区 |
| Primary | #00A7C7 | 技术信息、流程与标注 |
| Accent | #E9672E | 模板橙色强调 |
| Yellow | #B58A33 | 少量成果/知识产权提示 |
| Orange | #E9672E | 关键数字与结论 |
| Body text | #242B30 | 正文 |
| Secondary text | #66737B | 次级说明 |
| Divider | #D9E1E4 | 规则线 |
| Warning | #A76723 | 待核实数据 |

## IV. Typography System

### Font Plan
| Role | Primary | Fallback |
| --- | --- | --- |
| Title | Microsoft YaHei | Arial, sans-serif |
| Body | Microsoft YaHei | Arial, sans-serif |
| Code | Consolas | Microsoft YaHei, monospace |

### Font Size Hierarchy
| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 22 |
| Title | 42 |
| Subtitle | 26 |
| Annotation | 16 |
| Footnote | 12 |
| Display | 64 |
| Section display | 170 |
| Section title | 44 |
| Large subtitle | 26 |
| Directory item | 27 |
| Directory index | 64 |
| Card heading | 23 |
| KPI | 54 |

## V. Layout Principles
- **Hierarchy direction**: 主题、机制或证据、适用边界依次阅读
- **Composition tendency**: 章节页用大编号和短标题；背景页用项目数据和一条作业链；创新页用主导式架构图与图像证据流程；应用页用前后指标对照和清晰定价结构
- **Cross-page continuity**: 橙色细线、青蓝技术标记和三章编号贯穿，正文的版式随信息类型变化
- **Spacing posture**: 正文信息密度适中，章节页和结束页留白

## VI. Icon Usage Specification
- **Primary bundled library**: none
- **Usage**: 本稿使用几何节点和数字，不使用外部图标资源。

## VIII. Image Resource List
| Filename | Dimensions | Ratio | Purpose | Type | Image pattern | Crop Policy | Acquire Via | Status | Reference | text_policy | page_role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| template-cover-architecture.png | 1024x768 | 4:3 | P01模板建筑摄影背景 | Photography | 左侧主视觉，右侧留白承载项目标题 | adaptive | user | Existing | 参考模板媒体 | none | local |
| template-cinf-logo.png | 793x151 | 5.25:1 | P01企业标识 | Logo | 放置于封面右上角，完整显示 | no-crop | user | Existing | 参考模板媒体 | none | local |
| 01-rmr-calculation.png | 1600x900 | 16:9 | P05计算界面 | Screenshot | 作为工作流软件证据的大幅主画面 | no-crop | user | Existing | 虚构演示输入 | none | local |
| 03-engineering-overview.png | 1600x900 | 16:9 | P12工程总览 | Screenshot | 作为管理看板证据，完整保留画面 | no-crop | user | Existing | 虚构演示输入 | none | local |
| agent-runtime-placeholder | — | — | P07智能体运行展示 | Placeholder | 留出问答、上下文和依据来源界面 | adaptive | placeholder | Placeholder | 待替换真实运行截图 | none | local |
| vision-result-placeholder | — | — | P08多模态识别展示 | Placeholder | 图像输入与识别依据结果并置 | adaptive | placeholder | Placeholder | 待替换真实图像与识别结果 | none | local |
| copyright-certificate-placeholder | — | — | P09软件著作权展示 | Placeholder | 证书页面大幅展示，文字字段在下方 | adaptive | placeholder | Placeholder | 待填真实证书 | none | local |
| patent-certificate-placeholder | — | — | P10专利成果展示 | Placeholder | 证书页面大幅展示，标注真实状态 | adaptive | placeholder | Placeholder | 待填真实证书或受理文件 | none | local |

## IX. Content Outline

### Part 1: 项目背景及思路

#### Slide 01 - 封面
- **Title**: 矿山岩体质量分级智能化系统研发与应用
- **Audience move**: 记住正式项目名称和完成单位
- **Relationships**: none

#### Slide 02 - 目录
- **Core message**: 汇报围绕项目问题与思路、核心创新、应用效益与推广展开
- **Audience move**: 了解三部分顺序
- **Relationships**: 三部分顺序排列

#### Slide 03 - 项目背景及思路
- **Title**: 项目背景及思路
- **Audience move**: 从目录直接进入工程工作量问题
- **Relationships**: none

#### Slide 04 - 多点位分级工作量与复核
- **Core message**: 金龙矿山项目的部位数、点位数、方法数和成果数体现批量岩体分级工作量；工作流含资料整理、查表计算、成果汇总与复核
- **Boundary**: 统计数字由项目方脱敏后提供；不编造工程工时
- **Audience move**: 看出问题来自多点、多法、分散工具造成的重复工作
- **Relationships**: 项目数据在上，作业链在下，复核问题收束
- **page_rhythm**: dense

#### Slide 05 - 软件总体能力
- **Core message**: 软件连接工程点位管理、多方法确定性计算、依据追溯、成果输出与智能体能力
- **Boundary**: UI截图为虚构演示数据；智能体视觉/调度证据需补真实截图
- **Audience move**: 看到软件如何承接前页的现场工作流
- **Relationships**: 工程点位→参数→规则计算→成果；智能体跨接知识、上下文与图像
- **page_rhythm**: dense

### Part 2: 核心创新点

#### Slide 06 - 核心创新点
- **Audience move**: 聚焦智能体协同和多模态视觉两项创新
- **Relationships**: none

#### Slide 07 - 面向点位任务的智能体运行与协同框架
- **Core message**: Harness为Agent提供工程上下文、知识与视觉工具、输出约束和人工确认入口；Agent根据任务检索解释并组织能力调用
- **Boundary**: 仓库已见本地文本推理与上下文注入基础；完整工具编排和结果回写须用运行演示证明
- **Audience move**: 理解Agent如何从独立问答进入具体点位任务
- **Relationships**: 上下文进入Harness；Harness协调Agent与工具；建议返回工程师确认
- **page_rhythm**: dense

#### Slide 08 - 多模态视觉分析融入岩体评价流程
- **Core message**: 现场图像进入视觉分析后，输出特征、参数候选和判断依据，并与工程点位关联
- **Boundary**: 真实图像、识别结果、样本和精度均待项目方提供，不使用虚构识别结果
- **Audience move**: 看到视觉感知怎样进入分级任务闭环
- **Relationships**: 图像输入→视觉分析→带依据候选→工程师确认→点位结果
- **page_rhythm**: breathing

#### Slide 09 - 知识产权成果（一）：软件著作权
- **Core message**: 正式展示已登记软件著作权
- **Boundary**: 证书尚未提供；占位必须替换为真实证书或删除
- **Audience move**: 查看软件成果的权属材料
- **Relationships**: 证书图像与登记信息对应
- **page_rhythm**: breathing

#### Slide 10 - 知识产权成果（二）：专利与技术成果
- **Core message**: 展示专利或正式技术成果及其法律状态
- **Boundary**: 不得把申请/受理写成授权
- **Audience move**: 查看创新成果的知识产权证明
- **Relationships**: 证书图像与名称、编号、状态对应
- **page_rhythm**: breathing

### Part 3: 应用效益与推广

#### Slide 11 - 应用效益与推广
- **Audience move**: 从创新方案转到实际应用价值和产品化路径
- **Relationships**: none

#### Slide 12 - 应用效益
- **Core message**: 同口径工时对比量化时间效益，依据完整率与审核知识条目体现复核和知识沉淀价值
- **Boundary**: 项目工时、年点位、成本、完整率和知识条目数量待实测；不得作未验证的节省声明
- **Audience move**: 读出节省工时与其他可量化效益
- **Relationships**: 人工/软件工时对照；复核/知识指标并列
- **page_rhythm**: dense

#### Slide 13 - 应用场景与产品化收益
- **Core message**: 院内矿山合同场景先行，后拓展交通、隧道、地下工程和边坡；按基础软件+AI模块授权并收费维护
- **Boundary**: 1.5亿元为项目方提供合同场景口径；50万+50万及维护费为拟定方案，均需院内核准
- **Audience move**: 理解应用市场、售价构成、收入测算和产业价值
- **Relationships**: 院内场景→外部领域；基础授权+AI模块→收入与维护
- **page_rhythm**: dense

#### Slide 14 - 结束
- **Core message**: 项目形成面向岩体质量分级的多模态智能体协同平台和产品化方案
- **Audience move**: 记住项目定位并结束汇报
- **Relationships**: 技术成果收束到专业软件推广

## X. Speaker Notes Requirements
- **Generation**: enabled
- **Filename**: match each SVG filename under notes/
- **Content**: 口述稿优先，保留成熟度边界和待补素材说明
- **Notes style**: 正式、解释性、适合科研项目汇报
- **Total duration**: 约15分钟
