/* ============================================================
   Cram Jam — revision library (vanilla JS, no build step)
   ============================================================ */
(function () {
  "use strict";

  const R = window.Revision;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const app = $("#app");

  /* ---------------- storage ---------------- */
  const STORE_KEY = "recall.progress.v1";
  const store = {
    data: { cards: {}, quiz: {}, prefs: {} },
    load() {
      try { const raw = localStorage.getItem(STORE_KEY); if (raw) this.data = Object.assign(this.data, JSON.parse(raw)); } catch (e) {}
    },
    save() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) {}
    },
    card(key) { return this.data.cards[key] || null; },
    /* Sheet rule: a missed card goes on the misses list; it leaves after 2 correct reviews in a row. */
    mark(key, ok) {
      const c = this.data.cards[key] || { streak: 0, missed: false, seen: 0 };
      c.seen++;
      c.last = Date.now();
      if (ok) { c.streak++; if (c.missed && c.streak >= 2) c.missed = false; }
      else { c.streak = 0; c.missed = true; }
      this.data.cards[key] = c;
      this.save();
      updateBadge();
      return c;
    },
  };

  const cardKey = (unit, card) => `${unit.subject}/${unit.id}/${card.id}`;
  const unitKey = (unit) => `${unit.subject}/${unit.id}`;
  const subjectById = (id) => R.subjects.find((s) => s.id === id);
  const unitsOf = (subject) => subject.units.map((u) => R.units[`${subject.id}/${u.id}`]).filter(Boolean);
  const allCards = () => {
    const out = [];
    for (const s of R.subjects) for (const u of unitsOf(s)) for (const c of u.cards) out.push({ s, u, c, key: cardKey(u, c) });
    return out;
  };

  function cardStatus(key) {
    const c = store.card(key);
    if (!c) return "new";
    if (c.missed) return "miss";
    return "ok";
  }

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const stripTags = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent || ""; };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const cardAnchor = (id) => "card-" + id.replace(/[^\w]/g, "_");

  const ICONS = {
    recall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/></svg>',
    trap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    sayit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
  };
  const LABEL = { recall: "Recall", trap: "Trap", sayit: "Say it", note: "Note" };

  /* ---------------- Java highlighter ---------------- */
  const KW = new Set("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record yield sealed permits non-sealed true false null".split(" "));
  function highlight(code) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(@\w+)|(\b\d[\d_]*(?:\.\d+)?[LlFfDd]?\b)|(\b[A-Za-z_]\w*\b)/g;
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const t = esc(m[0]);
      if (m[1]) out += `<span class="tok-com">${t}</span>`;
      else if (m[2]) out += `<span class="tok-str">${t}</span>`;
      else if (m[3]) out += `<span class="tok-ann">${t}</span>`;
      else if (m[4]) out += `<span class="tok-num">${t}</span>`;
      else if (KW.has(m[0])) out += `<span class="tok-kw">${t}</span>`;
      else if (/^[A-Z]/.test(m[0])) out += `<span class="tok-type">${t}</span>`;
      else out += t;
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  /* ---------------- rendering: blocks ---------------- */
  function renderBlock(b) {
    switch (b.type) {
      case "recall": case "trap": case "sayit": case "note":
        return `<div class="callout ${b.type}"><div class="callout-label">${ICONS[b.type]}${LABEL[b.type]}</div><p>${b.html}</p></div>`;
      case "code":
        return `<pre class="code"><button class="copy" type="button">Copy</button><code>${highlight(b.code)}</code></pre>`;
      case "table":
        return `<div class="table-wrap"><table><thead><tr>${b.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${b.rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      default:
        return `<p class="${b.bullet ? "bullet" : ""}">${b.html}</p>`;
    }
  }

  function statusText(key) {
    const c = store.card(key);
    if (!c) return "Not reviewed yet";
    if (c.missed) return `<b>On your misses list</b> · ${c.streak}/2 correct in a row to clear`;
    return `<b>Known</b> · ${plural(c.streak, "correct review")} in a row`;
  }

  function renderCard(unit, card) {
    const key = cardKey(unit, card);
    const st = cardStatus(key);
    return `
      <article class="card" id="${cardAnchor(card.id)}" data-key="${esc(key)}">
        <header class="card-head"><span class="card-num">${esc(card.id)}</span><h2>${esc(card.title)}</h2></header>
        <div class="card-body">
          <div class="reveal-gate" role="button" tabindex="0">
            <b>Say the answer out loud first</b>
            <span>Then click to reveal the Recall box and the notes</span>
          </div>
          ${card.blocks.map(renderBlock).join("")}
        </div>
        <footer class="card-foot">
          <span class="status">${statusText(key)}</span>
          <button class="assess miss ${st === "miss" ? "on" : ""}" data-ok="0" type="button">✕ Missed it</button>
          <button class="assess got ${st === "ok" ? "on" : ""}" data-ok="1" type="button">✓ Got it</button>
        </footer>
      </article>`;
  }

  /* ---------------- views ---------------- */
  function setCrumbs(parts) {
    $("#crumbs").innerHTML = parts
      .map((p, i) => (i < parts.length - 1 && p.href ? `<a href="${p.href}">${esc(p.label)}</a><span class="sep">/</span>` : `<span>${esc(p.label)}</span>`))
      .join("");
  }

  function subjectProgress(subject) {
    let total = 0, known = 0, missed = 0;
    for (const u of unitsOf(subject)) for (const c of u.cards) {
      total++;
      const st = cardStatus(cardKey(u, c));
      if (st === "ok") known++; else if (st === "miss") missed++;
    }
    return { total, known, missed, pct: total ? Math.round((known / total) * 100) : 0 };
  }

  function viewHome() {
    setCrumbs([]);
    document.title = "Cram Jam — Revision Library";
    const cards = allCards();
    const known = cards.filter((x) => cardStatus(x.key) === "ok").length;
    const missed = cards.filter((x) => cardStatus(x.key) === "miss").length;
    const quizzes = R.subjects.reduce((n, s) => n + unitsOf(s).reduce((m, u) => m + u.quiz.length, 0), 0);
    const live = R.subjects.filter((s) => s.units.length);
    const first = live[0];
    const resume = store.data.prefs.lastUnit && R.units[store.data.prefs.lastUnit];

    app.innerHTML = `
      <section class="hero fade-in">
        <div class="eyebrow">Revision library</div>
        <h1>Cram hard.<br/><span class="grad">Jam harder.</span></h1>
        <p>Short, interview-ready cards with traps to avoid and lines to say out loud. Cover the answer, say it, reveal, and mark what you missed.</p>
        <div class="hero-actions">
          ${resume ? `<a class="btn btn-primary" href="#/s/${resume.subject}/${resume.id}">Continue ${esc(resume.label)} →</a>`
                   : first ? `<a class="btn btn-primary" href="#/s/${first.id}">Start with ${esc(first.title)} →</a>` : ""}
          <a class="btn" href="#/review">Review misses${missed ? ` · ${missed}` : ""}</a>
        </div>
      </section>

      <section class="stats fade-in">
        <div class="stat"><div class="stat-num">${cards.length}</div><div class="stat-label">Revision cards</div></div>
        <div class="stat"><div class="stat-num">${quizzes}</div><div class="stat-label">Quick-check questions</div></div>
        <div class="stat"><div class="stat-num" style="color:var(--say)">${known}</div><div class="stat-label">Cards you know</div></div>
        <div class="stat"><div class="stat-num" style="color:var(--trap)">${missed}</div><div class="stat-label">On your misses list</div></div>
      </section>

      <section class="fade-in">
        <div class="section-head"><h2>Subjects</h2><span class="muted" style="font-size:14px">${plural(live.length, "subject")}</span></div>
        <div class="subject-grid">
          ${R.subjects.map((s) => {
            const p = subjectProgress(s);
            const units = unitsOf(s);
            const empty = !units.length;
            return `
              <a class="subject-tile" href="#/s/${s.id}" style="--tile-accent:${s.accent || "var(--accent)"}">
                <div class="subject-glyph">${esc(s.glyph || s.title[0])}</div>
                <div><h3>${esc(s.title)}</h3><p>${esc(s.tagline || "")}</p></div>
                ${empty ? "" : `
                <div style="margin-top:auto">
                  <div class="subject-meta" style="margin-bottom:10px"><span>${plural(units.length, "unit")}</span><span>${plural(p.total, "card")}</span><span style="margin-left:auto">${p.pct}% known</span></div>
                  <div class="meter"><i style="width:${p.pct}%"></i></div>
                </div>`}
              </a>`;
          }).join("")}
          <div class="subject-tile placeholder">
            <div class="subject-glyph">+</div>
            <div><h3 style="color:var(--text-2)">More on the way</h3>
              <p>New subjects drop into <code>content/</code> and appear here automatically.</p></div>
          </div>
        </div>
      </section>`;
  }

  function viewSubject(sid) {
    const s = subjectById(sid);
    if (!s) return viewNotFound();
    setCrumbs([{ label: "Library", href: "#/" }, { label: s.title }]);
    document.title = `${s.title} — Cram Jam`;
    const units = unitsOf(s);
    const p = subjectProgress(s);
    app.innerHTML = `
      <section class="subject-hero fade-in" style="--tile-accent:${s.accent}">
        <div class="subject-glyph">${esc(s.glyph || s.title[0])}</div>
        <div style="flex:1">
          <div class="eyebrow">Subject</div>
          <h1>${esc(s.title)}</h1>
          <p>${esc(s.tagline || "")}</p>
          ${units.length ? `<div class="subject-meta" style="margin-top:14px"><span>${plural(units.length, "unit")}</span><span>${plural(p.total, "card")}</span><span>${p.known} known</span><span style="color:var(--trap)">${p.missed} missed</span></div>` : ""}
        </div>
      </section>
      ${units.length ? `
      <div class="callout recall fade-in" style="margin-bottom:28px">
        <div class="callout-label">${ICONS.recall}How to use</div>
        <p>Read only the card title, cover everything below it, and say the answer out loud — turn on <strong>Recall mode</strong> in a unit to do this on screen. Reveal, check, then mark <strong>Got it</strong> or <strong>Missed it</strong>. Next session: review misses first, then all cards. A card leaves the misses list after 2 correct reviews in a row. Spaced review: 1 · 3 · 7 · 14 days, then weekly.</p>
      </div>` : `<div class="empty"><b>Nothing here yet</b>Add unit files for this subject in <code>content/${esc(s.id)}/</code>.</div>`}
      <div class="unit-list fade-in" style="--tile-accent:${s.accent}">
        ${units.map((u) => {
          const total = u.cards.length;
          const known = u.cards.filter((c) => cardStatus(cardKey(u, c)) === "ok").length;
          const missed = u.cards.filter((c) => cardStatus(cardKey(u, c)) === "miss").length;
          const qz = store.data.quiz[unitKey(u)];
          const [kind, num] = (u.label || u.id).split(" ");
          return `
          <div class="unit-row">
            <div class="unit-label">${esc(kind || "")}<b>${esc(num || "")}</b></div>
            <div>
              <a href="#/s/${s.id}/${u.id}"><h3>${esc(u.title)}</h3></a>
              <div class="topics">${esc(u.topics)}</div>
              <div class="row-stats">${plural(total, "card")} · ${known} known${missed ? ` · <span style="color:var(--trap)">${missed} missed</span>` : ""} · ${plural(u.quiz.length, "question")}${qz ? ` · last quick check ${qz.last}/${qz.total}` : ""}</div>
              <div class="meter"><i style="width:${total ? (known / total) * 100 : 0}%"></i></div>
            </div>
            <div class="unit-actions">
              <a class="btn btn-sm" href="#/s/${s.id}/${u.id}/quiz">Quick check</a>
              <a class="btn btn-sm btn-primary" href="#/s/${s.id}/${u.id}">Read</a>
            </div>
          </div>`;
        }).join("")}
      </div>`;
  }

  let spyCleanup = null;
  function viewUnit(sid, uid, focusCard) {
    const s = subjectById(sid);
    const u = R.units[`${sid}/${uid}`];
    if (!s || !u) return viewNotFound();
    store.data.prefs.lastUnit = unitKey(u);
    store.save();
    setCrumbs([{ label: "Library", href: "#/" }, { label: s.title, href: `#/s/${sid}` }, { label: `${u.label} · ${u.title}` }]);
    document.title = `${u.label}: ${u.title} — Cram Jam`;
    const units = unitsOf(s);
    const idx = units.indexOf(u);
    const prev = units[idx - 1], next = units[idx + 1];
    const recallMode = !!store.data.prefs.recallMode;

    app.innerHTML = `
      <div class="reader fade-in">
        <aside class="toc" id="toc">
          <div class="toc-title">${esc(u.label)} · ${plural(u.cards.length, "card")}</div>
          ${u.cards.map((c) => {
            const st = cardStatus(cardKey(u, c));
            return `<a href="#/s/${sid}/${uid}/c/${encodeURIComponent(c.id)}" data-target="${cardAnchor(c.id)}"><span class="n">${esc(c.id)}</span><span>${esc(c.title)}</span><span class="dot ${st}"></span></a>`;
          }).join("")}
          <div class="toc-sep"></div>
          <a href="#/s/${sid}/${uid}/quiz"><span class="n">?</span><span>Quick check · ${u.quiz.length} questions</span><span></span></a>
        </aside>
        <div class="${recallMode ? "recall-mode" : ""}" id="unitMain">
          <header class="reader-head">
            <div class="eyebrow">${esc(s.title)} · ${esc(u.label)}</div>
            <h1>${esc(u.title)}</h1>
            ${u.tagline ? `<p class="tagline">${esc(u.tagline)}</p>` : ""}
            <div class="toolbar">
              <button class="toggle" id="recallToggle" aria-pressed="${recallMode}" type="button"><span class="sw"></span>Recall mode</button>
              <button class="btn btn-sm btn-ghost" id="revealAll" type="button" ${recallMode ? "" : "hidden"}>Reveal all</button>
              <a class="btn btn-sm" href="#/s/${sid}/${uid}/quiz">Quick check →</a>
              <span class="hint" id="modeHint">${recallMode ? "Titles only — answer, then reveal." : ""}</span>
            </div>
          </header>
          ${u.cards.map((c) => renderCard(u, c)).join("")}
          <nav class="unit-nav">
            ${prev ? `<a href="#/s/${sid}/${prev.id}"><small>← Previous</small><b>${esc(prev.label)} · ${esc(prev.title)}</b></a>` : ""}
            ${next ? `<a class="next" href="#/s/${sid}/${next.id}"><small>Next →</small><b>${esc(next.label)} · ${esc(next.title)}</b></a>` : ""}
          </nav>
        </div>
      </div>`;

    const main = $("#unitMain");
    $("#recallToggle").addEventListener("click", (e) => {
      const on = !main.classList.contains("recall-mode");
      main.classList.toggle("recall-mode", on);
      $$(".card", main).forEach((c) => c.classList.remove("revealed"));
      e.currentTarget.setAttribute("aria-pressed", on);
      $("#revealAll").hidden = !on;
      $("#modeHint").textContent = on ? "Titles only — answer, then reveal." : "";
      store.data.prefs.recallMode = on;
      store.save();
    });
    $("#revealAll").addEventListener("click", () => $$(".card", main).forEach((c) => c.classList.add("revealed")));
    main.addEventListener("click", (e) => {
      const gate = e.target.closest(".reveal-gate");
      if (gate) { gate.closest(".card").classList.add("revealed"); return; }
      const btn = e.target.closest(".assess");
      if (btn) {
        const card = btn.closest(".card");
        const key = card.dataset.key;
        const c = store.mark(key, btn.dataset.ok === "1");
        $$(".assess", card).forEach((b) => b.classList.remove("on"));
        (c.missed ? $(".assess.miss", card) : $(".assess.got", card)).classList.add("on");
        $(".status", card).innerHTML = statusText(key);
        const dot = $(`#toc a[data-target="${card.id}"] .dot`);
        if (dot) dot.className = "dot " + cardStatus(key);
      }
    });
    main.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("reveal-gate")) {
        e.preventDefault(); e.target.closest(".card").classList.add("revealed");
      }
    });

    // TOC: scroll within page instead of re-rendering
    $("#toc").addEventListener("click", (e) => {
      const a = e.target.closest("a[data-target]");
      if (!a) return;
      e.preventDefault();
      history.replaceState(null, "", a.getAttribute("href"));
      scrollToCard(a.dataset.target);
    });

    // scroll spy
    const links = new Map($$("#toc a[data-target]").map((a) => [a.dataset.target, a]));
    const obs = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        links.forEach((a) => a.classList.remove("active"));
        const a = links.get(en.target.id);
        if (a) { a.classList.add("active"); a.scrollIntoView({ block: "nearest" }); }
      }
    }, { rootMargin: "-20% 0px -70% 0px" });
    $$(".card", main).forEach((c) => obs.observe(c));
    spyCleanup = () => obs.disconnect();

    if (focusCard) requestAnimationFrame(() => scrollToCard(cardAnchor(focusCard), true));
    else window.scrollTo(0, 0);
  }

  function scrollToCard(id, flash) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("revealed");
    el.scrollIntoView({ behavior: flash ? "auto" : "smooth", block: "start" });
    if (flash) { el.classList.remove("flash-hl"); void el.offsetWidth; el.classList.add("flash-hl"); }
  }

  /* ---------- quick check (flashcards) ---------- */
  let quizKeyHandler = null;
  function viewQuiz(sid, uid) {
    const s = subjectById(sid);
    const u = R.units[`${sid}/${uid}`];
    if (!s || !u) return viewNotFound();
    setCrumbs([{ label: "Library", href: "#/" }, { label: s.title, href: `#/s/${sid}` }, { label: u.label, href: `#/s/${sid}/${uid}` }, { label: "Quick check" }]);
    document.title = `Quick check: ${u.label} — Cram Jam`;
    const qs = u.quiz;
    const res = new Array(qs.length).fill(null);
    let i = 0, shown = false;

    function render() {
      if (i >= qs.length) return renderDone();
      const q = qs[i];
      app.innerHTML = `
        <div class="quiz-wrap fade-in">
          <div class="quiz-head">
            <div><div class="eyebrow">${esc(u.label)} · Quick check</div><h1>${esc(u.title)}</h1></div>
            <a class="btn btn-sm" href="#/s/${sid}/${uid}">Back to cards</a>
          </div>
          <div class="quiz-progress">${qs.map((_, k) => `<i class="${res[k] === true ? "ok" : res[k] === false ? "miss" : k === i ? "cur" : ""}"></i>`).join("")}</div>
          <div class="flash">
            <div class="qnum">Question ${i + 1} of ${qs.length}</div>
            <div class="q">${q.q}</div>
            ${shown ? `<div class="a"><div class="a-label">Answer</div>${q.a || "<em>No answer in the sheet.</em>"}</div>` : ""}
            <div class="flash-actions">
              ${shown
                ? `<button class="btn btn-miss" data-r="0" type="button">✕ Missed it</button><button class="btn btn-got" data-r="1" type="button">✓ Got it</button>`
                : `<button class="btn btn-primary" data-show type="button">Reveal answer</button>`}
            </div>
          </div>
          <div class="keys">${shown ? "<kbd>1</kbd> missed · <kbd>2</kbd> got it" : "<kbd>space</kbd> reveal"} · <kbd>←</kbd> back</div>
        </div>`;
    }

    function renderDone() {
      const got = res.filter((r) => r === true).length;
      store.data.quiz[unitKey(u)] = { last: got, total: qs.length, at: Date.now() };
      store.save();
      const units = unitsOf(s);
      const next = units[units.indexOf(u) + 1];
      app.innerHTML = `
        <div class="quiz-wrap fade-in">
          <div class="flash quiz-done">
            <div class="eyebrow">${esc(u.label)} · Quick check complete</div>
            <div class="score">${got}<span style="color:var(--text-3);font-size:32px">/${qs.length}</span></div>
            <p class="muted">${got === qs.length ? "Clean sweep. Come back in a few days to lock it in." : "Re-read the cards behind the questions you missed, then try again."}</p>
            ${got < qs.length ? `<ul>${qs.map((q, k) => (res[k] ? "" : `<li class="miss">${q.q}</li>`)).join("")}</ul>` : ""}
            <div class="flash-actions">
              <button class="btn" data-restart type="button">Try again</button>
              <a class="btn" href="#/s/${sid}/${uid}">Back to cards</a>
              ${next ? `<a class="btn btn-primary" href="#/s/${sid}/${next.id}">Next: ${esc(next.label)} →</a>` : ""}
            </div>
          </div>
        </div>`;
    }

    function act(kind) {
      if (i >= qs.length) return;
      if (kind === "show" && !shown) { shown = true; render(); }
      else if ((kind === "got" || kind === "miss") && shown) { res[i] = kind === "got"; i++; shown = false; render(); }
      else if (kind === "back" && i > 0) { i--; res[i] = null; shown = false; render(); }
    }

    app.onclick = (e) => {
      if (e.target.closest("[data-show]")) act("show");
      const r = e.target.closest("[data-r]");
      if (r) act(r.dataset.r === "1" ? "got" : "miss");
      if (e.target.closest("[data-restart]")) { i = 0; res.fill(null); shown = false; render(); }
    };
    quizKeyHandler = (e) => {
      if (searchOpen()) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); act("show"); }
      else if (e.key === "1") act("miss");
      else if (e.key === "2") act("got");
      else if (e.key === "ArrowLeft") act("back");
    };
    document.addEventListener("keydown", quizKeyHandler);
    render();
  }

  /* ---------- review queue ---------- */
  function viewReview() {
    setCrumbs([{ label: "Library", href: "#/" }, { label: "Review" }]);
    document.title = "Review — Cram Jam";
    const items = allCards().filter((x) => cardStatus(x.key) === "miss");
    const rows = (list) => list.map(({ s, u, c, key }) => `
      <a class="review-item" href="#/s/${s.id}/${u.id}/c/${encodeURIComponent(c.id)}">
        <span class="card-num">${esc(c.id)}</span>
        <div><div style="font-weight:600">${esc(c.title)}</div><div class="src">${esc(s.title)} · ${esc(u.label)} · ${store.card(key).streak}/2 to clear</div></div>
        <span class="muted">→</span>
      </a>`).join("");
    app.innerHTML = `
      <div class="fade-in" style="max-width:860px;margin:0 auto">
        <div class="eyebrow">Review queue</div>
        <h1 style="font-size:clamp(28px,4vw,40px);font-weight:800;margin:10px 0 8px">Your misses list</h1>
        <p class="muted" style="margin:0 0 28px">Every card you marked <strong>Missed it</strong>. Start each session here. A card drops off after 2 correct reviews in a row.</p>
        ${items.length ? `<div class="review-list">${rows(items)}</div>`
          : `<div class="empty"><b>Nothing to review</b>Mark cards as <em>Missed it</em> while reading and they'll collect here.</div>`}
      </div>`;
  }

  function viewNotFound() {
    setCrumbs([{ label: "Library", href: "#/" }, { label: "Not found" }]);
    app.innerHTML = `<div class="empty fade-in"><b>Page not found</b><a class="btn" style="margin-top:14px" href="#/">Back to library</a></div>`;
  }

  /* ---------------- router ---------------- */
  function route() {
    const p0 = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    if (p0[0] === "s" && p0[3] === "c" && $("#unitMain") && route.current === `${p0[1]}/${p0[2]}`) {
      return scrollToCard(cardAnchor(p0[4]), true); // same unit: just jump to the card
    }
    route.current = null;
    if (spyCleanup) { spyCleanup(); spyCleanup = null; }
    if (quizKeyHandler) { document.removeEventListener("keydown", quizKeyHandler); quizKeyHandler = null; }
    app.onclick = null;
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return viewHome();
    if (parts[0] === "review") return viewReview();
    if (parts[0] === "s") {
      const [, sid, uid, a, b] = parts;
      if (!uid) return viewSubject(sid);
      if (a === "quiz") return viewQuiz(sid, uid);
      route.current = `${sid}/${uid}`;
      viewUnit(sid, uid, a === "c" ? b : null);
      return;
    }
    viewNotFound();
  }
  window.addEventListener("hashchange", route);

  /* ---------------- reading progress line ---------------- */
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    $("#progressLine").style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  }, { passive: true });

  /* ---------------- search ---------------- */
  let index = [];
  function buildIndex() {
    index = allCards().map(({ s, u, c }) => {
      const body = c.blocks.map((b) => (b.type === "code" ? b.code : b.type === "table" ? [...b.head, ...b.rows.flat()].map(stripTags).join(" ") : stripTags(b.html))).join(" ");
      return { s, u, c, title: c.title, titleL: c.title.toLowerCase(), body, bodyL: body.toLowerCase(), href: `#/s/${s.id}/${u.id}/c/${encodeURIComponent(c.id)}` };
    });
  }
  const searchOpen = () => !$("#searchOverlay").hidden;
  let sel = 0, results = [];
  function openSearch() {
    $("#searchOverlay").hidden = false;
    const inp = $("#searchInput");
    inp.value = ""; runSearch(""); setTimeout(() => inp.focus(), 10);
  }
  function closeSearch() { $("#searchOverlay").hidden = true; }
  function hl(text, terms) {
    let h = esc(text);
    for (const t of terms) if (t) h = h.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
    return h;
  }
  function runSearch(q) {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const box = $("#searchResults");
    if (!terms.length) {
      results = index.slice(0, 0);
      box.innerHTML = `<div class="sr-empty">Search ${plural(index.length, "card")} across every subject.<br/>Try <em>volatile</em>, <em>PECS</em>, <em>finally</em>, <em>BigDecimal</em>.</div>`;
      return;
    }
    results = index
      .map((it) => {
        let score = 0;
        for (const t of terms) {
          const inT = it.titleL.includes(t), inB = it.bodyL.includes(t);
          if (!inT && !inB) return null;
          score += (inT ? 10 : 0) + (inB ? Math.min(5, it.bodyL.split(t).length - 1) : 0);
        }
        return { it, score };
      })
      .filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 30).map((x) => x.it);
    sel = 0;
    if (!results.length) { box.innerHTML = `<div class="sr-empty">No cards match “${esc(q)}”.</div>`; return; }
    box.innerHTML = results.map((it, k) => {
      const pos = Math.max(0, it.bodyL.indexOf(terms[0]));
      const start = Math.max(0, pos - 60);
      const snip = (start ? "…" : "") + it.body.slice(start, start + 220);
      return `<a href="${it.href}" class="${k === 0 ? "sel" : ""}">
        <div class="sr-top"><span class="card-num">${esc(it.c.id)}</span><span class="sr-title">${hl(it.title, terms)}</span><span class="sr-src">${esc(it.s.title)} · ${esc(it.u.label)}</span></div>
        <div class="sr-snip">${hl(snip, terms)}</div></a>`;
    }).join("");
  }
  function moveSel(d) {
    const links = $$("#searchResults a");
    if (!links.length) return;
    sel = (sel + d + links.length) % links.length;
    links.forEach((a, k) => a.classList.toggle("sel", k === sel));
    links[sel].scrollIntoView({ block: "nearest" });
  }
  $("#searchOpen").addEventListener("click", openSearch);
  $("#searchOverlay").addEventListener("click", (e) => { if (e.target.id === "searchOverlay" || e.target.closest("#searchResults a")) closeSearch(); });
  $("#searchInput").addEventListener("input", (e) => runSearch(e.target.value));
  $("#searchInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
    else if (e.key === "Enter") { const a = $$("#searchResults a")[sel]; if (a) { location.hash = a.getAttribute("href"); closeSearch(); } }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchOpen() ? closeSearch() : openSearch(); }
    else if (e.key === "Escape" && searchOpen()) closeSearch();
    else if (e.key === "/" && !searchOpen() && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ---------------- copy buttons ---------------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("pre.code .copy");
    if (!b) return;
    const code = b.parentElement.querySelector("code").textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(
      () => { b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1200); },
      () => { b.textContent = "Select & copy"; }
    );
  });

  /* ---------------- theme ---------------- */
  $("#themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("recall.theme", next); } catch (e) {}
  });

  function updateBadge() {
    const n = allCards().filter((x) => cardStatus(x.key) === "miss").length;
    const b = $("#reviewBadge");
    b.hidden = !n; b.textContent = n;
  }

  /* ---------------- boot: load unit files ---------------- */
  function loadScript(src) {
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res;
      s.onerror = () => { console.warn("Could not load", src); res(); };
      document.head.appendChild(s);
    });
  }
  store.load();
  app.innerHTML = `<div class="empty" style="border:0">Loading library…</div>`;
  Promise.all(R.subjects.flatMap((s) => s.units.map((u) => loadScript(u.file)))).then(() => {
    buildIndex();
    updateBadge();
    route();
  });
})();
