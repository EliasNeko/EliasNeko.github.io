# -*- coding: utf-8 -*-
"""数学电子教材 · 章节正文生成器（小鱼 2026-10-23）

为什么要有它：
    以前每个小节只列一个标题，读者一划就从第一章跳到第二章。
    现在每一节都写成「讲什么 / 关键公式 / 怎么用 / 易错」四段真内容。

数据文件（data_g1.py 等）格式：
    from build_math import ch, PARTS_DONE
    PARTS = [
        ("必修 第一册", [
            ch(
                sid="s1", num="01", title="集合与常用逻辑用语",
                lead="一句话说这章干什么。",
                secs=[
                    "1.1 集合的概念§讲什么……§关键公式……§怎么用……§易错……",
                    "1.2 集合间的基本关系§……§……§……§……",
                ],
                concepts=["……", "……"],
                formula="A∩B = {x | x∈A 且 x∈B}",
                howto=["……", "……"],
                fq=("公式小题题干", "解答……"),
                cq=("综合题（集合 + 不等式）", "题干", "解答……"),
                ex=("例题题干", "解答……"),
                pitfalls=["……", "……"],
                quiz=[("题", "答"), ("题", "答")],
            ),
        ]),
    ]

小节字符串用 § 分隔五段：标题 § 讲什么 § 关键公式 § 怎么用 § 易错。
后三段可以为空，但「讲什么」必须写。

用法：
    python build_math.py g1        # 重建高一
    python build_math.py g1 --dry  # 只统计，不写文件
"""
import html as H
import importlib
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)

PAGES = {
    "g1": "数学-高一.html",
    "g2": "数学-高二.html",
    "g3": "数学-高三.html",
    "c1": "数学-初一.html",
    "c2": "数学-初二.html",
    "c3": "数学-初三.html",
}


def esc(s):
    return H.escape(str(s), quote=False)


def ch(sid, num, title, lead, secs, concepts, formula, howto, fq, cq, ex, pitfalls, quiz):
    return {
        "sid": sid, "num": num, "title": title, "lead": lead, "secs": secs,
        "concepts": concepts, "formula": formula, "howto": howto,
        "fq": fq, "cq": cq, "ex": ex, "pitfalls": pitfalls, "quiz": quiz,
    }


def ul(items):
    return "<ul>" + "".join("<li>%s</li>" % esc(x) for x in items) + "</ul>"


def qa_block(label, q, a):
    return (
        '        <div class="ch-block"><b>%s</b><p class="lead">%s</p>'
        '<details><summary>看解答</summary><div class="note">%s</div></details></div>'
        % (esc(label), esc(q), esc(a))
    )


def sec_html(s, sid, idx):
    parts = [p.strip() for p in str(s).split("§")]
    while len(parts) < 5:
        parts.append("")
    title, what, formula, use, warn = parts[:5]

    m = re.match(r"^([0-9]+(?:\.[0-9]+)*\*?)\s+(.+)$", title)
    if m:
        num, name = m.group(1), m.group(2)
        head = '<span class="n">%s</span>%s' % (esc(num), esc(name))
    else:
        head = esc(title)

    out = ['            <div class="sec" id="%s-%d">' % (sid, idx)]
    out.append("                <h4>%s</h4>" % head)
    if what:
        out.append("                <p>%s</p>" % esc(what))
    if formula:
        out.append('                <div class="f">%s</div>' % esc(formula))
    if use:
        out.append('                <p class="use"><b>怎么用：</b>%s</p>' % esc(use))
    if warn:
        out.append('                <p class="warn"><b>易错：</b>%s</p>' % esc(warn))
    out.append("            </div>")
    return "\n".join(out)


def render_chapter(c):
    sid = c["sid"]
    out = []
    out.append('    <section class="card" id="%s">' % sid)
    out.append('        <h2><span class="num">%s</span>%s</h2>' % (esc(c["num"]), esc(c["title"])))
    out.append('        <p class="lead">%s</p>' % esc(c["lead"]))
    out.append('        <div class="secs">')
    for i, s in enumerate(c["secs"], 1):
        out.append(sec_html(s, sid, i))
    out.append("        </div>")

    out.append('        <div class="ch-block"><b>本章核心概念</b>%s</div>' % ul(c["concepts"]))
    out.append('        <div class="ch-block"><b>关键公式 / 结论</b><div class="formula">%s</div></div>' % esc(c["formula"]))
    if c["howto"]:
        out.append('        <div class="ch-block"><b>怎么记 / 怎么用</b>%s</div>' % ul(c["howto"]))
    out.append(qa_block("公式小题", c["fq"][0], c["fq"][1]))
    out.append(qa_block(c["cq"][0], c["cq"][1], c["cq"][2]))
    out.append(qa_block("例题", c["ex"][0], c["ex"][1]))
    out.append('        <div class="ch-block"><b>易错点</b>%s</div>' % ul(c["pitfalls"]))
    out.append(
        '        <div class="quiz"><b>小测（%d 题）</b><ol>%s</ol>'
        '<details><summary>点开看答案</summary><ol>%s</ol></details></div>'
        % (len(c["quiz"]), "".join("<li>%s</li>" % esc(q) for q, _ in c["quiz"]),
           "".join("<li>%s</li>" % esc(a) for _, a in c["quiz"]))
    )
    out.append("    </section>")
    return "\n".join(out)


def render_parts(parts):
    chunks = []
    for label, chapters in parts:
        chunks.append('    <div class="part">%s</div>' % esc(label))
        for c in chapters:
            chunks.append(render_chapter(c))
    return "\n\n".join(chunks) + "\n"


def rebuild(key, dry=False):
    mod = importlib.import_module("data_" + key)
    page = os.path.join(ROOT, PAGES[key])
    src = open(page, encoding="utf-8").read()
    start = src.index('<div class="part">')
    end = src.index('<section class="card" id="conclusions">')
    body = render_parts(mod.PARTS)
    new = src[:start] + body + "\n\n    " + src[end:]

    chapters = sum(len(cs) for _, cs in mod.PARTS)
    sections = sum(len(c["secs"]) for _, cs in mod.PARTS for c in cs)
    print("%s: %d 部分 / %d 章 / %d 节 / %.1f KB" % (PAGES[key], len(mod.PARTS), chapters, sections, len(new.encode("utf-8")) / 1024))

    if dry:
        return
    open(page, "w", encoding="utf-8", newline="\n").write(new)

    check = open(page, encoding="utf-8").read()
    assert check.count("<section") == check.count("</section>"), "section 标签不平衡"
    assert check.count('<div class="sec"') == sections, "小节数量对不上"
    print("  写入完成，标签平衡。")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("用法: python build_math.py [g1|g2|g3|c1|c2|c3] [--dry]")
        raise SystemExit(1)
    for k in args:
        rebuild(k, dry="--dry" in sys.argv)
