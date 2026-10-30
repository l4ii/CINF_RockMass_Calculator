from __future__ import annotations

from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[3]
TEMPLATE = Path(r"C:\Users\0303003\Downloads\参考.pptx")
OUT_DIR = ROOT / "projects" / "rockmass_technology_report_20261026_final"
OUT = OUT_DIR / "presentation_zh.pptx"
SHOT_CALC = ROOT / "projects" / "rockmass_technology_report_20261026_reviewed" / "images" / "01-rmr-calculation.png"
SHOT_OVERVIEW = ROOT / "projects" / "rockmass_technology_report_20261026_reviewed" / "images" / "03-engineering-overview.png"

SW, SH = 13.333333, 7.5
FONT = "Microsoft YaHei"
INK = "242B33"
MUTED = "687581"
TEAL = "05A7D2"
ORANGE = "E86A2C"
PALE = "F3F7F8"
PALE_BLUE = "E9F5F8"
PALE_ORANGE = "FFF3EC"
RULE = "D7E0E3"
WHITE = "FFFFFF"


def rgb(value: str) -> RGBColor:
    return RGBColor.from_string(value)


def set_run(run, size: int, color: str = INK, bold: bool = False, font: str = FONT):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = rgb(color)
    rpr = run._r.get_or_add_rPr()
    rpr.set("{http://schemas.openxmlformats.org/drawingml/2006/main}ea", font)


