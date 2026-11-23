"""Chapter checks for Chapter 9, lesson 3 (Cellular respiration: the three stages and the ATP share), derived from BEATS:
playback, replay of every lesson beat, quiz card layout at two viewport sizes, the answers, every practice card
(measured and screenshotted at 1440x900 for clipping), practice and finish card.
Adapted from tools/biology/chapter-08/e2e_lesson-05.py.

    python SKILL/scripts/serve.py 8765 site &
    URL=http://localhost:8765/biology/chapter-09/lesson-03/ uv run --with playwright python tools/biology/chapter-09/e2e_lesson-03.py      # BROWSER=firefox too
"""
import asyncio, os
from playwright.async_api import async_playwright
URL = os.environ.get("URL", "http://localhost:8765/biology/chapter-09/lesson-03/")
# Screenshots go to the scratch folder, not the book (this check changes nothing in the repo).
OUT = os.environ.get("OUT", "C:/Users/User/AppData/Local/Temp/claude/2d1f8602bf52e885/54ec9334-46a4-42ac-853e-55baec3e8566/scratchpad/chk-0903")
os.makedirs(OUT, exist_ok=True)
# Question beat id -> one step per question in turn: a digit picks a choice (1 = first); '=a,b' fills the boxes in the
# order they appear on the card and checks; '#2;1+3' answers a grid (rows split by ';', each row's columns counted from
# 1, '+' for several, '#2;;1' a row left empty) and checks; '@2' clicks the 2nd target ring on the stage.
ANSWERS = {
    "q1": ["2"],                 # c-where: the cytosol (choice index 1)
    "q2": ["4"],                 # c-most: oxidative phosphorylation (choice index 3)
    "final1": [
        "2",                     # p-order: glycolysis, citric acid cycle, oxidative phosphorylation (choice index 1)
        "#1;2;2;2",              # p-where: glycolysis cytosol; the other three mitochondrion (columns cytosol 1, mitochondrion 2)
        "=90",                   # p-share: almost 90 %
        "2",                     # p-carry: NADH and FADH2 (choice index 1)
        "#1;1;2;2;1",            # p-sub: hand-off, cycle's star, redox, 90 %, glycolysis's star (columns S 1, O 2)
    ],
}
PRACTICE_IDS = ["p-order", "p-where", "p-share", "p-carry", "p-sub"]

# The frame reached by seeking straight to t equals the one reached by stepping through the beat (replays are exact).
SAME_FRAME = r"""
([i, t]) => {
  const snap = () => scene.innerHTML.replace(/(cam)\d+/g, '$1#').replace(/(\d+\.\d{2})\d+/g, '$1');
  seek(i, false); P.t = t; evalTo(t); const a = snap();
  seek(i, false); for (let u = 0; u < t; u += 1 / 60) evalTo(u); evalTo(t);
  return a === snap();
}
"""
# The open quiz card: prompt width and lines, every control inside the card, card bottom on the 900-high stage, and
# whether the card's content overflows its box (a clipped row or grid). Lines count the prompt's prose only: a table,
# figure or picture in the prompt is taken out of its height.
CARD = r"""
() => {
  const st = document.getElementById('stage').getBoundingClientRect(), k = st.width / 1600;
  const c = document.querySelector('.card.quiz'), pe = c.querySelector('.prompt'), cr = c.getBoundingClientRect(), pr = pe.getBoundingClientRect();
  const blocks = [...pe.querySelectorAll('table, figure, img')].filter(e => !e.parentElement.closest('table, figure'));
  const prose = pr.height - blocks.reduce((s, e) => s + e.getBoundingClientRect().height, 0);
  const lines = prose / (parseFloat(getComputedStyle(pe).lineHeight) * k);
  const ctl = [...c.querySelectorAll('.opt, input.box, .btn:not([hidden])')].map(b => b.getBoundingClientRect());
  const inside = b => b.width > 0 && b.left >= cr.left - 1 && b.right <= cr.right + 1 && b.top >= cr.top - 1 && b.bottom <= cr.bottom + 1;
  const overflow = Math.max(0, c.scrollHeight - c.clientHeight, c.scrollWidth - c.clientWidth);
  return { promptW: Math.round(pr.width / k), lines: Math.round(lines * 10) / 10, ok: ctl.every(inside), overflow, bottom: Math.round((cr.bottom - st.top) / k) };
}
"""

def card_problems(m):
    out = []
    if not (m["promptW"] > 400 and m["lines"] <= 4): out.append("prompt too narrow or too many lines")
    if not m["ok"]: out.append("a control sits outside the card")
    if m["overflow"] > 1: out.append(f"card content overflows its box by {m['overflow']} px")
    if m["bottom"] > 901: out.append("card bottom below the stage")
    return out

async def main():
    async with async_playwright() as p:
        ff = os.environ.get("BROWSER") == "firefox"
        name = "firefox" if ff else "chromium"
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
        # Firefox sometimes holds the clock at 0 for several seconds on first load (the first beat's audio); poll, and report a slow start.
        started = None
        for tick in range(40):
            await pg.wait_for_timeout(250)
            if await ev("P.playing && P.t > 1"): started = (tick + 1) * .25; break
        assert started is not None, "lesson plays"
        if started > 2: found.append(f"playback took {started:.2f} s to start moving (first load)")
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
                if card_problems(m): found.append(f"quiz card {bid} at {vw}x{vh}: {card_problems(m)} {m}")
        await pg.set_viewport_size({"width": 1440, "height": 900})

        for bid, steps in ANSWERS.items():
            await ev(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(1500)
            for k, s in enumerate(steps):
                # every card (side quick checks and each practice card) measured and shot at 1440x900, unique file per card
                card_id = PRACTICE_IDS[k] if bid == "final1" else bid
                m = await ev(CARD)
                probs = card_problems(m)
                print(f"{card_id}: {m} {'OK' if not probs else probs}")
                if probs: found.append(f"card {card_id} at 1440x900: {probs} {m}")
                await pg.screenshot(path=f"{OUT}/{name}_{card_id}.png")
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
                fb = await pg.inner_text(".card .fb")
                if "Correct" not in fb: found.append(f"{card_id}: answer {s!r} not marked Correct: {fb[:120]!r}")
                await key("Enter"); await pg.wait_for_timeout(250)
        assert await ev("BEATS[P.i].id") == "finish" and await pg.is_visible(".card.fin"), "practice leads to the finish card"
        n = await ev("CHAPTER.number")
        label = await ev("CHAPTER.label")   # '9, lesson 3'
        fin = (await pg.inner_text(".card.fin")).lower()
        if f"chapter {label} complete" not in fin.lower(): found.append(f"finish card text lacks 'chapter {label} complete': {fin[:200]!r}")
        done = await ev("JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY))")
        if n not in done["done"]: found.append(f"chapter {n} not marked done in progress: {done}")

        for i in range(len(ids)): await ev(f"seek({i}, false)")   # every beat rebuilds without errors
        assert not errs, errs
        print("findings:", *found, sep="\n  ") if found else print("findings: none")
        print(f"{URL} ({len(ids)} beats, {name}): playback, replay, quiz layout, answers, practice cards, finish - ran")
        await b.close()

asyncio.run(main())
