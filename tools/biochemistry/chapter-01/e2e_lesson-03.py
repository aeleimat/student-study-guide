"""Chapter checks for Biochemistry Chapter 1, lesson 3 (chemical and nutritional classification), derived from
BEATS: playback, replay of every lesson beat, quiz card layout at two viewport sizes, the answers, practice (every
question, every grid row wrong, every card measured at 1440x900) and finish card.
Adapted from tools/biology/chapter-09/e2e_lesson-05.py.

    python SKILL/scripts/serve.py 8765 site &
    URL=http://localhost:8765/biochemistry/chapter-01/lesson-03/ uv run --with playwright python tools/biochemistry/chapter-01/e2e_lesson-03.py      # BROWSER=firefox too
"""
import asyncio, os
from playwright.async_api import async_playwright
URL = os.environ.get("URL", "http://localhost:8765/biochemistry/chapter-01/lesson-03/")
# Question beat id -> one step per question in turn: a digit picks a choice (1 = first); '=a,b' fills the boxes in the
# order they appear on the card and checks; '#2;1+3' answers a grid (rows split by ';', each row's columns counted from
# 1, '+' for several, '#2;;1' a row left empty) and checks; '@2' clicks the 2nd target ring on the stage.
ANSWERS = {
    "q1": ["3"], "q2": ["2"],
    "final1": ["2", "#1;2;3", "3", "1", "#1;2;1;2", "2", "4"],
}
# One all-wrong answer per question (same step syntax): every grid row wrong, so every row shows its "why" line.
WRONG = {
    "q1": ["1"], "q2": ["1"],
    "final1": ["1", "#2;3;1", "1", "2", "#2;1;2;1", "1", "1"],
}

# The frame reached by seeking straight to t equals the one reached by stepping through the beat (replays are exact).
SAME_FRAME = r"""
([i, t]) => {
  const snap = () => scene.innerHTML.replace(/(cam)\d+/g, '$1#').replace(/(\d+\.\d{2})\d+/g, '$1');
  seek(i, false); P.t = t; evalTo(t); const a = snap();
  seek(i, false); for (let u = 0; u < t; u += 1 / 60) evalTo(u); evalTo(t);
  return a === snap();
}
"""
# The open quiz card: prompt width and lines, every control inside the card (a stage-tap question's card has none:
# its targets are on the picture), card bottom on the 900-high stage.
# Lines count the prompt's prose: a table, figure or picture in the prompt is taken out of its height.
CARD = r"""
() => {
  const st = document.getElementById('stage').getBoundingClientRect(), k = st.width / 1600;
  const c = document.querySelector('.card.quiz'), pe = c.querySelector('.prompt'), cr = c.getBoundingClientRect(), pr = pe.getBoundingClientRect();
  const blocks = [...pe.querySelectorAll('table, figure, img')].filter(e => !e.parentElement.closest('table, figure'));
  const prose = pr.height - blocks.reduce((s, e) => s + e.getBoundingClientRect().height, 0);
  const lines = prose / (parseFloat(getComputedStyle(pe).lineHeight) * k);
  const ctl = [...c.querySelectorAll('.opt, input.box, .btn:not([hidden])')].map(b => b.getBoundingClientRect());
  const inside = b => b.width > 0 && b.left >= cr.left - 1 && b.right <= cr.right + 1 && b.top >= cr.top - 1 && b.bottom <= cr.bottom + 1;
  return { promptW: pr.width / k, lines, ok: ctl.every(inside), bottom: (cr.bottom - st.top) / k };
}
"""

