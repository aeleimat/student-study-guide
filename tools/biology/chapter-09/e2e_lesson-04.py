"""Chapter checks for Chapter 9, lesson 4 (Glycolysis), derived from BEATS: playback, replay of every lesson beat,
quiz card layout at two viewport sizes (every practice card at 1440x900 too: clipping and overflow), the answers, every
card answered all wrong (rows, why lines and buttons inside the card, none covered),
practice and finish card. Adapted from tools/biology/chapter-08/e2e_lesson-05.py.

    python SKILL/scripts/serve.py 8765 site &
    URL=http://localhost:8765/biology/chapter-09/lesson-04/ uv run --with playwright python tools/biology/chapter-09/e2e_lesson-04.py      # BROWSER=firefox too
"""
import asyncio, os
from playwright.async_api import async_playwright
URL = os.environ.get("URL", "http://localhost:8765/biology/chapter-09/lesson-04/")
SHOTS = r"C:/Users/User/AppData/Local/Temp/claude/2d1f8602bf52e885/54ec9334-46a4-42ac-853e-55baec3e8566/scratchpad/chk-0904/"
os.makedirs(SHOTS, exist_ok=True)
# Question beat id -> one step per question in turn: a digit picks a choice (1 = first); '=a,b' fills the boxes in the
# order they appear on the card and checks; '#2;1+3' answers a grid (rows split by ';', each row's columns counted from
# 1, '+' for several, '#2;;1' a row left empty) and checks; '@2' clicks the 2nd target ring on the stage.
ANSWERS = {
    "q1": ["2"],                                  # c-phos: makes the sugar more reactive and traps it (choice index 1)
    "q2": ["2"],                                  # c-split: two different three-carbon sugars (choice index 1)
    "final1": [
        "3",                                      # p-where: the cytosol (choice index 2)
        "=2,4,2",                                 # p-net: 2 used, 4 formed, net 2
        "3",                                      # p-sub: enzyme moves a phosphate to ADP (choice index 2)
        "2",                                      # p-redox: G3P oxidized, NAD+ reduced (choice index 1)
        "#1;2;2",                                 # p-yield: true (col 1) / false (col 2) rows
        "=20,20",                                 # p-ten: 10 x 2 ATP, 10 x 2 NADH
    ],
}

