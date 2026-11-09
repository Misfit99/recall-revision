# Cram Jam — revision library

A static website (no build step, no dependencies) for revision cards.
Core Java is in it now (Days 1, 2, 3, 4A, 4B, 5 and 6: 79 cards and 78 quick-check questions), and it is set up for more subjects.

## Open it

Double-click `index.html`. It also works from any static host (GitHub Pages, Netlify, and so on). Or run a local server:

```bash
python3 -m http.server 8765 --directory revision-site
```

Then open http://localhost:8765.

## What it does

- **Library → Subject → Unit** pages. Each unit lists its cards, and each card has its Recall, Trap and Say-it boxes, code and tables.
- **Recall mode** shows only the card titles. Say the answer out loud, then click to reveal it.
- **Got it / Missed it** on every card. A missed card goes on the **Review** list (the circular-arrow icon) and comes off after 2 correct reviews in a row. This is the same rule the PDFs use.
- **Quick check** gives a flashcard quiz for each unit. Keys: `space` reveals the answer, `1` means you missed it, `2` means you got it, `←` goes back.
- **Search** across every card with `⌘K` or `/`.
- Light and dark theme, and it works on a phone.

Your progress is saved in the browser's localStorage, so it stays on that one browser and device.

## Adding material

### A new unit from a PDF in the same style

The Core Java content was generated from the `*_v2_dark.pdf` sheets by `tools/extract_revision_pdf.py`. The script needs PyMuPDF (`pip install pymupdf`).

```bash
python3 tools/extract_revision_pdf.py <subject-id> <unit-id> path/to/sheet.pdf content/<subject-id>/<unit-id>.js
```

`tools/build_core_java.sh` regenerates all seven Core Java days.

### A new subject

1. Put the unit files in `content/<subject-id>/`. Each file calls `Revision.addUnit({...})`.
2. Add an entry to `content/subjects.js`:

```js
Revision.addSubject({
  id: "spring-boot",
  title: "Spring Boot",
  tagline: "…",
  accent: "#6fd08c",
  glyph: "S",
  units: [{ id: "day-1", file: "content/spring-boot/day-1.js" }],
});
```

### Unit file format (if you write one by hand)

```js
Revision.addUnit({
  subject: "spring-boot", id: "day-1",
  label: "Day 1", title: "Beans and the context", tagline: "…", topics: "IoC · Beans · Scopes",
  cards: [
    { id: "1.1", title: "What is a bean?", blocks: [
      { type: "recall", html: "…" },
      { type: "p", html: "<strong>Lead-in.</strong> Body text with <code>inline code</code>.", bullet: true },
      { type: "code", code: "@Bean\nFoo foo() { return new Foo(); }" },
      { type: "table", head: ["A", "B"], rows: [["x", "y"]] },
      { type: "trap", html: "…" },
      { type: "sayit", html: "…" }
    ]}
  ],
  quiz: [{ q: "Question?", a: "Answer." }]
});
```