# After Check: every answer row (grid rows with their why lines, choices, blank rows), the feedback and the visible
# buttons sit inside the card and on the stage, no two of them overlap, and nothing in the card scrolls or is clipped.
FIT = r"""
() => {
  const st = document.getElementById('stage').getBoundingClientRect();
  const c = document.querySelector('.card.quiz'), cr = c.getBoundingClientRect();
  const gridRows = [...c.querySelectorAll('.grid .row')];
  const rows = gridRows.length ? gridRows : [...c.querySelectorAll('.opt, .blanks .row, .blanks > *')].filter(e => !e.closest('.grid'));
  const fb = [...c.querySelectorAll('.fb')].filter(e => e.textContent.trim());
  const btns = [...c.querySelectorAll('.btn:not([hidden])')].filter(e => e.getBoundingClientRect().width > 0);
  const items = [...rows.map((e, i) => ['row ' + (i + 1), e]), ...fb.map(e => ['feedback', e]), ...btns.map(e => ['button ' + e.textContent.trim(), e])];
  const R = items.map(([n, e]) => [n, e.getBoundingClientRect()]);
  const bad = [];
  R.forEach(([n, r]) => { if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1 || r.bottom > st.bottom + 1) bad.push(n + ' outside the card'); });
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const [a, A] = R[i], [b, B] = R[j];
    if (Math.min(A.right, B.right) - Math.max(A.left, B.left) > 1 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 1 && !items[i][1].contains(items[j][1]) && !items[j][1].contains(items[i][1])) bad.push(a + ' overlaps ' + b);
  }
  [c, ...c.querySelectorAll('*')].forEach(e => { const cs = getComputedStyle(e); if (cs.overflowY !== 'visible' && e.scrollHeight > e.clientHeight + 1) bad.push((e.className || e.tagName) + ' scrolls'); });
  const whys = gridRows.filter(e => e.querySelector('.why')?.textContent.trim()).length;
  return { n: rows.length, whys, bad };
}
"""

async def answer(pg, s):
    if s.startswith("="):
        for j, v in enumerate(s[1:].split(",")):
            box = pg.locator(".card input.box").nth(j); await box.fill(""); await box.fill(v)
        await pg.keyboard.press("Enter")
    elif s.startswith("#"):
        rows = pg.locator(".card.quiz .grid .row")
        for r, cols in enumerate(s[1:].split(";")):
            for c in filter(None, cols.split("+")): await rows.nth(r).locator(".opt").nth(int(c) - 1).click()   # '' = a row left empty
        await pg.keyboard.press("Enter")
    elif s.startswith("@"): await pg.locator("#stage .ring").nth(int(s[1:]) - 1).click()
    else: await pg.locator(".card.quiz .opt").nth(int(s) - 1).click()   # a choice grades on the click (a fresh page has no keyboard focus yet)
    await pg.wait_for_timeout(600)   # let the card settle (feedback grows in)

