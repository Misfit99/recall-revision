#!/usr/bin/env python3
"""
Convert a "Revision Sheet" PDF (the dark, full-sentence edition layout) into a
content unit for the revision site.

Usage:
    python extract_revision_pdf.py <subject-id> <unit-id> <pdf> <out.js>

Example:
    python extract_revision_pdf.py core-java day-1 Core_Java_..._Day1_v2_dark.pdf ../content/core-java/day-1.js

Needs PyMuPDF (pip install pymupdf).

The parser reads fonts, colours and the drawn boxes of the PDF:
  * Sans-Bold 11pt line            -> new card ("1.2 Title")
  * RECALL / SAY IT / TRAP label   -> callout box (text inside the box rectangle)
  * small square at the left       -> bullet paragraph
  * mono 7.6pt lines               -> code block
  * orange header cells            -> table
  * "Quick check" + "Quick-check answers" -> question/answer list
"""
import html
import json
import re
import sys

import pymupdf

HEADER_Y, FOOTER_Y = 36, 805
LABELS = {"RECALL": "recall", "SAY IT": "sayit", "TRAP": "trap", "NOTE": "note", "WHY": "note"}


def is_mono(s):
    return "Mono" in s["font"]


def is_bold(s):
    return "Bold" in s["font"]


def is_italic(s):
    return "Italic" in s["font"] or "Oblique" in s["font"]


def spans_to_html(spans):
    """Merge runs of identical style and render as inline HTML."""
    out, cur_style, buf = [], None, ""

    def flush():
        nonlocal buf
        if not buf:
            return
        t = html.escape(buf)
        code, bold, ital = cur_style
        if code:
            t = f"<code>{t}</code>"
        if bold:
            t = f"<strong>{t}</strong>"
        if ital and not code:
            t = f"<em>{t}</em>"
        out.append(t)
        buf = ""

    for s in spans:
        txt = s["text"]
        if txt == "":
            continue
        style = (is_mono(s), is_bold(s), is_italic(s))
        if txt.strip() == "":
            # whitespace: attach to the current run (keeps <code> runs from splitting)
            buf += txt
            continue
        if style != cur_style:
            # move trailing whitespace outside the formatted run
            trail = len(buf) - len(buf.rstrip(" "))
            if trail:
                tail = buf[-trail:]
                buf = buf[:-trail]
                flush()
                out.append(tail)
            else:
                flush()
            cur_style = style
        buf += txt
    flush()
    h = "".join(out)
    h = re.sub(r"</code>(\s*)<code>", r"\1", h)
    h = re.sub(r"</strong>(\s*)<strong>", r"\1", h)
    return re.sub(r"\s+", " ", h).strip()


def join_line_spans(lines):
    """Concatenate the spans of several text lines into one span list."""
    spans = []
    for ln in lines:
        if spans:
            prev = spans[-1]["text"].rstrip()
            nxt = ln["spans"][0]["text"]
            if (prev.endswith("-") and not prev.endswith(" -")) or (prev.endswith("-") and nxt.startswith(">")):
                pass  # hyphenated across lines (or a split "->"): no space
            else:
                spans.append({**ln["spans"][0], "text": " "})
        spans.extend(ln["spans"])
    return spans


def collect_page(page):
    lines = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            spans = [s for s in l["spans"]]
            if not spans:
                continue
            x0, y0, x1, y1 = l["bbox"]
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            if "".join(s["text"] for s in spans).strip() == "":
                continue
            lines.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "spans": spans})
    # merge lines on the same baseline (PDF sometimes splits them)
    lines.sort(key=lambda l: (round(l["y0"]), l["x0"]))
    merged = []
    for l in lines:
        if merged and abs(merged[-1]["y0"] - l["y0"]) < 2 and l["x0"] > merged[-1]["x1"] - 2:
            m = merged[-1]
            m["spans"] = m["spans"] + [{**l["spans"][0], "text": " "}] + l["spans"]
            m["x1"] = l["x1"]
        else:
            merged.append(l)

    bullets, boxes, theads, seps, codeboxes = [], [], [], [], []
    for d in page.get_drawings():
        r = d["rect"]
        fill = d.get("fill")
        if fill is None:
            continue
        f = tuple(round(c, 2) for c in fill)
        if r.width < 5 and r.height < 5:
            bullets.append((r.y0 + r.y1) / 2)
        elif f == (0.76, 0.35, 0.11):
            theads.append(r)
        elif r.height <= 1.6 and r.width > 20 and f == (0.18, 0.2, 0.24) and r.x0 > 45:
            seps.append(r)
        elif r.width > 400 and r.height > 10 and r.x0 > 45 and r.x0 < 60:
            if f == (0.11, 0.12, 0.15):
                codeboxes.append(r)
            else:
                boxes.append(r)
    return merged, bullets, boxes, theads, seps, codeboxes


