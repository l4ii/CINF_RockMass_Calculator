from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parent
SVG_DIR = ROOT / "svg_output"
NOTE_DIR = ROOT / "notes"

BG = "#07182B"
PANEL = "#11263E"
PANEL2 = "#173F56"
TEXT = "#EAF2FA"
MUTED = "#A8BDD3"
BLUE = "#5CB8FF"
CYAN = "#49E0D0"
YELLOW = "#FDD71E"
ORANGE = "#FC5F08"
LINE = "#284158"
WARN = "#F5BD65"


def esc(value):
    return escape(str(value))


def text(x, y, value, size=24, color=TEXT, weight="normal", anchor="start", family=None):
    fam = f' font-family="{family}"' if family else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}"{fam}>{esc(value)}</text>'


def multiline(x, y, lines, size=24, color=TEXT, leading=34, weight="normal", family=None):
    out = []
    for idx, line in enumerate(lines):
        out.append(text(x, y + idx * leading, line, size=size, color=color, weight=weight, family=family))
    return "".join(out)


def rect(x, y, w, h, fill, stroke=None, sw=1, rx=0):
    attrs = f'x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"'
    if stroke:
        attrs += f' stroke="{stroke}" stroke-width="{sw}"'
    if rx:
        attrs += f' rx="{rx}"'
    return f"<rect {attrs}/>"


def line(x1, y1, x2, y2, color=LINE, sw=1, dash=None):
    extra = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"{extra}/>'


def circle(cx, cy, r, fill, stroke=None, sw=1):
    attrs = f'cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"'
    if stroke:
        attrs += f' stroke="{stroke}" stroke-width="{sw}"'
    return f"<circle {attrs}/>"


def polygon(points, fill):
    return f'<polygon points="{points}" fill="{fill}"/>'


def image(href, x, y, w, h):
    return f'<image href="{href}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet"/>'


def base(page, kicker, title, footer_text=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" '
        f'data-pptx-page-role="content" font-family="Microsoft YaHei, Arial">'
        f'{rect(0, 0, 1280, 720, BG)}'
        f'<g id="title" data-pptx-bounds="56 36 1168 104">'
        f'{text(56, 58, kicker, 14, BLUE)}{text(56, 111, title, 42, TEXT, "bold")}</g>'
        f'{text(56, 680, footer_text, 14, MUTED)}{text(1200, 680, f"{page:02d}", 14, MUTED, family="Arial")}'
    )


def end():
    return "</svg>"


def section(page, number, title, subtitle, accent):
    s = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" '
        f'data-pptx-page-role="section" font-family="Microsoft YaHei, Arial">'
        f'{rect(0, 0, 1280, 720, BG)}'
        f'{polygon("0,0 360,0 220,720 0,720", PANEL)}'
        f'{polygon("900,720 1280,720 1280,220", accent)}'
        f'{polygon("1080,720 1280,520 1280,720", ORANGE)}'
        f'{text(56, 110, "科技项目研发与应用汇报", 16, BLUE)}'
        f'{text(95, 440, str(number), 220, accent, "bold", family="Arial")}'
        f'{text(430, 355, title, 50, TEXT, "bold")}'
        f'{text(432, 412, subtitle, 24, MUTED)}'
        f'{line(432, 462, 610, 462, CYAN, 4)}'
        f'{text(1200, 680, f"{page:02d}", 14, MUTED, family="Arial")}'
        f'{end()}'
    )
    return s


def write_svg(name, content):
    (SVG_DIR / name).write_text(content, encoding="utf-8")


def note(name, body):
    (NOTE_DIR / name).write_text(body.strip() + "\n", encoding="utf-8")


