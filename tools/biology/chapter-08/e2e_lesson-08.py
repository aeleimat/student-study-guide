"""Lesson checks for Biology, Chapter 8, lesson 8 (allosteric regulation and feedback inhibition), derived from BEATS:
playback, replay of every lesson beat, quiz card layout at two viewport sizes, a wrong then a right answer to every
question (in a second page), the answers, practice and finish card. Adapted from tools/biology/chapter-08/e2e_lesson-08.py.

    python3 SKILL/scripts/serve.py 8765 site &
    URL=http://localhost:8765/biology/chapter-08/lesson-08/ uv run --with playwright python tools/biology/chapter-08/e2e_lesson-08.py
    URL=... BROWSER=firefox uv run --with playwright python tools/biology/chapter-08/e2e_lesson-08.py
"""
import asyncio, os
from playwright.async_api import async_playwright
URL = os.environ.get("URL", "http://localhost:8765/biology/chapter-08/lesson-08/")
# Question beat id -> one step per question in turn: '1'..'9' picks a choice; '=a,b' fills the boxes and checks;
# '#2;1+3' answers a grid (rows split by ';', each row's columns counted from 1, '+' for several, '#2;;1' a row left empty) and checks;
# '@2' clicks the 2nd target ring on the stage.
ANSWERS = {
    "q1": ["#1;2;1;2;2"],                     # c-sites: substrate active, regulator regulatory, competitive active, away regulatory, isoleucine regulatory
    "q2": ["2"],                              # c-iso: binds the allosteric site, pathway off (2nd)
    "final1": [
        "3",                                  # p-ways: genes on/off or enzyme activity (3rd)
        "#1;2;2",                             # p-effect: activator active, inhibitor inactive, red inactive
        "=1,4,4",                             # p-count: enzyme 1, four intermediates, four subunits
        "3",                                  # p-coop: stabilizes the active form (3rd)
        "3",                                  # p-used: lets go, site available, restarts (3rd)
        "4",                                  # p-why: no waste (4th)
    ],
}
# A wrong first try for every question: the card must not say Correct and must show a hint; then the right answer.
WRONG = {
    "q1": ["#2;1;2;1;1"],
    "q2": ["1"],
    "final1": ["1", "#2;1;1", "=2,5,3", "1", "1", "1"],
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
  // nothing in the card cut off: no row, blank line or option wider than its box, no scrolling inside the card
  const clip = [...c.querySelectorAll('*')].filter(e => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width && (r.right > cr.right + 1 || r.bottom > cr.bottom + 1 || r.left < cr.left - 1)) return true;
    return cs.overflowY !== 'visible' && e.scrollHeight > e.clientHeight + 1 || cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 1;
  }).length;
  return { promptW: pr.width / k, lines, ok: ctl.every(inside), bottom: (cr.bottom - st.top) / k, clip };
}
"""

def card_ok(m): return m["promptW"] > 400 and m["lines"] <= 4 and m["ok"] and m["bottom"] <= 901 and not m["clip"]

async def answer(pg, s):
    if s.startswith("="):
        for j, v in enumerate(s[1:].split(",")): await pg.locator(".card input.box").nth(j).fill(v)
        await pg.keyboard.press("Enter")
    elif s.startswith("#"):
        rows = pg.locator(".card.quiz .grid .row")
        for r, cols in enumerate(s[1:].split(";")):
            for c in filter(None, cols.split("+")): await rows.nth(r).locator(".opt").nth(int(c) - 1).click()   # '' = a row left empty
        await pg.keyboard.press("Enter")
    elif s.startswith("@"): await pg.locator("#stage .ring").nth(int(s[1:]) - 1).click()   # grades on the click
    else: await pg.keyboard.press(s)
    await pg.wait_for_timeout(600)   # let the card settle (feedback grows in)

async def wrong_then_right(b, found):
    pg = await b.new_page(viewport={"width": 1440, "height": 900})
    await pg.goto(URL); await pg.wait_for_timeout(600)
    ids = await pg.evaluate("BEATS.map(b => b.id)")
    await pg.keyboard.press("Space"); await pg.wait_for_timeout(300)
    n = 0
    for bid, steps in WRONG.items():
        await pg.evaluate(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
        for w, r in zip(steps, ANSWERS[bid]):
            await answer(pg, w)
            m = await pg.evaluate(CARD)
            if not card_ok(m): found.append(f"quiz card {bid} after the wrong answer {w!r}: {m}")
            fb = await pg.inner_text(".card .fb")
            if "Correct" in fb or not fb.strip(): found.append(f"{bid}: wrong answer {w!r} gave {fb[:80]!r}")
            await answer(pg, r)
            fb = await pg.inner_text(".card .fb")
            if "Correct" not in fb: found.append(f"{bid}: right answer {r!r} after a wrong one gave {fb[:80]!r}")
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

        await key("Space"); await pg.wait_for_timeout(2500)
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
                if not card_ok(m): found.append(f"quiz card {bid} at {vw}x{vh}: {m}")
        await pg.set_viewport_size({"width": 1440, "height": 900})

        for bid, steps in ANSWERS.items():
            await ev(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
            for qi, s in enumerate(steps):
                m = await ev(CARD)   # every question of the beat, before and after answering
                if not card_ok(m): found.append(f"quiz card {bid} question {qi + 1}: {m}")
                await answer(pg, s)
                assert "Correct" in await pg.inner_text(".card .fb"), (bid, s)
                m = await ev(CARD)
                if not card_ok(m): found.append(f"quiz card {bid} question {qi + 1} answered: {m}")
                await key("Enter"); await pg.wait_for_timeout(250)
        assert await ev("BEATS[P.i].id") == "finish" and await pg.is_visible(".card.fin"), "practice leads to the finish card"
        n = await ev("CHAPTER.number")
        fin = (await pg.inner_text(".card.fin")).lower()
        if "complete" not in fin: found.append(f"finish card text lacks 'complete': {fin[:200]!r}")
        done = await ev("JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY))")
        if n not in done["done"]: found.append(f"chapter {n} not marked done in progress: {done}")

        for i in range(len(ids)): await ev(f"seek({i}, false)")   # every beat rebuilds without errors
        nw = await wrong_then_right(b, found)
        print(f"wrong-then-right: {nw} questions walked")
        assert not errs, errs
        print("findings:", *found, sep="\n  ") if found else print("findings: none")
        print(f"{URL} ({len(ids)} beats, {'firefox' if ff else 'chromium'}): playback, replay, quiz layout, answers, finish - ran")
        await b.close()

asyncio.run(main())
