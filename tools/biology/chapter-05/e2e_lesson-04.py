"""Chapter checks, derived from BEATS: playback, replay of every lesson beat, quiz card layout at two viewport sizes,
the answers, practice and finish card. Copy to tools/<book>/e2e_chNN.py and fill ANSWERS; add checks of your own
(readouts that must agree with the motion at a moment, wrong-answer feedback) where the chapter needs them.

    python3 SKILL/scripts/serve.py 8765 site &
    URL=http://localhost:8765/BOOK/chNN/ uv run --with playwright tools/BOOK/e2e_chNN.py      # BROWSER=firefox too
"""
import asyncio, os
from playwright.async_api import async_playwright
URL = os.environ.get("URL", "http://localhost:8765/biology/chapter-05/lesson-04/")
# Question beat id -> one step per question in turn: '1'..'9' picks a choice; '=a,b' fills the boxes and checks;
# '#2;1+3' answers a grid (rows split by ';', each row's columns counted from 1, '+' for several, '#2;;1' a row left empty) and checks;
# '@2' clicks the 2nd target ring on the stage (tap, tapEls, pickEls: in the order of their values, idx or items).
ANSWERS = {
    "q1": ["1"],                              # c-link: 3' OH to the next 5' phosphate (index 0)
    "q3": ["=35,15"],                         # c-pct2: 35 % G -> C 35, A 15
    "q2": ["=T,G,G,C,A,T"],                   # c-comp: partner of 5' ATGCCA 3', from its 5' end
    "final1": [
        "=22,28,28",                          # p-pct: 22 % A -> T 22, G 28, C 28
        "2",                                  # p-bond: phosphodiester bond (index 1)
        "3",                                  # p-copy: one old + one new (index 2)
        "=G,C,T,A,A",                         # p-comp: partner of 5' TTAGC 3', read 5' to 3'
        "#1;2;1;2;1",                         # p-terms: T F T F T
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
        fin = (await pg.inner_text(".card.fin")).lower()
        if "lesson 4 complete" not in fin: found.append(f"finish card text lacks 'lesson 4 complete' (book numbers this chapter 5, lesson 4): {fin[:200]!r}")
        done = await ev("JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY))")
        if n not in done["done"]: found.append(f"chapter {n} not marked done in progress: {done}")

        # the letter boxes: a wrong strand (the partner read 3' to 5') is marked wrong, and Show answer fills the right one
        await ev(f"seek({ids.index('q2')}, true)"); await pg.wait_for_timeout(500)
        for j, v in enumerate("TACGGT"): await pg.locator(".card input.box").nth(j).fill(v)
        await key("Enter")
        if "Correct" in await pg.inner_text(".card .fb"): found.append("q2 accepts the partner read 3' to 5'")
        await key("Escape"); await key("s"); vals = await ev("[...document.querySelectorAll('.card input.box')].map(b => b.value).join('')")
        if vals != "TGGCAT": found.append(f"q2 Show answer fills {vals!r}")
        if await ev("Q2_ANS") != "TGGCAT" or await ev("JSON.stringify(PRACT)") != '{"A":22,"T":22,"G":28,"C":28}' or await ev("[REV_READ, PC_ANS, Q3.C, Q3.A].join()") != "GAATC,GCTAA,35,15": found.append("computed answers changed")

        for i in range(len(ids)): await ev(f"seek({i}, false)")   # every beat rebuilds without errors
        assert not errs, errs
        print("findings:", *found, sep="\n  ") if found else print("findings: none")
        print(f"{URL} ({len(ids)} beats, {'firefox' if ff else 'chromium'}): playback, replay, quiz layout, answers, finish - ran")
        await b.close()

asyncio.run(main())