# Every card answered all wrong (a wrong choice, wrong numbers, every grid row flipped), measured after Check and again
# after Show answer: every row, option, box, why line and the feedback inside the card and not clipped by the scrolling
# body, and the visible buttons over none of them.
WRONG = {
    "q1": ["1"], "q2": ["1"],
    "final1": ["1", "=1,1,1", "1", "1", "#2;1;1", "=1,1"],
}
WRONG_CARD = r"""
() => {
  const c = document.querySelector('.card.quiz'), cr = c.getBoundingClientRect(), R = e => e.getBoundingClientRect();
  const vis = e => { const b = R(e); return b.width > 0 && b.height > 0; };
  const items = [...c.querySelectorAll('.opt, .row, .brow, .why, input.box, .fb')].filter(vis);
  const btns = [...c.querySelectorAll('.acts .btn:not([hidden])')].filter(vis);
  const inside = b => b.left >= cr.left - 1 && b.right <= cr.right + 1 && b.top >= cr.top - 1 && b.bottom <= cr.bottom + 1;
  const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  const body = c.querySelector('.body'), bb = body && R(body);
  const bad = [];
  items.forEach(e => { if (!inside(R(e))) bad.push('outside card: ' + e.className); });
  items.forEach(e => { if (bb && body.contains(e) && (R(e).bottom > bb.bottom + 1 || R(e).top < bb.top - 1)) bad.push('clipped by body: ' + e.className); });
  if (body && body.scrollHeight > body.clientHeight + 2) bad.push('body scrolls');
  btns.forEach(b => { if (!inside(R(b))) bad.push('button outside card: ' + b.textContent); items.forEach(e => { if (hit(R(b), R(e))) bad.push(b.textContent + ' covers ' + e.className); }); });
  return bad;
}
"""

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
# its targets are on the picture), card bottom on the 900-high stage, and no clipping: the card and each option or
# blank does not scroll or overflow its own box.
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
  const over = [...c.querySelectorAll('.card, .prompt, .opt, .grid, .row, .fb')].filter(e => e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2)
    .map(e => e.className || e.tagName);
  return { promptW: pr.width / k, lines, ok: ctl.every(inside), bottom: (cr.bottom - st.top) / k, over };
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

        # every quiz card (quick checks and every practice question) at the two larger sizes: first question of each beat
        for vw, vh in [(1280, 800), (1920, 1080)]:
            await pg.set_viewport_size({"width": vw, "height": vh})
            for i, bid in enumerate(ids):
                if not asks[i] or bid == "finish": continue
                await ev(f"seek({i}, true)"); await pg.wait_for_timeout(700)
                m = await ev(CARD)
                if not (m["promptW"] > 400 and m["lines"] <= 4 and m["ok"] and m["bottom"] <= 901 and not m["over"]): found.append(f"quiz card {bid} at {vw}x{vh}: {m}")
        await pg.set_viewport_size({"width": 1440, "height": 900})

        # answers: every quick check and every practice question, each measured at 1440x900 before it is answered
        for bid, steps in ANSWERS.items():
            await ev(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
            for qn, s in enumerate(steps):
                m = await ev(CARD); print(bid, qn, m)
                if not (m["promptW"] > 400 and m["lines"] <= 4 and m["ok"] and m["bottom"] <= 901 and not m["over"]): found.append(f"{bid} question {qn + 1} at 1440x900 clips or overflows: {m}")
                await pg.screenshot(path=SHOTS + "q_%s_%d.png" % (bid, qn))
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
                assert "Correct" in await pg.inner_text(".card .fb"), (bid, qn, s)
                await key("Enter"); await pg.wait_for_timeout(250)
        assert await ev("BEATS[P.i].id") == "finish" and await pg.is_visible(".card.fin"), "practice leads to the finish card"
        n = await ev("CHAPTER.number")
        label = await ev("CHAPTER.label")   # '9, lesson 4'
        fin = (await pg.inner_text(".card.fin")).lower()
        if f"chapter {label} complete" not in fin.lower(): found.append(f"finish card text lacks 'chapter {label} complete': {fin[:200]!r}")
        done = await ev("JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY))")
        if n not in done["done"]: found.append(f"chapter {n} not marked done in progress: {done}")

        # all wrong: every card again, answered wrong, after Check and after Show answer
        for bid, steps in WRONG.items():
            await ev(f"seek({ids.index(bid)}, true)"); await pg.wait_for_timeout(500)
            for qn, s in enumerate(steps):
                if s.startswith("="):
                    for j, v in enumerate(s[1:].split(",")): await pg.locator(".card input.box").nth(j).fill(v)
                    await key("Enter")
                elif s.startswith("#"):
                    rows = pg.locator(".card.quiz .grid .row")
                    for r, cols in enumerate(s[1:].split(";")):
                        for c in filter(None, cols.split("+")): await rows.nth(r).locator(".opt").nth(int(c) - 1).click()
                    await key("Enter")
                else: await key(s)
                await pg.wait_for_timeout(400)
                if "Correct" in await pg.inner_text(".card .fb"): found.append(f"{bid} question {qn + 1}: the wrong answer {s} was graded right")
                for state in ("wrong", "shown"):
                    if state == "shown": await pg.locator(".card .btn.quiet").click(); await pg.wait_for_timeout(400)
                    bad = await ev(WRONG_CARD)
                    if bad: found.append(f"{bid} question {qn + 1} all wrong ({state}) at 1440x900: {bad}")
                    await pg.screenshot(path=SHOTS + "wrong_%s_%d_%s.png" % (bid, qn, state))
                if qn < len(steps) - 1: await pg.locator(".card .btn.go").click(); await pg.wait_for_timeout(300)
        print("all-wrong pass: every quick check and practice card measured after Check and after Show answer")

        for i in range(len(ids)): await ev(f"seek({i}, false)")   # every beat rebuilds without errors
        assert not errs, errs
        print("findings:", *found, sep="\n  ") if found else print("findings: none")
        print(f"{URL} ({len(ids)} beats, {'firefox' if ff else 'chromium'}): playback, replay, quiz layout, answers, finish - ran")
        await b.close()

asyncio.run(main())
