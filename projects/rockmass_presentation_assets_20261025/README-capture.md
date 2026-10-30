# 真实软件演示素材

截图均为当前仓库原代码在 127.0.0.1:5376 的 Vite web 预览，使用独立 headless Chrome 的临时 context；未操控用户现有浏览器或 Electron。App.tsx 在无 electronAPI.license 时原生允许 web 预览，未伪造授权状态。

- 01-rmr-calculation.png：1600×900，RMR分级页，演示点位01，RMR=77，II级。
- 02-project-points.png：1600×900，项目点位管理，6个虚构演示点位。
- 03-engineering-overview.png：1600×900，工程总览及实际分布图。
- 04-export-dialog.png：1600×900，真实导出内容选择对话框。
- 演示项目｜矿山岩体分级_RMR分级计算书.docx：通过真实导出按钮下载，未重绘、未改正文。
- 演示项目｜矿山岩体分级.rmcal：同次真实导出下载。

全部数据仅供软件功能演示，不是实测，不作工程设计依据。项目名、点位名、说明和备注均保留演示标记。具体输入、评分和等级见 demo-inputs-and-results.json。6点RMR依次77、52、24、100、64、70，均由实际应用算法计算。

验证：3张主截图已视觉检查中文和演示标记；浏览器无pageerror；两个原生下载均成功；DOCX ZIP/XML结构完整并含演示标记及结果。Vite进程23448及headless浏览器已退出，5376端口无监听。

真实报告页图未取得：Word.Application COM返回0x80040154 REGDB_E_CLASSNOTREG，Microsoft Office目录下无WINWORD.EXE；无soffice或常见路径的LibreOffice。未更改Office注册设置，未安装依赖。缺少DOCX到PDF的真实排版引擎，不以HTML重绘代替报告截图。
