"""Chapter checks for Chapter 8, lesson 4 (ATP and energy coupling), derived from BEATS: playback,
replay of every lesson beat, quiz card layout at two viewport sizes, the answers, practice and finish card.
Adapted from tools/biology/chapter-07/e2e_lesson-05.py.

    python SKILL/scripts/serve.py 8765 site &
    URL=http://localhost:8765/biology/chapter-08/lesson-04/ uv run --with playwright python tools/biology/chapter-08/e2e_lesson-04.py      # BROWSER=firefox too
"""
import asyncio, os
from playwright.async_api import async_playwright
URL = os.environ.get("URL", "http://localhost:8765/biology/chapter-08/lesson-04/")
# Question beat id -> one step per question in turn: a digit picks a choice (1 = first); '=a,b' fills the boxes in the
# order they appear on the card and checks; '#2;1+3' answers a grid (rows split by ';', each row's columns counted from
# 1, '+' for several, '#2;;1' a row left empty) and checks; '@2' clicks the 2nd target ring on the stage.
ANSWERS = {
    "q1": ["1"],                              # c-source: the change to products with lower free energy (first choice)
    "q2": ["#2;1;1;2;1"],                     # c-direction: endergonic, exergonic, exergonic, endergonic, exergonic (columns: exergonic 1, endergonic 2)
    "final1": [
        "1",                                  # p-work: transport work, then mechanical work (first choice)
        "#1;2;2;1",                           # p-atpadp: ATP, ADP, ADP, ATP
        "1",                                  # p-net: -2.3 kcal/mol (first choice)
        "2",                                  # p-inter: glutamic acid carrying a phosphate group (second choice)
        "3",                                  # p-regen: catabolic reactions (third choice)
        "=1,2,3,4",                           # p-order: one box a row: hydrolysis 1, energy released 2, work 3, rebuilt 4
    ],
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
                if not (m["promptW"] > 400 and m["lines"] <= 4 and m["ok"] and m["bottom"] <= 901): found.append(f"quiz card {bid} at {vw}x{vh}: {m}")
        await pg.set_viewport_size({"width": 1440, "height": 900})

        for bid, steps in ANSWERS.items():
            await ev(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
            for s in steps:
                if bid == "final1":   # every practice question's card, not just the first (1440x900)
                    m = await ev(CARD)
                    if not (m["promptW"] > 400 and m["lines"] <= 4 and m["ok"] and m["bottom"] <= 901): found.append(f"quiz card final1 step {s} at 1440x900: {m}")
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
        label = await ev("CHAPTER.label")   # '8, lesson 4'
        fin = (await pg.inner_text(".card.fin")).lower()
        if f"chapter {label} complete" not in fin.lower(): found.append(f"finish card text lacks 'chapter {label} complete': {fin[:200]!r}")
        done = await ev("JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY))")
        if n not in done["done"]: found.append(f"chapter {n} not marked done in progress: {done}")

        for i in range(len(ids)): await ev(f"seek({i}, false)")   # every beat rebuilds without errors
        assert not errs, errs
        print("findings:", *found, sep="\n  ") if found else print("findings: none")
        print(f"{URL} ({len(ids)} beats, {'firefox' if ff else 'chromium'}): playback, replay, quiz layout, answers, finish - ran")
        await b.close()

asyncio.run(main())
