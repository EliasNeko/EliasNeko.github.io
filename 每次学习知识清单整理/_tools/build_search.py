# -*- coding: utf-8 -*-
r"""把六册数学、五册英语和数学二级结论抽成一份可搜索的索引。

输出：..\shelf-search.js
用法（在 _tools 目录）：python build_search.py

索引是一条条短数组，省字节：
    [范围, 标题, 出处/章, 链接, 关键词文本]
    范围：m 数学 / e 英语 / c 二级结论
"""
import html
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATH = ["数学-初一.html", "数学-初二.html", "数学-初三.html", "数学-高一.html", "数学-高二.html", "数学-高三.html"]
ENGLISH = ["英语-初一.html", "英语-初二.html", "英语-初三.html", "英语-高一.html", "英语-高二.html"]

MATH_BOOK = {
    "数学-初一.html": "初一数学 · 湘教版",
    "数学-初二.html": "初二数学 · 湘教版",
    "数学-初三.html": "初三数学 · 湘教版",
    "数学-高一.html": "高一数学 · 人教A版",
    "数学-高二.html": "高二数学 · 人教A版",
    "数学-高三.html": "高三数学 · 人教A版",
}
ENGLISH_BOOK = {
    "英语-初一.html": "初一英语 · 人教版",
    "英语-初二.html": "初二英语 · 人教版",
    "英语-初三.html": "初三英语 · 人教版",
    "英语-高一.html": "高一英语 · 人教版",
    "英语-高二.html": "高二英语 · 人教版",
}


def clean(x):
    x = re.sub(r"<script.*?</script>", " ", x, flags=re.S | re.I)
    x = re.sub(r"<style.*?</style>", " ", x, flags=re.S | re.I)
    x = re.sub(r"<[^>]+>", " ", x)
    x = html.unescape(x)
    x = x.replace("§", " ")
    return re.sub(r"\s+", " ", x).strip()


def cut(s, n):
    return s if len(s) <= n else s[:n].rstrip() + "…"


def add_english_ids():
    """英语页原来没有锚点，给每个单元补 id=u1/u2…，搜索结果才能直接跳过去。"""
    changed = 0
    for f in ENGLISH:
        path = os.path.join(ROOT, f)
        s = io.open(path, encoding="utf-8").read()
        n = [0]

        def repl(m):
            n[0] += 1
            return '<section class="card" id="u%d">' % n[0]

        s2 = re.sub(r'<section class="card">', repl, s)
        if s2 != s:
            io.open(path, "w", encoding="utf-8", newline="\n").write(s2)
            changed += 1
    print("英语页补锚点：%d 个页面" % changed)


def sec_blocks(block):
    """按行切出每个 <div class="sec" id=...>…</div>。"""
    out, cur = [], None
    for line in block.splitlines():
        if '<div class="sec" id="' in line:
            cur = [line]
        elif cur is not None:
            cur.append(line)
            if line.strip() == "</div>":
                out.append("\n".join(cur))
                cur = None
    return out


def math_items():
    items = []
    for f in MATH:
        s = io.open(os.path.join(ROOT, f), encoding="utf-8").read()
        for m in re.finditer(r'<section class="card" id="(s\d+|x\d+)"[^>]*>(.*?)</section>', s, re.S):
            block = m.group(2)
            h2 = re.search(r"<h2>.*?</span>(.*?)</h2>", block, re.S)
            chapter = clean(h2.group(1)) if h2 else ""
            for sec in sec_blocks(block):
                anchor = re.search(r'<div class="sec" id="([^"]+)"', sec).group(1)
                h4 = re.search(r'<h4><span class="n">([^<]+)</span>([^<]+)</h4>', sec, re.S)
                if not h4:
                    continue
                num, name = clean(h4.group(1)), clean(h4.group(2))
                body = sec.split("</h4>", 1)[1]
                items.append(["m", "%s %s" % (num, name), chapter, "%s#%s" % (f, anchor), cut(clean(body), 130)])
    return items


def english_items():
    items = []
    for f in ENGLISH:
        s = io.open(os.path.join(ROOT, f), encoding="utf-8").read()
        book = ENGLISH_BOOK[f]
        for m in re.finditer(r'<section class="card" id="(u\d+)">(.*?)</section>', s, re.S):
            uid, block = m.group(1), m.group(2)
            h2 = re.search(r'<h2><span class="num">([^<]+)</span>([^<]+)</h2>', block, re.S)
            if not h2:
                continue
            num, name = clean(h2.group(1)), clean(h2.group(2))
            body = block.split("</h2>", 1)[1]
            items.append(["e", "%s %s" % (num, name), book, "%s#%s" % (f, uid), cut(clean(body), 130)])
    return items


def conclusion_items():
    items = []
    for f in MATH:
        s = io.open(os.path.join(ROOT, f), encoding="utf-8").read()
        m = re.search(r'<section class="card" id="conclusions">(.*?)</section>', s, re.S)
        if not m:
            continue
        for li in re.findall(r"<li>(.*?)</li>", m.group(1), re.S):
            b = re.search(r"<b>(.*?)</b>", li, re.S)
            title = clean(b.group(1)) if b else clean(li)[:40]
            desc = clean(li)
            if desc.startswith(title):
                desc = desc[len(title):].strip()
            items.append(["c", title, "二级结论", "%s#conclusions" % f, cut(desc, 150)])
    return items


def main():
    add_english_ids()
    items = math_items() + english_items() + conclusion_items()
    out = os.path.join(ROOT, "shelf-search.js")
    data = json.dumps(items, ensure_ascii=False, separators=(",", ":"))
    books = dict(MATH_BOOK)
    books.update(ENGLISH_BOOK)
    io.open(out, "w", encoding="utf-8", newline="\n").write(
        "/* 教材书架搜索索引 · 由 _tools/build_search.py 生成，别手改 */\n"
        "window.SHELF_BOOKS=%s;\nwindow.SHELF_INDEX=%s;\n" % (
            json.dumps(books, ensure_ascii=False, separators=(",", ":")), data)
    )
    counts = {}
    for it in items:
        counts[it[0]] = counts.get(it[0], 0) + 1
    print("写入 %s：%d 条（数学 %d / 英语 %d / 二级结论 %d）" % (
        os.path.basename(out), len(items), counts.get("m", 0), counts.get("e", 0), counts.get("c", 0)))
    print("%.1f KB" % (os.path.getsize(out) / 1024))


if __name__ == "__main__":
    main()
