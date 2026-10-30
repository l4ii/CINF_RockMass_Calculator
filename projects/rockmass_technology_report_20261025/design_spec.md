<!-- ppt-master-schema: design-spec/v1 -->
# 矿山岩体质量分级智能化系统研发与应用 - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | rockmass_technology_report_20261025 |
| Canvas Format | ppt169, 1280 × 720 |
| Page Count | 14 |
| Primary Language | zh-CN |
| Target Audience | 设计院技术评审专家与科技项目评委 |
| Communication Intent | 说明工程需求和软件技术实现，展示可核查证据，并明确研发边界 |
| Desired Audience Outcome | 理解已实现功能、验证范围及下一步补证事项 |
| Core Message / Ask / Action | 六方法计算与案例点位管理已形成软件基础，智能辅助和工程实测分阶段推进 |
| Delivery Context | 约15分钟现场科技汇报，兼顾会后审阅 |
| Artifact Afterlife | 可编辑汇报初稿，补入真实项目、问答截图与联系人后用于正式评审 |
| Reading Mode | balanced |
| Content Strategy | 保持用户14页主题顺序，依据仓库与公开资料纠正未经证实的强表述 |
| Design Style | 深蓝科技工程汇报，细规则与明确状态文字，真实软件截图为证据 |
| AI Image Acquisition Path | not applicable |
| Generation Mode | continuous |
| Spec Refinement | disabled |
| Speaker Notes | enabled — workflow default，含事实出处与口述边界 |
| Custom Animations | disabled — workflow default |
| Narration Audio | disabled — workflow default |
| Created Date | 2026-10-25 |

确认依据：用户“你先做”委托本次常规设计决定，不制作用户确认回执。Stage 1选择free_design，中文、14页、现场汇报。Stage 2比较三个完整方向：A深蓝工程汇报（briefing组织、dark-tech精确线条、微软雅黑与Consolas，真实截图，选用）；B白底规范审阅（briefing、swiss-minimal栅格、微软雅黑同族，文献与表格主导）；C结论先行答辩（pyramid、深蓝与白底分章、大标题、截图作论据）。A最符合科技汇报场景且便于区分已实现与研发中。三方向的可选图像渲染分别为digital-dashboard技术质感、minimalist-swiss平面、digital-dashboard克制技术插图；本次均不启用AI图像。

## II. Canvas Specification

| Property | Value |
| --- | --- |
| Format | PPT 16:9 |
| Dimensions | 1280 × 720 |
| viewBox | `0 0 1280 720` |
| Margins | 56 px |
| Content Area | x56–1224，y148–648 |

## III. Visual Theme

### Theme Style
- **Mode**: custom
- **Mode References**: briefing
- **Mode Behavior**: 保留14页科技汇报链条，主题标题清楚，技术实现与验证证据分别陈述，成熟度紧邻对应功能。
- **Visual style**: custom
- **Visual Style References**: dark-tech
- **Visual Style Behavior**: 深蓝页面场配冰蓝细线和青色重点，标题左对齐，结构图以稀疏连接和明确边界表达。截图作为白色证据面，正文保持宽行距；每页根据图、表、流程的任务改变主构图。
- **Theme**: 工程资料的细线与节点贯穿，编号作为导航而非装饰主角
- **Tone**: 正式、克制、可核查

### Color Scheme
| Role | HEX | Purpose |
| --- | --- | --- |
| Background | #07182B | 页面场 |
| Secondary background | #11263E | 局部内容面 |
| Primary | #5CB8FF | 标题与连接重点 |
| Accent | #49E0D0 | 已验证重点 |
| Secondary accent | #82A7D2 | 次级结构 |
| Body text | #EAF2FA | 正文 |
| Secondary text | #A8BDD3 | 注释与来源 |
| Divider | #284158 | 规则线 |
| Warning | #F5BD65 | 待验证与拟开展状态 |

## IV. Typography System

### Font Plan
| Role | Character (Reference) | Primary | English if non-English | Fallback tail |
| --- | --- | --- | --- | --- |
| Title | 工程无衬线，粗体 | Microsoft YaHei | Arial | sans-serif |
| Body | 中性无衬线 | Microsoft YaHei | Arial | sans-serif |
| Code | 接口与版本字段等宽 | Microsoft YaHei | Consolas | monospace |
- **Title stack**: Microsoft YaHei, Arial
- **Body stack**: Microsoft YaHei, Arial
- **Code stack**: Microsoft YaHei, Consolas
- **Role rationale**: Code使用等宽拉丁字面承载真实接口字段。

### Font Size Hierarchy
| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 24 |
| Title | 42 |
| Subtitle | 28 |
| Annotation | 18 |
| Footnote | 14 |
| Display | 64 |
| Code | 18 |
| Data | 22 |