def line_text(l):
    return "".join(s["text"] for s in l["spans"])


def parse(pdf_path):
    doc = pymupdf.open(pdf_path)
    meta = {"title": doc.metadata.get("title", "")}
    unit = {"label": "", "title": "", "tagline": "", "topics": "", "cards": [], "quiz": []}

    # cover page
    for l in collect_page(doc[0])[0]:
        s = l["spans"][0]
        if s["size"] > 30 and line_text(l).strip() != "Revision Sheet":
            unit["label"] = line_text(l).strip()
        if "Italic" in s["font"] and abs(s["size"] - 9.5) < 0.2:
            unit["topics"] += line_text(l).strip() + " "
    unit["topics"] = unit["topics"].strip()

    card = None
    mode = "cards"  # cards | quiz | answers
    quiz_q, answers = [], []
    pending = []  # lines accumulating into the current paragraph
    pending_kind = None

    def flush_para():
        nonlocal pending, pending_kind
        if pending and card is not None:
            h = spans_to_html(join_line_spans(pending))
            if pending_kind in ("recall", "sayit", "trap", "note"):
                card["blocks"].append({"type": pending_kind, "html": h})
            else:
                card["blocks"].append({"type": "p", "html": h, "bullet": pending_kind == "bullet"})
        pending, pending_kind = [], None

    for pno in range(1, doc.page_count):
        lines, bullets, boxes, theads, seps, codeboxes = collect_page(doc[pno])
        i = 0
        # table regions on this page
        tables = []
        if theads:
            theads.sort(key=lambda r: (round(r.y0), r.x0))
            groups = []
            for r in theads:
                if groups and abs(groups[-1][0].y0 - r.y0) < 2:
                    groups[-1].append(r)
                else:
                    groups.append([r])
            for g in groups:
                top, hbot = g[0].y0, g[0].y1
                cols = sorted((r.x0, r.x1) for r in g)
                rowlines = sorted({round(s.y0, 1) for s in seps if s.y0 > hbot and cols[0][0] - 2 <= s.x0 <= cols[-1][1]})
                # rows are contiguous: stop at first gap larger than 80pt
                rl = []
                last = hbot
                for y in rowlines:
                    if y - last > 80:
                        break
                    rl.append(y)
                    last = y
                tables.append({"top": top, "hbot": hbot, "bottom": rl[-1] if rl else hbot + 20, "cols": cols, "rows": rl, "done": False})

        def in_table(l):
            for t in tables:
                if t["top"] - 1 <= l["y0"] <= t["bottom"]:
                    return t
            return None

        def box_for(l):
            for r in boxes:
                if r.y0 - 1 <= l["y0"] <= r.y1:
                    return r
            return None

        def codebox_for(l):
            for r in codeboxes:
                if r.y0 - 1 <= l["y0"] <= r.y1:
                    return r
            return None

        while i < len(lines):
            l = lines[i]
            s0 = l["spans"][0]
            txt = line_text(l).strip()

            # ---- section switches
            if "Sans-Bold" in s0["font"] and abs(s0["size"] - 10.5) < 0.2 and txt.startswith("Quick check"):
                flush_para()
                mode = "quiz"
                i += 1
                continue
            if "Sans-Bold" in s0["font"] and abs(s0["size"] - 18) < 0.5 and "answers" in txt.lower():
                flush_para()
                mode = "answers"
                i += 1
                continue

            if mode == "quiz":
                m = re.match(r"^(\d+)\.\s", txt)
                if m and l["x0"] < 52:
                    quiz_q.append([l])
                elif quiz_q:
                    quiz_q[-1].append(l)
                i += 1
                continue

            if mode == "answers":
                if "Sans-Bold" in s0["font"]:
                    i += 1
                    continue
                m = re.match(r"^(\d+)\.\s", txt)
                if m and l["x0"] < 52:
                    answers.append({"q": [], "a": []})
                    # drop the "N. " span text
                    spans = list(l["spans"])
                    spans[0] = {**spans[0], "text": re.sub(r"^\s*\d+\.\s*", "", spans[0]["text"])}
                    answers[-1]["q"].append({**l, "spans": spans})
                elif answers:
                    real = [s for s in l["spans"] if s["text"].strip()]
                    if real and all(is_bold(s) for s in real) and not answers[-1]["a"]:
                        answers[-1]["q"].append(l)
                    else:
                        answers[-1]["a"].append(l)
                i += 1
                continue

            # ---- day intro (page 2 top)
            if "Sans-Bold" in s0["font"] and abs(s0["size"] - 20) < 0.5:
                unit["title"] = (unit["title"] + " " + txt).strip()
                i += 1
                continue
            if "Sans-Bold" in s0["font"] and abs(s0["size"] - 9) < 0.2 and card is None:
                i += 1
                continue
            if "Italic" in s0["font"] and abs(s0["size"] - 9.6) < 0.2 and card is None:
                unit["tagline"] = (unit["tagline"] + " " + txt).strip()
                i += 1
                continue

            # ---- card heading
            if "Sans-Bold" in s0["font"] and abs(s0["size"] - 11) < 0.3:
                flush_para()
                if card is not None and not card["blocks"] and not re.match(r"^\d+\.\d+\w*\s", txt):
                    card["title"] += " " + txt  # heading wrapped onto a second line
                    i += 1
                    continue
                m = re.match(r"^(\S+)\s+(.*)$", txt)
                num, title = (m.group(1), m.group(2)) if m else ("", txt)
                card = {"id": num, "title": title, "blocks": []}
                unit["cards"].append(card)
                i += 1
                continue

            if card is None:
                i += 1
                continue

            # ---- table
            t = in_table(l)
            if t is not None:
                flush_para()
                if not t["done"]:
                    t["done"] = True
                    tl = [x for x in lines if t["top"] - 1 <= x["y0"] <= t["bottom"]]
                    ncol = len(t["cols"])

                    def col_of(x):
                        best = 0
                        for ci, (a, b) in enumerate(t["cols"]):
                            if x >= a - 3:
                                best = ci
                        return best

                    bounds = [t["hbot"]] + t["rows"]
                    head = [[] for _ in range(ncol)]
                    body = [[[] for _ in range(ncol)] for _ in range(len(t["rows"]))]
                    for x in tl:
                        # split each line's spans into columns by their x position
                        parts = {}
                        for sp in x["spans"]:
                            c = col_of(sp["bbox"][0])
                            parts.setdefault(c, []).append(sp)
                        for c, sps in parts.items():
                            while sps and not sps[0]["text"].strip():
                                sps = sps[1:]
                            if not sps:
                                continue
                            piece = {**x, "spans": sps}
                            if x["y0"] < t["hbot"]:
                                head[c].append(piece)
                            else:
                                for ri in range(len(t["rows"])):
                                    if bounds[ri] - 1 <= x["y0"] < bounds[ri + 1]:
                                        body[ri][c].append(piece)
                                        break
                    card["blocks"].append({
                        "type": "table",
                        "head": [spans_to_html(join_line_spans(c)) if c else "" for c in head],
                        "rows": [[spans_to_html(join_line_spans(c)) if c else "" for c in row] for row in body],
                    })
                i += 1
                continue

            # ---- code block
            if all(is_mono(s) for s in l["spans"] if s["text"].strip()) and abs(s0["size"] - 7.6) < 0.3:
                flush_para()
                cb = codebox_for(l)
                code_lines = []
                base_x = l["x0"]
                prev = None
                while i < len(lines):
                    x = lines[i]
                    sx = x["spans"][0]
                    if not (abs(sx["size"] - 7.6) < 0.3 and all(is_mono(s) for s in x["spans"] if s["text"].strip())):
                        break
                    if prev is not None and x["y0"] - prev["y1"] > 12 and (cb is None or x["y0"] > cb.y1):
                        break
                    # character width ~4.57pt at 7.6pt mono: recover indentation from x offset
                    indent = max(0, round((x["x0"] - base_x) / 4.57))
                    text = " " * indent + "".join(s["text"] for s in x["spans"])
                    last = code_lines[-1] if code_lines else ""
                    wrapped = (
                        prev is not None and prev["x1"] > 478 and not text.startswith((" ", "}", "//", '"'))
                        and (last.count('"') % 2 == 1
                             or ("//" in last and not re.search(r"[;={<]|\.\w", text)
                                 and not text.startswith(("class ", "new ", "return"))))
                    )
                    if wrapped:  # the PDF wrapped a long line: glue it back on
                        code_lines[-1] += text if last.count('"') % 2 == 1 else " " + text.strip()
                    else:
                        code_lines.append(text.rstrip())
                    prev = x
                    i += 1
                card["blocks"].append({"type": "code", "code": "\n".join(code_lines)})
                continue

            # ---- callout box
            label = s0["text"].strip()
            if "Sans-Bold" in s0["font"] and label in LABELS:
                flush_para()
                pending_kind = LABELS[label]
                spans = l["spans"][1:]
                pending = [{**l, "spans": spans}] if spans else []
                box = box_for(l)
                i += 1
                while i < len(lines) and box is not None and lines[i]["y0"] <= box.y1:
                    x = lines[i]
                    if "Sans-Bold" in x["spans"][0]["font"] and x["spans"][0]["text"].strip() in LABELS:
                        break
                    pending.append(x)
                    i += 1
                flush_para()
                continue

            # ---- paragraph
            has_bullet = any(l["y0"] - 1 <= by <= l["y1"] + 1 for by in bullets) and l["x0"] > 60
            if has_bullet:
                flush_para()
                pending_kind = "bullet"
                pending = [l]
            else:
                if pending and pending_kind in ("bullet", "p") and l["y0"] - pending[-1]["y1"] < 8:
                    pending.append(l)
                else:
                    flush_para()
                    pending_kind = "p"
                    pending = [l]
            i += 1
        flush_para()  # paragraphs never span pages in practice

    flush_para()

    # quick check: prefer the richer answer-section questions
    for k, a in enumerate(answers):
        q_html = spans_to_html(join_line_spans(a["q"]))
        q_html = re.sub(r"</?strong>", "", q_html)
        unit["quiz"].append({"q": q_html, "a": spans_to_html(join_line_spans(a["a"]))})
    if not answers:
        for ql in quiz_q:
            spans = list(ql[0]["spans"])
            spans[0] = {**spans[0], "text": re.sub(r"^\s*\d+\.\s*", "", spans[0]["text"])}
            unit["quiz"].append({"q": spans_to_html(join_line_spans([{**ql[0], "spans": spans}] + ql[1:])), "a": ""})
    return unit, meta


def main():
    if len(sys.argv) != 5:
        print(__doc__)
        sys.exit(1)
    subject, unit_id, pdf, out = sys.argv[1:]
    unit, meta = parse(pdf)
    unit = {"subject": subject, "id": unit_id, "source": pdf.split("/")[-1], **unit}
    with open(out, "w") as f:
        f.write("/* Generated from " + unit["source"] + " by tools/extract_revision_pdf.py */\n")
        f.write("Revision.addUnit(" + json.dumps(unit, ensure_ascii=False, indent=1) + ");\n")
    n_blocks = sum(len(c["blocks"]) for c in unit["cards"])
    print(f"{unit_id}: {len(unit['cards'])} cards, {n_blocks} blocks, {len(unit['quiz'])} quiz -> {out}")


if __name__ == "__main__":
    main()