# Every question in a fresh page at 1440x900: the all-wrong answer, the card measured; then the right answer, measured.
async def wrong_then_right(b, found):
    pg = await b.new_page(viewport={"width": 1440, "height": 900})
    await pg.goto(URL); await pg.wait_for_timeout(600)
    if await pg.locator("#cover").is_visible(): await pg.click("#cover"); await pg.wait_for_timeout(300)   # the start cover
    ids = await pg.evaluate("BEATS.map(b => b.id)")
    n = 0
    for bid, steps in WRONG.items():
        await pg.evaluate(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
        for w, r in zip(steps, ANSWERS[bid]):
            await answer(pg, w)
            fb = await pg.inner_text(".card .fb")
            if "Correct" in fb or not fb.strip(): found.append(f"{bid}: wrong answer {w!r} gave {fb[:80]!r}")
            m = await pg.evaluate(FIT)
            if m["bad"]: found.append(f"{bid} all wrong ({w}): {m}")
            if w.startswith("#") and m["whys"] != m["n"]: found.append(f"{bid} all wrong ({w}): {m['whys']} of {m['n']} rows show a why line")
            await answer(pg, r)
            fb = await pg.inner_text(".card .fb")
            if "Correct" not in fb: found.append(f"{bid}: right answer {r!r} after a wrong one gave {fb[:80]!r}")
            m = await pg.evaluate(FIT)
            if m["bad"]: found.append(f"{bid} right ({r}): {m}")
            n += 1
            await pg.keyboard.press("Enter"); await pg.wait_for_timeout(250)
    await pg.close()
    return n
async def main():
    async with async_playwright() as p:
        ff = os.environ.get("BROWSER") == "firefox"
        b = await (p.firefox.launch(firefox_user_prefs={"media.autoplay.default": 0}) if ff else p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]))
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []; found = []   # non-fatal findings: the run goes on so every beat is covered
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        await pg.goto(URL); await pg.wait_for_timeout(600)
        ev, key = pg.evaluate, (lambda k: pg.keyboard.press(k))
        ids = await ev("BEATS.map(b => b.id)")
        asks = await ev("BEATS.map(b => !!b.ask)")

        await key("Space")
        for _ in range(20):   # a loaded machine can take a few seconds to start the first clip
            await pg.wait_for_timeout(500)
            if await ev("P.playing && P.t > 1"): break
        assert await ev("P.playing && P.t > 1"), "lesson plays"
        await key("Space"); t1 = await ev("P.t"); await pg.wait_for_timeout(600)
        assert await ev(f"!P.playing && P.t === {t1}"), "pause freezes"

        for i, bid in enumerate(ids):
            if asks[i]: continue
            d = await ev(f"TIMINGS['{bid}'].dur")
            for t in (round(d * .55, 2), round(d - .3, 2)):
                if not await ev(SAME_FRAME, [i, t]): found.append(f"beat {bid} at {t} s does not replay the same frame")

        for vw, vh in [(1280, 800), (1920, 1080)]:
            await pg.set_viewport_size({"width": vw, "height": vh})
            for i, bid in enumerate(ids):
                if not asks[i] or bid == "finish": continue
                await ev(f"seek({i}, true)"); await pg.wait_for_timeout(700)
                m = await ev(CARD)
                if not (m["promptW"] > 400 and m["lines"] <= 4 and m["ok"] and m["bottom"] <= 901): found.append(f"quiz card {bid} at {vw}x{vh}: {m}")
        await pg.set_viewport_size({"width": 1440, "height": 900})

        for bid, steps in ANSWERS.items():
            await ev(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
            for qi, s in enumerate(steps):
                m = await ev(CARD)
                if not (m["ok"] and m["bottom"] <= 901): found.append(f"card {bid} #{qi} at 1440x900: {m}")
                await pg.screenshot(path=f"books/biochemistry/review/chapter-01/lesson-03/card_{bid}_{qi}.png")
                if s.startswith("="):
                    for j, v in enumerate(s[1:].split(",")): await pg.locator(".card input.box").nth(j).fill(v)
                    await key("Enter")
                elif s.startswith("#"):
                    rows = pg.locator(".card.quiz .grid .row")
                    for r, cols in enumerate(s[1:].split(";")):
                        for c in filter(None, cols.split("+")): await rows.nth(r).locator(".opt").nth(int(c) - 1).click()   # '' = a row left empty
                    await key("Enter")
                elif s.startswith("@"): await pg.locator("#stage .ring").nth(int(s[1:]) - 1).click()   # grades on the click
                else: await key(s)
                assert "Correct" in await pg.inner_text(".card .fb"), (bid, s)
                await key("Enter"); await pg.wait_for_timeout(250)
        assert await ev("BEATS[P.i].id") == "finish" and await pg.is_visible(".card.fin"), "practice leads to the finish card"
        n = await ev("CHAPTER.number")
        label = await ev("CHAPTER.label")
        fin = (await pg.inner_text(".card.fin")).lower()
        if f"chapter {label} complete" not in fin.lower(): found.append(f"finish card text lacks 'chapter {label} complete': {fin[:200]!r}")
        done = await ev("JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY))")
        if n not in done["done"]: found.append(f"chapter {n} not marked done in progress: {done}")

        for i in range(len(ids)): await ev(f"seek({i}, false)")   # every beat rebuilds without errors
        nw = await wrong_then_right(b, found)
        print(f"all wrong then right: {nw} questions measured at 1440x900")
        assert not errs, errs
        print("findings:", *found, sep="\n  ") if found else print("findings: none")
        print(f"{URL} ({len(ids)} beats, {'firefox' if ff else 'chromium'}): playback, replay, quiz layout, answers, finish - ran")
        await b.close()

asyncio.run(main())
