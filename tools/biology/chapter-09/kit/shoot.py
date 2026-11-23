"""Kit sheet for site/biology/lib/resp.js: screenshots of every panel and the replay check.

uv run --with playwright python tools/biology/chapter-09/kit/shoot.py OUTDIR [--only PANEL] [--no-shots]

Serves the repo root on port 8790 (its own server), opens tools/biology/chapter-09/kit/sheet.html in Chromium, saves
one PNG per panel to OUTDIR, prints console errors, then runs window.replayCheck() (each piece posed at t1 then t2,
fresh at t2, and stepped 0 → t2 at 1/60 s must give the same markup).
"""
import asyncio, functools, http.server, os, sys, threading
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
PORT = 8790


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    out = args[0] if args and not args[0].startswith('--') else '.'
    only = args[args.index('--only') + 1] if '--only' in args else None
    os.makedirs(out, exist_ok=True)
    srv = serve()
    async with async_playwright() as pw:
        br = await pw.chromium.launch()
        pg = await br.new_page(viewport={'width': 1600, 'height': 900})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        url = f'http://127.0.0.1:{PORT}/tools/biology/chapter-09/kit/sheet.html' + (f'?only={only}' if only else '')
        await pg.goto(url)
        await pg.wait_for_timeout(600)
        print('title:', await pg.title())
        for e in errs:
            print('console:', e)
        if '--no-shots' not in args:
            ids = await pg.eval_on_selector_all('.panel', 'els => els.map(e => e.id)')
            for i in ids:
                await pg.locator('#' + i).screenshot(path=os.path.join(out, i + '.png'))
            print(len(ids), 'panels saved to', out)
        if not only:
            bad = await pg.evaluate('replayCheck()')
            print('replay check:', 'all identical' if not bad else f'{len(bad)} differences')
            for b in bad:
                print(' -', b[:700])
        await br.close()
    srv.shutdown()


asyncio.run(main())
