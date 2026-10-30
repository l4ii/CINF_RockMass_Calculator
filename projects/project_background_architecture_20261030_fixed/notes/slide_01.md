模型建议依据魔搭社区模型卡：Qwen3-8B 是文本生成模型，不能直接接收图像；Qwen3-VL-8B-Instruct 支持图文输入，适合作为岩芯影像理解与特征候选提取的起点评测模型。建议先用提示词、结构化输出和工程师确认建立基线，不必一开始就微调；如代表性标注样本评测仍有稳定误差，再考虑 LoRA 等专项微调。RQD 属于几何测量与规范计算任务，需做尺度标定、岩芯分段和长度测量，再按规范阈值计算并复核。

知识库建议采用 RAG：将标准、方法资料与工程经验分段建库，以 BAAI/bge-m3 做多语言稠密 / 稀疏检索和混合召回；需要提高候选条款相关性时，可增加 BAAI/bge-reranker-v2-m3 重排，再把命中依据与点位上下文提供给文本助手。长上下文只表示模型可接收较长输入，不等同于按问题检索知识。当前软件知识文本直接注入助手提示词，尚未实现向量检索；本页列出的视觉模型与 RAG 流程均为建议扩展，不代表已接入。

ModelScope 模型卡显示：Qwen3-VL-8B-Instruct 为 Apache-2.0；BAAI/bge-m3 为 MIT；BAAI/bge-reranker-v2-m3 为 Apache-2.0。部署时仍应按实际下载的模型版本和许可条款复核。

https://www.modelscope.cn/models/Qwen/Qwen3-8B
https://www.modelscope.cn/models/Qwen/Qwen3-VL-8B-Instruct
https://www.modelscope.cn/models/BAAI/bge-m3
https://www.modelscope.cn/models/BAAI/bge-reranker-v2-m3