## V. Layout Principles
- **Hierarchy direction**: 主题、机制或证据、适用边界依次阅读
- **Composition tendency**: 架构图与截图主导核心技术页，背景与效果页使用开放文字场
- **Cross-page continuity**: 方法编号与技术路线对应，同一深蓝场和青色证据标记
- **Spacing posture**: 核心技术与验证较密，封面总结留白
- **Spacing anchors**: page margin 56，block gap 24，column gutter 40，corner radius 6，body leading 36

## VI. Icon Usage Specification
- **Primary bundled library**: none
| Icon Path | Suitable Scenarios |
| --- | --- |

## VIII. Image Resource List
| Filename | Dimensions | Ratio | Purpose | Type | Image pattern | Crop Policy | Acquire Via | Status | Reference | text_policy | page_role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-rmr-calculation.png | 1600x900 | 16:9 | P9真实计算界面 | Screenshot | 主画面完整呈现并附演示标记 | no-crop | user | Existing | 当前仓库临时浏览器演示，RMR77，非实际工程 | none | local |
| 02-project-points.png | 1600x900 | 16:9 | P6案例点位模型证据 | Screenshot | 配合层级模型完整显示 | no-crop | user | Existing | 当前仓库6个虚构演示点位 | none | local |
| 03-engineering-overview.png | 1600x900 | 16:9 | P9汇总界面 | Screenshot | 与计算界面沿同一基线组合 | no-crop | user | Existing | 当前仓库演示数据汇总 | none | local |
| 04-export-dialog.png | 1600x900 | 16:9 | P6原生导出入口证据 | Screenshot | 完整导出界面与计算书说明相邻 | no-crop | user | Existing | 实际导出DOCX并校验XML，未完成分页视觉校验 | none | local |

可选补图不作为本次初稿必需资源：真实本地问答、真实工程点位与耗时、真实计算书页面。当前缺模型及文档排版引擎，不伪造图像；用架构和导出界面履行本次页面任务。

## IX. Content Outline

### Part 1: 需求与总体方案

#### Slide 01 - 封面
- **Audience move**: 了解主题与完成单位
- **Relationships**: none
- **Composition**: 正式大标题与技术路线索引构成开场
- **Title**: 矿山岩体质量分级智能化系统研发与应用
- **Core message**: 面向设计院工作流的岩体分级软件研发汇报
- **Content**: 正式项目名；长沙有色冶金设计研究院有限公司；汇报人待补充；2026年10月25日

#### Slide 02 - 项目背景
- **Audience move**: 从一般需求理解到规范与工程记录需求
- **Relationships**: 规范要求、人工工作环节、设计院复核需求依次构成项目背景
- **Title**: 项目背景与工程需求
- **Core message**: 分级需要有依据的计算与可复核记录
- **Content**: GB/T 50218—2014第1.0.2条短引；定性定量结合与工况定级；查表计算编书复核的流程问题；缺少院内统计时不写逐年增长数据
- **Fact IDs**: F001,F002,F003,F004

#### Slide 03 - 国内外现状分析
- **Audience move**: 了解现有工具专长与本项目定位
- **Relationships**: 对比RSData、NGI Q工具及可定制表格工具的能力与项目集成关注点
- **Title**: 国内外工具与项目定位
- **Core message**: 现有工具各有专长，项目聚焦设计院工作流集成
- **Content**: RSData强度准则与GSI及Excel导出；NGI2025指南及数字测绘；Excel项目内可定制但需维护；不宣称市场空白
- **Visualization**: tools-compare，自定义工具与功能对照表
- **Native-ready**: tools-compare=yes
- **Fact IDs**: F006,F007,F008,F010,F012

#### Slide 04 - 研究目标与总体方案
- **Audience move**: 理解四项技术与全流程的对应
- **Relationships**: 经验知识化、辅助录入、多方法计算、依据记录、成果输出构成研究顺序；四项研究目标对应后续技术页
- **Title**: 研究目标与总体方案
- **Core message**: 以统一计算与项目记录为底座，分阶段接入智能辅助
- **Content**: 五环节路线；目标一计算统一、目标二点位与交付、目标三知识辅助、目标四图像候选值；状态逐项区分

### Part 2: 关键技术

#### Slide 05 - 多方法分级计算
- **Audience move**: 理解共用模型与各方法实现的边界
- **Relationships**: 六方法属于计算能力集合；共用点位输入连接五个适配器与RMR专用模块；记录与输出连接结果
- **Title**: 关键技术一：多方法分级计算
- **Core message**: 六方法集成建立在共用模型和方法专用规则上
- **Content**: RQD/BQ/Q/RMR/MRMR/GSI；ClassificationAdapter五个实现与RMR专用模块；normalize/validate/calculate/describe；standardId与inputVersion用于兼容校验；历史算法重放仍待完善

#### Slide 06 - 工程案例与成果输出
- **Audience move**: 理解项目、点位、输入与成果对应关系
- **Relationships**: 工程案例拥有多个点位，点位拥有方法输入和结果，输入连接本地项目文件及Word成果
- **Title**: 关键技术二：案例点位与成果输出
- **Core message**: 参数与点位同存，成果按项目汇总交付
- **Content**: 工程名称/部位/备注；点位及方法标准字段；原始输入和采用口径；实际导出Word演示；Q/GSI可嵌图，MRMR详细表待完善
- **Images**: 02-project-points.png、04-export-dialog.png，演示数据清晰标注