def add_text(slide, text: str, x: float, y: float, w: float, h: float,
             size: int = 18, color: str = INK, bold: bool = False,
             align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP,
             margin: float = 0.04, font: str = FONT):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    for i, line in enumerate(text.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(0)
        p.space_before = Pt(0)
        run = p.add_run()
        run.text = line
        set_run(run, size, color, bold, font)
    return shape


def add_rect(slide, x: float, y: float, w: float, h: float,
             fill: str = WHITE, line: str | None = None, line_width: float = 1,
             dashed: bool = False):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = rgb(fill)
    if line:
        shape.line.color.rgb = rgb(line)
        shape.line.width = Pt(line_width)
        if dashed:
            from pptx.enum.dml import MSO_LINE_DASH_STYLE
            shape.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    else:
        shape.line.fill.background()
    return shape


def add_line(slide, x1: float, y1: float, x2: float, y2: float, color: str = RULE, width: float = 1.2):
    line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    line.line.color.rgb = rgb(color)
    line.line.width = Pt(width)
    return line


def add_placeholder(slide, x: float, y: float, w: float, h: float, title: str, detail: str = ""):
    add_rect(slide, x, y, w, h, PALE, TEAL, 1.3, dashed=True)
    add_text(slide, title, x + 0.16, y + h * 0.38 - 0.16, w - 0.32, 0.42,
             16, TEAL, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    if detail:
        add_text(slide, detail, x + 0.18, y + h * 0.52, w - 0.36, 0.55,
                 11, MUTED, False, PP_ALIGN.CENTER, MSO_ANCHOR.TOP)


def set_notes(slide, text: str):
    slide.notes_slide.notes_text_frame.text = text


def set_existing_text(shape, text: str, size: int | None = None, color: str | None = None, bold: bool | None = None):
    tf = shape.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    set_run(r, size or 32, color or INK, bool(bold))


def make_body_slide(prs, title: str, section: str, page: int, source: str):
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = rgb("FBFCFC")
    add_rect(slide, 0, 0, SW, 0.07, ORANGE)
    add_rect(slide, 0.68, 0.33, 0.08, 0.78, TEAL)
    add_text(slide, section.upper(), 0.9, 0.34, 6.5, 0.25, 10, TEAL, True)
    add_text(slide, title, 0.9, 0.62, 11.8, 0.62, 25, INK, True)
    add_line(slide, 0.72, 7.02, 12.62, 7.02, RULE, 0.8)
    add_text(slide, source, 0.75, 7.08, 10.9, 0.22, 9, MUTED)
    add_text(slide, f"{page:02d}", 12.0, 7.07, 0.55, 0.23, 10, TEAL, True, PP_ALIGN.RIGHT)
    return slide


def add_step(slide, x: float, y: float, w: float, label: str, detail: str = ""):
    add_rect(slide, x, y, w, 0.72, PALE_BLUE, "B9DCE5", 0.8)
    add_rect(slide, x, y, 0.07, 0.72, TEAL)
    add_text(slide, label, x + 0.16, y + 0.11, w - 0.25, 0.25, 15, INK, True)
    if detail:
        add_text(slide, detail, x + 0.16, y + 0.4, w - 0.25, 0.24, 10, MUTED)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    prs = Presentation(str(TEMPLATE))
    prs.slide_width = Inches(SW)
    prs.slide_height = Inches(SH)
    original = list(prs.slides)
    cover, agenda, divider_bg, divider_innovation, divider_application, ending = original

    # Update the existing template's editable cover text and agenda.
    for shape in cover.shapes:
        if getattr(shape, "has_text_frame", False) and shape.text.strip().startswith("铜冶炼"):
            shape.text_frame.clear()
            p = shape.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            r.text = "矿山岩体质量分级智能化系统\n研发与应用"
            set_run(r, 34, "252A30", True)
            shape.text_frame.word_wrap = True
            shape.text_frame.margin_left = Inches(0.04)
            shape.text_frame.margin_right = Inches(0.04)
        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            shape.left = max(0, shape.left)
            shape.top = max(0, shape.top)
            if shape.left + shape.width > prs.slide_width:
                shape.width = prs.slide_width - shape.left
            if shape.top + shape.height > prs.slide_height:
                shape.height = prs.slide_height - shape.top
        if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
            shape.top = max(0, shape.top)
            if shape.top + shape.height > prs.slide_height:
                shape.height = prs.slide_height - shape.top
        if shape.left + shape.width > prs.slide_width:
            shape.width = prs.slide_width - shape.left
    presenter = cover.shapes.add_textbox(Inches(5.35), Inches(6.05), Inches(6.8), Inches(0.56))
    presenter.text_frame.text = "完成单位：长沙有色冶金设计研究院有限公司\n汇报人：[姓名]    2026年10月"
    presenter.text_frame.margin_left = Inches(0.02)
    presenter.text_frame.margin_top = Inches(0.01)
    for p in presenter.text_frame.paragraphs:
        for r in p.runs:
            set_run(r, 12, "4F5962", False)
    set_notes(cover, "口述（约5秒）：各位专家、领导，大家好。我汇报的题目是《矿山岩体质量分级智能化系统研发与应用》。正式汇报前补入汇报人姓名。")

    agenda_items = {"项目背景及思路": "项目背景及思路", "创新点及相关内容": "核心创新点", "应用及经济社会效益": "应用效益与推广"}
    for shape in agenda.shapes:
        if getattr(shape, "has_text_frame", False):
            key = shape.text.strip()
            if key in agenda_items:
                shape.text_frame.clear()
                p = shape.text_frame.paragraphs[0]
                r = p.add_run()
                r.text = agenda_items[key]
                set_run(r, 24, "222222", False)
    # Remove decorative shapes that intentionally bleed beyond the page edge.
    for shape in list(agenda.shapes):
        if shape.left < 0 or shape.top < 0 or shape.left + shape.width > prs.slide_width or shape.top + shape.height > prs.slide_height:
            if not (getattr(shape, "has_text_frame", False) and shape.text.strip()):
                shape._element.getparent().remove(shape._element)
            else:
                shape.left = max(0, shape.left)
                shape.top = max(0, shape.top)
                if shape.left + shape.width > prs.slide_width:
                    shape.width = prs.slide_width - shape.left
                if shape.top + shape.height > prs.slide_height:
                    shape.height = prs.slide_height - shape.top
    set_notes(agenda, "口述（约5秒）：本次汇报分为三部分：项目背景及思路、核心创新点、应用效益与推广。")

    # Keep the template chapter pages, correcting their bounds and labels.
    for shape in divider_bg.shapes:
        if getattr(shape, "has_text_frame", False) and shape.text.strip() == "项目背景及思路":
            set_existing_text(shape, "项目背景及思路", 40, WHITE, True)
    for shape in divider_innovation.shapes:
        if getattr(shape, "has_text_frame", False) and "创新点" in shape.text:
            set_existing_text(shape, "核心创新点", 40, WHITE, True)
    for shape in divider_application.shapes:
        if getattr(shape, "has_text_frame", False) and "应用" in shape.text:
            set_existing_text(shape, "应用效益与推广", 38, WHITE, True)
    for slide, note in ((divider_bg, "章节过渡（约2秒）：先看工程现场的问题。"),
                        (divider_innovation, "章节过渡（约2秒）：下面介绍两项核心创新。"),
                        (divider_application, "章节过渡（约2秒）：最后汇报应用效益与产品化路径。")):
        set_notes(slide, note)
    for shape in ending.shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            if shape.left < 0:
                shape.left = 0
            if shape.width + shape.left > prs.slide_width:
                shape.width = prs.slide_width - shape.left
            if shape.top + shape.height > prs.slide_height:
                shape.height = prs.slide_height - shape.top
        if getattr(shape, "has_text_frame", False) and shape.text.strip():
            shape.text_frame.clear()
            p = shape.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            r = p.add_run()
            r.text = "感谢各位领导、专家聆听，恳请批评指正"
            set_run(r, 34, WHITE, True)
    set_notes(ending, "口述（约5秒）：我的汇报完毕，感谢各位领导、专家聆听，恳请批评指正。")

    # Clip intentional template bleed to the slide canvas for strict structural QA.
    for slide in (divider_bg, divider_innovation, divider_application):
        for shape in slide.shapes:
            if shape.left < 0:
                shape.width = max(0, shape.width + shape.left)
                shape.left = 0
            if shape.top < 0:
                shape.height = max(0, shape.height + shape.top)
                shape.top = 0
            if shape.left + shape.width > prs.slide_width:
                shape.width = prs.slide_width - shape.left
            if shape.top + shape.height > prs.slide_height:
                shape.height = prs.slide_height - shape.top

    # Slide 4: project workload and workflow.
    s_problem = make_body_slide(
        prs,
        "多部位、多点位分级，工作量集中在重复整理与复核",
        "01 项目背景及思路", 4,
        "来源：项目方提供的西藏金龙项目统计口径；方括号数据待脱敏核实。",
    )
    metrics = [
        (0.85, "[工程部位数]", "个工程部位"),
        (3.92, "[点位总数]", "个测点/编录点"),
        (6.99, "[方法数]", "类评价方法"),
        (10.06, "[成果组数]", "组点位成果"),
    ]
    for x, value, label in metrics:
        add_text(s_problem, value, x, 1.62, 2.35, 0.55, 25, TEAL, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        add_text(s_problem, label, x, 2.15, 2.35, 0.32, 13, MUTED, False, PP_ALIGN.CENTER)
        add_line(s_problem, x + 0.24, 2.57, x + 2.11, 2.57, RULE, 1)
    add_text(s_problem, "常规作业流程", 0.88, 2.91, 2.1, 0.35, 15, INK, True)
    labels = ["地质编录", "指标取值", "规范查表 / Excel", "逐点分级", "报告与复核"]
    x0, gap, bw = 0.88, 0.16, 2.22
    for i, label in enumerate(labels):
        x = x0 + i * (bw + gap)
        add_rect(s_problem, x, 3.43, bw, 0.78, PALE_BLUE if i < 4 else PALE_ORANGE,
                 "B9DCE5" if i < 4 else "F1C8AD", 0.8)
        add_text(s_problem, label, x + 0.05, 3.63, bw - 0.1, 0.3, 14, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        if i < len(labels) - 1:
            add_text(s_problem, "→", x + bw, 3.63, gap, 0.3, 16, ORANGE, True, PP_ALIGN.CENTER)
    add_text(s_problem, "主要难点", 0.88, 4.69, 1.7, 0.32, 15, ORANGE, True)
    add_text(s_problem, "重复录入  ·  多方法口径分散  ·  参数依据难追  ·  校审需跨表核对",
             2.55, 4.68, 9.7, 0.42, 17, INK, False, valign=MSO_ANCHOR.MIDDLE)
    add_text(s_problem, "金龙项目：以上数据直接与页面图表一致；口述只强调点位规模和成果数量。",
             0.88, 5.54, 11.4, 0.32, 12, MUTED)
    set_notes(s_problem, "口述（约25秒）：以西藏金龙矿山项目为例，本次纳入统计的工作涉及[工程部位数]个工程部位、[点位总数]个点位，采用[方法数]类评价方法，形成[成果组数]组点位成果。常规流程要从地质编录和指标取值开始，分别查规范、用Excel计算，再汇总报告。工作量不仅是公式计算，也包括重复录入和跨表复核。正式汇报时只读页面上的核心数字，不展开全部统计口径。")

    # Slide 5: overall software solution with a real demo screenshot.
    s_solution = make_body_slide(
        prs,
        "以点位为核心，连接分级计算工作流与智能体能力",
        "01 项目背景及思路", 5,
        "来源：软件界面为仓库现有运行截图，点位数据为虚构演示输入。",
    )
    stages = [
        (0.85, "工程与点位", "建立工程位置和编录点"),
        (2.78, "参数与资料", "记录原始输入和采用值"),
        (4.71, "规则计算", "执行选定分级方法"),
    ]
    for x, head, sub in stages:
        add_step(s_solution, x, 1.75, 1.68, head, sub)
    add_text(s_solution, "→", 2.49, 1.96, 0.27, 0.25, 17, ORANGE, True, PP_ALIGN.CENTER)
    add_text(s_solution, "→", 4.42, 1.96, 0.27, 0.25, 17, ORANGE, True, PP_ALIGN.CENTER)
    add_text(s_solution, "依据留痕  →  计算书输出", 0.87, 2.72, 5.45, 0.42, 18, INK, True)
    add_text(s_solution, "本地智能体接入：专业知识问答 · 点位上下文分析 · 视觉识别",
             0.87, 3.3, 5.35, 0.55, 15, TEAL, True)
    add_text(s_solution, "固定规则负责参数校验与确定性计算；智能体面向具体工程任务提供知识和图像分析。",
             0.87, 4.06, 5.4, 0.7, 14, MUTED)
    s_solution.shapes.add_picture(str(SHOT_CALC), Inches(6.75), Inches(1.65), width=Inches(5.72), height=Inches(3.22))
    add_text(s_solution, "软件计算界面（虚构演示点位）", 6.75, 4.94, 5.72, 0.3, 11, MUTED, False, PP_ALIGN.RIGHT)
    add_text(s_solution, "工程 / 部位 / 点位 / 原始参数 / 采用口径 / 方法与标准 / 结果 / 成果文件",
             0.87, 5.65, 11.5, 0.4, 14, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    set_notes(s_solution, "口述（约20秒）：我们的解决思路是把工程、点位、参数、规则和成果组织到同一工作流。规则引擎负责多方法确定性计算；智能体围绕工程师当前任务，调用知识和视觉能力，形成解释或候选建议。相关记录再进入点位成果和计算书。右侧截图是虚构演示输入，不是金龙项目成果。")

    # Slide 7: the agent harness as a task runtime and orchestration layer.
    s_harness = make_body_slide(
        prs,
        "创新点一：面向工程点位的智能体运行与协同框架",
        "02 核心创新点", 7,
        "来源：项目方提供的智能体设计说明；本地模型调用与上下文实现见 backend/assistant_api.py。",
    )
    add_text(s_harness, "架构示意 · 运行演示待补", 9.72, 0.37, 2.57, 0.25, 10, ORANGE, True, PP_ALIGN.RIGHT)
    add_text(s_harness, "任务上下文", 0.85, 1.63, 2.0, 0.3, 13, TEAL, True)
    add_text(s_harness, "工程 · 部位 · 点位 · 方法 · 已录参数", 0.85, 1.98, 4.85, 0.45, 17, INK, True)
    add_line(s_harness, 0.85, 2.52, 5.65, 2.52, RULE, 1)
    add_text(s_harness, "智能体运行与协同层", 0.85, 2.72, 4.9, 0.34, 13, TEAL, True)
    add_text(s_harness, "上下文组织  →  能力调度  →  输出约束", 0.85, 3.08, 5.1, 0.43, 17, INK, True)
    add_line(s_harness, 0.85, 3.62, 5.65, 3.62, RULE, 1)
    add_text(s_harness, "专业能力", 0.85, 3.82, 1.6, 0.31, 13, TEAL, True)
    add_text(s_harness, "规范与院内经验知识库  ·  点位上下文分析  ·  视觉识别工具",
             0.85, 4.18, 5.15, 0.74, 15, INK)
    add_rect(s_harness, 0.85, 5.13, 5.05, 0.72, PALE_ORANGE, "F1C8AD", 0.8)
    add_text(s_harness, "智能建议经工程师审核后进入点位成果", 1.05, 5.34, 4.65, 0.3, 14, INK, True, PP_ALIGN.CENTER)
    add_placeholder(s_harness, 6.45, 1.63, 5.92, 4.16, "粘贴智能体运行截图", "知识问答 / 当前点位上下文 / 引用依据")
    add_text(s_harness, "计算公式由规则引擎执行；智能体负责理解任务、组织知识与工具调用、解释结果。",
             0.86, 6.13, 11.45, 0.43, 14, MUTED, True)
    set_notes(s_harness, "口述（约60秒）：第一项创新是面向点位任务的智能体运行与协同框架。智能体获得当前工程、部位、点位、方法和参数上下文，再结合规范与院内专家经验知识，对方法、参数和取值依据进行检索解释；需要时调用相应分析能力，返回带依据的解释或参数建议。固定校验与分级计算仍由规则引擎执行，最终由工程师确认。右侧补真实运行截图，最好展示当前点位上下文、知识依据和结果如何关联。仓库已经具备本地模型调用及文本知识/页面上下文注入基础；正式对外前应以可复查演示确认工具调度与结果回写范围。")

    # Slide 8: multimodal visual pathway, leaving real evidence slots.
    s_vision = make_body_slide(
        prs,
        "创新点二：多模态视觉分析融入岩体评价流程",
        "02 核心创新点", 8,
        "来源：项目方提供的目标能力描述；仓库未验证完整视觉链路，实测素材待补。",
    )
    add_text(s_vision, "流程示意 · 识别结果待实测", 9.72, 0.37, 2.57, 0.25, 10, ORANGE, True, PP_ALIGN.RIGHT)
    add_placeholder(s_vision, 0.88, 1.68, 4.15, 2.52, "粘贴现场图像", "使用实际采集的工程图像")
    add_text(s_vision, "→", 5.15, 2.67, 0.55, 0.4, 24, ORANGE, True, PP_ALIGN.CENTER)
    add_rect(s_vision, 5.9, 1.98, 1.58, 1.86, PALE_BLUE, "B9DCE5", 0.9)
    add_text(s_vision, "视觉分析\n特征与依据", 6.02, 2.47, 1.34, 0.8, 16, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    add_text(s_vision, "→", 7.62, 2.67, 0.55, 0.4, 24, ORANGE, True, PP_ALIGN.CENTER)
    add_placeholder(s_vision, 8.35, 1.68, 4.08, 2.52, "粘贴识别结果", "候选参数、特征依据或智能体解释")
    add_text(s_vision, "图像输入", 0.88, 4.4, 4.15, 0.3, 13, MUTED, False, PP_ALIGN.CENTER)
    add_text(s_vision, "工程师确认", 5.72, 4.4, 1.95, 0.3, 13, ORANGE, True, PP_ALIGN.CENTER)
    add_text(s_vision, "点位记录与分级计算", 8.35, 4.4, 4.08, 0.3, 13, MUTED, False, PP_ALIGN.CENTER)
    add_line(s_vision, 0.88, 5.18, 12.43, 5.18, RULE, 1)
    add_text(s_vision, "图像识别为参数判断提供现场信息和可核对依据；最终采用值由工程师结合工程条件确认。",
             0.91, 5.52, 11.45, 0.54, 16, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    set_notes(s_vision, "口述（约45秒）：第二项创新是将视觉感知纳入岩体质量分级。图像不止生成一个孤立标签，而是与当前工程和点位关联，形成可供工程师核对的识别特征和参数候选，再进入分级计算和成果记录。请用真实采集图像、真实识别界面和可解释依据替换两个预留框，不填虚构准确率或未经验证的工程结论。")

    # Slide 9: reserve software copyright evidence.
    s_ip1 = make_body_slide(
        prs,
        "知识产权成果（一）：软件著作权",
        "03 知识产权与成果", 9,
        "展示模板：请仅放入已取得的证书或正式受理文件，并按实际状态标注。",
    )
    add_placeholder(s_ip1, 0.98, 1.62, 4.7, 3.98, "粘贴软件著作权证书", "扫描件或清晰照片；保持证书信息完整")
    add_placeholder(s_ip1, 7.65, 1.62, 4.7, 3.98, "粘贴软件著作权证书", "可展示第二项核心软件登记成果")
    add_text(s_ip1, "软件名称：[待填]     登记号：[待填]     权利人：[待填]     登记日期：[待填]",
             0.98, 5.88, 11.35, 0.35, 12, INK, True, PP_ALIGN.CENTER)
    add_text(s_ip1, "无已登记成果时，删除对应证书框；不得以产品截图代替证书。",
             0.98, 6.35, 11.35, 0.28, 11, MUTED, False, PP_ALIGN.CENTER)
    set_notes(s_ip1, "备查展示页（约3秒）：此页预留软件著作权证书。正式汇报前填入真实软件名称、登记号、权利人及日期；没有取得的登记成果不要展示为已授权。")

    # Slide 10: reserve patent evidence.
    s_ip2 = make_body_slide(
        prs,
        "知识产权成果（二）：专利与技术成果",
        "03 知识产权与成果", 10,
        "展示模板：专利状态与成果名称由项目方提供正式材料后填写。",
    )
    add_placeholder(s_ip2, 0.98, 1.62, 4.7, 3.98, "粘贴专利证书或受理文件", "明确标注发明 / 实用新型及授权 / 受理状态")
    add_placeholder(s_ip2, 7.65, 1.62, 4.7, 3.98, "粘贴专利或成果证明", "可替换为第二项专利或正式成果材料")
    add_text(s_ip2, "成果名称：[待填]     专利号/申请号：[待填]     状态：[待填]     完成人：[待填]",
             0.98, 5.88, 11.35, 0.35, 12, INK, True, PP_ALIGN.CENTER)
    add_text(s_ip2, "如当前尚未取得授权，可标注“申请中/受理中”，勿表述为已授权专利。",
             0.98, 6.35, 11.35, 0.28, 11, MUTED, False, PP_ALIGN.CENTER)
    set_notes(s_ip2, "备查展示页（约3秒）：此页预留专利或正式技术成果证明。应按实际法律状态填写，区分已授权与申请/受理中；没有对应材料时删除本页或空框。")

    # Slide 12: application benefits measured with matching baselines.
    s_benefit = make_body_slide(
        prs,
        "应用效益：用同口径工时与复核指标验证",
        "04 应用效益与推广", 12,
        "来源：项目方金龙工程统计待补；工时和完整率均为待填实测数据。",
    )
    add_text(s_benefit, "计算与成果编制工时", 0.92, 1.58, 4.1, 0.35, 14, TEAL, True)
    add_text(s_benefit, "人工方式", 0.92, 2.03, 1.45, 0.27, 12, MUTED, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "[人工总工时] 小时", 0.92, 2.35, 3.4, 0.5, 21, INK, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "→", 4.35, 2.38, 0.55, 0.35, 21, ORANGE, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "软件方式", 5.0, 2.03, 1.45, 0.27, 12, MUTED, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "[软件总工时] 小时", 5.0, 2.35, 3.35, 0.5, 21, INK, True, PP_ALIGN.CENTER)
    add_rect(s_benefit, 0.92, 3.05, 7.38, 0.85, PALE_ORANGE, "F1C8AD", 0.8)
    add_text(s_benefit, "节省 [节省工时] 小时  ·  工时下降 [实测比例]%  ·  年化人力价值 [金额] 万元",
             1.12, 3.32, 6.98, 0.34, 15, INK, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "复核与知识沉淀", 9.0, 1.58, 3.1, 0.35, 14, TEAL, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "依据完整率\n[百分比]%", 8.85, 2.16, 3.55, 0.86, 20, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    add_text(s_benefit, "经审核知识条目\n[条目数] 条", 8.85, 3.22, 3.55, 0.86, 17, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    add_line(s_benefit, 0.92, 4.43, 12.38, 4.43, RULE, 1)
    add_text(s_benefit, "同批点位 · 同一评价方法 · 同一成果要求", 0.92, 4.78, 11.35, 0.42, 18, INK, True, PP_ALIGN.CENTER)
    add_text(s_benefit, "依据完整率 = 可回溯原始输入、采用值、方法和标准依据的抽检点位数 ÷ 抽检点位总数",
             1.05, 5.4, 11.05, 0.42, 12, MUTED, False, PP_ALIGN.CENTER)
    set_notes(s_benefit, "口述（约40秒）：应用效益分三方面。时间方面，金龙项目人工完成全部点位分级和编书用时[人工总工时]小时，软件后为[软件总工时]小时，减少[节省工时]小时。须按同一批点位、同一方法和同一成果要求对比。复核方面，点位原始资料、采用参数、方法和标准依据可以关联查询；按页面公式抽查依据完整率。知识方面，统计经专家审核的知识条目，逐步沉淀院内经验。没有实测数据时，不报告效率百分比或现金节约额。")

    # Slide 13: application areas and proposed commercial model.
    s_market = make_body_slide(
        prs,
        "应用场景与产品化：以院内示范带动专业软件推广",
        "04 应用效益与推广", 13,
        "来源：约1.5亿元场景规模及价格模式为项目方提供的内部测算，需核验口径并履行审批。",
    )
    add_text(s_market, "应用场景", 0.88, 1.52, 2.0, 0.32, 14, TEAL, True)
    add_text(s_market, "院内矿山项目", 0.88, 1.91, 2.15, 0.3, 14, MUTED, True)
    add_text(s_market, "约 1.5 亿元", 0.88, 2.27, 3.2, 0.61, 27, ORANGE, True)
    add_text(s_market, "项目合同额场景基础\n（统计口径 / 截至日期待核实）", 0.88, 2.9, 3.5, 0.57, 11, MUTED)
    add_line(s_market, 4.45, 1.58, 4.45, 4.25, RULE, 1)
    add_text(s_market, "可拓展领域", 4.85, 1.52, 2.0, 0.32, 14, TEAL, True)
    add_text(s_market, "矿山  ·  交通隧道  ·  地下工程  ·  边坡",
             4.85, 1.95, 7.45, 0.42, 17, INK, True)
    add_text(s_market, "具体方法和适用条件按工程类型与现行标准核验。",
             4.85, 2.48, 7.3, 0.35, 12, MUTED)
    add_line(s_market, 4.85, 3.0, 12.35, 3.0, RULE, 1)
    add_text(s_market, "拟定产品价格", 4.85, 3.22, 2.2, 0.32, 14, TEAL, True)
    add_text(s_market, "基础软件 50 万元/套   +   AI 智能体 50 万元/套",
             4.85, 3.63, 7.45, 0.4, 17, INK, True)
    add_text(s_market, "完整配置 100 万元/套  ·  首年免维护  ·  次年起维护费为授权总额的10%（10万元/套·年）",
             4.85, 4.12, 7.55, 0.48, 13, INK, False)
    add_rect(s_market, 0.88, 4.82, 11.55, 0.85, PALE_BLUE, "B9DCE5", 0.8)
    add_text(s_market, "首年 [销售套数] 套  →  授权收入约 [金额] 万元     |     AI智能体前期研发投入约 [金额] 万元",
             1.1, 5.09, 11.1, 0.34, 15, INK, True, PP_ALIGN.CENTER)
    add_text(s_market, "专业知识与工程经验持续沉淀，推动工程设计数字化和人工智能专业化应用。",
             0.9, 6.05, 11.45, 0.39, 14, MUTED, True, PP_ALIGN.CENTER)
    set_notes(s_market, "口述（约55秒）：应用可先从长沙院现有矿山项目切入，相关合同额约1.5亿元，作为院内示范场景基础；后续可拓展至交通隧道、地下工程和边坡，具体方法需按工程条件核验。商业模式拟为基础软件50万元/套、AI智能体50万元/套，完整配置100万元/套；首年免维护，第二年起按授权额10%收取，即10万元/套·年。按首年销售[销售套数]套估算授权收入[金额]万元，AI前期研发投入[金额]万元。合同额只是应用场景规模，不是软件销售收入；价格是拟定方案，净收益还须扣除交付、售后和维护成本。项目通过专业知识和工程经验沉淀，服务设计数字化升级和AI专业化应用。")

    # Reorder the retained template chapter slides with new editable content pages.
    ids = list(prs.slides._sldIdLst)
    ordered = [ids[0], ids[1], ids[2], ids[6], ids[7], ids[3], ids[8], ids[9], ids[10], ids[11], ids[4], ids[12], ids[13], ids[5]]
    sld_list = prs.slides._sldIdLst
    for node in list(sld_list):
        sld_list.remove(node)
    for node in ordered:
        sld_list.append(node)

    # Provide source notes for all result and IP slides; all visible content stays editable.
    prs.save(str(OUT))
    # The reference template contains one unused Windows Media Photo part.
    temp_out = OUT.with_suffix(".clean.pptx")
    with ZipFile(OUT, "r") as zin, ZipFile(temp_out, "w", ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "ppt/media/image7.wdp":
                continue
            data = zin.read(item.filename)
            if item.filename == "ppt/slides/_rels/slide1.xml.rels":
                rel_root = ET.fromstring(data)
                for rel in list(rel_root):
                    if rel.attrib.get("Target") == "../media/image7.wdp":
                        rel_root.remove(rel)
                data = ET.tostring(rel_root, encoding="UTF-8", xml_declaration=True)
            zout.writestr(item, data)
    temp_out.replace(OUT)

    qa = OUT_DIR / "qa_report.md"
    qa.write_text(
        """# QA report
- Source sufficiency: notes-only
- Output: presentation_zh.pptx
- Slide count / dimensions: 14 / 16:9 (13.333 × 7.5 in)

## content QA
- Status: pass with explicit placeholders
- Evidence and limitations: Narrative follows the user-provided five-minute outline and the attached six-page template. Current software screenshots come from the workspace and are labeled as virtual/demo input. Project point counts, time savings, traceability rates, IP records, first-year unit sales, and AI development investment remain placeholders. The approximately CNY 150 million mining-project contract value and proposed CNY 500,000 + CNY 500,000 pricing model are project-provided inputs, not independently audited. Contract value is explicitly described as application-scenario basis, not software revenue.
- Source sufficiency is notes-only because no formal project report, financial record, IP certificates, or real engineering result images were supplied.

## structural QA
- Status: pending final inspector
- Reopen, media, notes, sources, bounds: Inspect with the paper2ppt packaged inspector after generation. Result slides contain source labels and speaker notes. Main content is PowerPoint text/shapes; screenshots and template backgrounds remain image objects.

## visual QA
- Status: unavailable
- Renderer and inspected previews: Preflight found no LibreOffice/soffice renderer and no PowerPoint executable in standard Office locations. Visual QA is unavailable; generated layout has not been rendered from the final PPTX.

## Unresolved issues
- Slide 4 / content / impact: replace engineering workload placeholders with an approved project count.
- Slide 7–8 / content / maturity: add real agent and visual-recognition screenshots; the repository confirms local text-model call-path/context injection but does not contain a complete image-recognition pipeline.
- Slide 9–10 / content / legal: replace IP placeholders only with official certificates and accurately labeled status.
- Slide 12 / content / impact: add matched manual/software times and traceability sampling results.
- Slide 13 / content / finance: verify CNY 150 million contract scope/date, approve pricing, and fill sales and AI R&D cost inputs.
- All slides / visual / impact: open and inspect in PowerPoint after generation; typography substitution and image crop should be checked on the target machine.

## Completion state
- Status: structurally-verified-with-disclosure (after the packaged inspector passes)
""",
        encoding="utf-8",
    )
    (OUT_DIR / "asset_manifest.md").write_text(
        """# Asset manifest

- `projects/rockmass_technology_report_20261026_reviewed/images/01-rmr-calculation.png` — existing software UI screenshot, 1600×900, no crop, placed on slide 5; its point values are fictional demo inputs and the slide labels them as such.
- Attached template `C:/Users/0303003/Downloads/参考.pptx` — existing editable cover, three chapter divider backgrounds, and closing-page imagery reused in the output. The cover/section/end text was edited in place.
- Slides 7–10 contain editable image placeholders for an agent exchange, visual-recognition evidence, and IP certificates; no fabricated image evidence was added.
""",
        encoding="utf-8",
    )
    print(OUT)
    print(f"slides={len(prs.slides)}")


if __name__ == "__main__":
    main()
