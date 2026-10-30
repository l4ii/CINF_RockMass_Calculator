# 项目背景及思路_功能模块与实现方法_可编辑

- Source: `项目背景及思路_功能模块与实现方法_可编辑.pptx`
- Total slides: 1

## Slide 1

1 | 项目背景及思路

项目目标与整体解决方案

面向工程实践，建设岩体质量分级智能化系统

项目目标

功能模块与实现方法

软件平台 · 当前实现

桌面端 · 本地运行

研发岩体质量分级智能化系统

桌面交互层

专业计算层

本地助手服务

面向工程部位与点位组织评价资料和分级流程，建设集数据管理、多方法计算、依据关联与成果交付于一体的应用系统。

Electron · React / TypeScript

TypeScript 规则引擎

Python / Flask · GGUF

工程、部位与点位管理

多方法计算 · 参数校验 · 追溯

助手 API · 本机模型推理

AI 能力扩展 · 开源模型建议（魔搭）

专业知识库 · RAG 检索

多模态图像分析

预期效果

Qwen3-VL-8B-Instruct · 图文输入

标准、方法与工程经验分段建库

Qwen3-8B 是文本模型，不能直接看图

多方法分级流程一体化

BGE-M3

混合召回

可选重排

岩芯影像理解，提取分段与破碎特征候选

点位任务智能辅助

BAAI bge-reranker-v2-m3 · 可选重排模型

RQD 需尺度标定、分段测长并按规范计算

命中依据 + 点位上下文 → 助手回答

成果依据全程可追溯

先评测再定微调；必要时 LoRA，工程师复核

长上下文≠RAG：按问题检索证据再注入

当前助手使用本地 GGUF，知识文本直接注入；以上模型与 RAG 流程为建议扩展，尚未接入。

基础软件支撑工程化流程，智能能力拓展点位分析与多模态信息应用

长沙有色冶金设计研究院有限公司

### Speaker Notes

模型建议依据魔搭社区模型卡：Qwen3-8B 是文本生成模型，不能直接接收图像；Qwen3-VL-8B-Instruct 支持图文输入，适合作为岩芯影像理解与特征候选提取的起点评测模型。建议先用提示词、结构化输出和工程师确认建立基线，不必一开始就微调；如代表性标注样本评测仍有稳定误差，再考虑 LoRA 等专项微调。RQD 属于几何测量与规范计算任务，需做尺度标定、岩芯分段和长度测量，再按规范阈值计算并复核。

知识库建议采用 RAG：将标准、方法资料与工程经验分段建库，以 BAAI/bge-m3 做多语言稠密 / 稀疏检索和混合召回；需要提高候选条款相关性时，可增加 BAAI/bge-reranker-v2-m3 重排，再把命中依据与点位上下文提供给文本助手。长上下文只表示模型可接收较长输入，不等同于按问题检索知识。当前软件知识文本直接注入助手提示词，尚未实现向量检索；本页列出的视觉模型与 RAG 流程均为建议扩展，不代表已接入。

ModelScope 模型卡显示：Qwen3-VL-8B-Instruct 为 Apache-2.0；BAAI/bge-m3 为 MIT；BAAI/bge-reranker-v2-m3 为 Apache-2.0。部署时仍应按实际下载的模型版本和许可条款复核。

https://www.modelscope.cn/models/Qwen/Qwen3-8B

https://www.modelscope.cn/models/Qwen/Qwen3-VL-8B-Instruct

https://www.modelscope.cn/models/BAAI/bge-m3

https://www.modelscope.cn/models/BAAI/bge-reranker-v2-m3