#### Slide 07 - 本地经验知识助手
- **Audience move**: 区分已有调用链与部署实测状态
- **Relationships**: 页面上下文和md/txt知识片段注入提示词，提示词交由本地GGUF推理，再由工程师复核
- **Title**: 关键技术三：本地经验知识助手
- **Core message**: 本地推理调用链已实现，模型与知识质量仍需验证
- **Content**: llama.cpp进程内推理；文本知识拼接与上下文；设备绑定离线授权；方法选择/参数解释/依据查找的预期范围；SRF真实问答待补；更新有联网路径，不能称软件绝不联网

#### Slide 08 - 多模态辅助判识
- **Audience move**: 清楚了解下一阶段的技术路线和验证条件
- **Relationships**: 图像采集、特征识别、参数候选建议、工程师确认依次推进
- **Title**: 关键技术四：多模态辅助判识
- **Core message**: 当前属于拟开展路线，识别结果须经工程确认
- **Content**: 尚未接入图像模型；岩芯/掌子面图像、结构面识别、候选值、确认流程；需标注样本与现场校准；用流程示意而非虚构识别结果

### Part 3: 实现、验证与应用

#### Slide 09 - 软件实现与界面
- **Audience move**: 看到可运行界面并了解环境状态
- **Relationships**: Electron界面、本机后端与可选模型组成运行环境；功能清单区分已实现和待验证
- **Title**: 软件实现与主要界面
- **Core message**: 桌面交互、点位管理与结果汇总已有真实运行界面
- **Content**: Electron+React+本机Python后端；Win7提供兼容构建未实机验收；方法/案例/Word/问答/授权状态
- **Images**: 01-rmr-calculation.png和03-engineering-overview.png，完整显示演示标记
- **Visualization**: functions-status，自定义功能状态表
- **Native-ready**: functions-status=yes

#### Slide 10 - 验证与测试
- **Audience move**: 了解已获得哪些验证证据与尚缺哪些外部对照
- **Relationships**: 三组合成算例对照软件值与独立算式；内部测试与现场验证分属不同证据层级
- **Title**: 验证与测试
- **Core message**: 本次79项域逻辑测试及3组基本公式校核通过
- **Content**: 4个测试文件79项通过；BQ375/Q60/GSI77.5偏差0；合成输入不是规范原文算例；真实工程效率、Win7与本地模型仍待验证
- **Visualization**: calculation-check，人工公式与软件计算对照表
- **Native-ready**: calculation-check=yes

#### Slide 11 - 设计院侧效果
- **Audience move**: 明白试点应按何种口径量化效果
- **Relationships**: 编制工时、复核完整性、知识维护是不同测量维度；基线与试点同口径对照
- **Title**: 应用效果：设计院侧评价口径
- **Core message**: 功能已具备评价基础，效率结论等待院内试点实测
- **Content**: 单点计算+编书分钟/点位；参数依据完整率；知识条目审核与复用；公式用文本说明降幅；不补造百分比

#### Slide 12 - 工程与推广
- **Audience move**: 理解应用条件、工程责任和推广路径
- **Relationships**: 工程核查与产品推广并列，院内试点先于标准化推广
- **Title**: 工程应用与推广路径
- **Core message**: 按工程条件选择方法，经试点验证后推广
- **Content**: 依据记录支持复核；多方法交叉核查需工程师判断；矿山/隧道/边坡适用性分别核对；安装包+设备绑定授权；院内试点、样板成果、版本验收、外部推广
- **Fact IDs**: F003,F005,F011

#### Slide 13 - 总结与下一步
- **Audience move**: 明确成果底座和后续优先级
- **Relationships**: 已实现成果与下一步工作形成状态对比
- **Title**: 总结与下一步工作
- **Core message**: 计算与交付底座已形成，工程补证和智能辅助继续推进
- **Content**: 六方法入口、项目点位、Word与本地授权；先补规范算例和真实项目效率；图像判识样本与模型；施工监测动态修正研究，均标拟开展

#### Slide 14 - 致谢
- **Audience move**: 结束汇报并提供联系入口
- **Relationships**: none
- **Title**: 感谢各位专家指导
- **Core message**: 正式结束
- **Content**: 单位全称；汇报人待补充；联系方式待补充

## X. Speaker Notes Requirements
- **Generation**: enabled
- **Filename**: match each SVG filename under notes/
- **Content**: 每页说明技术、成熟度与来源，外部URL和仓库路径在备注中保留；真实截图明确演示数据；不声称规范认证或现场实测效果
- **Total duration**: 约15分钟，P5–P8约6分钟
- **Notes style**: 正式、解释性
- **Presentation purpose**: 说明工程需求和真实软件实现，提供验证证据并明确后续工作
