# -*- coding: utf-8 -*-
import io, os, re
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
files = ["math-grade10.html","math-grade11.html","math-grade12.html","math-grade7.html","math-grade8.html","math-grade9.html"]
total_ch = total_sec = 0
for f in files:
    s = io.open(f, encoding="utf-8").read()
    chs = re.findall(r'<section class="card" id="(s\d+|x\d+)">', s)
    secs = re.findall(r'<div class="sec" id="([^"]+)">', s)
    fs = re.findall(r'<div class="f">(.*?)</div>', s, re.S)
    empty = len([x for x in fs if not x.strip()])
    dup = len(secs) - len(set(secs))
    body = s[s.index('<div class="part">'):s.index('<section class="card" id="conclusions">')]
    print("%s ch=%d sec=%d emptyF=%d dup=%d leftover§=%d p_empty=%d" % (
        f, len(chs), len(secs), empty, dup, body.count("§"), body.count("<p></p>")))
    total_ch += len(chs); total_sec += len(secs)
print("TOTAL chapters=%d sections=%d" % (total_ch, total_sec))
