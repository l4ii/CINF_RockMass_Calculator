# 岩体分级内部回归与人工公式校核证据

- 日期：2026-10-25（Asia/Shanghai）。
- 单位全称：长沙有色冶金设计研究院有限公司。来源：frontend/src/constants/appCopy.ts:17。
- 范围：使用已有依赖运行指定域逻辑测试与三个合成输入公式校核；未修改代码或依赖。
- 性质：软件内部回归和简单算术复核，不是规范原文算例、现场实测或第三方认证。

## 现有测试执行

工作目录：D:/软件/CINF_RockMass_Calculator

命令：

    npm.cmd --prefix frontend test -- src/bq.methods.test.ts src/q.methods.test.ts src/gsi.methods.test.ts src/mrmr.strict.test.ts

实际输出：

    RUN v4.1.10 D:/软件/CINF_RockMass_Calculator/frontend
    Test Files  4 passed (4)
    Tests       79 passed (79)
    Start at    16:56:54
    Duration    2.26s
    Process exit code: 0

有 Vite/react-babel 的 esbuild 配置弃用告警；此次运行没有测试失败。79是这4个文件的实际通过数，不代表六方法全部测试、完整UI、打包或兼容性通过。

## 三组人工公式校核

方法：一次性 Node 标准输入脚本，使用已有 frontend/node_modules/typescript 内存转译项目 .ts 模块，直接调用 calculateBq / calculateQ / calculateGsi，用 assert.equal 比较实际输出与独立写出的简单算式；未写入脚本文件。

执行时间：2026-10-25T08:57:25.125Z（本地16:57:25）。退出码：0。

### 1. BQ 基本质量

- 输入：Rc=50 MPa，Kv=0.5，其余为 createInitialBqState 默认值（基本BQ模式）。
- 人工期望：100+3×50+250×0.5=375。
- 代码实际：basicBq=375；等级III。断言通过。
- 公式实现：frontend/src/methods/bq.ts:812-820。
- 同类现有断言：frontend/src/bq.methods.test.ts:49-55。

### 2. Q 六参数

- 输入：RQD=80，Jn=4，Jr=3，Ja=1，Jw=1，SRF=1；无跨度/ESR。
- 选项ID：two_sets / rough_undulating / unaltered_walls / dry_minor / medium_stress。
- 人工期望：(80/4)×(3/1)×(1/1)=60。
- 代码实际：q=60；等级I。断言通过。
- 公式实现：frontend/src/methods/q.ts:992-1010。
- 同类输入和断言：frontend/src/q.methods.test.ts:21-51。

### 3. GSI JCond89 定量路径

- 输入：jointed_isotropic适用场景，quantitative入口，实测RQD=80，surfaceMethod=jcond89，jcond89Mode=simple，jcond89Value=25，jcond89SimpleId为空。
- 人工期望：1.5×25+80/2=77.5。
- 代码实际：gsi=77.5；等级II级。断言通过。
- 公式实现：frontend/src/methods/gsi.ts:1005-1027。
- 同类输入和断言：frontend/src/gsi.methods.test.ts:30-40,64-75。

## 可用于汇报的保守表述

“针对BQ、Q、GSI、MRMR的现有域逻辑测试，本次4个文件、79项测试通过；另用三组合成输入完成基本公式人工校核，结果一致。”

## 未验证与风险

未运行完整UI或全部测试，未验证RQD/RMR全流程、Windows7实机、安装包、GGUF推理、Word实际排版、真实矿山数据或外部规范逐条一致性。不得把79项内部回归与3组人工校核表述为规范认证、实测准确率、现场效益或六方法全面验收。