def main():
    SVG_DIR.mkdir(exist_ok=True)
    NOTE_DIR.mkdir(exist_ok=True)
    for p in SVG_DIR.glob("*.svg"):
        p.unlink()
    for p in NOTE_DIR.glob("*.md"):
        p.unlink()

    # P1 cover
    p = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" '
        f'data-pptx-page-role="cover" font-family="Microsoft YaHei, Arial">{rect(0,0,1280,720,BG)}'
        f'{polygon("1020,0 1280,0 1280,320", PANEL2)}{polygon("1090,720 1280,520 1280,720", ORANGE)}'
        f'{polygon("920,720 1160,480 1280,480 1040,720", YELLOW)}{polygon("760,720 900,580 980,580 840,720", BLUE)}'
        f'{text(68, 116, "科技项目研发与应用汇报", 18, BLUE)}'
        f'{multiline(64, 232, ["矿山岩体质量分级", "智能化系统研发与应用"], 62, TEXT, 82, "bold")}'
        f'{line(68, 386, 164, 386, CYAN, 4)}'
        f'{text(68, 438, "面向设计院工作流的计算、记录与成果交付", 26, MUTED)}'
        f'{text(68, 552, "长沙有色冶金设计研究院有限公司", 24, TEXT)}'
        f'{text(68, 599, "汇报人：待补充", 18, MUTED)}{text(965, 599, "2026年10月26日", 18, MUTED)}'
        f'{text(1200, 680, "01", 14, MUTED, family="Arial")}{end()}'
    )
    write_svg("01_cover.svg", p)
    note("01_cover.md", "各位专家好，汇报项目《矿山岩体质量分级智能化系统研发与应用》，完成单位为长沙有色冶金设计研究院有限公司。")

    # P2 contents
    p = base(2, "汇报目录", "目录")
    p += (
        f'{line(350, 140, 350, 608, BLUE, 2)}{text(74, 240, "01", 72, YELLOW, "bold", family="Arial")}'
        f'{text(424, 228, "项目背景及思路", 30, TEXT, "bold")}{text(424, 268, "从典型项目工作量与复核难点出发", 20, MUTED)}'
        f'{text(74, 400, "02", 72, CYAN, "bold", family="Arial")}{text(424, 388, "创新点及相关内容", 30, TEXT, "bold")}{text(424, 428, "公式集合、溯源、本地模型与图像辅助", 20, MUTED)}'
        f'{text(74, 560, "03", 72, ORANGE, "bold", family="Arial")}{text(424, 548, "应用及经济社会效益", 30, TEXT, "bold")}{text(424, 588, "界面交付、试点口径与推广路径", 20, MUTED)}'
    )
    p += end()
    write_svg("02_contents.svg", p)
    note("02_contents.md", "本次汇报分为三部分：先说明项目现场的工作量和复核难点，再介绍软件的核心创新，最后展示当前界面、成果交付和应用推广路径。")

    # P3 section 1
    write_svg("03_section_background.svg", section(3, 1, "项目背景及思路", "以工程现场的工作量与复核难点为出发点", YELLOW))
    note("03_section_background.md", "第一部分先不展开规范条文，而是从工程现场的实际工作量和复核难点说明为什么需要这套工具。")

    # P4 pain points
    p = base(4, "01 / 项目背景及思路", "工作量大，难点在于反复计算与复核")
    p += f'{text(56, 160, "以西藏金龙等矿山项目的典型工作场景为例", 22, YELLOW, "bold")}'
    steps = [("现场资料", BLUE), ("翻规范取值", CYAN), ("多公式计算", YELLOW), ("自制Excel", ORANGE), ("编制计算书", BLUE)]
    x = 56
    for idx, (label, color) in enumerate(steps):
        p += rect(x, 220, 198, 74, PANEL, color, 2, 5) + text(x + 20, 265, label, 23, TEXT, "bold")
        if idx < len(steps) - 1:
            p += line(x + 198, 257, x + 222, 257, color, 3)
        x += 234
    cards = [(56, "点位多", "同一工程要反复处理多个部位、多个点位", BLUE), (350, "公式多", "RQD、BQ、Q、RMR等方法并行计算", CYAN), (644, "判断主观", "参数取值、采用口径需要工程经验", YELLOW), (938, "复核困难", "很难快速回到某个结果的依据和过程", ORANGE)]
    for x, head, body, color in cards:
        p += rect(x, 360, 250, 170, PANEL, LINE, 1, 5) + rect(x, 360, 250, 8, color) + text(x + 20, 408, head, 26, color, "bold") + multiline(x + 20, 450, [body[:12], body[12:]], 20, TEXT, 31)
    p += rect(56, 580, 1168, 48, PANEL2, None, rx=4) + text(78, 612, "问题落点：查表、计算、记录、编书和复核分散在多个工具里，信息容易重复转抄。", 22, TEXT, "bold")
    p += end()
    write_svg("04_background_pain.svg", p)
    note("04_background_pain.md", "以西藏金龙等矿山项目的典型工作场景为例，岩体分级不是做一次公式，而是对多个部位、多个点位反复录入和计算。参数要翻规范，同一工程要并行做多种方法，现场判断存在主观性，最后还要把过程整理进计算书。点位越多，计算量越大；复核时又很难快速追溯某个结果的依据。现行工作常常是翻公式、做Excel、再把结果整理进报告。下一页说明我们的解决思路。")

    # P5 overall solution
    p = base(5, "01 / 项目背景及思路", "解决思路：把岩体分级做成一条工作流")
    p += f'{text(56, 168, "软件把工程、点位、参数、规则、依据和成果放进同一个闭环。", 28, TEXT, "bold")}'
    lane = [("工程 / 点位", BLUE), ("参数录入", CYAN), ("六方法计算", YELLOW), ("依据留痕", ORANGE), ("报告输出", BLUE)]
    x = 56
    for idx, (label, color) in enumerate(lane):
        p += circle(x + 58, 312, 38, color) + text(x + 58, 321, str(idx + 1), 24, BG, "bold", "middle", "Arial") + text(x + 58, 388, label, 23, TEXT, "bold", "middle")
        if idx < len(lane) - 1:
            p += line(x + 96, 312, x + 208, 312, color, 4)
        x += 244
    p += rect(56, 450, 724, 142, PANEL, LINE, 1, 5) + text(82, 492, "工程师最终得到", 22, CYAN, "bold") + multiline(82, 536, ["可计算的参数", "可回看的依据", "可交付的计算书"], 24, TEXT, 34)
    p += rect(820, 450, 404, 142, PANEL2, None, rx=5) + text(848, 492, "本地经验知识助手", 24, YELLOW, "bold") + multiline(848, 536, ["解释方法选择、参数含义", "和取值依据；最终采用值", "仍由工程师确认"], 20, TEXT, 30)
    p += end()
    write_svg("05_solution.svg", p)
    note("05_solution.md", "软件解决的是一条完整工作流：输入工程和点位，选择方法并完成计算，保留原始参数与采用值，记录标准和依据，最后生成可交付的计算书；在此基础上接入本地经验知识助手，帮助工程师查找取值依据。")

    # P6 section 2
    write_svg("06_section_innovation.svg", section(6, 2, "创新点及相关内容", "从公式集合走向可追溯与本地智能辅助", CYAN))
    note("06_section_innovation.md", "第二部分按四个层次展开：先把公式集合起来，再把过程和依据留住，然后接入本地模型，最后讨论图像辅助判识这一项研发方向。")

    # P7 formula collection
    p = base(7, "02 / 创新点及相关内容", "一站式公式集合：多方法并行计算")
    p += text(56, 162, "把常用岩体质量分级方法放进同一工程和点位模型。", 24, TEXT, "bold")
    methods = [("RQD", BLUE), ("BQ", CYAN), ("Q", YELLOW), ("RMR", ORANGE), ("MRMR", BLUE), ("GSI", CYAN)]
    x = 56
    for label, color in methods:
        p += rect(x, 214, 170, 64, color, None, rx=5) + text(x + 85, 255, label, 28, BG, "bold", "middle", "Arial")
        x += 190
    p += rect(56, 330, 1168, 210, PANEL, LINE, 1, 5)
    p += text(84, 374, "统一工作入口", 24, CYAN, "bold") + text(84, 420, "工程 / 点位 / 参数输入", 24, TEXT, "bold")
    p += line(316, 407, 418, 407, BLUE, 3) + text(448, 374, "方法专用规则", 24, YELLOW, "bold") + multiline(448, 420, ["评分表、边界条件、", "适用限制和结果描述"], 22, TEXT, 34)
    p += line(704, 407, 806, 407, BLUE, 3) + text(836, 374, "结果与交付", 24, ORANGE, "bold") + multiline(836, 420, ["结果解释、依据记录、", "计算书输出"], 22, TEXT, 34)
    p += text(56, 600, "已实现基础：六类方法入口与专用计算规则；当前重点是统一工作流，避免重复翻表和重复录入。", 18, MUTED)
    p += end()
    write_svg("07_formula_collection.svg", p)
    note("07_formula_collection.md", "第一项创新是公式集合。目前软件覆盖RQD、BQ、Q、RMR、MRMR和GSI六类入口，输入、边界条件和结果在统一案例与点位中组织。这样做的价值不是把所有方法简化成同一个公式，而是让工程师在一个工程上下文里完成多方法计算，减少反复翻表和重复录入。")

    # P8 traceability
    p = base(8, "02 / 创新点及相关内容", "全过程溯源：让结果回到工程依据")
    p += text(56, 162, "复核时先看依据链，再看结果。", 24, TEXT, "bold")
    chain = [("工程", BLUE), ("部位 / 点位", CYAN), ("原始输入", YELLOW), ("采用值", ORANGE), ("标准版本", BLUE), ("计算书", CYAN)]
    x = 56
    for idx, (label, color) in enumerate(chain):
        p += rect(x, 250, 160, 86, PANEL, color, 2, 5) + text(x + 80, 302, label, 23, TEXT, "bold", "middle")
        if idx < len(chain) - 1:
            p += line(x + 160, 293, x + 190, 293, color, 3)
        x += 194
    p += rect(56, 400, 550, 160, PANEL2, None, rx=5) + text(82, 442, "点位记录保留", 24, CYAN, "bold") + multiline(82, 486, ["methodId / standardId", "inputVersion / 原始参数", "采用口径与工程备注"], 22, TEXT, 32, family="Consolas")
    p += rect(660, 400, 564, 160, PANEL, LINE, 1, 5) + text(688, 442, "复核价值", 24, YELLOW, "bold") + multiline(688, 486, ["结果能对应到工程、部位和点位", "参数与采用值分开记录", "报告输出沿用同一份工程记录"], 22, TEXT, 32)
    p += text(56, 615, "边界：当前版本字段用于兼容性校验，历史算法原样重放仍需继续完善。", 18, WARN)
    p += end()
    write_svg("08_traceability.svg", p)
    note("08_traceability.md", "第二项创新是全过程溯源。每个结果都能回到工程、部位、点位、原始输入、采用值和所用标准，最后落到计算书。复核时先看依据链，再看结果。这里要把边界说清楚：当前版本字段用于兼容性校验，历史算法原样重放还需要继续完善，因此不能把版本记录说成已经具备不可变审计链。")

    # P9 local model
    p = base(9, "02 / 创新点及相关内容", "本地经验知识助手：重点是依据解释")
    p += rect(56, 150, 130, 40, ORANGE, None, rx=4) + text(121, 178, "重点方向", 20, BG, "bold", "middle")
    p += text(212, 178, "模型帮助工程师查依据，不替工程师做最终判断。", 24, TEXT, "bold")
    flow = [("当前点位\n上下文", BLUE), ("院内知识\n条目", CYAN), ("本机GGUF\n/ llama.cpp", YELLOW), ("依据解释\n与检索", ORANGE), ("工程师\n确认", BLUE)]
    x = 56
    for idx, (label, color) in enumerate(flow):
        p += rect(x, 260, 190, 100, PANEL, color, 2, 5) + multiline(x + 95, 302, label.split("\\n"), 21, TEXT, 30, "bold")
        if idx < len(flow) - 1:
            p += line(x + 190, 310, x + 220, 310, color, 3)
        x += 234
    p += rect(56, 420, 550, 146, PANEL2, None, rx=5) + text(82, 464, "预期服务范围", 23, CYAN, "bold") + multiline(82, 508, ["方法选择、参数含义、取值依据", "例如：某围岩条件下 SRF 取值依据"], 21, TEXT, 34)
    p += rect(660, 420, 564, 146, PANEL, LINE, 1, 5) + text(688, 464, "当前成熟度", 23, YELLOW, "bold") + multiline(688, 508, ["调用链已具备；GGUF模型部署和知识质量待实测", "知识注入为文本片段，不等于向量检索或模型训练"], 20, TEXT, 30)
    p += text(56, 615, "本机推理不等于整个软件绝不联网；更新路径和正式授权仍按交付环境核验。", 18, WARN)
    p += end()
    write_svg("09_local_model.svg", p)
    note("09_local_model.md", "第三项创新是本地经验知识助手，这一项是本次汇报的重点。当前后端已经有本机GGUF模型和llama.cpp的调用链，能够读取本机的知识文本，并把当前页面快照和对话上下文注入提示词。它预期服务于方法选择、参数含义和取值依据解释，例如回答某围岩条件下SRF的取值依据，但最终采用值仍由工程师确认。正式应用前需要补一次真实问答截图，同时记录模型名称、知识版本和上下文。当前工作区没有可直接验收的GGUF模型，知识注入也属于文本片段拼接，不等于向量检索。")

    # P10 image assistant
    p = base(10, "02 / 创新点及相关内容", "图像辅助判识：从 RQD 候选值建议切入")
    p += rect(56, 150, 134, 40, WARN, None, rx=4) + text(123, 178, "研发中", 20, BG, "bold", "middle")
    p += text(216, 178, "先做辅助建议，再由工程师确认后进入计算。", 24, TEXT, "bold")
    stages = [("拍摄掌子面\n或岩芯", BLUE), ("识别结构面\n与块体特征", CYAN), ("给出RQD\n候选值", YELLOW), ("工程师确认\n并留痕", ORANGE)]
    x = 56
    for idx, (label, color) in enumerate(stages):
        p += circle(x + 80, 320, 50, PANEL, color, 3) + text(x + 80, 315, str(idx + 1), 28, color, "bold", "middle", "Arial") + multiline(x + 80, 418, label.split("\\n"), 22, TEXT, 32, "bold", None)
        if idx < len(stages) - 1:
            p += line(x + 130, 320, x + 250, 320, color, 3)
        x += 292
    p += rect(56, 520, 1168, 74, PANEL2, None, rx=4) + text(82, 552, "下一步工作：样本标注 → 独立验证 → 现场校准。单张图像不能替代强度、水和应力等专项资料。", 21, TEXT, "bold")
    p += text(56, 628, "当前没有图像上传和视觉模型处理链路；本页是研发路线示意，不是识别结果。", 18, WARN)
    p += end()
    write_svg("10_image_assistant.svg", p)
    note("10_image_assistant.md", "第四项是图像辅助判识，当前定位为研发中。RQD比较适合作为切入点：拍摄掌子面或岩芯，识别结构面和块体特征，给出RQD候选值，工程师确认后再进入计算并保留来源。这里不把假图当成识别结果，也不把单张照片当成完整分级依据。下一步需要样本标注、独立验证和现场校准，强度、水和应力等资料仍需专项获取。")

    # P11 section 3
    write_svg("11_section_application.svg", section(11, 3, "应用及经济社会效益", "从真实界面与成果交付走向院内试点", ORANGE))
    note("11_section_application.md", "第三部分展示当前真实运行界面和成果输出，并把应用收益写成可执行的试点评价口径，不先编造效率百分比。")

    # P12 UI and report
    p = base(12, "03 / 应用及经济社会效益", "软件界面与成果输出")
    p += text(56, 158, "工程师从案例和点位开始，完成多方法计算，查看依据链，输出计算书。", 23, TEXT, "bold")
    p += rect(56, 204, 720, 405, PANEL, LINE, 1, 5) + image("../images/01-rmr-calculation.png", 70, 218, 692, 389)
    p += text(70, 632, "RMR计算界面：当前截图为虚构演示输入", 17, MUTED)
    p += rect(824, 204, 400, 224, PANEL, LINE, 1, 5) + image("../images/03-engineering-overview.png", 840, 218, 368, 207)
    p += text(840, 450, "工程总览与点位汇总", 18, MUTED)
    p += rect(824, 480, 400, 129, PANEL2, None, rx=5) + text(848, 520, "成果交付", 22, CYAN, "bold") + multiline(848, 554, ["本地项目文件 + Word计算书", "导出界面已实际运行；分页效果待核验"], 19, TEXT, 29)
    p += end()
    write_svg("12_software_report.svg", p)
    note("12_software_report.md", "在应用上，工程师从案例和点位开始，完成多方法计算，查看依据链，输出计算书。当前界面和导出流程已经具备，画面展示的是实际运行界面，但输入均为虚构演示数据。正式汇报前可以用真实工程截图替换；导出的Word计算书还需要在Word或WPS中核对分页后再放入正式材料。")

    # P13 value and promotion
    p = base(13, "03 / 应用及经济社会效益", "应用价值与推广路径")
    benefits = [("计算与编书", "把查表、计算、整理和交付放进同一流程", BLUE), ("复核依据", "工程、点位、原始输入与采用值可对应查询", CYAN), ("经验沉淀", "把专家审核过的取值依据整理成院内资料", YELLOW)]
    y = 180
    for head, body, color in benefits:
        p += rect(56, y, 520, 106, PANEL, color, 2, 5) + text(82, y + 40, head, 23, color, "bold") + text(240, y + 40, body, 20, TEXT) + line(82, y + 68, 540, y + 68, LINE, 1)
        y += 122
    p += text(700, 180, "推广路径（建议）", 23, ORANGE, "bold")
    stages = [("院内试点", BLUE), ("形成样板", CYAN), ("版本验收", YELLOW), ("院内外推广", ORANGE)]
    x = 700
    for idx, (label, color) in enumerate(stages):
        p += circle(x, 280, 32, color) + text(x, 289, str(idx + 1), 20, BG, "bold", "middle", "Arial") + text(x, 350, label, 18, TEXT, "bold", "middle")
        if idx < len(stages) - 1:
            p += line(x + 34, 280, x + 114, 280, color, 3)
        x += 132
    p += rect(700, 414, 494, 150, PANEL2, None, rx=5) + multiline(728, 454, ["矿山、隧道、边坡分别核对方法和工况", "多方法交叉核查仍需工程师解释", "收益按同一批点位、同一输出要求实测"], 20, TEXT, 34)
    p += text(56, 656, "当前采用定性价值与试点口径，不把预计收益写成已实现百分比。", 18, WARN)
    p += end()
    write_svg("13_application_value.svg", p)
    note("13_application_value.md", "应用收益先按试点口径测量：一是计算和编书耗时，二是复核依据完整率，三是专家审核知识条目数。当前没有真实基线，因此不直接写效率百分比。推广上建议先做院内试点，形成样板成果，再进行版本验收，最后推广到矿山、隧道和边坡等场景；每类工程仍需按具体工况核对方法。")

    # P14 summary and thanks
    p = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" '
        f'data-pptx-page-role="content" font-family="Microsoft YaHei, Arial">{rect(0,0,1280,720,BG)}'
        f'{polygon("0,0 350,0 250,720 0,720", PANEL)}{polygon("1000,720 1280,440 1280,720", ORANGE)}'
        f'{text(68, 108, "总结与下一步工作", 42, TEXT, "bold")}{line(68, 154, 176, 154, CYAN, 4)}'
        f'{text(68, 228, "已形成", 24, CYAN, "bold")}'
        f'{multiline(68, 274, ["六类方法入口与专用计算规则", "案例—点位管理、依据记录与Word输出", "本地部署与设备授权基础"], 23, TEXT, 38)}'
        f'{text(620, 228, "下一步", 24, YELLOW, "bold")}'
        f'{multiline(620, 274, ["补规范算例、真实工程和效率数据", "完成本地模型问答与知识质量验证", "建设RQD图像样本并开展独立验证"], 23, TEXT, 38)}'
        f'{line(68, 430, 1180, 430, LINE, 1)}{text(68, 488, "感谢各位专家指导", 40, TEXT, "bold")}'
        f'{text(68, 548, "长沙有色冶金设计研究院有限公司", 22, MUTED)}{text(68, 588, "汇报人：待补充　联系方式：待补充", 18, MUTED)}'
        f'{text(1200, 680, "14", 14, MUTED, family="Arial")}{end()}'
    )
    write_svg("14_summary_thanks.svg", p)
    note("14_summary_thanks.md", "最后总结一下：已经形成的是六类方法入口、案例和点位管理、依据记录、Word输出以及本地授权基础。下一步先补规范算例、真实工程和效率数据，再完成本地模型问答和知识质量验证，图像判识从RQD样本建设和独立验证开始。感谢各位专家指导，正式使用前请补入汇报人和联系方式。")

    total = []
    for path in sorted(NOTE_DIR.glob("*.md")):
        if path.name == "total.md":
            continue
        total.append(f"# {path.stem}\n\n{path.read_text(encoding='utf-8').strip()}\n")
    (NOTE_DIR / "total.md").write_text("\n---\n\n".join(total) + "\n", encoding="utf-8")

    # Keep the project-level reminder aligned with this revision.
    (ROOT / "待补素材与数据.md").write_text(
        """# 正式汇报前待补\n\n"
        "1. P1/P14：汇报人、联系方式，确认正式汇报日期。\n"
        "2. P9：完成本地模型部署后，保留一次真实问答截图，并记录模型名称、知识版本和上下文。\n"
        "3. P10：只有在样本标注、独立验证和现场校准完成后，才补RQD图像识别结果；当前页面仅为研发路线示意。\n"
        "4. P12：用Word或WPS打开已导出的演示计算书，确认分页后再替换真实页面截图。\n"
        "5. P13：提供一至两个脱敏工程的点位数、人工和软件工时、计算书页数及复核记录，用同口径形成试点数据。\n"
        "6. 规范算例：补规范或手册原文算例与页码；当前内部测试证据不能替代规范算例或现场验证。\n\n"
        "当前素材：真实软件功能截图、导出界面、真实原生DOCX与项目文件，均使用明确标识的虚构演示输入。\n""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
